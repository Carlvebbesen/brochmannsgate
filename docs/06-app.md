# The app

```bash
bun install
bun run dev       # http://localhost:5173 (the UI; uses the API if dev:api is running)
bun run dev:api   # the Worker + local KV on :8787 (password from .dev.vars)
bun run build     # type-check (app + worker) + production build
bun run deploy    # build + deploy to Cloudflare (wrangler deploy)
```

Live at https://brochmannsgate.ecvebbesen.workers.dev. Pushing to GitHub `main` also deploys, through Cloudflare's Git integration.

## Controls
- **Dollhouse**: left-drag to orbit, right-drag to pan, scroll to zoom. *3D view* / *Top view* presets. The ceilings are hidden
  unless *Show ceilings* is on. *Section cut* slices everything above a height. *Room labels* shows names and areas.
- **Furniture**: turn on *Move furniture* in the panel, then click-drag any movable piece (bed, nightstands, sofa, TV-benk,
  spisebord) to slide it across the floor; release to drop it. It's **off by default** so that orbiting near a piece never nudges
  it by accident. A plain click always still opens the colour picker for it, on or off. The Kontor wardrobes/desk and the
  wall-mounted TV are fixed built-ins and don't drag. Positions are shared/saved exactly like colours (see below).
- **Walk**: click the view to capture the mouse. WASD/arrows to move, Shift to go faster, Esc to release.
  You can't walk through walls or built-ins. Click (while captured) selects the surface under the crosshair.
- **El-plan**: a flat 2D top view for planning the electrical work — see *El-plan* below.
- **Sun**: time-of-day slider, using the real sun position for Oslo on today's date (the balcony faces west).
- **Vinyl floor texture**: the Bastion furu vinyl on every floor except the bathroom and entry tiles; off shows flat colours. Shared.
- **High quality**: ambient occlusion and a sharper sun shadow. Only for this browser; turn it off on slow devices.

## El-plan
A third mode, next to Dollhouse and Walk: the apartment as a flat, to-scale 2D sheet with the electrical points on it.
- **Phases**: *Today* (what is there now), *Planned* (what the flat ends up with) and *Compare* (both at once — grey = existing,
  blue = new, red with a cross = to be removed). Every point carries one of those three statuses.
- **Point types**: outlet 2-gang, outlet 6-gang, TV/antenna, network (RJ45); dimmer, switch, two-way switch; ceiling light,
  wall light, downlight/spot, LED strip/driver. All in `src/data/electrical.ts`, with their symbols and default heights.
- **View only / Edit**: the plan always opens view-only — hover a point for a card with its type, status, height, room and
  distances; click it for the details. *Edit* (or **E**) unlocks placing, moving, editing and deleting.
- **Placing** (Edit on): pick a type in the panel, then click the plan. Wall points snap onto the nearest wall or cabinet face
  within 40 cm and turn to face the room (over a worktop: onto the wall behind it); ceiling points go to a 5 cm grid. Hold **Alt**
  to place freely. Drag a point to move it, click it to edit type/status/height/note, **Delete** to remove it, **Esc** to put the
  tool away. Pan by dragging the background, zoom with the scroll wheel, *Fit* to re-centre.
- **Base**: *Floor plan* (the drawn plan) or *3D top view* (the model rendered straight down, aligned to the plan).
- **Show measurements**: chained dimensions along each wall (corner → point → point → corner) and ceiling points to the nearest
  walls. The hovered/selected point always shows its distances to the corners.
- **Heights** are in cm above the floor (or "tak" for a ceiling point) and print next to each symbol, together with any note.
- **Print / PNG** produce the whole sheet with its title block, legend (only the types in use, with counts per status) and a 1 m
  scale bar. Print is set up for A3 landscape.
- **Saving** is the same as for colours: shared through Cloudflare KV once unlocked with the password, otherwise local to the
  browser. *Reset* (colours) leaves the el-plan alone; *Clear plan* empties it, with a confirmation.

