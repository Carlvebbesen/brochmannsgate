import * as THREE from 'three';
import { toWorld } from '../core/geom';
import { kitchenRuns } from '../data/apartment';
import type { CabinetFront, CabinetRun, Rect, Vec2 } from '../data/types';
import type { BuildContext } from './context';

const FRONT_T = 0.019; // door and drawer fronts
const GAP = 0.004; // shadow gap between fronts
const PLINTH_INSET = 0.06;
const WORKTOP_T = 0.03;
const OVERHANG = 0.02; // worktop past the fronts
const SINK_DEPTH = 0.18; // worktop top → basin floor
const PULLS = [0.096, 0.128, 0.16, 0.192, 0.256, 0.32]; // standard bar-pull lengths

/** Worktop cut-out, in run coordinates. */
interface Hole {
  a0: number;
  a1: number;
  d0: number;
  d1: number;
}

/** Kitchen runs: carcasses, fronts with shadow gaps, bar pulls, worktops, and the sink, hob and ovens. */
export function buildKitchen(ctx: BuildContext) {
  for (const run of kitchenRuns) {
    new RunBuilder(ctx, run).build();
    if (run.z0 < 1) ctx.obstacles.push({ x0: run.x0, x1: run.x1, y0: run.y0, y1: run.y1 });
  }
}

/**
 * Builds one run in its own coordinates: `a` along the run from its x0/y0 end, `d` inwards from the front face
 * (negative = in front of it), `z` up.
 */
class RunBuilder {
  private readonly alongX: boolean;
  private readonly length: number;
  private readonly depth: number;
  /** Underside of the fronts (top of the plinth). */
  private readonly bottom: number;
  /** Top of the worktop. */
  private readonly top: number;

  constructor(
    private readonly ctx: BuildContext,
    private readonly run: CabinetRun,
  ) {
    this.alongX = run.front === '+y' || run.front === '-y';
    const [w, h] = [run.x1 - run.x0, run.y1 - run.y0];
    this.length = this.alongX ? w : h;
    this.depth = this.alongX ? h : w;
    this.bottom = run.z0 + (run.plinth ?? 0);
    this.top = run.z1 + WORKTOP_T;
  }

  build() {
    const { run, length, depth, bottom } = this;
    if (run.plinth) this.box('kitchen.fronts', 0, length, PLINTH_INSET, depth, run.z0, bottom);
    // Dark backing just behind the fronts: it shows through the gaps as shadow lines
    this.box('shadowGap', 0.001, length - 0.001, FRONT_T - 0.001, FRONT_T, bottom, run.z1);

    const frontTop = run.z1 - (run.worktop ? GAP : 0);
    const units = spans(run.units.map((u) => u.width), length, `kitchen run ${run.id}`);
    let hole: Hole | undefined;
    units.forEach(([a0, a1], i) => {
      const unit = run.units[i];
      // Carcass; under the sink it stops below the basin
      this.box('kitchen.fronts', a0, a1, FRONT_T, depth, bottom, unit.sink ? this.top - SINK_DEPTH - 0.01 : run.z1);

      const fa0 = a0 + (i > 0 ? GAP / 2 : 0);
      const fa1 = a1 - (i < units.length - 1 ? GAP / 2 : 0);
      const stack = spans(unit.fronts.map((f) => f.height), frontTop - bottom, `kitchen run ${run.id}, unit ${i + 1}`);
      stack.forEach(([h0, h1], j) => {
        const z0 = bottom + h0 + (j > 0 ? GAP / 2 : 0);
        const z1 = bottom + h1 - (j < stack.length - 1 ? GAP / 2 : 0);
        this.front(unit.fronts[j], fa0, fa1, z0, z1);
      });

      if (unit.sink) hole = this.sink(a0, a1);
      if (unit.hob) this.hob(a0, a1);
    });
    if (run.worktop) this.worktop(hole);
  }

