/*
 * Furniture — added on top of the empty apartment shell. Positions are E (estimate): a sensible
 * starting layout the owner can drag into place in the model itself (dollhouse view).
 *
 * Movable pieces (`movable.ts` list below) can be dragged in the browser; their live position is
 * kept in `ColorStore.furniture` (src/core/state.ts), not here — these are only the defaults a
 * fresh visitor (or Reset) starts from. The Kontor wardrobes/desk and the wall-mounted TV are
 * built-ins (`src/build/kontor.ts`), not furniture, and never move.
 */

import { BED_X1, CEILING, HOV_Y1, K_X1, KON_Y0, KON_Y1, LIV_W, TV_Y1 } from './apartment';

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

export type FurnitureId = 'bed' | 'nightstandL' | 'nightstandR' | 'sofa' | 'tvBench' | 'diningTable' | 'skjenk';

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
