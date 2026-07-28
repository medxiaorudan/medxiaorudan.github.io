#!/usr/bin/env node
//
// capture-demo-gif.mjs — drive a scripted flow through a live website and encode it as
// an animated GIF, for showing an app working instead of a still screenshot of it.
//
// This file is the engine and knows nothing about any particular site. The flows live in
// a separate module passed with --flows, so the same engine serves any site.
// (Intended to move to web-platform/scripts/ and be shared across the personal sites —
// see the TODO there. Keep it site-agnostic so that move stays a copy.)
//
//   Usage: node scripts/capture-demo-gif.mjs --flows <file.mjs> [slug ...]
//
//   --flows <file>   module exporting `FLOWS` (required)
//   --out <dir>      where GIFs are written (default img/projects)
//   --width <px>     output width (default 960)
//   --colors <n>     palette size, 2-255 (default 255)
//   --no-diff        disable inter-frame differencing (debugging only; ~4x larger)
//   --headed         show the browser, for developing a flow
//
// WHAT IS REAL AND WHAT IS AUTHORED. A demo GIF on a portfolio is a claim about a
// product, so be clear about which is which:
//
//   Real — a real Chromium against the real URL, with NO network interception anywhere
//   (no route(), no fulfill()), so nothing is mocked or stubbed. Clicks are real mouse
//   events at real element coordinates, keypresses are real, and every pixel is a
//   screenshot of the live app rendering its own data.
//
//   Authored — (1) the pointer is drawn by this tool, because headless Chromium renders
//   no cursor: the position mirrors the real mouse, but the dot and the click ripple do
//   not exist on the real site. (2) Pacing is chosen, not elapsed — each frame's delay is
//   a number the flow picks, and awaitResult() deliberately compresses slow waits.
//   (3) Mouse travel is an eased interpolation, not a human path. (4) chooseFiles answers
//   the native file dialog programmatically, so the OS picker a real user would see never
//   appears. (5) `viewport` is a chosen window size.
//
// What the app *says and does* is never synthesised. Anything else a specific flow does
// that a viewer could misread — synthetic input files, a query picked to suit ingested
// data — belongs in a comment on that flow. See demo-flows.mjs for the two current cases.
//
// Three things about this design are deliberate:
//
// 1. Frames carry their own delay, rather than a constant frame rate. A UI demo is
//    mostly stillness, and GIF pays per frame — so motion gets short frames and
//    "read this" moments get one frame held for a second. A 10s demo costs ~50
//    frames instead of ~300.
//
// 2. Unchanged pixels are written as transparent with "leave in place" disposal. In a
//    UI demo nearly every pixel matches the previous frame, and those regions collapse
//    to long single-index runs that LZW compresses to almost nothing. Measured on the
//    ERA flow: 2062 KB -> 287 KB, same pixels.
//
// 3. A fake cursor is injected into the page. Headless Chromium draws no pointer, so a
//    scripted click is invisible — content just changes and the viewer cannot tell why.
//    The fake cursor moves in step with the real mouse, so hover states still fire.
//
// Verify output with scripts/verify-gif.mjs, which plays the GIF in a real browser
// rather than trusting the encoder.

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
// gifenc ships CommonJS, so its exports are not reachable as ESM named imports.
import gifenc from 'gifenc';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { GIFEncoder, quantize, applyPalette } = gifenc;

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const bool = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return false;
  argv.splice(i, 1);
  return true;
};

const flowsPath = flag('flows');
const OUT_DIR = flag('out', 'img/projects');
const OUT_WIDTH = Number(flag('width', 960));
const GIF_COLORS = Number(flag('colors', 255));
const HEADED = bool('headed');
const NO_DIFF = bool('no-diff');
const wanted = argv.filter((a) => !a.startsWith('--'));

if (!flowsPath) {
  console.error('error: --flows <file.mjs> is required');
  console.error('usage: node scripts/capture-demo-gif.mjs --flows <file.mjs> [slug ...]');
  process.exit(1);
}

const { FLOWS } = await import(pathToFileURL(resolve(flowsPath)).href);
if (!Array.isArray(FLOWS)) {
  console.error(`error: ${flowsPath} does not export a FLOWS array`);
  process.exit(1);
}

