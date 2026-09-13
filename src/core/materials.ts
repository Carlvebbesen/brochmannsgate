import * as THREE from 'three';
import type { ColorChange, ColorStore } from './state';

/** Materials that are not user-colourable. */
const FIXED: Record<string, THREE.Material> = {
  glass: new THREE.MeshStandardMaterial({
    color: '#cfe0e6',
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    depthWrite: false,
  }),
  handles: new THREE.MeshStandardMaterial({ color: '#9a9a98', roughness: 0.35, metalness: 0.8 }),
  // Kitchen details. No environment map, so metals keep a low metalness to avoid rendering black.
  steel: new THREE.MeshStandardMaterial({ color: '#c3c5c5', roughness: 0.3, metalness: 0.45 }),
  shadowGap: new THREE.MeshStandardMaterial({ color: '#1c1d1e', roughness: 1 }),
  ovenGlass: new THREE.MeshStandardMaterial({ color: '#34373a', roughness: 0.08, metalness: 0.1 }),
  hobMarks: new THREE.MeshStandardMaterial({ color: '#6a6d70', roughness: 0.5 }),
};

/** Surface finish per key; everything else is matte paint. */
const FINISH: Record<string, THREE.MeshStandardMaterialParameters> = {
  'kitchen.fronts': { roughness: 0.55 },
  'kitchen.worktop': { roughness: 0.6 },
  'kitchen.appliances': { roughness: 0.25, metalness: 0.2 },
  'bad.porcelain': { roughness: 0.2 },
  'bad.walls': { roughness: 0.5 },
  'bad.floor': { roughness: 0.6 },
  'balkong.railing': { roughness: 0.5, metalness: 0.3 },
};

interface FaceSlot {
  mesh: THREE.Mesh;
  index: number;
  key: string;
}

/**
 * One shared material per colour key, so changing a colour updates every surface using it.
 * Individual wall faces can get their own material (accent walls).
 */
export class MaterialRegistry {
  private byKey = new Map<string, THREE.MeshStandardMaterial>();
  private byFace = new Map<string, THREE.MeshStandardMaterial>();
  private slots = new Map<string, FaceSlot>();

  constructor(private readonly store: ColorStore) {
    store.onChange((c) => this.sync(c));
  }

  isFixed(key: string) {
    return key in FIXED;
  }

  get(key: string): THREE.Material {
    const fixed = FIXED[key];
    if (fixed) return fixed;
    let m = this.byKey.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...FINISH[key] });
      m.color.set(this.store.getColor(key));
      m.name = key;
      this.byKey.set(key, m);
    }
    return m;
  }

  /** Material for one wall face: its accent colour if it has one, otherwise the shared material. */
  face(faceId: string, key: string): THREE.Material {
    const hex = this.store.overrides[faceId];
    if (!hex) return this.get(key);
    let m = this.byFace.get(faceId);
    if (!m) {
      m = (this.get(key) as THREE.MeshStandardMaterial).clone();
      m.emissive.setRGB(0, 0, 0);
      this.byFace.set(faceId, m);
    }
    m.color.set(hex);
    return m;
  }

  bindFace(faceId: string, mesh: THREE.Mesh, index: number, key: string) {
    this.slots.set(faceId, { mesh, index, key });
  }

  /** The material to highlight for a selection. */
  materialFor(sel: { key: string; faceId?: string }): THREE.MeshStandardMaterial | null {
    const own = sel.faceId ? this.byFace.get(sel.faceId) : undefined;
    if (own) return own;
    const m = this.get(sel.key);
    return m instanceof THREE.MeshStandardMaterial ? m : null;
  }

  private sync(c: ColorChange) {
    if (c.type === 'color') {
      this.byKey.get(c.key)?.color.set(c.hex);
    } else if (c.type === 'override') {
      this.applyFace(c.faceId);
    } else {
      for (const [key, m] of this.byKey) m.color.set(this.store.getColor(key));
      for (const faceId of this.slots.keys()) this.applyFace(faceId);
    }
  }

  private applyFace(faceId: string) {
    const slot = this.slots.get(faceId);
    if (!slot) return;
    if (!this.store.overrides[faceId]) {
      this.byFace.get(faceId)?.dispose();
      this.byFace.delete(faceId);
    }
    (slot.mesh.material as THREE.Material[])[slot.index] = this.face(faceId, slot.key);
  }
}
