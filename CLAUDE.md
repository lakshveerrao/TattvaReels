# Tattva Reels: handoff for Claude Code

Read this first. It is the full context for resuming work on this repo.

## What this is
A Reels-style web app (simple, like Instagram Reels) that teaches the 8 tattvas of the **Dakṣiṇāmūrti Aṣṭakam**, one verse per tattva. Only **verse 1, "The mirror city"**, is built so far. Owner: Laksh (Lakshveer Rao). It should look divine/Vedic, with world-class motion graphics.

- Live: https://tattvareels.vercel.app (Vercel project `tattvareels`, team "Venkat's projects")
- Repo: github.com/lakshveerrao/TattvaReels, branch `main`. Every push auto-deploys on Vercel.
- Database: Supabase project **TattvaReels**, `https://uodkcmhoszjlgxowkucw.supabase.co`

## How Laksh likes to work
- Suggest first and discuss before big changes; build when he says so.
- Check work hard before calling it done: test it, look at it (screenshots, frame by frame), fix what's wrong.
- He explains in short, informal messages. Keep replies short and plain.

## Layout
```
index.html        BUILT file, served by Vercel. Never edit by hand; edit src/ and run build.py
build.py          python3 build.py  → concatenates src/ into index.html
src/
  body.html       markup (views: feed, top/leaderboard, create, review, sing; sheet; toast)
  style.css       all styles
  app.js          main app: feed, Create, Review, sheets, simulated sign-in, API calls, local fallback
  sing.js         audio loading (/audio/*.m4a via Web Audio), Sing mode (live pitch scoring), file check
  film.js         Three.js "Tattva film" for verse 1 (hold-to-awaken fast-forward)
  engines.js      2D particle visual engines (Mirror city, Splat bloom, Sound sand, Flow rivers, Embers, ...)
  analysis.js     YIN pitch tracking and scoring helpers
  tune1.js        const TUNE1 = verse-1 tune B notes
api/              Vercel Node serverless functions (ESM)
  _db.js          Supabase REST helpers (server-only secret key), anon cookie, validation
  reels.js        GET list (with learnt counts + "mine") / POST share (12 per hour per browser)
  learn.js        POST "I learnt this" toggle, one per browser (tr_a cookie)
  take.js         GET a reel's recorded voice from the private Storage bucket "takes"
  tts.js          ElevenLabs recitation of verse 1, cached at the edge
supabase/setup.sql  tables reels, learnt; view reel_feed; RLS on; bucket takes (ALREADY RUN on 2026-10-07)
audio/            15 pre-rendered m4a: 12 instruments + drone_tanpura, rhythm_tabla, rhythm_mridangam
vendor/three.min.js  Three.js r128
tunes/            tune library for all 8 verses (JSON + MIDI), specs and scripts (audio renders not in git)
```

## Key decisions (agreed with Laksh)
- **Sign-in is simulated.** Asks for an email; no email is sent; the part before @ becomes the handle (`tr-user` in localStorage). No Resend, no real auth.
- **Real shared database = Supabase.** Only the server functions talk to it, using `SUPABASE_SECRET_KEY`. RLS is on with no policies, so the publishable key can do nothing and the browser never needs it.
- If the DB env vars are missing, `/api/reels` returns 501 and the client falls back to device-only localStorage (`tr-reels`, `tr-learnt`, `tr-take-<id>`).
- **Tune B (Revati)** is the approved tune: Sa = 196 Hz, 150 BPM, śārdūlavikrīḍita metre (guru = 2 beats, laghu = 1, pause after syllable 12), 76 notes per verse. The instruments are pre-rendered, not synthesised live.
- **Sing mode:** Yousician-style live scoring. YIN pitch, beat-locked note judging (±50 cents, a note is hit at ≥50% of frames, octave folding, latency search −0.05 to +0.45 s), "Any key" mode finds the key by vote, pass mark 80. Full spec in `tunes/MATCHING_SPEC.md`; Python reference in `tunes/tune_check.py`.
- All tests and demo content were deleted on purpose. Don't add demo reels or sample data.

## Secrets: never commit
- Vercel env vars (Production), all set: `ELEVENLABS_API_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`. Optional: `ELEVENLABS_VOICE_ID`.
- Never put keys in code, docs, commits or chat output. Laksh pastes secret values into Vercel himself.

## Status (2026-10-07)
- Done: verse 1 app, 12 instruments, Sing mode, Supabase backend (setup SQL run), all env vars set. Vercel is connected to lakshveerrao/TattvaReels (it used to deploy an old copy from captvenkat/tattvareels; that link was removed).
- Verified live: `/api/reels` reads from Supabase (empty feed), `/api/tts` returns audio, no console errors.
- Next: Laksh shares the first real reel; then check that a second browser sees it, the learnt counts, and a recorded voice.
- Later: verses 2–8 (tunes already composed in `tunes/verse-N.B.json`; each needs its film/visuals, meaning text and audio renders via `tunes/render_all.py`).

## Testing locally
- Static check: `python3 -m http.server` in the repo root (the API won't work).
- Full check: run the api/*.js handlers in a small Node server with `SUPABASE_URL`/`SUPABASE_SECRET_KEY` pointed at a mock or real project, then drive it with Playwright (two browser contexts = two people). Check the console for errors at phone (390×844) and desktop sizes.
- Gotcha: `pkill -f <pattern>` can kill its own shell; kill by PID instead.
