# Build brief: "El-plan" — a 2D top view for planning electrical work

A self-contained implementation task. Hand this to a coding agent; it assumes no other context.

## 1. Goal

Add a third view mode to an existing 3D apartment model (Vite + TypeScript + three.js, no framework) called
**El-plan**: a flat, to-scale 2D floor plan on which the owner places electrical points — sockets, data outlets,
switches/dimmers and light points — to plan a rewiring job with an electrician.

Hard requirements:
1. **Top-down 2D**, drawn as SVG from the project's existing geometry data — not a top-down 3D camera. Symbols must
   stay crisp at any zoom and the sheet must print/export as something an electrician can read.
2. A **current → new** distinction, so the same sheet shows the flat today and the flat as planned.
3. Point types: **outlet 2-gang and 6-gang**, dimmers, switches, actual light points, and internet/TV outlets.
4. **Editing is admin-gated** the same way the rest of the app already is (shared settings behind a password;
   without it, edits stay local to the browser).

## 2. Assumptions about the host project

Adapt the names; the shape is what matters.

| The project must already have | Used for |
|---|---|
| A geometry module (`src/data/apartment.ts`) exporting `rooms` (id, name, polygon `[x,y][]`, optional `labelAt`, `outdoor`), `walls` (axis-aligned `{id, kind, x0, x1, y0, y1}`), `openings` (`{id, wall, from, to, kind: 'door'\|'window'\|'opening', door?: {hinge:'from'\|'to', swing:'+x'\|'-x'\|'+y'\|'-y'}}`), built-ins (`fixtures`, `kitchenRuns`) and `balcony` | Drawing the plan shell |
| Plan coordinates in **metres**, x = east, y = north | The SVG is drawn 1 unit = 1 m |
| A settings store (`ColorStore` in `src/core/state.ts`) with `onChange`, a debounced `onPersist`, a `toJSON()`/`apply()` file shape and a `view` object | Persisting the points |
| A Cloudflare Worker (`worker/index.ts`) that validates and stores that file in KV behind a password | Sharing the plan |
| A side panel (`src/ui/panel.ts`) with a `Mode` union and mode buttons | Hosting the new UI |
| Movable furniture with footprints and poses (optional) | Drawing furniture outlines under the plan |

`openings[].from`/`to` are absolute plan coordinates along the wall's long axis. A wall is horizontal when
`x1 - x0 >= y1 - y0`.

## 3. Data model — `src/data/electrical.ts` (new)

```ts
export type ElStatus = 'existing' | 'new' | 'remove';

export interface ElectricalItem {
  id: string;
  type: ElTypeId;
  x: number; y: number;            // plan metres
  status: ElStatus;
  height?: number | null;          // cm above floor; null = ceiling; undefined = the type's default
  note?: string;
}
```

A catalogue of 11 types, each `{ id, code, label, no, group, height, symbol }` — `code` is the short tag printed on
the plan, `no` the Norwegian name for the printed sheet, `height` the default mounting height in cm (`null` = in the
ceiling), `symbol` an SVG path drawn in a ±1 box:

| group | id / code | label | default height |
|---|---|---|---|
| Outlets & data | `outlet2` "2", `outlet6` "6", `tv` "TV", `net` "NET" | Outlet 2-gang / 6-gang, TV-antenna, RJ45 | 20 cm |
| Switches | `dimmer` "D", `switch` "B", `switch2` "B2" | Dimmer, switch, two-way switch | 110 cm |
| Lights | `ceiling` "L", `wallLight` "V", `spot` "S", `led` "LED" | Ceiling light, wall light, downlight, LED strip | ceiling (`null`), wall light 180 |

Symbols follow the usual Norwegian plan convention (NS 3931-ish) and are shared between types:

```ts
const SOCKET = 'M -1 0 L 1 0 M -0.78 0 A 0.78 0.78 0 0 1 0.78 0 Z M 0 -0.78 L 0 -1.5'; // half disc on its wall line
const SWITCH = 'M 0 1.5 L 0 0.35 M -0.9 -0.95 L 0 0.35';                                 // stem + lever
const LIGHT  = 'M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 M -0.71 -0.71 L 0.71 0.71 M -0.71 0.71 L 0.71 -0.71';
```

Also export `SYMBOL_R = 0.13` (symbol radius in metres), `elType(id)`, `itemHeight(item)` (own height, else the type
default), `formatHeight(h)` (`null` → `"tak"`), and `isElTypeId` / `isElStatus` guards for the loaders.

## 4. Current → new

