# Tattva tune library (verse 1–8, tune B · Revati)

Status: DRAFT, not traditional. Composed on the śārdūlavikrīḍita metre and approved as candidate B.

## What's here
- `verse-N.B.json` canonical tune (raga, tonic 196 Hz, 150 BPM, 76 notes with swara, octave, Hz, start beat, beats, syllable), `verse-N.B.mid`.
- `audio/verse-N/<instrument>.m4a` melody per instrument (12): bansuri, veena, sitar, violin, harmonium, piano, guitar, santoor, sarangi, nadaswaram, harp, cello.
- `audio/verse-N/stems/` tanpura drone, tabla, mridangam.
- `manifest.json` every file with duration, loudness, true peak, checksum, status.
- `tune_report.html` verification results. `MATCHING_SPEC.md` + `tune_check.py` the singing check.
- `render_all.py` regenerates everything byte-identically (`--wav-all` for WAVs). `verify_library.py` re-runs the checks.

## Tested (actually run)
- All 32 verse lines scan as śārdūlavikrīḍita (19 syllables, GGG LLG LGL LLG GGL GGL G).
- 96 melody files: every note within 19.6 cents of target (tolerance 50), every note on pitch within 71 ms of its beat.
- All 120 files at −16.0 LUFS, true peak ≤ −1.57 dBTP; no clicks (verse 1 WAVs); re-render byte-identical.
- tune_check.py on 8 synthetic takes (results in MATCHING_SPEC.md).

## Not proven
- Sound quality: all instruments are synthesised. Sitar, veena, sarangi and nadaswaram are rough; real samples are needed for production.
- Real singers: scoring thresholds were tuned on synthetic voices.
- This zip ships M4A only; OGG and WAV regenerate with render_all.py.
