import { redis, cookies, setCookie, send, wrap, HttpError } from '../_lib.js';
export default wrap(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const sid = cookies(req).tr_s;
  if (sid && /^[a-f0-9]{48}$/.test(sid)) await redis(['DEL', 'session:' + sid]);
  setCookie(res, 'tr_s', '', 0);
  send(res, 200, { ok: true });
});
