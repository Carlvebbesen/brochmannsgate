# The app

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
```

## Controls
- **Dollhouse**: left-drag to orbit, right-drag to pan, scroll to zoom. *3D view* / *Top view* presets. The ceilings are hidden
  unless *Show ceilings* is on. *Section cut* slices everything above a height. *Room labels* shows names and areas.
- **Walk**: click the view to capture the mouse. WASD/arrows to move, Shift to go faster, Esc to release.
  You can't walk through walls or built-ins. Click (while captured) selects the surface under the crosshair.
- **Sun**: time-of-day slider, using the real sun position for Oslo on today's date (the balcony faces west).

## Colours
- Click a surface in the model, or a row in the side panel. Then pick a colour or type a hex value.
- Every surface of a type shares one colour key: e.g. `stue.walls`, `entre.tiles`, `kitchen.fronts`, `trim`.
  All keys and defaults are in `src/data/palette.ts`.
- For a single wall face, *Only this wall surface* gives just that face an accent colour.
- Colours save automatically in the browser (localStorage). *Export colours* / *Import* move them as JSON, and *Reset* restores the defaults.

## Code structure
| Path | Role |
|---|---|
| `src/data/apartment.ts` | All geometry (rooms, walls, openings, built-ins, balcony) |
| `src/data/palette.ts` | Colour keys, panel groups, defaults |
| `src/data/types.ts` | Data types |
| `src/build/walls.ts` | Splits walls around openings and at room boundaries. Each face takes the colour of the room it faces |
| `src/build/openings.ts` | Door leaves and casings, window frames, glass and sills, doorless openings |
| `src/build/rooms.ts` | Floors, ceilings, floor zones (entry tiles), slabs, room labels |
| `src/build/trim.ts` | Skirting and cornices along wall-backed edges |
| `src/build/fixtures.ts`, `balcony.ts` | Built-ins; balcony slab, soffit, balustrade and railing |
| `src/core/*` | Colour store, material registry, sun position, geometry helpers |
| `src/controls/walk.ts` | First-person walking with 2D collision |
| `src/ui/panel.ts` | Side panel |

## Making changes
- **Move or resize a wall, door or window**: edit its numbers in `apartment.ts`. Faces, skirting and collision update automatically.
- **Add a doorless opening**: add an `Opening` with `kind: 'opening'` (see O6 for Tvstue).
- **Add a colourable element**: add a `Fixture` with a new key and add that key to `palette.ts`.
- Debug handle in the browser console: `apartment3d` (scene, camera, orbit, setMode, setView, select, store).
