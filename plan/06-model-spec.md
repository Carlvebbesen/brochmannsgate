# Model spec: decisions behind `src/data/apartment.ts`

Owner answers to `05-questions.md` (2026-09-12): gang values are in cm. Knaggvegg = A, kommodevegg = E and badevegg = C.
Entry tiles sit in front of the front door and bathroom door, with wood floor between them and the first bedroom.
3131 is measured from the island to the south wall. The balcony is low priority. Sengevegg = north and skapvegg = wardrobe wall.
In Tvstue the sofa wall is south and the 778 is measured from the south wall. The kott is empty. Built-ins are included,
walls are colourable, and colours are flat. Everything else takes the defaults.

Coordinates are in metres: x = east, y = north, with the origin at the inner SW corner of Stue/Kjøkken. The ceiling is 2.645 everywhere.
Walls are 0.30 exterior, 0.10 interior and 0.20 towards the stairwell (E).

## Rooms (interior)
| Room | Extent | Source |
|---|---|---|
| Stue/Kjøkken | 5.488 × 3.475 lower part; kitchen part x 1.33–4.286 up to y 5.52; strip x 4.286–5.488 up to the corridor beam (y 4.98) | M + P |
| Entré | corridor x 4.386–5.488 (1.102), vestibule x 3.40–5.488, y 5.67–6.98, nook in front of the kott up to y 7.717 | M + P |
| Bad | 1.95 × 1.31 | P |
| Kott | 0.79 × 0.94, empty, against the north wall | M |
| Hovedsoverom / Kontor / Tvstue | 3.03 × 2.722 / 2.751 / 3.084 | M |
| Balkong | 3.325 along the facade; depth 1.24 (north end, P), 1.691 (door end, M), 2.277 max (M); soffit 2.72 (M) | M + P |

## Doors (opening width × height)
| | Where | Size | Source |
|---|---|---|---|
| D1 front | north wall of the vestibule, next to the bathroom wall | 0.90 × 2.10 | E |
| D2 bathroom | wall A, y 6.12–6.82, opens out into the entré | 0.70 × 2.05 | E |
| D3 kott | kott front | 0.60 × 2.05 | E |
| D4 Hovedsoverom | frame 0.597 from the wardrobe wall and 1.244 from the bed wall | ≈0.80 × 2.05 | M |
| D5 Kontor | frame 1.565 south of D4's frame (kommodevegg) | 0.80 × 2.05 | M |
| D6 Tvstue | y 1.75–2.55, from the living room | 0.80 × 2.05 | P |
| D7 balcony | wall H, glazed | 0.80 × 2.20 | E |

## Windows (sill 0.915, top 2.25 unless noted)
V1 living room: 4 panes, 2.6 wide (P). V2 kitchen: 2 panes, 1.2 wide, sill 1.0 (P). V3 bathroom: 0.5 wide, 1.30–2.00 (E).
V4 Hovedsoverom: 1.5 wide (E). V5 Kontor: 1.497 wide, 0.610/0.644 from the side walls (M). V6 Tvstue: 1.5 wide, 0.778 from the south wall (M).

## Built-ins
- **Kitchen**: sink run along wall J, 1.747 long, matching the measured backsplash (0.527 high).
  Leg under V2, tall oven units by the corridor, island 3.131 from the south wall, column L at the island.
- **Bathroom**: shower glass, floating vanity, mirror cabinet, wall-hung WC, soffit at 2.30.
- **Hovedsoverom**: 0.6 deep wardrobe along the wall to Kontor.
- **Radiators**: under V1, V4, V5 and V6. Tvstue radiator 1.213 from the sofa wall (M).

## Changes requested by the owner (round 2)
- Wardrobe in Hovedsoverom removed.
- Short wall/column L beside the kitchen island removed.
- Tvstue: door D6 removed and replaced by a doorless 2.30 m opening (O6), centred on the wall, head 2.10 (E).
- Entry (tiles, doors, kott) and kitchen are reported wrong. Questions are in `07-questions-round2.md`.

## Known deviations and open points
1. **Kott/entré north end differs from the drawing.** D4's measured position (0.597/1.244) puts the door partly north
   of the vestibule's front wall. The model therefore extends the entré as a 0.79 wide nook in front of the kott, and the
   kott (0.94 deep) sits against the north wall. The drawing shows the kott door level with the front door instead. Check on site.
2. **Knaggvegg A = 1.01** doesn't fit: the vestibule is only 1.31 deep and also holds the bathroom door.
   Either the bathroom door is narrower or somewhere else, or the 1.01 measures part of the wall. Not used.
3. **Badevegg C = 0.89** is modelled as ~0.99 (bathroom width + wall, corridor 1.102). The difference is within "liststart".
4. Wall colours per bedroom come from the photos. It isn't certain which photographed room is Kontor and which is Tvstue.
5. The 02-floorplan-geometry.md reconstruction is superseded by this file and `src/data/apartment.ts`.
