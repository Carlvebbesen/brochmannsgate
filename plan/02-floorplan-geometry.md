# Brochmanns gate 14C, 4. etasje — Floor plan geometry spec

> **⚠️ REVIEW NOTE (main session, 2026-09-12): this reconstruction has a topology error — do not
> build from §4/§5 as-is.** The Entré is NOT a full-depth corridor beside the bedrooms. The plan and
> photos (36, 37, 38, 20) show: the living room's east wall *is* the bedroom column's west wall
> (Tvstue door opens straight from the living room), and the 1.102 m "gang" is only the short
> corridor between the end of the kitchen wall and the bedroom wall, in the upper part. Building
> width is therefore ≈ 0.2 + 5.488 + 0.1 + 3.03 + 0.2 ≈ **9.0 m**, not 10.22 m, and the bottom
> dimension chain (5.48 + 3.03) is consistent. "Dybde kjøkkenøy vegg 3131" is more likely south
> wall → kitchen island / column (L on the annotated plan), not a stepped north wall. The balcony
> sits in the NW recess: east side = kitchen/bad facade (V2, V3), south side = wall with balcony
> door (D7); "bredde 3325" runs N–S along the kitchen facade. See `00-summary.md` for the
> corrected understanding. **Superseded by `06-model-spec.md` and `src/data/apartment.ts`.**

Source image: `plan/images/plantegning.png` (1584×1456 px).
On-site measurements: `plan/04-user-measurements.md` (owner, 2026-09-12) — **these override the
plan drawing wherever the two conflict**, per the owner's own instruction.

This document is a best-effort reconstruction. The floor plan graphic is **not drawn to a single
consistent scale** (see "Reconciliation" and "Ambiguities" below) — pixel measurements were used
only to determine topology, adjacency, and proportions; all absolute sizes come from the printed
dimension labels and the owner's tape-measure numbers.

## 1. Method

- Measured all dimension-line tick positions with PIL/numpy pixel scans (`plan/scripts/*.py`),
  sub-pixel accurate to ~1px (~1cm).
- Cross-checked internal consistency of each dimension chain (top, bottom, left, right) by
  computing an implied px/m scale per segment.
  - Bottom chain (5.48 | 3.03) and right chain (2.73 | 2.75 | 3.08) are mutually consistent to
    within ~3% (scale ≈ 114–117 px/m) — trustworthy and to-scale.
  - Top chain segments 1.24/1.95/3.03 are consistent with the same scale; the 0.77 segment and the
    unlabeled gap are not (see ambiguities) — the **labels**, not the pixel lengths, are used.
  - Left chain (1.31 | 1.31 | 3.47) pixel lengths imply wildly different scales for each segment
    (123–185 px/m) — the balcony/bathroom area of the graphic is drawn schematically, not to
    scale. Labels are used; the graphic's shape is illustrative only.
- Dimensions are confirmed **interior (wall-to-wall)** per the owner (5488/3475/3084/3025/3022/
  2722/2751mm all match the plan labels exactly).
- Wall thickness estimated from pixel width of the wall fill: **exterior ≈ 0.20 m, interior ≈
  0.10 m** (not independently confirmed on site — flagged).

## 2. Coordinate system

- Origin (0, 0) = bottom-left **outer** corner of the living room / building footprint.
- **x** → east (right on drawing), **z** → north (up on drawing). **y** = vertical (up), used for
  wall/ceiling heights.
- All units meters.

## 3. Reconciliation: plan vs. on-site measurements

