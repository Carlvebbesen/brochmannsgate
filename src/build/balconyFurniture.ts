import * as THREE from 'three';
import { toWorld } from '../core/geom';
import {
  BALCONY_FLOOR as FL,
  BALCONY_RUG_R,
  BALCONY_SOFA_D,
  BALCONY_SOFA_H,
  BALCONY_SOFA_L,
  BALCONY_SOFA_SEAT_H,
  balconyChairs,
  balconyPlants,
  GRILL_D,
  GRILL_H,
  GRILL_W,
  type Pose,
} from '../data/furniture';
import type { Rect, Vec2 } from '../data/types';
import type { BuildContext } from './context';

const rect = (x0: number, x1: number, y0: number, y1: number): Rect => ({ x0, x1, y0, y1 });

/** Upright round solid (disc, pot, rug), optionally tapered: `r0` at the bottom `z0`, `r1` at the top `z1`. */
function round(ctx: BuildContext, key: string, at: Vec2, z0: number, z1: number, r0: number, r1: number, parent: THREE.Object3D) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, z1 - z0, 40), ctx.mats.get(key));
  mesh.position.copy(toWorld(at[0], at[1], (z0 + z1) / 2));
  return ctx.finish(mesh, key, { parent });
}

/** Lumpy foliage ball (low-poly, flat shaded by its facets). */
function blob(ctx: BuildContext, key: string, at: Vec2, z: number, r: number, squash: number, parent: THREE.Object3D) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), ctx.mats.get(key));
  mesh.position.copy(toWorld(at[0], at[1], z));
  mesh.scale.set(1, squash, 1);
  return ctx.finish(mesh, key, { parent, castShadow: true });
}

/** Deterministic pseudo-random sequence, so the plants look the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Weber Spirit E-325 (Jernia product photo): black cart with a cabinet door, feet on the left and two wheels on the
 * right, a red strip under the stainless control panel with three knobs, a black lid with a thermometer and a steel
 * handle, and two grey fold-down side tables. Front (knobs) at -y, back at +y.
 */
export function buildGrill(ctx: BuildContext, g: THREE.Group) {
  const k = 'balkong.grill';
  const hd = GRILL_D / 2;
  const hw = GRILL_W / 2;
  const z = (h: number) => FL + h;
  const opts = { parent: g };

  // Cart: four square posts, the right pair on wheels, a closed cabinet between them
  const postX = 0.28;
  const postY = 0.19;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * postX;
      const y = sy * postY;
      const bottom = sx > 0 ? 0.12 : 0;
      ctx.box(k, rect(x - 0.025, x + 0.025, y - 0.025, y + 0.025), z(bottom), z(0.77), opts);
    }
    ctx.cylinder('grill.tyre', [postX + 0.035, sx * postY], z(0.09), 0.09, 0.045, 'x', opts);
  }
  ctx.box(k, rect(-postX + 0.02, postX - 0.02, -postY, postY), z(0.08), z(0.74), opts);
  ctx.box('shadowGap', rect(-postX + 0.04, postX - 0.04, -postY - 0.002, -postY), z(0.1), z(0.72), opts);
  ctx.box(k, rect(-postX + 0.045, postX - 0.045, -postY - 0.006, -postY - 0.002), z(0.105), z(0.715), opts); // cabinet door
  ctx.box(k, rect(-postX, postX, -postY - 0.02, postY + 0.02), z(0.04), z(0.08), opts); // bottom frame
  ctx.box('grill.red', rect(-0.31, 0.31, -0.225, 0.2), z(0.74), z(0.77), opts);

  // Control panel (stainless face) with three knobs, cookbox behind it
  ctx.box(k, rect(-0.32, 0.32, -0.24, 0.26), z(0.77), z(0.93), opts);
  ctx.box('steel', rect(-0.3, 0.3, -0.252, -0.24), z(0.785), z(0.915), opts);
  for (const x of [-0.18, 0, 0.18]) ctx.cylinder('steel', [x, -0.27], z(0.845), 0.03, 0.035, 'y', opts);

  // Lid, thermometer and handle
  ctx.box(k, rect(-0.32, 0.32, -0.235, hd - 0.04), z(0.92), z(GRILL_H), { parent: g, rounded: 0.06 });
  ctx.cylinder('steel', [0, -0.238], z(1.09), 0.03, 0.01, 'y', opts);
  ctx.cylinder('steel', [0, -hd + 0.015], z(0.955), 0.013, 0.64, 'x', opts);
  for (const sx of [-1, 1]) ctx.box('steel', rect(sx * 0.31 - 0.012, sx * 0.31 + 0.012, -hd + 0.01, -0.23), z(0.945), z(0.965), opts);

  // Side tables (up), grey hammertone tops with a black end handle
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 0.32 : -hw + 0.03;
    const x1 = sx > 0 ? hw - 0.03 : -0.32;
    ctx.box('grill.table', rect(x0, x1, -0.2, 0.2), z(0.885), z(0.915), opts);
    const e0 = sx > 0 ? hw - 0.03 : -hw;
    ctx.box(k, rect(e0, e0 + 0.03, -0.2, 0.2), z(0.87), z(0.925), { parent: g, rounded: 0.01 });
  }
}

