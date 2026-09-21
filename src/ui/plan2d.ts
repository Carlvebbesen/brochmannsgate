/*
 * El-plan: a flat 2D top view of the apartment, drawn as SVG straight from `src/data/apartment.ts`,
 * with the electrical points (`src/data/electrical.ts`) on top.
 *
 * Coordinates are the plan's own metres (x = east, y = north); SVG y is simply -y, so the
 * drawing is always to scale and prints as a sheet an electrician can read.
 *
 * Wall points (sockets, switches, wall lights) attach to the nearest visible wall or cabinet face:
 * the symbol stands on that face and turns to point into the room. The base under the points is
 * either the drawn floor plan or the 3D model rendered straight down (`renderModel`, from main.ts).
 */

import { balcony, fixtures, kitchenRuns, openings, rooms, walls } from '../data/apartment';
import {
  EL_STATUS,
  EL_TYPES,
  SYMBOL_R,
  elType,
  formatHeight,
  glyphIcon,
  itemHeight,
  onWall,
  type ElStatus,
  type ElType,
  type ElectricalItem,
  type ElTypeId,
} from '../data/electrical';
import { footprints, type FurnitureId } from '../data/furniture';
import type { Opening, Rect, Room, Vec2, Wall } from '../data/types';
import { pointInPolygon } from '../core/geom';
import type { ColorStore, ElPhase } from '../core/state';

const NS = 'http://www.w3.org/2000/svg';

/** Colour per status; `remove` also gets a cross through the symbol. */
export const STATUS_COLOR: Record<ElStatus, string> = {
  existing: '#8a8f94',
  new: '#1f6fd0',
  remove: '#c0392b',
};

const MARGIN = 0.9; // metres of paper around the flat
const LEGEND_H = 3.4; // metres of drawing height reserved under the plan for the legend
/** Pixels per metre the 3D top view is rendered at. */
const MODEL_PPM = 150;

const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const path = (d: string, attrs: Record<string, string | number> = {}) => el('path', { d, ...attrs });

const text = (x: number, y: number, s: string, attrs: Record<string, string | number> = {}) => {
  const t = el('text', { x, y: -y, 'text-anchor': 'middle', ...attrs });
  t.textContent = s;
  return t;
};

const polygonPoints = (poly: Vec2[]) => poly.map(([x, y]) => `${x},${-y}`).join(' ');

const isHorizontal = (w: Rect) => w.x1 - w.x0 >= w.y1 - w.y0;

function centroid(poly: Vec2[]): Vec2 {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return a === 0 ? poly[0] : [cx / (6 * a), cy / (6 * a)];
}

const area = (poly: Vec2[]) => {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
};

const round = (v: number, step: number) => Math.round(v / step) * step;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmtM = (d: number) => d.toFixed(2);

// ---- Wall geometry shared by drawing, snapping and measuring

/** The solid stretches of a wall along its long axis, with its doors, windows and openings cut out. */
function wallSegments(w: Wall): [number, number][] {
  const horiz = isHorizontal(w);
  const a0 = horiz ? w.x0 : w.y0;
  const a1 = horiz ? w.x1 : w.y1;
  const holes = openings
    .filter((o) => o.wall === w.id)
    .map((o) => [Math.max(a0, o.from), Math.min(a1, o.to)] as const)
    .sort((p, q) => p[0] - q[0]);
  let cursor = a0;
  const segments: [number, number][] = [];
  for (const [from, to] of holes) {
    if (from > cursor) segments.push([cursor, from]);
    cursor = Math.max(cursor, to);
  }
  if (cursor < a1) segments.push([cursor, a1]);
  return segments;
}

const segmentRect = (w: Wall, [s0, s1]: [number, number]): Rect =>
  isHorizontal(w) ? { x0: s0, x1: s1, y0: w.y0, y1: w.y1 } : { x0: w.x0, x1: w.x1, y0: s0, y1: s1 };

/** Base cabinets: a point over one belongs on the wall behind the worktop. Upper cabinets never carry a point. */
const COUNTERS = kitchenRuns.filter((r) => r.z0 < 1 && r.z1 < 1.2);

/** One side of a wall or built-in, with its outward normal: something can be mounted on it. */
interface Face {
  /** Fixed coordinate across the face (y for a horizontal face, x for a vertical one). */
  at: number;
  /** Extent along the face. */
  lo: number;
  hi: number;
  n: Vec2;
  wall: Wall | null;
  src: Rect;
}

/**
 * Every exposed face of the walls, kitchen runs and low built-ins. The parts of a face that are
 * covered by another wall (a T-junction, a wall end butting into a corner) are cut away, so
 * nothing can attach to the inside of the masonry.
 */
const FACES: Face[] = (() => {
  const solids: { r: Rect; wall: Wall | null }[] = [
    ...walls.map((w) => ({ r: w as Rect, wall: w })),
    ...kitchenRuns.filter((r) => r.z0 < 1).map((r) => ({ r: r as Rect, wall: null })),
    ...fixtures.filter((f) => !f.ceiling && f.z0 < 1.6).map((r) => ({ r: r as Rect, wall: null })),
  ];
  const out: Face[] = [];
  for (const { r, wall } of solids) {
    const sides: { at: number; lo: number; hi: number; n: Vec2 }[] = [
      { at: r.y0, lo: r.x0, hi: r.x1, n: [0, -1] },
      { at: r.y1, lo: r.x0, hi: r.x1, n: [0, 1] },
      { at: r.x0, lo: r.y0, hi: r.y1, n: [-1, 0] },
      { at: r.x1, lo: r.y0, hi: r.y1, n: [1, 0] },
    ];
    for (const side of sides) {
      const horiz = side.n[0] === 0;
      const probe = side.at + (horiz ? side.n[1] : side.n[0]) * 0.01;
      // Stretches of this face hidden by other walls
      const covered = walls
        .filter((w) => w !== r && (horiz ? probe > w.y0 && probe < w.y1 : probe > w.x0 && probe < w.x1))
        .map((w) => (horiz ? [w.x0, w.x1] : [w.y0, w.y1]) as [number, number])
        .sort((p, q) => p[0] - q[0]);
      let cursor = side.lo;
      for (const [c0, c1] of covered) {
        if (c1 <= cursor || c0 >= side.hi) continue;
        if (c0 - cursor > 0.02) out.push({ ...side, lo: cursor, hi: c0, wall, src: r });
        cursor = Math.max(cursor, c1);
      }
      if (side.hi - cursor > 0.02) out.push({ ...side, lo: cursor, wall, src: r });
    }
  }
  return out;
})();

