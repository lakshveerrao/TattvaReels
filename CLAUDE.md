# Hey Tattva (repo: TattvaReels): handoff for Claude Code

Read this first. It is the full context for resuming work on this repo.

## What this is
The app is called **Hey Tattva** (renamed from Tattva Reels on 2026-10-08). A Reels-style web app (simple, like Instagram Reels) that teaches the 8 tattvas of the **Dakṣiṇāmūrti Aṣṭakam**, one verse per tattva. **All 8 are built**: 1 The mirror city, 2 The seed, 3 That you are, 4 The lamp in the pot, 5 Not the body, 6 The eclipse, 7 The unchanging I, 8 The dream of roles. Owner: Laksh (Lakshveer Rao). It should look divine/Vedic, with world-class motion graphics.

- Live: https://heytattva.vercel.app (renamed 2026-10-08; old tattvareels.vercel.app) (Vercel project `tattvareels`, team "Venkat's projects")
- Repo: github.com/lakshveerrao/TattvaReels, branch `main`. Every push auto-deploys on Vercel.
- Database: Supabase project **TattvaReels**, `https://uodkcmhoszjlgxowkucw.supabase.co`

## How Laksh likes to work
- Suggest first and discuss before big changes; build when he says so.
- Check work hard before calling it done: test it, look at it (screenshots, frame by frame), fix what's wrong.
- He explains in short, informal messages. Keep replies short and plain.

## Look and languages (2026-10-08)
- **Modern Vedic design:** night blue `--night #15123A`, kumkum `--kumkum #C4262E`, haldi gold `--gold #F4B73A`, chandan `--chandan #F2E3C6`; fonts Eczar (display), Mukta (UI), Tiro Devanagari Sanskrit (verses), Noto Telugu/Kannada as fallbacks. Logo = slowly turning Sri Yantra (`src/vedic.js` `yantra()`). Each tattva has a symbol (`tsym(n)`): 1 mirror, 2 seed, 3 ॐ, 4 diya, 5 not-the-body figure, 6 eclipse, 7 thread with beads, 8 moon. "I learnt" = diya that lights; Share = conch; Games icon = chakra; + = red bindu. Reel text sits on a solid panel. Game cards use real game pictures (`img/g_*.jpg`). Me page: tattva medallions + 108-bead learning mala + language row. Mockups: see the flow image shared on 2026-10-08.
- **Languages:** English, Telugu, Kannada, Hindi (`src/i18n.js`). Picker on first open (full screen) and in Me → Language; changing reloads the page. `TL(n)` = tattva in the chosen language: verse in that script (Devanagari→Telugu/Kannada by code-point offset; Roman IAST for English) + translated meaning/teaching/keep/words (TI18N, drafted by AI on 2026-10-08, needs a native review). App text stays English in code; a MutationObserver translator (`startTranslator`) swaps any text node / placeholder / aria-label whose whole text is in `UI18N[lang]` (plus a few patterns like 'Tattva N'); user content opts out with `data-notr`. New strings: add the English key to UI18N for te/kn/hi, or use `LX('...')` with `{n}` placeholders. Singing and letter games keep Sanskrit sounds; films still have English subtitles burned into the canvas.

## Layout
Phones: one tall column with a bottom tab bar. Screens ≥ 900 px wide (laptops): left menu, the reel in a tall column with the shloka/meaning panel beside it, games as a grid, full-screen flows centred, sheets as dialogs (all in the `@media (min-width:900px)` block at the end of style.css).

