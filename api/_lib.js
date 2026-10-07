import { randomBytes } from 'node:crypto';

const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// Upstash Redis over REST: pass one or more commands, get their results in order.
export async function redis(...cmds) {
  if (!RURL || !RTOK) throw new HttpError(503, 'The database isn’t connected yet.');
  const r = await fetch(RURL.replace(/\/$/, '') + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + RTOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new HttpError(502, 'Database error ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new HttpError(502, 'Database error'); return x.result; });
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
    catch (e) { const s = e.status || 500; if (s >= 500) console.error(e); send(res, s, { error: e.status ? e.message : 'Something went wrong. Try again.' }); }
  };
}

export function cookies(req) {
  const out = {}; (req.headers.cookie || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}

export function setCookie(res, name, value, maxAge, httpOnly = true) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  const c = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${httpOnly ? '; HttpOnly' : ''}${secure}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
}

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 2_000_000) throw new HttpError(413, 'That upload is too large.'); chunks.push(c); }
  const s = Buffer.concat(chunks).toString('utf8');
  try { return s ? JSON.parse(s) : {}; } catch { throw new HttpError(400, 'Bad request.'); }
}

export const rid = (n = 16) => randomBytes(n).toString('hex');


export function anon(req, res) {
  let a = cookies(req).tr_a;
  if (!a || !/^[a-f0-9]{32}$/.test(a)) { a = rid(16); setCookie(res, 'tr_a', a, 60 * 60 * 24 * 400); }
  return a;
}

export function ip(req) { return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'unknown'; }

// allow `max` hits per `secs` for a key; throws 429 when exceeded
export async function limit(key, max, secs) {
  const [n] = await redis(['INCR', 'rl:' + key], ['EXPIRE', 'rl:' + key, secs, 'NX']);
  if (n > max) throw new HttpError(429, 'Too many tries. Wait a few minutes and try again.');
}

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
