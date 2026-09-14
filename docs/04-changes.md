# Change log

## Round 0: research (2026-09-12)
- Three Sonnet agents analysed the FINN ad text, the 55 listing photos, and the floor plan, pixel by pixel.
- The floor-plan agent's reconstruction had a topology error: it modelled the hallway as a full-length corridor,
  making the building 10.2 m wide. This was corrected to a ~9.0 m wide envelope (see `plan/02-floorplan-geometry.md` banner).
- The owner supplied on-site measurements ([02-measurements.md](02-measurements.md)).

## Round 1: answers and first build
Owner answers to the first 22 questions:
- Gang values are in cm.
- The entry tiles are in front of the front door and bathroom door, with wood floor between them and the first bedroom.
- 3131 = kitchen island → wall.
- Balcony: low priority.
- Sengevegg = north wall, skapvegg = the wardrobe wall.
- Tvstue: sofa wall = south wall; the 778 is measured from the south wall.
- The kott is empty.
- Built-ins are included, walls are colourable, colours are flat.
- Defaults for the rest: dollhouse + walk modes, doors/windows/skirting detail, auto-save + export/import,
  Vite + TypeScript + three.js, real sun orientation.

Built: an empty model with colourable floors, walls (with per-face accent colours), ceilings and built-ins.

## Round 2: owner feedback
| # | Feedback | Status |
|---|---|---|
| 1 | "Something wrong with the tiles/door/kott" | ❓ Questions asked, see [05-open-questions.md](05-open-questions.md) |
| 2 | Remove the wardrobe in the first bedroom | ✅ Removed |
| 3 | "Something wrong with the kitchen" | ❓ Questions asked |
| 4 | Remove the small wall beside the kitchen island | ✅ Removed (wall L) |
| 5 | Open up Tvstue: remove the door, 2.3 m opening | ✅ Door D6 replaced by a 2.30 m doorless opening, centred, head 2.10 |

## Round 3: entry and kitchen from the owner's photos
The owner sent a kitchen photo and photo 38 of the entry, noting that the tiles end between the kott door and the front door and that the model's tiles were too long.
- **Entry**: tiles are now 0.958 (out from the bathroom wall) × 1.662 (full depth). The entry and the bathroom are 1.662 deep, up from 1.31.
  The kott door is in line with the front door, and the nook is removed. The bathroom door is at the north end of wall A, after 0.89 of wall,
  and opens out. The front door is hinged next to the bathroom corner. The Hovedsoverom and Kontor doors moved accordingly.
- **Corridor/kitchen**: the corridor now runs south to y 3.50 with a beam across its mouth. The kitchen ↔ corridor opening
  (where the pier L used to be) has a header at 2.10.
- **Kitchen**: wall cabinets start at the window-wall corner. Wall and tall cabinets share a 2.25 top, with a grey bulkhead and vent grilles above.
  The kitchen window moved slightly south. New colour key: *Bulkhead above cabinets*.
- Review renders: `images/model-entry-west.png` (compare with photo 38), `images/model-kitchen.png` (compare with the owner's
  kitchen photo), `images/model-corridor-south.png` (compare with photo 36) and `images/model-entry-kitchen-top.png`. The top render is viewed from the north, so the image is upside down.

## Round 4 (2026-09-13)
Owner feedback: the entry "looks very good" and the Tvstue opening is "perf".
- The counter under the kitchen window runs the full wall length. Confirmed; this was already modelled.
- The island was briefly moved south (misreading "1.5–2 m between island and kitchen") and then **reverted on the owner's instruction**.
  It stays at y 3.131–4.031.
- Findings were also saved to Claude's memory and to a project `CLAUDE.md`.

## Round 5: deployed to Cloudflare (2026-09-13)
The owner wanted the model online, with colours and view settings shared through Cloudflare KV and editable only with a password.
Owner answers: visitors can view and try colours locally; colours **and** view settings are stored; changes auto-save; hosted on workers.dev for now;
Cloudflare account ecvebbesen@gmail.com (Worker `brochmannsgate`, linked to GitHub `Carlvebbesen/brochmannsgate`).
- **Live**: https://brochmannsgate.ecvebbesen.workers.dev
- **Worker** `worker/index.ts` serves `dist/` plus `/api/settings` (GET public, PUT editors only), `/api/login` and `/api/logout`.
  A correct password sets an HttpOnly session cookie (HMAC-signed, 30 days). Login is rate-limited to 10 attempts/min per IP.
  The server keeps only valid hex colours and clamped view values.
- **KV** namespace `brochmannsgate-settings` (id `7a5258b5…`), key `settings:v1`.
- **Password** is the Worker secret `EDIT_PASSWORD` (locally in `.dev.vars`, git-ignored). Changing it signs everyone out.
- **Client**: `src/core/remote.ts` loads the shared settings on start and auto-saves when unlocked. The panel has a new lock section.
  View settings (sun, ceilings, labels, section cut) moved into the store, so they are saved too.
  A visitor's own experiments stay in localStorage until a newer shared version is published.
- Verified: API tests (no auth, wrong password, forged cookie, validation) and a headless browser flow against production.

