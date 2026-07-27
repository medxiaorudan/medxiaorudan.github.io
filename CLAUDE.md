# medxiaorudan.github.io

Rudan Xiao's personal site. Served at the **`rudanxiao.com` apex** via the `web-platform`
hosting layer, and also (for now) at `https://medxiaorudan.github.io/` via GitHub Pages.

Design spec: `~/HobbyProjects/web-platform/docs/superpowers/specs/2026-07-28-rudanxiao-apex-hosting-design.md`

## ⚠️ This clone is read-only

Neither local GitHub identity can push here — this is **Rudan's** repo and we are not
collaborators (verified by REST *and* `git push --dry-run` over SSH with both keys; SSH is not
a workaround, permissions are per-account). Only `medxiaorudan/SmartCustomerService` has push
access.

Consequences:

- **Never assume a commit can be pushed.** Commit locally if useful, but landing anything
  upstream needs Rudan (send a patch, as with SmartCustomerService) or new collaborator access.
- **Every file added here is deliberately additive** — `package.json`, `package-lock.json`,
  `scripts/`, `404.html`, `.gitignore`, this file. The repo has none of them, so `git pull` can
  never conflict on them while Rudan keeps committing to `index.html` / `style.css` / `script.js`.
  **Keep it that way**: prefer a new file over editing a tracked one.
- Content edits to `index.html` / `style.css` / `script.js` *will* conflict on `git pull`.
  That's expected — just know it before editing.

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
  Phase B in the spec (and needs push + admin on this repo).
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

## Known content notes

- The eight images in the art section are **hotlinked from `gallery095.wordpress.com`** — an
  uncontrolled external dependency on the most visual part of the page. Worth vendoring.
- There is no favicon. The router answers `/favicon.ico` from the platform-owned
  `_icons/<app-id>.svg`, which doesn't exist on this instance yet. A shared monogram for all
  Rudan sites is tracked in `web-platform/TODO.md` — deliberately not solved in this repo, to
  keep our footprint additive.