| Quantity | Plan label | Owner measurement | Resolution |
|---|---|---|---|
| Living room width | 5.48 | 5.488 | Use 5.488 (owner, matches plan) |
| Living room depth (balcony wall) | 3.47 | 3.475 | Use 3.475 (owner, matches plan) |
| Living room depth (kitchen-island wall) | — | 3.131 | New info: the north wall of the living room **steps** — 3.475 m deep along the balcony (west) side, 3.131 m deep along the kitchen-island/Entré side. Difference (0.344 m) is the Entré/kitchen recess. Used to build the living room's L-shaped polygon (§4). |
| Top bedroom (Hovedsoverom) | 3.03 × 2.73 | 3.022 × 2.722 | Owner values used |
| Middle bedroom (Kontor) | 3.03 × 2.75 | ~3.034 × 2.751 | Owner values used |
| Bottom bedroom (Tvstue) | 3.03 × 3.08 | 3.025 × 3.084 | Owner values used |
| Kott | 0.77 wide (plan) | 0.79 × 0.94 (owner, "ca") | Owner values used; treat as approximate ("ca") |
| Entré corridor width | (unlabeled gap ≈1.52, see §7) | 1.102 m | Interpreted as the width of the **narrow hallway** section of Entré running alongside the bedroom column (see §7 ambiguity) — this is *additional* to the 5.488 m living-room width, i.e. the plan's "5.48 + 3.03 = 8.51 m" bottom dimension chain under-counts total building width by roughly this corridor + 2 partition walls (~1.3 m). Flagged as an unresolved plan inconsistency. |
| Tiled entry zone | — | 1.662 × 0.958 | Placed inside Entré near the front door; exact position not confirmed |
| Top bedroom door | — | opening ≈ 0.881 m, 1.244 m from bed wall, 0.597 m from wardrobe wall | Used directly (§6) |
| Middle bedroom window | — | 1.497 m wide (frame 0.610 m from one end, 0.644 m from other, measured along the 2.751 m window wall) | Used directly (§7) |
| Bottom bedroom window | — | sill 0.915 m above floor; frame 0.778 m from a side wall (which side not specified) | Sill height used; window width estimated ~1.5 m by analogy, position along wall approximate — flagged |
| Balcony | 1.31/1.31/3.47 (schematic, not to scale) | facade width 3.325 m, depth at arc start 1.691 m, depth at apex 2.277 m, soffit height 2.720 m | Owner values used exclusively for balcony geometry (§8) |
| Ceiling height | — | living room 2.58 m (from listing text); bedrooms 2.637–2.652 m (avg 2.645 m) | Bad/Entré/Kott ceiling height not measured — assumed 2.60 m (interpolated) |

## 4. Rooms (interior floor polygons, meters, x/z)

Wall thickness assumed: exterior 0.20 m, interior 0.10 m (estimated, unconfirmed).

### Stue/Kjøkken (living room + kitchen) — L-shaped, area ≈ 17.9 m²
```
(0.20, 0.20) → (5.688, 0.20) → (5.688, 3.331) → (2.15, 3.331) → (2.15, 3.675) → (0.20, 3.675) → close
```
West portion (x 0.20–2.15, under Bad) is 3.475 m deep; east portion (x 2.15–5.688, under
Entré/Kott) is 3.131 m deep. Ceiling height 2.58 m.

### Bad (bathroom) — rectangle, 1.95 × 1.31 m ≈ 2.55 m²
```
(0.20, 3.775) → (2.15, 3.775) → (2.15, 5.085) → (0.20, 5.085) → close
```
North wall (z 5.085–5.285) is exterior (recessed facade). Ceiling height ≈2.60 m (assumed).

### Kott (storage/laundry) — rectangle, 0.79 × 0.94 m ≈ 0.74 m² (owner "ca" values)
```
(6.10, 8.017) → (6.89, 8.017) → (6.89, 8.957) → (6.10, 8.957) → close
```
Positioned adjacent to Hovedsoverom's west wall, at the true north of the building. Ceiling
height ≈2.60 m (assumed).

### Entré (hallway/foyer) — irregular, area ≈ 14–18 m² (large; functions as central hall)
```
(5.688, 0.20) → (6.890, 0.20) → (6.890, 8.017) → (6.100, 8.017) → (6.100, 8.957)
→ (2.250, 8.957) → (2.250, 3.331) → (5.688, 3.331) → close
```
This combines: a ~1.1 m wide corridor running the full building depth alongside the bedroom
column (giving access to all 3 bedroom doors), plus a wider foyer at the north end (front door,
Kott, Bad access). **This polygon is a reconstruction, not directly measured — see ambiguities.**
Ceiling height ≈2.60 m (assumed).

### Soverom 1 / Hovedsoverom (top-right bedroom) — 3.022 × 2.722 m ≈ 8.23 m²
```
(6.99, 6.235) → (10.02, 6.235) → (10.02, 8.957) → (6.99, 8.957) → close
```
Ceiling height 2.645 m.

