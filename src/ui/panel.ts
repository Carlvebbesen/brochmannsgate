import { labelFor, paletteGroups } from '../data/palette';
import { isHex, normalizeHex, type ColorStore, type ViewSettings } from '../core/state';
import type { SyncStatus } from '../core/remote';

export interface Selection {
  key: string;
  /** Set when a single wall face was clicked – enables the accent-wall option. */
  faceId?: string;
}

export type Mode = 'orbit' | 'walk';

export interface PanelActions {
  setMode(mode: Mode): void;
  setCeilings(on: boolean): void;
  setLabels(on: boolean): void;
  setCut(height: number | null): void;
  setSun(hour: number): void;
  view(preset: 'perspective' | 'top'): void;
  select(sel: Selection | null): void;
  login(password: string): Promise<{ ok: boolean; error?: string }>;
  logout(): void;
}

/** What the lock section shows: whether the server is reachable and whether we may write to it. */
export interface SyncView {
  available: boolean;
  editable: boolean;
  status: SyncStatus;
  message?: string;
}

const CUT_OFF = 2.8;

const TEMPLATE = /* html */ `
  <header>
    <h1>Brochmanns gate 14C</h1>
    <p>4. etasje · 3D model</p>
  </header>
  <section class="controls">
    <div class="seg">
      <button data-mode="orbit" class="on">Dollhouse</button>
      <button data-mode="walk">Walk</button>
    </div>
    <div class="orbit-only">
      <div class="views">
        <button data-view="perspective">3D view</button>
        <button data-view="top">Top view</button>
      </div>
      <label class="check"><input type="checkbox" id="opt-ceil" /> Show ceilings</label>
      <label class="check"><input type="checkbox" id="opt-labels" checked /> Room labels</label>
      <label class="range"><span>Section cut</span><input type="range" id="opt-cut" min="0.4" max="${CUT_OFF}" step="0.05" value="${CUT_OFF}" /><output id="cut-v">off</output></label>
    </div>
    <label class="range"><span>Sun</span><input type="range" id="opt-sun" min="5" max="22" step="0.25" value="16" /><output id="sun-v">16:00</output></label>
  </section>
  <section class="sync" id="sync"></section>
  <section class="selected" id="selected"></section>
  <section class="groups" id="groups"></section>
  <footer>
    <button id="btn-export">Export colours</button>
    <button id="btn-import">Import</button>
    <button id="btn-reset" class="danger">Reset</button>
    <input type="file" id="file-import" accept="application/json,.json" hidden />
  </footer>
`;

export class Panel {
  private swatches = new Map<string, HTMLInputElement>();
  private rows = new Map<string, HTMLElement>();
  private selection: Selection | null = null;
  private readonly card: HTMLElement;
  private readonly syncCard: HTMLElement;
  private sync: SyncView = { available: false, editable: false, status: 'offline' };

  constructor(
    private readonly el: HTMLElement,
    private readonly store: ColorStore,
    private readonly actions: PanelActions,
  ) {
    el.innerHTML = TEMPLATE;
    this.card = this.$('#selected');
    this.syncCard = this.$('#sync');
    this.buildGroups();
    this.wireControls();
    this.showSelection(null);
    this.showSync(this.sync);
    store.onChange(() => this.refresh());
  }

  /** Reflects settings loaded from the server in the controls (without firing their handlers). */
  setViewSettings(v: ViewSettings) {
    this.$<HTMLInputElement>('#opt-ceil').checked = v.ceilings;
    this.$<HTMLInputElement>('#opt-labels').checked = v.labels;
    const cut = this.$<HTMLInputElement>('#opt-cut');
    cut.value = String(v.cut ?? CUT_OFF);
    this.$<HTMLOutputElement>('#cut-v').textContent = v.cut === null ? 'off' : `${v.cut.toFixed(2)} m`;
    const sun = this.$<HTMLInputElement>('#opt-sun');
    sun.value = String(v.sun);
    this.$<HTMLOutputElement>('#sun-v').textContent = formatHour(v.sun);
  }

