import { sb, send, wrap, REEL_ID } from './_db.js';

// A reel's recorded voice, read from the private "takes" bucket.
export default wrap(async (req, res) => {
  const id = String(new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!REEL_ID.test(id)) return send(res, 400, { error: 'Unknown reel.' });
  const r = await sb(`/storage/v1/object/takes/${id}`, {}, [400, 404]);
  if (!r.ok) return send(res, 404, { error: 'No voice for this reel.' });
  res.statusCode = 200;
  res.setHeader('Content-Type', r.headers.get('content-type') || 'audio/webm');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(Buffer.from(await r.arrayBuffer()));
});
