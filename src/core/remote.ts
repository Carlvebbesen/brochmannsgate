/**
 * Talks to the Worker API (`worker/index.ts`).
 *
 * Everyone can read the shared settings; only a visitor who has entered the password
 * gets a session cookie and may write them back. Without the password the app still
 * works – changes just stay in that browser.
 */

import type { ColorFile } from './state';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface LoadResult {
  settings: (ColorFile & { savedAt?: string }) | null;
  editable: boolean;
}

const SEEN_KEY = 'leilighet-3d:seen-remote';

export class Remote {
  editable = false;
  available = false;
  onStatus: ((status: SyncStatus, message?: string) => void) | null = null;
  private timer: number | undefined;
  private pending: ColorFile | null = null;
  private inFlight = false;

  async load(): Promise<LoadResult> {
    try {
      const res = await fetch('/api/settings', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as LoadResult;
      this.available = true;
      this.editable = data.editable === true;
      return data;
    } catch {
      this.available = false;
      this.editable = false;
      this.onStatus?.('offline');
      return { settings: null, editable: false };
    }
  }

  async login(password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: data.error ?? 'Kunne ikke logge inn' };
      this.editable = true;
      this.available = true;
      return { ok: true };
    } catch {
      return { ok: false, error: 'Ingen forbindelse til serveren' };
    }
  }

  async logout() {
    this.editable = false;
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
  }

  /** Debounced auto-save. Does nothing unless this browser is signed in. */
  queueSave(file: ColorFile) {
    if (!this.editable) return;
    this.pending = file;
    this.onStatus?.('saving');
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.flush(), 600);
  }

  private async flush() {
    if (this.inFlight || !this.pending) return;
    const file = this.pending;
    this.pending = null;
    this.inFlight = true;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; savedAt?: string };
      if (res.status === 401) {
        this.editable = false;
        this.onStatus?.('error', 'Økten er utløpt – skriv passordet på nytt');
      } else if (!res.ok) {
        this.onStatus?.('error', data.error ?? 'Kunne ikke lagre');
      } else {
        rememberSeen(data.savedAt);
        this.onStatus?.('saved');
      }
    } catch {
      this.onStatus?.('error', 'Kunne ikke lagre – ingen forbindelse');
    } finally {
      this.inFlight = false;
      if (this.pending) void this.flush();
    }
  }
}

/** True when the server's copy is newer than the one this browser last saw. */
export function isNewRemote(savedAt: string | undefined): boolean {
  if (!savedAt) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== savedAt;
  } catch {
    return true;
  }
}

export function rememberSeen(savedAt: string | undefined) {
  if (!savedAt) return;
  try {
    localStorage.setItem(SEEN_KEY, savedAt);
  } catch {
    // ignore
  }
}
