// demo-flows.mjs — the recorded demo for each live app on this site.
//
// Consumed by scripts/capture-demo-gif.mjs, which owns all the recording machinery.
// This file holds only site knowledge: which URL, which selectors, which steps.
//
// A flow should be the shortest honest tour of the app: land, visit the two or three
// screens that carry the idea, end where it started so the loop has no visible seam.
// Resist adding steps — each click is ~12 frames and GIF charges per frame.
//
// `slug` must match the project id in projects.data.js: that is what makes the output
// land at img/projects/<slug>.gif, which is the path the `motion` field points at.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

// Synthetic mammography images, built by scripts/gen-phantoms.mjs. They are generated
// rather than committed because they are 5 MB of derivable pixels, and generated rather
// than real because MammoScreen's own footer says to use synthetic images only.
const phantom = (n) =>
  resolve(HERE, `../.demo-assets/phantoms/synthetic-${String(n).padStart(3, '0')}-${
    ['RCC', 'RMLO', 'LCC', 'LMLO', 'RMLO'][(n - 1) % 5]
  }.png`);

export const FLOWS = [
  {
    // Sidebar navigation across the incident-command views. Nothing is typed and no
    // backend state changes, so this flow is fully deterministic.
    slug: 'enterprise-resilience-agent',
    url: 'https://era-api.rudanxiao.com/',
    colorScheme: 'light',
    run: async (a) => {
      const nav = (name) => `nav.nav-list >> a.nav-link:text-is("${name}")`;

      await a.hold(1200); // land on Overview

      // Each section fades its cards in, so wait on content that only exists in that
      // section before holding — otherwise the held frame is a bare heading.
      const sections = [
        ['Incidents', 'text=Correlated incidents and safe actions'],
        ['Approvals', 'text=Human-controlled remediation queue'],
        ['Runbooks', 'text=Registered deterministic recovery procedures'],
      ];
      for (const [name, marker] of sections) {
        await a.tap(nav(name), { move: { frames: 5 }, until: marker, after: 1500 });
      }

      // Back to the opening screen, so the loop closes cleanly.
      await a.tap(nav('Overview'), {
        move: { frames: 5 },
        until: 'text=Business-first incident command view',
        after: 1000,
      });
    },
  },

  {
    // Load images, then label them with the keyboard. The story is that this is a real
    // review tool and the files never leave the device, so the file choice is recorded
    // rather than injected invisibly.
    slug: 'mammoscreen',
    url: 'https://mammoscreen.rudanxiao.com/',
    colorScheme: 'dark',
    run: async (a) => {
      await a.hold(1200); // the drop zone, which states the privacy claim

      await a.chooseFiles(
        'button:has-text("Choose images")',
        [phantom(1), phantom(2), phantom(3), phantom(4), phantom(5)],
        { move: { frames: 6 }, until: 'text=/1 \\/ 5/', after: 1500 }
      );

      // From here it is keyboard only. chooseFiles has already retired the pointer,
      // which matters on this screen — parked over the mammogram it would read as a
      // speck on the image rather than as a cursor.
      //
      // Label with the number keys and step with the arrows — the shortcuts the app
      // advertises in its own footer. Labelling three of five shows the counter move
      // without padding the loop out to five near-identical steps.
      await a.press('1', { delay: 900 });          // Positive
      await a.press('ArrowRight', { delay: 800 });
      await a.press('2', { delay: 900 });          // Negative
      await a.press('ArrowRight', { delay: 800 });
      await a.press('3', { delay: 1000 });         // Uncertain

      // End on the export, which is the point of labelling. Hovered, not clicked: a
      // click starts a file download, which adds nothing on screen.
      await a.pointAt('button:has-text("Download labels (CSV)")', {
        move: { frames: 6 },
        hold: 1800,
      });
    },
  },
];
