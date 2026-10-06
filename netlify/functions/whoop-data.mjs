import { checkKey, errStatus, json, getAccessToken, API } from '../lib/whoop.mjs';

const PATHS = ['/v2/activity/sleep?limit=14', '/v2/recovery?limit=14', '/v2/cycle?limit=14'];

export default async (req) => {
  const bad = checkKey(req);
  if (bad) return json({ error: bad }, errStatus(bad));

  let token;
  try { token = await getAccessToken(); }
  catch (e) { console.error(e.message); return json({ connected: false, reauth: true }); }
  if (!token) return json({ connected: false });

  const load = tk => Promise.all(PATHS.map(p => fetch(API + p, { headers: { authorization: 'Bearer ' + tk } })));
  let rs = await load(token);
  if (rs.some(r => r.status === 401)) {
    try { token = await getAccessToken(true); }
    catch (e) { console.error(e.message); return json({ connected: false, reauth: true }); }
    rs = await load(token);
  }
  const [sl, rc, cy] = await Promise.all(rs.map(r => (r.ok ? r.json() : { records: [] })));
  return json({
    connected: true,
    sleeps: sl.records || [],
    recoveries: rc.records || [],
    cycles: cy.records || [],
    errors: rs.map(r => r.status).filter(s => s !== 200),
    at: Date.now()
  });
};

export const config = { path: '/api/whoop-data' };
