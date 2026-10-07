import { redis, rid, setCookie, wrap } from '../_lib.js';

export default wrap(async (req, res) => {
  const t = String(new URL(req.url, 'http://x').searchParams.get('t') || '');
  let email = null;
  if (/^[a-f0-9]{48}$/.test(t)) [email] = await redis(['GETDEL', 'magic:' + t]);
  if (!email) { res.statusCode = 302; res.setHeader('Location', '/?signin=expired'); return res.end(); }
  const sid = rid(24);
  await redis(['SET', 'session:' + sid, email, 'EX', 60 * 60 * 24 * 30]);
  setCookie(res, 'tr_s', sid, 60 * 60 * 24 * 30);
  res.statusCode = 302; res.setHeader('Location', '/?signin=ok'); res.end();
});
