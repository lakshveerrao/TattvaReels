// Audio for the Cheeko Gotchi: ES8311 codec + NS4150B amp, 16 kHz. One mixer task on core 0 mixes
//  - a reel: the tattva's music bed (sitar, tanpura, tabla; IMA-ADPCM in flash, loops) + the singer's recitation,
//  - the Rock stage: the app's rock band track (/api/music) + the same recitation through a rock vocal chain,
//  - a game: the bed, quietly,
//  - short square-wave sound effects.
// The recitation and the band are downloaded once over Wi-Fi (16 kHz WAV), squeezed to IMA-ADPCM (4:1) and kept in
// FFat (/cvN.adp, /rbN.adp), so they play without Wi-Fi afterwards. The bed / band duck under the voice.
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
// ---- IMA-ADPCM ----
static const int16_t STEP[89] = {7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767};
static const int8_t IDX[16] = {-1,-1,-1,-1,2,4,6,8,-1,-1,-1,-1,2,4,6,8};
struct Adp {
  const uint8_t *d = nullptr; uint32_t n = 0, pos = 0; int pred = 0, ix = 0;
  void set(const uint8_t *data, uint32_t samples) { d = data; n = samples; rewind(); }
  void rewind() { pos = 0; pred = 0; ix = 0; }
  bool ok() const { return d && n; }
  inline int16_t next() {
    if (pos >= n) return 0;
    uint8_t code = (d[pos >> 1] >> ((pos & 1) * 4)) & 15; pos++;
    int st = STEP[ix], diff = st >> 3;
    if (code & 4) diff += st; if (code & 2) diff += st >> 1; if (code & 1) diff += st >> 2;
    pred += (code & 8) ? -diff : diff; if (pred > 32767) pred = 32767; if (pred < -32768) pred = -32768;
    ix += IDX[code]; if (ix < 0) ix = 0; if (ix > 88) ix = 88;
    return (int16_t)pred;
  }
};
// samples → ADPCM nibbles (same coder as tools/pack_cg.py)
static uint8_t *encode(const int16_t *s, uint32_t n) {
  uint8_t *o = (uint8_t *)ps_malloc(n / 2 + 1); if (!o) return nullptr; memset(o, 0, n / 2 + 1);
  int pred = 0, ix = 0;
  for (uint32_t i = 0; i < n; i++) {
    int st = STEP[ix], d = s[i] - pred, code = 0; if (d < 0) { code = 8; d = -d; }
    int diff = st >> 3; if (d >= st) { code |= 4; d -= st; diff += st; } if (d >= st >> 1) { code |= 2; d -= st >> 1; diff += st >> 1; } if (d >= st >> 2) { code |= 1; diff += st >> 2; }
    pred = (code & 8) ? pred - diff : pred + diff; if (pred > 32767) pred = 32767; if (pred < -32768) pred = -32768;
    ix += IDX[code]; if (ix < 0) ix = 0; if (ix > 88) ix = 88;
    o[i >> 1] |= code << ((i & 1) * 4);
  }
  return o;
}

static I2SClass i2s;
static es8311_handle_t codec = nullptr;
static bool ffatOk = false;
static SemaphoreHandle_t mx = nullptr;   // guards the buffers the mixer reads
enum Mode { M_IDLE, M_REEL, M_ROCK, M_GAME };
static volatile int mode = M_IDLE;
static volatile bool paused = false;
static volatile int vol = 6;
static volatile int voice = 0, band = 0;  // ::VoiceSt
static volatile int curK = 0, curN = 0;
static volatile float level = 0;
static Adp bed, voc, bnd;
static uint8_t *vocBuf = nullptr, *bndBuf = nullptr; static int vocN = 0, bndN = 0;
static uint32_t clk = 0, vStart = 0;      // samples since the reel / stage started; when the voice (re)starts
static TaskHandle_t task = nullptr, fetcher = nullptr;

// ---- sound effects ----
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
// ---- rock vocal chain: high-pass, presence, grit, slapback, a little room ----
static float hpY = 0, hpX = 0, lpP = 0; static int16_t slap[1760], room[1409]; static int slapI = 0, roomI = 0;
static inline float rockFx(float x) {
  hpY = .953f * (hpY + x - hpX); hpX = x;                       // ~120 Hz high-pass
  lpP += (hpY - lpP) * .55f; float p = hpY + .8f * (hpY - lpP);  // lift the presence range
  float f = p / 14000.f * 2.f, g = f / (1 + fabsf(f)) * 15000.f;  // soft-clip grit
  float y = g + .32f * slap[slapI]; slap[slapI] = (int16_t)fmaxf(-32767, fminf(32767, g)); slapI = (slapI + 1) % 1760;  // 110 ms slapback
  float r = room[roomI]; room[roomI] = (int16_t)fmaxf(-32767, fminf(32767, y * .5f + r * .38f)); roomI = (roomI + 1) % 1409;
  return y + r * .25f;
}
static void resetFx() { hpY = hpX = lpP = 0; memset(slap, 0, sizeof slap); memset(room, 0, sizeof room); }

