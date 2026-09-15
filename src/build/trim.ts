import { rooms, walls } from '../data/apartment';
import type { Vec2 } from '../data/types';
import { inRect, signedArea } from '../core/geom';
import type { BuildContext } from './context';
import { doorPassages } from './openings';

const SKIRTING_H = 0.07;
const STEP = 0.02;

/** Skirting boards along every wall-backed edge of the dry rooms. */
export function buildTrim(ctx: BuildContext) {
  const doors = doorPassages();
  const solid = (x: number, y: number) => walls.some((w) => w.kind !== 'beam' && inRect(x, y, w));
  const inDoor = (x: number, y: number) => doors.some((r) => inRect(x, y, r));

  for (const room of rooms) {
    if (room.outdoor || room.id === 'bad') continue;
    const poly = room.polygon;
    const ccw = signedArea(poly) > 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const u: Vec2 = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
      const out: Vec2 = ccw ? [u[1], -u[0]] : [-u[1], u[0]];
      const yaw = Math.atan2(u[1], u[0]);
      const at = (t: number, off: number): Vec2 => [p[0] + u[0] * t + out[0] * off, p[1] + u[1] * t + out[1] * off];

      const runs = scan(len, (t) => {
        const [x, y] = at(t, 0.04);
        return solid(x, y) && !inDoor(x, y);
      });

      for (const [t0, t1] of runs) {
        ctx.orientedBox('trim', at((t0 + t1) / 2, -0.006), t1 - t0, 0.012, 0, SKIRTING_H, yaw, { castShadow: false });
      }
    }
  }
}

function scan(len: number, ok: (t: number) => boolean): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let t = 0; t < len; t += STEP) {
    const hit = ok(Math.min(t + STEP / 2, len));
    if (hit && start < 0) start = t;
    if (!hit && start >= 0) {
      runs.push([start, t]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, len]);
  return runs.filter(([a, b]) => b - a > 0.03);
}
