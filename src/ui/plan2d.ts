/*
 * El-plan: a flat 2D top view of the apartment, drawn as SVG straight from `src/data/apartment.ts`,
 * with the electrical points (`src/data/electrical.ts`) on top.
 *
 * Coordinates are the plan's own metres (x = east, y = north); SVG y is simply -y, so the
 * drawing is always to scale and prints as a sheet an electrician can read.
 */

import { balcony, fixtures, kitchenRuns, rooms, walls } from '../data/apartment';
import { EL_TYPES, SYMBOL_R, elType, formatHeight, itemHeight, type ElStatus, type ElectricalItem, type ElTypeId } from '../data/electrical';
import { footprints, type FurnitureId } from '../data/furniture';
import type { Opening, Room, Vec2, Wall } from '../data/types';
import { openings } from '../data/apartment';
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

const isHorizontal = (w: Wall) => w.x1 - w.x0 >= w.y1 - w.y0;

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

export interface Plan2DActions {
  /** A point was clicked (or dragged), or the background was clicked (null). */
  select(id: string | null): void;
  /** The plan was clicked while a palette tool was armed. */
  place(type: ElTypeId, x: number, y: number): void;
}

interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export class Plan2D {
  private readonly svg: SVGSVGElement;
  private readonly shell = el('g', { class: 'plan-shell' });
  private readonly furnitureLayer = el('g', { class: 'plan-furniture' });
  private readonly itemLayer = el('g', { class: 'plan-items' });
  private readonly legend = el('g', { class: 'plan-legend' });
  private readonly bounds: Bounds;
  private view: Bounds;
  private tool: ElTypeId | null = null;
  private selected: string | null = null;
  private nodes = new Map<string, SVGGElement>();
  private drag: { id: string; dx: number; dy: number; moved: boolean } | null = null;
  private pan: { x: number; y: number; view: Bounds } | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly store: ColorStore,
    private readonly actions: Plan2DActions,
  ) {
    this.svg = el('svg', { class: 'plan2d', xmlns: NS });
    this.svg.append(this.shell, this.furnitureLayer, this.itemLayer, this.legend);
    host.appendChild(this.svg);

    this.bounds = this.contentBounds();
    this.view = { ...this.bounds };
    this.applyViewBox();
    this.drawShell();
    this.drawFurniture();
    this.drawItems();
    this.drawLegend();
    this.wire();
  }

  setTool(tool: ElTypeId | null) {
    this.tool = tool;
    this.svg.classList.toggle('placing', tool !== null);
  }

  setSelected(id: string | null) {
    this.selected = id;
    this.nodes.forEach((node, key) => node.classList.toggle('sel', key === id));
  }

  /** Redraws the points and the furniture outlines (after any change to the store). */
  refresh() {
    this.drawFurniture();
    this.drawItems();
    this.drawLegend();
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
    clone.querySelector('.plan-cursor')?.remove();
    const style = el('style');
    style.textContent = PLAN_SVG_CSS;
    clone.prepend(style);
    return new XMLSerializer().serializeToString(clone);
  }

  // ---- Geometry

  private contentBounds(): Bounds {
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

  // ---- Static drawing: rooms, walls, doors, windows, built-ins

  private drawShell() {
    const g = this.shell;
    g.replaceChildren();

    g.appendChild(el('polygon', { points: polygonPoints(balcony.polygon), class: 'balcony' }));

    for (const room of rooms) {
      g.appendChild(el('polygon', { points: polygonPoints(room.polygon), class: `room ${room.outdoor ? 'outdoor' : ''}` }));
    }

    for (const w of walls) g.appendChild(this.wallPath(w));
    for (const o of openings) this.drawOpening(g, o);

    // Built-ins (kitchen runs, vanity, radiators…) as light outlines: they decide where a socket can go.
    for (const run of kitchenRuns) {
      g.appendChild(el('rect', { x: run.x0, y: -run.y1, width: run.x1 - run.x0, height: run.y1 - run.y0, class: 'builtin' }));
    }
    for (const f of fixtures) {
      if (f.ceiling || f.z0 > 1.6) continue;
      g.appendChild(el('rect', { x: f.x0, y: -f.y1, width: f.x1 - f.x0, height: f.y1 - f.y0, class: 'builtin' }));
    }

    for (const room of rooms) this.drawRoomLabel(g, room);
  }

  private drawRoomLabel(g: SVGGElement, room: Room) {
    const [cx, cy] = room.labelAt ?? centroid(room.polygon);
    g.appendChild(text(cx, cy, room.name.toUpperCase(), { class: 'room-name' }));
    g.appendChild(text(cx, cy - 0.28, `${area(room.polygon).toFixed(1)} m²`, { class: 'room-area' }));
  }

  /** A wall as one rect per solid stretch, so doors and windows leave real holes. */
  private wallPath(w: Wall): SVGGElement {
    const g = el('g');
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

    for (const [s0, s1] of segments) {
      const r = horiz ? { x: s0, y: -w.y1, width: s1 - s0, height: w.y1 - w.y0 } : { x: w.x0, y: -s1, width: w.x1 - w.x0, height: s1 - s0 };
      g.appendChild(el('rect', { ...r, class: `wall ${w.kind}` }));
    }
    return g;
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
    if (!this.store.view.elFurniture) return;
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
    const drawn: ElectricalItem[] = [];
    for (const item of this.store.electrical) {
      if (!this.visible(item)) continue;
      // Points sharing a spot (a socket and a data outlet, say) would print their labels on top of
      // each other, so every later one drops a line.
      const stack = drawn.filter((d) => Math.hypot(d.x - item.x, d.y - item.y) < 0.3).length;
      drawn.push(item);
      const node = this.itemNode(item, stack);
      this.nodes.set(item.id, node);
      g.appendChild(node);
    }
    this.setSelected(this.selected);
  }

  private itemNode(item: ElectricalItem, stack = 0): SVGGElement {
    const type = elType(item.type);
    const g = el('g', { class: `point ${item.status}`, 'data-id': item.id, transform: `translate(${item.x} ${-item.y})` });
    g.style.setProperty('--c', STATUS_COLOR[item.status]);

    g.appendChild(el('circle', { r: SYMBOL_R * 1.7, class: 'halo' }));
    g.appendChild(el('circle', { r: SYMBOL_R * 1.9, class: 'hit' }));
    g.appendChild(path(type.symbol, { class: 'sym', transform: `scale(${SYMBOL_R})` }));
    if (item.status === 'remove') {
      const r = SYMBOL_R * 1.5;
      g.appendChild(path(`M ${-r} ${-r} L ${r} ${r} M ${-r} ${r} L ${r} ${-r}`, { class: 'strike' }));
    }
    const label = `${type.code}·${formatHeight(itemHeight(item))}`;
    const baseY = SYMBOL_R * 1.6 + 0.17 + stack * 0.32;
    const t = el('text', { x: 0, y: baseY, class: 'point-label', 'text-anchor': 'middle' });
    t.textContent = label;
    g.appendChild(t);
    if (item.note) {
      const n = el('text', { x: 0, y: baseY + 0.18, class: 'point-note', 'text-anchor': 'middle' });
      n.textContent = item.note.length > 22 ? `${item.note.slice(0, 21)}…` : item.note;
      g.appendChild(n);
    }
    const title = el('title');
    title.textContent = `${type.label} (${type.no}) · ${formatHeight(itemHeight(item))}${itemHeight(item) === null ? '' : ' cm'}${item.note ? ` · ${item.note}` : ''}`;
    g.appendChild(title);
    return g;
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
      const item = el('g', { transform: `translate(${x} ${-y}) scale(0.62)` });
      item.style.setProperty('--c', '#444');
      item.appendChild(path(type.symbol, { class: 'sym', transform: `scale(${SYMBOL_R})` }));
      g.appendChild(item);
      const count = this.store.electrical.filter((e) => e.type === type.id && this.visible(e));
      const counts = (['existing', 'new', 'remove'] as ElStatus[])
        .map((s) => ({ s, n: count.filter((e) => e.status === s).length }))
        .filter((c) => c.n > 0)
        .map((c) => `${c.n} ${c.s === 'existing' ? 'eks' : c.s === 'new' ? 'ny' : 'ut'}`)
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

  // ---- Interaction: pan, zoom, place, drag, select

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
      const target = (e.target as Element).closest<SVGGElement>('.point');
      const [px, py] = this.toPlan(e);
      if (target) {
        const id = target.dataset.id!;
        const item = this.store.electrical.find((i) => i.id === id);
        if (!item) return;
        this.svg.setPointerCapture(e.pointerId);
        this.drag = { id, dx: item.x - px, dy: item.y - py, moved: false };
        this.actions.select(id);
        return;
      }
      if (this.tool) {
        this.actions.place(this.tool, ...this.snap(px, py, e.altKey));
        return;
      }
      this.svg.setPointerCapture(e.pointerId);
      this.pan = { x: e.clientX, y: e.clientY, view: { ...this.view } };
      this.svg.classList.add('panning');
    });

    this.svg.addEventListener('pointermove', (e) => {
      if (this.drag) {
        const [px, py] = this.toPlan(e);
        const [x, y] = this.snap(px + this.drag.dx, py + this.drag.dy, e.altKey);
        this.drag.moved = true;
        const node = this.nodes.get(this.drag.id);
        node?.setAttribute('transform', `translate(${x} ${-y})`);
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
      }
    });

    const end = (e: PointerEvent) => {
      if (this.drag) {
        const { id, moved } = this.drag;
        this.drag = null;
        if (moved) {
          const node = this.nodes.get(id);
          const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(node?.getAttribute('transform') ?? '');
          if (m) this.store.updateElectrical(id, { x: Number(m[1]), y: -Number(m[2]) });
        }
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
      if ((e.target as Element).closest('.point') || this.tool) return;
      this.actions.select(null);
    });
  }

  /**
   * Snaps to the nearest wall or built-in face within 0.4 m (the point lands right on it, on the
   * side the cursor is), otherwise to a 5 cm grid. Hold Alt for no snapping at all.
   */
  private snap(x: number, y: number, free: boolean): Vec2 {
    if (free) return [x, y];
    let best: { d: number; p: Vec2 } | null = null;
    const faces: { x0: number; x1: number; y0: number; y1: number }[] = [
      ...walls,
      ...kitchenRuns,
      ...fixtures.filter((f) => !f.ceiling && f.z0 < 1.6),
    ];
    for (const r of faces) {
      for (const [ax, ay, bx, by] of [
        [r.x0, r.y0, r.x1, r.y0],
        [r.x0, r.y1, r.x1, r.y1],
        [r.x0, r.y0, r.x0, r.y1],
        [r.x1, r.y0, r.x1, r.y1],
      ]) {
        const vx = bx - ax;
        const vy = by - ay;
        const len2 = vx * vx + vy * vy;
        if (!len2) continue;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len2));
        const px = ax + vx * t;
        const py = ay + vy * t;
        const d = Math.hypot(x - px, y - py);
        if (d < 0.4 && (!best || d < best.d)) {
          // Sit just off the face, on the side the cursor is on, so the symbol reads as "on this wall".
          const nx = vx === 0 ? Math.sign(x - px) || 1 : 0;
          const ny = vy === 0 ? Math.sign(y - py) || 1 : 0;
          best = { d, p: [px + nx * 0.06, py + ny * 0.06] };
        }
      }
    }
    if (best) return [round(best.p[0], 0.01), round(best.p[1], 0.01)];
    return [round(x, 0.05), round(y, 0.05)];
  }
}

