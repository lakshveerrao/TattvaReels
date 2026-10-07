# Tattva Reels

Short reels that teach the eight tattvas of the Dakṣiṇāmūrti Aṣṭakam (verse 1 is live). Watch, sing the verse with live pitch scoring, and share what you learnt.

## Go live on Vercel

The code lives in GitHub (lakshveerrao/TattvaReels); every push to `main` deploys by itself.

### Database (Supabase)
1. In Supabase, open **SQL Editor → New query**, paste `supabase/setup.sql`, and click **Run**. This creates the `reels` and `learnt` tables and a private `takes` bucket for recorded voices.
2. In Vercel → **tattvareels → Settings → Environment Variables**, add:
   - `SUPABASE_URL`: your project URL (Supabase → Project Settings → Data API), like `https://abcd.supabase.co`
   - `SUPABASE_SECRET_KEY`: your `sb_secret_…` key (Supabase → Project Settings → API Keys). **Never put this in the code.**
   - `ELEVENLABS_API_KEY`: your ElevenLabs key
3. **Deployments → ⋯ → Redeploy** so the new settings take effect.

Only the server functions talk to Supabase, using the secret key. Row level security is on with no policies, so the public (publishable) key can't read or change anything, and the browser never needs it.

If the database settings are missing, the app still works, saving reels on the device only.

Optional: `ELEVENLABS_VOICE_ID` to choose a different voice.

**Sign-in is simulated:** it asks for an email, but none is sent, and the name before the @ becomes the reel's handle.

## What's in here
- `index.html` the app. `audio/` the approved tune (tune B, Revati) on 12 instruments plus tanpura, tabla, mridangam. `vendor/three.min.js` for the verse 1 film.
- `api/`: `reels` (list and share), `learn` ("I learnt this", one per browser), `take` (a reel's recorded voice), and `tts` (ElevenLabs recitation, cached at Vercel's edge). `_db.js` holds the shared Supabase helpers.
- `supabase/setup.sql` creates the tables and the storage bucket.

## Good to know
- Watching, singing and "I learnt this" need no account. Sharing needs a (simulated) sign-in.
- The singing score is calculated in the browser, so a determined person could fake it.
- Reels, learnt counts and the leaderboard are shared by everyone. Recorded voices up to about 1 minute are stored with the reel.
- Sign-in is simulated, so anyone can post under any name. Each browser can share up to 12 reels an hour.
- The tune is a draft composed on the verse's metre, not a traditional chant; the instruments are synthesised.
