# leilighet-3d

three.js (Vite + TypeScript) model of Brochmanns gate 14C, 4. etg. See `README.md` to run it and `docs/` for all findings.

- **Geometry**: `src/data/apartment.ts` is the single source of truth. Every number is tagged M (owner-measured), P (plan) or E (estimate).
  Plan coordinates: metres, x = east, y = north, with the origin at the inner SW corner of Stue/Kjøkken.
- **Colours**: `src/data/palette.ts` holds the keys and defaults. Wall faces pick the colour of the room they face automatically (`src/build/walls.ts`).
- The owner's measurements beat the floor plan (which is not to scale). Confirmed facts: `docs/02-measurements.md`.
- Workflow: research → write findings to `docs/` → ask all questions at once with defaults → build → verify with headless screenshots
  (`window.apartment3d` exposes camera, orbit, setMode and setView) → log the round in `docs/04-changes.md` and `docs/05-open-questions.md`.
- Use bun, not npm. `bun run build` type-checks and must stay clean.
