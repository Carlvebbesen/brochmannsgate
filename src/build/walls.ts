import * as THREE from 'three';
import { CEILING, openings, rooms, walls } from '../data/apartment';
import type { Opening, Rect, Vec2, Wall } from '../data/types';
import { roomAt, toWorld } from '../core/geom';
import type { BuildContext } from './context';

const EPS = 1e-4;
type Role = 'full' | 'sill' | 'lintel';

export const isHorizontal = (w: Wall) => w.x1 - w.x0 >= w.y1 - w.y0;

/**
 * Walls are split into box pieces: around openings (sill + lintel) and wherever the room on
 * either side changes, so every face can take the wall colour of the room it faces.
 * BoxGeometry face order: 0 +x, 1 −x, 2 top, 3 bottom, 4 +z (plan −y), 5 −z (plan +y).
 */
export function buildWalls(ctx: BuildContext) {
  for (const wall of walls) {
    const horiz = isHorizontal(wall);
    const [a0, a1] = horiz ? [wall.x0, wall.x1] : [wall.y0, wall.y1];
    const [c0, c1] = horiz ? [wall.y0, wall.y1] : [wall.x0, wall.x1];
    const ops = openings.filter((o) => o.wall === wall.id);
    const zb = wall.bottom ?? 0;
    const zt = wall.top ?? CEILING;

    const cuts = [a0, a1, ...ops.flatMap((o) => [o.from, o.to])];
    for (const room of rooms) {
      for (const [vx, vy] of room.polygon) {
        const a = horiz ? vx : vy;
        const c = horiz ? vy : vx;
        if (a > a0 + EPS && a < a1 - EPS && c > c0 - 0.25 && c < c1 + 0.25) cuts.push(a);
      }
    }
    const stops = dedupe(cuts.sort((p, q) => p - q));

    let piece = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const [p, q] = [stops[i], stops[i + 1]];
      const r: Rect = horiz ? { x0: p, x1: q, y0: c0, y1: c1 } : { x0: c0, x1: c1, y0: p, y1: q };
      const op = ops.find((o) => (p + q) / 2 > o.from && (p + q) / 2 < o.to);
      if (!op) {
        addPiece(ctx, wall, r, horiz, zb, zt, 'full', ops, piece++);
        continue;
      }
      if (op.bottom > zb + EPS) addPiece(ctx, wall, r, horiz, zb, op.bottom, 'sill', ops, piece++);
      if (op.top < zt - EPS) addPiece(ctx, wall, r, horiz, op.top, zt, 'lintel', ops, piece++);
    }

    // Footing below floor level so the building reads as a solid slab from outside.
    if (wall.kind !== 'beam') ctx.box('exterior', wall, -0.2, 0, { pickable: false, castShadow: false });
  }
}

function addPiece(ctx: BuildContext, wall: Wall, r: Rect, horiz: boolean, z0: number, z1: number, role: Role, ops: Opening[], idx: number) {
  const keys = [0, 1, 2, 3, 4, 5].map((f) => faceKey(f, wall, r, horiz, role, ops));
  const ids = keys.map((_, f) => `${wall.id}:${idx}:${f}`);
  const geo = new THREE.BoxGeometry(r.x1 - r.x0, z1 - z0, r.y1 - r.y0);
  const mesh = new THREE.Mesh(
    geo,
    keys.map((k, f) => ctx.mats.face(ids[f], k)),
  );
  mesh.position.copy(toWorld((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, (z0 + z1) / 2));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { faces: keys, faceIds: ids };
  ids.forEach((id, f) => ctx.mats.bindFace(id, mesh, f, keys[f]));
  ctx.root.add(mesh);
  if (z0 < 1.2 && wall.kind !== 'beam') ctx.obstacles.push(r);
}

function faceKey(f: number, wall: Wall, r: Rect, horiz: boolean, role: Role, ops: Opening[]): string {
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  if (f === 2) return role === 'sill' ? 'trim' : 'walltops';
  if (f === 3) {
    if (role === 'lintel') return 'trim';
    if (wall.kind === 'beam') return wallsKeyAt([cx, cy]);
    return 'walltops';
  }
  const isEnd = horiz ? f <= 1 : f >= 4;
  if (isEnd && role === 'full') {
    // plus end = towards larger along-coordinate: plan +x (face 0) or plan +y (face 5)
    const plusEnd = horiz ? f === 0 : f === 5;
    const edge = plusEnd ? (horiz ? r.x1 : r.y1) : horiz ? r.x0 : r.y0;
    const jamb = ops.some((o) => Math.abs((plusEnd ? o.from : o.to) - edge) < 1e-3);
    if (jamb) return 'trim';
  }
  const e = 0.03;
  const pt: Vec2 = f === 0 ? [r.x1 + e, cy] : f === 1 ? [r.x0 - e, cy] : f === 4 ? [cx, r.y0 - e] : [cx, r.y1 + e];
  return wallsKeyAt(pt);
}

function wallsKeyAt([x, y]: Vec2): string {
  const room = roomAt(x, y);
  return room && !room.outdoor ? `${room.id}.walls` : 'exterior';
}

function dedupe(sorted: number[]): number[] {
  const out: number[] = [];
  for (const v of sorted) if (!out.length || v - out[out.length - 1] > EPS) out.push(v);
  return out;
}
