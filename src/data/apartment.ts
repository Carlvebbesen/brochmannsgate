import type { Balcony, Fixture, FloorZone, Opening, Rect, Room, Side, Vec2, Wall } from './types';

/*
 * Brochmanns gate 14C, 4. etasje — geometry source of truth.
 *
 * Plan coordinates in metres: x = east (right on the floor plan), y = north (up on the plan).
 * Origin = inner south-west corner of Stue/Kjøkken. Heights are above the apartment floor.
 * Comment tags: M = measured on site by the owner, P = read off the floor plan, E = estimate.
 * Background for every number: plan/06-model-spec.md
 */

export const CEILING = 2.645; // M: 2.637–2.652 in Kontor, used everywhere

const EXT = 0.3; // E: exterior wall thickness
const INT = 0.1; // E: interior wall thickness
const STAIR = 0.2; // E: walls towards the common stairwell

// ---- Stue/Kjøkken
const LIV_W = 5.488; // M: width
const LIV_D = 3.475; // M: south wall → balcony-door wall

// ---- Bedroom column along the east facade (widths M: 3.022–3.034)
const K_X1 = LIV_W + INT;
const BED_X1 = K_X1 + 3.03;
const TV_Y1 = 3.084; // M: Tvstue depth
const KON_Y0 = TV_Y1 + INT;
const KON_Y1 = KON_Y0 + 2.751; // M: Kontor depth
const HOV_Y0 = KON_Y1 + INT;
const HOV_Y1 = HOV_Y0 + 2.722; // M: Hovedsoverom depth

// ---- Kitchen / bathroom block (west side of the upper half)
const KIT_X0 = 1.33; // P: inner face of the wall facing the balcony (plan 1.24 + wall)
const J_Y0 = 5.52; // P: kitchen face of the kitchen/bathroom wall
const J_Y1 = J_Y0 + 0.15;
const BAD_X1 = KIT_X0 + 1.95; // P: bathroom width
const BAD_Y1 = J_Y1 + 1.662; // M: entry depth = tile length (coat-hook wall → front-door wall); the bathroom shares it
const A_X1 = BAD_X1 + 0.12; // bathroom east wall (wall A, "badevegg")

// ---- Entré
const CORR_X0 = LIV_W - 1.102; // M: corridor width 1.102 (coat-hook wall C ≈ 1.01 from the bathroom wall)
const KOPEN_Y = 4.98; // P: south end of wall D, where the kitchen ↔ corridor opening starts
const MOUTH_Y = 3.5; // P: corridor opens into the living room under a beam (south end of the removed pier L)
const KOTT_X0 = LIV_W - 0.79; // M: kott width 0.79
const KS_Y0 = BAD_Y1; // kott door in line with the front door (photo 38, plan)
const KOTT_Y0 = KS_Y0 + INT;
const KOTT_Y1 = KOTT_Y0 + 0.94; // M: kott depth 0.94
const TILE_X1 = A_X1 + 0.958; // M: tiles end between the front door and the kott door

// ---- Balcony (inset in the north-west corner)
const BAL_X = KIT_X0 - EXT; // outer face of the kitchen/bath facade
const H_Y1 = LIV_D + EXT; // outer face of the balcony-door wall
const BAL_Y1 = H_Y1 + 3.325; // M: width along the facade 3.325

// ---- Kitchen
const WORKTOP = 0.9;
const CAB_TOP = 2.25; // E: common top of wall and tall cabinets, bulkhead above (photo)
const BACKSPLASH = 0.527; // M
const RUN_X1 = KIT_X0 + 1.747; // M: tiled backsplash width = sink run length
const ISLAND_Y0 = 3.131; // M: south wall → kitchen island (owner confirmed this position)

// ---------------------------------------------------------------------------------------------

