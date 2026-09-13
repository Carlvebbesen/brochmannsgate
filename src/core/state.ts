/**
 * The saved settings: one colour per surface key, per-face overrides (accent walls)
 * and the view settings the model opens with. Persisted in Cloudflare KV through
 * `src/core/remote.ts` (only for editors) and mirrored in localStorage so a visitor's
 * own experiments survive a reload.
 */

export type ColorChange =
  | { type: 'color'; key: string; hex: string }
  | { type: 'override'; faceId: string; hex: string | null }
  | { type: 'view' }
  | { type: 'all' };

export interface ViewSettings {
  sun: number;
  ceilings: boolean;
  labels: boolean;
  /** Section-cut height in metres, or null for no cut. */
  cut: number | null;
}

export interface ColorFile {
  version: 1 | 2;
  colors: Record<string, string>;
  overrides: Record<string, string>;
  view?: ViewSettings;
}

export const defaultView: ViewSettings = { sun: 16, ceilings: false, labels: true, cut: null };

const STORAGE_KEY = 'leilighet-3d:colors:v1';
const HEX = /^#[0-9a-f]{6}$/i;

export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

export class ColorStore {
  colors: Record<string, string>;
  overrides: Record<string, string> = {};
  view: ViewSettings = { ...defaultView };
  private listeners = new Set<(c: ColorChange) => void>();
  private saveTimer: number | undefined;
  /** Set by main.ts: called (debounced) whenever anything changes. */
  onPersist: ((file: ColorFile) => void) | null = null;

  constructor(private readonly defaults: Record<string, string>) {
    this.colors = { ...defaults };
    this.load();
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

  reset() {
    this.colors = { ...this.defaults };
    this.overrides = {};
    this.view = { ...defaultView };
    this.emit({ type: 'all' });
  }

  toJSON(): ColorFile {
    return { version: 2, colors: { ...this.colors }, overrides: { ...this.overrides }, view: { ...this.view } };
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
    this.colors = { ...this.defaults, ...pickHex(file.colors) };
    this.overrides = pickHex(file.overrides ?? {});
    this.view = pickView(file.view);
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

function pickView(view: unknown): ViewSettings {
  const v = (view ?? {}) as Partial<ViewSettings>;
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return {
    sun: clamp(v.sun, 5, 22, defaultView.sun),
    ceilings: v.ceilings === true,
    labels: v.labels !== false,
    cut: v.cut === null || v.cut === undefined ? null : clamp(v.cut, 0.4, 2.8, 2.8),
  };
}
