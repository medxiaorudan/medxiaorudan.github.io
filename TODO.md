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

- [ ] 🧑 **Does the Hybridity timeline entry get a full-stack sentence?** The 2024-Present
  node in `index.html` still describes only the AI work. The rest of the site was reframed
  as "AI *and* full-stack" on 2026-07-28, and every other full-stack claim is backed by a
  repo we can point at — ERA (`apps/web`, 22 commits, hers) and SmartCustomerService
  (Next.js front end, 13 commits, hers). The Hybridity entry is the one claim with no public
  repo behind it, so the sentence was deliberately **not** written pending Rudan confirming
  she owned frontend there. Draft held for her: "…for compliance-focused AI workflows, from
  the operator-facing interface down to the services behind it." Ask before adding; it is the
  one line on the page that could not be defended in an interview if wrong.

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

- [ ] **`smart-customer-service.gif` is 502 KB, over this repo's own ceiling.** `CLAUDE.md`
  sets ~400 KB for homepage GIFs and says to *cut steps rather than quality* when a flow
  exceeds it. The other two are within budget (mammoscreen 124 KB, ERA 293 KB). The scs flow
  is the longest of the three — admin login, then ingest, then a question and answer — so the
  cheapest cut is steps, most likely the login beat. Measured 2026-07-28 after a re-record.
  **Careful which step goes, though.** Dropping the login/ingest half is what would save the
  most, but it is also the only reason this card beats a chat-only clip: watching three URLs
  go in and become answerable is what shows a RAG pipeline rather than any chatbot. Cheaper
  cuts that keep the story, in order: coarsen the URL typing (`chunk: 12` → one frame per
  ~20 chars), drop `move.frames` from 4 to 3 across the flow, and shorten the two 3.4s held
  frames at the end. Each click costs ~10-14 frames and each `chunk` one frame, so budget by
  counting. Do **not** reach for `--colors`: 128 was measured at only 10% smaller for real
  damage to anti-aliased text.

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

- [ ] **ERA's card has no favicon, and one object would fix it.** The CloudFront router
  rewrites any `/favicon.ico` to `/_icons/<app-id>.svg` in `s3://rudanxiao-apps/_icons/`
  (`web-platform/cf-functions/router.js:70`). That prefix holds only `mammoscreen.svg`,
  `smart-customer-service.svg` and `www.svg`, so `era-api` falls through to the SPA's own
  `index.html` — a 200 that a browser cannot decode, which is exactly why
  `projects.data.js`'s ERA entry omits `icon` and lands on the coloured badge. Generating
  `era-api.svg` into that bucket is the whole fix; the `icon` line then mirrors the one added
  for scs on 2026-07-28. Nothing is needed from the ERA repo, and we do **not** need push
  access there for it. Offered but not decided.

- [ ] 🧑 **ERA accepts unauthenticated demo identities outside demo mode.** `x-era-user` /
  `x-era-role` headers name any user in the directory — including admin — with no token or
  signature, on a system whose purpose is restarting real infrastructure.
  `era-api.rudanxiao.com` is publicly reachable. A gate for this was written locally
  (`assertDemoAuthAllowed()`, requiring `APP_ENVIRONMENT=demo` or `ERA_ALLOW_DEMO_AUTH=true`)
  but **deliberately scrapped on 2026-07-28** — decision was to fix it on Rudan's end
  instead, so this is hers to do, not ours to re-land. Recoverable from the reflog at
  `877f4c7` in the local `EnterpriseResilienceAgent` clone (~90 days) if the shape is useful
  as a reference. The real fix is token verification: `jose` is already a dependency and the
  OIDC plumbing exists for MCP in `apps/api/src/mcp/http-auth.ts`.

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
- [x] **Profile reframed as AI *and* full-stack** (2026-07-28). The prose was ~95% AI while
  the tool registry listed no frontend at all. Added a `WEB` tool group (typescript, react,
  next_js, vite), renamed `OPS Infrastructure` to `Backend & Infra`, added `redis`, split the
  handoff `capabilities` field into `ai.stack` / `app.stack`, retitled to `AI Engineer ·
  Full-Stack`, rewrote the bio, and named ERA's architecture in its description. Ratio held
  at roughly 70/30 AI-to-full-stack on purpose: the PhD and medical-imaging spine is the
  differentiator, and "full-stack AI engineer" is a far more crowded position.
- [x] `#work` moved ahead of `#journey`; sections renumbered 01-06 and the nav reordered.
  `journey.log()` had been labelled with a bare dash where every other section has a number,
  so it took `03` and the dash went with it.
- [x] Inter-chapter spacing cut twice, `clamp(4rem, 8vw, 8rem)` to `clamp(1.5rem, 3vw, 3rem)`.
  The gap a reader sees is *double* the padding, so desktop went 16rem to 6rem.
- [x] Em dashes removed from all visible copy (titles, meta, bio, timeline, terminal line,
  art intro, tier subs, three project descriptions), rewritten as colons/full stops rather
  than swapped for another dash. Code comments still have them; they are not copy.
- [x] scs card shows its real favicon. It is served by the platform router from
  `_icons/smart-customer-service.svg`, so nothing was needed from the Next.js app.
- [x] Push access: we are a collaborator as of 2026-07-28. `CLAUDE.md`'s "this clone is
  read-only" section and three other expired comments were rewritten to match.