export const rooms: Room[] = [
  {
    id: 'stue',
    name: 'Stue/Kjøkken',
    ceilingHeight: CEILING,
    labelAt: [2.6, 1.6],
    polygon: [
      [0, 0],
      [LIV_W, 0],
      [LIV_W, MOUTH_Y],
      [CORR_X0, MOUTH_Y],
      [CORR_X0, KOPEN_Y],
      [CORR_X0 - INT, KOPEN_Y],
      [CORR_X0 - INT, J_Y0],
      [KIT_X0, J_Y0],
      [KIT_X0, LIV_D],
      [0, LIV_D],
    ],
  },
  {
    id: 'entre',
    name: 'Entré',
    ceilingHeight: CEILING,
    labelAt: [4.75, 5.5],
    polygon: [
      [CORR_X0, MOUTH_Y],
      [LIV_W, MOUTH_Y],
      [LIV_W, BAD_Y1],
      [A_X1, BAD_Y1],
      [A_X1, J_Y1],
      [CORR_X0, J_Y1],
    ],
  },
  {
    id: 'bad',
    name: 'Bad',
    ceilingHeight: CEILING,
    polygon: [
      [KIT_X0, J_Y1],
      [BAD_X1, J_Y1],
      [BAD_X1, BAD_Y1],
      [KIT_X0, BAD_Y1],
    ],
  },
  {
    id: 'kott',
    name: 'Kott',
    ceilingHeight: CEILING,
    polygon: [
      [KOTT_X0, KOTT_Y0],
      [LIV_W, KOTT_Y0],
      [LIV_W, KOTT_Y1],
      [KOTT_X0, KOTT_Y1],
    ],
  },
  {
    id: 'hovedsoverom',
    name: 'Hovedsoverom',
    ceilingHeight: CEILING,
    labelAt: [7.1, 7.6],
    polygon: [
      [K_X1, HOV_Y0],
      [BED_X1, HOV_Y0],
      [BED_X1, HOV_Y1],
      [K_X1, HOV_Y1],
    ],
  },
  {
    id: 'kontor',
    name: 'Kontor',
    ceilingHeight: CEILING,
    polygon: [
      [K_X1, KON_Y0],
      [BED_X1, KON_Y0],
      [BED_X1, KON_Y1],
      [K_X1, KON_Y1],
    ],
  },
  {
    id: 'tvstue',
    name: 'Tvstue',
    ceilingHeight: CEILING,
    polygon: [
      [K_X1, 0],
      [BED_X1, 0],
      [BED_X1, TV_Y1],
      [K_X1, TV_Y1],
    ],
  },
];

/** Entry tiles in front of the front door and the bathroom door (M: 0.958 out from the bathroom wall × 1.662 full depth). */
export const floorZones: FloorZone[] = [
  {
    key: 'entre.tiles',
    polygon: [
      [A_X1, J_Y1],
      [TILE_X1, J_Y1],
      [TILE_X1, BAD_Y1],
      [A_X1, BAD_Y1],
    ],
  },
];

// Letters match plan/images/plantegning-annotert.png where the wall is labelled there.
export const walls: Wall[] = [
  { id: 'F', kind: 'exterior', x0: -EXT, x1: BED_X1 + EXT, y0: -EXT, y1: 0 }, // south facade
  { id: 'G', kind: 'exterior', x0: -EXT, x1: 0, y0: 0, y1: H_Y1 }, // living room west (V1)
  { id: 'H', kind: 'exterior', x0: -EXT, x1: BAL_X, y0: LIV_D, y1: H_Y1 }, // balcony door wall (D7)
  { id: 'I', kind: 'exterior', x0: BAL_X, x1: KIT_X0, y0: LIV_D, y1: BAD_Y1 + EXT }, // kitchen/bath facing balcony (V2, V3)
  { id: 'N1', kind: 'exterior', x0: KIT_X0, x1: KOTT_X0 - STAIR, y0: BAD_Y1, y1: BAD_Y1 + EXT }, // bath north + front door wall
  { id: 'A', kind: 'interior', x0: BAD_X1, x1: A_X1, y0: J_Y1, y1: BAD_Y1 }, // bath ↔ entré (D2)
  { id: 'J', kind: 'interior', x0: KIT_X0, x1: CORR_X0, y0: J_Y0, y1: J_Y1 }, // kitchen ↔ bath / entré (C)
  { id: 'D', kind: 'interior', x0: CORR_X0 - INT, x1: CORR_X0, y0: KOPEN_Y, y1: J_Y0 }, // corridor west side
  { id: 'HDR', kind: 'beam', x0: CORR_X0, x1: LIV_W, y0: MOUTH_Y, y1: MOUTH_Y + INT, bottom: 2.1 }, // beam over the corridor mouth
  { id: 'HDR2', kind: 'beam', x0: CORR_X0 - INT, x1: CORR_X0, y0: MOUTH_Y, y1: KOPEN_Y, bottom: 2.1 }, // header over the kitchen ↔ corridor opening
  { id: 'KW', kind: 'exterior', x0: KOTT_X0 - STAIR, x1: KOTT_X0, y0: BAD_Y1, y1: HOV_Y1 }, // kott west (stairwell)
  { id: 'KS', kind: 'interior', x0: KOTT_X0, x1: LIV_W, y0: KS_Y0, y1: KOTT_Y0 }, // kott front (D3)
  { id: 'KN', kind: 'interior', x0: KOTT_X0, x1: LIV_W, y0: KOTT_Y1, y1: HOV_Y1 }, // solid behind the kott
  { id: 'N', kind: 'exterior', x0: KOTT_X0 - STAIR, x1: BED_X1 + EXT, y0: HOV_Y1, y1: HOV_Y1 + EXT }, // north facade
  { id: 'E', kind: 'exterior', x0: BED_X1, x1: BED_X1 + EXT, y0: 0, y1: HOV_Y1 }, // east facade (V4–V6)
  { id: 'K', kind: 'interior', x0: LIV_W, x1: K_X1, y0: 0, y1: HOV_Y1 }, // living/entré ↔ bedrooms (D4–D6)
  { id: 'B12', kind: 'interior', x0: K_X1, x1: BED_X1, y0: KON_Y1, y1: HOV_Y0 }, // Kontor ↔ Hovedsoverom
  { id: 'B23', kind: 'interior', x0: K_X1, x1: BED_X1, y0: TV_Y1, y1: KON_Y0 }, // Tvstue ↔ Kontor
];

