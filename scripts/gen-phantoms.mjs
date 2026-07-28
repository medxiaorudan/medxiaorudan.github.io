// gen-phantoms.mjs — synthetic mammography-like images for the MammoScreen demo.
//
// Why generate rather than use the repo's DICOM fixtures: those are 80x48 correctness
// fixtures (gradient bars, transfer-syntax probes). They prove the decoder works; on
// screen they read as a broken image, which is the opposite of what a showcase needs.
//
// Why generate rather than use real mammograms: MammoScreen's own footer says to use
// anonymized or synthetic images only, and a demo of a medical tool should not ship
// patient data or inherit someone's dataset licence. These are procedural phantoms —
// obviously not real, but shaped enough that the viewer reads "mammogram" and looks at
// the app instead of the picture.
//
// Deterministic: seeded RNG, so re-running produces byte-identical files and the demo
// GIF does not churn.
//
// Usage: node gen-phantoms.mjs <out-dir> [count]

import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.argv[2] || 'phantoms';
const count = Number(process.argv[3] || 5);
const W = 760;
const H = 1000;

// mulberry32 — small seeded PRNG. Math.random would make output non-reproducible.
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value noise with bilinear interpolation, summed over octaves. Real fibroglandular
// tissue is structured at several scales at once; a single frequency looks like static.
function noiseField(rand, w, h, cell) {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const at = (gx, gy) => g[Math.min(gh - 1, gy) * gw + Math.min(gw - 1, gx)];
    const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return a * (1 - ty) + b * ty;
  };
}

mkdirSync(outDir, { recursive: true });
const written = [];

for (let n = 0; n < count; n++) {
  const rand = rng(1337 + n * 7919);
  // colorType 0 makes the *encoded* file 8-bit greyscale, but pngjs always keeps
  // `data` as RGBA in memory and converts on write — so fill 4 bytes per pixel.
  const png = new PNG({ width: W, height: H, colorType: 0 });

  // Octaves of texture, coarse to fine.
  const oct = [
    [noiseField(rand, W, H, 150), 0.42],
    [noiseField(rand, W, H, 70), 0.28],
    [noiseField(rand, W, H, 30), 0.18],
    [noiseField(rand, W, H, 12), 0.12],
  ];

  // The breast outline: anchored at the chest wall (left edge) and bounded by a skin
  // line. Vary the shape per image so the five frames don't look like one file copied.
  const cy = H * (0.5 + (rand() - 0.5) * 0.06);
  const reach = W * (0.72 + rand() * 0.16); // how far it extends from the chest wall
  const halfH = H * (0.36 + rand() * 0.06);
  const nipplePull = 0.55 + rand() * 0.3;

  // One image gets a bright focal density, so labelling in the demo has something to
  // actually look at. Kept plainly synthetic — a smooth blob, not a fake lesion.
  const lesion = n === 1 ? { x: reach * 0.42, y: cy - halfH * 0.22, r: 26, gain: 78 } : null;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const dy = (y - cy) / halfH;

      // Skin line: how far out the tissue reaches at this height. Tapers toward the
      // top and bottom, and pulls forward around the middle.
      const vert = 1 - dy * dy;
      let value = 0;
      if (vert > 0) {
        const edge = reach * Math.pow(vert, nipplePull);
        const t = x / edge; // 0 at chest wall, 1 at the skin line
        if (t <= 1) {
          // Base density: denser at the chest wall, falling off toward the skin.
          const falloff = Math.pow(1 - t, 0.85);
          let v = 42 + 150 * falloff;

          // Texture, strongest mid-breast where fibroglandular tissue actually sits.
          let tex = 0;
          for (const [f, amp] of oct) tex += f(x, y) * amp;
          v += (tex - 0.5) * 120 * (0.35 + 0.65 * falloff);

          // Soft skin-line rim, then a hard cut at the boundary.
          const rim = Math.min(1, (1 - t) / 0.05);
          v *= rim;

          if (lesion) {
            const lx = x - lesion.x;
            const ly = y - lesion.y;
            const d = Math.hypot(lx, ly) / lesion.r;
            if (d < 1.6) v += lesion.gain * Math.exp(-d * d * 1.6);
          }

          value = v;
        }
      }

      // Detector noise everywhere, including the background, so the black is not a
      // flat synthetic zero.
      value += (rand() - 0.5) * 7 + 4;
      const g = Math.max(0, Math.min(255, Math.round(value)));
      png.data[idx] = g;
      png.data[idx + 1] = g;
      png.data[idx + 2] = g;
      png.data[idx + 3] = 255;
    }
  }

  // Named like an anonymized study series rather than "phantom-0", so the file list in
  // the app's filmstrip reads plausibly.
  const name = `synthetic-${String(n + 1).padStart(3, '0')}-${['RCC', 'RMLO', 'LCC', 'LMLO', 'RMLO'][n % 5]}.png`;
  const path = join(outDir, name);
  writeFileSync(path, PNG.sync.write(png));
  written.push(path);
}

console.log(written.join('\n'));
