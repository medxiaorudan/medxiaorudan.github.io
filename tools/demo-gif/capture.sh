#!/usr/bin/env bash
#
# Record the demo GIFs for the live-app cards. Wraps capture-demo-gif.mjs with the two
# things a flow needs but must not contain: generated input images, and a credential.
#
#   ./scripts/capture-demo-gifs.sh                 # every flow
#   ./scripts/capture-demo-gifs.sh mammoscreen     # one flow
#
# WHY THE PASSWORD IS FETCHED HERE. The Smart Customer Service flow logs into the live
# admin to ingest a real site, so it needs ADMIN_PASSWORD. It is read from the box into
# this process's environment at record time and passed to node as an env var — it is
# never written to a file, never committed, and never echoed. `typeSecret` in the engine
# refuses to type it into anything but an <input type="password">, so what the recording
# captures is the app's own masking (verified: the frames show dots).
#
# The value is double-quoted inside /srv/scs/.env, hence the quote-stripping — passing the
# quotes through is silently wrong and shows up only as a 401.
set -euo pipefail
cd "$(dirname "$0")/.."

# MammoScreen renders nothing without input images, so generate them first. Deterministic
# and gitignored — see gen-phantoms.mjs for why they are synthetic.
node scripts/gen-phantoms.mjs .demo-assets/phantoms 5 >/dev/null
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

exec node scripts/capture-demo-gif.mjs --flows scripts/demo-flows.mjs "$@"
