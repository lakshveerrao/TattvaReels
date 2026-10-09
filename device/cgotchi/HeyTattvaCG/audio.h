// Audio for the Cheeko Gotchi: ES8311 codec + NS4150B amp, 16 kHz. One mixer task on core 0 mixes
//  - the music bed of the reel's tattva (sitar, tanpura, tabla; IMA-ADPCM in flash, loops),
//  - the singer's recitation (downloaded once from heytattva.vercel.app as 16 kHz WAV, then kept in FFat),
//    with the bed ducking under it,
//  - short square-wave sound effects for the games.
#pragma once
#include <Arduino.h>
#include <ESP_I2S.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <FFat.h>
#include "es8311.h"
#include "beds.h"

#define PIN_PA_CTRL 4
#define PIN_I2S_MCLK 5
#define PIN_I2S_DOUT 6
#define PIN_I2S_BCLK 15
#define PIN_I2S_LRCK 16
#define AU_SR 16000
#define SITE "https://heytattva.vercel.app"

namespace Audio {
static I2SClass i2s;
static es8311_handle_t codec = nullptr;
static bool ffatOk = false;
// ---- state shared with the UI ----
static volatile int voice = 0;          // ::VoiceSt
static volatile bool bedOn = false, paused = false;
static volatile int bedK = 0; static volatile float bedGain = .8f;
static volatile uint32_t bedPos = 0;    // samples played of the current bed loop
static volatile int vol = 6;            // 0..10
static int16_t *pcm = nullptr; static volatile size_t pcmLen = 0, pcmPos = 0;
static volatile uint32_t voiceAt = 0;   // bed sample at which the voice starts
static volatile int reelN = 0, want = 0;
static TaskHandle_t task = nullptr, fetchTask = nullptr;
static volatile bool fetchBusy = false;
// ---- ADPCM ----
static const int16_t STEP[89] = {7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767};
static const int8_t IDX[16] = {-1,-1,-1,-1,2,4,6,8,-1,-1,-1,-1,2,4,6,8};
static int pred = 0, ix = 0;
static inline int16_t bedSample() {
  const uint8_t *b = bedK ? BED1 : BED0; uint32_t n = bedK ? BED1_N : BED0_N;
  if (bedPos >= n) { bedPos = 0; pred = 0; ix = 0; }
  uint8_t code = (b[bedPos >> 1] >> ((bedPos & 1) * 4)) & 15; bedPos++;
  int st = STEP[ix], diff = st >> 3;
  if (code & 4) diff += st; if (code & 2) diff += st >> 1; if (code & 1) diff += st >> 2;
  pred += (code & 8) ? -diff : diff; if (pred > 32767) pred = 32767; if (pred < -32768) pred = -32768;
  ix += IDX[code]; if (ix < 0) ix = 0; if (ix > 88) ix = 88;
  return (int16_t)pred;
}
// ---- sound effects: up to three notes in a row ----
struct Note { float f; int len; };
static Note sfxQ[4]; static volatile int sfxN = 0, sfxI = 0; static int sfxPos = 0; static float sfxPh = 0;
static void sfx(int kind) {
  Note n[4]; int k = 0;
  if (kind == 1) { n[k++] = {1320, 500}; }                                         // tap
  else if (kind == 2) { n[k++] = {988, 900}; n[k++] = {1480, 1400}; }              // right letter
  else if (kind == 3) { n[k++] = {196, 2600}; }                                    // wrong letter
  else if (kind == 4) { n[k++] = {784, 1300}; n[k++] = {988, 1300}; n[k++] = {1568, 3000}; }  // word done
  else { n[k++] = {523, 2400}; n[k++] = {659, 2400}; n[k++] = {784, 5200}; }        // time up
  sfxN = 0; for (int i = 0; i < k; i++) sfxQ[i] = n[i]; sfxI = 0; sfxPos = 0; sfxN = k;
}
static inline float sfxSample() {
  if (sfxI >= sfxN) return 0;
  const Note &n = sfxQ[sfxI]; float env = 1.f - (float)sfxPos / n.len * .7f, a = fminf(1, sfxPos / 40.f);
  sfxPh += n.f / AU_SR; if (sfxPh >= 1) sfxPh -= 1;
  float s = (sfxPh < .5f ? 1 : -1) * 3200 * env * a;
  if (++sfxPos >= n.len) { sfxPos = 0; sfxI++; }
  return s;
}
// ---- mixer ----
static void taskFn(void *) {
  static int16_t out[256 * 2]; float duck = 1;
  for (;;) {
    bool any = bedOn || sfxI < sfxN;
    if (!any || paused) { if (paused && bedOn) { memset(out, 0, sizeof out); i2s.write((uint8_t *)out, sizeof out); } else vTaskDelay(6); continue; }
    float g = vol * vol / 100.f * 1.2f;
    for (int i = 0; i < 256; i++) {
      float v = 0, s = 0;
      if (bedOn) {
        uint32_t bp = bedPos; s = bedSample();
        bool talking = voice == 2 && pcm && pcmPos < pcmLen && bp >= voiceAt;
        duck += ((talking ? .32f : 1.f) - duck) * .0006f;
        if (talking) v = pcm[pcmPos++] * 1.3f;
        else if (voice == 2 && pcm && pcmPos >= pcmLen) { pcmPos = 0; voiceAt = bp + AU_SR * 5; if (voiceAt >= (bedK ? BED1_N : BED0_N)) voiceAt -= (bedK ? BED1_N : BED0_N); }  // say it again after a pause
        s *= bedGain * duck;
      }
      float x = (s + v + sfxSample()) * g;
      if (x > 30000) x = 30000 + (x - 30000) * .2f; if (x < -30000) x = -30000 + (x + 30000) * .2f;  // soft limit
      int16_t o = (int16_t)fmaxf(-32767, fminf(32767, x)); out[2 * i] = o; out[2 * i + 1] = o;
    }
    i2s.write((uint8_t *)out, sizeof out);
  }
}
static bool begin() {
  pinMode(PIN_PA_CTRL, OUTPUT); digitalWrite(PIN_PA_CTRL, LOW);
  i2s.setPins(PIN_I2S_BCLK, PIN_I2S_LRCK, PIN_I2S_DOUT, -1, PIN_I2S_MCLK);
  if (!i2s.begin(I2S_MODE_STD, AU_SR, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO, I2S_STD_SLOT_BOTH)) return false;
  codec = es8311_create(0, ES8311_ADDRRES_0);  // 0x18
  if (!codec) return false;
  const es8311_clock_config_t clk = {.mclk_inverted = false, .sclk_inverted = false, .mclk_from_mclk_pin = true, .mclk_frequency = AU_SR * 256, .sample_frequency = AU_SR};
  if (es8311_init(codec, &clk, ES8311_RESOLUTION_16, ES8311_RESOLUTION_16) != ESP_OK) return false;
  es8311_sample_frequency_config(codec, clk.mclk_frequency, clk.sample_frequency);
  es8311_voice_volume_set(codec, 82, nullptr);
  digitalWrite(PIN_PA_CTRL, HIGH);
  ffatOk = FFat.begin(true);
  return true;
}
static void startTask() { xTaskCreatePinnedToCore(taskFn, "mix", 6144, nullptr, 3, &task, 0); }

// ---- the singer's recitation ----
static String cachePath(int n) { return String("/cv") + n + ".pcm"; }
static bool loadCache(int n) {
  if (!ffatOk) return false;
  File f = FFat.open(cachePath(n), "r"); if (!f) return false;
  size_t sz = f.size(); if (sz < 3200) { f.close(); return false; }
  int16_t *b = (int16_t *)ps_malloc(sz); if (!b) { f.close(); return false; }
  f.read((uint8_t *)b, sz); f.close();
  voice = 0; delay(25); if (pcm) free(pcm); pcm = b; pcmLen = sz / 2; pcmPos = 0; return true;
}
static void startVoice() { pcmPos = 0; uint32_t at = bedPos + AU_SR * 6 / 5; uint32_t n = bedK ? BED1_N : BED0_N; voiceAt = at >= n ? at - n : at; voice = 2; }
static void fetchFn(void *) {
  int n = want; bool ok = false;
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure cli; cli.setInsecure(); cli.setTimeout(20);
    HTTPClient http; http.setTimeout(25000); http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
    String url = String(SITE) + "/api/tts?v=" + n + "&fmt=pcm&voice=singer&sv=2";
    if (http.begin(cli, url)) {
      if (http.GET() == 200) {
        const size_t cap = 3 * 1024 * 1024; uint8_t *b = (uint8_t *)ps_malloc(cap); size_t len = 0;
        if (b) {
          WiFiClient *st = http.getStreamPtr(); int total = http.getSize(); uint32_t last = millis();
          while ((http.connected() || st->available()) && len < cap && (total < 0 || (int)len < total)) {
            int a = st->available(); if (a > 0) { len += st->readBytes(b + len, min((size_t)a, cap - len)); last = millis(); } else { if (millis() - last > 8000) break; delay(5); }
          }
          size_t off = 0, dlen = 0;  // the WAV "data" chunk
          if (len > 44 && !memcmp(b, "RIFF", 4)) { size_t p = 12; while (p + 8 <= len) { uint32_t cl; memcpy(&cl, b + p + 4, 4); if (!memcmp(b + p, "data", 4)) { off = p + 8; dlen = min((size_t)cl, len - off); break; } p += 8 + cl; } }
          if (dlen > 3200) {
            if (ffatOk) { File f = FFat.open(cachePath(n), "w"); if (f) { f.write(b + off, dlen); f.close(); } }
            ok = true;
          }
          free(b);
        }
      }
      http.end();
    }
  }
  if (ok && bedOn && reelN == n && loadCache(n)) startVoice();
  else if (!ok && reelN == n) voice = WiFi.status() == WL_CONNECTED ? 4 : 3;
  fetchBusy = false; fetchTask = nullptr;
  if (bedOn && reelN != n && voice == 1) { want = reelN; fetchBusy = true; xTaskCreatePinnedToCore(fetchFn, "fetch", 12288, nullptr, 1, &fetchTask, 0); }
  vTaskDelete(nullptr);
}
// k = 0/1 (which tattva), n = tattva number
static void reel(int k, int n) {
  voice = 0; paused = false; bedK = k; bedPos = 0; pred = 0; ix = 0; bedGain = .8f; reelN = n; bedOn = true;
  if (loadCache(n)) { startVoice(); return; }
  if (WiFi.status() != WL_CONNECTED) { voice = 3; return; }
  voice = 1;
  if (!fetchBusy) { want = n; fetchBusy = true; xTaskCreatePinnedToCore(fetchFn, "fetch", 12288, nullptr, 1, &fetchTask, 0); }
}
// a quiet bed under a game
static void gameBed(int k) { voice = 0; paused = false; bedK = k; bedPos = 0; pred = 0; ix = 0; bedGain = .3f; reelN = 0; bedOn = true; }
static void stop() { bedOn = false; voice = 0; paused = false; }
static float voiceProg() { return pcmLen && voice == 2 ? (float)pcmPos / pcmLen : 0; }
static float bedT() { return bedPos / (float)AU_SR; }
}  // namespace Audio
