/*
 * El-plan: the electrical points drawn on the 2D top view (`src/ui/plan2d.ts`).
 *
 * Every point is one of the types below, placed in plan coordinates (metres, x = east,
 * y = north — the same system as apartment.ts) and marked as existing, new or to be removed,
 * so the plan doubles as the "today → planned" list for the electrician.
 *
 * The points themselves live in the shared settings (`ColorStore.electrical`), not here —
 * this file only holds the catalogue: symbol, label, default mounting height and colour.
 */

/** What happens to a point: it is there today, it is to be installed, or it is to be taken out. */
export type ElStatus = 'existing' | 'new' | 'remove';

export const EL_STATUS: { id: ElStatus; label: string; hint: string }[] = [
  { id: 'existing', label: 'Existing', hint: 'Already there today' },
  { id: 'new', label: 'New', hint: 'To be installed' },
  { id: 'remove', label: 'Remove', hint: 'To be taken out' },
];

export type ElTypeId =
  | 'outlet2'
  | 'outlet6'
  | 'tv'
  | 'net'
  | 'dimmer'
  | 'switch'
  | 'switch2'
  | 'ceiling'
  | 'wallLight'
  | 'spot'
  | 'led';

export interface ElType {
  id: ElTypeId;
  /** Short code drawn next to the symbol and used in the legend. */
  code: string;
  label: string;
  /** Norwegian name, for the printed sheet the electrician reads. */
  no: string;
  group: 'Outlets & data' | 'Switches' | 'Lights';
  /** Default mounting height in cm above the floor; null = in the ceiling. */
  height: number | null;
  glyph: Glyph;
}

/**
 * A symbol in "symbol units" (scaled to SYMBOL_R metres when drawn). Wall glyphs are drawn in the
 * wall's own frame: the wall face is the line y = 0 and the room is towards -y (up on screen), so
 * `plan2d.ts` only has to rotate them onto whichever wall they sit on. Ceiling glyphs are centred.
 *
 * - `body`: closed shapes filled white and outlined in the status colour
 * - `lines`: strokes in the status colour
 * - `dots`: small filled shapes in the status colour (socket pins, the RJ45 jack…)
 */
export interface Glyph {
  body?: string;
  lines?: string;
  dots?: string;
  /** How far the glyph reaches out from the wall (or its radius, for a ceiling glyph), in symbol units. */
  depth: number;
  /** Half its width along the wall, in symbol units. */
  half: number;
}

const circle = (x: number, y: number, r: number) =>
  `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} Z`;

/**
 * Sockets use the Norwegian el-plan half circle with its flat side on the wall, with the two pin
 * holes of a Schuko face drawn in, so it reads as a "stikkontakt" without a legend. A 6-gang frame
 * is a wide plate with three pairs of pins. Switches are the usual circle with a lever (one per
 * direction for a two-way switch, half filled for a dimmer), lights a circle with a cross.
 */
const HALF_DISC = 'M -1 0 A 1 1 0 0 1 1 0 Z';
const PINS = `${circle(-0.36, -0.42, 0.15)} ${circle(0.36, -0.42, 0.15)}`;
const SWITCH_BODY = circle(0, -0.55, 0.45);
const LEVER = 'M 0 0 L 0 -0.1 M 0.32 -0.87 L 1.1 -1.65 L 1.42 -1.33';
const LIGHT = `${circle(0, 0, 1)} M -0.71 -0.71 L 0.71 0.71 M -0.71 0.71 L 0.71 -0.71`;