```
index.html        BUILT file, served by Vercel. Never edit by hand; edit src/ and run build.py
build.py          python3 build.py  → concatenates src/ into index.html
src/
  body.html       markup (views: feed, top/leaderboard, create, review, sing; sheet; toast)
  style.css       all styles
  app.js          main app: feed (+ laptop side panel), Create, Review, sheets, email-code sign-in, Me page, API calls, local fallback
  sing.js         audio loading (/audio/*.m4a via Web Audio), Sing mode (live pitch scoring), file check
  film.js         Three.js "Tattva film" for verse 1 (hold-to-awaken fast-forward)
  engines.js      2D particle visual engines (Mirror city, Splat bloom, Sound sand, Flow rivers, Embers, ...)
  analysis.js     YIN pitch tracking and scoring helpers
  tunes.js        const TUNES = tune B notes for verses 1–8 (generated from tunes/verse-N.B.json)
  games.js        Games tab: 3 style cards (pick a tattva 1–8 on each) + community games; narration (shloka, then meaning) → 3-2-1 → game (recitation continues line by line) → result; solo or live
  arcade/         00_core.js voxel game engine (ortho or perspective camera, HUD, word panel, verse captions, tools bar, letter tiles, sfx, seeded rng);
                  00_words.js IAST→Devanagari + akṣara split + each tattva's words; 10_stick.js Stickman Quest (75 s), 20_letters.js Letter Builder (60 s),
                  30_build.js Block Builder (90 s), 40_chakra.js Chakra Launch (60 s). ARCADE.stick / .letters / .build / .chakra, each takes ctx.tattva.
                  Core also has ctx.hero() (brahmachari: shikha, vibhuti tripundra + kumkum dot, sacred thread, angavastram, dhoti) and ctx.chakraBg() (spinning Sudarshana chakra backdrop)
  i18n.js         LANGS, TI18N (tattva translations), UI18N (app text), LX(), TL(n), setLang, screen translator
  vedic.js        TSYM (8 tattva symbols), Sri Yantra SVG, tsym(n), yantra()
  tattvas.js      const TATTVAS = per-verse text (dev/iast/en), teaching, keep points, word glossary
  films/          00_kit.js shared film toolkit (one WebGL renderer, morphing particles, line art, labels);
                  02_seed.js … 08_dream.js one 3D film per tattva (film 1 is film.js). FILMS[n] registry.
api/              Vercel Node serverless functions (ESM)
  _db.js          Supabase REST helpers (server-only secret key), anon cookie, validation
  reels.js        GET list (with learnt counts + "mine") / POST share (12 per hour per browser)
  learn.js        POST "I learnt this" toggle, one per browser (tr_a cookie)
  take.js         GET a reel's recorded voice from the private Storage bucket "takes"
  auth.js         POST {email} send code / {email,code} sign in / {logout}
  me.js           GET me + scores / POST {handle} / POST {score}
  games.js        GET list / ?id= one, POST create (10 per hour per browser), POST {played:id} counts a play
  tts.js          ElevenLabs: /api/tts?v=1..8 recites the verse, &m=1 speaks its meaning; cached at the edge
  music.js        ElevenLabs Music rock track per tattva (stored once in Supabase); &fmt=pcm = 16 kHz WAV for the devices
device/            Hey Tattva for the Waveshare ESP32-S3-Touch-AMOLED-1.8 (see device/README.md): HeyTattva/ Arduino sketch
                  (ui.h/gfx.h portable screens, net.h Wi-Fi + captive portal, audio.h ES8311, sing.h YIN scoring, assets.h GENERATED),
                  tools/gen.mjs + pack.py render all text with the site fonts → 4-bit masks; sim/sim.cpp PC simulator + touch/scorer tests
supabase/setup.sql  tables reels, learnt; view reel_feed; RLS on; bucket takes (ALREADY RUN on 2026-10-07)
supabase/accounts.sql  (ALREADY RUN 2026-10-08) profiles, sessions, scores, user_id on reels/games, session_view, record_score()
supabase/games.sql  table games + game_played() (ALREADY RUN on 2026-10-08); games_arcade.sql allows type 'arcade' (ALREADY RUN)
audio/            verse 1: 12 instruments + shared drone_tanpura, rhythm_tabla, rhythm_mridangam; audio/vN/ = 12 instruments for verse N (loaded on demand)
vendor/three.min.js  Three.js r128; vendor/supabase.min.js supabase-js 2.117 (loaded only when a live game starts)
tunes/            tune library for all 8 verses (JSON + MIDI), specs and scripts (audio renders not in git)
```

