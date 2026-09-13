/// <reference types="@cloudflare/workers-types" />
/**
 * Serves the built app and a tiny settings API on top of Workers KV.
 *
 *   GET  /api/settings  → { settings, editable }   (public – this is what every visitor sees)
 *   POST /api/login     → { ok }                   (password → signed session cookie)
 *   POST /api/logout    → { ok }
 *   PUT  /api/settings  → { ok }                   (requires the session cookie)
 *
 * The password lives in the EDIT_PASSWORD secret (`wrangler secret put EDIT_PASSWORD`,
 * and `.dev.vars` locally). The session cookie is an HMAC signed with that same secret,
 * so changing the password invalidates every existing session.
 */

export interface Env {
  ASSETS: Fetcher;
  SETTINGS: KVNamespace;
  LOGIN_LIMITER: RateLimit;
  EDIT_PASSWORD: string;
}

const KV_KEY = 'settings:v1';
const COOKIE = 'l3d_session';
const SESSION_DAYS = 30;
const MAX_BODY = 64 * 1024;
const HEX = /^#[0-9a-f]{6}$/i;

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      switch (`${request.method} ${url.pathname}`) {
        case 'GET /api/settings':
          return json({ settings: await readSettings(env), editable: await isEditor(request, env) });
        case 'PUT /api/settings':
          return await putSettings(request, env);
        case 'POST /api/login':
          return await login(request, env, url);
        case 'POST /api/logout':
          return json({ ok: true }, { 'Set-Cookie': sessionCookie('', 0, url) });
        default:
          return json({ error: 'Not found' }, {}, 404);
      }
    } catch (err) {
      console.error('api error', err);
      return json({ error: 'Server error' }, {}, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// ---- Settings

async function readSettings(env: Env): Promise<unknown> {
  return (await env.SETTINGS.get(KV_KEY, 'json')) ?? null;
}

async function putSettings(request: Request, env: Env): Promise<Response> {
  if (!(await isEditor(request, env))) return json({ error: 'Not signed in' }, {}, 401);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, {}, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, {}, 400);
  }
  const settings = sanitize(body);
  if (!settings) return json({ error: 'Not a settings document' }, {}, 400);
  await env.SETTINGS.put(KV_KEY, JSON.stringify(settings));
  return json({ ok: true, savedAt: settings.savedAt });
}

interface Settings {
  version: 2;
  colors: Record<string, string>;
  overrides: Record<string, string>;
  view: { sun: number; ceilings: boolean; labels: boolean; cut: number | null };
  savedAt: string;
}

/** Accepts only the shape the app writes – KV holds nothing a visitor could smuggle in. */
function sanitize(body: unknown): Settings | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.colors !== 'object' || b.colors === null) return null;
  const v = (b.view ?? {}) as Record<string, unknown>;
  const cut = num(v.cut, 0.4, 2.8);
  return {
    version: 2,
    colors: hexMap(b.colors),
    overrides: hexMap(b.overrides),
    view: {
      sun: num(v.sun, 5, 22) ?? 16,
      ceilings: v.ceilings === true,
      labels: v.labels !== false,
      cut: cut,
    },
    savedAt: new Date().toISOString(),
  };
}

function hexMap(obj: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, val] of Object.entries(obj)) {
      if (k.length <= 80 && typeof val === 'string' && HEX.test(val)) out[k] = val.toLowerCase();
      if (Object.keys(out).length > 500) break;
    }
  }
  return out;
}

function num(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : null;
}

// ---- Auth

async function login(request: Request, env: Env, url: URL): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  const { success } = await env.LOGIN_LIMITER.limit({ key: `login:${ip}` });
  if (!success) return json({ error: 'For mange forsøk. Vent litt.' }, {}, 429);

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!env.EDIT_PASSWORD || !(await sameSecret(password, env.EDIT_PASSWORD))) {
    return json({ error: 'Feil passord' }, {}, 401);
  }
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const token = await signToken(exp, env.EDIT_PASSWORD);
  return json({ ok: true }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400, url) });
}

async function isEditor(request: Request, env: Env): Promise<boolean> {
  const token = cookie(request, COOKIE);
  return !!token && !!env.EDIT_PASSWORD && (await verifyToken(token, env.EDIT_PASSWORD));
}

async function sameSecret(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([digest(a), digest(b)]);
  return crypto.subtle.timingSafeEqual(da, db);
}

const digest = (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

async function signToken(exp: number, secret: string): Promise<string> {
  const payload = String(exp);
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload));
  return `${exp}.${b64url(sig)}`;
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const sig = unb64url(token.slice(dot + 1));
  if (!sig) return false;
  return crypto.subtle.verify('HMAC', await hmacKey(secret), sig, new TextEncoder().encode(payload));
}

function sessionCookie(value: string, maxAge: number, url: URL): string {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function cookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function unb64url(s: string): ArrayBuffer | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
  } catch {
    return null;
  }
}

// ---- Helpers

function json(body: unknown, headers: Record<string, string> = {}, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
