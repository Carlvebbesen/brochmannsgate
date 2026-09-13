# Brochmanns gate 14C, 4. etg — consolidated understanding

Status: answers received and the model is built. Geometry decisions are in `06-model-spec.md`; the source of truth is `src/data/apartment.ts`.

## Sources
| File | Content | Reliability |
|---|---|---|
| `01-finn-ad-findings.md` | Ad text: areas, materials, windows, heating | Good |
| `02-floorplan-geometry.md` + `floorplan.json` | Pixel analysis of plan | **Topology error** (see banner in file) — to be regenerated |
| `03-photo-findings.md` | 55 photos analysed, palette | Good, but its "Kott" photos (28–30) are actually **Hovedsoverom** |
| `04-user-measurements.md` | Owner's tape measurements | Authoritative |
| `images/plantegning-annotert.png` | Plan with labels A–L (walls), D1–D7 (doors), V1–V6 (windows), R1–R3 (railing) | Reference for Q&A |
| Matterport tour | https://my.matterport.com/show/?m=o5P3LBzLZqE | Not scraped |

## Corrected layout (north = up on plan; balcony faces west)
- **Envelope** ≈ 9.0 m (E–W) × ~8.9 m (N–S). All plan dimensions are interior.
- **Stue/Kjøkken** (5.488 wide): lower rectangle 5.488 × 3.475 (south wall F → balcony-door wall H).
  Upper part is shifted east (west side = kitchen wall I facing the balcony) and reaches up to the
  bad/kitchen wall J. L-shaped kitchen along J and I, island with hob, short wall/column L at the island's east end.
- **Entré**: vestibule inside front door D1 (tiled 1662 × 958 zone) with Bad door D2, Kott door D3,
  Hovedsoverom door D4; then a 1.102 m corridor between kitchen-wall end D and bedroom wall E, which
  opens straight into the living room. No wall between Entré and Stue.
- **Bad** ≈ 1.95 × 1.31, window V3 onto balcony. Shower + vanity + wall-hung WC along the south wall; boxed
  soffit over vanity/shower (photo 04).
- **Kott** ≈ 0.79 × 0.94 (owner), north of the vestibule; plan also shows a washer/dryer niche behind it.
- **Bedroom column** (3.03 wide) on the east facade: Hovedsoverom 3.022 × 2.722 (wardrobe along south wall),
  Kontor 3.034 × 2.751 (window 1.497 wide), Tvstue 3.025 × 3.084 (door D6 opens from the living room).
- **Balkong**: inset in the NW corner — building on its east side (V2, V3) and south side (D7); railing R1
  (straight, north) → R2 (arc, west) → R3 (back to building). 3.325 along facade, 1.691 → 2.277 deep, soffit 2.72.
  Solid rendered balustrade + steel rail on top, dark wood decking (photo 07).

## Heights
- Bedroom ceilings 2.637–2.652 (owner) → 2.645. Ad: 2.58 in living room. Balcony soffit 2.72.
- Window sill (Tvstue) 0.915.

## Materials & default palette (from photos)
| Surface | Colour |
|---|---|
| Floors (all but bad/vestibule) | light oak parquet `#D9BD8E` |
| Vestibule tile | grey stone tile `#8E8E8C` (photo 38 reads lighter than the agent's `#4B4B4C`) |
| Bad floor + walls | warm greige tile `#D8D2C7` |
| Walls Stue/Entré | sage-grey `#C1C7BA` |
| Walls Hovedsoverom / Kontor | sage green `#8FA090` / `#8A9884` |
| Walls Tvstue | cool grey-sage `#A9B0AC` |
| Ceilings | white `#F6F5F1` (with cornice) |
| Trim, doors, windows | off-white `#FBFBF8` |
| Kitchen fronts / worktop | graphite `#6E7274` / grey stone `#8F8C88` |
| Balcony decking / balustrade | `#4A4238` / `#EDE6D2` |
