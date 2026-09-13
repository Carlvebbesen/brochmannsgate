import * as THREE from 'three';
import { balcony } from '../data/apartment';
import { slabGeometry, toWorld } from '../core/geom';
import type { BuildContext } from './context';

const BALUSTRADE_H = 0.7;
const RAIL_H = 1.02;
const POST_SPACING = 0.11;

export function buildBalcony(ctx: BuildContext) {
  const { polygon, railing, floorLevel: fl, soffit } = balcony;

  const slab = (depth: number, y: number, topKey: string, parent: THREE.Object3D) => {
    const mesh = new THREE.Mesh(slabGeometry(polygon, depth), [ctx.mats.get(topKey), ctx.mats.get('exterior')]);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.faces = [topKey, 'exterior'];
    parent.add(mesh);
  };
  slab(0.18, fl - 0.18, 'balkong.floor', ctx.root);
  slab(0.15, fl + soffit, 'balkong.ceiling', ctx.ceilings); // underside of the balcony above

  // Solid rendered balustrade with a steel rail and balusters on top
  const posts: THREE.Vector3[] = [];
  let carry = 0;
  for (let i = 0; i < railing.length - 1; i++) {
    const [a, b] = [railing[i], railing[i + 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const yaw = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.orientedBox('balkong.balustrade', mid, len + 0.04, 0.09, fl, fl + BALUSTRADE_H, yaw);
    ctx.orientedBox('balkong.railing', mid, len + 0.02, 0.05, fl + RAIL_H - 0.04, fl + RAIL_H, yaw);
    for (let t = carry; t < len; t += POST_SPACING) {
      const k = t / len;
      posts.push(toWorld(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, fl + (BALUSTRADE_H + RAIL_H) / 2));
      carry = t + POST_SPACING - len;
    }
  }
  const postGeo = new THREE.BoxGeometry(0.02, RAIL_H - BALUSTRADE_H, 0.02);
  const inst = new THREE.InstancedMesh(postGeo, ctx.mats.get('balkong.railing'), posts.length);
  posts.forEach((p, i) => inst.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  inst.castShadow = true;
  inst.userData.key = 'balkong.railing';
  ctx.root.add(inst);
}