  showSync(next: SyncView) {
    this.sync = next;
    const { available, editable, status, message } = next;
    if (!available) {
      this.syncCard.innerHTML = `<p class="sync-line muted">Offline – changes are only saved in this browser.</p>`;
      return;
    }
    if (!editable) {
      this.syncCard.innerHTML = `
        <p class="sync-line muted">You are viewing the shared colours. Feel free to try your own – they are only saved in your browser.</p>
        <form class="unlock">
          <input type="password" placeholder="Password to edit for everyone" autocomplete="current-password" />
          <button type="submit">Unlock</button>
        </form>
        ${message ? `<p class="sync-line error">${escapeHtml(message)}</p>` : ''}
      `;
      const form = this.syncCard.querySelector('form')!;
      const input = form.querySelector('input')!;
      const button = form.querySelector('button')!;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!input.value) return;
        button.disabled = true;
        button.textContent = 'Checking…';
        const res = await this.actions.login(input.value);
        if (!res.ok) {
          this.showSync({ ...this.sync, message: res.error });
          this.syncCard.querySelector('input')?.focus();
        }
      });
      return;
    }
    const text =
      status === 'saving' ? 'Saving…' : status === 'error' ? (message ?? 'Could not save') : 'Saved for everyone';
    this.syncCard.innerHTML = `
      <div class="sync-head">
        <span class="sync-line ${status === 'error' ? 'error' : 'ok'}">${status === 'error' ? '⚠︎' : '●'} ${escapeHtml(text)}</span>
        <button class="sync-lock">Lock</button>
      </div>
      <p class="sync-line muted">Changes save automatically and everyone who opens the page sees them.</p>
    `;
    this.syncCard.querySelector('.sync-lock')!.addEventListener('click', () => this.actions.logout());
  }

  setMode(mode: Mode) {
    this.el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
    this.el.classList.toggle('walking', mode === 'walk');
  }

  showSelection(sel: Selection | null) {
    this.selection = sel;
    this.rows.forEach((row, key) => row.classList.toggle('active', key === sel?.key));
    if (!sel) {
      this.card.innerHTML = `<p class="hint">Click any floor, wall, ceiling or built-in in the model to change its colour. In the dollhouse view the ceilings are hidden, so switch on <em>Show ceilings</em> or use <em>Walk</em> to pick them.</p>`;
      return;
    }
    const { group, item } = labelFor(sel.key);
    const override = sel.faceId ? this.store.overrides[sel.faceId] : undefined;
    const hex = override ?? this.store.getColor(sel.key);
    this.card.innerHTML = `
      <div class="sel-head">
        <div><span class="sel-group">${group}</span><span class="sel-item">${item}</span></div>
        <button class="sel-close" title="Deselect (Esc)">×</button>
      </div>
      <div class="sel-color">
        <input type="color" value="${hex}" />
        <input class="hex" value="${hex}" spellcheck="false" maxlength="9" autocapitalize="off" autocomplete="off" />
      </div>
      ${sel.faceId ? `<label class="check accent"><input type="checkbox" ${override ? 'checked' : ''} /> Only this wall surface (accent colour)</label>` : ''}
    `;
    const color = this.card.querySelector<HTMLInputElement>('input[type=color]')!;
    const text = this.card.querySelector<HTMLInputElement>('input.hex')!;
    const accent = this.card.querySelector<HTMLInputElement>('.accent input');
    const apply = (value: string) => {
      if (!isHex(value)) return;
      if (sel.faceId && accent?.checked) this.store.setOverride(sel.faceId, value);
      else this.store.setColor(sel.key, value);
    };
    color.addEventListener('input', () => {
      text.value = color.value;
      text.classList.remove('bad');
      apply(color.value);
    });
    // Apply as soon as the typed/pasted text is a valid colour — waiting for `change`
    // meant a paste followed by a click in the scene was silently dropped.
    const fromText = () => {
      const normalized = normalizeHex(text.value);
      text.classList.toggle('bad', normalized === null && text.value.trim() !== '');
      if (!normalized) return;
      color.value = normalized;
      apply(normalized);
    };
    text.addEventListener('input', fromText); // also fires for paste
    text.addEventListener('blur', () => {
      // Tidy up on the way out: show the colour that is actually in use.
      text.value = color.value;
      text.classList.remove('bad');
    });
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') text.blur();
    });
    accent?.addEventListener('change', () => {
      this.store.setOverride(sel.faceId!, accent.checked ? color.value : null);
      if (!accent.checked) this.showSelection(sel);
    });
    this.card.querySelector('.sel-close')!.addEventListener('click', () => this.actions.select(null));
  }

  private refresh() {
    this.swatches.forEach((input, key) => (input.value = this.store.getColor(key)));
    const sel = this.selection;
    if (!sel || this.card.contains(document.activeElement)) return;
    const hex = (sel.faceId && this.store.overrides[sel.faceId]) || this.store.getColor(sel.key);
    this.card.querySelectorAll<HTMLInputElement>('input[type=color], input.hex').forEach((i) => (i.value = hex));
  }

  private buildGroups() {
    const host = this.$('#groups');
    for (const g of paletteGroups) {
      const details = document.createElement('details');
      details.open = true;
      details.innerHTML = `<summary>${g.title}</summary>`;
      for (const item of g.items) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<button class="row-label">${item.label}</button><input type="color" value="${this.store.getColor(item.key)}" />`;
        const input = row.querySelector('input')!;
        input.addEventListener('input', () => this.store.setColor(item.key, input.value));
        row.querySelector('button')!.addEventListener('click', () => this.actions.select({ key: item.key }));
        this.swatches.set(item.key, input);
        this.rows.set(item.key, row);
        details.appendChild(row);
      }
      host.appendChild(details);
    }
  }

  private wireControls() {
    this.el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
      b.addEventListener('click', () => this.actions.setMode(b.dataset.mode as Mode)),
    );
    this.el.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) =>
      b.addEventListener('click', () => this.actions.view(b.dataset.view as 'perspective' | 'top')),
    );
    const ceil = this.$<HTMLInputElement>('#opt-ceil');
    ceil.addEventListener('change', () => this.actions.setCeilings(ceil.checked));
    const labels = this.$<HTMLInputElement>('#opt-labels');
    labels.addEventListener('change', () => this.actions.setLabels(labels.checked));

    const cut = this.$<HTMLInputElement>('#opt-cut');
    const cutV = this.$<HTMLOutputElement>('#cut-v');
    cut.addEventListener('input', () => {
      const h = Number(cut.value);
      const on = h < CUT_OFF;
      cutV.textContent = on ? `${h.toFixed(2)} m` : 'off';
      this.actions.setCut(on ? h : null);
    });

    const sun = this.$<HTMLInputElement>('#opt-sun');
    const sunV = this.$<HTMLOutputElement>('#sun-v');
    sun.addEventListener('input', () => {
      const h = Number(sun.value);
      sunV.textContent = formatHour(h);
      this.actions.setSun(h);
    });

    this.$('#btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.store.toJSON(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'leilighet-farger.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    const file = this.$<HTMLInputElement>('#file-import');
    this.$('#btn-import').addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
      const f = file.files?.[0];
      file.value = '';
      if (!f) return;
      try {
        this.store.importJSON(JSON.parse(await f.text()));
      } catch (err) {
        alert(`Could not import colours: ${(err as Error).message}`);
      }
    });
    this.$('#btn-reset').addEventListener('click', () => {
      if (confirm('Reset all colours to the defaults from the listing photos?')) this.store.reset();
    });
  }

  private $<T extends HTMLElement = HTMLElement>(sel: string): T {
    return this.el.querySelector<T>(sel)!;
  }
}

const formatHour = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