## Tooling: npm → bun (2026-09-13)
- `bun.lock` replaces `package-lock.json`. Scripts, `wrangler.jsonc` `build.command`, README, `docs/06-app.md` and `CLAUDE.md` now use `bun run …`.
- Verified: `bun run build` is clean.

## Round 6: hex field in the colour picker (2026-09-13)
Owner report: pasting a hex code into the selection card did nothing — only the native colour wheel (RGB sliders) worked.
- The field only applied on `change`, so a paste followed by a click in the 3D scene was dropped, and `#` was mandatory.
- `normalizeHex()` in `src/core/state.ts` now accepts `f5f1e8`, `#fe8` and `#rrggbbaa` (alpha dropped), plus stray whitespace.
- `src/ui/panel.ts` applies on every `input` (paste included), mirrors the value into the colour swatch, marks an
  unparseable value with a red border (`.hex.bad`) and restores the live colour on blur. Enter commits.

## Round 7: header above the island removed (2026-09-13)
Owner request: remove the header above the kitchen island, since that part will also be removed (like pier L below it).
- Wall `HDR2` (the 2.10 header over the kitchen ↔ corridor opening, x 4.286–4.386, y 3.50–4.98) is gone. The opening now runs
  floor to ceiling. The `HDR` beam across the corridor mouth stays.

## Round 8: detailed kitchen cabinets and handles (2026-09-14)
Owner request: more handles and more detailed, realistic kitchen cabinets. Owner answers (all defaults): slim bar pulls,
a typical HTH front layout, and detailed appliances.
- New `kitchenRuns` in `src/data/apartment.ts` (five runs: sink, window leg, island, tall, wall) built by `src/build/kitchen.ts`.
  Each run has carcasses, 19 mm fronts with 4 mm shadow gaps (a dark backing shows through), a recessed plinth and bar pulls.
- **Layout** (unit widths E): sink run = blind corner, sink unit, integrated dishwasher. Window leg = two drawer stacks and a narrow
  pull-out. Island = pan drawers under the hob, a door at each end. Tall = two drawers, oven, compact oven, top door | fridge,
  freezer and top door. Wall cabinets = two pairs of doors meeting in the middle.
- **Pulls**: horizontal near the top of drawers; vertical on doors, on the side away from the hinge, near the bottom of wall
  cabinets and at hand height on the fridge. New colour key *Handles* (`kitchen.handles`).
- **Appliances**: steel undermount sink cut into the worktop with an L-shaped tap; induction hob with a centre downdraft vent and
  four cooking zones; black-glass ovens with a window, display and steel bar. The *Hob, oven & sink* key is now *Hob & ovens*
  (the sink is steel).
- Review render: `images/model-kitchen-detail.png`.

## Round 9: realistic vinyl floor and lighting (2026-09-14)
Owner request: make the model look more realistic, starting with the real floor, **Bastion vinylgulv 1-stav Furu** (parkett.no),
everywhere except the bathroom and the entry tiles. Research: `plan/08-realism-research.md`. Owner answers (all defaults): texture from
the parkett.no swatch, planks east–west, all six rooms, colour row tints the vinyl with a toggle back to flat colour, lighting + AO now
with a quality switch, tiles and a photo-render mode later.
- **Texture**: `scripts/floor-texture.py` builds `public/textures/vinyl-{color,normal,rough}.webp` (0.5 MB total) from the flat
  swatch in `plan/images/floor/`. Planks are 1828 × 220 mm, staggered at least 30 cm, each a random strip of the swatch (flipped at random),
  with a bevel on all four edges (normal map), darker joints and a satin roughness map. One tile = 2 planks × 8 rows = 3.656 × 1.76 m.
  The floor UVs are already plan metres, so the planks run continuously through doorways.
- **Floors**: `stue`, `entre`, `kott`, `hovedsoverom`, `kontor` and `tvstue` floors (`VINYL_FLOORS` in `palette.ts`) use the texture.
  Their colour row is now *Floor (vinyl tint)*, default white (= the vinyl as it is). *Vinyl floor texture* off shows a flat colour
  (tint × the texture's average `#f5dfd2`). It is a shared view setting.
- **Settings v3**: older files (local, imported or from KV) held the flat oak `#d9bd8e`. On load, their six floor colours are dropped
  so the vinyl isn't tinted orange. The Worker now writes `version: 3` and stores `view.vinyl`.
- **Lighting**: `RoomEnvironment` image-based light replaces the ambient light; the hemisphere light is much lower. Both scale with the sun
  (tuned against screenshots: env 0.4 / hemi 0.2 at 16:00). The lacquered floor gets faint reflections from it.
- **Ambient occlusion**: GTAO (radius 0.5 m) through an `EffectComposer` with a 4× MSAA target. *High quality* (per browser, not shared)
  switches AO and the 4096² sun shadow map; off = the plain renderer and 2048² shadows. Note: three r186 removed `PCFSoftShadowMap`.
- Review renders: `images/model-vinyl-stue.png` (before: `images/model-before-vinyl-stue.png`), `images/model-vinyl-floor.png`.