// ---- Doors. Interior opening 0.80 × 2.05 (E) unless measured.
const DOOR_H = 2.05;
// D4: measured 0.597 (wardrobe wall) / 1.244 (bed wall) would put the frame at 6.63–7.51, past the entry's north
// wall at 7.33 (from the tile length). The 0.881 frame is kept and slid south to fit – check on site.
const D4_FRAME_TO = BAD_Y1;
const D4_FRAME_FROM = D4_FRAME_TO - 0.881;
const D5_FRAME_TO = D4_FRAME_FROM - 1.565; // M: "kommodevegg" 1.565 between the two door frames

const door = (
  id: string,
  name: string,
  wall: string,
  from: number,
  width: number,
  hinge: 'from' | 'to',
  swing: Side,
  top = DOOR_H,
  glazed = false,
  angle = 80,
): Opening => ({
  id,
  name,
  wall,
  from,
  to: from + width,
  bottom: 0,
  top,
  kind: 'door',
  door: { hinge, swing, angle, glazed },
});

const win = (
  id: string,
  name: string,
  wall: string,
  from: number,
  width: number,
  panes: number,
  bottom = 0.915, // M: sill height in Tvstue
  top = 2.25, // E
  transom: number | undefined = 0.62,
): Opening => ({
  id,
  name,
  wall,
  from,
  to: from + width,
  bottom,
  top,
  kind: 'window',
  window: { panes, transom },
});

export const openings: Opening[] = [
  // Front door hinged next to the bathroom corner, standing ajar (photo 38)
  door('D1', 'Inngangsdør', 'N1', A_X1 + 0.03, 0.88, 'from', '-y', 2.1, false, 25),
  // Bathroom door at the north end of wall A, after 0.89 of wall ("badevegg"); opens out into the entry
  door('D2', 'Baderomsdør', 'A', J_Y1 + 0.89 + 0.04, 0.7, 'from', '+x', DOOR_H, false, 20),
  door('D3', 'Kottdør', 'KS', KOTT_X0 + 0.095, 0.6, 'from', '-y'),
  door('D4', 'Hovedsoverom', 'K', D4_FRAME_FROM + 0.04, D4_FRAME_TO - D4_FRAME_FROM - 0.08, 'to', '+x'),
  door('D5', 'Kontor', 'K', D5_FRAME_TO - 0.04 - 0.8, 0.8, 'to', '+x'),
  // Tvstue opened up to the living room: 2.3 m wide opening, no door (centred on the wall, head 2.10 – E)
  { id: 'O6', name: 'Åpning Tvstue', wall: 'K', from: (TV_Y1 - 2.3) / 2, to: (TV_Y1 + 2.3) / 2, bottom: 0, top: 2.1, kind: 'opening' },
  door('D7', 'Balkongdør', 'H', 0.13, 0.8, 'from', '-y', 2.2, true),

  win('V1', 'Stue', 'G', 0.39, 2.6, 4),
  win('V2', 'Kjøkken', 'I', 3.95, 1.15, 2, 1.0), // clear of the wall cabinets in the corner
  win('V3', 'Bad', 'I', 6.4, 0.5, 1, 1.3, 2.0, undefined),
  win('V4', 'Hovedsoverom', 'E', 6.75, 1.5, 2),
  win('V5', 'Kontor', 'E', KON_Y0 + 0.61, 1.497, 2), // M: 0.610 / 0.644 from the side walls
  win('V6', 'Tvstue', 'E', 0.778, 1.5, 2), // M: 0.778 from the sofa (south) wall
];

