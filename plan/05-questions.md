# Questions for the owner

Labels refer to `images/plantegning-annotert.png` (walls A–L red, doors D1–D7 blue, windows V1–V6 green,
balcony railing R1–R3 purple). Each question has my default in *italics*, so "default OK" is a valid answer.

## A. Placing your measurements
1. **Gang units and walls.** Are "knaggvegg 101", "badevegg 89", "kommodevegg 156.5" and "kott 94 × 79" in **cm**? Which labelled wall is each one?
   *Default: all cm. Knaggvegg = A, the coat-hook wall beside the front door. Kommodevegg = E, the dresser wall between D4 and D5. Badevegg = C.*
2. **Entry tiles, 1662 × 958.** *Default: the tiles start at the front door D1. They run 1662 along the door wall and 958 into the hall.*
3. **Stue "dybde kjøkkenøy vegg 3131".** Measured from the south wall F to what?
   *Default: to the south edge of the island, or to the short wall L.*
4. **Veranda "ved døra 80/85" and "ved vegg 110/122".** What are these numbers, and in which unit?
   *Guess: railing heights in cm (solid part / top rail), measured at R3 and R1.*
5. **Veranda "dybde bue start 1691".** Is this at the door end (R3) or the north end (R1)? The plan suggests the straight north part (R1) is only about 1.24 deep.
6. **Hovedsoverom.** Is "sengevegg" the north (top) wall and "skapvegg" the wall towards Kontor, where the wardrobe is? That would put D4 1244 from the north wall and 597 from the wardrobe wall.
7. **Tvstue.** Is the sofa wall the north wall (towards Kontor) or the south wall? Is "vinduskarm–vegg 778" measured to the south wall?

## B. Measurements I'm missing (measure if you can, otherwise I'll estimate)
8. **Wall thickness.** Exterior walls: measure the depth of the window reveal at V1 or the balcony door D7. Interior walls: measure at a door frame, e.g. D5.
   *Default: exterior 0.30 m, interior 0.10 m.*
9. **Windows V1, V2, V3, V4, V6.** Width, sill height and top height for each. Are all window tops at the same height?
   *Default: same style as V5. Width 1.5 m for V4/V6, 2.6 m for V1 (4 panes), 1.2 m for V2, 0.5 m for V3. Sill 0.915, top 2.25.*
10. **Doors.** Opening width × height for the interior doors, the front door and the balcony door.
    *Default: 0.80 × 2.05 interior, 0.90 × 2.10 front door, 0.80 × 2.20 balcony door.*
11. **Ceiling height** in the living room and entré. The ad says 2.58.
    *Default: 2.645 everywhere. The bathroom gets a lowered soffit about 2.30 high over the vanity and shower.*
12. **Kott.** The plan shows a washer/dryer niche north of the kott. Is that part of the kott, a separate cupboard, or something else?

## C. Scope and design
13. **Built-ins.** Should the kitchen (cabinets, island, column L) and the bathroom fittings be in the first version, or should it be completely empty?
    *Default: include them as simple built-in blocks that you can recolour. They are fixed, not furniture.*
14. **Walls.** You mentioned ceilings, floors and furniture. Should wall colours be changeable too?
    *Default: yes.*
15. **How to pick what to recolour.** Per room and surface in a side panel, or by clicking any single surface (so a single accent wall is possible)?
    *Default: both. Click a surface to select it, and a panel lists every room.*
16. **Look.** Flat colours, or subtle textures tinted by your colour (parquet planks, tiles)?
    *Default: tinted textures, with a switch to flat colours.*
17. **Navigation.** *Default: a "dollhouse" orbit view where the ceilings hide when you look from above, plus a first-person walk-through mode (WASD + mouse).*
18. **Level of detail.** *Default: door leaves (standing open), window frames with glass and glazing bars, skirting and cornices, simple radiators, the balcony with its railing. No surrounding building.*
19. **Saving.** *Default: colours save automatically in the browser. You also get export/import to a JSON file and a "reset to current colours" button.*
20. **Tech.** *Default: Vite + TypeScript + three.js, run locally with `npm run dev`. The geometry lives in a data file, so your later changes are easy to make.*
21. **Sun.** *Default: real orientation, with the balcony facing west. Optional time-of-day slider.*
22. **UI language.** *Default: Norwegian room names, English controls.* Or do you want all Norwegian?
