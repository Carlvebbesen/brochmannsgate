/** Plan coordinates in metres: x = east (right on the floor plan), y = north (up on the plan). */
export type Vec2 = [number, number];

export interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Room {
  id: string;
  name: string;
  /** Interior outline (wall faces) in plan coordinates. */
  polygon: Vec2[];
  ceilingHeight: number;
  floorLevel?: number;
  outdoor?: boolean;
  /** Where to put the room label; defaults to the bounding-box centre. */
  labelAt?: Vec2;
}

/** A patch of floor with its own colour inside a room (e.g. entry tiles). */
export interface FloorZone {
  key: string;
  polygon: Vec2[];
}

export type WallKind = 'exterior' | 'interior' | 'beam' | 'column';

/** Axis-aligned wall block. Its longer side is the wall's "along" axis. */
export interface Wall extends Rect {
  id: string;
  kind: WallKind;
  bottom?: number;
  top?: number;
}

export type Side = '+x' | '-x' | '+y' | '-y';

export interface Opening {
  id: string;
  name: string;
  wall: string;
  /** Start/end along the wall's long axis, in absolute plan coordinates. */
  from: number;
  to: number;
  bottom: number;
  top: number;
  /** 'opening' = doorless hole in the wall (no leaf, no casing). */
  kind: 'door' | 'window' | 'opening';
  /** hinge: which end the leaf hangs on; swing: the side it opens towards; angle in degrees. */
  door?: { hinge: 'from' | 'to'; swing: Side; angle: number; glazed?: boolean };
  /** transom: height of the horizontal glazing bar as a fraction of the window height. */
  window?: { panes: number; transom?: number };
}

/** Built-in element (kitchen, bathroom, wardrobe, radiators) as a box. */
export interface Fixture extends Rect {
  key: string;
  z0: number;
  z1: number;
  rounded?: number;
  pickable?: boolean;
  /** Blocks walking in first-person mode (default: true when it starts below 1 m). */
  collide?: boolean;
  /** Belongs to the ceiling layer, which is hidden in dollhouse view. */
  ceiling?: boolean;
}

/** One door or drawer front; a unit lists them bottom → top. */
export interface CabinetFront {
  /**
   * door: vertical pull on the side away from the hinge. drawer: horizontal pull near the top (also used for integrated
   * dishwashers and pull-outs). oven: black glass with a steel bar. blank: filler panel without a pull.
   */
  kind: 'door' | 'drawer' | 'oven' | 'blank';
  /** Height in metres; the one front without a height takes the rest. */
  height?: number;
  /** Doors: the end of the run the hinge is on ('start' = the lower x or y). */
  hinge?: 'start' | 'end';
}

export interface CabinetUnit {
  /** Width along the run; the one unit without a width takes the rest. */
  width?: number;
  fronts: CabinetFront[];
  /** Undermount sink with a tap, centred on this unit. */
  sink?: boolean;
  /** Induction hob with a built-in extractor, centred on this unit. */
  hob?: boolean;
}

/** A straight run of kitchen cabinets. The rectangle includes the fronts; z1 is the carcass top (under any worktop). */
export interface CabinetRun extends Rect {
  id: string;
  /** Side the fronts face. */
  front: Side;
  z0: number;
  z1: number;
  /** Recessed plinth under the fronts. */
  plinth?: number;
  /** 30 mm worktop on top, overhanging the fronts. */
  worktop?: boolean;
  /** Units from the run's lower x/y end. */
  units: CabinetUnit[];
}

export interface Balcony {
  polygon: Vec2[];
  /** Railing centre line, from the building corner at the north end round to the south end. */
  railing: Vec2[];
  floorLevel: number;
  soffit: number;
}
