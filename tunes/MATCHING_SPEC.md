# Matching spec: "did they sing it correctly?"

Reference implementation: `tune_check.py` (offline). The app's live practice mode uses the same rules in JavaScript.

## What it compares
- **Pitch, relative to the singer's own key.** The singer can use any key and any octave. Pitch is compared as an interval from the singer's Sa (circular, mod 1200 cents), so octave jumps never count as errors.
- **Timing, locked to the beat.** One global tempo (0.6×–1.6×) and start time are fitted to the take, plus a small per-phrase shift (±0.2 s) for natural drift and mic latency. Each note is then judged only inside its own time window (its middle 18–85 %, so slides and attacks don't count against it).

## Steps
1. Pitch track the take: YIN, 10 ms hop, 40 ms window, 70–1000 Hz, voicing threshold 0.2, silence gate −44 dBFS.
2. Find the singer's key: try all 12 semitone offsets with a coarse DTW against the tune, keep the best, then refine by the median residual (cents).
3. Fit the time map: a robust straight-line fit (3 passes, outliers dropped) through the DTW path gives start time and tempo.
4. Per phrase (8 per verse: each line split at the yati), search a shift of −0.2 to +0.2 s that best fits that phrase.
5. Per note: share of voiced frames within ±50 cents of the target (after key offset). A note is **hit** when that share is at least 50 %.
6. Score = 50 % average on-pitch share + 50 % share of notes hit (both weighted by note length). **Pass = 80 or more.**
7. A phrase is flagged when any of its notes is missed.

## Why these thresholds
- **±50 cents** is a quarter tone: the point where a note starts to sound like its neighbour. Natural vibrato (about ±25 cents) stays inside it.
- **Hit at 50 %** lets a note survive a wobbly start or end but not a wrong pitch.
- **Pass 80:** in the tests below every acceptable take scored 99–100 and every take that should fail scored 77 or less. These were synthetic voices; real singers drift more, so expect to tune this after trying it with real people.

## Test results (synthetic takes, verse 1, tune B)
| Take | Score | Notes hit | Result | Flagged phrases |
|---|---|---|---|---|
| Correct | 100 | 76/76 | Pass | none |
| Transposed +3 semitones | 100 | 76/76 | Pass | none |
| Slower (0.8× speed) | 100 | 76/76 | Pass | none |
| One wrong note (#30, a whole tone off) | 99 | 75/76 | Pass, note flagged | line 2, first half |
| Slightly out of tune (±30 ¢) | 99 | 76/76 | Pass | none |
| Wrong rhythm (lengths 2× / 0.5×) | 77 | 56/76 | Fail | all |
| Off-key throughout (60–90 ¢ off) | 52 | 40/76 | Fail | all |
| A different melody | 32 | 26/76 | Fail | all |

## What it cannot judge
- Tone quality, voice timbre, or which instrument is playing.
- Ornament quality (gamaka, meend): only whether the note's centre is right.
- Pronunciation of the Sanskrit.
- Very breathy or whispered singing, or heavy background noise, can break the pitch tracker.
