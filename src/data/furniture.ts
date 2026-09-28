/*
 * Furniture — added on top of the empty apartment shell. Positions are E (estimate): a sensible
 * starting layout the owner can drag into place in the model itself (dollhouse view).
 *
 * Movable pieces (`movable.ts` list below) can be dragged in the browser; their live position is
 * kept in `ColorStore.furniture` (src/core/state.ts), not here — these are only the defaults a
 * fresh visitor (or Reset) starts from. The Kontor wardrobes/desk and the wall-mounted TV are
 * built-ins (`src/build/kontor.ts`), not furniture, and never move.
 */

import { BALCONY_EDGE, BED_X1, CEILING, ENTRY_HOOK_WALL, HOV_Y1, K_X1, KON_Y0, KON_Y1, LIV_W, TV_Y1 } from './apartment';

export interface Pose {
  x: number;
  y: number;
  /** Radians, plan convention (0 = facing +x/east, positive = turned towards +y/north). */
  yaw: number;
}

export interface Footprint {
  /** Bounding-box size at yaw 0, in metres. */
  w: number;
  d: number;
}

export type FurnitureId =
  | 'bed'
  | 'nightstandL'
  | 'nightstandR'
  | 'sofa'
  | 'tvBench'
  | 'diningTable'
  | 'skjenk'
  | 'shoeBench'
  | 'grill'
  | 'balconySofa'
  | 'balconyTable';

const BED_W = 1.8;
const BED_D = 2.0;
const BED_WALL_GAP = 0.02; // E: kontinental base pushed almost flush to the headboard wall
const BED_CX = (K_X1 + BED_X1) / 2;
const BED_CY = HOV_Y1 - BED_WALL_GAP - BED_D / 2;

const NIGHT_W = 0.46;
const NIGHT_D = 0.4;
const NIGHT_CY = HOV_Y1 - BED_WALL_GAP - NIGHT_D / 2;

export const SOFA_W = 2.65;
export const SOFA_D = 2.18;
export const SOFA_ARM = 0.95; // E: seat + backrest depth of a straight sofa arm

export const TV_BENCH_W = 2.0;
export const TV_BENCH_D = 0.4;
export const TV_BENCH_Z0 = 0.35; // "floating" bench, off the floor
export const TV_BENCH_H = 0.49;
const TV_BENCH_WALL_GAP = 0.02;

// "Eikeskjenk 240": 2400 × 350 × 800 mm free-standing oak sideboard (owner's byggemanual).
export const SKJENK_W = 2.4;
export const SKJENK_D = 0.35;
export const SKJENK_H = 0.8;
export const SKJENK_LEG_H = 0.1;
const SKJENK_WALL_GAP = 0.02;

// 1898 Bäckebo skohylle med sitteplass (Nordic Nest), bjørk: 80 × 30 × 48 cm (product page), two slatted shoe shelves.
export const SHOE_BENCH_W = 0.8;
export const SHOE_BENCH_D = 0.3;
export const SHOE_BENCH_H = 0.48;
const ENTRY_WALL_CX = (ENTRY_HOOK_WALL.x0 + ENTRY_HOOK_WALL.x1) / 2;

// ---- Balcony (owner's reference image): grill in the north-east corner, sofa along the facade, bistro set on a round rug.
/** The balcony deck sits a little below the flat's floor; balcony pieces are built this far down in their group. */
export const BALCONY_FLOOR = -0.05;
// Weber Spirit E-325 (Jernia): 123 × 67.5 × 117 cm with both side tables up (product page), black.
export const GRILL_W = 1.23;
export const GRILL_D = 0.675;
export const GRILL_H = 1.17;
// IKEA NÄMMARÖ 2-seter, lys brunbeiset akasie, Frösön/Duvholmen beige: 162 × 92 × 87, seat height 43, seat depth 68 (product page).
// Two armless modules. Long side runs north–south along the facade, so the footprint is 92 (x) × 162 (y); back at +x (the wall).
export const BALCONY_SOFA_L = 1.62;
export const BALCONY_SOFA_D = 0.92;
export const BALCONY_SOFA_H = 0.87;
export const BALCONY_SOFA_SEAT_H = 0.43;
// Round jute rug (E: Ø 140) under a round wood-top coffee table (E: Ø 60, 45 high) and two folding bistro chairs.
export const BALCONY_RUG_R = 0.7;
const GRILL_WALL_GAP = 0.05;
const BAL_SOFA_Y0 = BALCONY_EDGE.y0 + 0.45; // E: keeps a clear step out of the balcony door

