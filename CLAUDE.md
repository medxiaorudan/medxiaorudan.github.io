# medxiaorudan.github.io

Rudan Xiao's personal site. Served at the **`rudanxiao.com` apex** via the `web-platform`
hosting layer, and also (for now) at `https://medxiaorudan.github.io/` via GitHub Pages.

Design spec: `~/HobbyProjects/web-platform/docs/superpowers/specs/2026-07-28-rudanxiao-apex-hosting-design.md`

## ⚠️ This is Rudan's repo — push to branches, never to `main`

**Changed 2026-07-28: we now have push access.** The Lolispo account is a collaborator
(`push: true`, `admin: false`, verified via REST). This file previously said the clone was
read-only; that is no longer true.

- **The remote is SSH over the lolispo key.** `core.sshCommand` is set locally to
  `ssh -i ~/.ssh/lolispo-key -o IdentitiesOnly=yes` and `origin` is
  `git@github.com:medxiaorudan/medxiaorudan.github.io.git`. The default `gh` is the Tendium
  account — use `gh1` for any API work here.
- **Never push `main`.** It is Rudan's default branch and she commits to it directly. Push a
  feature branch and let her merge, even though nothing technically stops a fast-forward.
- **No admin.** So no branch protection, settings, or Actions-secret changes — and
  push-to-deploy (Phase B) still cannot be set up from here.
- **Prefer a new file over editing a tracked one, still.** Not because we cannot push any
  more, but because Rudan keeps committing to `index.html` / `style.css` / `script.js` and
  every edit we make to those is a `git pull` conflict waiting to happen. Our additive files
  — `package.json`, `scripts/`, `tools/`, `404.html`, `projects.data.js`, `projects.html`,
  `TODO.md`, this one — can never conflict.
- Content edits to `index.html` / `style.css` / `script.js` *will* conflict on `git pull`.
  That's expected — just know it before editing.
- `medxiaorudan/SmartCustomerService` also has push access. `EnterpriseResilienceAgent` and
  `MammoScreen` do **not** — those still need a patch sent to Rudan.

## Deploy

Tier 1 / Mode 1 (local), on the **rudanxiao.com** platform instance:

```bash
npm run deploy
```

which is `build-static.sh` → `dist/`, then:

```
AWS_PROFILE=private PLATFORM_PREFIX=/rudanxiao \
  ~/HobbyProjects/web-platform/scripts/deploy-app.sh www dist
```

- **app-id is `www`** — the platform routes both `rudanxiao.com` and `www.rudanxiao.com` to the
  bucket's `www/` prefix (`cf-functions/router.js`). The apex is just an app-id like any other.
- **`PLATFORM_PREFIX=/rudanxiao` is mandatory.** Without it the script reads `/platform/*` and
  deploys this site over the **petterbuilds.com** apex.
- **CI cannot deploy this yet.** The GitHub OIDC role grants only `/platform/*` and the
  petterbuilds bucket, so non-default instances are Mode 1 only. Making push-to-deploy work is
  Phase B in the spec. We have push on this repo as of 2026-07-28 but **not admin**, so the
  Actions secrets and workflow permissions it needs are still out of reach.
- RUM analytics is skipped by design on this instance — one monitor, validated against
  petterbuilds.com.

## ⚠️ `dist/` must always contain `404.html`

`deploy-app.sh` syncs the `www/` prefix with `aws s3 sync --delete`, excluding only `apps.json`.
That prefix holds `404.html`, which the edge stack serves for **every 403 and 404 across every
`*.rudanxiao.com` host** — including `smart-customer-service.rudanxiao.com` and every subdomain
that has no app yet.

So a deploy whose `dist/` lacks `404.html` **deletes it** and silently breaks error pages
platform-wide. `scripts/build-static.sh` copies it; don't remove that line.

It must also stay **fully self-contained** — no relative CSS/JS/image/font references. It renders
on foreign hosts like `mammoscreen.rudanxiao.com`, where a relative URL would route back into the
missing prefix and 404 again.