/**
 * IKEA NÄMMARÖ 2-seter (product photo): two armless modules side by side, a light-brown acacia frame (square legs,
 * top rail under the seat, low stretchers) with a wooden back panel, thick beige seat and back cushions.
 * Long side along y; back against the wall at +x, seat facing -x.
 */
export function buildBalconySofa(ctx: BuildContext, g: THREE.Group) {
  const frame = 'balkong.sofaFrame';
  const cushion = 'balkong.sofaCushion';
  const hx = BALCONY_SOFA_D / 2;
  const hl = BALCONY_SOFA_L / 2;
  const z = (h: number) => FL + h;
  const opts = { parent: g };
  const T = 0.045; // frame timber
  const RAIL_TOP = 0.3;

  for (const [m0, m1] of [
    [-hl, 0],
    [0, hl],
  ]) {
    for (const x of [-hx, hx - T]) {
      for (const y of [m0, m1 - T]) ctx.box(frame, rect(x, x + T, y, y + T), z(0), z(RAIL_TOP), opts);
      ctx.box(frame, rect(x, x + T, m0 + T, m1 - T), z(RAIL_TOP - 0.08), z(RAIL_TOP), opts); // top rail
      ctx.box(frame, rect(x + 0.005, x + T - 0.005, m0 + T, m1 - T), z(0.05), z(0.09), opts); // stretcher
    }
    for (const y of [m0, m1 - T]) {
      ctx.box(frame, rect(-hx + T, hx - T, y, y + T), z(RAIL_TOP - 0.08), z(RAIL_TOP), opts);
      ctx.box(frame, rect(-hx + T, hx - T, y + 0.005, y + T - 0.005), z(0.05), z(0.09), opts);
    }
    // Wooden back panel, standing on the back rail
    ctx.box(frame, rect(hx - T, hx - 0.01, m0 + 0.01, m1 - 0.01), z(RAIL_TOP), z(0.66), opts);

    // Cushions: seat 68 deep from the front, a thick back cushion leaning on the panel
    ctx.box(cushion, rect(-hx - 0.005, -hx + 0.68, m0 + 0.008, m1 - 0.008), z(RAIL_TOP), z(BALCONY_SOFA_SEAT_H), {
      parent: g,
      rounded: 0.035,
    });
    const back = new THREE.Group();
    back.position.copy(toWorld(hx - T - 0.1, (m0 + m1) / 2, z(BALCONY_SOFA_SEAT_H - 0.02)));
    back.rotation.z = -0.1; // top leans back towards the wall
    g.add(back);
    const half = (m1 - m0) / 2 - 0.012;
    ctx.box(cushion, rect(-0.08, 0.08, -half, half), 0, BALCONY_SOFA_H - BALCONY_SOFA_SEAT_H, { parent: back, rounded: 0.06 });
  }
}

/**
 * Bistro set from the owner's reference image: a round jute rug, a round wood-top coffee table on black metal legs
 * with a candle lantern, and two olive-green folding chairs with white seat cushions. The rug's centre is the origin.
 */
export function buildBalconyTable(ctx: BuildContext, g: THREE.Group) {
  const z = (h: number) => FL + h;
  const opts = { parent: g };
  round(ctx, 'balkong.rug', [0, 0], z(0), z(0.012), BALCONY_RUG_R, BALCONY_RUG_R, g);

  // Table: Ø 60 top, four legs, a ring stretcher and an apron ring under the top
  const TOP = 0.45;
  round(ctx, 'balkong.tableTop', [0, 0], z(TOP - 0.035), z(TOP), 0.3, 0.3, g);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    ctx.cylinder('nightstand.metal', [0.2 * Math.cos(a), 0.2 * Math.sin(a)], z((TOP - 0.035) / 2), 0.012, TOP - 0.035, 'z', opts);
  }
  for (const [h, r] of [
    [0.14, 0.2],
    [TOP - 0.05, 0.2],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 40), ctx.mats.get('nightstand.metal'));
    ring.position.copy(toWorld(0, 0, z(h)));
    ring.rotation.x = Math.PI / 2;
    ctx.finish(ring, 'nightstand.metal', opts);
  }
  // Candle lantern and a small potted herb
  round(ctx, 'glass', [0.06, -0.04], z(TOP), z(TOP + 0.15), 0.05, 0.05, g);
  round(ctx, 'mattress', [0.06, -0.04], z(TOP), z(TOP + 0.08), 0.03, 0.03, g);
  round(ctx, 'plant.pot', [-0.1, 0.08], z(TOP), z(TOP + 0.1), 0.045, 0.06, g);
  blob(ctx, 'plant.leaf', [-0.1, 0.08], z(TOP + 0.15), 0.09, 0.8, g);

  for (const pose of balconyChairs) buildFoldingChair(ctx, g, pose);
}