### Soverom 2 / Kontor (middle-right bedroom) — 3.034 × 2.751 m ≈ 8.35 m²
```
(6.99, 3.384) → (10.02, 3.384) → (10.02, 6.135) → (6.99, 6.135) → close
```
Ceiling height 2.645 m.

### Soverom 3 / Tvstue (bottom-right bedroom) — 3.025 × 3.084 m ≈ 9.33 m²
```
(6.99, 0.20) → (10.02, 0.20) → (10.02, 3.284) → (6.99, 3.284) → close
```
Ceiling height 2.645 m.

### Balkong — see §8 for shape

## 5. Walls (approximate; centerline + thickness)

| ID | From | To | Thickness | Type |
|---|---|---|---|---|
| W-S | (0, 0) | (10.22, 0) | 0.20 | exterior (south) |
| W-E | (10.22, 0) | (10.22, 9.157) | 0.20 | exterior (east) |
| W-N | (2.25, 9.157) | (10.22, 9.157) | 0.20 | exterior (north, bedroom+Kott+foyer) |
| W-NW-step | (2.15, 9.157) | (2.15, 5.285) | 0.20 | exterior (recessed west face of foyer) |
| W-Bad-N | (0, 5.285) | (2.15, 5.285) | 0.20 | exterior (Bad north / recess ledge) |
| W-W | (0, 5.285) | (0, 0) | 0.20 | exterior (west, Bad + living room) |
| I-LR-Bad | (2.15, 0.20) | (2.15, 3.675)/(3.775-5.085) | 0.10 | interior (living room/Bad ↔ Entré) |
| I-LR-Entre-N | (2.25, 3.331) | (5.688, 3.331) | 0.10 | interior (living room north wall, east zone) |
| I-LR-Corridor | (5.688, 0.20) | (5.688, 3.331) | 0.10 | interior (living room ↔ Entré corridor) |
| I-Corridor-Bedrooms | (6.89, 0.20) | (6.89, 8.017) | 0.10 | interior (Entré ↔ bedroom column) |
| I-Bed-1-2 | (6.99, 6.135) | (10.02, 6.135) | 0.10 | interior (Hovedsoverom ↔ Kontor) |
| I-Bed-2-3 | (6.99, 3.284) | (10.02, 3.284) | 0.10 | interior (Kontor ↔ Tvstue) |
| I-Kott | (6.10, 8.017)-(6.89, 8.017)-(6.10, 8.957) | | 0.10 | interior (Kott walls) |

Overall building envelope ≈ 10.22 m (x) × 9.16 m (z) including the corridor — **larger than the
plan's own dimension-chain total of 8.51 m**; see §7 ambiguity #1.

## 6. Doors

| Door | Wall | Approx. center / range | Width | Hinge | Swing | Connects |
|---|---|---|---|---|---|---|
| Main entrance | recess wall, x≈3.0–3.8, z=5.285 | — | ≈0.9 m (est.) | left (est.) | swings south into Entré | Exterior ↔ Entré |
| Bad door | east wall of Bad, x=2.15 | z ≈ 3.85–4.35 | ≈0.7 m (est.) | south | swings south/east into Entré | Bad ↔ Entré |
| Kott door | south wall of Kott | x ≈ 6.10–6.6 | ≈0.6 m (est.) | west | swings into Kott | Entré ↔ Kott |
| Hovedsoverom door | west wall, z 6.832–7.713 | (measured) | **0.881 m (confirmed)** | south end (z=6.832) | swings north/east into room | Entré ↔ Hovedsoverom |
| Kontor door | west wall, near north end of its run | z ≈ 5.6–6.1 (est.) | ≈0.8 m (est.) | top | swings down/east into room | Entré ↔ Kontor |
| Tvstue door | west wall, near north end of its run | z ≈ 2.8–3.3 (est.) | ≈0.8 m (est.) | top | swings down/east into room | Entré ↔ Tvstue |
| Balcony door | west wall of living room, south portion | x=0.20, z ≈ 0.3–1.2 (est.) | ≈0.9 m (est.) | top | swings east into living room | Living room ↔ Balkong |

All door widths except Hovedsoverom's are visual estimates from the drawing's arc size, not
measured on site. Hinge/swing read directly off the plan's door-leaf arcs.

## 7. Windows

