const VERSE1 = 'विश्वं दर्पणदृश्यमाननगरीतुल्यं निजान्तर्गतं\nपश्यन्नात्मनि मायया बहिरिवोद्भूतं यथा निद्रया ।\nयः साक्षात्कुरुते प्रबोधसमये स्वात्मानमेवाद्वयं\nतस्मै श्रीगुरुमूर्तये नम इदं श्रीदक्षिणामूर्तये ॥';

// Reads verse 1 with ElevenLabs. The key comes from Vercel's environment settings, never from the code.
// Vercel's edge cache keeps the result, so ElevenLabs is called rarely.
export default async function handler(req, res) {
  const key = process.env.ELEVENLABS_API_KEY;
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  if (!key) return json(501, 'AI voice isn’t set up on the server.');
  const voice = (process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb').replace(/[^\w-]/g, '');
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128', {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: VERSE1, model_id: 'eleven_multilingual_v2', voice_settings: { stability: .55, similarity_boost: .75 } })
    });
    if (!r.ok) { console.error('elevenlabs', r.status, await r.text()); return json(502, 'ElevenLabs didn’t return audio. Check the API key and credits.'); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
    res.end(buf);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs. Try again.'); }
}
