# Realism research (round 5): vinyl floor and scene lighting

## The floor: Bastion vinylgulv, 1-stav, Furu
Source: https://www.parkett.no/produkt/bastion-vinylgulv-1-stav-furu/

| Spec | Value |
|---|---|
| Plank | 1828 × 220 mm, 5.2 mm thick, single plank (1-stav) |
| Edges | Bevel (fas) on both long and short edges → a visible V-groove around every plank |
| Surface | UV lacquer over a 0.55 mm vinyl wear layer; satin, not glossy |
| Core | SPC with an underlay; wear class 34 |
| Look | Very light, pinkish-white pine with small dark knots and faint cathedral grain |

Reference images are in `plan/images/floor/`:
- `bastion-furu-swatch.jpg` (1200 × 636): a flat, evenly lit scan of the surface. This is the best texture source. It has no plank seams.
- `bastion-furu-owner-crop.png` (1364 × 708): the owner's screenshot of the same swatch.
- `bastion-furu-room.jpg` (4000 × 2500): a room render from the manufacturer. Use it only as a colour and scale reference, because it is in perspective.

## What the model does today
- Floors use flat `MeshStandardMaterial` colours (`stue.floor` etc., default oak `#d9bd8e`, roughness 0.9), with no textures.
- Lighting is ambient 0.9 + hemisphere 1.6 + one shadowed sun (PCF, 2048²). The high ambient light flattens everything: corners and
  wall/floor junctions get no darkening, which is the main reason it reads as CG.
- Floor UVs already equal plan metres (`polygonGeometry` → `ShapeGeometry` uses the shape's x/y). A texture that repeats every
  N metres will line up across all rooms and through doorways without any geometry changes.

## Methods, ranked by value for this app
The app's core feature is live colour editing, so methods that bake lighting into textures are ruled out as the main approach.

1. **PBR floor texture (the ask).** Build a plank layout in a canvas from the swatch: 220 mm rows, 1828 mm planks, a random stagger
   of at least 300 mm between rows (standard installation rule), each plank a random crop of the swatch (sometimes rotated 180°),
   a slight tint variation per plank, and a 1–2 mm dark bevel line. Generate matching maps:
   - `map` (sRGB colour space) and `anisotropy = renderer.capabilities.getMaxAnisotropy()`, which keeps grazing-angle floors sharp.
   - `normalMap`: the bevel grooves, plus fine grain derived from the swatch's luminance.
   - `roughnessMap`: satin lacquer about 0.45–0.55, rougher in the grooves.
   - Pattern tile of about 8 rows × 2 plank lengths (1.76 × 3.66 m) at 2048–4096 px, so the repeat isn't noticeable.
   - The swatch is only ~1200 px wide but a plank is 1.83 m long. So each plank uses the full swatch width, scaled along the grain
     (≈0.66 px/mm). Stretching along the grain is hard to see in wood.
2. **Environment lighting (IBL).** Use `RoomEnvironment` + `PMREMGenerator` → `scene.environment`, and lower the flat ambient/hemisphere
   light. This gives soft, directional fill and faint reflections on the lacquered floor. It's cheap, built into three.js, and needs no assets.
3. **Ambient occlusion.** `GTAOPass` (built into three r186) via `EffectComposer` → `RenderPass` → `GTAOPass` → `OutputPass`. It darkens
   corners, skirting lines, and the areas under cabinets and the island. This is the biggest single "CG → photo" step for interiors.
   The composer targets need MSAA (`samples: 4`) or an `SMAAPass`, because the composer turns off the canvas antialiasing.
   The `n8ao` npm package is a faster/cleaner alternative, but it's an extra dependency; start with GTAO.
4. **Softer sun shadows.** Use `PCFSoftShadowMap` (or VSM) and a tighter shadow camera for more resolution. Sun patches through
   the west windows on a textured floor are where the floor looks best.
5. **Tone mapping.** Keep `NeutralToneMapping`: it preserves hues, which matters because the owner is choosing paint colours.
   Tune exposure after IBL + AO.
6. **Quality toggle.** A "High quality" switch in the panel (AO + soft shadows), for weaker laptops and phones.

### Considered, not recommended now
- **Baked lightmaps (Blender → GLB)**: the best quality per frame and what the forum recommends for archviz, but the baked light
  would not update when colours change. That conflicts with the app's purpose.
  ([forum thread](https://discourse.threejs.org/t/achieving-realistic-ambience-in-architectural-three-js-scenes/89753))
- **Path tracing** ([three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer)): photoreal global illumination and colour bleeding, rendered
  progressively while the camera is still. It's a good fit for a later "Render photo" button, but too heavy for live navigation.
- **`WoodNodeMaterial`**: procedural wood for the WebGPU renderer only, and it can't match a specific product.
- **Tile textures** for the entry and bathroom: the owner excluded them from this round, and they need tile sizes first.

## Licensing note
The repo is public and deployed. A texture derived from parkett.no's product photo would be published with it. A CC0 texture
(ambientCG / Poly Haven pine planks, tinted to match) avoids that, but looks less like the exact product.
