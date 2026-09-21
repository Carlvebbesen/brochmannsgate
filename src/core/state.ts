/**
 * The saved settings: one colour per surface key, per-face overrides (accent walls)
 * and the view settings the model opens with. Persisted in Cloudflare KV through
 * `src/core/remote.ts` (only for editors) and mirrored in localStorage so a visitor's
 * own experiments survive a reload.
 */

import { VINYL_FLOORS } from '../data/palette';
import type { Pose } from '../data/furniture';
import { isElStatus, isElTypeId, type ElectricalItem } from '../data/electrical';

export type ColorChange =
  | { type: 'color'; key: string; hex: string }
  | { type: 'override'; faceId: string; hex: string | null }
  | { type: 'view' }
  | { type: 'furniture'; id: string }
  | { type: 'electrical' }
  | { type: 'all' };

export interface ViewSettings {
  sun: number;
  ceilings: boolean;
  labels: boolean;
  /** Section-cut height in metres, or null for no cut. */
  cut: number | null;
  /** Vinyl texture on the floors; off shows them as flat colours. */
  vinyl: boolean;
  /** Width × depth labels on rooms and movable furniture. */
  dimensions: boolean;
  /** El-plan: which of existing/new/both to draw. */
  elPhase: ElPhase;
  /** El-plan: draw the furniture footprints under the points. */
  elFurniture: boolean;
  /** El-plan: what the points sit on – the drawn floor plan, or the 3D model rendered straight down. */
  elBase: ElBase;
  /** El-plan: dimension lines from every point to the nearest corners / walls. */
  elMeasures: boolean;
}

export type ElBase = 'plan' | 'model';

/** What the el-plan shows: the flat today, the flat as planned, or both side by side. */
export type ElPhase = 'today' | 'planned' | 'compare';

export interface ColorFile {
  /** 3: floor colours are a tint over the vinyl texture (before that they were flat oak). 4: adds the el-plan. */
  version: 1 | 2 | 3 | 4;
  colors: Record<string, string>;
  overrides: Record<string, string>;
  view?: ViewSettings;
  /** Live position of the movable furniture, keyed by id (src/data/furniture.ts). Absent = at its default pose. */
  furniture?: Record<string, Pose>;
  /** The el-plan's points (src/data/electrical.ts). */
  electrical?: ElectricalItem[];
}

export const defaultView: ViewSettings = {
  sun: 16, ceilings: false, labels: true, cut: null, vinyl: true, dimensions: false, elPhase: 'compare', elFurniture: true, elBase: 'plan', elMeasures: false,
};

const STORAGE_KEY = 'leilighet-3d:colors:v1';
const HEX = /^#[0-9a-f]{6}$/i;

export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

/** Accepts what people actually paste: `#F5F1E8`, `f5f1e8`, `#fe8`, with stray whitespace. */
export function normalizeHex(v: string): string | null {
  const s = v.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`.toLowerCase();
  if (/^[0-9a-f]{8}$/i.test(s)) return `#${s.slice(0, 6)}`.toLowerCase(); // #rrggbbaa — drop the alpha
  return null;
}

export class ColorStore {
  colors: Record<string, string>;
  overrides: Record<string, string> = {};
  view: ViewSettings = { ...defaultView };
  furniture: Record<string, Pose> = {};
  electrical: ElectricalItem[] = [];
  private listeners = new Set<(c: ColorChange) => void>();
  private saveTimer: number | undefined;
  /** Set by main.ts: called (debounced) whenever anything changes. */
  onPersist: ((file: ColorFile) => void) | null = null;

  constructor(
    private readonly defaults: Record<string, string>,
    private readonly furnitureDefaults: Record<string, Pose> = {},
  ) {
    this.colors = { ...defaults };
    this.load();
  }

  getPose(id: string): Pose {
    return this.furniture[id] ?? this.furnitureDefaults[id] ?? { x: 0, y: 0, yaw: 0 };
  }

  setPose(id: string, pose: Pose) {
    this.furniture[id] = pose;
    this.emit({ type: 'furniture', id });
  }

  // ---- El-plan points

  addElectrical(item: ElectricalItem) {
    this.electrical = [...this.electrical, item];
    this.emit({ type: 'electrical' });
  }

  updateElectrical(id: string, patch: Partial<Omit<ElectricalItem, 'id'>>) {
    const i = this.electrical.findIndex((e) => e.id === id);
    if (i < 0) return;
    const next = [...this.electrical];
    next[i] = { ...next[i], ...patch };
    this.electrical = next;
    this.emit({ type: 'electrical' });
  }

  removeElectrical(id: string) {
    const next = this.electrical.filter((e) => e.id !== id);
    if (next.length === this.electrical.length) return;
    this.electrical = next;
    this.emit({ type: 'electrical' });
  }

  /** Empties the el-plan. Kept out of `reset()`, which is only about colours. */
  clearElectrical() {
    if (!this.electrical.length) return;
    this.electrical = [];
    this.emit({ type: 'electrical' });
  }

  getColor(key: string): string {
    return this.colors[key] ?? this.defaults[key] ?? '#ff00ff';
  }

