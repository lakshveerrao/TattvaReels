import { sb, send, wrap, readBody, anon, REEL_ID, HttpError } from './_db.js';

export default wrap(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const me = anon(req, res);
  const { id, val } = await readBody(req);
  if (typeof id !== 'string' || !REEL_ID.test(id)) throw new HttpError(400, 'Unknown reel.');
  if (val) {
    const r = await sb('/rest/v1/learnt', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ reel_id: id, anon: me }) }, [409]);
    if (r.status === 409) throw new HttpError(404, 'That reel is gone.');
  } else {
    await sb(`/rest/v1/learnt?reel_id=eq.${id}&anon=eq.${me}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }
  const c = await sb(`/rest/v1/learnt?select=reel_id&reel_id=eq.${id}`, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
  send(res, 200, { count: +((c.headers.get('content-range') || '').split('/')[1] || 0), mine: !!val });
});