// 16:9 by default. The cards this feeds crop to 16/9, so recording at that ratio
// means nothing important is lost to the crop.
//
// A flow may override this with `viewport`, and sometimes must: an app whose layout is a
// centred max-width column leaves most of a 1280px frame empty, which reads as a mostly
// blank card. Recording such an app at a width close to its own content width is not
// cheating — it is choosing a window size, the same decision a screenshot makes. Keep
// overrides at 16:9 or the card will crop the result.
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

// ---------------------------------------------------------------------------
// Fake cursor
// ---------------------------------------------------------------------------

const CURSOR_CSS = `
#__demo_cursor {
  position: fixed; left: 0; top: 0; width: 22px; height: 22px;
  margin: -11px 0 0 -11px; border-radius: 50%;
  background: rgba(255,255,255,.92);
  box-shadow: 0 0 0 2px rgba(0,0,0,.5), 0 2px 10px rgba(0,0,0,.4);
  z-index: 2147483647; pointer-events: none;
  transform: translate3d(-100px,-100px,0);
  opacity: 0; /* revealed by the first moveTo, so it glides in rather than appearing */
}
#__demo_ripple {
  position: fixed; left: 0; top: 0; width: 22px; height: 22px;
  margin: -11px 0 0 -11px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.95);
  z-index: 2147483646; pointer-events: none; opacity: 0;
  transform: translate3d(-100px,-100px,0) scale(1);
}`;

async function installCursor(page) {
  await page.addStyleTag({ content: CURSOR_CSS });
  await page.evaluate(() => {
    for (const id of ['__demo_cursor', '__demo_ripple']) {
      if (document.getElementById(id)) continue;
      const el = document.createElement('div');
      el.id = id;
      document.documentElement.append(el);
    }
  });
}

const moveCursor = (page, x, y, opacity = 1) =>
  page.evaluate(
    ([x, y, o]) => {
      const c = document.getElementById('__demo_cursor');
      if (!c) return;
      c.style.transform = `translate3d(${x}px,${y}px,0)`;
      c.style.opacity = String(o);
    },
    [x, y, opacity]
  );

const showRipple = (page, x, y, scale, opacity) =>
  page.evaluate(
    ([x, y, s, o]) => {
      const r = document.getElementById('__demo_ripple');
      if (!r) return;
      r.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
      r.style.opacity = String(o);
    },
    [x, y, scale, opacity]
  );

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

class Recorder {
  constructor(page) {
    this.page = page;
    this.frames = [];
  }

  /** Capture one frame, held for `delay` ms. */
  async shoot(delay = 80) {
    const buf = await this.page.screenshot({ type: 'png', animations: 'allow' });
    const png = PNG.sync.read(buf);
    this.frames.push({ ...downscale(png.data, png.width, png.height, OUT_WIDTH), delay });
  }

  async shootBurst(count, delay) {
    for (let i = 0; i < count; i++) await this.shoot(delay);
  }
}

// Area-average downscale. Nearest-neighbour aliases UI text badly; averaging the
// source box is what keeps small type readable once it has been quantised.
function downscale(src, sw, sh, targetW) {
  if (targetW >= sw) return { rgba: src, width: sw, height: sh };
  const dw = targetW;
  const dh = Math.round(sh * (targetW / sw));
  const dst = new Uint8Array(dw * dh * 4);
  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let dy = 0; dy < dh; dy++) {
    const y0 = Math.floor(dy * yRatio);
    const y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((dy + 1) * yRatio)));
    for (let dx = 0; dx < dw; dx++) {
      const x0 = Math.floor(dx * xRatio);
      const x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((dx + 1) * xRatio)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        let p = (y * sw + x0) * 4;
        for (let x = x0; x < x1; x++, p += 4) {
          r += src[p]; g += src[p + 1]; b += src[p + 2]; n++;
        }
      }
      const q = (dy * dw + dx) * 4;
      dst[q] = r / n; dst[q + 1] = g / n; dst[q + 2] = b / n; dst[q + 3] = 255;
    }
  }
  return { rgba: dst, width: dw, height: dh };
}

