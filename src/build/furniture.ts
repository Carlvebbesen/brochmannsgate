import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { toWorld } from '../core/geom';
import {
  CHAIR_D,
  CHAIR_W,
  diningChairs,
  footprints,
  furnitureDefaults,
  SKJENK_D,
  SKJENK_H,
  SKJENK_LEG_H,
  SKJENK_W,
  SOFA_ARM,
  SOFA_D,
  SOFA_W,
  TV_BENCH_D,
  TV_BENCH_H,
  TV_BENCH_W,
  TV_BENCH_Z0,
  type FurnitureId,
  type Pose,
} from '../data/furniture';
import type { Rect } from '../data/types';
import type { BuildContext } from './context';

export interface MovableItem {
  id: FurnitureId;
  group: THREE.Group;
  footprint: { w: number; d: number };
  /** 2D collision box kept in sync with the group's position by `updateObstacle` (src/build/index.ts). */
  obstacle?: Rect;
}

/** Positions/rotates a furniture group from a plan pose (see `src/data/furniture.ts`). */
export function setPose(group: THREE.Group, pose: Pose) {
  group.position.copy(toWorld(pose.x, pose.y, 0));
  group.rotation.y = pose.yaw;
}

/** Movable furniture, built once at its default pose; main.ts repositions it from the saved poses and drag. */
export function buildFurniture(ctx: BuildContext): MovableItem[] {
  const items: MovableItem[] = [];
  const add = (id: FurnitureId, build: (g: THREE.Group) => void) => {
    const group = new THREE.Group();
    group.userData.furnitureId = id;
    build(group);
    ctx.root.add(group);
    setPose(group, furnitureDefaults[id]);
    items.push({ id, group, footprint: footprints[id] });

    // Local to the group (not rotated by yaw, since it sits at the origin): width × depth at yaw 0.
    const { w, d } = footprints[id];
    const el = document.createElement('div');
    el.className = 'dim-label';
    el.textContent = `${(w * 100).toFixed(0)} × ${(d * 100).toFixed(0)} cm`;
    const dim = new CSS2DObject(el);
    dim.position.set(0, 0.02, 0);
    group.add(dim);
    ctx.dimensions.push(dim);
  };

  add('bed', (g) => buildBed(ctx, g));
  add('nightstandL', (g) => buildNightstand(ctx, g));
  add('nightstandR', (g) => buildNightstand(ctx, g));
  add('sofa', (g) => buildSofa(ctx, g));
  add('tvBench', (g) => buildTvBench(ctx, g));
  add('diningTable', (g) => buildDiningTable(ctx, g));
  add('skjenk', (g) => buildSkjenk(ctx, g));
  return items;
}

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

/** Lofoten kontinentalseng 180×200, light legs and a panelled (not plain) sengegavel. */
function buildBed(ctx: BuildContext, g: THREE.Group) {
  const { w, d } = footprints.bed;
  const hw = w / 2;
  const hd = d / 2; // head end at +y, foot end at -y

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * (hw - 0.08);
      const y = sy * (hd - 0.08);
      ctx.box('furniture.bedLegs', rect(x - 0.03, x + 0.03, y - 0.03, y + 0.03), 0, 0.15, { parent: g });
    }
  }
  ctx.box('furniture.bedFabric', rect(-hw + 0.01, hw - 0.01, -hd + 0.01, hd - 0.01), 0.15, 0.45, { parent: g });
  ctx.box('mattress', rect(-hw + 0.02, hw - 0.02, -hd + 0.03, hd - 0.03), 0.45, 0.7, { parent: g });

  // Sengegavel: a tall upholstered headboard, quilted into a grid of square panels (ref: product photo), not plain.
  const hbW = hw + 0.03;
  const hb0 = hd;
  const hb1 = hd + 0.1;
  const hbTop = 1.1;
  ctx.box('furniture.bedFabric', rect(-hbW, hbW, hb0, hb1), 0, hbTop, { parent: g });
  const COLS = 5;
  const ROWS = 3;
  const gz0 = 0.18;
  const gz1 = hbTop - 0.08;
  for (let i = 1; i < COLS; i++) {
    const x = -hbW + (hbW * 2 * i) / COLS;
    ctx.box('shadowGap', rect(x - 0.006, x + 0.006, hb0 - 0.001, hb0 + 0.001), gz0, gz1, { parent: g });
  }
  for (let j = 1; j < ROWS; j++) {
    const z = gz0 + ((gz1 - gz0) * j) / ROWS;
    ctx.box('shadowGap', rect(-hbW + 0.02, hbW - 0.02, hb0 - 0.001, hb0 + 0.001), z - 0.005, z + 0.005, { parent: g });
  }
}

