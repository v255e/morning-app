import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

export const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
export const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
export const API = 'https://api.prod.whoop.com/developer';
export const SCOPES = 'offline read:recovery read:sleep read:cycles read:profile';

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

// проверка пароля сайта: возвращает null, если всё хорошо, иначе код ошибки
export function checkKey(req) {
  const expected = process.env.SITE_PASSWORD || '';
  if (!expected) return 'not_configured';
  const given = req.headers.get('x-site-key') || '';
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'bad_key';
  return null;
}
export const errStatus = code => (code === 'bad_key' ? 401 : 500);

export const store = () => getStore('whoop');
export const redirectUri = req => new URL(req.url).origin + '/api/whoop-callback';

export async function tokenRequest(params) {
  const body = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID || '',
    client_secret: process.env.WHOOP_CLIENT_SECRET || '',
    ...params
  });
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`whoop token ${r.status}: ${t.error_description || t.error || ''}`);
  return t;
}

export async function saveTokens(t) {
  const rec = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + (t.expires_in || 3600) * 1000
  };
  await store().setJSON('tokens', rec);
  return rec;
}

// возвращает access token или null, если WHOOP ещё не подключён
export async function getAccessToken(force = false) {
  const st = store();
  let rec = await st.get('tokens', { type: 'json' });
  if (!rec) return null;
  if (force || rec.expires_at - Date.now() < 60000) {
    const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: rec.refresh_token, scope: 'offline' });
    rec = await saveTokens({ ...t, refresh_token: t.refresh_token || rec.refresh_token });
  }
  return rec.access_token;
}
