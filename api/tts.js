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
export default async function handler(req, res) {
  const v = Math.min(8, Math.max(1, parseInt(new URL(req.url, 'http://x').searchParams.get('v') || '1', 10) || 1));
  const key = process.env.ELEVENLABS_API_KEY;
  const json = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify({ error: msg })); };
  if (!key) return json(501, 'AI voice isn’t set up on the server.');
  const voice = (process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb').replace(/[^\w-]/g, '');
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128', {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: VERSES[v - 1], model_id: 'eleven_multilingual_v2', voice_settings: { stability: .55, similarity_boost: .75 } })
    });
    if (!r.ok) { console.error('elevenlabs', r.status, await r.text()); return json(502, 'ElevenLabs didn’t return audio. Check the API key and credits.'); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
    res.end(buf);
  } catch (e) { console.error(e); json(502, 'Couldn’t reach ElevenLabs. Try again.'); }
}
