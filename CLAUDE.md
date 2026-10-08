# Tattva Reels: handoff for Claude Code

Read this first. It is the full context for resuming work on this repo.

## What this is
A Reels-style web app (simple, like Instagram Reels) that teaches the 8 tattvas of the **Dakṣiṇāmūrti Aṣṭakam**, one verse per tattva. **All 8 are built**: 1 The mirror city, 2 The seed, 3 That you are, 4 The lamp in the pot, 5 Not the body, 6 The eclipse, 7 The unchanging I, 8 The dream of roles. Owner: Laksh (Lakshveer Rao). It should look divine/Vedic, with world-class motion graphics.

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
  tunes.js        const TUNES = tune B notes for verses 1–8 (generated from tunes/verse-N.B.json)
  games.js        Games tab: make a game (quiz / shloka puzzle race), play solo or host live with a 6-letter join code
  tattvas.js      const TATTVAS = per-verse text (dev/iast/en), teaching, keep points, word glossary
  films/          00_kit.js shared film toolkit (one WebGL renderer, morphing particles, line art, labels);
                  02_seed.js … 08_dream.js one 3D film per tattva (film 1 is film.js). FILMS[n] registry.
api/              Vercel Node serverless functions (ESM)
  _db.js          Supabase REST helpers (server-only secret key), anon cookie, validation
  reels.js        GET list (with learnt counts + "mine") / POST share (12 per hour per browser)
  learn.js        POST "I learnt this" toggle, one per browser (tr_a cookie)
  take.js         GET a reel's recorded voice from the private Storage bucket "takes"
  games.js        GET list / ?id= one, POST create (10 per hour per browser), POST {played:id} counts a play
  tts.js          ElevenLabs recitation, /api/tts?v=1..8, cached at the edge
supabase/setup.sql  tables reels, learnt; view reel_feed; RLS on; bucket takes (ALREADY RUN on 2026-10-07)
supabase/games.sql  table games + game_played() (ALREADY RUN on 2026-10-08)
audio/            verse 1: 12 instruments + shared drone_tanpura, rhythm_tabla, rhythm_mridangam; audio/vN/ = 12 instruments for verse N (loaded on demand)
vendor/three.min.js  Three.js r128; vendor/supabase.min.js supabase-js 2.117 (loaded only when a live game starts)
tunes/            tune library for all 8 verses (JSON + MIDI), specs and scripts (audio renders not in git)
```

## Key decisions (agreed with Laksh)
- **Sign-in is simulated.** Asks for an email; no email is sent; the part before @ becomes the handle (`tr-user` in localStorage). No Resend, no real auth.
- **Real shared database = Supabase.** Only the server functions talk to it, using `SUPABASE_SECRET_KEY`. RLS is on with no policies, so the publishable key can do nothing and the browser never needs it.
- If the DB env vars are missing, `/api/reels` returns 501 and the client falls back to device-only localStorage (`tr-reels`, `tr-learnt`, `tr-take-<id>`).
- **Tune B (Revati)** is the approved tune: Sa = 196 Hz, 150 BPM, śārdūlavikrīḍita metre (guru = 2 beats, laghu = 1, pause after syllable 12), 76 notes per verse. The instruments are pre-rendered, not synthesised live.
- **Sing mode:** Yousician-style live scoring. YIN pitch, beat-locked note judging (±50 cents, a note is hit at ≥50% of frames, octave folding, latency search −0.05 to +0.45 s), "Any key" mode finds the key by vote, pass mark 80. Full spec in `tunes/MATCHING_SPEC.md`; Python reference in `tunes/tune_check.py`.
- A reel's tattva lives in `style.Tattva` (1–8), stored in the reels.style jsonb; no extra DB column.
- Films: each is a pure function of story progress pf (0..1) and time; labels show a Sanskrit word + English. Check them frame by frame (render a grid of pf values headless) before shipping.
- **Games:** content is generated from the verse with the game's seed, so every phone builds the same questions/tiles. Live play uses Supabase Realtime broadcast + presence on channel `tr-room-<CODE>` with the publishable key (public by design, hardcoded in games.js). The host's phone is the referee (scores, timer, phases) and broadcasts `state`; players send `hello`, `ans`, `prog`. No game state is stored server-side. For local multi-phone tests add `?live=ws://localhost:PORT` to use a WebSocket relay instead.
- All tests and demo content were deleted on purpose. Don't add demo reels or sample data.

## Secrets: never commit
- Vercel env vars (Production), all set: `ELEVENLABS_API_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`. Optional: `ELEVENLABS_VOICE_ID`.
- Never put keys in code, docs, commits or chat output. Laksh pastes secret values into Vercel himself.

## Status (2026-10-07)
- Done: all 8 tattvas (verse text checked against the metre data, meanings, 12 instruments per verse, Sing mode per verse, AI voice per verse, a 3D film per tattva), Supabase backend, env vars set, Vercel connected to lakshveerrao/TattvaReels.
- Next ideas: real-device performance check of films on low-end phones; polish individual films with Laksh's feedback.

## Testing locally
- Static check: `python3 -m http.server` in the repo root (the API won't work).
- Full check: run the api/*.js handlers in a small Node server with `SUPABASE_URL`/`SUPABASE_SECRET_KEY` pointed at a mock or real project, then drive it with Playwright (two browser contexts = two people). Check the console for errors at phone (390×844) and desktop sizes.
- Gotcha: `pkill -f <pattern>` can kill its own shell; kill by PID instead.
