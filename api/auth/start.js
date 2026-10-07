import { redis, send, wrap, readBody, rid, ip, limit, HttpError } from '../_lib.js';

// Email is simulated: no message is sent. The sign-in link is returned to the page, which opens it.
export default wrap(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const { email: raw } = await readBody(req);
  const email = String(raw || '').trim().toLowerCase();
  if (!/^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > 200) throw new HttpError(400, 'Enter an email like you@example.com.');
  await limit('auth-ip:' + ip(req), 20, 900);
  const token = rid(24);
  await redis(['SET', 'magic:' + token, email, 'EX', 900]);
  send(res, 200, { ok: true, link: '/api/auth/verify?t=' + token });
});