/** Vinstra-style nattbord, 46×40×70: two reeded drawers with round knobs, on a black metal leg frame. */
function buildNightstand(ctx: BuildContext, g: THREE.Group) {
  const { w, d } = footprints.nightstandL;
  const hw = w / 2;
  const hd = d / 2;
  const legZ1 = 0.3; // black metal underframe height
  const bodyZ1 = 0.7;

  const legR = 0.012;
  const inset = 0.03;
  const legX: [number, number][] = [
    [-hw + inset, -hd + inset],
    [hw - inset, -hd + inset],
    [-hw + inset, hd - inset],
    [hw - inset, hd - inset],
  ];
  for (const [x, y] of legX) ctx.cylinder('nightstand.metal', [x, y], legZ1 / 2, legR, legZ1, 'z', { parent: g });
  // Cross-brace between the front and back legs, each side
  for (const x of [-hw + inset, hw - inset]) {
    ctx.orientedBox('nightstand.metal', [x, 0], d - inset * 2, 0.014, legZ1 * 0.42, legZ1 * 0.58, Math.PI / 2, { parent: g });
  }

  ctx.box('furniture.nightstand', rect(-hw, hw, -hd, hd), legZ1, bodyZ1, { parent: g });
  const drawerFront = -hd - 0.001;
  const drawerMidZ = legZ1 + (bodyZ1 - legZ1) / 2;
  ctx.box('shadowGap', rect(-hw + 0.02, hw - 0.02, drawerFront, drawerFront + 0.001), drawerMidZ - 0.004, drawerMidZ + 0.004, {
    parent: g,
  });
  // Vertical reeding on each drawer front
  for (let i = 1; i < 6; i++) {
    const x = -hw + (2 * hw * i) / 6;
    for (const [z0, z1] of [
      [legZ1 + 0.02, drawerMidZ - 0.01],
      [drawerMidZ + 0.01, bodyZ1 - 0.02],
    ] as [number, number][]) {
      ctx.box('shadowGap', rect(x - 0.004, x + 0.004, drawerFront, drawerFront + 0.0008), z0, z1, { parent: g });
    }
  }
  // Round black knobs, one per drawer
  for (const z of [legZ1 + (drawerMidZ - legZ1) / 2, drawerMidZ + (bodyZ1 - drawerMidZ) / 2]) {
    ctx.cylinder('nightstand.metal', [0, -hd - 0.012], z, 0.012, 0.02, 'y', { parent: g });
  }
}

/** Hedda-style L-sofa, 265×218, bent into the corner at local (+x, -y): rounded cushions, round wood legs. */
function buildSofa(ctx: BuildContext, g: THREE.Group) {
  const hw = SOFA_W / 2;
  const hd = SOFA_D / 2;
  const SEAT_H = 0.48;
  const BACK_H = 0.87;
  const BACK_T = 0.16;
  const R = 0.05;
  const cornerX = hw - SOFA_ARM;
  const cornerY = -hd + SOFA_ARM;

  // Seats (rounded, softer cushion look), split into cushion sections by shallow grooves
  ctx.box('furniture.sofa', rect(-hw, hw, -hd, cornerY), 0, SEAT_H, { parent: g, rounded: R });
  ctx.box('furniture.sofa', rect(cornerX, hw, -hd, hd), 0, SEAT_H, { parent: g, rounded: R });
  for (const x of [-hw / 3, hw / 3]) {
    ctx.box('shadowGap', rect(x - 0.006, x + 0.006, -hd + 0.05, cornerY - 0.05), SEAT_H - 0.03, SEAT_H - 0.02, { parent: g });
  }

  // Backrests along the two walls
  ctx.box('furniture.sofa', rect(-hw, hw, -hd, -hd + BACK_T), SEAT_H, BACK_H, { parent: g, rounded: R * 0.6 });
  ctx.box('furniture.sofa', rect(hw - BACK_T, hw, -hd, hd), SEAT_H, BACK_H, { parent: g, rounded: R * 0.6 });
  for (const x of [-hw / 2, 0, hw / 2]) {
    ctx.box('shadowGap', rect(x - 0.006, x + 0.006, -hd + 0.02, -hd + BACK_T - 0.02), SEAT_H + 0.02, BACK_H - 0.02, { parent: g });
  }

  // Round, light-wood tapered legs peeking out at the outer corners
  const legY = 0.09;
  for (const [x, y] of [
    [-hw + 0.08, -hd + 0.08],
    [hw - 0.08, -hd + 0.08],
    [-hw + 0.08, hd - 0.08],
    [hw - 0.08, hd - 0.08],
  ] as [number, number][]) {
    ctx.cylinder('furniture.nightstand', [x, y], legY / 2, 0.025, legY, 'z', { parent: g });
  }
}