// ---- Built-ins (not furniture): kitchen, bathroom, wardrobe, radiators

/** Base cabinet with a recessed plinth and a worktop overhanging the front. */
function baseCabinet(r: Rect, front: Side): Fixture[] {
  const inset = (d: number): Rect => ({
    x0: r.x0 + (front === '-x' ? d : 0),
    x1: r.x1 - (front === '+x' ? d : 0),
    y0: r.y0 + (front === '-y' ? d : 0),
    y1: r.y1 - (front === '+y' ? d : 0),
  });
  return [
    { key: 'kitchen.fronts', ...inset(0.06), z0: 0, z1: 0.1 },
    { key: 'kitchen.fronts', ...r, z0: 0.1, z1: WORKTOP - 0.03 },
    { key: 'kitchen.worktop', ...inset(-0.02), z0: WORKTOP - 0.03, z1: WORKTOP },
  ];
}

const tallX1 = CORR_X0 - INT;
const radiator = (r: Rect): Fixture => ({ key: 'radiators', ...r, z0: 0.15, z1: 0.75 });

export const fixtures: Fixture[] = [
  // Kitchen: sink run along wall J, leg under the kitchen window, tall units by the corridor, island
  ...baseCabinet({ x0: KIT_X0, x1: RUN_X1, y0: J_Y0 - 0.6, y1: J_Y0 }, '-y'),
  ...baseCabinet({ x0: KIT_X0, x1: KIT_X0 + 0.6, y0: LIV_D, y1: J_Y0 - 0.62 }, '+x'), // full wall length under the window (owner)
  ...baseCabinet({ x0: 2.78, x1: tallX1, y0: ISLAND_Y0, y1: ISLAND_Y0 + 0.9 }, '+y'),
  { key: 'kitchen.fronts', x0: RUN_X1, x1: tallX1, y0: J_Y0 - 0.54, y1: J_Y0, z0: 0, z1: 0.1 },
  { key: 'kitchen.fronts', x0: RUN_X1, x1: tallX1, y0: J_Y0 - 0.6, y1: J_Y0, z0: 0.1, z1: CAB_TOP },
  { key: 'kitchen.fronts', x0: KIT_X0, x1: RUN_X1, y0: J_Y0 - 0.35, y1: J_Y0 - 0.01, z0: WORKTOP + BACKSPLASH, z1: CAB_TOP },
  // Bulkhead from the cabinet tops to the ceiling, with two vent grilles over the tall units
  { key: 'kitchen.bulkhead', x0: KIT_X0, x1: RUN_X1, y0: J_Y0 - 0.35, y1: J_Y0, z0: CAB_TOP, z1: CEILING, collide: false },
  { key: 'kitchen.bulkhead', x0: RUN_X1, x1: tallX1, y0: J_Y0 - 0.6, y1: J_Y0, z0: CAB_TOP, z1: CEILING, collide: false },
  { key: 'kitchen.appliances', x0: RUN_X1 + 0.08, x1: RUN_X1 + 0.5, y0: J_Y0 - 0.605, y1: J_Y0 - 0.6, z0: 2.36, z1: 2.44 },
  { key: 'kitchen.appliances', x0: RUN_X1 + 0.7, x1: RUN_X1 + 1.12, y0: J_Y0 - 0.605, y1: J_Y0 - 0.6, z0: 2.36, z1: 2.44 },
  { key: 'kitchen.backsplash', x0: KIT_X0, x1: RUN_X1, y0: J_Y0 - 0.01, y1: J_Y0, z0: WORKTOP, z1: WORKTOP + BACKSPLASH },
  { key: 'kitchen.appliances', x0: 2.0, x1: 2.45, y0: J_Y0 - 0.52, y1: J_Y0 - 0.12, z0: WORKTOP, z1: WORKTOP + 0.003 },
  { key: 'kitchen.appliances', x0: 3.25, x1: 3.85, y0: ISLAND_Y0 + 0.2, y1: ISLAND_Y0 + 0.7, z0: WORKTOP, z1: WORKTOP + 0.005 },
  { key: 'kitchen.appliances', x0: RUN_X1 + 0.06, x1: RUN_X1 + 0.56, y0: J_Y0 - 0.605, y1: J_Y0 - 0.6, z0: 0.85, z1: 1.62 },

  // Bathroom: walk-in shower (SW corner), floating vanity, wall-hung WC, boxed soffit
  { key: 'glass', x0: 2.1, x1: 2.11, y0: J_Y1, y1: J_Y1 + 0.8, z0: 0.02, z1: 2.0, pickable: false },
  { key: 'bad.vanity', x0: 2.13, x1: 2.73, y0: J_Y1, y1: J_Y1 + 0.45, z0: 0.4, z1: 0.85 },
  { key: 'bad.porcelain', x0: 2.13, x1: 2.73, y0: J_Y1, y1: J_Y1 + 0.47, z0: 0.85, z1: 0.88 },
  { key: 'bad.vanity', x0: 2.16, x1: 2.7, y0: J_Y1, y1: J_Y1 + 0.14, z0: 1.1, z1: 1.8 },
  { key: 'bad.porcelain', x0: 2.86, x1: 3.22, y0: J_Y1, y1: J_Y1 + 0.54, z0: 0.22, z1: 0.43, rounded: 0.07 },
  { key: 'bad.ceiling', x0: KIT_X0, x1: BAD_X1, y0: J_Y1, y1: J_Y1 + 0.4, z0: 2.3, z1: CEILING, ceiling: true },

  // Radiators under the windows (Tvstue position M: 1.213 from the sofa wall)
  radiator({ x0: 0.03, x1: 0.11, y0: 1.09, y1: 2.29 }),
  radiator({ x0: BED_X1 - 0.1, x1: BED_X1 - 0.03, y0: 7.1, y1: 7.9 }),
  radiator({ x0: BED_X1 - 0.1, x1: BED_X1 - 0.03, y0: KON_Y0 + 0.95, y1: KON_Y0 + 1.75 }),
  radiator({ x0: K_X1 + 2.962, x1: BED_X1 - 0.03, y0: 1.213, y1: 1.843 }),
];

