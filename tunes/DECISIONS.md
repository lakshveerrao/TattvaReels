# Decisions
- No traditional notation found for the Dakṣiṇāmūrti Aṣṭakam; tunes composed on the śārdūlavikrīḍita grid (guru 2 beats, laghu 1, yati after syllable 12, final syllable 3 beats). Labelled DRAFT / NOT TRADITIONAL.
- User approved candidate B (Revati, S R1 M1 P N2), Sa = 196 Hz, 150 BPM, 2026-10-07.
- Verse text from sanskritdocuments.org; all 32 lines verified to scan as śārdūlavikrīḍita by script (meter.py).
- Instrument files are melody-only so the app can layer them; drone and rhythm are separate stems.
- Bansuri, violin, santoor, nadaswaram play +1 octave (same notes) to stay in their real range; verification accounts for it.
- WAV kept for verse 1 only to save space; every WAV regenerates byte-identically with `render_all.py --wav-all`. OGG and M4A shipped for all.
- Ornaments (meend slides, vibrato, santoor tremolo) never move a note's start or its target pitch.
- Seamless-loop versions not made yet: nothing in the app loops the tune.