/** Porto-style floating TV-benk, 200×40×49, off the floor. */
function buildTvBench(ctx: BuildContext, g: THREE.Group) {
  const hw = TV_BENCH_W / 2;
  const hd = TV_BENCH_D / 2;
  const z0 = TV_BENCH_Z0;
  const z1 = z0 + TV_BENCH_H;
  ctx.box('furniture.tvBench', rect(-hw, hw, -hd, hd), z0, z1, { parent: g, rounded: 0.09 });
  // Open centre shelf, set back from the front edge
  ctx.box('shadowGap', rect(-0.25, 0.25, -hd + 0.02, hd - 0.16), z0 + 0.05, z1 - 0.05, { parent: g });
  // Door-front reveal lines either side of the shelf
  for (const x of [-0.28, 0.28]) {
    ctx.box('shadowGap', rect(x - 0.004, x + 0.004, -hd, -hd + 0.001), z0 + 0.03, z1 - 0.03, { parent: g });
  }
}

/** A-Line Plank spisebord, 200×95: thin light-oak top on four straight corner legs. */
function buildDiningTable(ctx: BuildContext, g: THREE.Group) {
  const { w, d } = footprints.diningTable;
  const hw = w / 2;
  const hd = d / 2;
  const topH = 0.03;
  ctx.box('furniture.diningTable', rect(-hw, hw, -hd, hd), 0.75 - topH, 0.75, { parent: g });
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * (hw - 0.06);
      const y = sy * (hd - 0.06);
      ctx.box('furniture.diningTable', rect(x - 0.028, x + 0.028, y - 0.028, y + 0.028), 0, 0.75 - topH, { parent: g });
    }
  }

  // Six Casper armstoler, built as children of the table group so they move (and would rotate) with it as one unit.
  for (const pose of diningChairs) buildChair(ctx, g, pose);
}

/** Casper armstol (Sleepo, hvitoljet ask/hvit): bent-wood arm+back frame, cream boucle seat. */
function buildChair(ctx: BuildContext, parent: THREE.Group, pose: Pose) {
  const chair = new THREE.Group();
  chair.position.copy(toWorld(pose.x, pose.y, 0));
  chair.rotation.y = pose.yaw;
  parent.add(chair);

  // Local frame: +x is the open (front) side the sitter faces, -x is the back; y is left/right.
  const hx = CHAIR_D / 2;
  const hy = CHAIR_W / 2;
  const SEAT_H = 0.44; // M
  const ARM_H = 0.65; // M: lowest point of the armrest
  const TOP_H = 0.79; // M: overall height
  const inset = 0.03;

  // Front posts rise only to the armrest; back posts run all the way up into the back rail.
  for (const sy of [-1, 1]) {
    const y = sy * (hy - inset);
    ctx.cylinder('furniture.diningChair', [hx - inset, y], ARM_H / 2, 0.02, ARM_H, 'z', { parent: chair });
    ctx.cylinder('furniture.diningChair', [-hx + inset, y], TOP_H / 2, 0.02, TOP_H, 'z', { parent: chair });
    // Armrest rail, front post to back post
    ctx.box('furniture.diningChair', rect(-hx + inset, hx - inset, y - 0.02, y + 0.02), ARM_H - 0.03, ARM_H, { parent: chair });
  }
  // Back rail, joining the two back posts near the top
  ctx.box('furniture.diningChair', rect(-hx + inset - 0.02, -hx + inset + 0.02, -hy + inset, hy - inset), TOP_H - 0.05, TOP_H, {
    parent: chair,
  });
  // Seat cushion, set back from the open front for legroom under the table
  ctx.box('furniture.diningChairSeat', rect(-hx + 0.05, hx - 0.02, -hy + 0.05, hy - 0.05), SEAT_H - 0.04, SEAT_H, {
    parent: chair,
    rounded: 0.03,
  });
}

/**
 * "Eikeskjenk 240" — owner's byggemanual: 2400 × 350 × 800 mm oak sideboard on six turned legs, five sections
 * A–E left to right (open cubby, open bookshelf, asymmetric shelving, ten-bottle wine rack, closed door).
 * Section widths and shelf heights follow the manual's deleliste/oppriss.
 */
