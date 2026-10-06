import { store, redirectUri, tokenRequest, saveTokens } from '../lib/whoop.mjs';

export default async (req) => {
  const url = new URL(req.url);
  const back = q => Response.redirect(url.origin + '/?whoop=' + q, 302);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (url.searchParams.get('error')) return back('denied');
  if (!code || !state) return back('error');

  const st = store();
  const rec = await st.get('state:' + state, { type: 'json' });
  if (!rec || Date.now() - rec.t > 10 * 60000) return back('state');
  await st.delete('state:' + state);

  try {
    const t = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(req) });
    await saveTokens(t);
  } catch (e) {
    console.error(e.message);
    return back('error');
  }
  return back('connected');
};

export const config = { path: '/api/whoop-callback' };
