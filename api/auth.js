import { sb, send, wrap, readBody, anon, rid, sha, setSession, clearSession, sessionToken, SESSION_DAYS, HttpError } from './_db.js';

// Email-code sign-in. POST {email} sends a code (Supabase Auth emails it); POST {email, code} checks it and starts a
// session; POST {logout:true} ends it. Supabase Auth's own tokens are not kept: the server issues a random session
// token in an HttpOnly cookie and stores only its hash.
const EMAIL = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/;
const json = { 'Content-Type': 'application/json' };

export default wrap(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
  const b = await readBody(req);
  const me = anon(req, res);

  if (b.logout) {
    const t = sessionToken(req);
    if (t) await sb(`/rest/v1/sessions?token_hash=eq.${sha(t)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    clearSession(res);
    return send(res, 200, { ok: true });
  }

  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, 'Enter an email like you@example.com.');

  if (b.code == null) {
    const r = await sb('/auth/v1/otp', { method: 'POST', headers: json, body: JSON.stringify({ email, create_user: true }) }, [400, 422, 429, 500, 504]);
    if (r.status === 429) throw new HttpError(429, 'Please wait a minute before asking for another code.');
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      const m = String(j.msg || j.message || j.error_description || '');
      console.error('otp', r.status, m);
      if (/not authorized/i.test(m)) throw new HttpError(403, 'Sign-in emails can only go to the team’s addresses for now.');
      throw new HttpError(502, 'Couldn’t send the code. Try again in a minute.');
    }
    return send(res, 200, { sent: true });
  }

  const code = String(b.code).replace(/\D/g, '');
  if (code.length < 6 || code.length > 10) throw new HttpError(400, 'Enter the code from the email.');
  const v = await sb('/auth/v1/verify', { method: 'POST', headers: json, body: JSON.stringify({ type: 'email', email, token: code }) }, [400, 401, 403, 422, 429]);
  if (v.status === 429) throw new HttpError(429, 'Too many tries. Wait a minute and try again.');
  if (!v.ok) throw new HttpError(400, 'That code is wrong or has expired. Check the newest email, or send a new code.');
  const u = (await v.json()).user || {};
  if (!u.id) throw new HttpError(502, 'Sign-in didn’t finish. Try again.');

  const token = rid(32);
  await sb('/rest/v1/sessions', { method: 'POST', headers: { ...json, Prefer: 'return=minimal' },
    body: JSON.stringify({ token_hash: sha(token), user_id: u.id, email: u.email || email, expires_at: new Date(Date.now() + SESSION_DAYS * 864e5).toISOString() }) });
  setSession(res, token);

  // Bring this browser's earlier activity into the account: "I learnt this" marks, and reels or games made here.
  const key = 'u' + u.id.replace(/-/g, '');
  try {
    const marks = await sb(`/rest/v1/learnt?select=reel_id,created_at&anon=eq.${me}&limit=2000`).then(r => r.json());
    if (marks.length) {
      await sb('/rest/v1/learnt', { method: 'POST', headers: { ...json, Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(marks.map(m => ({ reel_id: m.reel_id, anon: key, created_at: m.created_at }))) }, [409]);
      await sb(`/rest/v1/learnt?anon=eq.${me}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
    await sb(`/rest/v1/reels?anon=eq.${me}&user_id=is.null`, { method: 'PATCH', headers: { ...json, Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: u.id }) });
    await sb(`/rest/v1/games?anon=eq.${me}&user_id=is.null`, { method: 'PATCH', headers: { ...json, Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: u.id }) });
  } catch (e) { console.error('merge', e.message); }

  const p = await sb(`/rest/v1/profiles?select=handle&id=eq.${u.id}`).then(r => r.json());
  send(res, 200, { user: { email: u.email || email, handle: (p[0] && p[0].handle) || null } });
});