| Window | Wall | Range (along wall) | Width | Notes |
|---|---|---|---|---|
| Living room | west wall (x=0.20) | z ≈ 0.4–3.4 (long run, est.) | multi-panel, ~3 m total (est.) | Long window run shown as striped double-line pattern |
| Bad | west wall (x=0.20) | z ≈ 4.7–5.0 (near top, est.) | ≈0.5 m (est.) | Small window near Bad's north end |
| Kontor (middle bedroom) | east ext wall | z = 3.994 to 5.491 | **1.497 m (confirmed)** | Frame 0.610 m from one end, 0.644 m from other (measured along the 2.751 m wall) |
| Tvstue (bottom bedroom) | east ext wall | starts z ≈ 0.978 (confirmed offset) | ≈1.5 m (estimated width) | Sill height 0.915 m above floor (confirmed); far-side offset and true width **not confirmed** |
| Hovedsoverom (top bedroom) | east ext wall | z ≈ 7.0–8.6 (est.) | ≈1.5–1.8 m (est.) | Visible as long striped run in plan; no owner measurement |
| Kitchen area | west wall, near balcony door | x=0.20, z ≈ 1.3–2.0 (est.) | ≈0.7 m (est.) | Small window segment near balcony |

## 8. Balcony (Veranda)

Owner-confirmed: facade width **3.325 m**, depth at arc start **1.691 m**, depth at arc apex
**2.277 m**, soffit height **2.720 m**. The plan's own left-chain labels (1.31/1.31/3.47) describe
a *different, schematic* shape and are not used for the balcony itself (see ambiguity #3) — they
turned out (via owner data) to actually describe Bad's depth and the living-room depth, not the
balcony outline.

Modeled as: a base rectangle 3.325 (chord, along the building) × 1.691 m deep, flush against the
building's west wall, plus a circular-segment bulge on the outer (west) edge adding up to 0.586 m
more depth (2.277 − 1.691) at its center.
- Chord length L = 3.325 m, extra sagitta h = 0.586 m → circle radius R = h/2 + L²/(8h) ≈ **2.65 m**.
- Chord endpoints (in building coords, x=0 is the building's west wall):
  `(0.00, z0)` to `(0.00, z0 + 3.325)`, arc bulging to x = −2.277 at the midpoint
  (z0 + 1.6625), z0 placed so the balcony sits against the living room / Bad step (z0 ≈ 0.2,
  i.e. flush with the living-room's south wall — **not independently confirmed**, see ambiguity).
- Soffit/ceiling height 2.720 m.

This is a usable approximation for a 3D mesh (a rectangle + a circular arc extrusion) but the
true outline (visible in the source image as a stepped rectangular notch near the top, then a
rounded bulge lower down) is more complex; treat as simplified.

## 9. Fixed elements (approximate, not to be modeled as detailed furniture)

- **Kitchen counter**: L-shaped — runs along Bad's south exterior face (x 0.20–2.15, sink near the
  west end) then turns south for ~0.35 m at x≈2.05–2.15, then continues east along the living
  room's stepped north wall to roughly x≈3.4. Counter depth ≈0.6 m. Backsplash tile area
  confirmed by owner: 1.747 m wide × 0.527 m high (position along counter not confirmed).
- **Kitchen island**: freestanding, with 4-burner cooktop, roughly centered at x≈3.6–4.5,
  z≈1.6–2.3 m (south-central living room). Small wall stub at its east end (per plan graphic,
  purpose unclear — possibly a half-wall/pony wall).
- **Bathroom (Bad)**: shower (diagonal hatch icon) in SW corner ≈x0.3–0.9, z3.85–4.3; bathtub or
  vanity along the south wall ≈x0.9–1.8, z3.8–4.0; toilet (oval) near the east wall ≈x1.7–1.95,
  z3.9–4.3.
- **Kott**: two round icons along its north wall (washer/dryer or double basin) ≈x6.2–6.8,
  z8.75–8.95.
- **Wardrobe (Hovedsoverom)**: built-in along the south wall (shared with Kontor), roughly
  x 7.0–7.9, z 6.24–6.8 (shallow, ≈0.6 m deep) — "skapvegg" per owner.

## 10. Ambiguities / flags (read before modeling)

1. **Building width inconsistency**: the plan's bottom dimension chain (5.48 + 3.03 = 8.51 m)
   does not include the ~1.1 m Entré corridor confirmed by the owner. Total building width is
   therefore modeled as ≈10.22 m (living room 5.488 + wall + corridor 1.102 + wall + bedroom
   column 3.03 + exterior walls), ~1.7 m wider than the plan's own labeled total. **Unresolved —
   flag for the owner/original drawing if exact building footprint matters.**
2. **Left dimension chain (1.31 | 1.31 | 3.47) does not sum to the building's total depth**
   (8.56 m from the bedroom column). Resolved via owner data: these three numbers are not one
   continuous chain up the west facade — "3.47" is the living room's own depth (confirmed
   separately), and the two "1.31" values most likely correspond to (a) a recess/step and (b)
   Bad's own depth, not a continuous run to the true top of the building. This explains the
   inconsistency: the building has a large recessed area (occupied by Entré/foyer) north-west of
   Bad that these three numbers simply don't cover.
3. **Balcony shape**: the plan draws a stepped-notch + curved-bulge shape that is not to scale;
   the owner's 3 numbers (facade width, two depths) are used instead via a simplified
   rectangle+circular-arc model (§8). The true notch shape (visible in the image near the top of
   the balcony) is not precisely reproduced.
4. **Entré polygon** (§4) is a reconstruction from topology + the corridor width, not a direct
   measurement. Its exact shape, and the position of the front door, tiled entry zone
   (1.662×0.958 m), and the Bad/Kott doors within it, are approximate.
5. **Kott position**: placed adjacent to Hovedsoverom's west wall at the true north of the
   building, based on visual adjacency in the drawing — not independently confirmed by the owner.
6. **Wall thicknesses** (0.20 m exterior, 0.10 m interior) are pixel estimates, not measured on
   site.
7. **Ceiling heights** for Bad/Entré/Kott are assumed (interpolated ≈2.60 m) — not stated in the
   listing or the owner's measurements.
8. **Door widths/positions** are visual estimates read off the plan's arc graphics, except the
   Hovedsoverom door (confirmed 0.881 m opening, exact position along its wall).
9. **Window positions/widths** are visual estimates except Kontor's window (confirmed 1.497 m
   wide, exact position) and Tvstue's window sill height (confirmed 0.915 m; width and far offset
   are estimated).
