import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { MaterialRegistry } from '../core/materials';
import { toWorld } from '../core/geom';
import type { Rect, Vec2 } from '../data/types';

export interface BoxOptions {
  parent?: THREE.Object3D;
  pickable?: boolean;
  castShadow?: boolean;
  rounded?: number;
}

/** Shared state while building the model. */
export class BuildContext {
  readonly root = new THREE.Group();
  /** Ceilings, cornices and soffits – hidden in dollhouse view. */
  readonly ceilings = new THREE.Group();
  readonly labels: CSS2DObject[] = [];
  /** 2D footprints that block walking in first-person mode. */
  readonly obstacles: Rect[] = [];

  constructor(readonly mats: MaterialRegistry) {
    this.root.add(this.ceilings);
  }

  /** Axis-aligned box from plan extents and heights. */
  box(key: string, r: Rect, z0: number, z1: number, opts: BoxOptions = {}): THREE.Mesh {
    const w = r.x1 - r.x0;
    const h = z1 - z0;
    const d = r.y1 - r.y0;
    const geo = opts.rounded
      ? new RoundedBoxGeometry(w, h, d, 3, Math.min(opts.rounded, w / 2, h / 2, d / 2))
      : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, this.mats.get(key));
    mesh.position.copy(toWorld((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, (z0 + z1) / 2));
    return this.finish(mesh, key, opts);
  }

  /** Box of `length` along direction `yaw` (radians, plan), centred on `center`. */
  orientedBox(key: string, center: Vec2, length: number, depth: number, z0: number, z1: number, yaw: number, opts: BoxOptions = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, z1 - z0, depth), this.mats.get(key));
    mesh.position.copy(toWorld(center[0], center[1], (z0 + z1) / 2));
    mesh.rotation.y = yaw;
    return this.finish(mesh, key, opts);
  }

  private finish(mesh: THREE.Mesh, key: string, opts: BoxOptions) {
    mesh.castShadow = opts.castShadow ?? !this.mats.isFixed(key);
    mesh.receiveShadow = true;
    if (opts.pickable !== false && !this.mats.isFixed(key)) mesh.userData.key = key;
    (opts.parent ?? this.root).add(mesh);
    return mesh;
  }
}
