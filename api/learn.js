import { redis, send, wrap, readBody, anon, limit, ip, HttpError } from './_lib.js';
export default wrap(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const me = anon(req, res);
  await limit('learn:' + ip(req), 120, 600);
  const { id, val } = await readBody(req);
  if (typeof id !== 'string' || !/^r[a-z0-9]{6,20}$/.test(id)) throw new HttpError(400, 'Unknown reel.');
  const [exists] = await redis(['EXISTS', 'reel:' + id]);
  if (!exists) throw new HttpError(404, 'That reel is gone.');
  const [, count] = await redis([val ? 'SADD' : 'SREM', 'learn:' + id, me], ['SCARD', 'learn:' + id]);
  send(res, 200, { count, mine: !!val });
});
