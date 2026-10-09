/* Hey Tattva for the Cheeko Gotchi v1.2 (ESP32-S3, 240x296 ST7789, CST810 touch, ES8311 speaker, LIS2DH12 tilt).
   Five reels (tattvas 1, 2, 4, 6, 8) with the singer's recitation over a sitar / tanpura / tabla bed, five games
   (Mirror Letters, Grow the Seed, Lamp Tilt, Eclipse, Dream Cards) and the Rock stage (the app's rock band + the
   singer through a rock vocal chain, downloaded once over Wi-Fi). Wi-Fi setup from a phone (HeyTattva-Setup).
   Board: XIAO_ESP32S3 profile, FQBN esp32:esp32:XIAO_ESP32S3:PSRAM=opi,PartitionScheme=tinyuf2_noota. See README.md. */
#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <Preferences.h>
#include "ui.h"
#include "net.h"
#include "audio.h"
#include "miniz.h"  // ESP32 ROM inflate

#define PIN_LCD_DC 8
#define PIN_LCD_SCLK 9
#define PIN_LCD_MOSI 10
#define PIN_LCD_BL 13
#define PIN_LCD_CS 14
#define PIN_LCD_RST 17
#define PIN_I2C_SCL 11
#define PIN_I2C_SDA 12
#define PIN_POWER_OFF 2   // HIGH cuts the power: keep it LOW
#define PIN_POWER_KEY 3   // middle key, active HIGH
#define PIN_VOL_DOWN 39   // active LOW
#define PIN_VOL_UP 40     // active LOW
#define CST810 0x15
#define LIS2DH12 0x19

SET_LOOP_TASK_STACK_SIZE(24 * 1024);  // the UI's drawing code needs more than the default 8 KB
static UI ui; static Env env; static Preferences pref;
static uint16_t *shown = nullptr;     // what is on the panel now, to send only the rows that changed
static SPISettings spiSet(40000000, MSBFIRST, SPI_MODE0);
static bool accelOk = false;
static uint32_t lastInput = 0; static bool asleep = false;

// ---------- I2C ----------
static void wr(uint8_t a, uint8_t r, uint8_t v) { Wire.beginTransmission(a); Wire.write(r); Wire.write(v); Wire.endTransmission(); }
static bool rdn(uint8_t a, uint8_t r, uint8_t *b, int n) { Wire.beginTransmission(a); Wire.write(r); if (Wire.endTransmission(false)) return false; if (Wire.requestFrom(a, (uint8_t)n) != n) return false; for (int i = 0; i < n; i++) b[i] = Wire.read(); return true; }

