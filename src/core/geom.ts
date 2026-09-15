import * as THREE from 'three';
import { rooms } from '../data/apartment';
import type { Rect, Room, Vec2 } from '../data/types';

/** Plan (x east, y north, z up) → three.js world (x, y up, z south). */
export const toWorld = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

export function pointInPolygon(x: number, y: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Positive for counter-clockwise polygons (in plan orientation). */
export function signedArea(poly: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

export const inRect = (x: number, y: number, r: Rect, margin = 0) =>
  x >= r.x0 - margin && x <= r.x1 + margin && y >= r.y0 - margin && y <= r.y1 + margin;

export function roomAt(x: number, y: number): Room | undefined {
  return rooms.find((r) => pointInPolygon(x, y, r.polygon));
}

/** Flat polygon facing up (floors) or down (ceilings), at height 0. */
export function polygonGeometry(poly: Vec2[], facing: 'up' | 'down'): THREE.BufferGeometry {
  const flip = facing === 'up' ? 1 : -1;
  const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, flip * y)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX((-flip * Math.PI) / 2);
  return geo;
}

/** Polygon extruded upwards from 0 to `depth`. Groups: 0 = top/bottom caps, 1 = sides. */
export function slabGeometry(poly: Vec2[], depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function bboxCenter(poly: Vec2[]): Vec2 {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

/** Bounding-box width (east-west) and depth (north-south) of a plan polygon, in metres. */
export function bboxSize(poly: Vec2[]): Vec2 {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}
