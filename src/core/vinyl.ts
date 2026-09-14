import * as THREE from 'three';

/**
 * Bastion vinylgulv 1-stav Furu (parkett.no): 1828 × 220 mm planks with bevelled edges, laid east–west.
 * The textures are generated from the manufacturer's swatch by `scripts/floor-texture.py`.
 * Floor UVs are plan metres, so one texture repeat = one tile of the plank pattern.
 */
export const VINYL = {
  /** One texture tile: 2 plank lengths (along plan x) × 8 rows (along plan y), in metres. */
  tile: [3.656, 1.76] as const,
  /** Average colour of the texture, printed by the script. Used when the floor is shown as a flat colour. */
  average: new THREE.Color('#f5dfd2'),
};

export interface VinylMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

export function loadVinyl(anisotropy: number): VinylMaps {
  const loader = new THREE.TextureLoader();
  const load = (name: string, srgb = false) => {
    const t = loader.load(`/textures/vinyl-${name}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / VINYL.tile[0], 1 / VINYL.tile[1]);
    t.anisotropy = anisotropy; // keeps the planks sharp at grazing angles
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: load('color', true), normalMap: load('normal'), roughnessMap: load('rough') };
}