// One global palette for the whole animation. Per-frame local colour tables track each
// frame more closely but cost up to 768 bytes each and make the palette shimmer between
// frames — on flat UI colour that is far more visible than the error it saves.
function encodeGif(frames, { colors = 255, diff = true } = {}) {
  const gif = GIFEncoder();
  const palette = quantize(pickPaletteSample(frames), Math.max(2, Math.min(255, colors)), {
    format: 'rgb565',
  });
  // One index is reserved to mean "unchanged", so it must not be a real colour.
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);

  let prev = null;
  frames.forEach((f, i) => {
    const index = applyPalette(f.rgba, palette, 'rgb565');
    // Keep the pre-diff frame as the next comparison basis. Diffing against an
    // already-diffed frame would compare real colour against the transparent index
    // and stop matching after the first frame.
    const basis = diff ? Uint8Array.prototype.slice.call(index) : null;
    if (diff && prev) {
      for (let p = 0; p < index.length; p++) {
        if (index[p] === prev[p]) index[p] = transparentIndex;
      }
    }
    prev = basis;

    gif.writeFrame(index, f.width, f.height, {
      palette: i === 0 ? palette : undefined,
      delay: f.delay,
      // dispose 1 = leave in place, so transparent pixels keep showing what was
      // already painted. Any other disposal mode breaks the differencing.
      dispose: 1,
      transparent: diff && i > 0,
      transparentIndex,
    });
  });
  gif.finish();
  return gif.bytes();
}

// Quantising every pixel of every frame is slow and biases the palette toward whatever
// the animation dwells on longest. Sample evenly across frames instead.
function pickPaletteSample(frames, maxPixels = 900_000) {
  const total = frames.reduce((n, f) => n + f.width * f.height, 0);
  const stride = Math.max(1, Math.ceil(total / maxPixels));
  const out = new Uint8Array(Math.ceil(total / stride) * 4);
  let o = 0;
  for (const f of frames) {
    for (let p = 0; p < f.width * f.height; p += stride) {
      const s = p * 4;
      out[o++] = f.rgba[s]; out[o++] = f.rgba[s + 1]; out[o++] = f.rgba[s + 2]; out[o++] = 255;
    }
  }
  return out.subarray(0, o);
}

// ---------------------------------------------------------------------------
// The vocabulary a flow gets to use
// ---------------------------------------------------------------------------

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

