import { redis, wrap, send } from './_lib.js';
export default wrap(async (req, res) => {
  const id = String(new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!/^r[a-z0-9]{6,20}$/.test(id)) return send(res, 400, { error: 'Unknown reel.' });
  const [raw] = await redis(['GET', 'take:' + id]);
  if (!raw) return send(res, 404, { error: 'No voice for this reel.' });
  const t = JSON.parse(raw);
  res.statusCode = 200;
  res.setHeader('Content-Type', t.mime.split(';')[0]);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(Buffer.from(t.b64, 'base64'));
});
