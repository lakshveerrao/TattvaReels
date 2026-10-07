import { randomBytes } from 'node:crypto';

// Server-only: the Supabase secret key never reaches the browser.
const BASE = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export async function sb(path, opt = {}, okStatuses = []) {
  if (!BASE || !KEY) throw new HttpError(501, 'The database isn’t set up on the server.');
  const r = await fetch(BASE + path, { ...opt, headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, ...(opt.headers || {}) } });
  if (!r.ok && !okStatuses.includes(r.status)) {
    console.error('supabase', opt.method || 'GET', path.split('?')[0], r.status, await r.text().catch(() => ''));
    throw new HttpError(502, 'The database didn’t answer. Try again.');
  }
  return r;
}

export function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

export function wrap(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) { const s = e.status || 500; if (s >= 500 && s !== 501) console.error(e); send(res, s, { error: e.status ? e.message : 'Something went wrong. Try again.' }); }
  };
}

function cookies(req) {
  const out = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}

// An anonymous id per browser, so each person counts once on "I learnt this".
export function anon(req, res) {
  let a = cookies(req).tr_a;
  if (!a || !/^[a-f0-9]{32}$/.test(a)) {
    a = randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', `tr_a=${a}; Path=/; Max-Age=${60 * 60 * 24 * 400}; SameSite=Lax; HttpOnly${process.env.VERCEL ? '; Secure' : ''}`);
  }
  return a;
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 3_000_000) throw new HttpError(413, 'That upload is too large.'); chunks.push(c); }
  const s = Buffer.concat(chunks).toString('utf8');
  try { return s ? JSON.parse(s) : {}; } catch { throw new HttpError(400, 'Bad request.'); }
}

export const rid = n => randomBytes(n).toString('hex');
export const REEL_ID = /^r[a-z0-9]{6,24}$/;

const INSTR = ['sitar', 'veena', 'bansuri', 'violin', 'harmonium', 'piano', 'guitar', 'santoor', 'sarangi', 'nadaswaram', 'harp', 'cello'];
const TONES = ['Tabla', 'Mridangam', 'Rock', 'Lo-fi', 'None'];
const VIS = ['Tattva film', 'Mirror city', 'Splat bloom', 'Sound sand', 'Flow rivers', 'Embers', 'Gravity orbits', 'Beatbox text'];
const REC = ['None', 'My recording', 'AI voice'];
export function cleanStyle(s) {
  s = s && typeof s === 'object' ? s : {};
  const snd = Array.isArray(s.Sound) ? [...new Set(s.Sound.filter(x => INSTR.includes(x)))].slice(0, 12) : [];
  return {
    Tone: TONES.includes(s.Tone) ? s.Tone : 'Tabla',
    Visuals: VIS.includes(s.Visuals) ? s.Visuals : 'Tattva film',
    Sound: snd.length ? snd : ['sitar'],
    Recitation: REC.includes(s.Recitation) ? s.Recitation : 'None'
  };
}

export function toClient(row, mine) {
  return { id: row.id, t: 0, name: row.name, caption: row.caption || '', style: row.style, score: row.score, createdAt: Date.parse(row.created_at) || 0,
    hasTake: !!row.has_take, takeOffset: row.take_offset || 0, learnt: row.learnt || 0, mine: !!mine };
}