  private front(f: CabinetFront, a0: number, a1: number, z0: number, z1: number) {
    if (f.kind === 'oven') return this.oven(a0, a1, z0, z1);
    this.box('kitchen.fronts', a0, a1, 0, FRONT_T, z0, z1);
    const h = z1 - z0;
    if (f.kind === 'drawer') {
      this.pull((a0 + a1) / 2, h < 0.2 ? (z0 + z1) / 2 : z1 - 0.06, pullLength((a1 - a0) * 0.55), false);
    } else if (f.kind === 'door') {
      const len = pullLength(Math.min(h > 0.9 ? 0.32 : 0.192, h * 0.5));
      const a = f.hinge === 'end' ? a0 + 0.045 : a1 - 0.045;
      // Near the bottom on high doors, near the top on low ones, at hand height on tall ones
      const lo = z0 + 0.05 + len / 2;
      const hi = z1 - 0.05 - len / 2;
      const z = (z0 + z1) / 2 > 1.4 ? lo : z1 <= 1.0 ? hi : THREE.MathUtils.clamp(1.05, lo, hi);
      this.pull(a, z, len, true);
    }
  }

  /** Black glass door with a window, a control display and a full-width steel bar. */
  private oven(a0: number, a1: number, z0: number, z1: number) {
    const mid = (a0 + a1) / 2;
    this.box('kitchen.appliances', a0, a1, 0, FRONT_T, z0, z1);
    this.box('ovenGlass', a0 + 0.06, a1 - 0.06, -0.001, 0, z0 + 0.05, z1 - 0.16);
    this.box('shadowGap', mid - 0.06, mid + 0.06, -0.001, 0, z1 - 0.065, z1 - 0.035);
    this.pull(mid, z1 - 0.11, a1 - a0 - 0.1, false, 'steel', 0.045);
  }

  /** Bar pull: a round bar on two posts, along the run or vertical, centred on (a, z). */
  private pull(a: number, z: number, length: number, vertical: boolean, key = 'kitchen.handles', standoff = 0.03) {
    this.rod(key, a, -standoff, z, 0.006, length, vertical ? 'z' : 'a');
    for (const s of [-1, 1]) {
      const off = s * (length / 2 - 0.012);
      this.rod(key, vertical ? a : a + off, -standoff / 2, vertical ? z + off : z, 0.004, standoff, 'd');
    }
  }

  /** Steel undermount basin with a drain and an L-shaped tap behind it. Returns the worktop cut-out. */
  private sink(a0: number, a1: number): Hole {
    const { top } = this;
    const ac = (a0 + a1) / 2;
    const w = Math.min(0.4, a1 - a0 - 0.1);
    const h: Hole = { a0: ac - w / 2, a1: ac + w / 2, d0: 0.08, d1: Math.min(this.depth - 0.12, 0.48) };
    const floor = top - SINK_DEPTH;
    const rim = top - WORKTOP_T;
    const t = 0.003;
    this.box('steel', h.a0, h.a1, h.d0, h.d1, floor, floor + t);
    this.box('steel', h.a0 - t, h.a0, h.d0 - t, h.d1 + t, floor, rim);
    this.box('steel', h.a1, h.a1 + t, h.d0 - t, h.d1 + t, floor, rim);
    this.box('steel', h.a0, h.a1, h.d0 - t, h.d0, floor, rim);
    this.box('steel', h.a0, h.a1, h.d1, h.d1 + t, floor, rim);
    this.rod('shadowGap', ac, (h.d0 + h.d1) / 2, floor + t + 0.001, 0.03, 0.002, 'z');

    const td = h.d1 + 0.055;
    const reach = 0.24;
    this.rod('steel', ac, td, top + 0.02, 0.022, 0.04, 'z'); // base
    this.rod('steel', ac, td, top + 0.19, 0.011, 0.3, 'z'); // riser
    this.rod('steel', ac, td - reach / 2, top + 0.33, 0.011, reach, 'd'); // spout
    this.rod('steel', ac, td - reach, top + 0.305, 0.013, 0.05, 'z'); // outlet
    this.rod('steel', ac + 0.04, td, top + 0.09, 0.006, 0.05, 'a'); // lever
    return h;
  }

