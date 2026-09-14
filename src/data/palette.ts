/** Colourable surfaces, grouped for the side panel. Defaults are picked from the listing photos. */

export interface PaletteItem {
  key: string;
  label: string;
  color: string;
}

export interface PaletteGroup {
  title: string;
  items: PaletteItem[];
}

const SAGE = '#c1c7ba';
const CEILING = '#f6f5f1';
/** The vinyl floor's colour is a tint over its texture; white shows the vinyl as it is. */
const VINYL_TINT = '#ffffff';

/** Floors laid with the Bastion vinyl: every room except the bathroom (the entry tiles are a floor zone on top). */
export const VINYL_FLOORS = new Set(['stue', 'entre', 'kott', 'hovedsoverom', 'kontor', 'tvstue'].map((id) => `${id}.floor`));

const room = (id: string, walls: string): PaletteItem[] => [
  { key: `${id}.floor`, label: 'Floor (vinyl tint)', color: VINYL_TINT },
  { key: `${id}.walls`, label: 'Walls', color: walls },
  { key: `${id}.ceiling`, label: 'Ceiling', color: CEILING },
];

export const paletteGroups: PaletteGroup[] = [
  { title: 'Stue/Kjøkken', items: room('stue', SAGE) },
  {
    title: 'Entré',
    items: [...room('entre', SAGE), { key: 'entre.tiles', label: 'Entry tiles', color: '#9c9b97' }],
  },
  {
    title: 'Bad',
    items: [
      { key: 'bad.floor', label: 'Floor tiles', color: '#cfc8bc' },
      { key: 'bad.walls', label: 'Wall tiles', color: '#d8d2c7' },
      { key: 'bad.ceiling', label: 'Ceiling', color: '#f7f6f3' },
    ],
  },
  { title: 'Kott', items: room('kott', SAGE) },
  { title: 'Hovedsoverom', items: room('hovedsoverom', '#8fa090') },
  { title: 'Kontor', items: room('kontor', '#a9b0ac') },
  { title: 'Tvstue', items: room('tvstue', '#8a9884') },
  {
    title: 'Balkong',
    items: [
      { key: 'balkong.floor', label: 'Decking', color: '#4a4238' },
      { key: 'balkong.ceiling', label: 'Soffit', color: '#ede6d2' },
      { key: 'balkong.balustrade', label: 'Balustrade', color: '#ede6d2' },
      { key: 'balkong.railing', label: 'Railing', color: '#d6d7d3' },
    ],
  },
  {
    title: 'Kjøkkeninnredning',
    items: [
      { key: 'kitchen.fronts', label: 'Fronts', color: '#7a7e80' },
      { key: 'kitchen.bulkhead', label: 'Bulkhead above cabinets', color: '#6f7375' },
      { key: 'kitchen.worktop', label: 'Worktop', color: '#8f8c88' },
      { key: 'kitchen.backsplash', label: 'Backsplash', color: '#b9bbb8' },
      { key: 'kitchen.handles', label: 'Handles', color: '#b4b6b5' },
      { key: 'kitchen.appliances', label: 'Hob & ovens', color: '#1f2022' },
    ],
  },
  {
    title: 'Baderomsinnredning',
    items: [
      { key: 'bad.vanity', label: 'Vanity & mirror cabinet', color: '#f3f3f1' },
      { key: 'bad.porcelain', label: 'Toilet & basin', color: '#fafaf9' },
    ],
  },
  {
    title: 'Felles',
    items: [
      { key: 'trim', label: 'Skirting, cornices & reveals', color: '#fbfbf8' },
      { key: 'doors', label: 'Door leaves', color: '#fbfbf8' },
      { key: 'windows', label: 'Window frames', color: '#fbfbf8' },
      { key: 'radiators', label: 'Radiators', color: '#f1f1ee' },
      { key: 'exterior', label: 'Facade', color: '#e9e0c8' },
      { key: 'walltops', label: 'Wall tops (section)', color: '#4b4b4b' },
    ],
  },
];

export const defaultColors: Record<string, string> = Object.fromEntries(
  paletteGroups.flatMap((g) => g.items.map((i) => [i.key, i.color])),
);

export function labelFor(key: string): { group: string; item: string } {
  for (const g of paletteGroups) {
    const item = g.items.find((i) => i.key === key);
    if (item) return { group: g.title, item: item.label };
  }
  return { group: '', item: key };
}
