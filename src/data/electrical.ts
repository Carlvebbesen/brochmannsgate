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
  /** Symbol geometry, drawn in a box roughly ±1 around the origin and scaled to SYMBOL_R metres. */
  symbol: string;
}

/**
 * Symbols follow the usual Norwegian plan convention (NS 3931-ish): a socket is a half disc on
 * its wall line, a switch a stem with a lever, a light point a circle with a cross. They are
 * drawn from these paths in `plan2d.ts`; `M`/`L`/`A` are plain SVG path commands in symbol units.
 */
const SOCKET = 'M -1 0 L 1 0 M -0.78 0 A 0.78 0.78 0 0 1 0.78 0 Z M 0 -0.78 L 0 -1.5';
const SWITCH = 'M 0 1.5 L 0 0.35 M -0.9 -0.95 L 0 0.35';
const LIGHT = 'M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 M -0.71 -0.71 L 0.71 0.71 M -0.71 0.71 L 0.71 -0.71';

export const EL_TYPES: ElType[] = [
  { id: 'outlet2', code: '2', label: 'Outlet, 2-gang', no: 'Stikkontakt 2-veis', group: 'Outlets & data', height: 20, symbol: SOCKET },
  { id: 'outlet6', code: '6', label: 'Outlet, 6-gang', no: 'Stikkontakt 6-veis', group: 'Outlets & data', height: 20, symbol: SOCKET },
  { id: 'tv', code: 'TV', label: 'TV / antenna', no: 'TV-/antenneuttak', group: 'Outlets & data', height: 20, symbol: SOCKET },
  { id: 'net', code: 'NET', label: 'Network (RJ45)', no: 'Nettverksuttak', group: 'Outlets & data', height: 20, symbol: SOCKET },
  { id: 'dimmer', code: 'D', label: 'Dimmer', no: 'Dimmer', group: 'Switches', height: 110, symbol: SWITCH },
  { id: 'switch', code: 'B', label: 'Switch', no: 'Bryter', group: 'Switches', height: 110, symbol: SWITCH },
  { id: 'switch2', code: 'B2', label: 'Two-way switch', no: 'Toveisbryter', group: 'Switches', height: 110, symbol: `${SWITCH} M -0.9 -0.3 L 0 0.35` },
  { id: 'ceiling', code: 'L', label: 'Ceiling light', no: 'Taklampepunkt', group: 'Lights', height: null, symbol: LIGHT },
  { id: 'wallLight', code: 'V', label: 'Wall light', no: 'Vegglampepunkt', group: 'Lights', height: 180, symbol: `${LIGHT} M -1.35 -1 L 1.35 -1` },
  { id: 'spot', code: 'S', label: 'Downlight / spot', no: 'Downlight', group: 'Lights', height: null, symbol: 'M -0.62 0 A 0.62 0.62 0 1 0 0.62 0 A 0.62 0.62 0 1 0 -0.62 0' },
  { id: 'led', code: 'LED', label: 'LED strip / driver', no: 'LED-stripe / driver', group: 'Lights', height: null, symbol: 'M -1.2 0.35 L 1.2 0.35 M -1.2 -0.35 L 1.2 -0.35 M -0.6 -0.35 L -0.6 0.35 M 0.6 -0.35 L 0.6 0.35' },
];

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

export function formatHeight(h: number | null): string {
  return h === null ? 'tak' : `${Math.round(h)}`;
}

export const isElTypeId = (v: unknown): v is ElTypeId => typeof v === 'string' && EL_TYPE.has(v as ElTypeId);
export const isElStatus = (v: unknown): v is ElStatus => v === 'existing' || v === 'new' || v === 'remove';

/** Radius the symbols are drawn at, in metres of plan. */
export const SYMBOL_R = 0.13;