// ---- mixer ----
static void taskFn(void *) {
  static int16_t out[256 * 2]; float duck = 1, lvl = 0;
  for (;;) {
    int m = mode;
    bool any = (m != M_IDLE && !paused) || sfxI < sfxN;
    if (!any) { level = 0; if (m != M_IDLE) { memset(out, 0, sizeof out); i2s.write((uint8_t *)out, sizeof out); } else vTaskDelay(6); continue; }
    float g = vol * vol / 100.f * 1.2f; float pk = 0;
    xSemaphoreTake(mx, portMAX_DELAY);
    for (int i = 0; i < 256; i++) {
      float s = 0, v = 0;
      if (m != M_IDLE && !paused) {
        bool rock = m == M_ROCK, useBand = rock && bnd.ok();
        Adp &bg = useBand ? bnd : bed; if (bg.ok() && bg.pos >= bg.n) bg.rewind();
        s = bg.ok() ? bg.next() : 0;
        bool talking = false;
        if (m != M_GAME && voice == 2 && voc.ok() && clk >= vStart) {
          if (voc.pos < voc.n) { talking = true; float x = voc.next(); v = rock ? rockFx(x) * 1.15f : x * 1.3f; }
          else { voc.rewind(); vStart = clk + AU_SR * (rock ? 7 : 5); }  // say it again after a pause
        }
        duck += ((talking ? (rock ? .5f : .32f) : 1.f) - duck) * .0006f;
        s *= (m == M_GAME ? .3f : useBand ? .85f : rock ? 1.f : .8f) * duck;
        if (rock && !useBand) { float f = s / 12000.f; s = f / (1 + fabsf(f)) * 14000.f; }  // no band yet: the bed with some grit
        clk++;
      }
      float x = (s + v + sfxSample()) * g;
      if (x > 30000) x = 30000 + (x - 30000) * .2f; if (x < -30000) x = -30000 + (x + 30000) * .2f;  // soft limit
      int16_t o = (int16_t)fmaxf(-32767, fminf(32767, x)); out[2 * i] = o; out[2 * i + 1] = o; float a = fabsf(x); if (a > pk) pk = a;
    }
    xSemaphoreGive(mx);
    lvl += (fminf(1.f, pk / 22000.f) - lvl) * .35f; level = lvl;
    i2s.write((uint8_t *)out, sizeof out);
  }
}

