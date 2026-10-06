import { randomBytes } from 'node:crypto';
import { checkKey, errStatus, json, store, redirectUri, AUTH_URL, SCOPES } from '../lib/whoop.mjs';

export default async (req) => {
  const bad = checkKey(req);
  if (bad) return json({ error: bad }, errStatus(bad));
  if (!process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_CLIENT_SECRET) return json({ error: 'not_configured' }, 500);

  const state = randomBytes(16).toString('hex');
  await store().setJSON('state:' + state, { t: Date.now() });

  const u = new URL(AUTH_URL);
  u.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: redirectUri(req),
    scope: SCOPES,
    state
  }).toString();
  return json({ url: u.toString() });
};

export const config = { path: '/api/whoop-login' };