10. **Owner measurements not placed on the plan** (meaning or reference point unclear):
    - Gang: "Knaggvegg (coat-hook wall): 101" — likely 1010 mm, but which wall/what it measures
      to is unclear.
    - Gang: "Badevegg (bathroom wall): 89 — liststart" — likely 890 mm from some reference to
      where the bathroom wall's skirting starts; reference point unknown.
    - Gang: "Kommodevegg gang (dresser wall), between skirting: 156.5" — likely 1565 mm; which
      wall segment this is has not been located on the plan.
    - Tvstue: "Varmeovn til sofavegg: 1213 mm" and "Dør vegg til varmeovn: 2962 mm" — these locate
      a radiator, not modeled (fixed elements list radiator as omitted).
    - Veranda: "Ved døra: 80/85" and "Ved vegg: 110/122" — units and meaning entirely unclear
      (could be cm heights, sill depths, or something else); **not used anywhere in this spec**.
    - Kjøkken backsplash (1747×527 mm) — size used in §9, but its exact position along the
      counter run is not specified by the owner and was not visible precisely enough in the plan
      to pin down.

## 11. ASCII sketch (approximate, not to scale, north = up)

```
                 (true north wall, bedroom col + Kott + foyer)
        +-------------------+-----------+-----------------------+
        |                   |   Kott    |                       |
        |                   +-----------+     Hovedsoverom      |
        |      Entré        |           |     (top bedroom)     |
        |   (foyer, wide)   |  corridor +-----------------------+
  +-----+                   |  (1.10m)  |                       |
  |     |....recess ledge...|           |        Kontor         |
  | Bad |                   |           |     (middle bedroom)  |
  +--+--+                   |           +-----------------------+
     |  (step, kitchen L)   |           |                       |
     |                      |           |        Tvstue         |
     |   Stue/Kjøkken       |           |     (bottom bedroom)  |
 (())|   (living/kitchen)   |           |                       |
 balc|                      |           |                       |
 ony |                      |           |                       |
     +----------------------+-----------+-----------------------+
                (south wall, origin at bottom-left)
```

(( )) = balcony bulge, attached to the west wall near the living room's south end.
