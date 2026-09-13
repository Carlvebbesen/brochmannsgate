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
