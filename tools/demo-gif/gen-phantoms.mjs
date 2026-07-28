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

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// --- Minimal 8-bit greyscale PNG writer -------------------------------------
// Hand-rolled rather than pulled from `pngjs` so this repo keeps zero npm
// dependencies: it is Rudan's, our footprint should stay additive, and a greyscale
// PNG is a short job — signature, IHDR, one deflated IDAT, IEND.

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** `grey` is one byte per pixel, row-major, length w*h. */
function greyPng(grey, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // colour type 0 = greyscale
  // 10..12 = compression, filter and interlace methods; 0 is the only valid value.

  // Each scanline is prefixed with its filter type. 0 (None) keeps this simple; the
  // images are smooth noise, where predictive filters buy little.
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0;
    Buffer.from(grey.buffer, grey.byteOffset + y * w, w).copy(raw, y * (w + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

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
  const grey = new Uint8Array(W * H); // one byte per pixel

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
      const idx = y * W + x;
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
      grey[idx] = g;
    }
  }

  // Named like an anonymized study series rather than "phantom-0", so the file list in
  // the app's filmstrip reads plausibly.
  const name = `synthetic-${String(n + 1).padStart(3, '0')}-${['RCC', 'RMLO', 'LCC', 'LMLO', 'RMLO'][n % 5]}.png`;
  const path = join(outDir, name);
  writeFileSync(path, greyPng(grey, W, H));
  written.push(path);
}

console.log(written.join('\n'));