// ---- cache in FFat ----
static String path(bool isBand, int n) { return String(isBand ? "/rb" : "/cv") + n + ".adp"; }
static bool loadFile(bool isBand, int n) {
  if (!ffatOk) return false;
  File f = FFat.open(path(isBand, n), "r"); if (!f) return false;
  size_t sz = f.size(); if (sz < 1600) { f.close(); return false; }
  uint8_t *b = (uint8_t *)ps_malloc(sz); if (!b) { f.close(); return false; }
  f.read(b, sz); f.close();
  xSemaphoreTake(mx, portMAX_DELAY);
  if (isBand) { if (bndBuf) free(bndBuf); bndBuf = b; bndN = n; bnd.set(b, sz * 2); }
  else { if (vocBuf) free(vocBuf); vocBuf = b; vocN = n; voc.set(b, sz * 2); }
  xSemaphoreGive(mx);
  return true;
}
// make room: drop cached files of other tattvas until `need` bytes are free
static void makeRoom(size_t need) {
  for (int pass = 0; pass < 12 && FFat.totalBytes() - FFat.usedBytes() < need + 32768; pass++) {
    File root = FFat.open("/"); String victim; File f;
    while ((f = root.openNextFile())) { String nm = String("/") + f.name(); if (nm.startsWith("/")) nm = nm.substring(nm.lastIndexOf('/')); f.close();
      if ((nm.startsWith("/cv") || nm.startsWith("/rb")) && nm != path(false, curN) && nm != path(true, curN)) { victim = nm; break; } }
    root.close(); if (!victim.length()) break; FFat.remove(victim);
  }
}
// where a download lands: PSRAM, grown as needed (HTTPClient::writeToStream also undoes chunked encoding)
struct Sink : public Stream {
  uint8_t *b = nullptr; size_t len = 0, cap = 0; bool bad = false;
  size_t write(uint8_t c) override { return write(&c, 1); }
  size_t write(const uint8_t *d, size_t n) override {
    if (bad) return 0;
    if (len + n > cap) { size_t nc = cap ? cap * 2 : 1024 * 1024; while (nc < len + n) nc *= 2; if (nc > 6u * 1024 * 1024) { bad = true; return 0; }
      uint8_t *nb = (uint8_t *)ps_realloc(b, nc); if (!nb) { bad = true; return 0; } b = nb; cap = nc; }
    memcpy(b + len, d, n); len += n; return n;
  }
  int available() override { return 0; } int read() override { return -1; } int peek() override { return -1; } void flush() override {}
};
static volatile int lastErr = 0;  // shown on screen: HTTP status, or a negative HTTPClient error, or 1 = not a WAV
// GET a 16 kHz mono WAV and return its samples (PSRAM); n = sample count
static int16_t *download(const String &url, uint32_t &n) {
  n = 0; if (WiFi.status() != WL_CONNECTED) return nullptr;
  for (int attempt = 0; attempt < 3; attempt++) {
    if (attempt) delay(2000 * attempt);
    WiFiClientSecure cli; cli.setInsecure(); cli.setTimeout(30);
    HTTPClient http; http.setTimeout(60000); http.setConnectTimeout(15000); http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
    http.setUserAgent("HeyTattva-Cheeko/2");
    if (!http.begin(cli, url)) { lastErr = -100; continue; }
    int code = http.GET();
    Serial.printf("GET %s -> %d (size %d)\n", url.c_str(), code, http.getSize());
    if (code != 200) { lastErr = code; http.end(); continue; }
    Sink sk; int got = http.writeToStream(&sk); http.end();
    Serial.printf("  got %d bytes (sink %u)\n", got, (unsigned)sk.len);
    uint8_t *b = sk.b; size_t len = sk.len;
    size_t off = 0, dlen = 0;  // the WAV "data" chunk
    if (b && len > 44 && !memcmp(b, "RIFF", 4)) { size_t p = 12; while (p + 8 <= len) { uint32_t cl; memcpy(&cl, b + p + 4, 4); if (!memcmp(b + p, "data", 4)) { off = p + 8; dlen = min((size_t)cl, len - off); break; } p += 8 + cl; } }
    if (dlen > 3200) { memmove(b, b + off, dlen); n = dlen / 2; lastErr = 0; return (int16_t *)b; }
    lastErr = got < 0 ? got : 1; if (b) free(b);
  }
  return nullptr;
}
// put a buffer of ADPCM in place for the mixer
static void install(bool isBand, int n, uint8_t *b, size_t bytes) {
  xSemaphoreTake(mx, portMAX_DELAY);
  if (isBand) { if (bndBuf) free(bndBuf); bndBuf = b; bndN = n; bnd.set(b, bytes * 2); }
  else { if (vocBuf) free(vocBuf); vocBuf = b; vocN = n; voc.set(b, bytes * 2); }
  xSemaphoreGive(mx);
}
// download, pack to ADPCM, try to keep a copy in FFat (if the storage is full it still plays, from memory)
static uint8_t *fetchOne(bool isBand, int n, size_t &bytes) {
  String url = isBand ? String(SITE) + "/api/music?v=" + n + "&fmt=pcm" : String(SITE) + "/api/tts?v=" + n + "&fmt=pcm&voice=singer&sv=2";
  bytes = 0; uint32_t ns; int16_t *s = download(url, ns); if (!s) return nullptr;
  uint8_t *a = encode(s, ns); free(s); if (!a) { lastErr = 2; return nullptr; }
  bytes = ns / 2 + 1;
  if (ffatOk) {
    makeRoom(bytes); File f = FFat.open(path(isBand, n), "w"); size_t w = 0;
    if (f) { w = f.write(a, bytes); f.close(); }
    if (w != bytes) { FFat.remove(path(isBand, n)); Serial.printf("FFat: could not keep %s (%u of %u bytes; %u free)\n", path(isBand, n).c_str(), (unsigned)w, (unsigned)bytes, (unsigned)(FFat.totalBytes() - FFat.usedBytes())); }
  }
  return a;
}
// what the current reel / stage still needs
static void fetchFn(void *) {
  for (;;) {
    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
    for (int guard = 0; guard < 6; guard++) {
      int m = mode, n = curN; bool wantV = (m == M_REEL || m == M_ROCK) && voice == 1, wantB = m == M_ROCK && band == 1;
      if (!wantV && !wantB) break;
      bool isBand = !wantV;  // the voice first: it is smaller
      size_t bytes; uint8_t *a = fetchOne(isBand, n, bytes);
      if (curN != n || mode != m) { if (a) free(a); continue; }  // moved on meanwhile (kept in FFat if there was room)
      if (a) { install(isBand, n, a, bytes); if (isBand) band = 2; else { clk = 0; vStart = AU_SR * 6 / 5; voice = 2; } }
      else { int st = WiFi.status() == WL_CONNECTED ? 4 : 3; if (isBand) band = st; else voice = st; }
    }
  }
}
static void want() { if (fetcher) xTaskNotifyGive(fetcher); }

