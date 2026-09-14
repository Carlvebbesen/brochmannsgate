# Brochmanns gate 14C – 3D model

Three.js model of the 4th-floor apartment (FINN 467592160), empty (no furniture), with
changeable colours for every floor, wall, ceiling and built-in.

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # type-check + production build
bun run deploy     # deploy to Cloudflare
```

Live: https://brochmannsgate.ecvebbesen.workers.dev. Colours and view settings are shared through Cloudflare KV,
and changing them for everyone requires the edit password (Worker secret `EDIT_PASSWORD`). See `docs/06-app.md`.

## Using it
- **Dollhouse**: orbit (left drag), pan (right drag), zoom (scroll). The ceilings are hidden;
  turn them on with *Show ceilings*. Use *Section cut* to slice the walls lower.
- **Walk**: click the view, then use WASD/arrow keys and the mouse. Hold Shift to go faster, and press Esc to release the mouse.
- **Colours**: click any surface in the model, or a row in the panel. For wall faces, *Only this wall
  surface* gives that single face an accent colour. Everyone sees the shared colours. *Unlock* with the password
  to save changes for everyone; without it, changes stay in your browser. *Export* and *Import* move colours as JSON, and *Reset* restores the photo-based defaults.
- **Sun**: real orientation (the balcony faces west), with a time-of-day slider for Oslo.
- **Floor**: the planned Bastion vinyl (1-stav furu) as a texture, with ambient occlusion and soft image-based light. The floor colour
  tints the vinyl (white = as is). *Vinyl floor texture* switches to flat colours, and *High quality* can be turned off on slow devices.

## Where things live
| File | What |
|---|---|
| `src/data/apartment.ts` | **All geometry**: rooms, walls, doors, windows, built-ins, balcony. Tagged M (measured), P (from the plan) or E (estimate). |
| `src/data/palette.ts` | Colour keys, panel groups and default colours |
| `src/build/*` | Turns the data into meshes (walls split per room face, openings, trim, fixtures, balcony) |
| `src/core/*` | Colour/view state, KV sync (`remote.ts`), shared materials, sun position, geometry helpers |
| `worker/index.ts`, `wrangler.jsonc` | Cloudflare Worker: serves the app, settings API on KV, password login |
| `src/controls/walk.ts` | First-person walking with collision |
| `src/ui/panel.ts` | Side panel |
| `scripts/floor-texture.py`, `public/textures/` | Vinyl floor texture generator and its output |
| `docs/` | **Consolidated findings**: apartment facts, measurements, geometry, change log, open questions, app guide |
| `plan/` | Raw research: listing photos, ad HTML, floor-plan analysis scripts, first-round agent reports |

Plan coordinates are in metres: x = east, y = north, with the origin at the inner south-west corner of the living
room. To move a wall or door, edit its numbers in `apartment.ts`. Wall faces pick up the colour of whichever
room they face automatically.