// ---------- ST7789 over SPI ----------
static void lcdCmd(uint8_t c) { digitalWrite(PIN_LCD_DC, LOW); digitalWrite(PIN_LCD_CS, LOW); SPI.beginTransaction(spiSet); SPI.write(c); SPI.endTransaction(); digitalWrite(PIN_LCD_CS, HIGH); }
static void lcdData(const uint8_t *d, int n) { digitalWrite(PIN_LCD_DC, HIGH); digitalWrite(PIN_LCD_CS, LOW); SPI.beginTransaction(spiSet); SPI.writeBytes(d, n); SPI.endTransaction(); digitalWrite(PIN_LCD_CS, HIGH); }
static void lcdData1(uint8_t v) { lcdData(&v, 1); }
static void lcdWindow(int x0, int y0, int x1, int y1) {
  uint8_t c[4] = {(uint8_t)(x0 >> 8), (uint8_t)x0, (uint8_t)(x1 >> 8), (uint8_t)x1}, r[4] = {(uint8_t)(y0 >> 8), (uint8_t)y0, (uint8_t)(y1 >> 8), (uint8_t)y1};
  lcdCmd(0x2A); lcdData(c, 4); lcdCmd(0x2B); lcdData(r, 4); lcdCmd(0x2C);
}
static void lcdInit() {
  pinMode(PIN_LCD_CS, OUTPUT); pinMode(PIN_LCD_DC, OUTPUT); pinMode(PIN_LCD_RST, OUTPUT); pinMode(PIN_LCD_BL, OUTPUT);
  digitalWrite(PIN_LCD_CS, HIGH); digitalWrite(PIN_LCD_BL, LOW);
  SPI.begin(PIN_LCD_SCLK, -1, PIN_LCD_MOSI, PIN_LCD_CS);
  digitalWrite(PIN_LCD_RST, LOW); delay(20); digitalWrite(PIN_LCD_RST, HIGH); delay(120);
  lcdCmd(0x01); delay(150);            // SWRESET
  lcdCmd(0x11); delay(120);            // SLPOUT
  lcdCmd(0x36); lcdData1(0x40);        // MADCTL: mirror X, RGB (portrait 240x296)
  lcdCmd(0x3A); lcdData1(0x55);        // 16-bit colour
  lcdCmd(0x20);                        // no inversion
  lcdCmd(0x13);                        // normal mode
  lcdCmd(0x29);                        // display on
}
// rows y0..y1 of the frame, byte-swapped to the panel's big-endian order
static uint16_t rowBuf[SW * 8];
static void lcdRows(const uint16_t *px, int y0, int y1) {
  lcdWindow(0, y0, SW - 1, y1);
  digitalWrite(PIN_LCD_DC, HIGH); digitalWrite(PIN_LCD_CS, LOW); SPI.beginTransaction(spiSet);
  for (int y = y0; y <= y1; y += 8) {
    int n = (y1 - y + 1) < 8 ? (y1 - y + 1) : 8; const uint16_t *s = px + y * SW;
    for (int i = 0; i < n * SW; i++) rowBuf[i] = (uint16_t)((s[i] << 8) | (s[i] >> 8));
    SPI.writeBytes((const uint8_t *)rowBuf, n * SW * 2);
  }
  SPI.endTransaction(); digitalWrite(PIN_LCD_CS, HIGH);
}
static void flush(bool all = false) {
  const uint16_t *px = ui.cv.px;
  if (all || !shown) { lcdRows(px, 0, SH - 1); if (shown) memcpy(shown, px, SW * SH * 2); return; }
  // send each run of changed rows
  int y = 0;
  while (y < SH) {
    while (y < SH && !memcmp(px + y * SW, shown + y * SW, SW * 2)) y++;
    if (y >= SH) break;
    int y0 = y, gap = 0;
    while (y < SH && gap < 6) { if (memcmp(px + y * SW, shown + y * SW, SW * 2)) gap = 0; else gap++; y++; }
    int y1 = y - 1 - gap; lcdRows(px, y0, y1); memcpy(shown + y0 * SW, px + y0 * SW, (y1 - y0 + 1) * SW * 2);
  }
}
// plain text before the frame buffer exists (start-up problems): big blocky letters from the 5x7 font in ROM is
// not available, so just colour bars plus a serial message
static void say(uint16_t c, const char *msg) {
  static uint16_t line[SW]; for (int i = 0; i < SW; i++) line[i] = (uint16_t)((c << 8) | (c >> 8));
  lcdWindow(0, 0, SW - 1, SH - 1); digitalWrite(PIN_LCD_DC, HIGH); digitalWrite(PIN_LCD_CS, LOW); SPI.beginTransaction(spiSet);
  for (int y = 0; y < SH; y++) SPI.writeBytes((const uint8_t *)line, SW * 2);
  SPI.endTransaction(); digitalWrite(PIN_LCD_CS, HIGH); digitalWrite(PIN_LCD_BL, HIGH);
  Serial.println(msg);
}

