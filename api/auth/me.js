import { session, send, wrap } from '../_lib.js';
export default wrap(async (req, res) => {
  let s = null;
  try { s = await session(req); } catch (e) { if (e.status !== 503) throw e; }
  send(res, 200, { user: s ? { handle: s.handle } : null });
});
