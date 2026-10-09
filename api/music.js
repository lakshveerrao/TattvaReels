// Rock backing tracks for the Agara app, made once per tattva with ElevenLabs Music and then cached at the edge.
// GET /api/music?v=1..8 → instrumental MP3 (about 45 s, loops under the singer's voice).
// &fmt=pcm → the same track as 16 kHz mono 16-bit WAV, for the Hey Tattva devices (they have no MP3 decoder).
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
// MP3 → 16 kHz mono PCM: decode, mix to mono, low-pass (windowed sinc, 7 kHz) and resample, peak to -1 dB
async function toPcm16k(mp3) {
  const { MPEGDecoder } = await import('mpg123-decoder');
  const d = new MPEGDecoder(); await d.ready; const r = d.decode(new Uint8Array(mp3)); d.free();
  const ch = r.channelData, n = r.samplesDecoded, sr = r.sampleRate, mono = new Float32Array(n);
  for (const c of ch) for (let i = 0; i < n; i++) mono[i] += c[i] / ch.length;
  const ratio = sr / 16000, out = Math.floor(n / ratio), fc = 7000 / sr, H = 24, taps = [];
  for (let k = -H; k <= H; k++) { const x = 2 * fc * k, w = 0.42 + 0.5 * Math.cos(Math.PI * k / (H + 1)) + 0.08 * Math.cos(2 * Math.PI * k / (H + 1)); taps.push((k ? Math.sin(Math.PI * x) / (Math.PI * x) : 1) * 2 * fc * w); }
  const f = new Float32Array(out); let peak = 1e-6;
  for (let j = 0; j < out; j++) { const c = Math.round(j * ratio); let a = 0; for (let k = -H; k <= H; k++) { const i = c + k; if (i >= 0 && i < n) a += mono[i] * taps[k + H]; } f[j] = a; if (Math.abs(a) > peak) peak = Math.abs(a); }
  const g = 0.89 / peak, pcm = Buffer.alloc(out * 2);
  for (let j = 0; j < out; j++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(f[j] * g * 32767))), j * 2);
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
async function send(res, buf, pcm) {
  if (pcm) { const w = await toPcm16k(buf); res.statusCode = 200; res.setHeader('Content-Type', 'audio/wav'); res.setHeader('Content-Length', w.length); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'); return res.end(w); }
  sendMp3(res, buf);
}
function sendMp3(res, buf) { res.statusCode = 200; res.setHeader('Content-Type', 'audio/mpeg'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'); res.end(buf); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = new URL(req.url, 'http://x').searchParams;
  const v = Math.min(8, Math.max(1, parseInt(q.get('v') || '1', 10) || 1));
  const key = process.env.ELEVENLABS_API_KEY, pcm = q.get('fmt') === 'pcm';
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  const have = await stored(v); if (have && have.length > 20000) return send(res, have, pcm);
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
    await send(res, buf, pcm);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs.'); }
}
