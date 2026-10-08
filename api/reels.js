import { sb, send, wrap, readBody, who, needUser, cleanStyle, rid, toClient, HttpError } from './_db.js';

const MAX_TAKE = 1_200_000; // base64 characters, about 900 KB of audio
const COLS = 'id,name,caption,style,score,has_take,take_offset,created_at,learnt,user_id,anon';

export default wrap(async (req, res) => {
  const w = await who(req, res), me = w.anon;
  if (req.method === 'GET') {
    const [feed, mine] = await Promise.all([
      sb(`/rest/v1/reel_feed?select=${COLS}&order=created_at.desc&limit=200`).then(r => r.json()),
      sb(`/rest/v1/learnt?select=reel_id&anon=eq.${w.key}&limit=2000`).then(r => r.json())
    ]);
    const m = new Set(mine.map(x => x.reel_id));
    const own = r => (w.user ? r.user_id === w.user.id : false) || (!r.user_id && r.anon === me);
    return send(res, 200, { reels: feed.map(r => toClient(r, m.has(r.id), own(r))) });
  }
  if (req.method === 'POST') {
    const user = needUser(w);
    // Rate limit: 12 reels an hour per browser.
    const since = new Date(Date.now() - 3600e3).toISOString();
    const cr = await sb(`/rest/v1/reels?select=id&anon=eq.${me}&created_at=gte.${encodeURIComponent(since)}`, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
    if (+((cr.headers.get('content-range') || '').split('/')[1] || 0) >= 12) throw new HttpError(429, 'You’ve shared a lot this hour. Try again a bit later.');

    const b = await readBody(req);
    const name = user.handle;
    const caption = String(b.caption || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    const score = typeof b.score === 'number' && isFinite(b.score) ? Math.max(0, Math.min(100, Math.round(b.score))) : null;
    const take = b.take && typeof b.take.b64 === 'string' && /^audio\/[\w.+-]+(;[\w=.,+-]+)*$/.test(String(b.take.mime || '')) && b.take.b64.length <= MAX_TAKE && /^[A-Za-z0-9+/=]+$/.test(b.take.b64) ? b.take : null;
    const style = cleanStyle(b.style);
    if (style.Recitation === 'My recording' && !take) style.Recitation = 'None';
    const id = 'r' + Date.now().toString(36) + rid(3);

    if (take) {
      await sb(`/storage/v1/object/takes/${id}`, { method: 'POST', headers: { 'Content-Type': take.mime.split(';')[0], 'x-upsert': 'true' }, body: Buffer.from(take.b64, 'base64') });
    }
    const row = { id, anon: me, user_id: user.id, name, caption, style, score, has_take: !!take, take_offset: take ? Math.max(0, Math.min(10, Number(b.takeOffset) || 0)) : 0, take_mime: take ? take.mime.split(';')[0] : null };
    const ins = await sb('/rest/v1/reels', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(row) }).then(r => r.json());
    return send(res, 201, { reel: toClient({ ...ins[0], learnt: 0 }, false, true) });
  }
  throw new HttpError(405, 'Use GET or POST.');
});