Status lives **on the point**, not in two parallel layers — the same socket is never entered twice. A view setting
`elPhase` filters what is drawn:

| phase | shows | meaning |
|---|---|---|
| `today` | `existing` + `remove` | what is on the walls now |
| `planned` | `existing` + `new` | what the flat ends up with |
| `compare` (default) | everything | grey `#8a8f94` / blue `#1f6fd0` / red `#c0392b` + a cross through the symbol |

## 5. The renderer — `src/ui/plan2d.ts` (new)

A `Plan2D` class: `constructor(host, store, { select(id), place(type, x, y) })`, plus `setTool`, `setSelected`,
`refresh`, `fit`, `toSVG`.

**Coordinates.** SVG y = −(plan y); no flipping transform (it would mirror the text). Every element is drawn at
`(x, -y)`. The `viewBox` is in metres, so the drawing is to scale by construction. Content bounds = all rooms, walls
and the balcony, plus ~0.9 m of paper margin and ~3.4 m of extra height under the plan reserved for the legend.

**Layers**, in order: `shell` (static) → `furniture` → `items` → `legend`.

**Walls with real holes.** For each wall, collect its openings, sort by position, and emit one `<rect>` per solid
stretch between them:

```
let cursor = a0; const segments = [];
for (const [from, to] of holes) { if (from > cursor) segments.push([cursor, from]); cursor = Math.max(cursor, to); }
if (cursor < a1) segments.push([cursor, a1]);
```

Then per opening: a **window** gets a glass line down the wall centre plus a jamb line on each face; a doorless
**opening** gets a dashed line; a **door** gets a leaf at 90° plus its swing arc. Draw the arc as a 12-segment
polyline from the hinge — SVG arc sweep flags are easy to get wrong once y is negated:

```ts
for (let i = 0; i <= 12; i++) {
  const a = (i / 12) * (Math.PI / 2);
  const px = H[0] + width * (across[0] * swingSign * Math.cos(a) + along[0] * sign * Math.sin(a));
  const py = H[1] + width * (across[1] * swingSign * Math.cos(a) + along[1] * sign * Math.sin(a));
}
```
where `along` is the wall's long axis, `across` its normal, `sign = hinge === 'from' ? 1 : -1` and
`swingSign = swing.startsWith('+') ? 1 : -1`.

**Also draw**: room polygons with the name (uppercase) and area in m²; built-ins (`kitchenRuns`, and `fixtures` that
are neither ceiling-mounted nor above ~1.6 m) as light outlines — they decide where a socket can physically go; and,
behind a *Show furniture* toggle, each movable piece's footprint as a dashed rectangle at its live pose.

**Points.** Per item: a white halo circle (legibility over room labels), a transparent larger hit circle, the symbol
path inside `transform="scale(SYMBOL_R)"`, a `<title>` for hover, a red cross when `status === 'remove'`, and a label
`CODE·HEIGHT` (e.g. `2·20`, `L·tak`) with the note on a second line. Points within 30 cm of an already-drawn point
push their label down one line (`stack * 0.32`), or a socket and a data outlet on the same spot print on top of each
other.

**Legend / title block**, drawn in world coordinates under the plan so it is part of the exported sheet: title, the
phase in Norwegian, the date, "mål i meter, høyder i cm over gulv"; then the types actually in use in two columns
(symbol, code, Norwegian name, counts like `2 eks · 1 ny · 1 ut`), a status key in a third column, and a 1 m scale
bar at the right. Two columns, not three — the Norwegian names are long enough to overrun a third of the sheet.

## 6. Interaction

- **Pan**: drag the background (pointer capture; convert pixel delta to metres with the current scale).
- **Zoom**: wheel, anchored at the cursor, clamped to ≈1.2 m … 2.5× the content width.
- **Place**: with a type armed in the panel, a click drops a point there and selects it. The tool stays armed for
  repeat placement until Esc.
- **Snap**: to the nearest wall/cabinet/fixture face within 0.4 m — project onto each of the rectangle's four edges,
  take the closest, and offset 6 cm along the normal **towards the cursor** so the symbol sits on the room side of
  the wall. Otherwise round to a 5 cm grid. **Alt** disables snapping.
- **Drag** a point: move its `transform` live, commit to the store on pointer-up (only if it actually moved, so a
  plain click still selects).
- **Keys** (only in this mode, and not while typing in an input): Esc clears the tool and the selection;
  Delete/Backspace removes the selected point.

Pixel → plan conversion must account for `preserveAspectRatio="xMidYMid meet"` letterboxing:

```ts
const scale = Math.min(rect.width / vbW, rect.height / vbH);
const offX = (rect.width - vbW * scale) / 2, offY = (rect.height - vbH * scale) / 2;
const x = vbX0 + (e.clientX - rect.left - offX) / scale;
const y = vbY1 - (e.clientY - rect.top - offY) / scale;
```

## 7. Panel section — `src/ui/electrical.ts` (new)

Rendered into a `<section id="electrical">` in the existing panel, visible only in the new mode:
phase switch (Today / Planned / Compare) · *Show furniture* · the editor for the selected point (type `<select>`,
status segmented control, height number input, "In the ceiling" checkbox that sets `height: null`, note field,
position readout, Delete) · the palette grouped by `ElType.group`, each button arming/disarming its type · a
`n existing / n new / n removed` summary · *Fit*, *Print*, *PNG*, *Clear plan* (confirm). When nothing is selected,
show the hint text (how to place, Alt, Delete, Esc).

Also export `newItem(type, x, y)` → a fresh item with a generated id and `status: 'new'`.

## 8. Mode switching

Extend the panel's `Mode` union with `'plan'` and add a third mode button. Entering the mode: hide the WebGL canvas
and the CSS2D label layer with `style.visibility`, show the plan host, disable the orbit and walk controllers.
Leaving it: clear the selection and the armed tool, re-enable orbit, then fall through to the existing
orbit/walk switching. Add a `.planning` class on the panel that hides the 3D-only controls, the colour selection
card and the colour groups, and reveals the el-plan section.

**Export/print**: `toSVG()` clones the live SVG, sets the `viewBox` to the full content bounds, and prepends a
`<style>` with the same rules the live sheet uses (exported as a string constant, so live and exported look
identical). Print opens a window with `@page { size: A3 landscape }` and calls `print()` — warn the user if it is
pop-up blocked and point them at PNG. PNG rasterises the serialised SVG through an `Image` onto a 2× canvas with a
white backdrop, then downloads via `toBlob`.

## 9. Persistence

Add `electrical: ElectricalItem[]` to the store with `addElectrical` / `updateElectrical` / `removeElectrical` /
`clearElectrical`, each emitting a `{ type: 'electrical' }` change so the existing debounced save runs. Add
`elPhase` and `elFurniture` to the view settings. Bump the settings file version and validate on load: drop items
without a known type, a valid status or finite coordinates; cap the list (≈500) and the note length.

**The colour Reset must not clear the el-plan** — a colour experiment should never delete the wiring. The panel's
own *Clear plan* does that, behind a confirmation.

> **Do not skip:** the Worker's validator rebuilds the settings document field by field and silently drops anything
> it does not know about. Add `electrical` (and re-check every other field that the client writes — in this project
> the furniture positions and one view flag turned out to have been dropped on every save for several rounds, so
> they only ever survived in localStorage). Raise the request body limit to fit the points (64 KB → ~192 KB).

## 10. Verification

Headless Playwright against the dev server (`--use-angle=swiftshader`), asserting rather than eyeballing:

- Switch to the mode, seed a dozen points of mixed types/statuses through `window.<debugHandle>.store`, screenshot.
- `Today` and `Planned` draw the expected subset (`.plan2d .point` count).
- Arm a type, click the plan → a point is created at the clicked spot, snapped, and selected.
- Drag a point → the store's coordinates change after pointer-up.
- `toSVG()` parses via `DOMParser` with no `parsererror`, and an `Image` loads it (PNG path).
- No `pageerror` / console errors; switching back to the 3D mode restores the scene and the colour panel.

Then review the screenshot for overlap: legend columns running into each other, point labels colliding, room names
under symbols.

## 11. Pitfalls found the hard way

- **Stroke width under a scale transform**: the symbol paths live inside `scale(0.13)`, so a stroke of `0.17` renders
  as ~2 cm. Do **not** reach for `vector-effect: non-scaling-stroke` — it resolves against the outer viewport, i.e.
  metres, and produces 14 cm thick lines.
- **Text and flipping**: negate y per element; a `scale(1,-1)` wrapper mirrors every label.
- **A segmented control** with three buttons needs its grid columns changed from the two-column default — otherwise
  the third wraps onto its own row.
- **Everything in the panel that is not 3D-specific** (sun slider, quality toggles) should still be hidden in this
  mode; hide `.controls > :not(.seg)` rather than listing them.
- Start the plan **empty**. Do not invent the flat's existing wiring — the owner walks round and places what is
  actually there, marked `existing`.
