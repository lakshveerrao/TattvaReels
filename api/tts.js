// The eight verses (tattvas) of the Dakṣiṇāmūrti Aṣṭakam.
const VERSES = [
 "विश्वं दर्पणदृश्यमाननगरीतुल्यं निजान्तर्गतं\nपश्यन्नात्मनि मायया बहिरिवोद्भूतं यथा निद्रया ।\nयः साक्षात्कुरुते प्रबोधसमये स्वात्मानमेवाद्वयं\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "बीजस्यान्तरिवाङ्कुरो जगदिदं प्राङ्निर्विकल्पं पुनः\nमायाकल्पितदेशकालकलनावैचित्र्यचित्रीकृतम् ।\nमायावीव विजृम्भयत्यपि महायोगीव यः स्वेच्छया\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "यस्यैव स्फुरणं सदात्मकमसत्कल्पार्थकं भासते\nसाक्षात्तत्त्वमसीति वेदवचसा यो बोधयत्याश्रितान् ।\nयत्साक्षात्करणाद्भवेन्न पुनरावृत्तिर्भवाम्भोनिधौ\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "नानाच्छिद्रघटोदरस्थितमहादीपप्रभाभास्वरं\nज्ञानं यस्य तु चक्षुरादिकरणद्वारा बहिः स्पन्दते ।\nजानामीति तमेव भान्तमनुभात्येतत्समस्तं जगत्\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "देहं प्राणमपीन्द्रियाण्यपि चलां बुद्धिं च शून्यं विदुः\nस्त्रीबालान्धजडोपमास्त्वहमिति भ्रान्ता भृशं वादिनः ।\nमायाशक्तिविलासकल्पितमहाव्यामोहसंहारिणे\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "राहुग्रस्तदिवाकरेन्दुसदृशो मायासमाच्छादनात्\nसन्मात्रः करणोपसंहरणतो योऽभूत्सुषुप्तः पुमान् ।\nप्रागस्वाप्समिति प्रबोधसमये यः प्रत्यभिज्ञायते\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "बाल्यादिष्वपि जाग्रदादिषु तथा सर्वास्ववस्थास्वपि\nव्यावृत्तास्वनुवर्तमानमहमित्यन्तः स्फुरन्तं सदा ।\nस्वात्मानं प्रकटीकरोति भजतां यो मुद्रया भद्रया\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥",
 "विश्वं पश्यति कार्यकारणतया स्वस्वामिसंबन्धतः\nशिष्याचार्यतया तथैव पितृपुत्राद्यात्मना भेदतः ।\nस्वप्ने जाग्रति वा य एष पुरुषो मायापरिभ्रामितः\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥"
];

// Reads verse 1 with ElevenLabs. The key comes from Vercel's environment settings, never from the code.
// Vercel's edge cache keeps the result, so ElevenLabs is called rarely.
// What each tattva means, spoken after the recitation (m=1).
const MEANINGS = [
 "The world you see is like a city reflected in a mirror. It seems to be outside, yet it shines within you.",
 "The whole world rests in the Self like a tree inside a seed. Space and time unfold it, the way a magician conjures a show.",
 "Everything you see shines only because existence shines through it. The guru points and says: you are That.",
 "Your awareness is a lamp inside a pot full of holes. It shines out through the eyes and ears, and the world lights up.",
 "You are not the body, the breath, the senses or the mind. Those are things you know. The knower is what you are.",
 "In deep sleep you seem to vanish, like an eclipsed sun. On waking you say “I slept well”, so you were there all along.",
 "Childhood ends, youth ends, dreams end. The “I am” that was present in all of them never ends.",
 "Cause and effect, owner and owned, teacher and student, parent and child. One Self plays every role, like a dreamer who is every person in the dream."
];

// The singer's own voice (voice=singer): an ElevenLabs instant voice clone made from his cleaned Agara recording
// (api/_voice/singer.mp3, bundled with this function, not public). Created on first use, then found by name.
import fs from 'fs';
const SINGER_NAME = 'Hey Tattva singer';
let singerId = null;
async function singerVoice(key) {
  if (singerId) return { id: singerId, created: false };
  const h = { 'xi-api-key': key };
  const list = await fetch('https://api.elevenlabs.io/v1/voices', { headers: h }).then(r => r.ok ? r.json() : Promise.reject(new Error('list ' + r.status)));
  const found = (list.voices || []).find(x => x.name === SINGER_NAME);
  if (found) { singerId = found.voice_id; return { id: singerId, created: false }; }
  const mp3 = fs.readFileSync(new URL('./_voice/singer.mp3', import.meta.url));
  const form = new FormData();
  form.append('name', SINGER_NAME);
  form.append('description', 'The singer of the Agara rock version of the Dakṣiṇāmūrti Aṣṭakam, cloned from his own recording for Hey Tattva.');
  form.append('remove_background_noise', 'true');
  form.append('files', new Blob([mp3], { type: 'audio/mpeg' }), 'singer.mp3');
  const r = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: h, body: form });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.voice_id) throw new Error('clone ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
  singerId = j.voice_id; return { id: singerId, created: true };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = new URL(req.url, 'http://x').searchParams;
  const v = Math.min(8, Math.max(1, parseInt(q.get('v') || '1', 10) || 1));
  const meaning = q.get('m') === '1';
  // fmt=pcm: 16 kHz mono WAV for the Hey Tattva device (no MP3 decoder needed there)
  const pcm = q.get('fmt') === 'pcm';
  const key = process.env.ELEVENLABS_API_KEY;
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  if (!key) return json(501, 'AI voice isn’t set up on the server.');
  const singer = q.get('voice') === 'singer';
  let voice = (process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb').replace(/[^\w-]/g, '');
  if (singer) {
    try { const s = await singerVoice(key); voice = s.id;
      if (q.get('status') === '1') { res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify({ ok: true, voice: s.id, created: s.created, build: process.env.VERCEL_GIT_COMMIT_SHA || '' })); }
    } catch (e) { console.error('singer voice', e); return json(502, 'The singer voice isn’t ready: ' + String(e.message || e).slice(0, 200)); }
  }
  if (q.get('status') === '1') { res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify({ ok: true, build: process.env.VERCEL_GIT_COMMIT_SHA || '' })); }
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=' + (pcm ? 'pcm_16000' : 'mp3_44100_128'), {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: pcm ? 'audio/pcm' : 'audio/mpeg' },
      body: JSON.stringify({ text: meaning ? MEANINGS[v - 1] : VERSES[v - 1], model_id: 'eleven_multilingual_v2', voice_settings: singer ? { stability: .42, similarity_boost: .9, style: .35, use_speaker_boost: true } : { stability: .55, similarity_boost: .75 } })
    });
    if (!r.ok) { console.error('elevenlabs', r.status, await r.text()); return json(502, 'ElevenLabs didn’t return audio. Check the API key and credits.'); }
    let buf = Buffer.from(await r.arrayBuffer());
    if (pcm) buf = Buffer.concat([wavHeader(buf.length, 16000), buf]);
    res.statusCode = 200;
    res.setHeader('Content-Type', pcm ? 'audio/wav' : 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
    res.end(buf);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs. Try again.'); }
}

function wavHeader(n, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(n, 40); return h;
}
