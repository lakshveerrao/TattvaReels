import { sb, send, wrap, readBody, who, needUser, rid, HttpError } from './_db.js';

// Games people make: a game style (Stickman Quest, Letter Builder, Block Builder) on one tattva, with a difficulty and a title. Live play itself runs peer to peer
// over Supabase Realtime broadcast; this endpoint only stores and lists the games.
const GID = /^g[a-z0-9]{6,24}$/;
function clean(b) {
  const tattva = Number.isInteger(b.tattva) && b.tattva >= 1 && b.tattva <= 8 ? b.tattva : 1;
  const s = b.settings && typeof b.settings === 'object' ? b.settings : {};
  const settings = { style: STYLES.includes(s.style) ? s.style : 'stick', level: [1, 2, 3].includes(s.level) ? s.level : 2, seed: Number.isInteger(s.seed) ? Math.abs(s.seed) % 1e9 : 1 };
  const title = String(b.title || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return { type: 'arcade', tattva, settings, title };
}
const STYLES = ['stick', 'letters', 'build', 'chakra'];
const STYLE_NAMES = { stick: 'Stickman Quest', letters: 'Letter Builder', build: 'Block Builder', chakra: 'Chakra Launch' };
const TATTVA_NAMES = ['The mirror city', 'The seed', 'That you are', 'The lamp in the pot', 'Not the body', 'The eclipse', 'The unchanging I', 'The dream of roles'];
const out = (r, w) => ({ own: !!(w && w.user && r.user_id === w.user.id), id: r.id, name: r.name, title: r.title, type: r.type, tattva: r.tattva, settings: r.settings, plays: r.plays || 0, createdAt: Date.parse(r.created_at) || 0 });
const COLS = 'id,name,title,type,tattva,settings,plays,created_at,user_id';

export default wrap(async (req, res) => {
  const w = await who(req, res), me = w.anon;
  const q = new URL(req.url, 'http://x').searchParams;
  if (req.method === 'GET') {
    const id = q.get('id');
    if (id) {
      if (!GID.test(id)) throw new HttpError(400, 'Unknown game.');
      const rows = await sb(`/rest/v1/games?select=${COLS}&id=eq.${id}`, {}, [400]).then(r => r.ok ? r.json() : sb(`/rest/v1/games?select=${COLS.replace(',user_id', '')}&id=eq.${id}`).then(x => x.json()));
      if (!rows.length) throw new HttpError(404, 'That game is gone.');
      return send(res, 200, { game: out(rows[0], w) });
    }
    const rows = await sb(`/rest/v1/games?select=${COLS}&order=created_at.desc&limit=100`, {}, [400]).then(r => r.ok ? r.json() : sb(`/rest/v1/games?select=${COLS.replace(',user_id', '')}&order=created_at.desc&limit=100`).then(x => x.json()));
    // games made before the three styles (no settings.style) are retired
    return send(res, 200, { games: rows.filter(r => r.settings && STYLES.includes(r.settings.style)).map(r => out(r, w)) });
  }
  if (req.method === 'POST') {
    const b = await readBody(req);
    if (b.played) {
      if (typeof b.played !== 'string' || !GID.test(b.played)) throw new HttpError(400, 'Unknown game.');
      const r = await sb('/rest/v1/rpc/game_played', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gid: b.played }) }).then(r => r.json());
      return send(res, 200, { plays: typeof r === 'number' ? r : 0 });
    }
    const user = needUser(w);
    const since = new Date(Date.now() - 3600e3).toISOString();
    const cr = await sb(`/rest/v1/games?select=id&anon=eq.${me}&created_at=gte.${encodeURIComponent(since)}`, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
    if (+((cr.headers.get('content-range') || '').split('/')[1] || 0) >= 10) throw new HttpError(429, 'You’ve made a lot of games this hour. Try again a bit later.');
    const g = clean(b);
    const name = user.handle;
    const row = { id: 'g' + Date.now().toString(36) + rid(3), anon: me, user_id: user.id, name, ...g, title: g.title || STYLE_NAMES[g.settings.style] + ' · ' + TATTVA_NAMES[g.tattva - 1] };
    const ins = await sb('/rest/v1/games', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(row) }).then(r => r.json());
    return send(res, 201, { game: out(ins[0], w) });
  }
  throw new HttpError(405, 'Use GET or POST.');
});
