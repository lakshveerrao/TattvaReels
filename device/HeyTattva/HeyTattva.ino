/* Hey Tattva for the Waveshare ESP32-S3-Touch-AMOLED-1.8 (V1: SH8601 + FT3168, V2: CO5300 + CST820, found
   automatically). The eight tattvas of the Dakṣiṇāmūrti Aṣṭakam in English, Telugu, Kannada and Hindi: verse,
   meaning and key points; the recitation through the speaker; Sing mode with live pitch scoring; Wi-Fi setup from
   a phone. Board: "Waveshare ESP32-S3-Touch-AMOLED-1.8", PSRAM Enabled, Flash 16MB. See README.md. */
#include <Arduino.h>
#include <Wire.h>
#include <Arduino_GFX_Library.h>
#include <Preferences.h>
#include "ui.h"
#include "net.h"
#include "audio.h"
#include "miniz.h"  // ESP32 ROM inflate

#define LCD_SDIO0 4
#define LCD_SDIO1 5
#define LCD_SDIO2 6
#define LCD_SDIO3 7
#define LCD_SCLK 11
#define LCD_CS 12
#define IIC_SDA 15
#define IIC_SCL 14
#define BOOT_PIN 0
#define EXPANDER 0x20
#define PMU 0x34

static Arduino_DataBus *bus = nullptr;
static Arduino_OLED *gfx = nullptr;
static int boardV = 2; static uint8_t tpAddr = 0x15;
static UI ui; static Env env; static Preferences pref;
static const uint8_t BRIGHT[6] = {0, 40, 90, 140, 200, 255};
static uint32_t lastInput = 0; static int dimState = 0;  // 0 on, 1 dim, 2 off

// ---------- I2C helpers ----------
static bool probe(uint8_t a) { Wire.beginTransmission(a); return Wire.endTransmission() == 0; }
static void wr(uint8_t a, uint8_t r, uint8_t v) { Wire.beginTransmission(a); Wire.write(r); Wire.write(v); Wire.endTransmission(); }
static int rd(uint8_t a, uint8_t r) { Wire.beginTransmission(a); Wire.write(r); if (Wire.endTransmission(false)) return -1; if (Wire.requestFrom(a, (uint8_t)1) != 1) return -1; return Wire.read(); }
static bool rdn(uint8_t a, uint8_t r, uint8_t *b, int n) { Wire.beginTransmission(a); Wire.write(r); if (Wire.endTransmission(false)) return false; if (Wire.requestFrom(a, (uint8_t)n) != n) return false; for (int i = 0; i < n; i++) b[i] = Wire.read(); return true; }

// the TCA9554/XCA9554 expander resets the display and touch (pins 0–2)
static void expanderReset() {
  if (!probe(EXPANDER)) return;
  wr(EXPANDER, 0x01, 0x00); wr(EXPANDER, 0x03, 0xF8); delay(20);
  wr(EXPANDER, 0x01, 0x07); delay(120);
}
static void pmuInit() {
  if (!probe(PMU)) return;
  int v = rd(PMU, 0x18); if (v >= 0) wr(PMU, 0x18, v | 0x08);  // fuel gauge on
  v = rd(PMU, 0x68); if (v >= 0) wr(PMU, 0x68, v | 0x01);     // battery detection on
  v = rd(PMU, 0x30); if (v >= 0) wr(PMU, 0x30, v | 0x01);     // battery voltage ADC on
}
static void pmuRead() {
  int st0 = rd(PMU, 0x00), st1 = rd(PMU, 0x01), pct = rd(PMU, 0xA4);
  bool present = st0 >= 0 && (st0 & 0x08);
  env.batt = present && pct >= 0 && pct <= 100 ? pct : -1;
  env.charging = st1 >= 0 && ((st1 >> 5) & 3) == 1;
}
static bool touchRead(int &x, int &y) {
  uint8_t b[5]; if (!rdn(tpAddr, 0x02, b, 5)) return false;
  if ((b[0] & 0x0F) == 0) return false;
  x = ((b[1] & 0x0F) << 8) | b[2]; y = ((b[3] & 0x0F) << 8) | b[4];
  return x < SW + 20 && y < SH + 20;
}
static void setBright(int lvl) { env.bright = lvl < 1 ? 1 : lvl > 5 ? 5 : lvl; gfx->setBrightness(BRIGHT[env.bright]); pref.putUChar("bright", env.bright); }
static void flush() { gfx->draw16bitRGBBitmap(0, 0, ui.cv.px, SW, SH); }

