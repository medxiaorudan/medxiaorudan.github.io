# TODO — rudanxiao.com apex

Open work on Rudan's site. Hosting/platform items live in
`~/HobbyProjects/web-platform/TODO.md` (see its `rudanxiao.com` section); this file is for
the site's own content and copy.

**Push access — changed 2026-07-28.** We are now a collaborator on
`medxiaorudan/medxiaorudan.github.io` (`push: true`, no admin). The remote is SSH over the
lolispo key. Work goes up on a branch for Rudan to merge — `main` is hers, so don't push it
without asking. `CLAUDE.md` was updated to match the same day.

## Content

- [ ] **Show a start year, not just an end year, on the projects page.** `year` in
  `projects.data.js` is documented as "last meaningful activity", so a card reading `2023`
  hides whether that was a weekend or five years. A range (`2018–2023`) would show depth.
  Add a `yearStart` field and render `yearStart–year` in `projectCard`'s `.agent-year`,
  falling back to the single year when they match or `yearStart` is absent.

  **⚠️ Do not bulk-fill this from the GitHub API.** `created_at` is when the *repo* was
  created, not when the work happened, and for this account the two diverge badly — much
  of the PhD-era work was uploaded to GitHub years after it was done. Concretely:

  | Repo | `created_at` | `pushed_at` | site `year` |
  |---|---|---|---|
  | MSSL | 2023-09-25 | 2023-12-04 | 2023 |
  | RCC-VascularMorphClassify | 2023-09-25 | 2023-11-02 | 2023 |
  | ColorectalCancer | 2018-07-10 | 2023-09-30 | 2023 |
  | Cervical-Cancer | 2018-07-16 | 2023-09-24 | 2023 |
  | Type-Diabetes | 2018-07-17 | 2023-09-24 | 2023 |
  | NLP_AMMI_Emotional_Scoring | 2020-01-09 | 2023-09-28 | 2023 |
  | AI-scores-analysis-of-mammography | 2022-04-11 | 2023-09-28 | 2023 |
  | GeneRankDetection | 2023-09-22 | 2023-10-01 | 2023 |
  | LLM_NER_MultiNERD | 2023-12-03 | 2024-02-08 | 2024 |
  | CodeGeneration | 2024-01-16 | 2025-02-14 | 2025 |
  | BreastMRIPrep | 2025-03-04 | 2025-03-04 | 2025 |
  | DemandForecasting-SCM | 2025-11-05 | 2025-11-05 | 2025 |
  | RestaurantApp | 2025-07-28 | 2025-07-28 | 2025 |
  | OpenCV-for-Python-book | 2019-09-23 | 2019-09-23 | 2019 |
  | SmartCustomerService | 2025-03-04 | 2026-07-27 | 2026 |
  | MammoScreen | 2023-09-26 | 2026-07-27 | 2026 |
  | PriorArtDiscoveryAgent | 2026-06-07 | 2026-07-26 | 2026 |
  | EnterpriseResilienceAgent | 2026-07-25 | 2026-07-27 | 2026 |

  Two failure modes in that table. **MSSL and RCC** were created in 2023 but are MICCAI /
  PhD work from the 2019–2023 era — `created_at` would *understate* them, and those are two
  of the six core cards. **The three 2018 repos** (Colorectal, Cervical, Type-Diabetes) sit
  untouched for five years and then get a 2023 push; rendering `2018–2023` implies five
  years of sustained work on what may be a short study. So: use the table as a starting
  point, but the PhD-era entries need real dates from Rudan (🧑) before anything ships.
  Safe to auto-fill only where `created_at` and the work plausibly coincide — the 2024+
  repos.

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
Recorder: the global `demo-gif` skill plus this repo's `tools/demo-gif/`, `npm run gifs`; what it
records versus authors is written up in `web-platform/TODO.md` ("Demo GIFs for app cards").

## Linked apps (not this repo, but they degrade this page)

- [ ] 🧑 **`smart-customer-service`'s `demo` company still answers off-topic.** Asking it
  "What does your company do?" returns an answer about `Eastlake & Panitz`, reserved
  top-level DNS names and `.example`/`.test` — that company's ingested corpus is an RFC. The
  RAG is working correctly; the corpus just makes the app look broken.
  **Partly addressed 2026-07-28:** a second company, `Hybridity AB`, was ingested into the
  live instance from three `hybridity.ai` pages, and it answers well — that is what the
  card's GIF records, and it is a real selectable company rather than a staged one. So a
  visitor following the "Live site" link now sees a picker with one good company and one bad
  one. What remains is deleting or re-ingesting `demo`, which has no admin path: companies are
  directories, `get_companies` is `os.listdir("./data/")`, and there is no delete endpoint, so
  it is `rm -rf /srv/scs/data/demo` on the box (or an upload that overwrites it).
  Repo: `medxiaorudan/SmartCustomerService` (we *do* have push access to that one).

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
