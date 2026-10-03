import type { WalkController } from '../controls/walk';
import type { Mode } from './panel';

/** Phones and tablets: no mouse, so no pointer lock. */
export const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

interface TouchActions {
  setMode(mode: Mode): void;
}

/**
 * The bar at the bottom of the screen on touch devices: a Walk / Exit button, and while walking a joystick
 * to move with. Dragging anywhere on the 3D view turns the head.
 */
export class TouchControls {
  private readonly stick: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly toggle: HTMLButtonElement;
  private mode: Mode = 'orbit';
  private stickId: number | null = null;
  private look: { id: number; x: number; y: number } | null = null;

  constructor(
    private readonly bar: HTMLElement,
    canvas: HTMLElement,
    private readonly walk: WalkController,
    actions: TouchActions,
  ) {
    bar.innerHTML = /* html */ `
      <div class="stick" aria-label="Move"><div class="knob"></div></div>
      <button class="walk-toggle">Walk</button>
    `;
    this.stick = bar.querySelector('.stick')!;
    this.knob = bar.querySelector('.knob')!;
    this.toggle = bar.querySelector('.walk-toggle')!;
    this.toggle.addEventListener('click', () => actions.setMode(this.mode === 'walk' ? 'orbit' : 'walk'));

    this.stick.addEventListener('pointerdown', (e) => {
      this.stickId = e.pointerId;
      this.stick.setPointerCapture(e.pointerId);
      this.moveStick(e);
    });
    this.stick.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickId) this.moveStick(e);
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.walk.stick.set(0, 0);
      this.knob.style.transform = '';
    };
    this.stick.addEventListener('pointerup', release);
    this.stick.addEventListener('pointercancel', release);

    canvas.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'walk' || this.look) return;
      this.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.look || e.pointerId !== this.look.id) return;
      this.walk.look(e.clientX - this.look.x, e.clientY - this.look.y);
      this.look.x = e.clientX;
      this.look.y = e.clientY;
    });
    const endLook = (e: PointerEvent) => {
      if (this.look?.id === e.pointerId) this.look = null;
    };
    window.addEventListener('pointerup', endLook);
    window.addEventListener('pointercancel', endLook);
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.bar.hidden = mode === 'plan';
    this.bar.classList.toggle('walking', mode === 'walk');
    this.toggle.textContent = mode === 'walk' ? 'Exit walk' : 'Walk';
    this.toggle.classList.toggle('on', mode === 'walk');
    if (mode !== 'walk') {
      this.look = null;
      this.stickId = null;
      this.walk.stick.set(0, 0);
      this.knob.style.transform = '';
    }
  }

  private moveStick(e: PointerEvent) {
    const r = this.stick.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = (e.clientX - (r.left + radius)) / radius;
    let dy = (e.clientY - (r.top + radius)) / radius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    this.walk.stick.set(dx, -dy);
    this.knob.style.transform = `translate(${dx * radius * 0.6}px, ${dy * radius * 0.6}px)`;
  }
}
