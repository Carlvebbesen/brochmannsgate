import * as THREE from 'three';
import { openings, walls } from '../data/apartment';
import type { Opening, Rect, Vec2 } from '../data/types';
import { roomAt, toWorld } from '../core/geom';
import type { BuildContext } from './context';
import { isHorizontal } from './walls';

/** Along/across coordinates of one wall → plan rectangles and points. */
interface WallFrame {
  horiz: boolean;
  c0: number;
  c1: number;
  rect(a0: number, a1: number, cA: number, cB: number): Rect;
  point(a: number, c: number): Vec2;
}

export function buildOpenings(ctx: BuildContext) {
  for (const o of openings) {
    const wall = walls.find((w) => w.id === o.wall);
    if (!wall) throw new Error(`Opening ${o.id} refers to unknown wall ${o.wall}`);
    const horiz = isHorizontal(wall);
    const frame: WallFrame = {
      horiz,
      c0: horiz ? wall.y0 : wall.x0,
      c1: horiz ? wall.y1 : wall.x1,
      rect: (a0, a1, cA, cB) => {
        const [lo, hi] = cA < cB ? [cA, cB] : [cB, cA];
        return horiz ? { x0: a0, x1: a1, y0: lo, y1: hi } : { x0: lo, x1: hi, y0: a0, y1: a1 };
      },
      point: (a, c) => (horiz ? [a, c] : [c, a]),
    };
    if (o.kind === 'door') buildDoor(ctx, o, frame);
    else if (o.kind === 'window') buildWindow(ctx, o, frame);
    // 'opening': the wall builder already leaves the hole with painted reveals
  }
}

/** Plan rectangles of doors and openings, extended a little into both rooms (walkable in first person). */
export function doorPassages(): Rect[] {
  return openings
    .filter((o) => o.kind !== 'window')
    .map((o) => {
      const w = walls.find((x) => x.id === o.wall)!;
      return isHorizontal(w)
        ? { x0: o.from, x1: o.to, y0: w.y0 - 0.05, y1: w.y1 + 0.05 }
        : { x0: w.x0 - 0.05, x1: w.x1 + 0.05, y0: o.from, y1: o.to };
    });
}

function buildDoor(ctx: BuildContext, o: Opening, f: WallFrame) {
  const d = o.door!;
  // Casings (architraves) on both faces
  const cw = 0.07;
  const ct = 0.012;
  for (const [cA, cB] of [
    [f.c0 - ct, f.c0],
    [f.c1, f.c1 + ct],
  ]) {
    ctx.box('trim', f.rect(o.from - cw, o.from, cA, cB), 0, o.top, { castShadow: false });
    ctx.box('trim', f.rect(o.to, o.to + cw, cA, cB), 0, o.top, { castShadow: false });
    ctx.box('trim', f.rect(o.from - cw, o.to + cw, cA, cB), o.top, o.top + cw, { castShadow: false });
  }

  // Leaf, standing open
  const w = o.to - o.from - 0.01;
  const h = o.top - 0.012;
  const t = 0.04;
  const sign = d.swing.startsWith('+') ? 1 : -1;
  const across = sign > 0 ? f.c1 - t / 2 - 0.01 : f.c0 + t / 2 + 0.01;
  const hingeAt = d.hinge === 'from' ? o.from + 0.005 : o.to - 0.005;
  const [hx, hy] = f.point(hingeAt, across);
  const u: Vec2 = f.horiz ? [1, 0] : [0, 1];
  const n: Vec2 = f.horiz ? [0, sign] : [sign, 0];
  const s = d.hinge === 'from' ? 1 : -1;
  const th = THREE.MathUtils.degToRad(d.angle);
  const dir: Vec2 = [s * u[0] * Math.cos(th) + n[0] * Math.sin(th), s * u[1] * Math.cos(th) + n[1] * Math.sin(th)];

  const pivot = new THREE.Group();
  pivot.position.copy(toWorld(hx, hy, 0.006));
  pivot.rotation.y = Math.atan2(dir[1], dir[0]);
  ctx.root.add(pivot);

  // Leaf geometry in pivot space: local x = along the leaf (0..w), y = up, z = thickness.
  const part = (key: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), ctx.mats.get(key));
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = key !== 'glass';
    mesh.receiveShadow = true;
    if (!ctx.mats.isFixed(key)) mesh.userData.key = key;
    pivot.add(mesh);
  };
  if (d.glazed) {
    const b = 0.09;
    part('doors', 0, b, 0, h, -t / 2, t / 2);
    part('doors', w - b, w, 0, h, -t / 2, t / 2);
    part('doors', b, w - b, 0, 0.18, -t / 2, t / 2);
    part('doors', b, w - b, h - b, h, -t / 2, t / 2);
    part('glass', b, w - b, 0.18, h - b, -0.004, 0.004);
  } else {
    part('doors', 0, w, 0, h, -t / 2, t / 2);
  }
  for (const z of [-1, 1]) part('handles', w - 0.16, w - 0.04, 1.0, 1.02, z * (t / 2 + 0.03) - 0.01, z * (t / 2 + 0.03) + 0.01);
}

function buildWindow(ctx: BuildContext, o: Opening, f: WallFrame) {
  const spec = o.window!;
  const mid = (o.from + o.to) / 2;
  const indoor = (c: number) => {
    const r = roomAt(...f.point(mid, c));
    return !!r && !r.outdoor;
  };
  const insideAtC1 = indoor(f.c1 + 0.1);
  const out = insideAtC1 ? f.c0 : f.c1;
  const inFace = insideAtC1 ? f.c1 : f.c0;
  const dirIn = insideAtC1 ? 1 : -1;

  // Frame set towards the outside, leaving a deep painted reveal inside
  const fa = out + dirIn * 0.05;
  const fb = out + dirIn * 0.13;
  const fw = 0.06;
  const add = (a0: number, a1: number, z0: number, z1: number, cA = fa, cB = fb) =>
    ctx.box('windows', f.rect(a0, a1, cA, cB), z0, z1);

  add(o.from, o.from + fw, o.bottom, o.top);
  add(o.to - fw, o.to, o.bottom, o.top);
  add(o.from, o.to, o.bottom, o.bottom + fw);
  add(o.from, o.to, o.top - fw, o.top);
  for (let k = 1; k < spec.panes; k++) {
    const a = o.from + ((o.to - o.from) * k) / spec.panes;
    add(a - 0.03, a + 0.03, o.bottom, o.top);
  }
  if (spec.transom) {
    const z = o.bottom + (o.top - o.bottom) * spec.transom;
    add(o.from, o.to, z - 0.02, z + 0.02, fa + dirIn * 0.015, fb - dirIn * 0.015);
  }

  const g = (fa + fb) / 2;
  ctx.box('glass', f.rect(o.from + fw, o.to - fw, g - 0.003, g + 0.003), o.bottom + fw, o.top - fw, { castShadow: false });

  // Interior sill board, protruding slightly into the room
  ctx.box('trim', f.rect(o.from - 0.04, o.to + 0.04, fb, inFace + dirIn * 0.04), o.bottom - 0.03, o.bottom);
}