## Colours
- Click a surface in the model, or a row in the side panel. Then pick a colour or type a hex value.
- Every surface of a type shares one colour key: e.g. `stue.walls`, `entre.tiles`, `kitchen.fronts`, `trim`.
  All keys and defaults are in `src/data/palette.ts`.
- For a single wall face, *Only this wall surface* gives just that face an accent colour.
- **Shared settings**: everyone sees the colours and view settings stored in Cloudflare KV. Without the password, changes are
  only saved in that browser. After *Unlock* with the password, every change (colours, accent walls, sun, ceilings, labels, section cut)
  auto-saves for everyone. *Lock* signs out. Unlocking publishes what that browser currently shows.
- *Export colours* / *Import* move them as JSON, and *Reset* restores the defaults (and, when unlocked, saves that for everyone).

## Code structure
| Path | Role |
|---|---|
| `src/data/apartment.ts` | All geometry (rooms, walls, openings, built-ins, balcony) |
| `src/data/furniture.ts` | Movable furniture: footprints and default poses; fixed Kontor millwork and TV placement |
| `src/data/palette.ts` | Colour keys, panel groups, defaults |
| `src/data/electrical.ts` | El-plan point types: symbols, codes, Norwegian names, default heights; the `ElectricalItem` shape |
| `src/ui/plan2d.ts` | The 2D SVG plan: shell from `apartment.ts`, wall faces/mounting, points, measurements, hover card, 3D base, legend/title block, pan/zoom/place/drag |
| `src/ui/electrical.ts` | El-plan panel section: edit toggle, base/phase switches, measurement toggle, palette, point editor |
| `src/data/types.ts` | Data types |
| `src/build/walls.ts` | Splits walls around openings and at room boundaries. Each face takes the colour of the room it faces |
| `src/build/openings.ts` | Door leaves and casings, window frames, glass and sills, doorless openings |
| `src/build/rooms.ts` | Floors, ceilings, floor zones (entry tiles), slabs, room labels |
| `src/build/trim.ts` | Skirting and cornices along wall-backed edges |
| `src/build/fixtures.ts`, `balcony.ts` | Built-ins; balcony slab, soffit, balustrade and railing |
| `src/build/kitchen.ts` | Kitchen runs: carcasses, fronts with shadow gaps, bar pulls, worktops with the sink cut-out, hob, ovens |
| `src/build/kontor.ts` | Fixed Kontor built-ins (Pax-style wardrobe, opposite wardrobe + desk) and the wall-mounted TV |
| `src/build/furniture.ts` | Movable furniture meshes (bed, nightstands, sofa, TV-benk, spisebord); `setPose` repositions a group |
| `src/core/*` | Colour/view/furniture-pose store, material registry, sun position, geometry helpers |
| `src/core/vinyl.ts` | Loads the vinyl floor textures; tile size and average colour |
| `scripts/floor-texture.py` | Builds `public/textures/vinyl-*.webp` from the parkett.no swatch (needs numpy + Pillow). Re-run after changing it |
| `src/core/remote.ts` | Talks to the Worker API: loads shared settings, login/logout, debounced auto-save |
| `worker/index.ts` | Cloudflare Worker: static assets + `/api/settings`, `/api/login`, `/api/logout` on KV |
| `wrangler.jsonc` | Worker config: KV binding, login rate limit, build command |
| `src/controls/walk.ts` | First-person walking with 2D collision |
| `src/ui/panel.ts` | Side panel |

## Making changes
- **Move or resize a wall, door or window**: edit its numbers in `apartment.ts`. Faces, skirting and collision update automatically.
- **Add a doorless opening**: add an `Opening` with `kind: 'opening'` (see O6 for Tvstue).
- **Add a colourable element**: add a `Fixture` with a new key and add that key to `palette.ts`.
- **Change the floor texture**: edit `scripts/floor-texture.py` and run it. If the tile size changes, update `VINYL.tile`
  (and the printed average colour) in `src/core/vinyl.ts`.
- Debug handle in the browser console: `apartment3d` (scene, camera, orbit, setMode, setView, select, store, remote, renderer, gtao, setQuality).
