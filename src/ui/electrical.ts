/*
 * The side-panel section for the el-plan: the phase switch (today / planned / compare),
 * the palette of point types, and the editor for the selected point.
 *
 * The plan opens view-only: hovering and clicking a point shows what it is, and nothing can be
 * placed, moved or deleted until Edit is switched on (button or E). It always starts locked.
 *
 * Shown instead of the colour groups while the app is in "El-plan" mode (`src/main.ts`).
 */

import {
  EL_STATUS,
  EL_TYPES,
  elType,
  glyphIcon,
  itemHeight,
  type ElStatus,
  type ElTypeId,
  type ElectricalItem,
} from '../data/electrical';
import type { ColorStore, ElBase, ElPhase } from '../core/state';
import { STATUS_COLOR } from './plan2d';

export interface ElectricalActions {
  /** Arm a type for placing (click the plan to drop one), or disarm with null. */
  setTool(type: ElTypeId | null): void;
  setEditing(on: boolean): void;
  select(id: string | null): void;
  fit(): void;
  print(): void;
  exportPng(): void;
}

const PHASES: { id: ElPhase; label: string; hint: string }[] = [
  { id: 'today', label: 'Today', hint: 'What is there now (existing + points to be removed)' },
  { id: 'planned', label: 'Planned', hint: 'What the flat ends up with (existing + new)' },
  { id: 'compare', label: 'Compare', hint: 'Everything at once: grey = existing, blue = new, red = to be removed' },
];

const BASES: { id: ElBase; label: string; hint: string }[] = [
  { id: 'plan', label: 'Floor plan', hint: 'The drawn plan: walls, doors, windows and built-ins' },
  { id: 'model', label: '3D top view', hint: 'The 3D model seen straight from above, with its real colours and furniture' },
];

const TEMPLATE = /* html */ `
  <button class="el-edit" id="el-edit" title="Unlock placing, moving and deleting points (E)"></button>
  <div class="el-base seg" id="el-base"></div>
  <div class="el-phase seg" id="el-phase"></div>
  <label class="check" id="el-furn-row" title="Draws the bed, sofa, table and TV bench under the plan, so a socket lands where the furniture actually is.">
    <input type="checkbox" id="el-furn" checked /> Show furniture
  </label>
  <label class="check" title="Distance along the wall to the corner (or door/window edge) on each side; for ceiling points, to the nearest wall in each direction. The hovered or selected point always shows its own.">
    <input type="checkbox" id="el-measure" /> Show measurements
  </label>
  <div class="el-selected" id="el-selected"></div>
  <div class="el-palette" id="el-palette"></div>
  <div class="el-summary" id="el-summary"></div>
  <div class="el-tools">
    <button id="el-fit">Fit</button>
    <button id="el-print">Print</button>
    <button id="el-png">PNG</button>
    <button id="el-clear" class="danger">Clear plan</button>
  </div>
`;

export class ElectricalPanel {
  private selected: string | null = null;
  private tool: ElTypeId | null = null;
  private editing = false;

  constructor(
    private readonly el: HTMLElement,
    private readonly store: ColorStore,
    private readonly actions: ElectricalActions,
  ) {
    el.innerHTML = TEMPLATE;
    this.buildSeg('#el-base', BASES, (id) => this.store.setView({ elBase: id }), 'base');
    this.buildSeg('#el-phase', PHASES, (id) => this.store.setView({ elPhase: id }), 'phase');
    this.buildPalette();
    this.wire();
    this.setEditing(false);
    this.refresh();
    store.onChange((c) => {
      if (c.type === 'electrical' || c.type === 'all' || c.type === 'view') this.refresh();
    });
  }

  setTool(tool: ElTypeId | null) {
    this.tool = tool;
    this.el.querySelectorAll<HTMLButtonElement>('[data-type]').forEach((b) => b.classList.toggle('on', b.dataset.type === tool));
    this.actions.setTool(tool);
  }

