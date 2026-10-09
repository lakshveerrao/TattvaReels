// Audio for the Cheeko Gotchi: ES8311 codec + NS4150B amp, 16 kHz. Nothing is downloaded or stored: the voice and
// the rock band are streamed live from heytattva.vercel.app (16 kHz WAV) through a ring buffer in PSRAM.
//  - a reel: the tattva's music bed (sitar, tanpura, tabla; in the firmware) + the singer's recitation, streamed from
//    /api/tts; the bed ducks under the voice; after a pause it is streamed again,
//  - the Rock stage: the mixes built into the flash (see rockLocal); if missing, streamed from /api/music?mix=1 = the app's rock band with the singer's rock voice already mixed in on the
//    server, streamed and looped (the bed with some grit fills the gap while it connects),
//  - a game: the bed, quietly; plus short square-wave sound effects.
#pragma once
#include <Arduino.h>
#include <ESP_I2S.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "es8311.h"
#include <esp_netif.h>
#include <lwip/ip4_addr.h>
#include <esp_heap_caps.h>
#include <esp_partition.h>
#include "beds.h"

#define PIN_PA_CTRL 4
#define PIN_I2S_MCLK 5
#define PIN_I2S_DOUT 6
#define PIN_I2S_BCLK 15
#define PIN_I2S_LRCK 16
#define AU_SR 16000
#define SITE "https://heytattva.vercel.app"
#define RING (AU_SR * 12)        // 12 s of stream buffer
#define PRIME (AU_SR * 3 / 4)    // start playing once 0.75 s is in