void setup() {
  Serial.begin(115200);
  Wire.begin(IIC_SDA, IIC_SCL, 400000);
  expanderReset();
  // V1 has an FT3168 touch chip at 0x38, V2 a CST820 at 0x15
  if (probe(0x38)) { boardV = 1; tpAddr = 0x38; wr(0x38, 0xA5, 0x01); }
  else { boardV = 2; tpAddr = 0x15; if (probe(0x15)) wr(0x15, 0xFE, 0x01); }  // keep the CST820 awake
  bus = new Arduino_ESP32QSPI(LCD_CS, LCD_SCLK, LCD_SDIO0, LCD_SDIO1, LCD_SDIO2, LCD_SDIO3);
  if (boardV == 1) gfx = new Arduino_SH8601(bus, GFX_NOT_DEFINED, 0, SW, SH);
  else gfx = new Arduino_CO5300(bus, GFX_NOT_DEFINED, 0, SW, SH, 16, 0, 0, 0);
  gfx->begin();
  gfx->fillScreen(0);
  pref.begin("heytattva", false);
  ui.lang = pref.getChar("lang", -1);
  env.bright = pref.getUChar("bright", 4);
  gfx->setBrightness(BRIGHT[env.bright]);
  ADATA = (uint8_t *)ps_malloc(ADATA_LEN);
  if (ADATA) tinfl_decompress_mem_to_mem(ADATA, ADATA_LEN, ADATA_Z, ADATA_ZLEN, TINFL_FLAG_PARSE_ZLIB_HEADER);
  ui.cv.px = (uint16_t *)ps_malloc(SW * SH * 2);
  ui.cv.bg = (uint16_t *)ps_malloc(SW * SH * 2);
  ui.cv.yantra = (uint8_t *)ps_malloc(300 * 300);
  if (!ADATA || !ui.cv.px || !ui.cv.bg || !ui.cv.yantra) { Serial.println("PSRAM missing: set Tools > PSRAM > Enabled"); while (1) delay(1000); }
  ui.cv.makeBg(); ui.cv.loadYantra();
  pinMode(BOOT_PIN, INPUT_PULLUP);
  pmuInit(); pmuRead();
  ui.scrT0 = millis();
  if (!Audio::begin()) Serial.println("audio init failed");
  Audio::startTask();
  Net::begin();
  lastInput = millis();
  Serial.printf("Hey Tattva: board V%d, touch 0x%02X\n", boardV, tpAddr);
}

static void wake() { lastInput = millis(); if (dimState) { if (dimState == 2) gfx->displayOn(); gfx->setBrightness(BRIGHT[env.bright]); dimState = 0; ui.dirty = true; } }

void loop() {
  uint32_t now = millis();
  env.ms = now;
  Net::loop();
  // ---- touch ----
  static uint32_t lastTp = 0; static bool wasDown = false, swallow = false;
  if (now - lastTp >= 12) {
    lastTp = now; int x, y; bool d = touchRead(x, y);
    if (d) {
      if (!wasDown) { swallow = dimState != 0; wake(); if (!swallow) ui.touchDown(x, y, now); }
      else if (!swallow) ui.touchMove(x, y);
      lastInput = now;
    } else if (wasDown && !swallow) ui.touchUp(env);
    wasDown = d;
  }
  // ---- BOOT button: tap = home, hold 5 s = forget Wi-Fi ----
  static uint32_t bootDown = 0;
  if (digitalRead(BOOT_PIN) == LOW) { if (!bootDown) bootDown = now; if (now - bootDown > 5000) { ui.toast(S_SAVED_RESTARTING, now); ui.frame(env); flush(); Net::reset(); } }
  else if (bootDown) { if (now - bootDown < 1500) { wake(); if (ui.scr != SC_BOOT && ui.scr != SC_LANG && ui.scr != SC_SETUP) { Audio::stop(); ui.go(SC_HOME, now); } } bootDown = 0; }
  // ---- what the UI needs to know ----
  env.net = (NetSt)Net::state; env.haveCreds = Net::haveCreds();
  strncpy(env.ssid, Net::ssid.c_str(), 32); env.ssid[32] = 0;
  env.rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -100;
  struct tm tmv; time_t t = time(nullptr); env.timeOk = t > 1700000000; if (env.timeOk) { localtime_r(&t, &tmv); env.hh = tmv.tm_hour; env.mm = tmv.tm_min; }
  static uint32_t lastPmu = 0; if (now - lastPmu > 5000) { lastPmu = now; pmuRead(); }
  env.audio = (Au)Audio::status; env.audioN = Audio::curN; env.audioMeaning = Audio::curMeaning; env.audioProg = Audio::progress();
  env.sing = (SgPhase)Audio::singPhase; env.singT = Audio::singT; env.pitch = Audio::pitch; env.sc = &Audio::sc;
  // ---- requests from the UI ----
  Act a;
  while (ui.pop(a)) {
    switch (a.t) {
      case A_LANG: pref.putChar("lang", a.a); break;
      case A_BRIGHT: setBright(a.a); break;
      case A_PLAY: Audio::play(a.a, a.b); break;
      case A_STOP: Audio::stop(); break;
      case A_LISTEN: Audio::listen(a.a); break;
      case A_SING: Audio::sing(a.a); break;
      case A_SING_STOP: Audio::stop(); break;
      case A_WIFI_RESET: ui.toast(S_SAVED_RESTARTING, now); ui.frame(env); flush(); Net::reset(); break;
      case A_WIFI_SKIP: Net::skip(); break;
      default: break;
    }
  }
  // ---- sleep: dim after a minute, screen off after three (not while playing or singing) ----
  bool busy = env.audio == AU_PLAYING || env.audio == AU_LOADING || env.sing == SG_LISTEN || env.sing == SG_COUNT || env.sing == SG_SING || ui.scr == SC_SETUP;
  if (busy) lastInput = now;
  if (dimState == 0 && now - lastInput > 60000) { gfx->setBrightness(BRIGHT[1] / 2); dimState = 1; }
  if (dimState == 1 && now - lastInput > 180000) { gfx->displayOff(); dimState = 2; }
  if (dimState == 2) { delay(20); return; }
  // ---- draw ----
  static uint32_t lastFrame = 0;
  if (now - lastFrame >= 33) { lastFrame = now; if (ui.frame(env)) flush(); }
  else delay(2);
}
