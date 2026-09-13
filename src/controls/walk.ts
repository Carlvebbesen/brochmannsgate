import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { Rect, Vec2 } from '../data/types';

const EYE = 1.62;
const RADIUS = 0.2;
const SPEED = 1.8;

/** First-person walking with simple 2D collision against walls and built-ins. */
export class WalkController {
  readonly controls: PointerLockControls;
  enabled = false;
  private keys = new Set<string>();
  private forward = new THREE.Vector3();

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    dom: HTMLElement,
    private readonly obstacles: Rect[],
    private readonly walkable: (x: number, y: number) => boolean,
  ) {
    this.controls = new PointerLockControls(camera, dom);
    window.addEventListener('keydown', (e) => {
      if (this.enabled) this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  place([x, y]: Vec2, [lx, ly]: Vec2) {
    this.camera.position.set(x, EYE, -y);
    this.camera.lookAt(lx, EYE, -ly);
  }

  update(dt: number) {
    if (!this.enabled || !this.controls.isLocked) return;
    const k = (...codes: string[]) => (codes.some((c) => this.keys.has(c)) ? 1 : 0);
    const fwd = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown');
    const side = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft');
    if (!fwd && !side) return;

    const f = this.camera.getWorldDirection(this.forward).setY(0).normalize();
    const move = new THREE.Vector3(f.x * fwd - f.z * side, 0, f.z * fwd + f.x * side);
    const speed = SPEED * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.8 : 1);
    move.normalize().multiplyScalar(speed * Math.min(dt, 0.1));

    const p = this.camera.position;
    if (this.free(p.x + move.x, -p.z)) p.x += move.x;
    if (this.free(p.x, -(p.z + move.z))) p.z += move.z;
  }

  private free(x: number, y: number): boolean {
    if (!this.walkable(x, y)) return false;
    return !this.obstacles.some((r) => {
      const dx = x - THREE.MathUtils.clamp(x, r.x0, r.x1);
      const dy = y - THREE.MathUtils.clamp(y, r.y0, r.y1);
      return dx * dx + dy * dy < RADIUS * RADIUS;
    });
  }
}