export const EL_TYPES: ElType[] = [
  {
    id: 'outlet2', code: '2', label: 'Outlet, 2-gang', no: 'Stikkontakt 2-veis', group: 'Outlets & data', height: 20,
    glyph: { body: HALF_DISC, dots: PINS, depth: 1, half: 1 },
  },
  {
    id: 'outlet6', code: '6', label: 'Outlet, 6-gang', no: 'Stikkontakt 6-veis', group: 'Outlets & data', height: 20,
    glyph: {
      body: 'M -1.8 0 L -1.8 -0.72 Q -1.8 -1 -1.52 -1 L 1.52 -1 Q 1.8 -1 1.8 -0.72 L 1.8 0 Z',
      lines: 'M -0.6 -0.1 L -0.6 -0.9 M 0.6 -0.1 L 0.6 -0.9',
      dots: [-1.2, 0, 1.2].map((x) => `${circle(x - 0.22, -0.5, 0.13)} ${circle(x + 0.22, -0.5, 0.13)}`).join(' '),
      depth: 1,
      half: 1.8,
    },
  },
  {
    id: 'tv', code: 'TV', label: 'TV / antenna', no: 'TV-/antenneuttak', group: 'Outlets & data', height: 20,
    glyph: { body: HALF_DISC, lines: 'M -0.42 -0.7 L 0.42 -0.7 L 0.42 -0.28 L -0.42 -0.28 Z M -0.2 -0.14 L 0.2 -0.14', depth: 1, half: 1 },
  },
  {
    id: 'net', code: 'NET', label: 'Network (RJ45)', no: 'Nettverksuttak', group: 'Outlets & data', height: 20,
    glyph: {
      body: HALF_DISC,
      dots: 'M -0.4 -0.16 L -0.4 -0.56 L -0.2 -0.56 L -0.2 -0.72 L 0.2 -0.72 L 0.2 -0.56 L 0.4 -0.56 L 0.4 -0.16 Z',
      depth: 1,
      half: 1,
    },
  },
  {
    id: 'dimmer', code: 'D', label: 'Dimmer', no: 'Dimmer', group: 'Switches', height: 110,
    glyph: { body: SWITCH_BODY, lines: LEVER, dots: 'M 0 -0.1 A 0.45 0.45 0 0 1 0 -1 Z', depth: 1.7, half: 1.45 },
  },
  {
    id: 'switch', code: 'B', label: 'Switch', no: 'Bryter', group: 'Switches', height: 110,
    glyph: { body: SWITCH_BODY, lines: LEVER, depth: 1.7, half: 1.45 },
  },
  {
    id: 'switch2', code: 'B2', label: 'Two-way switch', no: 'Toveisbryter', group: 'Switches', height: 110,
    glyph: { body: SWITCH_BODY, lines: `${LEVER} M -0.32 -0.87 L -1.1 -1.65 L -1.42 -1.33`, depth: 1.7, half: 1.45 },
  },
  {
    id: 'ceiling', code: 'L', label: 'Ceiling light', no: 'Taklampepunkt', group: 'Lights', height: null,
    glyph: { body: LIGHT, depth: 1, half: 1 },
  },
  {
    id: 'wallLight', code: 'V', label: 'Wall light', no: 'Vegglampepunkt', group: 'Lights', height: 180,
    glyph: {
      body: `${circle(0, -1.1, 0.8)} M -0.57 -1.67 L 0.57 -0.53 M -0.57 -0.53 L 0.57 -1.67`,
      lines: 'M -1 0 L 1 0 M 0 0 L 0 -0.3',
      depth: 1.9,
      half: 1,
    },
  },
  {
    id: 'spot', code: 'S', label: 'Downlight / spot', no: 'Downlight', group: 'Lights', height: null,
    glyph: { body: circle(0, 0, 0.62), dots: circle(0, 0, 0.22), depth: 0.62, half: 0.62 },
  },
  {
    id: 'led', code: 'LED', label: 'LED strip / driver', no: 'LED-stripe / driver', group: 'Lights', height: null,
    glyph: {
      body: 'M -1.2 0.35 L 1.2 0.35 L 1.2 -0.35 L -1.2 -0.35 Z',
      lines: 'M -0.6 -0.35 L -0.6 0.35 M 0 -0.35 L 0 0.35 M 0.6 -0.35 L 0.6 0.35',
      depth: 0.35,
      half: 1.2,
    },
  },
];

/**
 * A small standalone SVG icon of the type, for the panel's palette and tooltip. Wall types are
 * drawn standing on a short wall line so the icon shows which way round they go.
 */
export function glyphIcon(type: ElType, color: string): string {
  const g = type.glyph;
  const wall = type.height !== null;
  // Square box around the glyph (wall glyphs stand on y = 0), with a little air.
  const pad = 0.35;
  const [x0, x1] = [-g.half - pad, g.half + pad];
  const [y0, y1] = wall ? [-g.depth - pad, pad] : [-g.depth - pad, g.depth + pad];
  const size = Math.max(x1 - x0, y1 - y0);
  const cy = (y0 + y1) / 2;
  const box = `${-size / 2} ${cy - size / 2} ${size} ${size}`;
  const parts = [
    wall && `<path d="M ${-size / 2} 0.12 L ${size / 2} 0.12" stroke="#9aa0a5" stroke-width="0.24" />`,
    g.body && `<path d="${g.body}" fill="#fff" stroke="${color}" stroke-width="0.17" stroke-linejoin="round" />`,
    g.lines && `<path d="${g.lines}" fill="none" stroke="${color}" stroke-width="0.17" stroke-linecap="round" stroke-linejoin="round" />`,
    g.dots && `<path d="${g.dots}" fill="${color}" />`,
  ];
  return `<svg class="el-icon" viewBox="${box}" aria-hidden="true">${parts.filter(Boolean).join('')}</svg>`;
}

export const EL_TYPE = new Map(EL_TYPES.map((t) => [t.id, t]));

export const elType = (id: string): ElType => EL_TYPE.get(id as ElTypeId) ?? EL_TYPES[0];

/** One placed point. Coordinates are plan metres; `height` is cm above the floor (null = ceiling). */
export interface ElectricalItem {
  id: string;
  type: ElTypeId;
  x: number;
  y: number;
  status: ElStatus;
  /** Overrides the type's default height. cm above the floor, or null for a ceiling point. */
  height?: number | null;
  note?: string;
}

/** Height shown next to a point: its own, or the type default. */
export function itemHeight(item: ElectricalItem): number | null {
  return item.height === undefined ? elType(item.type).height : item.height;
}

/** Wall points sit on a wall face and turn with it; ceiling points (height null) are centred on their spot. */
export const onWall = (item: ElectricalItem) => itemHeight(item) !== null;

export function formatHeight(h: number | null): string {
  return h === null ? 'tak' : `${Math.round(h)}`;
}

export const isElTypeId = (v: unknown): v is ElTypeId => typeof v === 'string' && EL_TYPE.has(v as ElTypeId);
export const isElStatus = (v: unknown): v is ElStatus => v === 'existing' || v === 'new' || v === 'remove';

/** Radius the symbols are drawn at, in metres of plan. */
export const SYMBOL_R = 0.13;