/** Where a wall point sits: on the face (`p`), and the direction into the room (`n`). */
export interface Mount {
  p: Vec2;
  n: Vec2;
  face: Face;
}

/**
 * The face a point at (x, y) belongs to: the nearest one it is in front of (or at most `behind`
 * behind), within `reach`. A real wall wins a near tie against a cabinet side on the same line.
 *
 * A point over a worktop goes on the wall behind it (up to 75 cm back); over an island, with no
 * wall behind, on the island's own nearest side.
 */
function mountAt(x: number, y: number, reach = 0.2, behind = 0.03): Mount | null {
  const counter = COUNTERS.find((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);
  if (counter) {
    // The wall behind the worktop faces the same way as the cabinet fronts.
    const front: Vec2 = { '+x': [1, 0], '-x': [-1, 0], '+y': [0, 1], '-y': [0, -1] }[counter.front] as Vec2;
    return (
      nearestFace(x, y, (f) => f.wall !== null && f.n[0] === front[0] && f.n[1] === front[1], -behind, 0.75) ??
      nearestFace(x, y, (f) => f.src === counter, -Infinity, 0)
    );
  }
  return nearestFace(x, y, () => true, -behind, reach);
}

function nearestFace(x: number, y: number, ok: (f: Face) => boolean, sMin: number, sMax: number): Mount | null {
  let best: Mount | null = null;
  let bestScore = Infinity;
  for (const f of FACES) {
    if (!ok(f)) continue;
    const horiz = f.n[0] === 0;
    const along = horiz ? x : y;
    if (along < f.lo - 0.02 || along > f.hi + 0.02) continue;
    const s = horiz ? (y - f.at) * f.n[1] : (x - f.at) * f.n[0];
    if (s < sMin || s > sMax) continue;
    const score = Math.abs(s) + (f.wall ? 0 : 0.015);
    if (score >= bestScore) continue;
    bestScore = score;
    const a = clamp(along, f.lo, f.hi);
    best = { p: horiz ? [a, f.at] : [f.at, a], n: f.n, face: f };
  }
  return best;
}

type HitKind = 'wall' | 'door' | 'window' | 'opening' | 'end' | 'point';

/**
 * Distance from `o` along an axis-aligned direction to the first wall, or null. Door holes count
 * as wall: a ceiling light is measured to the wall line, not through the doorway.
 */
function castRay(o: Vec2, dir: Vec2): number | null {
  let best: number | null = null;
  for (const r of walls) {
    let d: number | null = null;
    if (dir[0] !== 0) {
      if (o[1] <= r.y0 || o[1] >= r.y1) continue;
      d = dir[0] > 0 ? r.x0 - o[0] : o[0] - r.x1;
    } else {
      if (o[0] <= r.x0 || o[0] >= r.x1) continue;
      d = dir[1] > 0 ? r.y0 - o[1] : o[1] - r.y1;
    }
    if (d >= -1e-6 && (best === null || d < best)) best = Math.max(0, d);
  }
  return best;
}

/** One dimension from a point: where it starts and ends (plan metres), and what it runs to. */
export interface Dim {
  from: Vec2;
  to: Vec2;
  d: number;
  kind: HitKind;
  /** For wall points: which hand it is on, facing the wall from the room. */
  side?: 'left' | 'right';
}

/**
 * The measurements an electrician needs for a point.
 * - Wall point: along its wall face, on each side, to the corner (or the free end of the wall or
 *   cabinet), or to the edge of a door or window in that wall if one comes first. `stops` adds
 *   more places to stop at (the neighbouring points on the same wall, for chained dimensions).
 * - Ceiling point: to the nearest wall in x and in y.
 */
export function measure(item: ElectricalItem, at: Vec2 = [item.x, item.y], stops: number[] = []): Dim[] {
  const m = onWall(item) ? mountAt(at[0], at[1]) : null;
  if (m) {
    const [nx, ny] = m.n;
    const horiz = nx === 0;
    const a = horiz ? m.p[0] : m.p[1];
    // Facing the wall (looking along -n), the right hand points along (-ny, nx).
    const right: Vec2 = [-ny, nx];
    const host = m.face.wall;
    const edges = host ? openings.filter((q) => q.wall === host.id).flatMap((q) => [q.from, q.to].map((e) => ({ e, kind: q.kind }))) : [];
    const out: Dim[] = [];
    for (const [side, sign] of [['right', 1], ['left', -1]] as const) {
      const dir: Vec2 = [right[0] * sign, right[1] * sign];
      const step = horiz ? dir[0] : dir[1];
      // The end of the face: a corner if another wall stands there, otherwise a free end.
      let best = step > 0 ? m.face.hi - a : a - m.face.lo;
      const ray = castRay([m.p[0] + nx * 0.03, m.p[1] + ny * 0.03], dir);
      let kind: HitKind = ray !== null && ray < best + 0.05 ? 'wall' : 'end';
      for (const { e, kind: k } of edges) {
        const d = (e - a) * step;
        if (d > 0.005 && d < best) {
          best = d;
          kind = k;
        }
      }
      for (const stop of stops) {
        const d = (stop - a) * step;
        if (d > 0.005 && d < best) {
          best = d;
          kind = 'point';
        }
      }
      out.push({ from: m.p, to: [m.p[0] + dir[0] * best, m.p[1] + dir[1] * best], d: best, kind, side });
    }
    return out;
  }
  const out: Dim[] = [];
  for (const axis of [[1, 0], [0, 1]] as Vec2[]) {
    let pick: Dim | null = null;
    for (const sign of [1, -1]) {
      const dir: Vec2 = [axis[0] * sign, axis[1] * sign];
      const d = castRay(at, dir);
      if (d === null || d > 12 || (pick && pick.d <= d)) continue;
      pick = { from: at, to: [at[0] + dir[0] * d, at[1] + dir[1] * d], d, kind: 'wall' };
    }
    if (pick) out.push(pick);
  }
  return out;
}

/** The room a point is in (for a wall point: the room in front of it). */
function roomOf(item: ElectricalItem): Room | null {
  const m = onWall(item) ? mountAt(item.x, item.y) : null;
  const [x, y] = m ? [m.p[0] + m.n[0] * 0.15, m.p[1] + m.n[1] * 0.15] : [item.x, item.y];
  return rooms.find((r) => pointInPolygon(x, y, r.polygon)) ?? null;
}

export interface Plan2DActions {
  /** A point was clicked (or dragged), or the background was clicked (null). */
  select(id: string | null): void;
  /** The plan was clicked while a palette tool was armed. */
  place(type: ElTypeId, x: number, y: number): void;
  /** Renders the 3D model straight down over `rect` (plan metres) at `ppm` pixels per metre; returns an image URL. */
  renderModel(rect: Rect, ppm: number): string;
}

export class Plan2D {
  private readonly svg: SVGSVGElement;
  private readonly backdrop = el('image', { class: 'plan-backdrop', preserveAspectRatio: 'none' });
  private readonly shell = el('g', { class: 'plan-shell' });
  private readonly furnitureLayer = el('g', { class: 'plan-furniture' });
  private readonly labelLayer = el('g', { class: 'plan-labels' });
  private readonly measureLayer = el('g', { class: 'plan-measures' });
  private readonly itemLayer = el('g', { class: 'plan-items' });
  private readonly legend = el('g', { class: 'plan-legend' });
  private readonly tip: HTMLDivElement;
  private readonly bounds: Rect;
  /** The flat itself (the sheet minus the legend strip): what the 3D top view covers. */
  private readonly planRect: Rect;
  private view: Rect;
  private tool: ElTypeId | null = null;
  private editing = false;
  private selected: string | null = null;
  private hover: string | null = null;
  private nodes = new Map<string, SVGGElement>();
  private drag: { id: string; dx: number; dy: number; moved: boolean; at: Vec2 } | null = null;
  private pan: { x: number; y: number; view: Rect } | null = null;
  /** The last press landed on a point. (Pointer capture sends the following click to the svg itself.) */
  private downOnPoint = false;
  private modelUrl: string | null = null;
  private modelDirty = true;

  constructor(
    private readonly host: HTMLElement,
    private readonly store: ColorStore,
    private readonly actions: Plan2DActions,
  ) {
    if (!document.getElementById('plan2d-css')) {
      const style = document.createElement('style');
      style.id = 'plan2d-css';
      style.textContent = PLAN_SVG_CSS;
      document.head.appendChild(style);
    }
    this.svg = el('svg', { class: 'plan2d', xmlns: NS });
    this.svg.append(this.backdrop, this.shell, this.furnitureLayer, this.labelLayer, this.measureLayer, this.itemLayer, this.legend);
    host.appendChild(this.svg);
    this.tip = document.createElement('div');
    this.tip.className = 'plan-tip';
    this.tip.hidden = true;
    host.appendChild(this.tip);

    this.bounds = this.contentBounds();
    this.planRect = { ...this.bounds, y0: this.bounds.y0 + LEGEND_H };
    const { x0, x1, y0, y1 } = this.planRect;
    Object.entries({ x: x0, y: -y1, width: x1 - x0, height: y1 - y0 }).forEach(([k, v]) => this.backdrop.setAttribute(k, String(v)));
    this.view = { ...this.bounds };
    this.applyViewBox();
    this.drawShell();
    this.refresh();
    this.wire();
  }

  setTool(tool: ElTypeId | null) {
    this.tool = tool;
    this.svg.classList.toggle('placing', tool !== null);
  }

  /** Off = view only: points can be hovered and selected, but not placed, moved or deleted. */
  setEditing(on: boolean) {
    this.editing = on;
    this.svg.classList.toggle('editing', on);
    if (!on) this.setTool(null);
  }

  setSelected(id: string | null) {
    this.selected = id;
    this.nodes.forEach((node, key) => node.classList.toggle('sel', key === id));
    this.drawMeasures();
  }

  /** Redraws everything that depends on the store: points, measurements, furniture, base, legend. */
  refresh() {
    this.updateBase();
    this.drawFurniture();
    this.drawItems();
    this.drawMeasures();
    this.drawLegend();
  }

  /** The 3D model changed (colours, furniture…): the top view is re-rendered next time it is shown. */
  invalidateModel() {
    this.modelDirty = true;
  }

  fit() {
    this.view = { ...this.bounds };
    this.applyViewBox();
  }

  /** The whole sheet as a standalone SVG string (for print and PNG export). */
  toSVG(): string {
    const clone = this.svg.cloneNode(true) as SVGSVGElement;
    const { x0, x1, y0, y1 } = this.bounds;
    clone.setAttribute('viewBox', `${x0} ${-y1} ${x1 - x0} ${y1 - y0}`);
    clone.setAttribute('width', String((x1 - x0) * 100));
    clone.setAttribute('height', String((y1 - y0) * 100));
    clone.querySelectorAll('.point.sel').forEach((n) => n.classList.remove('sel'));
    const style = el('style');
    style.textContent = PLAN_SVG_CSS;
    clone.prepend(style);
    return new XMLSerializer().serializeToString(clone);
  }

  // ---- Geometry

  private contentBounds(): Rect {
    const b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    const add = ([x, y]: Vec2) => {
      b.x0 = Math.min(b.x0, x);
      b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y);
      b.y1 = Math.max(b.y1, y);
    };
    for (const r of rooms) r.polygon.forEach(add);
    for (const w of walls) {
      add([w.x0, w.y0]);
      add([w.x1, w.y1]);
    }
    balcony.polygon.forEach(add);
    return { x0: b.x0 - MARGIN, x1: b.x1 + MARGIN, y0: b.y0 - MARGIN - LEGEND_H, y1: b.y1 + MARGIN };
  }

  private applyViewBox() {
    const { x0, x1, y0, y1 } = this.view;
    this.svg.setAttribute('viewBox', `${x0} ${-y1} ${x1 - x0} ${y1 - y0}`);
  }

  /** Client pixel → plan metres. */
  private toPlan(e: { clientX: number; clientY: number }): Vec2 {
    const rect = this.svg.getBoundingClientRect();
    const { x0, x1, y0, y1 } = this.view;
    // The viewBox is fitted with preserveAspectRatio=meet: work out the drawn scale and letterboxing.
    const scale = Math.min(rect.width / (x1 - x0), rect.height / (y1 - y0));
    const offX = (rect.width - (x1 - x0) * scale) / 2;
    const offY = (rect.height - (y1 - y0) * scale) / 2;
    const x = x0 + (e.clientX - rect.left - offX) / scale;
    const y = y1 - (e.clientY - rect.top - offY) / scale;
    return [x, y];
  }

  // ---- The base: drawn plan, or the 3D model rendered from above

  private updateBase() {
    const model = this.store.view.elBase === 'model';
    this.svg.classList.toggle('on-model', model);
    if (!model) return;
    // Rendering is not free (a ~2000 px frame), so only when the sheet is actually on screen.
    if (this.host.hidden || (!this.modelDirty && this.modelUrl)) return;
    this.modelUrl = this.actions.renderModel(this.planRect, MODEL_PPM);
    this.modelDirty = false;
    this.backdrop.setAttribute('href', this.modelUrl);
  }

  // ---- Static drawing: rooms, walls, doors, windows, built-ins

  private drawShell() {
    const g = this.shell;
    g.replaceChildren();

    g.appendChild(el('polygon', { points: polygonPoints(balcony.polygon), class: 'balcony' }));

    for (const room of rooms) {
      g.appendChild(el('polygon', { points: polygonPoints(room.polygon), class: `room ${room.outdoor ? 'outdoor' : ''}` }));
    }

    for (const w of walls) {
      for (const s of wallSegments(w)) {
        const r = segmentRect(w, s);
        g.appendChild(el('rect', { x: r.x0, y: -r.y1, width: r.x1 - r.x0, height: r.y1 - r.y0, class: `wall ${w.kind}` }));
      }
    }
    for (const o of openings) this.drawOpening(g, o);

    // Built-ins (kitchen runs, vanity, radiators…) as light outlines: they decide where a socket can go.
    for (const run of kitchenRuns) {
      g.appendChild(el('rect', { x: run.x0, y: -run.y1, width: run.x1 - run.x0, height: run.y1 - run.y0, class: 'builtin' }));
    }
    for (const f of fixtures) {
      if (f.ceiling || f.z0 > 1.6) continue;
      g.appendChild(el('rect', { x: f.x0, y: -f.y1, width: f.x1 - f.x0, height: f.y1 - f.y0, class: 'builtin' }));
    }

    // Room names live in their own layer: they stay on top of the 3D top view too.
    this.labelLayer.replaceChildren();
    for (const room of rooms) this.drawRoomLabel(this.labelLayer, room);
  }

  private drawRoomLabel(g: SVGGElement, room: Room) {
    const [cx, cy] = room.labelAt ?? centroid(room.polygon);
    g.appendChild(text(cx, cy, room.name.toUpperCase(), { class: 'room-name' }));
    g.appendChild(text(cx, cy - 0.28, `${area(room.polygon).toFixed(1)} m²`, { class: 'room-area' }));
  }

  private drawOpening(g: SVGGElement, o: Opening) {
    const w = walls.find((x) => x.id === o.wall);
    if (!w) return;
    const horiz = isHorizontal(w);
    // Unit vector along the wall, and the wall's centre line / thickness across it.
    const along: Vec2 = horiz ? [1, 0] : [0, 1];
    const across: Vec2 = horiz ? [0, 1] : [1, 0];
    const t0 = horiz ? w.y0 : w.x0;
    const t1 = horiz ? w.y1 : w.x1;
    const mid = (t0 + t1) / 2;
    const at = (a: number, t: number): Vec2 => (horiz ? [a, t] : [t, a]);

    if (o.kind === 'window') {
      const [ax, ay] = at(o.from, mid);
      const [bx, by] = at(o.to, mid);
      g.appendChild(path(`M ${ax} ${-ay} L ${bx} ${-by}`, { class: 'glass' }));
      for (const t of [t0, t1]) {
        const [px, py] = at(o.from, t);
        const [qx, qy] = at(o.to, t);
        g.appendChild(path(`M ${px} ${-py} L ${qx} ${-qy}`, { class: 'jamb' }));
      }
      return;
    }

    // Doorless opening: a light dashed line across the hole.
    if (o.kind === 'opening' || !o.door) {
      const [ax, ay] = at(o.from, mid);
      const [bx, by] = at(o.to, mid);
      g.appendChild(path(`M ${ax} ${-ay} L ${bx} ${-by}`, { class: 'hole' }));
      return;
    }

    const width = o.to - o.from;
    const hingeA = o.door.hinge === 'from' ? o.from : o.to;
    const sign = o.door.hinge === 'from' ? 1 : -1;
    const swingSign = o.door.swing === '+x' || o.door.swing === '+y' ? 1 : -1;
    const H = at(hingeA, mid);
    // Leaf drawn at 90°, with the sweep it covers as an arc (polyline – no SVG sweep flags to get wrong).
    const tip: Vec2 = [H[0] + across[0] * swingSign * width, H[1] + across[1] * swingSign * width];
    g.appendChild(path(`M ${H[0]} ${-H[1]} L ${tip[0]} ${-tip[1]}`, { class: 'leaf' }));
    const arc: string[] = [];
    for (let i = 0; i <= 12; i++) {
      const k = i / 12;
      const px = H[0] + width * (across[0] * swingSign * Math.cos((k * Math.PI) / 2) + along[0] * sign * Math.sin((k * Math.PI) / 2));
      const py = H[1] + width * (across[1] * swingSign * Math.cos((k * Math.PI) / 2) + along[1] * sign * Math.sin((k * Math.PI) / 2));
      arc.push(`${i === 0 ? 'M' : 'L'} ${px} ${-py}`);
    }
    g.appendChild(path(arc.join(' '), { class: 'swing' }));
  }

  private drawFurniture() {
    const g = this.furnitureLayer;
    g.replaceChildren();
    // The 3D top view already shows the real furniture.
    if (!this.store.view.elFurniture || this.store.view.elBase === 'model') return;
    for (const [id, fp] of Object.entries(footprints) as [FurnitureId, { w: number; d: number }][]) {
      const pose = this.store.getPose(id);
      const deg = (-pose.yaw * 180) / Math.PI;
      const rect = el('rect', { x: -fp.w / 2, y: -fp.d / 2, width: fp.w, height: fp.d, class: 'furniture' });
      const wrap = el('g', { transform: `translate(${pose.x} ${-pose.y}) rotate(${deg})` });
      wrap.appendChild(rect);
      g.appendChild(wrap);
    }
  }

  // ---- The points

  private visible(item: ElectricalItem): boolean {
    const phase = this.store.view.elPhase;
    if (phase === 'compare') return true;
    if (phase === 'today') return item.status !== 'new';
    return item.status !== 'remove'; // planned: what the flat ends up with
  }

  private drawItems() {
    const g = this.itemLayer;
    g.replaceChildren();
    this.nodes.clear();
    // Labels placed so far: a label that would land on one of them moves further out into the room.
    const taken: Rect[] = [];
    for (const item of this.store.electrical) {
      if (!this.visible(item)) continue;
      const node = this.itemNode(item, taken);
      this.nodes.set(item.id, node);
      g.appendChild(node);
    }
    this.nodes.forEach((node, key) => node.classList.toggle('sel', key === this.selected));
  }

  /**
   * One point: the glyph (turned onto its wall for wall points) plus its label on the room side.
   * `at` overrides the stored position while it is being dragged.
   */
  private itemNode(item: ElectricalItem, taken: Rect[] = [], at: Vec2 = [item.x, item.y]): SVGGElement {
    const type = elType(item.type);
    const m = onWall(item) ? mountAt(at[0], at[1]) : null;
    const anchor = m ? m.p : at;
    const g = el('g', { class: `point ${item.status}`, 'data-id': item.id, transform: `translate(${anchor[0]} ${-anchor[1]})` });
    g.style.setProperty('--c', STATUS_COLOR[item.status]);

    const wall = onWall(item);
    const n: Vec2 = m ? m.n : [0, 1];
    const deg = (Math.atan2(n[0], n[1]) * 180) / Math.PI;
    const gl = type.glyph;
    const sym = el('g', { transform: `rotate(${deg}) scale(${SYMBOL_R})` });
    // Wall glyphs grow out of the wall (local -y); centre the halo on what is drawn.
    const cy = wall ? -gl.depth / 2 : 0;
    const r = Math.max(gl.half, wall ? gl.depth / 2 : gl.depth) + 0.55;
    sym.appendChild(el('circle', { cy, r: r + 0.35, class: 'hit' }));
    sym.appendChild(el('circle', { cy, r, class: 'halo' }));
    this.appendGlyph(sym, type);
    if (item.status === 'remove') {
      const s = r * 0.8;
      sym.appendChild(path(`M ${-s} ${cy - s} L ${s} ${cy + s} M ${-s} ${cy + s} L ${s} ${cy - s}`, { class: 'strike' }));
    }
    g.appendChild(sym);

    // Label and note, just clear of the glyph on the room side, always upright.
    const dir: Vec2 = wall ? n : [0, -1];
    const lines = [`${type.code}·${formatHeight(itemHeight(item))}`];
    if (item.note) lines.push(item.note.length > 22 ? `${item.note.slice(0, 21)}…` : item.note);
    const sideways = Math.abs(dir[0]) > 0.5;
    // Along the normal for north/south walls (and ceiling points); stacked downwards for east/west walls.
    const place = (out: number) =>
      lines.map((line, i) => {
        const step = i * 0.18;
        const lx = dir[0] * out;
        const ly = sideways ? -step : dir[1] * (out + step);
        const w = line.length * (i === 0 ? 0.095 : 0.075) + 0.04;
        const x0 = sideways ? (dir[0] > 0 ? lx : lx - w) : lx - w / 2;
        return { line, i, lx, ly, box: { x0: anchor[0] + x0, x1: anchor[0] + x0 + w, y0: anchor[1] + ly - 0.09, y1: anchor[1] + ly + 0.09 } };
      });
    const overlaps = (a: Rect) => taken.some((b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0);
    let out = gl.depth * SYMBOL_R + 0.1;
    let placed = place(out);
    for (let k = 0; k < 6 && placed.some((p) => overlaps(p.box)); k++) placed = place((out += 0.2));
    placed.forEach((p) => taken.push(p.box));
    placed.forEach(({ line, i, lx, ly }) => {
      const t = el('text', {
        x: lx,
        y: -ly,
        class: i === 0 ? 'point-label' : 'point-note',
        'text-anchor': sideways ? (dir[0] > 0 ? 'start' : 'end') : 'middle',
        'dominant-baseline': 'central',
      });
      t.textContent = line;
      g.appendChild(t);
    });
    return g;
  }

  /** Adds a type's glyph (in symbol units) to `g`. */
  private appendGlyph(g: SVGGElement, type: ElType) {
    const gl = type.glyph;
    if (gl.body) g.appendChild(path(gl.body, { class: 'sym-body' }));
    if (gl.lines) g.appendChild(path(gl.lines, { class: 'sym' }));
    if (gl.dots) g.appendChild(path(gl.dots, { class: 'sym-dot' }));
  }

  // ---- Measurements

  /** Dimension lines for every point (toggle on), or just the hovered/selected one. */
  /**
   * With the toggle on: chained dimensions along every wall (corner → point → point → corner),
   * plus each ceiling point to its nearest walls. The hovered and selected points always get their
   * own dimensions to the corners, drawn a little further out and highlighted.
   */
  private drawMeasures() {
    const g = this.measureLayer;
    g.replaceChildren();
    const posOf = (item: ElectricalItem): Vec2 => (this.drag?.id === item.id ? this.drag.at : [item.x, item.y]);
    const shown = this.store.electrical.filter((i) => this.visible(i));
    if (this.store.view.elMeasures) {
      const mounts = new Map(shown.filter(onWall).map((i) => [i.id, mountAt(...posOf(i))]));
      const drawn = new Set<string>();
      for (const item of shown) {
        const m = mounts.get(item.id);
        // The other points on the same wall face are where this point's dimensions stop.
        const stops = m
          ? shown.flatMap((o) => {
              const om = o.id === item.id ? null : mounts.get(o.id);
              return om && om.face === m.face ? [om.n[0] === 0 ? om.p[0] : om.p[1]] : [];
            })
          : [];
        for (const dim of measure(item, posOf(item), stops)) {
          // Two neighbours share the stretch between them: draw it once.
          const key = [dim.from, dim.to].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).sort().join('|');
          if (drawn.has(key)) continue;
          drawn.add(key);
          this.drawDim(g, dim, false, m?.n, 0.05);
        }
      }
    }
    for (const id of new Set([this.hover, this.selected])) {
      const item = shown.find((i) => i.id === id);
      if (!item) continue;
      const at = posOf(item);
      const n = onWall(item) ? mountAt(...at)?.n : undefined;
      for (const dim of measure(item, at)) this.drawDim(g, dim, true, n, this.store.view.elMeasures ? 0.3 : 0.05);
    }
  }

  /** A dimension line with end ticks and its length; wall ones run `inset` in front of the wall face. */
  private drawDim(g: SVGGElement, dim: Dim, focus: boolean, wallN?: Vec2, inset = 0.05) {
    if (dim.d < 0.03) return;
    const dg = el('g', { class: `dim ${focus ? 'focus' : ''} ${wallN ? '' : 'ceil'}` });
    const off: Vec2 = wallN ? [wallN[0] * inset, wallN[1] * inset] : [0, 0];
    const a: Vec2 = [dim.from[0] + off[0], dim.from[1] + off[1]];
    const b: Vec2 = [dim.to[0] + off[0], dim.to[1] + off[1]];
    const ux = (b[0] - a[0]) / dim.d;
    const uy = (b[1] - a[1]) / dim.d;
    // Ticks across the line at both ends
    const tx = -uy * 0.06;
    const ty = ux * 0.06;
    dg.appendChild(
      path(
        `M ${a[0]} ${-a[1]} L ${b[0]} ${-b[1]} M ${a[0] - tx} ${-(a[1] - ty)} L ${a[0] + tx} ${-(a[1] + ty)} M ${b[0] - tx} ${-(b[1] - ty)} L ${b[0] + tx} ${-(b[1] + ty)}`,
        { class: 'dim-line' },
      ),
    );
    // Text beside the middle of the line: on the room side for wall dims, above/right for ceiling ones.
    const side: Vec2 = wallN ?? (Math.abs(ux) > 0.5 ? [0, 1] : [1, 0]);
    const mx = (a[0] + b[0]) / 2 + side[0] * 0.1;
    const my = (a[1] + b[1]) / 2 + side[1] * 0.1;
    const vertical = Math.abs(uy) > 0.5;
    const t = el('text', {
      x: mx,
      y: -my,
      class: 'dim-text',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: vertical ? `rotate(-90 ${mx} ${-my})` : '',
    });
    t.textContent = fmtM(dim.d);
    dg.appendChild(t);
    g.appendChild(dg);
  }

  // ---- Hover card

  private setHover(id: string | null, e?: { clientX: number; clientY: number }) {
    if (id !== this.hover) {
      this.hover = id;
      this.drawMeasures();
    }
    const item = id ? this.store.electrical.find((i) => i.id === id) : null;
    if (!item || !e || this.drag) {
      this.tip.hidden = true;
      return;
    }
    if (this.tip.dataset.id !== item.id) {
      this.tip.dataset.id = item.id;
      this.tip.innerHTML = this.tipHtml(item);
    }
    this.tip.hidden = false;
    const host = this.host.getBoundingClientRect();
    const x = e.clientX - host.left;
    const y = e.clientY - host.top;
    const w = this.tip.offsetWidth;
    const h = this.tip.offsetHeight;
    // Beside the cursor, flipped to the other side near the edges.
    this.tip.style.left = `${x + 16 + w > host.width ? x - 16 - w : x + 16}px`;
    this.tip.style.top = `${clamp(y - h / 2, 8, host.height - h - 8)}px`;
  }

  private tipHtml(item: ElectricalItem): string {
    const type = elType(item.type);
    const h = itemHeight(item);
    const status = EL_STATUS.find((s) => s.id === item.status)!;
    const room = roomOf(item);
    const dims = measure(item);
    const what: Record<HitKind, string> = { wall: 'corner', door: 'door', window: 'window', opening: 'opening', end: 'end of wall', point: 'next point' };
    const dimLines = onWall(item)
      ? dims.map((d) => `<div><span>${d.side === 'left' ? 'Left' : 'Right'}</span>${fmtM(d.d)} m to ${d.kind === 'end' && !mountAt(item.x, item.y)?.face.wall ? 'cabinet end' : what[d.kind]}</div>`).join('')
      : dims.map((d) => `<div><span>${d.to[0] !== d.from[0] ? (d.to[0] > d.from[0] ? 'East' : 'West') : d.to[1] > d.from[1] ? 'North' : 'South'}</span>${fmtM(d.d)} m to wall</div>`).join('');
    return /* html */ `
      <div class="tip-head">
        ${glyphIcon(type, STATUS_COLOR[item.status])}
        <div><strong>${type.label}</strong><span>${type.no}</span></div>
      </div>
      <div class="tip-rows">
        <div><span>Status</span><b style="color:${STATUS_COLOR[item.status]}">${status.label}</b></div>
        <div><span>Height</span>${h === null ? 'In the ceiling' : `${Math.round(h)} cm above floor`}</div>
        ${room ? `<div><span>Room</span>${escapeHtml(room.name)}</div>` : ''}
        ${dimLines}
        ${item.note ? `<div class="tip-note">${escapeHtml(item.note)}</div>` : ''}
      </div>
      <div class="tip-hint">${this.editing ? 'Click to edit · drag to move' : 'Click for details · turn on Edit to change'}</div>
    `;
  }

  // ---- Legend & title block, drawn under the plan so it is part of the printed sheet

  private drawLegend() {
    const g = this.legend;
    g.replaceChildren();
    const { x0, x1, y0 } = this.bounds;
    const top = y0 + LEGEND_H - 0.3;
    const left = x0 + 0.5;

    const title = text(left, top, 'Brochmanns gate 14C, 4. etg – EL-PLAN', { class: 'sheet-title', 'text-anchor': 'start' });
    g.appendChild(title);
    const phaseName: Record<ElPhase, string> = { today: 'Slik det er i dag', planned: 'Slik det blir (planlagt)', compare: 'I dag + planlagt' };
    g.appendChild(
      text(left, top - 0.32, `${phaseName[this.store.view.elPhase]} · ${new Date().toLocaleDateString('no-NO')} · mål i meter, høyder i cm over gulv`, {
        class: 'sheet-sub',
        'text-anchor': 'start',
      }),
    );

    // Used types only, in two columns, with the status key in a third.
    const used = EL_TYPES.filter((t) => this.store.electrical.some((e) => e.type === t.id && this.visible(e)));
    const perCol = Math.max(1, Math.ceil(used.length / 2));
    const colW = (x1 - x0 - 1.4) / 3;
    used.forEach((type, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = left + 0.2 + col * colW;
      const y = top - 0.95 - row * 0.34;
      const s = Math.min(0.62, 1.4 / Math.max(type.glyph.half, type.glyph.depth));
      const cy = type.height !== null ? type.glyph.depth / 2 : 0;
      const item = el('g', { class: 'point', transform: `translate(${x} ${-y}) scale(${SYMBOL_R * s}) translate(0 ${cy})` });
      item.style.setProperty('--c', '#444');
      this.appendGlyph(item, type);
      g.appendChild(item);
      const count = this.store.electrical.filter((e) => e.type === type.id && this.visible(e));
      const counts = (['existing', 'new', 'remove'] as ElStatus[])
        .map((st) => ({ st, n: count.filter((e) => e.status === st).length }))
        .filter((c) => c.n > 0)
        .map((c) => `${c.n} ${c.st === 'existing' ? 'eks' : c.st === 'new' ? 'ny' : 'ut'}`)
        .join(' · ');
      g.appendChild(text(x + 0.28, y - 0.06, `${type.code} – ${type.no} (${counts})`, { class: 'legend-text', 'text-anchor': 'start' }));
    });

    // Status key
    const keyX = left + 0.2 + 2 * colW;
    (['existing', 'new', 'remove'] as ElStatus[]).forEach((s, i) => {
      const y = top - 0.95 - i * 0.34;
      const line = el('rect', { x: keyX, y: -y - 0.06, width: 0.3, height: 0.12, fill: STATUS_COLOR[s] });
      g.appendChild(line);
      const names = { existing: 'Eksisterende', new: 'Nytt', remove: 'Fjernes' };
      g.appendChild(text(keyX + 0.4, y - 0.06, names[s], { class: 'legend-text', 'text-anchor': 'start' }));
    });

    // Scale bar: 1 m, clear of the legend columns on the right-hand side of the sheet.
    const barX = x1 - 1.6;
    const barY = y0 + 0.4;
    g.appendChild(path(`M ${barX} ${-barY} L ${barX + 1} ${-barY}`, { class: 'scalebar' }));
    g.appendChild(path(`M ${barX} ${-barY + 0.1} L ${barX} ${-barY - 0.1} M ${barX + 1} ${-barY + 0.1} L ${barX + 1} ${-barY - 0.1}`, { class: 'scalebar' }));
    g.appendChild(text(barX + 0.5, barY - 0.32, '1 m', { class: 'legend-text' }));
  }

  // ---- Interaction: pan, zoom, hover, select; and while editing: place and drag

  private wire() {
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [px, py] = this.toPlan(e);
      const k = Math.exp(e.deltaY * 0.0015);
      const w = (this.view.x1 - this.view.x0) * k;
      const h = (this.view.y1 - this.view.y0) * k;
      const full = this.bounds.x1 - this.bounds.x0;
      if (w > full * 2.5 || w < 1.2) return;
      const fx = (px - this.view.x0) / (this.view.x1 - this.view.x0);
      const fy = (py - this.view.y0) / (this.view.y1 - this.view.y0);
      this.view = { x0: px - w * fx, x1: px + w * (1 - fx), y0: py - h * fy, y1: py + h * (1 - fy) };
      this.applyViewBox();
    });

    this.svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const target = (e.target as Element).closest<SVGGElement>('.plan-items .point');
      const [px, py] = this.toPlan(e);
      this.downOnPoint = target !== null;
      if (target) {
        const id = target.dataset.id!;
        const item = this.store.electrical.find((i) => i.id === id);
        if (!item) return;
        this.actions.select(id);
        if (this.editing) {
          this.svg.setPointerCapture(e.pointerId);
          this.drag = { id, dx: item.x - px, dy: item.y - py, moved: false, at: [item.x, item.y] };
          this.tip.hidden = true;
          return;
        }
      } else if (this.tool && this.editing) {
        const type = elType(this.tool);
        this.actions.place(this.tool, ...this.snap(px, py, e.altKey, type.height !== null));
        return;
      }
      this.svg.setPointerCapture(e.pointerId);
      this.pan = { x: e.clientX, y: e.clientY, view: { ...this.view } };
      this.svg.classList.add('panning');
    });

    this.svg.addEventListener('pointermove', (e) => {
      if (this.drag) {
        const item = this.store.electrical.find((i) => i.id === this.drag!.id);
        if (!item) return;
        const [px, py] = this.toPlan(e);
        const at = this.snap(px + this.drag.dx, py + this.drag.dy, e.altKey, onWall(item));
        this.drag.moved = true;
        this.drag.at = at;
        // Re-drawn, not just moved: dragged round a corner, a socket turns onto the new wall.
        const old = this.nodes.get(item.id);
        const node = this.itemNode(item, [], at);
        node.classList.add('sel', 'dragging');
        old?.replaceWith(node);
        this.nodes.set(item.id, node);
        this.drawMeasures();
        return;
      }
      if (this.pan) {
        const rect = this.svg.getBoundingClientRect();
        const scale = Math.min(rect.width / (this.pan.view.x1 - this.pan.view.x0), rect.height / (this.pan.view.y1 - this.pan.view.y0));
        const dx = (e.clientX - this.pan.x) / scale;
        const dy = (e.clientY - this.pan.y) / scale;
        this.view = {
          x0: this.pan.view.x0 - dx,
          x1: this.pan.view.x1 - dx,
          y0: this.pan.view.y0 + dy,
          y1: this.pan.view.y1 + dy,
        };
        this.applyViewBox();
        return;
      }
      const target = (e.target as Element).closest<SVGGElement>('.plan-items .point');
      this.setHover(target?.dataset.id ?? null, e);
    });

    this.svg.addEventListener('pointerleave', () => {
      if (!this.drag) this.setHover(null);
    });

    const end = (e: PointerEvent) => {
      if (this.drag) {
        const { id, moved, at } = this.drag;
        this.drag = null;
        if (moved) this.store.updateElectrical(id, { x: at[0], y: at[1] });
      }
      if (this.pan) {
        this.pan = null;
        this.svg.classList.remove('panning');
      }
      this.svg.releasePointerCapture?.(e.pointerId);
    };
    this.svg.addEventListener('pointerup', end);
    this.svg.addEventListener('pointercancel', end);

    // A click that hit neither a point nor a tool clears the selection.
    this.svg.addEventListener('click', (e) => {
      if (this.downOnPoint || (this.tool && this.editing)) return;
      this.actions.select(null);
    });

    // The hover card shows what the store holds, so drop it when the point changes.
    this.store.onChange((c) => {
      if (c.type === 'electrical' || c.type === 'all') delete this.tip.dataset.id;
    });
  }

  /**
   * Wall points snap onto the nearest wall or built-in face within 0.4 m (right on it, on the
   * side the cursor is); ceiling points and anything out of reach go to a 5 cm grid. Hold Alt
   * for no snapping at all.
   */
  private snap(x: number, y: number, free: boolean, wall: boolean): Vec2 {
    if (free) return [x, y];
    const m = wall ? mountAt(x, y, 0.4, 0.4) : null;
    if (m) {
      const horiz = m.n[0] === 0;
      return horiz ? [clamp(round(m.p[0], 0.01), m.face.lo, m.face.hi), m.p[1]] : [m.p[0], clamp(round(m.p[1], 0.01), m.face.lo, m.face.hi)];
    }
    return [round(x, 0.05), round(y, 0.05)];
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * The sheet's styles. Every rule is scoped to the `.plan2d` svg, so the same text styles the live
 * sheet (injected once into the page) and the printed/exported copy (inlined into the clone).
 */
export const PLAN_SVG_CSS = `
.plan2d { background: #fff; font-family: ui-sans-serif, system-ui, sans-serif; }
.plan2d .room { fill: #f4f4f1; stroke: none; }
.plan2d .room.outdoor, .plan2d .balcony { fill: #eceee9; }
.plan2d .wall { fill: #2f3336; }
.plan2d .wall.interior { fill: #4a5054; }
.plan2d .builtin { fill: none; stroke: #b9bcc0; stroke-width: 0.02; }
.plan2d .furniture { fill: none; stroke: #d2d5d8; stroke-width: 0.02; stroke-dasharray: 0.08 0.06; }
.plan2d .glass { stroke: #6f9fc4; stroke-width: 0.04; }
.plan2d .jamb { stroke: #2f3336; stroke-width: 0.025; }
.plan2d .hole { stroke: #9aa0a5; stroke-width: 0.03; stroke-dasharray: 0.1 0.08; }
.plan2d .leaf { stroke: #6b7175; stroke-width: 0.035; }
.plan2d .swing { fill: none; stroke: #b9bcc0; stroke-width: 0.02; }
.plan2d .room-name { font-size: 0.2px; letter-spacing: 0.03px; fill: #6d7378; }
.plan2d .room-area { font-size: 0.16px; fill: #9aa0a5; }
.plan2d .plan-backdrop { display: none; }
.plan2d.on-model .plan-backdrop { display: inline; }
.plan2d.on-model .plan-shell, .plan2d.on-model .plan-furniture { display: none; }
.plan2d.on-model .room-name, .plan2d.on-model .room-area { fill: #2f3336; paint-order: stroke; stroke: rgba(255,255,255,0.85); stroke-width: 0.05px; stroke-linejoin: round; }
.plan2d .point .sym-body { fill: #fff; stroke: var(--c); stroke-width: 0.17; stroke-linejoin: round; }
.plan2d .point .sym { fill: none; stroke: var(--c); stroke-width: 0.17; stroke-linecap: round; stroke-linejoin: round; }
.plan2d .point .sym-dot { fill: var(--c); }
.plan2d .point .halo { fill: none; }
.plan2d .point .hit { fill: transparent; }
.plan2d .point .strike { stroke: #c0392b; stroke-width: 0.22; stroke-linecap: round; }
.plan2d .point-label { font-size: 0.15px; font-weight: 600; fill: var(--c); paint-order: stroke; stroke: rgba(255,255,255,0.9); stroke-width: 0.04px; stroke-linejoin: round; }
.plan2d .point-note { font-size: 0.12px; fill: #6d7378; paint-order: stroke; stroke: rgba(255,255,255,0.9); stroke-width: 0.04px; stroke-linejoin: round; }
.plan2d .dim-line { fill: none; stroke: #d9480f; stroke-width: 0.015; }
.plan2d .dim.ceil .dim-line { stroke-dasharray: 0.06 0.04; }
.plan2d .dim-text { font-size: 0.12px; font-weight: 600; fill: #d9480f; paint-order: stroke; stroke: rgba(255,255,255,0.9); stroke-width: 0.04px; stroke-linejoin: round; }
.plan2d .sheet-title { font-size: 0.28px; font-weight: 700; fill: #23272a; }
.plan2d .sheet-sub { font-size: 0.16px; fill: #6d7378; }
.plan2d .legend-text { font-size: 0.15px; fill: #3d4245; }
.plan2d .scalebar { stroke: #3d4245; stroke-width: 0.02; }
`;
