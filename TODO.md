# TODO — rudanxiao.com apex

Open work on Rudan's site. Hosting/platform items live in
`~/HobbyProjects/web-platform/TODO.md` (see its `rudanxiao.com` section); this file is for
the site's own content and copy.

⚠️ Like every file we added here, this is **local only** — we have no push access to
`medxiaorudan/medxiaorudan.github.io`. See `CLAUDE.md`.

## Content

- [ ] 🧑 **Four projects have placeholder descriptions.** `Cervical Cancer`,
  `Type Diabetes`, `OpenCV for Python` and `Restaurant App` have no description on GitHub,
  so the text in `projects.data.js` states only what the repo name and primary language
  show — nothing about method or result is inferred. Marked `NEEDS-DESCRIPTION` at the entry.
  Needs real summaries from Rudan. All four sit behind the collapsed "Earlier experiments"
  disclosure, so they are low-visibility.

- [ ] **Decide the "Built & shipped" heading.** That section (`projects.html`) now holds two
  PhD research projects (MSSL, RCC Vascular Morphology) alongside the three runnable apps,
  because they were promoted into it. They *were* built, so it is not wrong, but if the
  heading was meant to signal "you can open this", it has drifted. `Highlights` or
  `Selected builds` would cover the mix. One-line change; raised but never decided.

- [ ] **Vendor the art images.** All eight images in the `#art` section are hotlinked from
  `gallery095.wordpress.com` — an uncontrolled external dependency on the most visual part
  of the page. If those URLs move, the section breaks silently.

## Showcase media

Done — all three live apps now lead with a recorded GIF. `motion` holds the GIF and `shot`
stays as the fallback, used when the visitor prefers reduced motion or the GIF fails to
load; an autoplaying GIF cannot be paused, so that fallback is the accessibility path, not
just belt-and-braces. `shotPos` anchors the still's crop (cards crop hard: a dashboard wants
`top center` to keep its nav, an app whose content sits mid-viewport wants `center`).
Recorder: `scripts/capture-demo-gif.mjs` + `scripts/demo-flows.mjs`, `npm run gifs`; what it
records versus authors is written up in `web-platform/TODO.md` ("Demo GIFs for app cards").

## Linked apps (not this repo, but they degrade this page)

- [ ] 🧑 **`smart-customer-service` answers off-topic on the demo corpus.** Asking the live
  demo "What does your company do?" returns an answer about `Eastlake & Panitz`, reserved
  top-level DNS names and `.example`/`.test` — the demo company's ingested corpus is an RFC.
  The RAG is working correctly; the corpus just makes the app look broken to anyone who
  follows the "Live site" link from this portfolio. Loading a corpus that matches the pitch
  would fix the first impression. Repo: `medxiaorudan/SmartCustomerService` (we *do* have
  push access to that one).

- [ ] 🧑 **`smart-customer-service` serves no page title** — 67/100 on deployed health, the
  only sub-100 site on rudanxiao. Surfaced by `web-platform/repo-admin` (`npm run health`),
  so it re-appears on every run until fixed.

## Done

- [x] Apex live at `https://rudanxiao.com/` via web-platform tier 1 / Mode 1 (`npm run deploy`,
  app-id `www`). `dist/` must always contain `404.html` — see `CLAUDE.md` for why.
- [x] `projects.data.js` as the single source of truth; `projects.html` with tiers; homepage
  renders only `featured`.
- [x] Live URLs wired for scs, mammoscreen and ERA; dual live + source links per card.
- [x] RESEARCH label dropped entirely; only LIVE remains.
- [x] Earlier experiments collapsed behind a disclosure, labelled with their count.
- [x] Two latent `script.js` bugs guarded (unguarded `#gridCanvas` `getContext`, and
  `typeLoop` dereferencing a missing `#heroSubtitle`) — both broke any second page.
- [x] Canvas theme matched to the CSS palette; it now reads `data-theme` instead of
  hardcoding `matrix` over a Tron palette.