// ---------- touch (CST810, rotated 90 degrees against the panel) ----------
static bool touchRead(int &x, int &y) {
  uint8_t d[5]; if (!rdn(CST810, 0x02, d, 5)) return false;
  if ((d[0] & 0x0F) == 0) return false;
  int rx = ((d[1] & 0x0F) << 8) | d[2], ry = ((d[3] & 0x0F) << 8) | d[4];
  x = constrain((ry - 12) * 180 / 211 + 30, 0, SW - 1);
  y = constrain((260 - rx) * 216 / 222 + 40, 0, SH - 1);
  return true;
}
// ---------- tilt (LIS2DH12 at 0x19; 0x18 is the codec) ----------
static bool accelInit() {
  uint8_t who = 0; if (!rdn(LIS2DH12, 0x0F, &who, 1) || who != 0x33) return false;
  wr(LIS2DH12, 0x20, 0x57); wr(LIS2DH12, 0x23, 0x88); return true;
}
static void accelRead() {
  uint8_t r[6]; if (!rdn(LIS2DH12, 0x28 | 0x80, r, 6)) return;
  int16_t ax = (int16_t)((r[1] << 8) | r[0]) >> 4, ay = (int16_t)((r[3] << 8) | r[2]) >> 4;  // ~1 mg per step
  static float fx = 0, fy = 0; fx += (-ax / 1000.f - fx) * .35f; fy += (-ay / 1000.f - fy) * .35f;  // both axes negated on this board
  env.tx = fx; env.ty = fy;
}
// the text masks are stored compressed; unpack them into PSRAM with the ROM inflate (its state is ~11 KB: heap)
static bool unpackAssets() {
  ADATA = (uint8_t *)ps_malloc(ADATA_LEN);
  tinfl_decompressor *d = (tinfl_decompressor *)malloc(sizeof(tinfl_decompressor));
  if (!ADATA || !d) return false;
  tinfl_init(d);
  size_t inLen = ADATA_ZLEN, outLen = ADATA_LEN;
  tinfl_status st = tinfl_decompress(d, ADATA_Z, &inLen, ADATA, ADATA, &outLen, TINFL_FLAG_PARSE_ZLIB_HEADER | TINFL_FLAG_USING_NON_WRAPPING_OUTPUT_BUF);
  free(d);
  Serial.printf("assets: status %d, %u of %u bytes\n", (int)st, (unsigned)outLen, (unsigned)ADATA_LEN);
  return st == TINFL_STATUS_DONE && outLen == ADATA_LEN;
}
static void setVol(int v) { v = constrain(v, 0, 10); env.vol = v; Audio::vol = v; pref.putUChar("vol", v); }

void setup() {
  pinMode(PIN_POWER_OFF, OUTPUT); digitalWrite(PIN_POWER_OFF, LOW);
  Serial.begin(115200); delay(200);
  Serial.println("Hey Tattva (Cheeko Gotchi): start");
  pinMode(PIN_POWER_KEY, INPUT); pinMode(PIN_VOL_UP, INPUT_PULLUP); pinMode(PIN_VOL_DOWN, INPUT_PULLUP);
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 400000);
  lcdInit();
  say(RGB(21, 18, 58), "starting");
  if (!psramFound()) { say(RGB(196, 38, 46), "PSRAM is off: build with PSRAM=opi"); while (1) delay(1000); }
  if (!unpackAssets()) { say(RGB(196, 38, 46), "could not unpack the assets: re-flash"); while (1) delay(1000); }
  ui.cv.px = (uint16_t *)ps_malloc(SW * SH * 2); ui.cv.bg = (uint16_t *)ps_malloc(SW * SH * 2);
  ui.cv.yantra = (uint8_t *)ps_malloc(300 * 300); shown = (uint16_t *)ps_malloc(SW * SH * 2);
  if (!ui.cv.px || !ui.cv.bg || !ui.cv.yantra || !shown) { say(RGB(196, 38, 46), "out of memory"); while (1) delay(1000); }
  ui.cv.makeBg(); ui.cv.loadYantra();
  pref.begin("hcg", false);
  env.vol = pref.getUChar("vol", 6); for (int g = 0; g < NT; g++) { char k[4] = {'b', (char)('0' + g), 0}; env.best[g] = pref.getUShort(k, 0); }
  Audio::vol = env.vol;
  accelOk = accelInit(); env.accel = accelOk;
  wr(CST810, 0xFE, 0x01);  // keep the touch chip from auto-sleeping
  ui.scrT0 = millis(); ui.frame(env); flush(true);
  digitalWrite(PIN_LCD_BL, HIGH);
  if (!Audio::begin()) Serial.println("audio init failed");
  Audio::startTask();
  Net::begin();
  lastInput = millis();
  Serial.printf("accel %s\n", accelOk ? "ok" : "missing");
}

