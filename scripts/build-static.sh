#!/usr/bin/env bash
#
# Assemble the deployable site into dist/.
#
# The repo root is NOT deployable: web-platform's deploy-app.sh stages with rsync
# excluding only .git/.omc/.gstack/.DS_Store, so deploying the root would publish
# README.md, package.json, scripts/ and CLAUDE.md. web-platform's CONVENTIONS.md is
# explicit about this — "never the repo root" — so copy only what the site serves.
#
# 404.html is NOT optional. It is the branded error page that the rudanxiao edge
# stack serves for every 403/404 across *every* *.rudanxiao.com host, and it lives
# at the same www/ prefix this deploy syncs with --delete. Leaving it out of dist/
# deletes it and silently breaks error pages for smart-customer-service and every
# subdomain that has no app yet.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

cp index.html projects.html projects.data.js style.css script.js 404.html "$OUT/"

# Project screenshots and demo GIFs. Copied wholesale rather than named individually so
# adding a new `shot` or `motion` to projects.data.js needs no build change.
#
# The GIFs are committed rather than built here on purpose: recording them drives real
# browsers against the live sites (see tools/demo-gif/), which needs network and
# takes ~15s per app. A deploy must not depend on three other deployments being healthy.
# Regenerate them deliberately with `npm run gifs`.
mkdir -p "$OUT/img/projects"
cp img/projects/*.jpg "$OUT/img/projects/"
# Nullglob-free guard: there is no GIF for every project, and `cp` on an unmatched glob
# would fail the build under `set -e`.
if compgen -G 'img/projects/*.gif' >/dev/null; then
  cp img/projects/*.gif "$OUT/img/projects/"
fi

echo "✓ Built $OUT/ ($(find "$OUT" -type f | wc -l | tr -d ' ') files)"
