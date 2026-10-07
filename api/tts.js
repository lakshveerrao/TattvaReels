import { redis, wrap, send } from './_lib.js';

const VERSE1 = 'विश्वं दर्पणदृश्यमाननगरीतुल्यं निजान्तर्गतं\nपश्यन्नात्मनि मायया बहिरिवोद्भूतं यथा निद्रया ।\nयः साक्षात्कुरुते प्रबोधसमये स्वात्मानमेवाद्वयं\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥';

export default wrap(async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY; // set in Vercel → Settings → Environment Variables
  if (!key) return send(res, 501, { error: 'AI voice isn’t set up on the server.' });
  const voice = (process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb').replace(/[^\w-]/g, '');
  const ck = 'tts:v1:' + voice;
  let [b64] = await redis(['GET', ck]);
  if (!b64) {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128', {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: VERSE1, model_id: 'eleven_multilingual_v2', voice_settings: { stability: .55, similarity_boost: .75 } })
    });
    if (!r.ok) { console.error('elevenlabs', r.status, await r.text()); return send(res, 502, { error: 'ElevenLabs didn’t return audio. Check the API key and credits.' }); }
    b64 = Buffer.from(await r.arrayBuffer()).toString('base64');
    await redis(['SET', ck, b64]);
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(Buffer.from(b64, 'base64'));
});