const round = (v: number, step: number) => Math.round(v / step) * step;

/** Styles inlined into the exported/printed SVG (the live one is styled by style.css). */
export const PLAN_SVG_CSS = `
svg { background: #fff; font-family: ui-sans-serif, system-ui, sans-serif; }
.room { fill: #f4f4f1; stroke: none; }
.room.outdoor, .balcony { fill: #eceee9; }
.wall { fill: #2f3336; }
.wall.interior { fill: #4a5054; }
.builtin { fill: none; stroke: #b9bcc0; stroke-width: 0.02; }
.furniture { fill: none; stroke: #d2d5d8; stroke-width: 0.02; stroke-dasharray: 0.08 0.06; }
.glass { stroke: #6f9fc4; stroke-width: 0.04; }
.jamb { stroke: #2f3336; stroke-width: 0.025; }
.hole { stroke: #9aa0a5; stroke-width: 0.03; stroke-dasharray: 0.1 0.08; }
.leaf { stroke: #6b7175; stroke-width: 0.035; }
.swing { fill: none; stroke: #b9bcc0; stroke-width: 0.02; }
.room-name { font-size: 0.2px; letter-spacing: 0.03px; fill: #6d7378; }
.room-area { font-size: 0.16px; fill: #9aa0a5; }
.point .sym { fill: none; stroke: var(--c); stroke-width: 0.17; stroke-linecap: round; stroke-linejoin: round; }
.point .halo { fill: #fff; opacity: 0.85; }
.point .hit { fill: transparent; }
.point .strike { stroke: #c0392b; stroke-width: 0.03; }
.point-label { font-size: 0.15px; font-weight: 600; fill: var(--c); }
.point-note { font-size: 0.12px; fill: #7b8186; }
.sheet-title { font-size: 0.28px; font-weight: 700; fill: #23272a; }
.sheet-sub { font-size: 0.16px; fill: #6d7378; }
.legend-text { font-size: 0.15px; fill: #3d4245; }
.scalebar { stroke: #3d4245; stroke-width: 0.02; }
.plan-legend .sym { fill: none; stroke: #444; stroke-width: 0.17; stroke-linecap: round; }
`;
