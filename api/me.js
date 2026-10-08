import { sb, send, wrap, readBody, who, needUser, HANDLE, HttpError } from './_db.js';

// The signed-in account. GET → who I am and my best game scores. POST {handle} picks or changes my name;
// POST {score:{game, s}} records a finished game (keeps the best).
const json = { 'Content-Type': 'application/json' };
const GAME = /^(g[a-z0-9]{6,24}|o[slb][1-8])$/;
const RESERVED = new Set(['admin', 'tattva', 'tattvareels', 'support', 'guru', 'official', 'you', 'seeker', 'host']);

export default wrap(async (req, res) => {
  const w = await who(req, res);
  if (req.method === 'GET') {
    if (!w.user) return send(res, 200, { user: null });
    const scores = await sb(`/rest/v1/scores?select=game_id,best,plays,updated_at&user_id=eq.${w.user.id}&order=updated_at.desc&limit=200`).then(r => r.json());
    return send(res, 200, { user: { email: w.user.email, handle: w.user.handle }, scores: scores.map(s => ({ game: s.game_id, best: s.best, plays: s.plays })) });
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Use GET or POST.');
  if (!w.user) throw new HttpError(401, 'Sign in first.');
  const b = await readBody(req);

  if (b.handle != null) {
    const h = String(b.handle).trim().toLowerCase();
    if (!HANDLE.test(h)) throw new HttpError(400, 'Use 3–20 letters, numbers, dots or underscores.');
    if (RESERVED.has(h)) throw new HttpError(409, 'That name is taken. Try another.');
    if (h === w.user.handle) return send(res, 200, { user: { email: w.user.email, handle: h } });
    const r = await sb('/rest/v1/profiles?on_conflict=id', { method: 'POST', headers: { ...json, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ id: w.user.id, handle: h }) }, [409]);
    if (r.status === 409) throw new HttpError(409, 'That name is taken. Try another.');
    // my reels and games show my new name
    await sb(`/rest/v1/reels?user_id=eq.${w.user.id}`, { method: 'PATCH', headers: { ...json, Prefer: 'return=minimal' }, body: JSON.stringify({ name: h }) });
    await sb(`/rest/v1/games?user_id=eq.${w.user.id}`, { method: 'PATCH', headers: { ...json, Prefer: 'return=minimal' }, body: JSON.stringify({ name: h }) });
    return send(res, 200, { user: { email: w.user.email, handle: h } });
  }

  if (b.score) {
    needUser(w);
    const g = String(b.score.game || ''), s = Math.round(Number(b.score.s));
    if (!GAME.test(g) || !Number.isFinite(s) || s < 0 || s > 99999) throw new HttpError(400, 'Bad score.');
    const best = await sb('/rest/v1/rpc/record_score', { method: 'POST', headers: json, body: JSON.stringify({ uid: w.user.id, gid: g, s }) }).then(r => r.json());
    return send(res, 200, { best: typeof best === 'number' ? best : s });
  }
  throw new HttpError(400, 'Bad request.');
});