static bool begin() {
  mx = xSemaphoreCreateMutex();
  pinMode(PIN_PA_CTRL, OUTPUT); digitalWrite(PIN_PA_CTRL, LOW);
  i2s.setPins(PIN_I2S_BCLK, PIN_I2S_LRCK, PIN_I2S_DOUT, -1, PIN_I2S_MCLK);
  if (!i2s.begin(I2S_MODE_STD, AU_SR, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO, I2S_STD_SLOT_BOTH)) return false;
  codec = es8311_create(0, ES8311_ADDRRES_0);  // 0x18
  if (!codec) return false;
  const es8311_clock_config_t clkc = {.mclk_inverted = false, .sclk_inverted = false, .mclk_from_mclk_pin = true, .mclk_frequency = AU_SR * 256, .sample_frequency = AU_SR};
  if (es8311_init(codec, &clkc, ES8311_RESOLUTION_16, ES8311_RESOLUTION_16) != ESP_OK) return false;
  es8311_sample_frequency_config(codec, clkc.mclk_frequency, clkc.sample_frequency);
  es8311_voice_volume_set(codec, 82, nullptr);
  digitalWrite(PIN_PA_CTRL, HIGH);
  ffatOk = FFat.begin(true);
  if (ffatOk) { for (int n = 1; n <= 8; n++) FFat.remove(String("/cv") + n + ".pcm");  // the first build kept raw PCM
    Serial.printf("FFat: %u of %u bytes used\n", (unsigned)FFat.usedBytes(), (unsigned)FFat.totalBytes()); }
  return true;
}
static void startTask() {
  xTaskCreatePinnedToCore(taskFn, "mix", 6144, nullptr, 3, &task, 0);
  xTaskCreatePinnedToCore(fetchFn, "fetch", 20480, nullptr, 1, &fetcher, 0);  // TLS needs a deep stack
}
static void startVoice() { voc.rewind(); clk = 0; vStart = AU_SR * 6 / 5; voice = 2; }
// k = 0..NT-1 (which tattva), n = tattva number
static void start(int m, int k, int n) {
  xSemaphoreTake(mx, portMAX_DELAY);
  mode = M_IDLE; paused = false; curK = k; curN = n; bed.set(BEDS[k], BEDN[k]); resetFx(); voice = 0; band = 0;
  if (vocN != n) { if (vocBuf) free(vocBuf); vocBuf = nullptr; vocN = 0; voc.set(nullptr, 0); }
  if (bndN != n) { if (bndBuf) free(bndBuf); bndBuf = nullptr; bndN = 0; bnd.set(nullptr, 0); }
  xSemaphoreGive(mx);
  if (m == M_GAME) { mode = M_GAME; return; }
  bool net = WiFi.status() == WL_CONNECTED;
  if (vocN == n || loadFile(false, n)) startVoice(); else voice = net ? 1 : 3;
  if (m == M_ROCK) { if (bndN == n || loadFile(true, n)) { bnd.rewind(); band = 2; } else band = net ? 1 : 3; }
  clk = 0; mode = m;
  if (voice == 1 || band == 1) want();
}
static void reel(int k, int n) { start(M_REEL, k, n); }
static void rock(int k, int n) { start(M_ROCK, k, n); }
static void game(int k) { start(M_GAME, k, 0); }
static void stop() { mode = M_IDLE; paused = false; voice = 0; band = 0; }
static float voiceProg() { return voice == 2 && voc.n && clk >= vStart ? (float)voc.pos / voc.n : 0; }
static float bedT() { return bed.pos / (float)AU_SR; }
static float bedLen() { return bed.n / (float)AU_SR; }
}  // namespace Audio
