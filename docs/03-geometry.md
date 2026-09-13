# Model geometry

The source of truth is `src/data/apartment.ts`. This page summarises it. Source tags: **M** = measured by the owner, **P** = read off the plan, **E** = estimate.

## Coordinates
Metres. x = east (right on the plan), y = north (up on the plan). The origin is the inner south-west corner of Stue/Kjøkken.
Heights are above the apartment floor. In three.js, world x = plan x, world y = height, world z = −plan y.

Walls: exterior 0.30 (E), interior 0.10 (E), 0.20 towards the stairwell (E). Ceiling height 2.645 (M).

## Rooms (interior outlines)
| Room | Outline | Source |
|---|---|---|
| Stue/Kjøkken | 0–5.488 × 0–3.475. Kitchen part x 1.33–4.386 up to y 5.52. The strip east of the hallway ends at the corridor beam (y 3.50) | M + P |
| Entré | Corridor x 4.386–5.488 (1.102), y 3.50–5.67. It opens into the living room under a beam at y 3.50 and into the kitchen under a header (y 3.50–4.98). Vestibule x 3.40–5.488, y 5.67–7.332 | M |
| Bad | x 1.33–3.28, y 5.67–7.332 (1.95 × 1.662) | P + M |
| Kott | x 4.698–5.488, y 7.432–8.372 (0.79 × 0.94). Door in line with the front door; solid behind it | M |
| Hovedsoverom | x 5.588–8.618, y 6.035–8.757 (3.03 × 2.722) | M |
| Kontor | x 5.588–8.618, y 3.184–5.935 (3.03 × 2.751) | M |
| Tvstue | x 5.588–8.618, y 0–3.084 (3.03 × 3.084) | M |
| Balkong | East edge x 1.03, y 3.775–7.10 (3.325). Straight north edge 1.24 deep. Arc bulging west to 2.277 deep, meeting the building 1.691 deep at the door end. Floor −0.05, soffit +2.72 | M + P |

Building envelope ≈ 9.2 × 9.1 m including walls. The bottom dimension chain on the plan (5.48 + 3.03) is consistent with this.

## Walls
F south facade · G living-room west (V1) · H balcony-door wall (D7) · I kitchen/bathroom facing the balcony (V2, V3) ·
N1 bathroom north + front-door wall (D1) · A bathroom ↔ entry (D2) · J kitchen ↔ bathroom/entry (C = its entry face) ·
D corridor west side (y 4.98–5.52) · HDR beam over the corridor mouth, HDR2 header over the kitchen opening (both with underside at 2.10) ·
KW kott west (stairwell) · KS kott front (D3) · KN solid behind the kott ·
N north facade · E east facade (V4–V6) · K living room/entry ↔ bedrooms (D4, D5, O6) · B12, B23 between bedrooms.

## Doors and openings (width × height)
| Id | Where | Size | Source |
|---|---|---|---|
| D1 front door | Wall N1, hinged next to the bathroom corner, opens inwards (shown ajar) | 0.88 × 2.10 | Photo 38, size E |
| D2 bathroom | Wall A, 0.89 from the coat-hook corner (y 6.60–7.30), opens out into the entry (shown ajar) | 0.70 × 2.05 | M position, size E |
| D3 kott | Kott front, in line with the front door | 0.60 × 2.05 | E |
| D4 Hovedsoverom | 0.88 frame ending at the entry's north wall (7.332) | ≈0.80 × 2.05 | ⚠ measured 0.597 / 1.244 doesn't fit |
| D5 Kontor | Frame 1.565 south of D4's frame (y 4.05–4.85) | 0.80 × 2.05 | M |
| O6 Tvstue | Doorless opening, centred on the wall (y 0.392–2.692) | 2.30 × 2.10 | Owner request, head height E |
| D7 balcony | Wall H, glazed, opens into the living room | 0.80 × 2.20 | E |

## Windows (sill 0.915 M, top 2.25 E unless noted)
| Id | Room | Width | Notes |
|---|---|---|---|
| V1 | Stue | 2.60, 4 panes | P |
| V2 | Kjøkken, onto the balcony | 1.15, 2 panes, sill 1.00, y 3.95–5.10 (clear of the wall cabinets) | P + photo |
| V3 | Bad, onto the balcony | 0.50, 1 pane, 1.30–2.00 | E |
| V4 | Hovedsoverom | 1.50, 2 panes | E |
| V5 | Kontor | 1.497, 0.610/0.644 from the side walls | M |
| V6 | Tvstue | 1.50, 0.778 from the south wall | M (position) |

## Built-ins
- **Kitchen** (matched to the owner's photo): sink run along wall J, x 1.33–3.077 (= the 1.747 backsplash, M). Wall cabinets
  run from the window-wall corner, above the 0.527 backsplash, up to 2.25. Tall oven/fridge units x 3.077–4.286, also up to 2.25.
  Grey bulkhead from 2.25 to the ceiling, with two vent grilles over the tall units. The leg under V2 runs the full wall length, down to y 3.475 (owner).
  Island x 2.78–4.286, y 3.131–4.031 with hob; 3.131 from the south wall (M, owner confirmed the position). Island length and depth are E.
  Worktop height 0.90.
- **Bathroom**: shower glass at x 2.10, floating vanity + mirror cabinet, wall-hung WC, soffit at 2.30 along the south wall.
- **Radiators**: under V1, V4, V5, V6 (Tvstue radiator at 1.213–1.843 from the south wall, M).
- Removed on request: the Hovedsoverom wardrobe, and the short wall/column beside the island.
