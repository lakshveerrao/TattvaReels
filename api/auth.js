import { sb, send, wrap, readBody, anon, rid, sha, setSession, clearSession, sessionToken, SESSION_DAYS, HttpError } from './_db.js';

// Email sign-in. POST {email} asks Supabase Auth to email a sign-in link (and a code, if the template shows one).
// The link comes back to the site with an access token in the URL fragment → POST {access_token}. Or POST {email, code}.
// Either starts a session; POST {logout:true} ends it. Supabase Auth's own tokens are not kept: the server issues a random session
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

  if (b.access_token != null) {
    const at = String(b.access_token);
    if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(at) || at.length > 4000) throw new HttpError(400, 'That sign-in link is broken. Ask for a new one.');
    const r = await sb('/auth/v1/user', { headers: { Authorization: 'Bearer ' + at } }, [401, 403]);
    if (!r.ok) throw new HttpError(400, 'That sign-in link has expired. Ask for a new one.');
    return start(res, me, await r.json(), '');
  }

  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, 'Enter an email like you@example.com.');

  // Simulated sign-in (agreed 2026-10-08, until a mail service is added): no email is sent. The account is found or
  // created with the Admin API, and the session starts straight away.
  if (b.simulate) {
    const c = await sb('/auth/v1/admin/users', { method: 'POST', headers: json, body: JSON.stringify({ email, email_confirm: true }) }, [400, 409, 422]);
    let u = c.ok ? await c.json() : null;
    if (!u || !u.id) {
      const g = await sb('/auth/v1/admin/generate_link', { method: 'POST', headers: json, body: JSON.stringify({ type: 'magiclink', email }) });
      const j = await g.json(); u = j.user || j;
    }
    return start(res, me, u, email);
  }

  if (b.code == null) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
    const site = /^tattvareels\.vercel\.app$/.test(host) ? 'https://' + host + '/' : /^localhost:\d+$/.test(host) ? 'http://' + host + '/' : '';
    const r = await sb('/auth/v1/otp' + (site ? '?redirect_to=' + encodeURIComponent(site) : ''), { method: 'POST', headers: json, body: JSON.stringify({ email, create_user: true }) }, [400, 422, 429, 500, 504]);
    if (r.status === 429) throw new HttpError(429, 'Please wait a minute before asking for another email.');
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      const m = String(j.msg || j.message || j.error_description || '');
      console.error('otp', r.status, m);
      if (/not authorized/i.test(m)) throw new HttpError(403, 'Sign-in emails can only go to the team’s addresses for now.');
      throw new HttpError(502, 'Couldn’t send the email. Try again in a minute.');
    }
    return send(res, 200, { sent: true });
  }

  const code = String(b.code).replace(/\D/g, '');
  if (code.length < 6 || code.length > 10) throw new HttpError(400, 'Enter the code from the email.');
  const v = await sb('/auth/v1/verify', { method: 'POST', headers: json, body: JSON.stringify({ type: 'email', email, token: code }) }, [400, 401, 403, 422, 429]);
  if (v.status === 429) throw new HttpError(429, 'Too many tries. Wait a minute and try again.');
  if (!v.ok) throw new HttpError(400, 'That code is wrong or has expired. Check the newest email, or send a new code.');
  return start(res, me, (await v.json()).user || {}, email);
});

async function start(res, me, u, email) {
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
}
