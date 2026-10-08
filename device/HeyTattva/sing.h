// Sing mode on the device: YIN pitch tracking and beat-locked note scoring, following the website's rules
// (tunes/MATCHING_SPEC.md): Sa = 196 Hz, a note is hit when at least half of its sung frames are within ±50 cents,
// octaves fold, and "any key" works (the key offset is found by vote). Plain C++ so it can be tested on a PC.
#pragma once
#include <math.h>
#include <stdint.h>
#include <string.h>
#include "assets.h"

#define SING_SR 16000
#define YIN_N 512        // analysis window (32 ms)
#define YIN_HOP 512      // one pitch every 32 ms
#define YIN_TMIN 18      // ~890 Hz
#define YIN_TMAX 230     // ~70 Hz
#define SA_HZ 196.0f

// returns frequency in Hz, or 0 when unvoiced/quiet
static inline float yinPitch(const int16_t *x, float *d) {
  double e = 0; for (int i = 0; i < YIN_N; i++) e += (double)x[i] * x[i];
  if (e / YIN_N < 120.0 * 120.0) return 0;  // too quiet
  int W = YIN_N - YIN_TMAX;
  d[0] = 1; float run = 0; int best = -1;
  for (int t = 1; t <= YIN_TMAX; t++) {
    float s = 0; for (int i = 0; i < W; i++) { float v = (float)x[i] - x[i + t]; s += v * v; }
    run += s; d[t] = run > 0 ? s * t / run : 1;
  }
  for (int t = YIN_TMIN; t < YIN_TMAX; t++) if (d[t] < .15f) { while (t + 1 < YIN_TMAX && d[t + 1] < d[t]) t++; best = t; break; }
  if (best < 0) { float m = 1; for (int t = YIN_TMIN; t < YIN_TMAX; t++) if (d[t] < m) { m = d[t]; best = t; } if (m > .35f) return 0; }
  float a = d[best - 1], b = d[best], c = d[best + 1], den = a - 2 * b + c, sh = fabsf(den) > 1e-9f ? .5f * (a - c) / den : 0;
  return SING_SR / (best + sh);
}
static inline float hzToSemi(float hz) { return 12.f * log2f(hz / SA_HZ); }
static inline float wrap12(float s) { s = fmodf(s, 12.f); if (s > 6) s -= 12; if (s < -6) s += 12; return s; }

#define MAXN 80
#define PERN 48
struct SingScore {
  const Tune *tu = nullptr;
  float spb = .4f;               // seconds per beat
  float lat = .12f;              // mic latency
  int16_t dv[MAXN][PERN];        // per note: sung minus target, cents, wrapped to ±600
  uint8_t cnt[MAXN];             // voiced frames stored
  uint8_t tot[MAXN];             // all frames in the note window
  uint8_t st[MAXN];              // 0 waiting, 1 hit, 2 missed
  uint16_t hist[120];            // key-offset votes, 10-cent bins
  float offset = 0;              // estimated key offset (semitones, -6..6)
  int hits = 0, judged = 0;
  void begin(const Tune *t) { tu = t; spb = 60.f / t->bpm; memset(cnt, 0, sizeof cnt); memset(tot, 0, sizeof tot); memset(st, 0, sizeof st); memset(hist, 0, sizeof hist); offset = 0; hits = judged = 0; }
  float noteT0(int i) const { return tu->notes[i].start / 4.f * spb; }
  float noteT1(int i) const { return (tu->notes[i].start + tu->notes[i].len) / 4.f * spb; }
  float length() const { return tu->total4 / 4.f * spb; }
  int noteAt(float t) const { for (int i = 0; i < tu->n; i++) if (t >= noteT0(i) && t < noteT1(i)) return i; return -1; }
  void updOffset() { int bi = 0; uint32_t bv = 0; for (int b = 0; b < 120; b++) { uint32_t v = 0; for (int k = -2; k <= 2; k++) v += hist[(b + k + 120) % 120]; if (v > bv) { bv = v; bi = b; } } offset = wrap12(bi / 10.f); }
  bool judge(int i) const { int ok = 0, off = (int)lroundf(offset * 100); for (int k = 0; k < cnt[i]; k++) { int d = dv[i][k] - off; while (d > 600) d -= 1200; while (d < -600) d += 1200; if (d >= -50 && d <= 50) ok++; } return tot[i] > 0 && ok * 2 >= tot[i]; }
  // t: seconds since the tune started; semi: sung pitch in semitones above Sa, NAN when unvoiced
  void feed(float t, float semi) {
    float tt = t - lat;
    int i = noteAt(tt);
    if (i >= 0) {
      if (tot[i] < 255) tot[i]++;
      if (!isnan(semi)) { float d = wrap12(semi - tu->notes[i].semi); int c = (int)lroundf(d * 100); if (cnt[i] < PERN) dv[i][cnt[i]++] = c; int b = ((int)lroundf(d * 10) + 120) % 120; hist[b]++; }
    }
    // judge notes whose window has passed
    for (int k = 0; k < tu->n; k++) if (!st[k] && tt > noteT1(k) + .05f) { updOffset(); st[k] = judge(k) ? 1 : 2; judged++; if (st[k] == 1) hits++; }
  }
  // at the end: re-judge everything with the final key offset
  int finish() { updOffset(); hits = 0; for (int k = 0; k < tu->n; k++) { st[k] = judge(k) ? 1 : 2; if (st[k] == 1) hits++; } judged = tu->n; return score(); }
  int score() const { return tu && tu->n ? (int)lroundf(100.f * hits / tu->n) : 0; }
};
