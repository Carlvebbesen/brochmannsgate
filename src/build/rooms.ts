import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { floorZones, rooms } from '../data/apartment';
import { bboxCenter, bboxSize, polygonGeometry, signedArea, slabGeometry, toWorld } from '../core/geom';
import type { BuildContext } from './context';

export function buildRooms(ctx: BuildContext) {
  for (const room of rooms) {
    const at = room.labelAt ?? bboxCenter(room.polygon);
    addLabel(ctx, room.name, Math.abs(signedArea(room.polygon)), at, room.floorLevel ?? 0);
    addDimensionLabel(ctx, bboxSize(room.polygon), at, room.floorLevel ?? 0);
    if (room.outdoor) continue; // the balcony is built separately

    const level = room.floorLevel ?? 0;
    const floorKey = `${room.id}.floor`;
    const floor = new THREE.Mesh(polygonGeometry(room.polygon, 'up'), ctx.mats.get(floorKey));
    floor.position.y = level;
    floor.receiveShadow = true;
    floor.userData.key = floorKey;
    ctx.root.add(floor);

    const ceilingKey = `${room.id}.ceiling`;
    const ceiling = new THREE.Mesh(polygonGeometry(room.polygon, 'down'), ctx.mats.get(ceilingKey));
    ceiling.position.y = level + room.ceilingHeight;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    ceiling.userData.key = ceilingKey;
    ctx.ceilings.add(ceiling);

    const slab = new THREE.Mesh(slabGeometry(room.polygon, 0.2), ctx.mats.get('exterior'));
    slab.position.y = level - 0.203;
    ctx.root.add(slab);
  }

  for (const zone of floorZones) {
    const mesh = new THREE.Mesh(polygonGeometry(zone.polygon, 'up'), ctx.mats.get(zone.key));
    mesh.position.y = 0.002;
    mesh.receiveShadow = true;
    mesh.userData.key = zone.key;
    ctx.root.add(mesh);
  }
}

function addLabel(ctx: BuildContext, name: string, area: number, [x, y]: [number, number], level: number) {
  const el = document.createElement('div');
  el.className = 'room-label';
  el.innerHTML = `<strong>${name}</strong><span>${area.toFixed(1)} m²</span>`;
  const obj = new CSS2DObject(el);
  obj.position.copy(toWorld(x, y, level + 0.05));
  ctx.root.add(obj);
  ctx.labels.push(obj);
}

/** Bounding-box width × depth, shown below the room's name label when the "dimensions" option is on. */
function addDimensionLabel(ctx: BuildContext, [w, d]: [number, number], [x, y]: [number, number], level: number) {
  const el = document.createElement('div');
  el.className = 'dim-label';
  el.textContent = `${w.toFixed(2)} × ${d.toFixed(2)} m`;
  const obj = new CSS2DObject(el);
  obj.position.copy(toWorld(x, y, level + 0.03));
  ctx.root.add(obj);
  ctx.dimensions.push(obj);
}