## Verify after deploying — don't assume

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://rudanxiao.com/                          # 200
curl -s -o /dev/null -w '%{http_code}\n' https://www.rudanxiao.com/                      # 200
curl -s -o /dev/null -w '%{http_code}\n' https://nope.rudanxiao.com/                     # 404
curl -s -o /dev/null -w '%{http_code}\n' https://smart-customer-service.rudanxiao.com/   # unchanged
aws s3 ls s3://rudanxiao-apps/www/ --profile private                                     # 404.html present
```

The last three are the regression checks for the `--delete` trap above.

## Demo GIFs for the live apps

The showcase cards can lead with a recorded navigation flow instead of a still. Regenerate
with:

```bash
npm run gifs                                    # all flows
./tools/demo-gif/capture.sh mammoscreen         # just one
node ~/.claude/skills/demo-gif/verify-gif.mjs img/projects/mammoscreen.gif 8 1250   # review it
```

- **The engine is not in this repo.** It is generic — takes `--flows <file>`, knows nothing
  about any site — so it lives globally as the `demo-gif` skill
  (`~/.claude/skills/demo-gif/`, with `SKILL.md` and `reference/authoring-flows.md`). One
  copy, so a fix benefits every site instead of drifting per repo. `tools/demo-gif/capture.sh`
  resolves it from `$DEMO_GIF_ENGINE`, defaulting to the skill path, and fails with
  instructions if absent.
- `tools/demo-gif/` holds only what is true of *this* site: the flows, the phantom generator,
  and the wrapper. See its README. **Nothing in the build or deploy path depends on the
  skill** — `npm run build` only copies committed GIFs.
- **This repo has no npm dependencies.** The recording deps live with the skill, and
  `gen-phantoms.mjs` writes PNGs with a hand-rolled greyscale encoder over `node:zlib` rather
  than pulling in `pngjs`, so our footprint here stays additive.
- A flow's `slug` **must** match the project `id` in `projects.data.js`, because that is what
  makes the output land at `img/projects/<slug>.gif`, which is what `motion` points at.
- **The GIFs are committed; they are not built at deploy time.** Recording drives real
  browsers against the *live* sites, so a deploy that regenerated them would depend on
  three other deployments being healthy. `build-static.sh` only copies them.
- MammoScreen needs input images, so `npm run gifs` first generates synthetic phantoms
  into `.demo-assets/` (gitignored — 5 MB of derivable pixels). They are synthetic on
  purpose: the app's own footer says to use anonymized or synthetic images only, and the
  repo's real DICOM fixtures are 80×48 correctness probes that look like a broken image.
- Size discipline matters — these sit on the homepage. Two levers do the work: per-frame
  delays (motion gets short frames, "read this" moments get one long-held frame) and
  inter-frame differencing (unchanged pixels written transparent with dispose=1). The
  latter is worth ~4x: the ERA flow is 287 KB where a naive encode of identical pixels is
  2062 KB. If a GIF comes out over ~400 KB, cut steps rather than quality.
- `motion` never replaces `shot`. The still is served to `prefers-reduced-motion: reduce`
  and is the `onerror` fallback, so every animated card needs both.

## Known content notes

- **The Smart Customer Service GIF logs into the live admin and writes to production.** It
  records the whole product: admin logs in → points the app at three `hybridity.ai` pages →
  the app ingests them (~5s, genuinely) → a visitor then asks Hybridity AB's assistant a
  question and gets an answer grounded in what was just ingested.
  - **`Hybridity AB` is now a real company on the live instance**, deliberately left there so
    the GIF shows a path a visitor can reproduce rather than something staged. Companies are
    just directories — `get_companies` is `os.listdir("./data/")` — and **there is no delete
    endpoint**: removing it means `rm -rf /srv/scs/data/'Hybridity AB'` on the box.
  - Re-recording is safe. The upload writes to `data/<company name>`, so it targets the same
    directory instead of accumulating companies.
  - **The password never enters this repo.** `tools/demo-gif/capture.sh` reads
    `ADMIN_PASSWORD` from `homeserver:/srv/scs/.env` into the capture process's environment at
    record time. `typeSecret` refuses any field that is not `type=password` — verified in the
    output: the frames show dots. Note the value is double-quoted in that `.env`, and passing
    the quotes through fails as a bare 401.
  - The reply genuinely takes 7-9s. `awaitResult()` records a short waiting beat and then the
    real answer, so **GIF time is not elapsed time on that card**. The answer is untouched.
  - The ingested text is Hybridity's own public marketing copy, fetched live from their site
    at record time. Nothing about it is written by us.
  - The `demo` company is still the old placeholder RFC 2606 corpus. Nothing points at it any
    more, but it is still publicly selectable.
- The eight images in the art section are **hotlinked from `gallery095.wordpress.com`** — an
  uncontrolled external dependency on the most visual part of the page. Worth vendoring.
- **The favicon now resolves** (changed 2026-07-28; this used to read "there is no favicon").
  The router answers `/favicon.ico` from the platform-owned `_icons/<app-id>.svg`, and those
  now exist — the apex and `smart-customer-service` each serve a distinct per-app monogram,
  not a shared one. Still owned by `web-platform`, not this repo, so our footprint stays
  additive. Two hosts remain unfixed: `era-api` serves its SPA `index.html` from
  `/favicon.ico` (a 200 that will not decode), and `mammoscreen` ships its own real
  `favicon.svg` rather than using the platform path.