function buildSkjenk(ctx: BuildContext, g: THREE.Group) {
  const hw = SKJENK_W / 2;
  const hd = SKJENK_D / 2;
  const z0 = SKJENK_LEG_H; // top of the legs = bottom of the carcass
  const z1 = SKJENK_H; // top of the carcass
  const PANEL = 0.022; // 22 mm solid-oak panel thickness (gavl, mellomvegg, topplate)
  const BACK = 0.008; // 8 mm oak-veneer bakvegg

  // Section widths (A–E) and the end/divider panels between them, left to right.
  const widths = [0.467, 0.467, 0.714, 0.22, 0.4];
  const sections: [number, number][] = [];
  let x = -hw + PANEL;
  for (const w of widths) {
    sections.push([x, x + w]);
    x += w + PANEL;
  }
  const [A, B, C, D, E] = sections;

  // Carcass: bottom/top plates, end panels (gavl) and the four dividers (mellomvegg) between sections.
  ctx.box('furniture.skjenk', rect(-hw + PANEL, hw - PANEL, -hd, hd), z0, z0 + PANEL, { parent: g }); // bunnplate
  ctx.box('furniture.skjenk', rect(-hw, hw, -hd, hd), z1 - PANEL, z1, { parent: g }); // topplate, overhangs the gavls
  ctx.box('furniture.skjenk', rect(-hw, -hw + PANEL, -hd, hd), z0, z1 - PANEL, { parent: g }); // left gavl
  ctx.box('furniture.skjenk', rect(hw - PANEL, hw, -hd, hd), z0, z1 - PANEL, { parent: g }); // right gavl
  for (const [, x1] of sections.slice(0, -1)) {
    ctx.box('furniture.skjenk', rect(x1, x1 + PANEL, -hd, hd), z0 + PANEL, z1 - PANEL, { parent: g });
  }
  ctx.box('furniture.skjenk', rect(-hw + PANEL, hw - PANEL, -hd, -hd + BACK), z0 + PANEL, z1 - PANEL, { parent: g }); // bakvegg, in a fals

  // Six turned legs, tapered look via a slim cylinder; beinklosser positions from the manual (90/1200/2310 mm from venstre).
  for (const lx of [-hw + PANEL + 0.09, -hw + PANEL + 1.2, -hw + PANEL + 2.31]) {
    for (const sy of [-1, 1]) {
      ctx.cylinder('furniture.skjenk', [lx, sy * (hd - 0.07)], z0 / 2, 0.018, z0, 'z', { parent: g });
    }
  }

  const inner0 = z0 + PANEL; // bunnplate top
  const shelf = (x0: number, x1: number, overMm: number) => {
    const sz = inner0 + overMm / 1000;
    ctx.box('furniture.skjenk', rect(x0, x1, -hd + BACK, hd - 0.005), sz, sz + PANEL, { parent: g });
  };

  // Section B: one open shelf, 349 mm over the bunnplate, with a stiffening front lip (forkantlist).
  shelf(B[0], B[1], 349);
  ctx.box('furniture.skjenk', rect(B[0], B[1], hd - 0.023, hd - 0.005), inner0 + 0.349 - 0.018, inner0 + 0.349, { parent: g });

  // Section C: asymmetric shelving — a lower shelf on the left (239 mm), a higher one on the right (400 mm).
  const cMid = C[0] + 0.346;
  shelf(C[0], cMid, 239);
  shelf(C[1] - 0.346, C[1], 400);

  // Section D: ten-bottle wine rack — one vertical rib splitting two columns, four horizontal ribs giving five rows.
  const RIB = 0.018;
  const dMidX = (D[0] + D[1]) / 2;
  ctx.box('furniture.skjenk', rect(dMidX - RIB / 2, dMidX + RIB / 2, -hd + BACK, hd - 0.005), inner0, z1 - PANEL, { parent: g });
  const rows = 5;
  for (let i = 1; i < rows; i++) {
    const rz = inner0 + ((z1 - PANEL - inner0) * i) / rows;
    ctx.box('furniture.skjenk', rect(D[0], D[1], -hd + BACK, hd - 0.005), rz - RIB / 2, rz + RIB / 2, { parent: g });
  }

  // Section E: closed door with a shadow-gap reveal and a turned knob.
  const doorInset = 0.003;
  ctx.box('furniture.skjenk', rect(E[0] + doorInset, E[1] - doorInset, hd - PANEL, hd), inner0 + doorInset, z1 - PANEL - doorInset, {
    parent: g,
  });
  for (const dx of [E[0] + doorInset, E[1] - doorInset]) {
    ctx.box('shadowGap', rect(dx - 0.0015, dx + 0.0015, hd - PANEL - 0.001, hd), inner0 + doorInset, z1 - PANEL - doorInset, {
      parent: g,
    });
  }
  ctx.cylinder('nightstand.metal', [E[1] - 0.09, hd + 0.012], (inner0 + z1 - PANEL) / 2, 0.008, 0.024, 'y', { parent: g });
}