function makeActions(page, rec, viewport) {
  let cx = viewport.width / 2;
  let cy = viewport.height - 40;
  // Starts hidden: the pointer should glide in when it is first needed, not sit
  // parked somewhere arbitrary while the opening frames are held.
  let cursorHidden = true;

  const centreOf = async (target) => {
    const el = typeof target === 'string' ? page.locator(target).first() : target;
    await el.waitFor({ state: 'visible', timeout: 20000 });
    await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox();
    if (!box) throw new Error(`element has no box: ${target}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  const actions = {
    page,
    rec,

    /** Hold the current view. One frame, long delay — standing still is free. */
    hold: (ms) => rec.shoot(ms),

    /**
     * Hide the pointer. Needed before keyboard-driven steps: the fake cursor has no
     * reason to be anywhere in particular, and left parked over content it reads as a
     * stray dot on the screenshot rather than as a pointer.
     */
    hideCursor: async () => {
      cursorHidden = true;
      await moveCursor(page, cx, cy, 0);
      await showRipple(page, cx, cy, 1, 0); // the ripple is part of the pointer
    },

    /** Glide the pointer to an element so the eye arrives before the click. */
    moveTo: async (target, { frames = 6, delay = 45 } = {}) => {
      const { x, y } = await centreOf(target);
      // While hidden the pointer has no meaningful position, so bring it in from the
      // nearest edge instead of teleporting it or fading it in on the spot.
      if (cursorHidden) {
        const fromLeft = x < viewport.width / 2;
        cx = fromLeft ? -40 : viewport.width + 40;
        cy = y + (viewport.height / 2 - y) * 0.35;
        cursorHidden = false;
      }
      const [sx, sy] = [cx, cy];
      for (let i = 1; i <= frames; i++) {
        const t = easeInOut(i / frames);
        const nx = sx + (x - sx) * t;
        const ny = sy + (y - sy) * t;
        await page.mouse.move(nx, ny); // real move, so hover styles fire
        await moveCursor(page, nx, ny);
        await rec.shoot(delay);
      }
      cx = x;
      cy = y;
    },

    /**
     * Click where the pointer already is, capturing the press and the transition
     * that follows. `until` is a selector to wait for before the held frame, so a
     * view that fades in is not captured half-painted.
     */
    click: async ({ settle = 4, settleDelay = 70, after = 1200, until = null } = {}) => {
      await showRipple(page, cx, cy, 1, 0.9);
      await rec.shoot(50);
      await page.mouse.down();
      await showRipple(page, cx, cy, 1.9, 0.35);
      await rec.shoot(60);
      await page.mouse.up();
      await showRipple(page, cx, cy, 2.6, 0);
      await rec.shootBurst(settle, settleDelay);
      if (until) await page.locator(until).first().waitFor({ state: 'visible', timeout: 20000 });
      // Let whatever just appeared finish animating before the frame that is held.
      await page.waitForTimeout(350);
      await rec.shoot(after);
    },

    /** moveTo + click, the common case. */
    tap: async (target, { move, ...click } = {}) => {
      await actions.moveTo(target, move);
      await actions.click(click);
    },

    /** Hover an element without clicking — for pointing at something. */
    pointAt: async (target, { move, hold = 1200 } = {}) => {
      await actions.moveTo(target, move);
      await rec.shoot(hold);
    },

    press: async (key, { repeat = 1, delay = 260, settle = 1 } = {}) => {
      for (let i = 0; i < repeat; i++) {
        await page.keyboard.press(key);
        await rec.shootBurst(settle, 70);
        await rec.shoot(delay);
      }
    },

    /**
     * Type into a field. One frame per few characters — per-character frames triple
     * the file for motion the eye reads as continuous either way.
     */
    type: async (target, text, { delay = 60, chunk = 3 } = {}) => {
      const el = page.locator(target).first();
      await el.click();
      for (let i = 0; i < text.length; i += chunk) {
        await el.type(text.slice(i, i + chunk), { delay: 0 });
        await rec.shoot(delay);
      }
    },

    /**
     * Type a credential read from the environment, so a flow file can script a login
     * without ever containing the secret. Exists to make the safe path the easy one:
     * a flow that needs a password has no reason to reach for a literal.
     *
     * Two properties worth stating, because a recorded login is a real disclosure risk:
     * only ever point this at an `<input type="password">`, so what is captured is the
     * app's own masking rather than the characters; and the value is never logged, never
     * put in a label, and never included in a thrown error.
     */
    typeSecret: async (target, envVar, { delay = 70, chunk = 8 } = {}) => {
      const secret = process.env[envVar];
      if (!secret) throw new Error(`${envVar} is not set in the environment`);

      const el = page.locator(target).first();
      const type = await el.getAttribute('type');
      if (type !== 'password') {
        throw new Error(
          `refusing to type ${envVar} into a field of type "${type}" — ` +
            `only type=password masks it in the recording`
        );
      }
      await el.click();
      // Coarse chunks: the frames show dots, so finer granularity buys no realism and
      // would leak the length more precisely than necessary.
      for (let i = 0; i < secret.length; i += chunk) {
        await el.type(secret.slice(i, i + chunk), { delay: 0 });
        await rec.shoot(delay);
      }
    },

    /**
     * Go to another URL mid-flow. This is a cut, not a click — use it where a demo
     * legitimately changes scene (an admin finishing a task, then a visitor arriving)
     * and say so in the flow, because the viewer sees no cause for the change.
     */
    navigate: async (url, { until = null, after = 1100 } = {}) => {
      await actions.hideCursor();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      if (until) await page.locator(until).first().waitFor({ state: 'visible', timeout: 20000 });
      await installCursor(page); // a navigation discards the injected overlay
      await page.waitForTimeout(300);
      await rec.shoot(after);
    },

    /** Eased scroll. Frames are the cost here, so keep it short. */
    scrollBy: async (dy, { frames = 9, delay = 45 } = {}) => {
      let prev = 0;
      for (let i = 1; i <= frames; i++) {
        const now = dy * easeInOut(i / frames);
        await page.mouse.wheel(0, now - prev);
        prev = now;
        await rec.shoot(delay);
      }
    },

    /**
     * Click a control that opens a file picker and answer it with `files`. Recording
     * the click matters: a bare setInputFiles makes content appear with no visible
     * cause, which is exactly the confusion the fake cursor exists to prevent.
     */
    chooseFiles: async (target, files, { move, until = null, after = 1400 } = {}) => {
      await actions.moveTo(target, move);
      const chooser = page.waitForEvent('filechooser');
      await showRipple(page, cx, cy, 1, 0.9);
      await rec.shoot(50);
      await page.mouse.down();
      await rec.shoot(60);
      await page.mouse.up();
      await (await chooser).setFiles(files);
      // The control that was just clicked is typically replaced by whatever the files
      // produced, so the pointer has nothing left to point at. Retire it before the
      // held frame, or it lingers on top of the new content as an unexplained dot.
      await showRipple(page, cx, cy, 2.6, 0);
      await actions.hideCursor(); // before the burst, so no frame shows it stranded
      await rec.shootBurst(4, 90);
      if (until) await page.locator(until).first().waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(400);
      await rec.shoot(after);
    },

    /**
     * Wait for something slow while showing only a short pause. A demo cannot spend
     * 17 real seconds on a spinner; this captures the waiting state briefly, then
     * holds the real result. The result is genuine — only the wait is shortened.
     */
    awaitResult: async (until, { spinnerFrames = 4, spinnerDelay = 200, timeout = 90000, after = 2200 } = {}) => {
      await rec.shootBurst(spinnerFrames, spinnerDelay);
      const target = page.locator(until).first();
      await target.waitFor({ state: 'visible', timeout });
      // "Visible" in Playwright's sense only means rendered and non-empty — it can still
      // be below the fold, which on a long form is exactly where a confirmation message
      // lands. Waiting for a result the frame does not show is worse than not waiting.
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(450);
      await rec.shoot(after);
    },

    wait: (ms) => page.waitForTimeout(ms),
    waitFor: (sel, opts) =>
      page.locator(sel).first().waitFor({ state: 'visible', timeout: 20000, ...opts }),
  };

  return actions;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const flows = FLOWS.filter((f) => !wanted.length || wanted.includes(f.slug));
if (!flows.length) {
  console.error(`no flow matched. known slugs: ${FLOWS.map((f) => f.slug).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: !HEADED });
let failed = 0;

for (const flow of flows) {
  const t0 = process.hrtime.bigint();
  const viewport = flow.viewport || DEFAULT_VIEWPORT;
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: flow.colorScheme || 'dark',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0].slice(0, 140)));

  try {
    await page.goto(flow.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(flow.settle ?? 1800);
    await installCursor(page);

    const rec = new Recorder(page);
    await flow.run(makeActions(page, rec, viewport));

    const bytes = encodeGif(rec.frames, { colors: GIF_COLORS, diff: !NO_DIFF });
    const path = `${OUT_DIR}/${flow.slug}.gif`;
    writeFileSync(path, bytes);

    const { width, height } = rec.frames[0];
    const loopMs = rec.frames.reduce((n, f) => n + f.delay, 0);
    console.log(
      `✓ ${path}  ${width}x${height}  ${rec.frames.length} frames  ` +
        `${(loopMs / 1000).toFixed(1)}s loop  ${(bytes.length / 1024).toFixed(0)} KB  ` +
        `(${(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(0)}s)`
    );
  } catch (e) {
    failed++;
    console.error(`✗ ${flow.slug}: ${e.message.split('\n')[0]}`);
    // A failure screenshot is the only way to see what the flow was actually
    // looking at when a selector missed.
    await page.screenshot({ path: `${OUT_DIR}/${flow.slug}-FAILED.png` }).catch(() => {});
  }

  if (errors.length) console.log(`  page errors: ${errors.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