/** Folding chairs around the balcony table, in the table group's local frame (+x of a chair = the way it faces). */
export const balconyChairs: Pose[] = [
  { x: -0.5, y: 0.45, yaw: Math.atan2(-0.45, 0.5) },
  { x: -0.38, y: -0.52, yaw: Math.atan2(0.52, 0.38) },
];

/** Fixed pot plants (not draggable), plan positions; r = pot radius. */
export const balconyPlants = {
  olive: { x: BALCONY_EDGE.x - 0.24, y: BALCONY_EDGE.y1 - GRILL_WALL_GAP - GRILL_D - 0.3, r: 0.2 },
  hydrangeaBack: { x: BALCONY_EDGE.x - 0.7, y: BALCONY_EDGE.y1 - GRILL_WALL_GAP - GRILL_D - 0.26, r: 0.17 },
  hydrangeaFront: { x: -0.48, y: BALCONY_EDGE.y0 + 0.24, r: 0.2 },
  lavender: { x: BALCONY_EDGE.x - 0.2, y: BALCONY_EDGE.y0 + 0.22, r: 0.15 },
};

export const DINING_TABLE_W = 2.0;
export const DINING_TABLE_D = 0.95;

export const footprints: Record<FurnitureId, Footprint> = {
  bed: { w: BED_W, d: BED_D },
  nightstandL: { w: NIGHT_W, d: NIGHT_D },
  nightstandR: { w: NIGHT_W, d: NIGHT_D },
  sofa: { w: SOFA_W, d: SOFA_D },
  tvBench: { w: TV_BENCH_W, d: TV_BENCH_D },
  diningTable: { w: DINING_TABLE_W, d: DINING_TABLE_D },
  skjenk: { w: SKJENK_W, d: SKJENK_D },
  shoeBench: { w: SHOE_BENCH_W, d: SHOE_BENCH_D },
  grill: { w: GRILL_W, d: GRILL_D },
  balconySofa: { w: BALCONY_SOFA_D, d: BALCONY_SOFA_L },
  balconyTable: { w: BALCONY_RUG_R * 2, d: BALCONY_RUG_R * 2 },
};

// Casper armstol (Sleepo, hvitoljet ask/hvit) — M: 54×62×79 cm, seat height 44, armrest 65.
export const CHAIR_W = 0.54;
export const CHAIR_D = 0.62;
const SIDE_CHAIR_X = DINING_TABLE_W / 3; // three evenly spaced along each long edge

/**
 * Six chairs around the dining table, three per long edge, poses in the table's own local frame (they're
 * built as children of its group in `buildDiningTable`, so they translate — and would rotate — with it as
 * one unit). Pushed in so each chair's centre sits on the table edge — half tucked under the tabletop,
 * like a chair pushed in at home — rather than the full chair sitting outside the table's footprint.
 */
export const diningChairs: Pose[] = [
  { x: -SIDE_CHAIR_X, y: -DINING_TABLE_D / 2, yaw: Math.PI / 2 },
  { x: 0, y: -DINING_TABLE_D / 2, yaw: Math.PI / 2 },
  { x: SIDE_CHAIR_X, y: -DINING_TABLE_D / 2, yaw: Math.PI / 2 },
  { x: -SIDE_CHAIR_X, y: DINING_TABLE_D / 2, yaw: -Math.PI / 2 },
  { x: 0, y: DINING_TABLE_D / 2, yaw: -Math.PI / 2 },
  { x: SIDE_CHAIR_X, y: DINING_TABLE_D / 2, yaw: -Math.PI / 2 },
];