  setColor(key: string, hex: string) {
    if (!isHex(hex)) return;
    this.colors[key] = hex.toLowerCase();
    this.emit({ type: 'color', key, hex: this.colors[key] });
  }

  setOverride(faceId: string, hex: string | null) {
    if (hex === null) delete this.overrides[faceId];
    else if (isHex(hex)) this.overrides[faceId] = hex.toLowerCase();
    else return;
    this.emit({ type: 'override', faceId, hex: this.overrides[faceId] ?? null });
  }

  setView(patch: Partial<ViewSettings>) {
    this.view = { ...this.view, ...patch };
    this.emit({ type: 'view' });
  }

  /** Colours, view settings and furniture back to the defaults. The el-plan is left alone. */
  reset() {
    this.colors = { ...this.defaults };
    this.overrides = {};
    this.view = { ...defaultView };
    this.furniture = {};
    this.emit({ type: 'all' });
  }

  toJSON(): ColorFile {
    return {
      version: 4,
      colors: { ...this.colors },
      overrides: { ...this.overrides },
      view: { ...this.view },
      furniture: { ...this.furniture },
      electrical: this.electrical.map((e) => ({ ...e })),
    };
  }

  importJSON(data: unknown) {
    const file = data as Partial<ColorFile> | null;
    if (!file || typeof file !== 'object' || typeof file.colors !== 'object') {
      throw new Error('Not a colour file exported from this app.');
    }
    this.apply(file);
    this.emit({ type: 'all' });
  }

  /** Applies settings loaded from the server without re-saving them. */
  applyRemote(file: unknown) {
    const data = file as Partial<ColorFile> | null;
    if (!data || typeof data !== 'object' || typeof data.colors !== 'object') return;
    this.apply(data);
    this.listeners.forEach((fn) => fn({ type: 'all' }));
  }

  onChange(fn: (c: ColorChange) => void) {
    this.listeners.add(fn);
  }

  private apply(file: Partial<ColorFile>) {
    const colors = pickHex(file.colors);
    // Older files hold the flat oak floor colour, which would now tint the vinyl orange.
    if ((file.version ?? 1) < 3) for (const key of VINYL_FLOORS) delete colors[key];
    this.colors = { ...this.defaults, ...colors };
    this.overrides = pickHex(file.overrides ?? {});
    this.view = pickView(file.view);
    this.furniture = pickPoses(file.furniture);
    this.electrical = pickElectrical(file.electrical);
  }

  private emit(change: ColorChange) {
    this.listeners.forEach((fn) => fn(change));
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.save();
      this.onPersist?.(this.toJSON());
    }, 400);
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch {
      // storage unavailable (private mode) – colours just won't persist
    }
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this.apply(JSON.parse(raw) as ColorFile);
    } catch {
      // corrupt or unavailable storage – start from defaults
    }
  }

  /** Forgets the local copy, so the next load shows the shared settings again. */
  clearLocal() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function pickHex(obj: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) if (isHex(v)) out[k] = v.toLowerCase();
  }
  return out;
}

function pickPoses(furniture: unknown): Record<string, Pose> {
  const out: Record<string, Pose> = {};
  if (!furniture || typeof furniture !== 'object') return out;
  for (const [id, v] of Object.entries(furniture as Record<string, unknown>)) {
    const p = v as Partial<Pose> | null;
    if (p && typeof p.x === 'number' && typeof p.y === 'number' && typeof p.yaw === 'number') {
      out[id] = { x: p.x, y: p.y, yaw: p.yaw };
    }
  }
  return out;
}

function pickElectrical(items: unknown): ElectricalItem[] {
  if (!Array.isArray(items)) return [];
  const out: ElectricalItem[] = [];
  for (const raw of items.slice(0, 500)) {
    const e = raw as Partial<ElectricalItem> | null;
    if (!e || typeof e.id !== 'string' || !isElTypeId(e.type)) continue;
    if (typeof e.x !== 'number' || typeof e.y !== 'number' || !Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
    const item: ElectricalItem = { id: e.id.slice(0, 40), type: e.type, x: e.x, y: e.y, status: isElStatus(e.status) ? e.status : 'new' };
    if (e.height === null || typeof e.height === 'number') item.height = e.height;
    if (typeof e.note === 'string' && e.note.trim()) item.note = e.note.slice(0, 200);
    out.push(item);
  }
  return out;
}

function pickView(view: unknown): ViewSettings {
  const v = (view ?? {}) as Partial<ViewSettings>;
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return {
    sun: clamp(v.sun, 5, 22, defaultView.sun),
    ceilings: v.ceilings === true,
    labels: v.labels !== false,
    cut: v.cut === null || v.cut === undefined ? null : clamp(v.cut, 0.4, 2.8, 2.8),
    vinyl: v.vinyl !== false,
    dimensions: v.dimensions === true,
    elPhase: v.elPhase === 'today' || v.elPhase === 'planned' ? v.elPhase : 'compare',
    elFurniture: v.elFurniture !== false,
    elBase: v.elBase === 'model' ? 'model' : 'plan',
    elMeasures: v.elMeasures === true,
  };
}
