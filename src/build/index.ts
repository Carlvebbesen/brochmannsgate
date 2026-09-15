import type * as THREE from 'three';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { MaterialRegistry } from '../core/materials';
import { inRect, pointInPolygon } from '../core/geom';
import { rooms } from '../data/apartment';
import type { Rect } from '../data/types';
import { buildBalcony } from './balcony';
import { BuildContext } from './context';
import { buildFixtures } from './fixtures';
import { buildFurniture, type MovableItem } from './furniture';
import { buildKitchen } from './kitchen';
import { buildKontorMillwork } from './kontor';
import { buildOpenings, doorPassages } from './openings';
import { buildRooms } from './rooms';
import { buildTrim } from './trim';
import { buildWalls } from './walls';

export interface ApartmentModel {
  root: THREE.Group;
  ceilings: THREE.Group;
  labels: CSS2DObject[];
  dimensions: CSS2DObject[];
  obstacles: Rect[];
  furniture: MovableItem[];
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
  buildKontorMillwork(ctx);
  buildBalcony(ctx);
  const furniture = buildFurniture(ctx);
  for (const item of furniture) {
    const obstacle: Rect = { x0: 0, x1: 0, y0: 0, y1: 0 };
    updateObstacle(obstacle, item);
    ctx.obstacles.push(obstacle);
    item.obstacle = obstacle;
  }

  const passages = doorPassages();
  return {
    root: ctx.root,
    ceilings: ctx.ceilings,
    labels: ctx.labels,
    dimensions: ctx.dimensions,
    obstacles: ctx.obstacles,
    furniture,
    walkable: (x, y) => rooms.some((r) => pointInPolygon(x, y, r.polygon)) || passages.some((p) => inRect(x, y, p)),
  };
}

/** Recomputes a furniture item's axis-aligned collision footprint from its current world position. */
export function updateObstacle(obstacle: Rect, item: MovableItem) {
  const x = item.group.position.x;
  const y = -item.group.position.z;
  const hw = item.footprint.w / 2;
  const hd = item.footprint.d / 2;
  obstacle.x0 = x - hw;
  obstacle.x1 = x + hw;
  obstacle.y0 = y - hd;
  obstacle.y1 = y + hd;
}