// ---- Balcony: straight north edge, then an arc bulging west (M: depth 1.691 at the door end, 2.277 max)

/** Points on the circle through a, b, c, from a to c passing b. */
function arcThrough(a: Vec2, b: Vec2, c: Vec2, segments: number): Vec2[] {
  const [ax, ay] = a;
  const [bx, by] = b;
  const [cx, cy] = c;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const r = Math.hypot(ax - ux, ay - uy);
  const tau = Math.PI * 2;
  const norm = (t: number) => ((t % tau) + tau) % tau;
  const start = Math.atan2(ay - uy, ax - ux);
  const toB = norm(Math.atan2(by - uy, bx - ux) - start);
  const toC = norm(Math.atan2(cy - uy, cx - ux) - start);
  const sweep = toB < toC ? toC : toC - tau;
  const pts: Vec2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = start + (sweep * i) / segments;
    pts.push([ux + r * Math.cos(t), uy + r * Math.sin(t)]);
  }
  return pts;
}

const ARC = arcThrough([BAL_X - 1.24, BAL_Y1 - 0.35], [BAL_X - 2.277, 5.3], [BAL_X - 1.691, H_Y1], 28);

export const balcony: Balcony = {
  polygon: [[BAL_X, H_Y1], [BAL_X, BAL_Y1], [BAL_X - 1.24, BAL_Y1], ...ARC],
  railing: [[BAL_X, BAL_Y1], [BAL_X - 1.24, BAL_Y1], ...ARC, [-EXT, H_Y1]],
  floorLevel: -0.05,
  soffit: 2.72, // M: height to the balcony ceiling
};

rooms.push({
  id: 'balkong',
  name: 'Balkong',
  outdoor: true,
  ceilingHeight: balcony.soffit,
  floorLevel: balcony.floorLevel,
  labelAt: [-0.3, 5.4],
  polygon: balcony.polygon,
});

/** First-person start: just inside the front door, looking towards the living room. */
export const walkStart = { at: [4.6, 6.6] as Vec2, lookAt: [4.9, 2.0] as Vec2 };

/** Centre of the apartment, for cameras and the sun. */
export const center: Vec2 = [4.3, 4.4];