static void wake() { lastInput = millis(); if (asleep) { asleep = false; digitalWrite(PIN_LCD_BL, HIGH); } }

void loop() {
  uint32_t now = millis();
  env.ms = now;
  Net::loop();
  // ---- touch ----
  static uint32_t lastTp = 0; static bool wasDown = false, swallow = false;
  if (now - lastTp >= 10) {
    lastTp = now; int x, y; bool d = touchRead(x, y);
    if (d) {
      if (!wasDown) { swallow = asleep; wake(); if (!swallow) ui.touchDown(x, y, now); }
      else if (!swallow) ui.touchMove(x, y);
      lastInput = now;
    } else if (wasDown && !swallow) ui.touchUp(env);
    wasDown = d;
  }
  // ---- keys: middle = back (hold 5 s: forget Wi-Fi), side keys = volume ----
  static uint32_t midDown = 0, volT = 0;
  if (digitalRead(PIN_POWER_KEY) == HIGH) { if (!midDown) midDown = now; if (now - midDown > 5000) { ui.toast("Wi-Fi forgotten", now); ui.frame(env); flush(); Net::reset(); } }
  else if (midDown) { if (now - midDown < 1500) { bool was = asleep; wake(); if (!was) ui.back(env); } midDown = 0; }
  bool up = digitalRead(PIN_VOL_UP) == LOW, dn = digitalRead(PIN_VOL_DOWN) == LOW;
  if ((up || dn) && now - volT > 220) { volT = now; wake(); setVol(env.vol + (up ? 1 : -1)); char b[20]; snprintf(b, sizeof b, "Volume %d", env.vol); ui.toast(b, now, 1000); }
  // ---- what the UI needs to know ----
  env.net = (NetSt)Net::state;
  strncpy(env.ssid, Net::ssid.c_str(), 32); env.ssid[32] = 0;
  env.rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -100;
  struct tm tmv; time_t t = time(nullptr); env.timeOk = t > 1700000000; if (env.timeOk) { localtime_r(&t, &tmv); env.hh = tmv.tm_hour; env.mm = tmv.tm_min; }
  if (accelOk) accelRead();
  env.voice = (VoiceSt)Audio::voice; env.band = (VoiceSt)Audio::band; env.voiceProg = Audio::voiceProg(); env.bedT = Audio::bedT(); env.bedLen = Audio::bedLen(); env.level = Audio::level;
  // ---- requests from the UI ----
  Act a;
  while (ui.pop(a)) {
    switch (a.t) {
      case A_REEL: Audio::reel(a.a, TTN[a.a]); break;
      case A_ROCK: Audio::rock(a.a, TTN[a.a]); break;
      case A_GAME: Audio::game(a.a); break;
      case A_PAUSE: Audio::paused = true; break;
      case A_RESUME: Audio::paused = false; break;
      case A_STOP: Audio::stop(); break;
      case A_SFX: Audio::sfx(a.a); break;
      case A_VOL: setVol(a.a); break;
      case A_BEST: { env.best[a.a] = a.b; char k[4] = {'b', (char)('0' + a.a), 0}; pref.putUShort(k, a.b); } break;
      case A_WIFI_RESET: ui.toast("Restarting...", now); ui.frame(env); flush(); Net::reset(); break;
      case A_WIFI_SKIP: Net::skip(); break;
      default: break;
    }
  }
  // ---- sleep: backlight off after three idle minutes (not while a reel plays or during setup) ----
  bool busy = ((ui.scr == SC_REEL || ui.scr == SC_ROCK) && !ui.paused) || ui.scr == SC_SETUP;
  if (busy) lastInput = now;
  if (!asleep && now - lastInput > 180000) { asleep = true; digitalWrite(PIN_LCD_BL, LOW); Audio::stop(); if (ui.scr == SC_REEL || ui.scr == SC_ROCK || ui.scr == SC_GAME) ui.go(SC_HOME, now); }
  if (asleep) { delay(20); return; }
  // ---- draw ----
  static uint32_t lastFrame = 0;
  if (now - lastFrame >= 30) { lastFrame = now; ui.frame(env); flush(); }
  else delay(2);
}
