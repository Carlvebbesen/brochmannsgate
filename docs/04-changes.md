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

## Round 10: corridor beam removed (2026-09-14)
Owner request (screenshot of the beam next to the island): "Remove this wall … the floating part out from the wall there above the island."
- Wall `HDR` (the beam across the corridor mouth, x 4.386–5.488, y 3.50–3.60, underside 2.10) is gone. The corridor now opens into the
  living room floor to ceiling, like the kitchen ↔ corridor opening since round 4. The Stue/Entré room boundary at y 3.50 is unchanged
  (it still decides floor and wall colours).
- Review render: `images/model-corridor-open.png`.

## Round 11: furniture, and drag-to-move (2026-09-14)
Owner request: add furniture from specific product links/photos (Möbelringen Lofoten kontinentalseng, Bohus Vinstra nattbord, an IKEA
Pax-style wardrobe, Skeidar Hedda hjørnesofa and A-Line Plank spisebord, a Porto-style floating TV-benk) to Hovedsoverom, Kontor and
Tvstue/Stue-Kjøkken, "all furniture moveable except the wardrobe on the kontor". Owner answers (all defaults offered):
1. Moveable = real click-drag in the browser (not just fixed geometry to hand-edit later).
2. Kontor's second wall (4-door wardrobe + desk) runs straight across, ignoring the window.
3. The Hedda corner sofa sits in Tvstue's south-east corner, under the window.

**New: draggable furniture.** `src/data/furniture.ts` holds each piece's footprint and default pose (plan x/y + yaw);
`src/build/furniture.ts` builds bed, 2× nightstand, sofa, TV-benk and spisebord as `THREE.Group`s at those poses. `ColorStore`
(`src/core/state.ts`) now also keeps `furniture: Record<id, Pose>` and persists it exactly like colours (localStorage + shared KV,
version 3 file gains an optional `furniture` field — old files without it just fall back to the defaults). `main.ts` drags the picked
group's group along the floor plane on pointer move (clamped to the apartment's bounding box) and commits the pose to the store on
release; a plain click (no movement) still opens the colour picker, as before. Each movable item keeps a live 2D collision box in
`apartment.obstacles`, so Walk mode can't walk through wherever furniture currently sits.