## Key decisions (agreed with Laksh)
- **Sign-in is SIMULATED for now (Laksh, 2026-10-08 16:20):** email → name, no email sent. `POST /api/auth {email, simulate:true}` finds or creates the Supabase Auth user with the Admin API (`/auth/v1/admin/users`, falling back to `/auth/v1/admin/generate_link` for existing users) and starts the normal session. The real email-link flow below is still in the code (linkSignin, `POST {email}` / `{access_token}`) for when a mail service is added.
- **Real sign-in (built 2026-10-08, parked): email link (code optional).** `api/auth.js` asks Supabase Auth to email a sign-in link (`/auth/v1/otp?redirect_to=site`). The default (free) mailer's template only has a link and can't be edited without custom SMTP. The link returns to the site with `#access_token=…`; the client posts it to `/api/auth`, which checks it via `/auth/v1/user`. A waiting tab polls `/api/me`, so a link opened in the same browser signs it in too. If a custom mailer's template shows `{{ .Token }}`, the "Got a code instead?" box verifies via `/auth/v1/verify`. Supabase Auth Site URL is set to https://tattvareels.vercel.app (TODO: change to https://heytattva.vercel.app before the real email-link sign-in is used). Then the server issues its own random session token in an HttpOnly cookie `tr_s` (only its sha256 is stored in `public.sessions`, 90 days). First sign-in asks for a handle (`profiles.handle`, 3–20 a-z0-9_.). On sign-in the browser's anon "I learnt" marks, reels and games move to the account. Signed-in learnt marks use key `u<uuid without dashes>` in `learnt.anon`. Sharing a reel or publishing a game needs a signed-in user with a handle. `api/me.js`: GET me + best scores, POST {handle} rename, POST {score:{game,s}} keeps best (rpc `record_score`). Supabase's built-in mailer only reaches the Supabase team's addresses (~2/hour) — Laksh chose "team only for now"; add custom SMTP (e.g. Brevo) in Supabase to open it to everyone.
- **Real shared database = Supabase.** Only the server functions talk to it, using `SUPABASE_SECRET_KEY`. RLS is on with no policies, so the publishable key can do nothing and the browser never needs it.
- If the DB env vars are missing, `/api/reels` returns 501 and the client falls back to device-only localStorage (`tr-reels`, `tr-learnt`, `tr-take-<id>`).
- **Tune B (Revati)** is the approved tune: Sa = 196 Hz, 150 BPM, śārdūlavikrīḍita metre (guru = 2 beats, laghu = 1, pause after syllable 12), 76 notes per verse. The instruments are pre-rendered, not synthesised live.
- **Sing mode:** Yousician-style live scoring. YIN pitch, beat-locked note judging (±50 cents, a note is hit at ≥50% of frames, octave folding, latency search −0.05 to +0.45 s), "Any key" mode finds the key by vote, pass mark 80. Full spec in `tunes/MATCHING_SPEC.md`; Python reference in `tunes/tune_check.py`.
- A reel's tattva lives in `style.Tattva` (1–8), stored in the reels.style jsonb; no extra DB column.
- Films: each is a pure function of story progress pf (0..1) and time; labels show a Sanskrit word + English. Check them frame by frame (render a grid of pf values headless) before shipping.
- **Games (agreed 2026-10-08, v3; Chakra Launch added as 4th style, id letter `c`):** **Chakra Launch**: drag to aim, release to throw the chakra; it cuts through the walls of māyā (blocks), bounces off the sides, returns; hit the akṣaras of each word in order (wrong letter −5); māyā grows back. Every game has a spinning chakra backdrop and the hero is a brahmachari. Originally three game STYLES, each playable on any of the 8 tattvas: **Stickman Quest** (side-scroller, tap to jump/double jump, collect the akṣaras of each word in order, falling only costs points), **Letter Builder** (tap floating letter blocks in order to build words; key word gold = double; ॐ block fills a letter; finished words stack into a wall), **Block Builder** (Minecraft-style creative: unlimited blocks, no hunger; faint goal outline per tattva; tap outline to place, Build/Erase + palette, drag to orbit; score = % of shape + seconds left if finished). A game = style + tattva + level (`settings.style` in 'stick'|'letters'|'build'). Official ids `o[slbc][1-8]`; community ids `g…`. Each opens with the AI voice reciting the shloka, then its meaning (skippable); during play the recitation continues one line at a time (a quarter of the TTS audio) with a caption, and Block Builder plays the meaning at the end while the camera orbits. The game clock follows real time (slow phones substep). The old 8 arcade games (v2) and the quiz/puzzle (v1) were dropped on purpose. In live games everyone plays the same seed at the same moment; scores stream to the host, top score wins. Live play uses Supabase Realtime broadcast + presence on channel `tr-room-<CODE>` with the publishable key (public by design, hardcoded in games.js). The host's phone is the referee (scores, timer, phases) and broadcasts `state`; players send `hello` and `sc` (score, fin). No game state is stored server-side. Hosts also announce their room on the public presence channel `tr-room-LOBBY`, so the Games feed shows "Join <host>'s game" on the card and anyone can join without typing the code. For local multi-phone tests add `?live=ws://localhost:PORT` to use a WebSocket relay instead.
- All tests and demo content were deleted on purpose. Don't add demo reels or sample data.

