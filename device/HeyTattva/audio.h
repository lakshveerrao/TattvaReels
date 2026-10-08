// Audio through the ES8311 codec: recitations (downloaded once from heytattva.vercel.app as 16 kHz WAV, then kept in
// flash), the Sing tune played as tones, and the microphone for live pitch scoring. Runs as its own task on core 0.
#pragma once
#include <Arduino.h>
#include <Wire.h>
#include <ESP_I2S.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <FFat.h>
#include "es8311.h"
#include "sing.h"

#define I2S_MCK 16
#define I2S_BCK 9
#define I2S_WS 45
#define I2S_DOUT 8
#define I2S_DIN 10
#define PA_PIN 46
#define SITE "https://heytattva.vercel.app"

namespace Audio {
static I2SClass i2s;
static es8311_handle_t codec = nullptr;
enum Mode { M_IDLE, M_PLAY, M_TUNE, M_COUNT, M_SING };
static volatile int mode = M_IDLE;
static volatile int status = 0;  // ::Au in ui.h
static volatile int curN = 0; static volatile bool curMeaning = false;
static int16_t *pcm = nullptr; static size_t pcmLen = 0; static volatile size_t pcmPos = 0;
static volatile float singT = 0, pitch = NAN;
static volatile int singPhase = 0;  // ::SgPhase
static SingScore sc;
static volatile int tuneN = 1;
static volatile bool stopReq = false;
static TaskHandle_t task = nullptr, fetchTask = nullptr;
static volatile int fetchN = 0; static volatile bool fetchM = false;
static bool ffatOk = false;
static int volume = 80;

static void pa(bool on) { digitalWrite(PA_PIN, on ? HIGH : LOW); }
static bool begin() {
  pinMode(PA_PIN, OUTPUT); pa(false);
  i2s.setPins(I2S_BCK, I2S_WS, I2S_DOUT, I2S_DIN, I2S_MCK);
  if (!i2s.begin(I2S_MODE_STD, SING_SR, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO, I2S_STD_SLOT_BOTH)) return false;
  codec = es8311_create(0, ES8311_ADDRRES_0);
  if (!codec) return false;
  const es8311_clock_config_t clk = {.mclk_inverted = false, .sclk_inverted = false, .mclk_from_mclk_pin = true, .mclk_frequency = SING_SR * 256, .sample_frequency = SING_SR};
  if (es8311_init(codec, &clk, ES8311_RESOLUTION_16, ES8311_RESOLUTION_16) != ESP_OK) return false;
  es8311_sample_frequency_config(codec, clk.mclk_frequency, clk.sample_frequency);
  es8311_microphone_config(codec, false);
  es8311_voice_volume_set(codec, volume, nullptr);
  es8311_microphone_gain_set(codec, (es8311_mic_gain_t)3);
  ffatOk = FFat.begin(true);
  return true;
}
// ---- playback helpers ----
static int16_t outBuf[512];
static void writeMono(const int16_t *x, int n) {  // n mono samples → stereo
  for (int i = 0; i < n; i++) { outBuf[2 * i] = x[i]; outBuf[2 * i + 1] = x[i]; }
  i2s.write((uint8_t *)outBuf, n * 4);
}
static void silence(int n) { memset(outBuf, 0, sizeof outBuf); while (n > 0) { int k = n > 256 ? 256 : n; i2s.write((uint8_t *)outBuf, k * 4); n -= k; } }
// a soft, bell-like voice for the tune, with a quiet Sa–Pa drone underneath
static float synth(const Tune &t, double tsec, double &ph, double &ph2, double &ph3) {
  float spb = 60.f / t.bpm, beat4 = tsec / spb * 4; int cur = -1;
  for (int i = 0; i < t.n; i++) if (beat4 >= t.notes[i].start && beat4 < t.notes[i].start + t.notes[i].len) { cur = i; break; }
  float v = 0;
  if (cur >= 0) {
    const Note &no = t.notes[cur]; float a = (beat4 - no.start) / 4 * spb, r = (no.start + no.len - beat4) / 4 * spb;
    float f = SA_HZ * powf(2, no.semi / 12.f); ph += 2 * M_PI * f / SING_SR;
    float env = fminf(1, a * 40) * fminf(1, r * 18) * (0.65f + 0.35f * expf(-a * 3));
    v = env * (sinf(ph) * .6f + sinf(2 * ph) * .25f + sinf(3 * ph) * .1f);
  }
  ph2 += 2 * M_PI * (SA_HZ / 2) / SING_SR; ph3 += 2 * M_PI * (SA_HZ * 0.749f) / SING_SR;
  return v * 9000 + (sinf(ph2) + .6f * sinf(ph3)) * 900;
}
static int16_t inBuf[1024], mono[YIN_N + 512]; static float yinD[YIN_TMAX + 2];
static void taskFn(void *) {
  int monoN = 0; double ph = 0, ph2 = 0, ph3 = 0; uint32_t sampleCount = 0; int lastMode = -1;
  for (;;) {
    int m = mode;
    if (stopReq) { stopReq = false; if (m == M_SING) { sc.finish(); singPhase = 4; } else if (m == M_TUNE || m == M_COUNT) singPhase = 0; mode = m = M_IDLE; status = 0; pa(false); }
    if (m != lastMode) { sampleCount = 0; monoN = 0; ph = ph2 = ph3 = 0; lastMode = m; }
    if (m == M_IDLE) { vTaskDelay(8); continue; }
    if (m == M_PLAY) {
      size_t left = pcmLen - pcmPos;
      if (!left) { mode = M_IDLE; status = 0; pa(false); continue; }
      int k = left > 256 ? 256 : (int)left; writeMono(pcm + pcmPos, k); pcmPos += k; continue;
    }
    const Tune &t = TUNE[tuneN];
    float len = t.total4 / 4.f * 60.f / t.bpm;
    if (m == M_TUNE) {
      int16_t s[256]; for (int i = 0; i < 256; i++) s[i] = (int16_t)synth(t, (sampleCount + i) / (double)SING_SR, ph, ph2, ph3);
      writeMono(s, 256); sampleCount += 256; singT = sampleCount / (float)SING_SR;
      if (singT > len + .5f) { mode = M_IDLE; singPhase = 0; pa(false); }
      continue;
    }
    if (m == M_COUNT) {  // 3-2-1 with a soft tick, then sing
      int16_t s[256]; for (int i = 0; i < 256; i++) { uint32_t n = sampleCount + i; float into = (n % SING_SR) / (float)SING_SR; s[i] = into < .06f ? (int16_t)(sinf(n * 2 * M_PI * 880 / SING_SR) * 5000 * (1 - into / .06f)) : 0; }
      writeMono(s, 256); sampleCount += 256; singT = sampleCount / (float)SING_SR - 3.f;
      if (singT >= 0) { pa(false); sc.begin(&t); singT = 0; pitch = NAN; mode = M_SING; singPhase = 3; }
      continue;
    }
    if (m == M_SING) {
      size_t got = i2s.readBytes((char *)inBuf, sizeof inBuf);  // stereo frames
      int fr = got / 4;
      // use whichever channel carries the microphone
      long eL = 0, eR = 0; for (int i = 0; i < fr; i++) { eL += abs(inBuf[2 * i]); eR += abs(inBuf[2 * i + 1]); }
      int ch = eR > eL ? 1 : 0;
      for (int i = 0; i < fr; i++) {
        mono[monoN++] = inBuf[2 * i + ch]; sampleCount++;
        if (monoN >= YIN_N) {
          float hz = yinPitch(mono, yinD), tt = (sampleCount - YIN_N / 2) / (float)SING_SR;
          float semi = hz > 0 ? hzToSemi(hz) : NAN; pitch = semi; singT = tt; sc.feed(tt, semi);
          int keep = YIN_N - YIN_HOP; memmove(mono, mono + YIN_HOP, keep * 2); monoN = keep;
        }
      }
      if (singT > len + .6f) { sc.finish(); mode = M_IDLE; singPhase = 4; }
      continue;
    }
  }
}
// ---- recitations ----
static String cachePath(int n, bool m) { return String(m ? "/sm" : "/sv") + n + ".pcm"; }  // s = the singer's voice
static bool loadCache(int n, bool m) {
  if (!ffatOk) return false;
  File f = FFat.open(cachePath(n, m), "r"); if (!f) return false;
  size_t sz = f.size(); if (sz < 3200) { f.close(); return false; }
  if (pcm) free(pcm); pcm = (int16_t *)ps_malloc(sz); if (!pcm) { f.close(); return false; }
  f.read((uint8_t *)pcm, sz); f.close(); pcmLen = sz / 2; return true;
}
static void fetchFn(void *) {
  int n = fetchN; bool m = fetchM; bool ok = false;
  if (WiFi.status() != WL_CONNECTED) { if (curN == n && curMeaning == m) status = 3; fetchTask = nullptr; vTaskDelete(nullptr); return; }
  WiFiClientSecure cli; cli.setInsecure(); cli.setTimeout(20);
  HTTPClient http; http.setTimeout(25000); http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  String url = String(SITE) + "/api/tts?v=" + n + (m ? "&m=1" : "") + "&fmt=pcm&voice=singer";
  if (http.begin(cli, url)) {
    int code = http.GET();
    if (code == 200) {
      const size_t cap = 4 * 1024 * 1024; uint8_t *b = (uint8_t *)ps_malloc(cap); size_t len = 0;
      if (b) {
        WiFiClient *st = http.getStreamPtr(); int total = http.getSize(); uint32_t last = millis();
        while ((http.connected() || st->available()) && len < cap && (total < 0 || (int)len < total)) {
          int a = st->available(); if (a > 0) { len += st->readBytes(b + len, min((size_t)a, cap - len)); last = millis(); } else { if (millis() - last > 8000) break; delay(5); }
        }
        // find the WAV "data" chunk
        size_t off = 0, dlen = 0;
        if (len > 44 && !memcmp(b, "RIFF", 4)) { size_t p = 12; while (p + 8 <= len) { uint32_t cl; memcpy(&cl, b + p + 4, 4); if (!memcmp(b + p, "data", 4)) { off = p + 8; dlen = min((size_t)cl, len - off); break; } p += 8 + cl; } }
        else { off = 0; dlen = len; }
        if (dlen > 3200) {
          if (ffatOk) { File f = FFat.open(cachePath(n, m), "w"); if (f) { f.write(b + off, dlen); f.close(); } }
          if (curN == n && curMeaning == m && status == 1) { if (pcm) free(pcm); pcm = (int16_t *)ps_malloc(dlen); if (pcm) { memcpy(pcm, b + off, dlen); pcmLen = dlen / 2; pcmPos = 0; status = 2; pa(true); mode = M_PLAY; } }
          ok = true;
        }
        free(b);
      }
    }
    http.end();
  }
  if (!ok && curN == n && curMeaning == m && status == 1) status = 4;
  fetchTask = nullptr;
  // another recitation was asked for while this one downloaded: fetch it now
  if (status == 1 && (curN != n || curMeaning != m)) { fetchN = curN; fetchM = curMeaning; xTaskCreatePinnedToCore(fetchFn, "fetch", 12288, nullptr, 1, &fetchTask, 0); }
  vTaskDelete(nullptr);
}
static void stop() { if (mode != M_IDLE) stopReq = true; else { status = 0; singPhase = 0; } }
static void play(int n, bool meaning) {
  if (mode != M_IDLE) { stopReq = true; uint32_t t = millis(); while (mode != M_IDLE && millis() - t < 200) delay(2); }
  curN = n; curMeaning = meaning; singPhase = 0;
  if (loadCache(n, meaning)) { pcmPos = 0; status = 2; pa(true); mode = M_PLAY; return; }
  if (WiFi.status() != WL_CONNECTED) { status = 3; return; }
  status = 1;
  if (!fetchTask) { fetchN = n; fetchM = meaning; xTaskCreatePinnedToCore(fetchFn, "fetch", 12288, nullptr, 1, &fetchTask, 0); }
}
static void listen(int n) { stop(); delay(30); tuneN = n; status = 0; singT = 0; singPhase = 1; pa(true); mode = M_TUNE; }
static void sing(int n) { stop(); delay(30); tuneN = n; status = 0; singT = -3; pitch = NAN; sc.begin(&TUNE[n]); singPhase = 2; pa(true); mode = M_COUNT; }
static void startTask() { xTaskCreatePinnedToCore(taskFn, "audio", 8192, nullptr, 3, &task, 0); }
static float progress() { return pcmLen ? (float)pcmPos / pcmLen : 0; }
}  // namespace Audio
