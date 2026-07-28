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
// Resolved from this file rather than the cwd, so the flows work whichever directory the
// engine is invoked from. `../..` is the repo root — this file lives in tools/demo-gif/.
const phantom = (n) =>
  resolve(HERE, `../../.demo-assets/phantoms/synthetic-${String(n).padStart(3, '0')}-${
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
    // The whole product in one pass: an admin logs in, points the app at a real
    // company's website, the app ingests it — then a visitor asks that company's
    // assistant a question and gets an answer grounded in what was just ingested.
    //
    // Showing the ingest is the point. A chat-only demo could be any chatbot; watching
    // three URLs go in and become answerable is what makes it visibly a RAG system.
    //
    // REQUIRES `SCS_ADMIN_PASSWORD` in the environment. Never put it in this file — see
    // the npm script, which pipes it straight from the box into the capture process.
    // `typeSecret` refuses any field that is not type=password, so what the frames
    // capture is the app's own masking.
    //
    // Honest caveats, since this flow both writes to production and shows an LLM:
    //
    // 1. It really ingests hybridity.ai into the live instance. `Hybridity AB` is a real
    //    public company selectable on the live site, so what the GIF shows is
    //    reproducible by a visitor rather than staged. Re-running is safe: the upload
    //    writes to `data/<company name>`, so it targets the same directory instead of
    //    accumulating companies. There is no delete endpoint — removing it means
    //    `rm -rf /srv/scs/data/'Hybridity AB'` on the box.
    // 2. The ingested text is Hybridity's own public marketing copy, fetched live from
    //    their site at record time. Nothing about it is written by us.
    // 3. Login is ~1s but the reply genuinely takes 7-9s. `awaitResult` records a short
    //    waiting beat and then the real answer, so GIF time is not elapsed time. The
    //    answer itself is untouched.
    // 4. The step back to the role picker is a `navigate`, not a click — the app offers
    //    no link back from the admin screen. It reads as a scene change from admin to
    //    visitor, which is what it is.
    slug: 'smart-customer-service',
    url: 'https://smart-customer-service.rudanxiao.com/',
    colorScheme: 'light',
    // The chat is a centred `max-w-4xl` (896px) column, so at the default 1280 width the
    // frame is mostly empty white and the card reads as blank. Recorded just wider than
    // the app's own content instead. Still 16:9, because the card crops to that.
    viewport: { width: 1024, height: 576 },
    run: async (a) => {
      const SITE = 'https://smart-customer-service.rudanxiao.com/';
      // Frame counts are kept tight throughout: this is the longest flow of the three
      // and every click costs ~10 frames, so moves are 4 frames and settles are 3.
      const move = { frames: 4 };

      await a.hold(900); // the role picker

      // --- Admin: log in and feed the app a real company's site ---
      await a.tap('text="Admin"', { move, until: 'input[type=password]', settle: 3, after: 800 });
      await a.typeSecret('input[type=password]', 'SCS_ADMIN_PASSWORD');
      await a.tap('button:has-text("Login")', {
        move,
        until: 'text=Data Source Configuration',
        settle: 3,
        after: 900,
      });

      await a.type('input[placeholder="Enter company name"]', 'Hybridity AB', { chunk: 4, delay: 60 });
      // Coarse chunks: three URLs are ~90 characters, and typing them 3 at a time would
      // cost 30 frames for motion the eye reads as continuous at 12.
      await a.type(
        'textarea',
        'https://hybridity.ai/company\nhttps://hybridity.ai/platform\nhttps://hybridity.ai/security',
        { chunk: 12, delay: 70 }
      );

      await a.tap('button:has-text("Upload Data Sources")', { move, settle: 2, after: 200 });
      await a.hideCursor();
      // Ingestion — fetch, chunk and embed three pages — really takes ~5s.
      await a.awaitResult('text=Data uploaded successfully!', {
        spinnerFrames: 4,
        spinnerDelay: 240,
        after: 1600,
      });

      // --- Visitor: ask the company's own assistant ---
      await a.navigate(SITE, { until: 'text="User"', after: 900 });
      await a.tap('text="User"', { move, until: 'text=Select Company', settle: 3, after: 900 });
      await a.tap('text="Hybridity AB"', { move, until: 'textarea', settle: 3, after: 900 });

      await a.tap('textarea', { move, settle: 1, after: 250 });
      await a.type('textarea', 'What does Hybridity help organisations with?', { chunk: 4, delay: 55 });

      // The assistant's messages are the left-aligned bubbles and the greeting is
      // already one of them, so the reply is the second — a selector that does not
      // depend on knowing what the answer will say.
      await a.tap('button:has-text("Send")', { move, settle: 2, after: 250 });
      // The arriving reply pushes the input row down, so a pointer left at the Send
      // button's old coordinates ends up floating beside it.
      await a.hideCursor();
      await a.awaitResult(':nth-match(div.flex.justify-start, 2)', {
        spinnerFrames: 4,
        spinnerDelay: 240,
        after: 3400,
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
