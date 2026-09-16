# Open questions and known deviations

## Waiting for the owner
1. **Island size** (optional): the model uses 1.5 × 0.9 m. The position (3.131 from the south wall) is confirmed.
2. **Hovedsoverom door.** Measured 0.597 from the wardrobe wall and 1.244 from the bed wall, which puts the frame 6.63–7.51.
   But the tiles make the entry's north wall 7.33. The model keeps the 0.88 frame and ends it at 7.33
   (≈0.42 from the wardrobe wall). Please re-measure: distance from the Hovedsoverom door frame to the entry's front-door wall.
3. **Height not measured**: the top of the kitchen cabinets (2.25).
4. **Kitchen front layout** (optional): doors, drawers and appliance positions are a typical HTH layout (round 8), not taken
   from the real kitchen. Tell me which units differ (e.g. dishwasher side, fridge hinge, drawers vs doors).

## Waiting for the owner (furniture, round 11)
5. **TV-benk legs**: built "floating" (no legs, per the owner's wording) even though the linked Porto product photo shows visible
   wood legs. Say the word and it goes back on the floor.
6. **Rotate**: dragging only moves furniture, it doesn't rotate it. If a piece needs turning (e.g. the sofa the other way round),
   say so and it'll be edited in `src/data/furniture.ts`, or rotate-while-dragging can be added.
7. Bed, nightstand, TV-benk and desk sizes beyond the stated product dimensions (height, depth, drawer counts) are E (estimated
   from the product photos), not measured.

## Waiting for the owner (el-plan, round 16)
8. **The plan starts empty.** Nothing was invented about the flat's existing wiring — no existing sockets, switches or ceiling
   points are placed. Walk round with the plan open and drop the points that are there today as *Existing*, or send a list/photos
   per room and they'll be placed.
9. **Circuits (kurs)** are not modelled: a point has a type, a status, a height and a note, but no circuit number, and there is no
   fuse box symbol or cable routing. Say the word if the electrician wants the plan grouped or coloured by kurs.
10. **Fixed symbol orientation**: symbols are drawn upright and are not rotated to face along the wall they sit on. Readable, but
    not the convention on a formal el-tegning.

## Known deviations in the current model (el-plan, round 16)
- **Heavy/utility points are not in the palette** (cooker point, floor-heating thermostat, fuse box, floor outlet, outdoor
  socket) — the owner picked the outlet/data, switch and light sets. Adding more is a few lines in `src/data/electrical.ts`.
- **The plan is 2D only**: points are not shown in the 3D model, and the heights are a number on the sheet, not a position on a wall.
- **Print goes through a pop-up window**; if the browser blocks pop-ups, use *PNG* instead.

## Known deviations in the current model (dining chairs, round 15)
- **No collision box for the chairs**: they're built as children of the `diningTable` group so they move with it as one unit,
  but only the table itself has a drag obstacle/bounding-box footprint. Dragging the table right up against a wall could in
  theory let a chair clip through it — not visible at the table's current position, not worth the extra plumbing unless it
  becomes one.

## Known deviations in the current model (dimensions toggle, round 14)
- **Room size labels are bounding-box, not per-wall**: an L-shaped or irregular room's tag shows its overall envelope
  (max width × max depth), not the length of each wall — fine for the mostly-rectangular rooms here, but not exact for one that
  isn't.
- **Crowded near the entry**: with *Show dimensions* on, the small adjacent rooms (Kott, Bad, Entré) and nearby furniture tags can
  overlap on screen. No per-label collision avoidance was built — turn labels/dimensions off selectively if it's in the way.

## Known deviations in the current model
- **Bedroom wall colours** come from photos; which photo shows Kontor and which Tvstue is uncertain.
- **Estimates** (tag E in `src/data/apartment.ts`): wall thicknesses, most door widths, window heights, and the bathroom window size.
- **Vinyl texture** is derived from parkett.no's product photo and is published with the public repo and site (owner's choice).
- **Later (owner said yes, not yet built)**: realistic tiles for the entry and bathroom (needs the tile sizes), and a
  path-traced "Render photo" button.
- Doors are shown standing open or ajar (front door and bathroom door ajar, as in photo 38). They can't be opened or closed in the app yet.

## Resolved
- Entry tiles, doors, kott (round 3): see [04-changes.md](04-changes.md).
- Kitchen cabinet tops, bulkhead, and wall cabinets starting at the corner (round 3).
- Kitchen window counter: full wall length. Island position confirmed as built (round 4).
- Tvstue opening: approved as built (round 4).