/** Folding bistro chair, 40 × 42, seat 45: slatted metal seat and back, white seat cushion. Local +x = front. */
function buildFoldingChair(ctx: BuildContext, parent: THREE.Group, pose: Pose) {
  const chair = new THREE.Group();
  chair.position.copy(toWorld(pose.x, pose.y, 0));
  chair.rotation.y = pose.yaw;
  parent.add(chair);
  const k = 'balkong.chair';
  const z = (h: number) => FL + h;
  const opts = { parent: chair };
  const SEAT = 0.45;
  const hw = 0.2;

  for (const sy of [-1, 1]) {
    const y = sy * (hw - 0.01);
    ctx.cylinder(k, [-0.19, y], z(0.42), 0.011, 0.84, 'z', opts); // back leg → back post
    ctx.cylinder(k, [0.19, y], z(SEAT / 2), 0.011, SEAT, 'z', opts); // front leg
    ctx.box(k, rect(-0.2, 0.2, y - 0.01, y + 0.01), z(SEAT - 0.03), z(SEAT), opts); // seat side rail
  }
  // Seat slats and two back slats
  for (let i = 0; i < 5; i++) {
    const x = -0.17 + i * 0.085;
    ctx.box(k, rect(x - 0.03, x + 0.03, -hw + 0.01, hw - 0.01), z(SEAT - 0.012), z(SEAT), opts);
  }
  for (const h of [0.64, 0.76]) ctx.box(k, rect(-0.2, -0.18, -hw + 0.01, hw - 0.01), z(h), z(h + 0.07), opts);
  // Low cross brace between the front legs
  ctx.box(k, rect(0.18, 0.2, -hw + 0.01, hw - 0.01), z(0.12), z(0.14), opts);

  ctx.box('balkong.chairCushion', rect(-0.17, 0.2, -hw + 0.015, hw - 0.015), z(SEAT), z(SEAT + 0.06), { parent: chair, rounded: 0.025 });
}

/** Fixed pot plants from the reference image: an olive tree, two white hydrangeas and a lavender. */
export function buildBalconyPlants(ctx: BuildContext) {
  const root = ctx.root;
  const z = (h: number) => FL + h;
  const rand = rng(7);

  // Olive tree in a woven basket: thin trunk, loose grey-green crown
  const o = balconyPlants.olive;
  round(ctx, 'plant.basket', [o.x, o.y], z(0), z(0.4), o.r * 0.8, o.r, root);
  ctx.cylinder('plant.trunk', [o.x, o.y], z(0.85), 0.022, 0.9, 'z', { parent: root });
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const d = 0.05 + rand() * 0.26;
    blob(ctx, 'plant.olive', [o.x + Math.cos(a) * d, o.y + Math.sin(a) * d], z(1.2 + rand() * 0.6), 0.06 + rand() * 0.05, 0.8, root);
  }

  // Hydrangeas: a dark-green leaf mound with creamy-white flower heads on top
  for (const h of [balconyPlants.hydrangeaBack, balconyPlants.hydrangeaFront]) {
    const potH = h.r * 1.9;
    round(ctx, 'plant.pot', [h.x, h.y], z(0), z(potH), h.r * 0.75, h.r, root);
    blob(ctx, 'plant.leaf', [h.x, h.y], z(potH + h.r * 0.5), h.r * 1.35, 0.7, root);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI * 2 + rand() * 0.5;
      const d = i === 0 ? 0 : h.r * (0.6 + rand() * 0.35);
      blob(ctx, 'plant.hydrangea', [h.x + Math.cos(a) * d, h.y + Math.sin(a) * d], z(potH + h.r * 1.15 - d * 0.4), h.r * 0.5, 0.85, root);
    }
  }

  // Lavender: grey-green tuft with purple flower spikes
  const l = balconyPlants.lavender;
  const lPot = l.r * 2.2;
  round(ctx, 'plant.pot', [l.x, l.y], z(0), z(lPot), l.r * 0.8, l.r, root);
  blob(ctx, 'plant.lavenderLeaf', [l.x, l.y], z(lPot + 0.06), l.r * 1.1, 0.6, root);
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * l.r * 0.9;
    const h = 0.22 + rand() * 0.14;
    ctx.cylinder('plant.lavender', [l.x + Math.cos(a) * d, l.y + Math.sin(a) * d], z(lPot + h / 2), 0.008, h, 'z', { parent: root });
  }
}
