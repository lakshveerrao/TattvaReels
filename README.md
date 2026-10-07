# Tattva Reels

Short reels that teach the eight tattvas of the Dakṣiṇāmūrti Aṣṭakam (verse 1 is live). Watch, sing the verse with live pitch scoring, and share what you learnt.

## Go live on Vercel

The code lives in GitHub (lakshveerrao/TattvaReels). Connect it once and every push deploys by itself.

1. Go to **vercel.com/new**, import **TattvaReels**, and set the project name to **tattvareels**.
2. Before you click Deploy, open **Environment Variables** and add `ELEVENLABS_API_KEY` with your ElevenLabs key. Then click **Deploy**.

That's all. There's no database: reels, voice takes, learnings and the leaderboard are saved on each person's device.

The site is at **https://tattvareels.vercel.app** if that name is free; otherwise add it under Settings → Domains. Optional: `ELEVENLABS_VOICE_ID` to choose a different voice.

**Sign-in is simulated:** it asks for an email and shows a sign-in link, but nothing is sent. The name is kept on that device.

## What's in here
- `index.html` the app. `audio/` the approved tune (tune B, Revati) on 12 instruments plus tanpura, tabla, mridangam. `vendor/three.min.js` for the verse 1 film.
- `api/tts.js` the only server function: ElevenLabs recitation of verse 1, cached at Vercel's edge.

## Good to know
- Watching, singing and "I learnt this" need no account. Sharing needs a (simulated) sign-in.
- The singing score is calculated in the browser, so a determined person could fake it.
- Everything is per device: other people don't see your reels, and clearing the browser's data removes them. Recorded voices up to about 1 minute are kept with the reel.
- The tune is a draft composed on the verse's metre, not a traditional chant; the instruments are synthesised.