namespace Audio {
// ---- IMA-ADPCM (the beds in flash) ----
static const int16_t STEP[89] = {7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767};
static const int8_t IDX[16] = {-1,-1,-1,-1,2,4,6,8,-1,-1,-1,-1,2,4,6,8};
struct Adp {
  const uint8_t *d = nullptr; uint32_t n = 0, pos = 0; int pred = 0, ix = 0;
  void set(const uint8_t *data, uint32_t samples) { d = data; n = samples; rewind(); }
  void rewind() { pos = 0; pred = 0; ix = 0; }
  bool ok() const { return d && n; }
  inline int16_t next() {
    if (pos >= n) rewind();
    uint8_t code = (d[pos >> 1] >> ((pos & 1) * 4)) & 15; pos++;
    int st = STEP[ix], diff = st >> 3;
    if (code & 4) diff += st; if (code & 2) diff += st >> 1; if (code & 1) diff += st >> 2;
    pred += (code & 8) ? -diff : diff; if (pred > 32767) pred = 32767; if (pred < -32768) pred = -32768;
    ix += IDX[code]; if (ix < 0) ix = 0; if (ix > 88) ix = 88;
    return (int16_t)pred;
  }
};

static I2SClass i2s;
static es8311_handle_t codec = nullptr;
static SemaphoreHandle_t mx = nullptr;   // guards the ring
enum Mode { M_IDLE, M_REEL, M_ROCK, M_GAME };
static volatile int mode = M_IDLE;
static volatile bool paused = false;
static volatile int vol = 6;
static volatile int voice = 0, band = 0;  // ::VoiceSt for the UI
static volatile int curK = 0, curN = 0;
static volatile float level = 0;
static volatile int lastErr = 0;          // HTTP status or a negative HTTPClient error (1 = not a WAV)
static volatile char diag[48] = "";        // why the last stream failed, shown on screen
static Adp bed;
// ---- the stream ----
enum SSt { S_IDLE, S_CONNECT, S_OPEN, S_DONE, S_ERR };
static int16_t *ring = nullptr;
static volatile uint32_t wr = 0, rd = 0;   // samples written / read since the stream (re)started
static volatile int sst = S_IDLE;
static volatile uint32_t sTotal = 0, vStart = 0, vLen = 0;  // whole stream; where the voice is (rock)
static volatile uint32_t played = 0;       // samples of this stream played
static volatile bool primed = false;
static volatile uint32_t gen = 0;          // bumped on every new stream: an old one stops writing
static volatile uint32_t clk = 0, nextAt = 0, errAt = 0;  // samples since start; when to stream again
static String url;
static TaskHandle_t task = nullptr, streamer = nullptr;

// ---- the rock mixes built into the flash (flash/cgotchi/rock.bin, written by the installer into the "ffat"
// partition): band + the singer's rock voice, 16 kHz G.711 mu-law, so Rock plays with no Wi-Fi at all ----
struct RockEnt { uint32_t tattva, off, samples, vStart, vLen; };
struct RockHdr { char magic[4]; uint32_t n; RockEnt e[8]; };
struct Mu {  // mu-law samples in flash, looping
  const uint8_t *d = nullptr; uint32_t n = 0, pos = 0;
  void set(const uint8_t *data, uint32_t samples) { d = data; n = samples; pos = 0; }
  inline int16_t next() { if (pos >= n) pos = 0; uint8_t u = ~d[pos++]; int e = (u >> 4) & 7, x = ((((u & 15) << 3) + 0x84) << e) - 0x84; return (int16_t)(u & 0x80 ? -x : x); }
};
static Mu rk; static bool local = false;
static esp_partition_mmap_handle_t rkMap = 0; static bool rkMapped = false;
static bool rockLocal(int n) {
  const esp_partition_t *p = esp_partition_find_first(ESP_PARTITION_TYPE_DATA, ESP_PARTITION_SUBTYPE_ANY, "ffat"); if (!p) return false;
  RockHdr h; if (esp_partition_read(p, 0, &h, sizeof h) != ESP_OK || memcmp(h.magic, "HTRU", 4) || h.n > 8) return false;
  for (uint32_t i = 0; i < h.n; i++) if ((int)h.e[i].tattva == n) {
    const RockEnt &e = h.e[i]; uint32_t bytes = e.samples, base = e.off & ~0xFFFFu, delta = e.off - base;
    if (e.off + bytes > p->size) return false;
    if (rkMapped) { esp_partition_munmap(rkMap); rkMapped = false; }
    const void *ptr = nullptr;
    if (esp_partition_mmap(p, base, delta + bytes, ESP_PARTITION_MMAP_DATA, &ptr, &rkMap) != ESP_OK) return false;
    rkMapped = true; rk.set((const uint8_t *)ptr + delta, e.samples); vStart = e.vStart; vLen = e.vLen; sTotal = e.samples;
    Serial.printf("rock: tattva %d from flash, %u samples\n", n, (unsigned)e.samples);
    return true;
  }
  return false;
}

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
        // the stream: the voice (reel) or the whole mixed rock track
        bool live = false; float x = 0;
        if (m == M_ROCK && local) { x = rk.next(); played = rk.pos; live = true; }
        else if (m != M_GAME && (sst == S_OPEN || sst == S_DONE) && clk >= nextAt) {
          uint32_t av = wr - rd;
          if (!primed && (av >= PRIME || sst == S_DONE)) primed = true;
          if (primed && av) { x = ring[rd % RING]; rd++; played++; live = true; }
          else if (primed && sst == S_OPEN) primed = false;  // ran dry: wait for more
        }
        if (m == M_ROCK) {
          if (live) s = x * 1.2f;  // rock plays louder (guitar to max, then "slightly decrease")
          else { float f = bed.next() / 12000.f; s = f / (1 + fabsf(f)) * 9000.f; }  // the bed with some grit while the band connects
        } else {
          bool talking = live && m == M_REEL;
          s = bed.ok() ? bed.next() : 0;
          if (talking) v = x * 1.3f;
          duck += ((talking ? .32f : 1.f) - duck) * .0006f;
          s *= (m == M_GAME ? .3f : .8f) * duck;
        }
        clk++;
      }
      float x = (s + v + sfxSample()) * g;
      if (x > 30000) x = 30000 + (x - 30000) * .2f; if (x < -30000) x = -30000 + (x + 30000) * .2f;  // soft limit
      int16_t o = (int16_t)fmaxf(-32767, fminf(32767, x)); out[2 * i] = o; out[2 * i + 1] = o; float a = fabsf(x); if (a > pk) pk = a;
    }
    xSemaphoreGive(mx);
    lvl += (fminf(1.f, pk / 22000.f) - lvl) * .35f; level = lvl;
    i2s.write((uint8_t *)out, sizeof out);
    // keep the UI's view of the stream up to date
    if (m == M_REEL) voice = (sst == S_OPEN || sst == S_DONE) ? (primed || clk < nextAt || sst == S_DONE ? 2 : 1) : sst == S_ERR ? (WiFi.status() == WL_CONNECTED ? 4 : 3) : voice;
    if (m == M_ROCK && local) { band = 2; voice = vLen && played >= vStart && played < vStart + vLen ? 2 : 0; }
    else if (m == M_ROCK) { int b = (sst == S_OPEN || sst == S_DONE) && primed ? 2 : sst == S_ERR ? (WiFi.status() == WL_CONNECTED ? 4 : 3) : band == 2 ? 2 : 1; band = b;  // looping: stay 'playing' while it reconnects
      voice = b == 2 && vLen && played >= vStart && played < vStart + vLen ? 2 : 0; }
  }
}