**Fixed built-ins (not furniture, don't move):**
- Kontor: a 6-door Pax-style wardrobe (0.5 m doors × 2.36 m, filled to the ceiling above) on the wall facing Hovedsoverom (`B12`);
  a 100+75 cm (4-door) wardrobe plus a legless floating desk filling the rest of the wall facing Tvstue (`B23`), straight across per
  the owner's answer. New palette key `kontor.wardrobe` (light oak, one colour for both walls and the desk). `src/build/kontor.ts`.
- Tvstue: a wall-mounted TV above the TV-benk, on the same wall as the Kontor millwork (seen from the Tvstue side). Not user-colourable
  (`tv.screen` / `tv.frame` in `src/core/materials.ts`, like glass/handles/steel).

**Movable furniture:**
- **Bed** (Lofoten kontinentalseng, 180×200, E height/detail): light-coloured legs (owner asked for lighter than the product default),
  and the sengegavel got two recessed vertical grooves splitting it into three panels instead of a plain flat panel (owner asked for this).
  New keys `furniture.bedFabric`, `furniture.bedLegs`.
- **2× nightstand** (Vinstra-style, 46×40), one drawer front over an open base, flanking the bed. Key `furniture.nightstand`.
- **Sofa** (Hedda-style L/corner sofa, 265×218, seat 48/depth 50, overall H 87): two straight arms (0.95 m seat+back depth, E) bent
  into the room corner. Key `furniture.sofa` — its first default (`#8f978c`) was accidentally almost the same colour as the Tvstue
  walls (`#8a9884`) and was invisible in every screenshot until changed to `#b7ab98`.
- **TV-benk** (Porto-style, 200×40×49): built "floating" (bottom at 0.35 m) per the owner's wording, even though the linked product
  photo shows visible wood legs — flag this if it should sit on the floor instead. Key `furniture.tvBench`.
- **Spisebord** (A-Line Plank-style, 200×95×75): trestle-style end legs (no centre leg), centred in the Stue/Kjøkken living area.
  Key `furniture.diningTable`.

**Not built (scope simplifications, flagged to the owner):** no rotate-while-dragging (yaw is fixed per item, only x/y move); dragging
clamps to the whole apartment's bounding box, not to each room's own polygon, so a piece can in theory be dragged into a room it
doesn't belong in; the sofa's L-shape is two overlapping boxes (seat + backrest), not a single moulded shape.
- Verified with headless Playwright screenshots (`docs/images/model-furniture-*.png`) and a scripted drag test (mouse down → move →
  up → reload) confirming a moved piece's new position survives a reload.

## Round 12: realism pass from the real product photos (2026-09-14)
Owner request: "pull the actual images, and make it more realistic." Round 11 had built the four Skeidar/Bohus/Møbelringen pieces
from their stated dimensions alone (their pages are JS-rendered, so the initial pass never actually saw a photo of them). This round
fetched each product's real `og:image` and rebuilt the pieces to match:
- **Bed** (`refs: bed.png`): the sengegavel is a dense quilted grid (5 columns × 3 rows of shallow square panels), not two plain
  grooves — matches the "Hedda Natur" tufted fabric in the photo. Fabric colour is now a warm taupe (`#b8a88d`), closer to the
  photographed textile than the greyish tone round 11 used.
- **Nightstand** (`refs: nightstand.jpg`): completely rebuilt. The real Vinstra stands on a **black metal leg frame** (with an X
  cross-brace) at ~30 cm, not the four wood corner legs round 11 modelled — the wood body (now a light oak, `#d9c39a`) sits above
  that, with two drawers with vertical reeded grooves and a round black knob each, instead of one plain box with a single line.
  New fixed material `nightstand.metal` (`src/core/materials.ts`).
- **Sofa** (`refs: sofa.png`): rounded seat/backrest edges (`RoundedBoxGeometry`, matching real cushions instead of sharp boxes),
  a groove splitting the long arm into two seat cushions and the backrests into three, and four round light-wood peg legs at the
  outer corners (the photo shows slim round tapered legs, not a plinth). Colour changed to a sage tone closer to the photo
  (`#b3bb9e`) — round 11's `#8f978c` default was almost the exact colour of the Tvstue walls (`#8a9884`) and made the sofa
  invisible in every screenshot until this was caught.
- **Spisebord** (`refs: table.png`): the photo shows plain square legs at each corner, not a trestle/A-frame end panel as round 11
  guessed from the name alone — rebuilt with four straight corner legs, and a lighter natural-oak top colour (`#dcc9a3`).
- **General realism**: `src/core/textures.ts` adds two small generated (canvas) bump maps — a wood-grain streak pattern and a
  fabric-weave noise pattern — applied as `bumpMap` (not a colour/tint, so the owner's chosen colour still shows through) to the
  wood keys (`kontor.wardrobe`, `furniture.nightstand`, `furniture.tvBench`, `furniture.diningTable`) and fabric keys
  (`furniture.bedFabric`, `furniture.sofa`) in `MaterialRegistry.get()`.
- The Pax wardrobe and Porto TV-benk were already built from the owner's own two photos in round 11 and were left as they were.
- Reference photos saved to the scratchpad only (not committed) — `og:image` URLs are in this log if they need re-fetching:
  bed `backend.mobelringen.no/media/catalog/product/6/1/6194099_...4.png`, nightstand `bohus.no/pimcorecdn/.../298400 - Vinstra
  nattbord...2.9888615f.jpg`, sofa and table via `ellinorassetsblobs...azurefd.net/assetsblobs/{8592586,6882510}/...webp`.

## Round 13: a "Move furniture" mode (2026-09-14)
Owner request: dragging furniture on every touch was too easy to trigger by accident (e.g. while orbiting near a piece). A new
*Move furniture* checkbox in the panel (off by default) now gates it: furniture only drags when it's switched on; otherwise a
click-drag over furniture just orbits the camera like clicking anywhere else, and a plain click (no drag, either way) still opens
the colour picker. Cursor becomes a hand (`grab`/`grabbing`) while the mode is on. `src/main.ts` (`moveFurniture` flag),
`src/ui/panel.ts` (`#opt-move`). Not persisted — resets to off on reload, like the Dollhouse/Walk mode itself.

## Round 14: a "Show dimensions" toggle (2026-09-14)
Owner request: an easy way to see the width/depth of every room and piece of furniture at a glance, not just by clicking each one.
A new *Show dimensions* checkbox in the panel (off by default, dollhouse view only, like room labels) now overlays a small blue
tag on every room (`src/build/rooms.ts`: bounding-box width × depth of the room polygon, in metres, via the new `bboxSize` helper
in `src/core/geom.ts`) and every movable furniture piece (`src/build/furniture.ts`: its `footprint.w`/`d` in centimetres, attached
as a child of the furniture group so it tracks drags but stays unrotated at yaw 0 since it sits at the local origin). Both label
kinds are `CSS2DObject`s pushed onto a new `ctx.dimensions` array (`src/build/context.ts`, `src/build/index.ts`), toggled in
`applyVisibility()` (`src/main.ts`) the same way room labels are, and offset 23px below the room-name label via a CSS transform
(`.dim-label` in `src/style.css`) so the two don't sit on top of each other. New `ViewSettings.dimensions` field in
`src/core/state.ts`, persisted the same way as the other view options.
Not built: labels only give a bounding-box size, not per-wall lengths, so an L-shaped or irregular room only shows its overall
envelope; in the small rooms near the entry (Kott/Bad/Entré) several tags sit close enough to overlap when everything is on at
once — flagged in `docs/05-open-questions.md` rather than chasing per-label collision avoidance.

## Round 15: six dining chairs, as one unit with the table (2026-09-14)
Owner request: "around the table add 6 of this chair. These will move around with the table, so they are one unit" — linked the
Casper armstol (hvitoljet ask/hvit) from sleepo.no. Fetched the product page's spec table directly (the page's headline "Måle"
field was internally inconsistent with its own detail rows, so the detail rows — 54×62×79 cm, seat height 44, armrest 65 — were
used) and the product photo to match the bent-wood wraparound arm/back silhouette.
- Built as **children of the `diningTable` group** (`src/build/furniture.ts`: `buildChair`, called from `buildDiningTable`), not
  as separate `FurnitureId`s — so they translate (and would rotate, if rotation is ever added) with the table automatically, with
  no new drag/obstacle/state plumbing needed. Positions (`diningChairs` in `src/data/furniture.ts`) are in the table's own local
  frame: 3 per long edge (no end chairs — owner's revision), evenly spaced.
- **Pushed halfway in** (owner's revision, "so it does not take up that much space"): each chair's centre sits exactly on the
  table edge, so about half its seat is tucked under the tabletop, like a chair pushed in at home, rather than the full chair
  sitting outside the table's footprint.
  Each chair: 4 round legs (front pair rises only to the armrest, back pair continues up into the top back rail — matches the
  photo, where the back frame is a continuous piece from floor to headrest), two armrest rails, one back rail, and a rounded
  cream seat cushion.
- New palette/material keys: `furniture.diningChair` (wood, `#e8dfc9`) and `furniture.diningChairSeat` (fabric, `#f2ede2`),
  added to `WOOD_KEYS`/`FABRIC_KEYS` in `src/core/materials.ts` for the same bump-map treatment as the other furniture.
- The table's own dimension label (`footprints.diningTable`, "200 × 95 cm") still reflects the table only, not the chairs —
  the chairs have no separate obstacle/collision box, so dragging the table close to a wall can in theory let a chair clip
  through it; not an issue at the table's current position (room is 5.49 × 3.48 m).
- Verified with a headless Playwright screenshot (top view and a close 3D angle) — chairs tuck cleanly under the table on all
  four sides, no overlap with the kitchen island or skjenk.

## Round 15: "Eikeskjenk 240" sideboard (2026-09-14)
Owner supplied a byggemanual PDF for a piece they're planning to build themselves — a 2400 × 350 × 800 mm free-standing oak
sideboard on six turned legs, five sections left to right: an open cubby (speaker/books/vinyl), an open bookshelf, an
asymmetric two-shelf section, a ten-bottle wine rack, and a closed door. Added as new movable furniture (`skjenk`, joining
`FurnitureId`) built from the manual's own deleliste/oppriss measurements (section widths, shelf heights, leg positions),
not estimated: `src/data/furniture.ts` (`SKJENK_W/D/H`, footprint, default pose) and `src/build/furniture.ts`
(`buildSkjenk`). New colourable key `furniture.skjenk` in the palette, given the wood bump map like the other oak pieces
in `src/core/materials.ts`.
Placed flush against the south wall of Stue/Kjøkken (wall F, y = 0), centred on the wall — the only blank, window- and
door-free wall long enough for a 2.4 m piece; front faces north into the room. Verified with headless screenshots from
several angles (`window.apartment3d`): the five sections, wine-rack grid and door/knob read correctly, and it clears the
dining table (added in a concurrent round) by a comfortable margin.

## Round 16: El-plan — 2D top view for planning the electrical work (2026-09-16)
Owner request: a top-down view "used to plan the electrical work", with power outlets (2- and 6-gang), dimmers, actual lights and
internet/TV outlets, a "current → new" distinction, and the same admin editing as the colours.

**A flat 2D sheet, not the 3D camera.** A third mode (*El-plan*, next to Dollhouse/Walk) swaps the WebGL view for an SVG plan
drawn straight from `src/data/apartment.ts` — walls split around every door and window, door swings as arcs, windows as glass
lines, built-ins and (optionally) the movable furniture as light outlines, room names with areas. SVG was chosen over an
orthographic three.js camera because the symbols stay crisp at any zoom and the sheet prints/exports as something an electrician
can actually read. Coordinates are the plan's own metres (SVG y = −y), so everything is to scale by construction.
- `src/ui/plan2d.ts` — the renderer and all plan interaction (pan, zoom, place, drag, select) plus the legend/title block.
- `src/data/electrical.ts` — the catalogue: 11 point types in three groups, each with a short code, a Norwegian name for the
  printed sheet, a default mounting height and an SVG symbol (NS 3931-ish: half disc for a socket, stem + lever for a switch,
  circle with a cross for a light point).
- `src/ui/electrical.ts` — the panel section: phase switch, palette, and the editor for the selected point.

**Types**: outlet 2-gang, outlet 6-gang, TV/antenna, network (RJ45); dimmer, switch, two-way switch; ceiling light, wall light,
downlight/spot, LED strip/driver.

**Current → new** is a status on each point — `existing`, `new` or `remove` — with a three-way phase switch: *Today* (existing +
to-be-removed), *Planned* (existing + new, i.e. what the flat ends up with) and *Compare* (all three at once: grey / blue / red
with a cross). One list of points, no duplication between a "before" and an "after" layer.

**Each point** stores its type, position, status, a mounting height in cm above the floor (or "tak" for a ceiling point,
defaulting to the type's own height) and a free-text note. Both are drawn next to the symbol, so the printed sheet carries the
heights. Points that land within 30 cm of each other stagger their labels instead of printing on top of one another.

**Placing and editing**: pick a type, click the plan. The point snaps to the nearest wall, cabinet or built-in face within 40 cm
(sitting 6 cm off it, on the side the cursor is on), otherwise to a 5 cm grid; Alt places freely. Drag to move, click to edit,
Delete to remove, Esc to drop the tool. *Fit*, *Print* (A3 landscape, via a serialised standalone SVG) and *PNG* export the sheet
with its legend, which lists only the types in use with per-status counts, a status key, the date and a 1 m scale bar.

**Sharing** works exactly like the colours: points live in `ColorStore.electrical` (settings `version: 4`), auto-save to
Cloudflare KV when the browser is unlocked with the password, and are local-only otherwise. *Reset* (colours) deliberately leaves
the el-plan alone; the panel has its own *Clear plan* with a confirmation.

**Fixed along the way**: the Worker's `sanitize()` (`worker/index.ts`) rebuilt the settings document field by field and silently
dropped everything it didn't know — so dragged **furniture positions** and the `dimensions` view flag had never actually reached
KV (they only survived in localStorage). Both are now validated and stored, along with the el-plan; the body limit went from
64 KB to 192 KB to fit up to 500 points.

Verified with headless Playwright: all three phases filter correctly, click-placement + wall snapping, dragging a point persists
to the store, the exported SVG parses and rasterises to PNG (1197 × 1456), no console errors, and switching back to Dollhouse
restores the 3D scene and the colour panel unchanged.

## Round 17: El-plan — wall-mounted symbols, measurements, 3D base, hover info, edit mode (2026-09-21)
Owner feedback on the el-plan: better outlet (stikkontakt) icons that face the wall they're on and sit *on* it (not inside
it), toggleable measurements from the walls, a switch between the floor plan and the 3D top view, information on hover, and an
edit mode so nothing changes by mistake. The owner picked the default for every question (hybrid icon, along-wall + height
measurements, edit mode off by default, points + room names over the 3D view).

**Symbols** (`src/data/electrical.ts`): every type now has a `glyph` (white body, stroked lines, filled dots). Sockets are the
Norwegian half circle with its flat side on the wall plus the two pin holes of a Schuko face, 6-gang is a wide plate with three pin
pairs, TV and RJ45 have their own marks, switches are a circle with a lever (two for two-way, half filled for a dimmer).
The palette buttons, the hover card and the legend use the same glyphs.

**On the wall** (`src/ui/plan2d.ts`): wall points (anything with a height, i.e. not "tak") attach to the nearest exposed face —
walls, base cabinets, low built-ins — with the parts of faces hidden inside other walls cut away. The symbol stands on the face
and is rotated to point into the room; its label sits on the room side, upright, and moves further out if it would overlap
another label. A point over a worktop goes on the wall *behind* it (the one facing the same way as the cabinet fronts), an island
socket on the island's side; upper cabinets never carry a point. Old points (saved 6 cm off the face, sometimes inside the wall)
are drawn on the face they belong to without being rewritten. Dragging redraws the symbol live, so it turns when dragged round a
corner. Snapping now puts a point exactly on the face.

**Measurements**: *Show measurements* draws chained dimensions along every wall (corner → point → point → corner, stopping at
door/window edges and free wall ends) and, for ceiling points, dashed lines to the nearest wall in x and y. The hovered or selected
point always gets its own dimensions to the corners, highlighted. Shared view flag `elMeasures`.

**Base**: *Floor plan* | *3D top view*. The 3D view is rendered by `renderTopView()` in `main.ts` — an orthographic camera
straight down, framed on the plan's own rectangle, so it lines up exactly — with the ceilings hidden, and embedded as an
`<image>` under the points and room names (so Print/PNG include it). Rendered only when shown and re-rendered after the model
changes. Shared view flag `elBase`. The render loop now idles while the el-plan is on screen.

**Hover card**: type (EN + NO), status, height, room, distance to the corner/door/window on each side (or to the walls for a ceiling
point) and the note.

**Edit mode**: the el-plan opens view-only every time. Hover and click show information; dragging pans. *Edit* (button or **E**)
shows the palette and *Clear plan* and unlocks placing, dragging, editing and **Delete**. The selected-point card is read-only while
locked.

Also: the live sheet and the printed/exported sheet now share one stylesheet (`PLAN_SVG_CSS`, scoped to `.plan2d` and injected
once), instead of two copies in `style.css` and `plan2d.ts`. A click on a point no longer clears the selection straight away
(pointer capture sent the click to the svg). `elBase` and `elMeasures` were added to the Worker's `sanitize()` so they reach KV.

Verified with headless Playwright on the live shared points (26): symbols face their walls, the counter socket moves onto wall J,
the balcony socket faces out, hover card, measurements on/off, 3D top view aligned, locked drag/Delete change nothing, edit-mode
drag round a corner, export SVG (with 3D base) rasterises, Dollhouse renders normally afterwards.
Renders: `docs/images/model-elplan.png`, `model-elplan-measures.png`, `model-elplan-3d.png`.
