// Rock backing tracks for the Agara app, made once per tattva with ElevenLabs Music and then cached at the edge.
// GET /api/music?v=1..8 → instrumental MP3 (about 45 s, loops under the singer's voice).
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
function sendMp3(res, buf) { res.statusCode = 200; res.setHeader('Content-Type', 'audio/mpeg'); res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'); res.end(buf); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = new URL(req.url, 'http://x').searchParams;
  const v = Math.min(8, Math.max(1, parseInt(q.get('v') || '1', 10) || 1));
  const key = process.env.ELEVENLABS_API_KEY;
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  const have = await stored(v); if (have && have.length > 20000) return sendMp3(res, have);
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
    sendMp3(res, buf);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs.'); }
}
