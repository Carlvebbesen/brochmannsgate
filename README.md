# Brochmanns gate 14C – 3D model

Three.js model of the 4th-floor apartment (FINN 467592160), empty (no furniture), with
changeable colours for every floor, wall, ceiling and built-in.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Using it
- **Dollhouse**: orbit (left drag), pan (right drag), zoom (scroll). The ceilings are hidden;
  turn them on with *Show ceilings*. Use *Section cut* to slice the walls lower.
- **Walk**: click the view, then use WASD/arrow keys and the mouse. Hold Shift to go faster, and press Esc to release the mouse.
- **Colours**: click any surface in the model, or a row in the panel. For wall faces, *Only this wall
  surface* gives that single face an accent colour. Your colours save in the browser automatically.
  *Export* and *Import* move them between browsers as JSON, and *Reset* restores the photo-based defaults.
- **Sun**: real orientation (the balcony faces west), with a time-of-day slider for Oslo.

## Where things live
| File | What |
|---|---|
| `src/data/apartment.ts` | **All geometry**: rooms, walls, doors, windows, built-ins, balcony. Tagged M (measured), P (from the plan) or E (estimate). |
| `src/data/palette.ts` | Colour keys, panel groups and default colours |
| `src/build/*` | Turns the data into meshes (walls split per room face, openings, trim, fixtures, balcony) |
| `src/core/*` | Colour state (localStorage), shared materials, sun position, geometry helpers |
| `src/controls/walk.ts` | First-person walking with collision |
| `src/ui/panel.ts` | Side panel |
| `docs/` | **Consolidated findings**: apartment facts, measurements, geometry, change log, open questions, app guide |
| `plan/` | Raw research: listing photos, ad HTML, floor-plan analysis scripts, first-round agent reports |

Plan coordinates are in metres: x = east, y = north, with the origin at the inner south-west corner of the living
room. To move a wall or door, edit its numbers in `apartment.ts`. Wall faces pick up the colour of whichever
room they face automatically.
