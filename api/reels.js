import { redis, send, wrap, readBody, session, anon, limit, cleanStyle, rid, HttpError } from './_lib.js';

const MAX_TAKE = 1_200_000; // base64 chars, about 900 KB of audio

export default wrap(async (req, res) => {
  if (req.method === 'GET') {
    const me = anon(req, res);
    const [ids] = await redis(['ZREVRANGE', 'reels:recent', 0, 199]);
    if (!ids.length) return send(res, 200, { reels: [] });
    const cmds = [];
    ids.forEach(id => cmds.push(['GET', 'reel:' + id], ['SCARD', 'learn:' + id], ['SISMEMBER', 'learn:' + id, me]));
    const out = await redis(...cmds);
    const reels = [];
    ids.forEach((id, k) => { const raw = out[k * 3]; if (!raw) return; const r = JSON.parse(raw); reels.push({ ...r, learnt: out[k * 3 + 1] || 0, mine: out[k * 3 + 2] === 1 }); });
    return send(res, 200, { reels });
  }
  if (req.method === 'POST') {
    const s = await session(req);
    if (!s) throw new HttpError(401, 'Sign in to share.');
    await limit('post:' + s.email, 12, 3600);
    const b = await readBody(req);
    const caption = String(b.caption || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    const score = typeof b.score === 'number' && isFinite(b.score) ? Math.max(0, Math.min(100, Math.round(b.score))) : null;
    const take = b.take && typeof b.take.b64 === 'string' && /^audio\/[\w.+-]+(;[\w=.,+-]+)*$/.test(String(b.take.mime || '')) && b.take.b64.length <= MAX_TAKE && /^[A-Za-z0-9+/=]+$/.test(b.take.b64) ? b.take : null;
    const style = cleanStyle(b.style);
    if (style.Recitation === 'My recording' && !take) style.Recitation = 'None';
    const id = 'r' + Date.now().toString(36) + rid(3);
    const reel = { id, t: 0, name: s.handle, caption, style, score, createdAt: Date.now(), hasTake: !!take, takeOffset: take ? Math.max(0, Math.min(10, Number(b.takeOffset) || 0)) : 0 };
    const cmds = [['SET', 'reel:' + id, JSON.stringify(reel)], ['ZADD', 'reels:recent', reel.createdAt, id]];
    if (take) cmds.push(['SET', 'take:' + id, JSON.stringify({ mime: take.mime, b64: take.b64 })]);
    await redis(...cmds);
    return send(res, 201, { reel: { ...reel, learnt: 0, mine: false } });
  }
  throw new HttpError(405, 'Use GET or POST.');
});
