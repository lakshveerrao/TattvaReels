# Tattva Reels

Short reels that teach the eight tattvas of the Dakṣiṇāmūrti Aṣṭakam (verse 1 is live). Watch, sing the verse with live pitch scoring, and share what you learnt.

## Go live on Vercel

The code lives in GitHub (lakshveerrao/TattvaReels). Connect it once and every push deploys by itself.

1. Go to **vercel.com/new**, import **TattvaReels**, and set the project name to **tattvareels**.
2. Before you click Deploy, open **Environment Variables** and add `ELEVENLABS_API_KEY` with your ElevenLabs key. Then click **Deploy**.
3. In the project, open **Storage** → **Create Database** → **Upstash for Redis** (free) and connect it. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
4. Open **Deployments** and **Redeploy** the latest one so it picks up the database.

The site is at **https://tattvareels.vercel.app** if that name is free; otherwise add it under Settings → Domains.

Optional: `ELEVENLABS_VOICE_ID` to choose a different voice.

**Sign-in is simulated:** it asks for an email and shows a sign-in link, but nothing is sent and nothing is stored on the server. The name is kept on that device, so anyone can share under any name.

If the database isn't connected yet, the app still works: reels and learnings are saved on each person's device until you add Upstash.

## What's in here
- `index.html` the app. `audio/` the approved tune (tune B, Revati) on 12 instruments plus tanpura, tabla, mridangam. `vendor/three.min.js` for the verse 1 film.
- `api/` serverless functions: `reels` (list and share), `learn` ("I learnt this"), `take` (a reel's recorded voice), `tts` (ElevenLabs, generated once then cached).

## Good to know
- Watching, singing and "I learnt this" need no account. Sharing needs a (simulated) sign-in.
- The singing score is calculated in the browser, so a determined person could fake it.
- Recorded voices up to about 1 minute are stored with the reel (in Redis). Longer recordings share without the voice.
- The tune is a draft composed on the verse's metre, not a traditional chant; the instruments are synthesised.
