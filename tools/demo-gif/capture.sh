#!/usr/bin/env bash
#
# Record this site's demo GIFs. Thin wrapper around the `demo-gif` skill, which owns the
# recording engine; everything site-specific lives beside this script.
#
#   ./tools/demo-gif/capture.sh                 # every flow
#   ./tools/demo-gif/capture.sh mammoscreen     # one flow
#
# Also reachable as `npm run gifs`.
#
# WHAT LIVES WHERE. The engine is generic and shared, so it is installed globally as a skill
# rather than vendored here — see ~/.claude/skills/demo-gif/SKILL.md. This directory holds
# only what is true of *this* site: the flows, the synthetic input images MammoScreen needs,
# and the credential handling below.
#
# WHY THE PASSWORD IS FETCHED HERE. The Smart Customer Service flow logs into the live admin
# to ingest a real site, so it needs ADMIN_PASSWORD. It is read from the box into this
# process's environment at record time and passed to node as an env var — never written to a
# file, never committed, never echoed. `typeSecret` in the engine refuses to type it into
# anything but an <input type="password">, so what the recording captures is the app's own
# masking (verified: the frames show dots).
#
# The value is double-quoted inside /srv/scs/.env, hence the quote-stripping — passing the
# quotes through is silently wrong and shows up only as an opaque 401.
set -euo pipefail
cd "$(dirname "$0")/../.."

ENGINE="${DEMO_GIF_ENGINE:-$HOME/.claude/skills/demo-gif/capture-demo-gif.mjs}"
if [ ! -f "$ENGINE" ]; then
  echo "error: demo-gif engine not found at $ENGINE" >&2
  echo "  Install the skill, then: npm install --prefix ~/.claude/skills/demo-gif" >&2
  echo "  Or point DEMO_GIF_ENGINE at a checkout of capture-demo-gif.mjs." >&2
  exit 1
fi

# MammoScreen renders nothing without input images, so generate them first. Deterministic
# and gitignored — see gen-phantoms.mjs for why they are synthetic rather than real.
node tools/demo-gif/gen-phantoms.mjs .demo-assets/phantoms 5 >/dev/null
echo "✓ phantoms generated"

# Only the SCS flow needs this, so a missing box is a warning rather than a failure: the
# other flows still record, and SCS fails with a clear message from typeSecret.
if SCS_ADMIN_PASSWORD="$(ssh -o ConnectTimeout=8 -o BatchMode=yes homeserver \
      "sed -n 's/^ADMIN_PASSWORD=//p' /srv/scs/.env | sed 's/^\"//; s/\"\$//'" 2>/dev/null)" \
   && [ -n "${SCS_ADMIN_PASSWORD}" ]; then
  export SCS_ADMIN_PASSWORD
  echo "✓ admin password loaded from homeserver:/srv/scs/.env"
else
  echo "⚠ could not read ADMIN_PASSWORD from homeserver — the smart-customer-service" >&2
  echo "  flow will fail; the others are unaffected." >&2
fi

# --out must be explicit: the engine defaults to ./demo-gifs, while this site serves them
# from img/projects/ where build-static.sh picks them up.
exec node "$ENGINE" \
  --flows tools/demo-gif/demo-flows.mjs \
  --out img/projects \
  "$@"