/** Starting layout; every yaw is 0 except where a piece needs to face into the room. */
export const furnitureDefaults: Record<FurnitureId, Pose> = {
  bed: { x: BED_CX, y: BED_CY, yaw: 0 },
  nightstandL: { x: (K_X1 + (BED_CX - BED_W / 2)) / 2, y: NIGHT_CY, yaw: 0 },
  nightstandR: { x: (BED_X1 + (BED_CX + BED_W / 2)) / 2, y: NIGHT_CY, yaw: 0 },
  // L-sofa bent into the Tvstue's south-east corner (below the window, away from the corridor opening).
  sofa: { x: BED_X1 - SOFA_W / 2, y: SOFA_D / 2, yaw: 0 },
  // Against the Tvstue wall facing Kontor (north wall, y = TV_Y1)
  tvBench: { x: (K_X1 + BED_X1) / 2, y: TV_Y1 - TV_BENCH_WALL_GAP - TV_BENCH_D / 2, yaw: 0 },
  diningTable: { x: 2.7, y: 1.7, yaw: 0 },
  // South wall of Stue (wall F), blank and window-free; front faces north into the room.
  skjenk: { x: LIV_W / 2, y: SKJENK_D / 2 + SKJENK_WALL_GAP, yaw: 0 },
  // Entry coat-hook wall, opposite the front door, under the hooks (owner's reference photo); front faces north.
  shoeBench: { x: ENTRY_WALL_CX, y: ENTRY_HOOK_WALL.y + 0.01 + SHOE_BENCH_D / 2, yaw: 0 },
  // Balcony, as in the owner's reference image: grill backed onto the north railing in the corner by the facade, facing south.
  grill: { x: BALCONY_EDGE.x - 0.01 - GRILL_W / 2, y: BALCONY_EDGE.y1 - GRILL_WALL_GAP - GRILL_D / 2, yaw: 0 },
  // Sofa back against the facade, facing west over the balcony.
  balconySofa: { x: BALCONY_EDGE.x - 0.01 - BALCONY_SOFA_D / 2, y: BAL_SOFA_Y0 + BALCONY_SOFA_L / 2, yaw: 0 },
  // Rug + table + chairs in the open middle, the rug just reaching under the sofa's front edge.
  balconyTable: { x: -0.42, y: 5.0, yaw: 0 },
};

/**
 * Wall-mounted on the entry's coat-hook wall, centred over the shoe bench (fixed, `src/build/entre.ts`).
 * Heights are E, read off the owner's reference photo: hooks at a usual coat height, the hat shelf just above.
 */
export const entryWall = {
  cx: ENTRY_WALL_CX,
  y: ENTRY_HOOK_WALL.y,
  // 1898 Allsarp knaggrekke 9 knagger, eik: 86 cm long, 6 cm deep (product page); rod and peg sizes E from the photo.
  hooks: { length: 0.86, depth: 0.06, rodR: 0.018, pegR: 0.0065, count: 9, endInset: 0.043, z: 1.7 },
  // Norrgavel Hyllplan Rundat, bjørk: 90 × 30 × 1.9 cm, rounded front corners, on two wooden consoles (28.5 cm).
  shelf: { length: 0.9, depth: 0.3, thickness: 0.019, top: 1.95, consoleDepth: 0.285, consoleH: 0.2, consoleInset: 0.12 },
};

/** Wall-mounted TV above the bench (fixed, not furniture). */
export const tv = {
  x: furnitureDefaults.tvBench.x,
  y: TV_Y1 - 0.03,
  z0: 1.0,
  z1: 1.7,
  width: 1.23,
  thickness: 0.05,
};

/** Kontor built-ins: a 6-door Pax wardrobe facing the bedroom, and a 4-door wardrobe + desk on the opposite wall. */
export const kontorMillwork = {
  ceiling: CEILING,
  doorTop: 2.36,
  depth: 0.6,
  pax: {
    // North wall (B12), facing Hovedsoverom. 6 doors × 0.5 m, centred on the 3.03 m wall.
    x0: K_X1 + (3.03 - 6 * 0.5) / 2,
    doorWidth: 0.5,
    doorCount: 6,
    y1: KON_Y1,
  },
  opposite: {
    // South wall (B23), facing Tvstue: a 100 cm (2-door) + 75 cm (2-door) wardrobe, then a legless desk.
    x0: K_X1,
    wardrobeWidth: 1.0 + 0.75,
    doorWidths: [0.5, 0.5, 0.375, 0.375],
    deskX1: BED_X1,
    y0: KON_Y0,
    deskTop: 0.75,
    deskThickness: 0.04,
  },
};
