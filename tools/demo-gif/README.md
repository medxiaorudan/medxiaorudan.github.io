# tools/demo-gif

The demo GIFs on the three live-app cards. `npm run gifs`, or
`./tools/demo-gif/capture.sh <slug>` for one.

## The split

The recording **engine is not here.** It is generic — it takes `--flows <file>` and knows
nothing about any site — so it lives globally as the `demo-gif` skill
(`~/.claude/skills/demo-gif/`, with `SKILL.md` and `reference/authoring-flows.md`). Keeping
one copy means a fix benefits every site instead of drifting per repo.

This directory holds only what is true of *this* site:

| file | what it is |
|---|---|
| `demo-flows.mjs` | The three flows: which URL, which selectors, which steps. |
| `gen-phantoms.mjs` | Synthetic mammography images, because MammoScreen shows nothing without input. |
| `capture.sh` | Wrapper: generates phantoms, loads the admin password, calls the engine with `--out img/projects`. |

`capture.sh` resolves the engine from `$DEMO_GIF_ENGINE`, defaulting to the skill path, and
fails with instructions if it is missing. Nothing else in the repo depends on the skill —
`npm run build` and `npm run deploy` only copy the committed GIFs.

## Things that will bite you

- **A flow's `slug` must match the project `id`** in `projects.data.js`. That is what makes
  output land at `img/projects/<slug>.gif`, which is what `motion` points at.
- **The GIFs are committed, not built at deploy time.** Recording drives real browsers against
  the *live* sites, so a deploy that regenerated them would depend on three other deployments
  being healthy. Regenerate deliberately.
- **`motion` never replaces `shot`.** The still is served to `prefers-reduced-motion` and is
  the `onerror` fallback, so every animated card needs both.
- **The SCS flow writes to production.** It logs into the live admin and ingests
  `hybridity.ai` into the live instance. This is intentional and `Hybridity AB` is left in
  place so the GIF shows a path a visitor can reproduce. Re-running is safe — the upload
  targets `data/<company name>`, reusing the directory rather than adding companies. See
  `CLAUDE.md` for the credential handling and the full caveats.
- **Verify before shipping.** The encoder's inter-frame differencing fails as ghosting, which
  is invisible until a browser's own GIF decoder runs it:
  ```bash
  node ~/.claude/skills/demo-gif/verify-gif.mjs img/projects/mammoscreen.gif 8 1250
  ```
  It writes a contact sheet to `.demo-gif-verify/`. Look at it — a zero exit code only means
  the file decoded.
