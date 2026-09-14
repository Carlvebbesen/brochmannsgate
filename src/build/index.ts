import type * as THREE from 'three';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { MaterialRegistry } from '../core/materials';
import { inRect, pointInPolygon } from '../core/geom';
import { rooms } from '../data/apartment';
import type { Rect } from '../data/types';
import { buildBalcony } from './balcony';
import { BuildContext } from './context';
import { buildFixtures } from './fixtures';
import { buildKitchen } from './kitchen';
import { buildOpenings, doorPassages } from './openings';
import { buildRooms } from './rooms';
import { buildTrim } from './trim';
import { buildWalls } from './walls';

export interface ApartmentModel {
  root: THREE.Group;
  ceilings: THREE.Group;
  labels: CSS2DObject[];
  obstacles: Rect[];
  /** True where a person can stand (inside a room or in a doorway). */
  walkable(x: number, y: number): boolean;
}

export function buildApartment(mats: MaterialRegistry): ApartmentModel {
  const ctx = new BuildContext(mats);
  buildRooms(ctx);
  buildWalls(ctx);
  buildOpenings(ctx);
  buildTrim(ctx);
  buildFixtures(ctx);
  buildKitchen(ctx);
  buildBalcony(ctx);

  const passages = doorPassages();
  return {
    root: ctx.root,
    ceilings: ctx.ceilings,
    labels: ctx.labels,
    obstacles: ctx.obstacles,
    walkable: (x, y) => rooms.some((r) => pointInPolygon(x, y, r.polygon)) || passages.some((p) => inRect(x, y, p)),
  };
}
