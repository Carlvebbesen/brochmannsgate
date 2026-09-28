import * as THREE from 'three';
import { ENTRY_TILE_ORIGIN } from '../data/apartment';
import { VINYL_FLOORS } from '../data/palette';
import type { ColorChange, ColorStore } from './state';
import { cementTileMap, fabricWeaveMap, woodGrainMap } from './textures';
import { VINYL, type VinylMaps } from './vinyl';

/** Furniture surfaces that get a bump map on top of whatever flat colour is picked, for a bit of realism. */
const WOOD_KEYS = new Set([
  'kontor.wardrobe',
  'furniture.nightstand',
  'furniture.tvBench',
  'furniture.diningTable',
  'furniture.skjenk',
  'furniture.diningChair',
  'furniture.hookRail',
  'furniture.hatShelf',
  'furniture.shoeBench',
  'kott.shelves',
  'balkong.sofaFrame',
  'balkong.tableTop',
]);
const FABRIC_KEYS = new Set([
  'furniture.bedFabric',
  'furniture.sofa',
  'furniture.diningChairSeat',
  'balkong.sofaCushion',
  'balkong.chairCushion',
  'balkong.rug',
]);

/** Plain matte materials for props that are not user-colourable. */
function props(colors: Record<string, string>): Record<string, THREE.Material> {
  return Object.fromEntries(
    Object.entries(colors).map(([key, color]) => [key, new THREE.MeshStandardMaterial({ color, roughness: 0.85 })]),
  );
}

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
  mattress: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.85 }),
  'tv.screen': new THREE.MeshStandardMaterial({ color: '#0c0d0f', roughness: 0.15, metalness: 0.2 }),
  'tv.frame': new THREE.MeshStandardMaterial({ color: '#1c1d1e', roughness: 0.4, metalness: 0.3 }),
  'nightstand.metal': new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4, metalness: 0.6 }),
  // Kott contents (coats, shoes, vacuum, bottles): props, not colourable.
  ...props({
    'kott.coatCream': '#d8ccb6',
    'kott.coatGreen': '#4f5b45',
    'kott.coatBlack': '#26272a',
    'kott.coatBeige': '#b7a384',
    'kott.shoeWhite': '#e9e7e2',
    'kott.shoeBlack': '#2a2a2c',
    'kott.shoeBrown': '#6b4a33',
    'kott.vacuum': '#5d5f64',
    'kott.vacuumAccent': '#6b4fa0',
    'kott.bottleWhite': '#f2f2ef',
    'kott.bottleGreen': '#7fae8a',
    // Balcony grill details and pot plants
    'grill.red': '#b8262b',
    'grill.tyre': '#141414',
    'plant.basket': '#b8996a',
    'plant.pot': '#d9d4c8',
    'plant.trunk': '#6b5842',
    'plant.olive': '#8d9a74',
    'plant.leaf': '#4d6a3c',
    'plant.hydrangea': '#eceedb',
    'plant.lavenderLeaf': '#8a9a82',
    'plant.lavender': '#8672b4',
  }),
  'grill.table': new THREE.MeshStandardMaterial({ color: '#8e9093', roughness: 0.55, metalness: 0.35 }),
};

let wood: THREE.CanvasTexture | null = null;
let fabric: THREE.CanvasTexture | null = null;
let tiles: THREE.CanvasTexture | null = null;

/** Surface finish per key; everything else is matte paint. */
const FINISH: Record<string, THREE.MeshStandardMaterialParameters> = {
  'kitchen.fronts': { roughness: 0.55 },
  'kitchen.worktop': { roughness: 0.6 },
  'kitchen.appliances': { roughness: 0.25, metalness: 0.2 },
  'kitchen.handles': { roughness: 0.3, metalness: 0.45 },
  'bad.porcelain': { roughness: 0.2 },
  'bad.walls': { roughness: 0.5 },
  'bad.floor': { roughness: 0.6 },
  'balkong.railing': { roughness: 0.5, metalness: 0.3 },
  'balkong.grill': { roughness: 0.4, metalness: 0.25 },
  'balkong.chair': { roughness: 0.5, metalness: 0.3 },
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

  constructor(
    private readonly store: ColorStore,
    private readonly vinyl: VinylMaps,
  ) {
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
      m.name = key;
      if (WOOD_KEYS.has(key)) {
        m.bumpMap = wood ??= woodGrainMap();
        m.bumpScale = 0.006;
        m.roughness = 0.6;
      } else if (key === 'entre.cementTiles') {
        m.map = tiles ??= cementTileMap(ENTRY_TILE_ORIGIN);
        m.roughness = 0.55;
      } else if (FABRIC_KEYS.has(key)) {
        m.bumpMap = fabric ??= fabricWeaveMap();
        m.bumpScale = 0.012;
        m.roughness = 0.95;
      }
      this.paint(key, m);
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

  /**
   * Sets a shared material's colour. A vinyl floor's colour is a tint: with the texture on it multiplies the texture,
   * and as a flat colour it multiplies the texture's average, so white means the vinyl either way.
   */
  private paint(key: string, m: THREE.MeshStandardMaterial) {
    m.color.set(this.store.getColor(key));
    if (!VINYL_FLOORS.has(key)) return;
    const textured = this.store.view.vinyl;
    if (!textured) m.color.multiply(VINYL.average);
    if ((m.map !== null) === textured) return;
    m.map = textured ? this.vinyl.map : null;
    m.normalMap = textured ? this.vinyl.normalMap : null;
    m.roughnessMap = textured ? this.vinyl.roughnessMap : null;
    m.roughness = textured ? 1 : 0.5; // the map holds the satin lacquer's roughness
    m.needsUpdate = true;
  }

  private sync(c: ColorChange) {
    if (c.type === 'color') {
      const m = this.byKey.get(c.key);
      if (m) this.paint(c.key, m);
    } else if (c.type === 'override') {
      this.applyFace(c.faceId);
    } else if (c.type === 'view') {
      for (const key of VINYL_FLOORS) {
        const m = this.byKey.get(key);
        if (m) this.paint(key, m);
      }
    } else if (c.type === 'furniture') {
      // Handled by main.ts (repositioning the group); no material change needed here.
    } else {
      for (const [key, m] of this.byKey) this.paint(key, m);
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
