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
- **Walk**: click the view to capture the mouse. WASD/arrows to move, Shift to go faster, Esc to release.
  You can't walk through walls or built-ins. Click (while captured) selects the surface under the crosshair.
- **Sun**: time-of-day slider, using the real sun position for Oslo on today's date (the balcony faces west).
- **Vinyl floor texture**: the Bastion furu vinyl on every floor except the bathroom and entry tiles; off shows flat colours. Shared.
- **High quality**: ambient occlusion and a sharper sun shadow. Only for this browser; turn it off on slow devices.

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
| `src/data/palette.ts` | Colour keys, panel groups, defaults |
| `src/data/types.ts` | Data types |
| `src/build/walls.ts` | Splits walls around openings and at room boundaries. Each face takes the colour of the room it faces |
| `src/build/openings.ts` | Door leaves and casings, window frames, glass and sills, doorless openings |
| `src/build/rooms.ts` | Floors, ceilings, floor zones (entry tiles), slabs, room labels |
| `src/build/trim.ts` | Skirting and cornices along wall-backed edges |
| `src/build/fixtures.ts`, `balcony.ts` | Built-ins; balcony slab, soffit, balustrade and railing |
| `src/build/kitchen.ts` | Kitchen runs: carcasses, fronts with shadow gaps, bar pulls, worktops with the sink cut-out, hob, ovens |
| `src/core/*` | Colour/view store, material registry, sun position, geometry helpers |
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
