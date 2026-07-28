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
    // Role picker → company → ask a question → real answer. The whole point of the app
    // is the answer, so this flow has to include one.
    //
    // Two honest caveats, because this is the only flow where the app is slow and the
    // only one whose output depends on ingested data:
    //
    // 1. The reply really takes 7-9s. `awaitResult` shows a short waiting beat and then
    //    the genuine answer, so GIF time is not real time here. The answer is not
    //    touched — only the wait is shortened.
    // 2. The question is chosen to suit what is actually ingested for the `demo`
    //    company, which today is RFC 2606 (reserved TLDs). Asked something outside that
    //    corpus, the app answers vaguely — see the note in CLAUDE.md. This is a demo
    //    query matched to demo data, not a doctored result.
    slug: 'smart-customer-service',
    url: 'https://smart-customer-service.rudanxiao.com/',
    colorScheme: 'light',
    // The chat is a centred `max-w-4xl` (896px) column, so at the default 1280 width the
    // frame is mostly empty white and the card reads as blank. Recorded just wider than
    // the app's own content instead. Still 16:9, because the card crops to that.
    viewport: { width: 1024, height: 576 },
    run: async (a) => {
      await a.hold(1100); // the role picker

      await a.tap('text="User"', { move: { frames: 6 }, until: 'text=Select Company', after: 1200 });
      await a.tap('text="demo"', { move: { frames: 5 }, until: 'textarea', after: 1200 });

      await a.tap('textarea', { move: { frames: 5 }, settle: 1, after: 350 });
      await a.type('textarea', 'Which domain names are reserved for documentation and examples?', {
        chunk: 4,
        delay: 55,
      });

      // The assistant's messages are the left-aligned bubbles and the greeting is
      // already one of them, so the reply is the second — a selector that does not
      // depend on knowing what the answer will say.
      const reply = ':nth-match(div.flex.justify-start, 2)';
      await a.tap('button:has-text("Send")', { move: { frames: 5 }, settle: 2, after: 250 });
      // The arriving reply pushes the input row down, so a pointer left at the Send
      // button's old coordinates ends up floating next to it. Nothing else here is
      // mouse-driven, so retire it.
      await a.hideCursor();
      await a.awaitResult(reply, { spinnerFrames: 5, spinnerDelay: 220, after: 3200 });
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
