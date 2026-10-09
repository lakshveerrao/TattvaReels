// Rock backing tracks for the Agara app, made once per tattva with ElevenLabs Music and then cached at the edge.
// GET /api/music?v=1..8 → instrumental MP3 (about 45 s, loops under the singer's voice).
// &fmt=pcm → the same track as 16 kHz mono 16-bit WAV, for the Hey Tattva devices (they have no MP3 decoder).
// &fmt=pcm&mix=1 → the band with the singer's rock voice mixed in (devices stream it live); X-Voice-Start/X-Voice-Len in samples.
const MOOD = [
  'mysterious and wide, like a city shimmering in a mirror',
  'growing and building, like a seed bursting into a tree',
  'bold and declarative, an anthem: you are That',
  'warm and glowing, like a lamp shining through a pot full of holes',
  'stripped-down and searching, letting go of the body',
  'dark then bright, like the sun coming out of an eclipse',
  'steady and unshakable, a constant driving pulse',
  'dreamlike and swirling, many roles played by one',
];
// generated once, then kept in the private Supabase bucket "takes" so new deploys don't regenerate (and re-pay for) them
const SB = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), SK = process.env.SUPABASE_SECRET_KEY || '';
const sbH = () => ({ apikey: SK, Authorization: 'Bearer ' + SK });
async function stored(v) { if (!SB || !SK) return null; const r = await fetch(SB + '/storage/v1/object/takes/music/rock-v' + v + '.mp3', { headers: sbH() }).catch(() => null); return r && r.ok ? Buffer.from(await r.arrayBuffer()) : null; }
async function store(v, buf) { if (!SB || !SK) return; await fetch(SB + '/storage/v1/object/takes/music/rock-v' + v + '.mp3', { method: 'POST', headers: { ...sbH(), 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' }, body: buf }).catch(e => console.error('store', e)); }
// MP3 → 16 kHz mono float samples: decode, mix to mono, low-pass (windowed sinc, 7 kHz) and resample
async function decode16k(mp3) {
  const { MPEGDecoder } = await import('mpg123-decoder');
  const d = new MPEGDecoder(); await d.ready; const r = d.decode(new Uint8Array(mp3)); d.free();
  const ch = r.channelData, n = r.samplesDecoded, sr = r.sampleRate, mono = new Float32Array(n);
  for (const c of ch) for (let i = 0; i < n; i++) mono[i] += c[i] / ch.length;
  const ratio = sr / 16000, out = Math.floor(n / ratio), fc = 7000 / sr, H = 24, taps = [];
  for (let k = -H; k <= H; k++) { const x = 2 * fc * k, w = 0.42 + 0.5 * Math.cos(Math.PI * k / (H + 1)) + 0.08 * Math.cos(2 * Math.PI * k / (H + 1)); taps.push((k ? Math.sin(Math.PI * x) / (Math.PI * x) : 1) * 2 * fc * w); }
  const f = new Float32Array(out);
  for (let j = 0; j < out; j++) { const c = Math.round(j * ratio); let a = 0; for (let k = -H; k <= H; k++) { const i = c + k; if (i >= 0 && i < n) a += mono[i] * taps[k + H]; } f[j] = a; }
  return f;
}
// float samples → 16-bit WAV, peak to -1 dB
function wav16k(f) {
  let peak = 1e-6; for (let j = 0; j < f.length; j++) { const a = Math.abs(f[j]); if (a > peak) peak = a; }
  const g = 0.89 / peak, pcm = Buffer.alloc(f.length * 2);
  for (let j = 0; j < f.length; j++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(f[j] * g * 32767))), j * 2);
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
// the singer's rock voice (16 kHz WAV from our own /api/tts) → float samples
async function rockVoice(origin, v) {
  const r = await fetch(origin + '/api/tts?v=' + v + '&fmt=pcm&voice=singer&sv=2&rock=1').catch(() => null);
  if (!r || !r.ok) return null;
  const b = Buffer.from(await r.arrayBuffer()); if (b.length < 3244 || b.toString('ascii', 0, 4) !== 'RIFF') return null;
  let p = 12, off = 0, len = 0; while (p + 8 <= b.length) { const cl = b.readUInt32LE(p + 4); if (b.toString('ascii', p, p + 4) === 'data') { off = p + 8; len = Math.min(cl, b.length - off); break; } p += 8 + cl; }
  const n = len >> 1, f = new Float32Array(n); for (let i = 0; i < n; i++) f[i] = b.readInt16LE(off + i * 2) / 32768; return f;
}
// rock vocal chain (as on the site): high-pass, presence lift, soft-clip grit, 110 ms slapback, a little room
function rockChain(x) {
  const y = new Float32Array(x.length), slap = new Float32Array(1760), room = new Float32Array(1409); let hy = 0, hx = 0, lp = 0, si = 0, ri = 0;
  for (let i = 0; i < x.length; i++) {
    hy = 0.953 * (hy + x[i] - hx); hx = x[i]; lp += (hy - lp) * 0.55; const p = hy + 0.8 * (hy - lp);
    const f = p * 4.6, g = f / (1 + Math.abs(f)) * 0.46;
    const o = g + 0.32 * slap[si]; slap[si] = g; si = (si + 1) % 1760;
    const r = room[ri]; room[ri] = o * 0.5 + r * 0.38; ri = (ri + 1) % 1409;
    y[i] = o + r * 0.25;
  }
  return y;
}
// band + rock voice in one stream for the devices: the voice starts after 2 s, the band ducks under it
async function rockMix(origin, v, band) {
  const bnd = await decode16k(band), voc = await rockVoice(origin, v);
  const start = 32000; if (!voc) return { buf: wav16k(bnd), start: 0, len: 0 };
  const vx = rockChain(voc), n = Math.max(bnd.length, start + vx.length + 24000), out = new Float32Array(n);
  let bpk = 1e-6, vpk = 1e-6; for (const s of bnd) bpk = Math.max(bpk, Math.abs(s)); for (const s of vx) vpk = Math.max(vpk, Math.abs(s));
  // band loud (Laksh: guitar to max, vocal less): the band at full level, only a light dip under the voice
  const gb = 1.0 / bpk, gv = 0.42 / vpk; let env = 0, duck = 1;
  for (let i = 0; i < n; i++) {
    const vi = i - start, vs = vi >= 0 && vi < vx.length ? vx[vi] * gv : 0;
    env = Math.max(Math.abs(vs), env * 0.9995); duck += ((env > 0.03 ? 0.85 : 1) - duck) * 0.0006;
    out[i] = bnd[i % bnd.length] * gb * duck + vs;
  }
  // make it loud: level so that the 99.5th percentile hits 0.9, soft-limit what is above
  const sorted = Float32Array.from(out, Math.abs).sort(), p995 = sorted[Math.floor(sorted.length * 0.995)] || 1, g = 0.9 / p995;
  for (let i = 0; i < n; i++) { const x = out[i] * g, a = Math.abs(x); out[i] = a <= 0.9 ? x : Math.sign(x) * (0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1)); }
  return { buf: wav16k(out), start, len: vx.length };
}
async function send(res, buf, pcm, mix, req, v) {
  const cache = () => res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
  if (pcm && mix) {
    const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'heytattva.vercel.app');
    const m = await rockMix(origin, v, buf);
    res.statusCode = 200; res.setHeader('Content-Type', 'audio/wav'); res.setHeader('Content-Length', m.buf.length);
    res.setHeader('X-Voice-Start', String(m.start)); res.setHeader('X-Voice-Len', String(m.len)); res.setHeader('Access-Control-Expose-Headers', 'X-Voice-Start, X-Voice-Len');
    if (m.len) cache(); else res.setHeader('Cache-Control', 'no-store');  // without the voice: try again next time
    return res.end(m.buf);
  }
  if (pcm) { const w = wav16k(await decode16k(buf)); res.statusCode = 200; res.setHeader('Content-Type', 'audio/wav'); res.setHeader('Content-Length', w.length); cache(); return res.end(w); }
  sendMp3(res, buf);
}
function sendMp3(res, buf) { res.statusCode = 200; res.setHeader('Content-Type', 'audio/mpeg'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'); res.end(buf); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = new URL(req.url, 'http://x').searchParams;
  const v = Math.min(8, Math.max(1, parseInt(q.get('v') || '1', 10) || 1));
  const key = process.env.ELEVENLABS_API_KEY, pcm = q.get('fmt') === 'pcm', mix = q.get('mix') === '1';
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  const have = await stored(v); if (have && have.length > 20000) return send(res, have, pcm, mix, req, v);
  if (!key) return json(501, 'ElevenLabs isn’t set up on the server.');
  const prompt = 'Instrumental hard rock backing track, no vocals. Key of B minor, 96 BPM. Crunchy distorted electric guitar power chords and a memorable riff, '
    + 'tight bass guitar, punchy live drums with big snare. Leave space in the mid range for a lead vocal. Indian devotional feel woven in subtly. Mood: ' + MOOD[v - 1] + '.';
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ prompt, music_length_ms: 45000, model_id: 'music_v1', force_instrumental: true })
    });
    if (!r.ok) { const t = await r.text(); console.error('music', r.status, t); return json(502, 'ElevenLabs music failed (' + r.status + '): ' + t.slice(0, 160)); }
    const buf = Buffer.from(await r.arrayBuffer());
    await store(v, buf);
    await send(res, buf, pcm, mix, req, v);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs.'); }
}