- **Device (2026-10-08; rebuilt minimal the same day, Laksh: "minimalist with large buttons, easy to use"):** Home (Learn / Sing / Settings) → 8 tiles → tattva (Verse·Meaning·Idea tabs, Listen, Sing) → Sing = match the note (big syllable, ring, Higher/Lower/In tune meter). One-click installer at /flash (ESP Web Tools 10.2.1, flash/heytattva.bin = trimmed merged image; rebuild it after firmware changes). Waveshare ESP32-S3-Touch-AMOLED-1.8, V1 (SH8601+FT3168) or V2 (CO5300+CST820) auto-detected by touch I2C address. Wi-Fi: saved creds in Preferences; on failure the open hotspot HeyTattva-Setup with a setup page at 192.168.4.1, save → restart; after a drop it retries quietly; BOOT hold 5 s forgets Wi-Fi. Voice from /api/tts?...&fmt=pcm (16 kHz WAV) cached in FFat. Compiled with arduino-cli (esp32 core 3.3.2, GFX Library 1.6.9, board waveshare_esp32_s3_touch_amoled_18, PSRAM=enabled); not yet tried on the real board. Landing page (src/intro.js, trailer.js): landing every visit → language (unless remembered) → tour every visit.

- **Cheeko Gotchi (2026-10-09; v2 same day, Laksh: "five reels, five games and rock"):** `device/cgotchi/` (see its README). Board from github.com/ALTIO-AI-PRIVATE-LIMITED/cheeko-gotchi SKILL.md (ESP32-S3, 240x296 ST7789 SPI, CST810, ES8311, LIS2DH12). Tattvas 1, 2, 4, 6, 8 (Laksh picked them): reels (own animation each, 30 s ADPCM sitar/tanpura/tabla bed, singer voice), games Mirror Letters, Grow the Seed, Lamp Tilt, Eclipse, Dream Cards, and a Rock stage (band from `/api/music?v=N&fmt=pcm`, which decodes the stored MP3 with npm mpg123-decoder to 16 kHz WAV; voice through an on-device rock chain). Voice/band cached in FFat as ADPCM (/cvN.adp, /rbN.adp). FQBN esp32:esp32:XIAO_ESP32S3:PSRAM=opi,PartitionScheme=tinyuf2_noota. Installer /flash/cgotchi (no erase, keeps TinyUF2). Not yet tried on the real board.

- **Singer voice (2026-10-09):** the user's own Agara rock recording (he is the singer and asked for it). Vocals separated with Spleeter, talk/shouts cut; `api/_voice/singer.mp3` (bundled with api/tts.js via vercel.json includeFiles, not public) → ElevenLabs instant clone "Hey Tattva singer" (first clone k8ULzvpLbbblVNLOmquY; now Laksh's own voice vLzh1xHQkABgLETkKewE, requests carry &sv=2 so old cached audio is skipped), created on first use and found by name after. `/api/tts?...&voice=singer`; Create → Recite offers "AI voice" or "Singer voice" per reel (style.Recitation, allowed in api/_db.js REC; EL bufs keyed s+n); Me → Voice (localStorage tr-voice) now only steers game narration; device uses it by default (cache /sv,/sm); `audio/singer_guitar.mp3` = 30 s of his guitar used as a bed in the Agara app. `.github/workflows/voice-check.yml` verifies after deploys and reports a commit status "voice-check" (Actions logs aren't readable through the proxy; statuses are).

- **Rock (2026-10-09, Laksh: "leave agara and make it in heytattva"):** `src/rock.js`, a Rock tab in the main menu (phone: Reels · Games · + · Rock · Me; laptop: after Games) + a 🎸 button on every reel rail + laptop side panel → full-screen rock stage (black/fire theme, Bebas Neue) per tattva: singer voice `/api/tts?...&voice=singer&sv=2&rock=1` through a Web Audio rock vocal chain (HP, presence, grit, compression, slapback, reverb) over `/api/music?v=N` (ElevenLabs Music hard-rock instrumental, stored once in the Supabase bucket takes/music/rock-vN.mp3) that ducks under the voice; fallback = his guitar loop + synth beat. Verse/Meaning toggle, prev/next, Voice/Band faders, line highlight. The Agara app itself was a one-off local file (not in the repo).

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