  /** Frameless induction hob with a downdraft vent down the middle and four cooking zones. */
  private hob(a0: number, a1: number) {
    const { top } = this;
    const ac = (a0 + a1) / 2;
    const dc = (this.depth - OVERHANG) / 2;
    const hw = Math.min(0.78, a1 - a0 - 0.02) / 2;
    this.box('kitchen.appliances', ac - hw, ac + hw, dc - 0.26, dc + 0.26, top, top + 0.006);
    this.box('shadowGap', ac - 0.045, ac + 0.045, dc - 0.2, dc + 0.2, top + 0.006, top + 0.0065);
    for (const sa of [-1, 1]) {
      for (const sd of [-1, 1]) this.ring(ac + sa * 0.2, dc + sd * 0.12, top + 0.0065, sd > 0 ? 0.09 : 0.075);
    }
  }

  private worktop(hole?: Hole) {
    const { length, depth } = this;
    const parts: [number, number, number, number][] = hole
      ? [
          [0, hole.a0, -OVERHANG, depth],
          [hole.a1, length, -OVERHANG, depth],
          [hole.a0, hole.a1, -OVERHANG, hole.d0],
          [hole.a0, hole.a1, hole.d1, depth],
        ]
      : [[0, length, -OVERHANG, depth]];
    for (const [a0, a1, d0, d1] of parts) this.box('kitchen.worktop', a0, a1, d0, d1, this.run.z1, this.top);
  }

  private ring(a: number, d: number, z: number, r: number) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(r - 0.004, r, 48), this.ctx.mats.get('hobMarks'));
    mesh.rotation.x = -Math.PI / 2;
    const [x, y] = this.point(a, d);
    mesh.position.copy(toWorld(x, y, z));
    this.ctx.root.add(mesh);
  }

  private rect(a0: number, a1: number, d0: number, d1: number): Rect {
    const { run } = this;
    const s = this.alongX ? run.x0 : run.y0;
    switch (run.front) {
      case '+y':
        return { x0: s + a0, x1: s + a1, y0: run.y1 - d1, y1: run.y1 - d0 };
      case '-y':
        return { x0: s + a0, x1: s + a1, y0: run.y0 + d0, y1: run.y0 + d1 };
      case '+x':
        return { x0: run.x1 - d1, x1: run.x1 - d0, y0: s + a0, y1: s + a1 };
      case '-x':
        return { x0: run.x0 + d0, x1: run.x0 + d1, y0: s + a0, y1: s + a1 };
    }
  }

  private point(a: number, d: number): Vec2 {
    const r = this.rect(a, a, d, d);
    return [r.x0, r.y0];
  }

  private box(key: string, a0: number, a1: number, d0: number, d1: number, z0: number, z1: number) {
    return this.ctx.box(key, this.rect(a0, a1, d0, d1), z0, z1);
  }

  /** Rod along the run ('a'), out of the front ('d') or vertical ('z'). */
  private rod(key: string, a: number, d: number, z: number, radius: number, length: number, axis: 'a' | 'd' | 'z') {
    const plan = axis === 'z' ? 'z' : (axis === 'a') === this.alongX ? 'x' : 'y';
    return this.ctx.cylinder(key, this.point(a, d), z, radius, length, plan);
  }
}

/** The longest standard pull that fits in `max`. */
function pullLength(max: number): number {
  return PULLS.filter((l) => l <= max + 1e-6).at(-1) ?? PULLS[0];
}

/** Consecutive [start, end] spans; the one entry without a size takes what is left of `total`. */
function spans(sizes: (number | undefined)[], total: number, what: string): [number, number][] {
  const fixed = sizes.reduce<number>((s, v) => s + (v ?? 0), 0);
  const open = sizes.filter((v) => v === undefined).length;
  const rest = total - fixed;
  if (open > 1 || rest < -1e-6 || (open === 0 && Math.abs(rest) > 1e-3)) {
    throw new Error(`${what}: sizes add up to ${fixed.toFixed(3)} m of ${total.toFixed(3)} m`);
  }
  let at = 0;
  return sizes.map((v) => {
    const s = at;
    at += v ?? rest;
    return [s, at];
  });
}