// ---- streaming ----
static void setDns(const char *a, const char *b) {
  esp_netif_t *nif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF"); if (!nif) return;
  esp_netif_dns_info_t d = {}; d.ip.type = ESP_IPADDR_TYPE_V4;
  d.ip.u_addr.ip4.addr = ipaddr_addr(a); esp_netif_set_dns_info(nif, ESP_NETIF_DNS_MAIN, &d);
  d.ip.u_addr.ip4.addr = ipaddr_addr(b); esp_netif_set_dns_info(nif, ESP_NETIF_DNS_BACKUP, &d);
  Serial.println("DNS: switched to 8.8.8.8 / 1.1.1.1");
}
static void resetRing() { xSemaphoreTake(mx, portMAX_DELAY); wr = rd = 0; played = 0; primed = false; sTotal = vStart = vLen = 0; xSemaphoreGive(mx); }
// read exactly n bytes (or until the stream ends / is replaced)
static int readFull(WiFiClient *st, uint8_t *b, int n, uint32_t g) {
  int got = 0; uint32_t last = millis();
  while (got < n && gen == g) { int a = st->available(); if (a > 0) { got += st->read(b + got, min(a, n - got)); last = millis(); } else { if (!st->connected() || millis() - last > 15000) break; delay(3); } }
  return got;
}
static void streamOnce(uint32_t g, const String &u) {
  if (WiFi.status() != WL_CONNECTED) { lastErr = 0; sst = S_ERR; errAt = clk; return; }
  if (gen != g) return;
  sst = S_CONNECT; resetRing();
  // name lookup first; if the router's DNS fails, fall back to Google / Cloudflare DNS
  IPAddress ip; bool dns = WiFi.hostByName("heytattva.vercel.app", ip) == 1;
  if (!dns) { setDns("8.8.8.8", "1.1.1.1"); dns = WiFi.hostByName("heytattva.vercel.app", ip) == 1; }
  WiFiClientSecure cli; HTTPClient http; int code = -1;
  for (int attempt = 0; attempt < 3 && gen == g; attempt++) {
    if (attempt) { http.end(); cli.stop(); delay(1500 * attempt); }
    cli.setInsecure(); cli.setHandshakeTimeout(30);
    http.setTimeout(60000); http.setConnectTimeout(20000); http.setUserAgent("HeyTattva-Cheeko/3"); http.setReuse(false);
    const char *hk[] = {"X-Voice-Start", "X-Voice-Len"}; http.collectHeaders(hk, 2);
    if (!http.begin(cli, u)) { code = -100; continue; }
    code = http.GET();
    Serial.printf("stream %s -> %d (%d bytes)\n", u.c_str(), code, http.getSize());
    if (code == 200 || code > 0) break;
  }
  if (code != 200) {
    char tls[64] = ""; int te = cli.lastError(tls, sizeof tls);
    snprintf((char *)diag, sizeof diag, "%d %s %s%d heap %uk", code, dns ? "dns ok" : "no dns", te ? "tls " : "", te, (unsigned)(heap_caps_get_largest_free_block(MALLOC_CAP_INTERNAL) / 1024));
    Serial.printf("stream failed: %s (%s)\n", (const char *)diag, tls);
    lastErr = code; http.end(); if (gen == g) { sst = S_ERR; errAt = clk; } return;
  }
  if (gen == g) { vStart = http.header("X-Voice-Start").toInt(); vLen = http.header("X-Voice-Len").toInt(); }
  WiFiClient *st = http.getStreamPtr();
  // the WAV header: walk the chunks to "data"
  uint8_t h[12]; uint32_t dataLen = 0; bool ok = readFull(st, h, 12, g) == 12 && !memcmp(h, "RIFF", 4);
  while (ok) { uint8_t c[8]; if (readFull(st, c, 8, g) != 8) { ok = false; break; } uint32_t cl; memcpy(&cl, c + 4, 4);
    if (!memcmp(c, "data", 4)) { dataLen = cl; break; }
    uint8_t skip[64]; while (cl && ok) { int k = cl > 64 ? 64 : cl; ok = readFull(st, skip, k, g) == k; cl -= k; } }
  if (!ok || gen != g) { if (gen == g) { lastErr = 1; sst = S_ERR; errAt = clk; } http.end(); return; }
  if (gen == g) { sTotal = dataLen / 2; lastErr = 0; diag[0] = 0; sst = S_OPEN; }
  static uint8_t buf[2048]; uint32_t left = dataLen, odd = 0; uint8_t carry = 0;
  while (left && gen == g) {
    while (wr - rd > RING - 1024 && gen == g) delay(8);  // full: wait for the speaker
    int want = left > sizeof buf ? sizeof buf : left; int n = readFull(st, buf, want, g); if (n <= 0) break; left -= n;
    xSemaphoreTake(mx, portMAX_DELAY);
    if (gen == g) { int i = 0;
      if (odd) { ring[wr % RING] = (int16_t)(carry | (buf[0] << 8)); wr++; i = 1; odd = 0; }
      for (; i + 1 < n; i += 2) { ring[wr % RING] = (int16_t)(buf[i] | (buf[i + 1] << 8)); wr++; }
      if (i < n) { carry = buf[i]; odd = 1; } }
    xSemaphoreGive(mx);
    if (n < want) break;
  }
  http.end();
  if (gen == g) { sTotal = wr; sst = S_DONE; }
}
static String streamUrl() {
  if (mode == M_ROCK) return String(SITE) + "/api/music?v=" + curN + "&fmt=pcm&mix=1";
  return String(SITE) + "/api/tts?v=" + curN + "&fmt=pcm&voice=singer&sv=2";
}
// opens streams when the reel / stage needs one: at the start, after the voice ended (reel: a pause first; rock:
// loop at once), and again some seconds after a failure
static void streamFn(void *) {
  for (;;) {
    ulTaskNotifyTake(pdTRUE, pdMS_TO_TICKS(40));
    int m = mode; if (m != M_REEL && (m != M_ROCK || local)) continue;
    bool start = sst == S_IDLE || (sst == S_DONE && rd >= wr && clk >= nextAt) || (sst == S_ERR && clk - errAt > AU_SR * 8);
    if (!start || paused) continue;
    if (sst == S_DONE) nextAt = clk + (m == M_REEL ? AU_SR * 5 : 0);  // the reel says it again after a pause
    uint32_t g = gen; streamOnce(g, streamUrl());
  }
}