  setEditing(on: boolean) {
    this.editing = on;
    this.el.classList.toggle('editing', on);
    const b = this.$<HTMLButtonElement>('#el-edit');
    b.classList.toggle('on', on);
    b.innerHTML = on ? '<span>✎</span> Editing – click to lock <kbd>E</kbd>' : '<span>🔒</span> View only – click to edit <kbd>E</kbd>';
    if (!on) this.setTool(null);
    this.renderSelected();
  }

  get isEditing() {
    return this.editing;
  }

  showSelection(id: string | null) {
    this.selected = id;
    this.renderSelected();
  }

  private refresh() {
    this.el.querySelectorAll<HTMLButtonElement>('[data-phase]').forEach((b) =>
      b.classList.toggle('on', b.dataset.phase === this.store.view.elPhase),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-base]').forEach((b) =>
      b.classList.toggle('on', b.dataset.base === this.store.view.elBase),
    );
    const furn = this.$<HTMLInputElement>('#el-furn');
    furn.checked = this.store.view.elFurniture;
    furn.disabled = this.store.view.elBase === 'model';
    this.$('#el-furn-row').classList.toggle('disabled', furn.disabled);
    this.$<HTMLInputElement>('#el-measure').checked = this.store.view.elMeasures;
    this.renderSelected();
    this.renderSummary();
  }

  private buildSeg<T extends string>(sel: string, options: { id: T; label: string; hint: string }[], pick: (id: T) => void, key: string) {
    const host = this.$(sel);
    for (const o of options) {
      const b = document.createElement('button');
      b.dataset[key] = o.id;
      b.textContent = o.label;
      b.title = o.hint;
      b.addEventListener('click', () => pick(o.id));
      host.appendChild(b);
    }
  }

  private buildPalette() {
    const host = this.$('#el-palette');
    const groups = [...new Set(EL_TYPES.map((t) => t.group))];
    for (const group of groups) {
      const details = document.createElement('details');
      details.open = true;
      details.innerHTML = `<summary>${group}</summary>`;
      for (const type of EL_TYPES.filter((t) => t.group === group)) {
        const b = document.createElement('button');
        b.className = 'el-type';
        b.dataset.type = type.id;
        b.title = `${type.no} · ${type.height === null ? 'i taket' : `${type.height} cm over gulv`}`;
        b.innerHTML = `${glyphIcon(type, '#3d4245')}<span class="el-name">${type.label}</span><span class="el-code">${type.code}</span>`;
        b.addEventListener('click', () => this.setTool(this.tool === type.id ? null : type.id));
        details.appendChild(b);
      }
      host.appendChild(details);
    }
  }

  private renderSelected() {
    const host = this.$('#el-selected');
    const item = this.store.electrical.find((i) => i.id === this.selected);
    if (!item) {
      if (!this.editing) {
        host.innerHTML = `<p class="hint">Hover a point to see what it is and where it sits; click it for the details. Switch on <strong>Edit</strong> to place, move or delete points.</p>`;
        return;
      }
      host.innerHTML = this.tool
        ? `<p class="hint">Click the plan to place a <strong>${elType(this.tool).label}</strong>. It snaps to the nearest wall or cabinet; hold <kbd>Alt</kbd> for free placement, and <kbd>Esc</kbd> to stop.</p>`
        : `<p class="hint">Pick a point type below and click the plan to place it. Click a point to edit it, drag to move it, <kbd>Delete</kbd> to remove it.</p>`;
      return;
    }
    const type = elType(item.type);
    const h = itemHeight(item);
    const off = this.editing ? '' : 'disabled';
    host.innerHTML = /* html */ `
      <div class="sel-head">
        ${glyphIcon(type, STATUS_COLOR[item.status])}
        <div><span class="sel-group">${type.no}</span><span class="sel-item">${type.label}</span></div>
        <button class="sel-close" title="Deselect (Esc)">×</button>
      </div>
      <label class="el-field"><span>Type</span>
        <select id="el-type" ${off}>${EL_TYPES.map((t) => `<option value="${t.id}" ${t.id === item.type ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
      </label>
      <div class="seg el-status">${EL_STATUS.map(
        (s) => `<button data-status="${s.id}" class="${s.id === item.status ? 'on' : ''}" title="${s.hint}" style="--c:${STATUS_COLOR[s.id]}" ${off}>${s.label}</button>`,
      ).join('')}</div>
      <label class="el-field"><span>Height</span>
        <input type="number" id="el-height" min="0" max="260" step="5" value="${h ?? ''}" ${h === null || !this.editing ? 'disabled' : ''} /> <span class="unit">cm</span>
      </label>
      <label class="check"><input type="checkbox" id="el-ceil" ${h === null ? 'checked' : ''} ${off} /> In the ceiling</label>
      <label class="el-field note"><span>Note</span><input type="text" id="el-note" maxlength="200" placeholder="e.g. over benk, bak TV" value="${escapeHtml(item.note ?? '')}" ${off} /></label>
      <div class="el-pos">x ${item.x.toFixed(2)} · y ${item.y.toFixed(2)} m</div>
      ${this.editing ? '<button class="danger" id="el-del">Delete point</button>' : '<p class="hint">View only. Switch on <strong>Edit</strong> to change this point.</p>'}
    `;

    host.querySelector('.sel-close')!.addEventListener('click', () => this.actions.select(null));
    if (!this.editing) return;
    host.querySelector<HTMLSelectElement>('#el-type')!.addEventListener('change', (e) =>
      this.store.updateElectrical(item.id, { type: (e.target as HTMLSelectElement).value as ElTypeId }),
    );
    host.querySelectorAll<HTMLButtonElement>('[data-status]').forEach((b) =>
      b.addEventListener('click', () => this.store.updateElectrical(item.id, { status: b.dataset.status as ElStatus })),
    );
    const height = host.querySelector<HTMLInputElement>('#el-height')!;
    height.addEventListener('change', () => this.store.updateElectrical(item.id, { height: Number(height.value) }));
    const ceil = host.querySelector<HTMLInputElement>('#el-ceil')!;
    ceil.addEventListener('change', () =>
      this.store.updateElectrical(item.id, { height: ceil.checked ? null : (elType(item.type).height ?? 20) }),
    );
    const note = host.querySelector<HTMLInputElement>('#el-note')!;
    note.addEventListener('change', () => this.store.updateElectrical(item.id, { note: note.value.trim() || undefined }));
    host.querySelector('#el-del')!.addEventListener('click', () => {
      this.store.removeElectrical(item.id);
      this.actions.select(null);
    });
  }

  private renderSummary() {
    const items = this.store.electrical;
    const count = (s: ElStatus) => items.filter((i) => i.status === s).length;
    this.$('#el-summary').innerHTML = items.length
      ? `<span title="Existing">${count('existing')} existing</span><span title="New">${count('new')} new</span><span title="To be removed">${count('remove')} removed</span>`
      : `<span class="muted">No points yet.</span>`;
  }

  private wire() {
    const furn = this.$<HTMLInputElement>('#el-furn');
    furn.addEventListener('change', () => this.store.setView({ elFurniture: furn.checked }));
    const measure = this.$<HTMLInputElement>('#el-measure');
    measure.addEventListener('change', () => this.store.setView({ elMeasures: measure.checked }));
    this.$('#el-edit').addEventListener('click', () => this.actions.setEditing(!this.editing));
    this.$('#el-fit').addEventListener('click', () => this.actions.fit());
    this.$('#el-print').addEventListener('click', () => this.actions.print());
    this.$('#el-png').addEventListener('click', () => this.actions.exportPng());
    this.$('#el-clear').addEventListener('click', () => {
      if (confirm('Delete every point on the el-plan? Colours and furniture are not touched.')) {
        this.store.clearElectrical();
        this.actions.select(null);
      }
    });
  }

  private $<T extends HTMLElement = HTMLElement>(sel: string): T {
    return this.el.querySelector<T>(sel)!;
  }
}

/** A point placed by clicking the plan: the type's default height, marked as new. */
export function newItem(type: ElTypeId, x: number, y: number): ElectricalItem {
  return { id: `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, type, x, y, status: 'new' };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
