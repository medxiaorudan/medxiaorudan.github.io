#!/usr/bin/env node
//
// verify-gif.mjs — play a produced GIF in a real browser and sample it over time into a
// single contact sheet, so a demo GIF can be reviewed as an animation.
//
// Screenshotting an <img> is the only honest check available here: it exercises the
// browser's own GIF decoder, frame delays and frame disposal — which is exactly the code
// a visitor runs, and exactly where the inter-frame differencing in capture-demo-gif.mjs
// would show up as ghosting or smearing if it were wrong. Inspecting the frames before
// they are encoded proves nothing about any of that.
//
//   Usage: node scripts/verify-gif.mjs <path-to.gif> [samples] [spacingMs]
//
// Output goes to .demo-assets/verify/ (gitignored — it is a throwaway diagnostic).
// Pick `spacingMs` so samples*spacing spans a little more than the GIF's loop length,
// or the sheet will only ever show the opening of the animation.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

const gifPath = process.argv[2];
const samples = Number(process.argv[3] || 6);
const spacingMs = Number(process.argv[4] || 1300);

if (!gifPath) {
  console.error('usage: node scripts/verify-gif.mjs <path-to.gif> [samples] [spacingMs]');
  process.exit(1);
}

const OUT_DIR = '.demo-assets/verify';
const b64 = readFileSync(gifPath).toString('base64');

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 980, height: 560 } })).newPage();
await page.setContent(
  `<body style="margin:0;background:#111"><img id="g" style="display:block;width:960px"
     src="data:image/gif;base64,${b64}"></body>`
);
await page.locator('#g').waitFor();

const shots = [];
for (let i = 0; i < samples; i++) {
  await page.waitForTimeout(i === 0 ? 150 : spacingMs);
  shots.push((await page.locator('#g').screenshot({ type: 'png' })).toString('base64'));
}

// Stack the samples into one page and screenshot that, so the whole sequence can be
// reviewed as a single image instead of N files opened side by side.
await page.setViewportSize({ width: 500, height: Math.min(30000, 140 * samples + 20) });
await page.setContent(
  `<body style="margin:0;background:#111;font:11px monospace;color:#8f8">` +
    shots
      .map(
        (s, i) =>
          `<div style="position:relative"><img style="display:block;width:480px" src="data:image/png;base64,${s}">` +
          `<span style="position:absolute;left:4px;top:4px;background:#000c;padding:1px 4px">` +
          `t≈${((i * spacingMs) / 1000).toFixed(1)}s</span></div>`
      )
      .join('') +
    `</body>`
);

mkdirSync(OUT_DIR, { recursive: true });
const out = `${OUT_DIR}/${basename(gifPath).replace(/\.gif$/, '')}-sheet.png`;
writeFileSync(out, await page.screenshot({ fullPage: true }));
console.log(`sheet: ${out}`);
await browser.close();