static bool begin() {
  mx = xSemaphoreCreateMutex();
  ring = (int16_t *)ps_malloc(RING * 2);
  pinMode(PIN_PA_CTRL, OUTPUT); digitalWrite(PIN_PA_CTRL, LOW);
  i2s.setPins(PIN_I2S_BCLK, PIN_I2S_LRCK, PIN_I2S_DOUT, -1, PIN_I2S_MCLK);
  if (!ring || !i2s.begin(I2S_MODE_STD, AU_SR, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO, I2S_STD_SLOT_BOTH)) return false;
  codec = es8311_create(0, ES8311_ADDRRES_0);  // 0x18
  if (!codec) return false;
  const es8311_clock_config_t clkc = {.mclk_inverted = false, .sclk_inverted = false, .mclk_from_mclk_pin = true, .mclk_frequency = AU_SR * 256, .sample_frequency = AU_SR};
  if (es8311_init(codec, &clkc, ES8311_RESOLUTION_16, ES8311_RESOLUTION_16) != ESP_OK) return false;
  es8311_sample_frequency_config(codec, clkc.mclk_frequency, clkc.sample_frequency);
  es8311_voice_volume_set(codec, 82, nullptr);
  digitalWrite(PIN_PA_CTRL, HIGH);
  return true;
}
static void startTask() {
  xTaskCreatePinnedToCore(taskFn, "mix", 6144, nullptr, 3, &task, 0);
  xTaskCreatePinnedToCore(streamFn, "stream", 20480, nullptr, 1, &streamer, 0);  // TLS needs a deep stack
}
// k = 0..NT-1 (which tattva), n = tattva number
static void start(int m, int k, int n) {
  gen++;                       // any stream still running stops writing
  mode = M_IDLE; paused = false; curK = k; curN = n; bed.set(BEDS[k], BEDN[k]);
  resetRing(); sst = S_IDLE; lastErr = 0; clk = 0; diag[0] = 0;
  local = m == M_ROCK && rockLocal(n); nextAt = m == M_REEL ? AU_SR * 6 / 5 : 0;
  voice = m == M_REEL ? 1 : 0; band = m == M_ROCK ? (local ? 2 : 1) : 0;
  mode = m;
  if (m == M_REEL || (m == M_ROCK && !local)) { WiFi.setSleep(false); if (streamer) xTaskNotifyGive(streamer); }  // stream (no modem sleep)
}
static void reel(int k, int n) { start(M_REEL, k, n); }
static void rock(int k, int n) { start(M_ROCK, k, n); }
static void game(int k) { start(M_GAME, k, 0); }
static void stop() { gen++; mode = M_IDLE; local = false; paused = false; voice = 0; band = 0; sst = S_IDLE; }
static float voiceProg() {
  if (mode == M_ROCK) return vLen && played > vStart ? fminf(1.f, (float)(played - vStart) / vLen) : 0;
  return sTotal && voice == 2 ? fminf(1.f, (float)played / sTotal) : 0;
}
static float bedT() { return bed.pos / (float)AU_SR; }
static float bedLen() { return bed.n / (float)AU_SR; }
}  // namespace Audio
