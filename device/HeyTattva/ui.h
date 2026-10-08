// All screens and touch handling. The hardware layer fills Env each frame and carries out the Acts the UI asks for.
// No Arduino calls here, so the PC simulator renders exactly what the device shows.
#pragma once
#include <stdio.h>
#include "gfx.h"
#include "sing.h"

enum NetSt { NET_OFF, NET_CONNECTING, NET_OK, NET_PORTAL, NET_FAILED };
enum Au { AU_IDLE, AU_LOADING, AU_PLAYING, AU_ERR_NET, AU_ERR };
enum SgPhase { SG_IDLE, SG_LISTEN, SG_COUNT, SG_SING, SG_DONE };
enum Scr { SC_BOOT, SC_LANG, SC_SETUP, SC_CONNECT, SC_HOME, SC_TATTVA, SC_SING, SC_SETTINGS, SC_QR };
enum ActT { A_NONE, A_LANG, A_BRIGHT, A_PLAY, A_STOP, A_LISTEN, A_SING, A_SING_STOP, A_WIFI_RESET, A_WIFI_SKIP };
struct Act { ActT t; int a, b; };

struct Env {
  uint32_t ms = 0;
  bool timeOk = false; int hh = 0, mm = 0;
  int batt = -1; bool charging = false;
  NetSt net = NET_OFF; char ssid[33] = ""; bool haveCreds = false; int rssi = 0;
  Au audio = AU_IDLE; int audioN = 0; bool audioMeaning = false; float audioProg = 0;
  SgPhase sing = SG_IDLE; float singT = 0; float pitch = NAN; const SingScore *sc = nullptr;
  int bright = 4;  // 1..5
};

struct Btn { int x, y, w, h, id; };

struct UI {
  Canvas cv;
  int lang = -1;           // 0 en, 1 te, 2 kn, 3 hi; -1 = not chosen yet
  Scr scr = SC_BOOT;
  int n = 1, page = 0;     // tattva and page (0 verse, 1 meaning, 2 remember)
  uint32_t scrT0 = 0;
  bool skippedWifi = false;
  // slide animation between home and tattva pages
  struct Anim { bool on = false; Scr fs, ts; int fn, fp, tn, tp, dx, dy; uint32_t t0; } an;
  Btn btns[24]; int nb = 0;
  int toastKey = -1; uint32_t toastUntil = 0;
  uint32_t resetArmed = 0;
  Act q[8]; int qn = 0;
  Au lastAudio = AU_IDLE; NetSt lastNet = NET_OFF;
  // touch
  bool down = false; int tx0 = 0, ty0 = 0, tx = 0, ty = 0; uint32_t td0 = 0;
  // pitch trail for Sing
  float trailT[48], trailS[48]; int trailN = 0;
  bool dirty = true;

  int L() const { return lang < 0 ? 0 : lang; }
  int S(int key) const { return STR[L()][key]; }
  void push(ActT t, int a = 0, int b = 0) { if (qn < 8) q[qn++] = {t, a, b}; }
  bool pop(Act &a) { if (!qn) return false; a = q[0]; for (int i = 1; i < qn; i++) q[i - 1] = q[i]; qn--; return true; }
  void go(Scr s, uint32_t ms) { scr = s; scrT0 = ms; an.on = false; dirty = true; }
  void toast(int key, uint32_t ms, uint32_t dur = 2600) { toastKey = key; toastUntil = ms + dur; }
  void btn(int x, int y, int w, int h, int id) { if (nb < 24 && !an.on) btns[nb++] = {x, y, w, h, id}; }
  void slide(Scr ts, int tn, int tp, int dx, int dy, uint32_t ms) { an = {true, scr, ts, n, page, tn, tp, dx, dy, ms}; scr = ts; n = tn; page = tp; scrT0 = ms; }

  // ---------- input ----------
  void touchDown(int x, int y, uint32_t ms) { down = true; tx0 = tx = x; ty0 = ty = y; td0 = ms; }
  void touchMove(int x, int y) { tx = x; ty = y; }
  void touchUp(const Env &e) {
    if (!down) return; down = false;
    int dx = tx - tx0, dy = ty - ty0;
    if (an.on) return;
    if (abs(dx) > 45 && abs(dx) > abs(dy) * 1.2f) { swipe(dx < 0 ? 'L' : 'R', e); return; }
    if (abs(dy) > 45 && abs(dy) > abs(dx) * 1.2f) { swipe(dy < 0 ? 'U' : 'D', e); return; }
    if (abs(dx) < 18 && abs(dy) < 18) tap(tx0, ty0, e);
  }
  void swipe(char d, const Env &e) {
    uint32_t ms = e.ms;
    if (scr == SC_HOME && d == 'L') { slide(SC_TATTVA, 1, 0, -SW, 0, ms); stopAudio(e); }
    else if (scr == SC_TATTVA) {
      if (d == 'L' && n < 8) { stopAudio(e); slide(SC_TATTVA, n + 1, page, -SW, 0, ms); }
      else if (d == 'R') { stopAudio(e); if (n > 1) slide(SC_TATTVA, n - 1, page, SW, 0, ms); else slide(SC_HOME, 1, 0, SW, 0, ms); }
      else if (d == 'U' && page < 2) slide(SC_TATTVA, n, page + 1, 0, -SH, ms);
      else if (d == 'D' && page > 0) slide(SC_TATTVA, n, page - 1, 0, SH, ms);
    } else if ((scr == SC_SETTINGS || scr == SC_QR) && d == 'R') go(SC_HOME, ms);
    else if (scr == SC_SING && d == 'R' && e.sing != SG_SING && e.sing != SG_LISTEN && e.sing != SG_COUNT) go(SC_TATTVA, ms);
  }
  void stopAudio(const Env &e) { if (e.audio == AU_PLAYING || e.audio == AU_LOADING) push(A_STOP); }
  enum { B_SET = 1, B_QR, B_BACK, B_LANG0, B_LANG3 = B_LANG0 + 3, B_BR1, B_BR5 = B_BR1 + 4, B_WRESET, B_RECITE, B_MEANING, B_SINGGO, B_LISTEN, B_SINGSTART, B_STOPSING, B_SKIPWIFI, B_AGAIN, B_SINGBACK };
  void tap(int x, int y, const Env &e) {
    for (int i = 0; i < nb; i++) { Btn &b = btns[i]; if (x >= b.x - 6 && x < b.x + b.w + 6 && y >= b.y - 6 && y < b.y + b.h + 6) { press(b.id, e); return; } }
  }
  void press(int id, const Env &e) {
    uint32_t ms = e.ms; dirty = true;
    if (id == B_SET) go(SC_SETTINGS, ms);
    else if (id == B_QR) go(SC_QR, ms);
    else if (id == B_BACK) go(SC_HOME, ms);
    else if (id >= B_LANG0 && id <= B_LANG3) { int l = id - B_LANG0; bool first = scr == SC_LANG; lang = l; push(A_LANG, l); if (first) afterLang(e); }
    else if (id >= B_BR1 && id <= B_BR5) push(A_BRIGHT, id - B_BR1 + 1);
    else if (id == B_WRESET) { if (resetArmed && ms - resetArmed < 4000) { push(A_WIFI_RESET); resetArmed = 0; } else { resetArmed = ms; toast(S_TAP_AGAIN_TO_RESET, ms, 4000); } }
    else if (id == B_RECITE) { if (e.audio == AU_PLAYING && e.audioN == n && !e.audioMeaning) push(A_STOP); else push(A_PLAY, n, 0); }
    else if (id == B_MEANING) { if (e.audio == AU_PLAYING && e.audioN == n && e.audioMeaning) push(A_STOP); else push(A_PLAY, n, 1); }
    else if (id == B_SINGGO) { stopAudio(e); go(SC_SING, ms); trailN = 0; }
    else if (id == B_LISTEN) { trailN = 0; push(A_LISTEN, n); }
    else if (id == B_SINGSTART || id == B_AGAIN) { trailN = 0; push(A_SING, n); }
    else if (id == B_STOPSING) push(A_SING_STOP);
    else if (id == B_SINGBACK) { push(A_SING_STOP); go(SC_TATTVA, ms); }
    else if (id == B_SKIPWIFI) { skippedWifi = true; push(A_WIFI_SKIP); go(SC_HOME, ms); }
  }
  void afterLang(const Env &e) {
    if (e.net == NET_PORTAL && !skippedWifi) go(SC_SETUP, e.ms);
    else if (e.net == NET_CONNECTING) go(SC_CONNECT, e.ms);
    else go(SC_HOME, e.ms);
  }

  // ---------- state from the hardware ----------
  void watch(const Env &e) {
    if (e.audio != lastAudio) {
      if (e.audio == AU_ERR_NET) toast(S_THE_VOICE_NEEDS_WI_FI_THE_FIRST_TIME, e.ms, 3200);
      if (e.audio == AU_ERR) toast(S_COULDN_T_LOAD_THE_VOICE, e.ms, 3000);
      lastAudio = e.audio; dirty = true;
    }
    if (e.net != lastNet) {
      if (scr != SC_BOOT && scr != SC_LANG) {
        if (e.net == NET_PORTAL && !skippedWifi && scr != SC_SETUP) go(SC_SETUP, e.ms);
        else if (e.net == NET_CONNECTING && (scr == SC_SETUP || scr == SC_CONNECT)) go(SC_CONNECT, e.ms);
        else if (e.net == NET_OK && (scr == SC_CONNECT || scr == SC_SETUP)) { go(SC_HOME, e.ms); toast(S_CONNECTED, e.ms); }
        else if (e.net == NET_FAILED && scr == SC_CONNECT) toast(S_COULDN_T_CONNECT_OPENING_SETUP_AGAIN, e.ms, 3000);
      }
      if (e.net == NET_OK) skippedWifi = false;
      lastNet = e.net; dirty = true;
    }
    if (scr == SC_BOOT && e.ms - scrT0 > 2200) { if (lang < 0) go(SC_LANG, e.ms); else afterLang(e); }
  }

  // ---------- drawing ----------
  void statusBar(const Env &e) {
    char b[16];
    if (e.timeOk) { snprintf(b, sizeof b, "%d:%02d", e.hh % 12 ? e.hh % 12 : 12, e.mm); cv.text(b, 28, 7, C_INK, false, 26); }
    int bx = 312, by = 13;
    cv.round(bx, by, 26, 13, 3.5f, C_MUTED, 26, 1.4f); cv.fillRect(bx + 26, by + 4, 2, 5, C_MUTED, 26);
    if (e.batt >= 0) { int w = (e.batt * 20 + 50) / 100; cv.round(bx + 3, by + 3, w < 2 ? 2 : w, 7, 1.5f, e.batt <= 15 && !e.charging ? C_KUM : e.charging ? C_GOLD : C_INK, 30); snprintf(b, sizeof b, "%d%%", e.batt); cv.text(b, bx - 6 - Canvas::textW(b), 7, C_INK, false, 26); }
    // wifi bars
    int wx = 254 - (e.batt >= 0 ? 0 : -40);
    for (int i = 0; i < 3; i++) { int h = 4 + i * 4; bool on = e.net == NET_OK && (i == 0 || e.rssi > (i == 1 ? -75 : -62)); cv.round(wx + i * 6, 25 - h, 4, h, 1.5f, on ? C_INK : C_MUTED, on ? 28 : 9); }
  }
  int spinX = -1;
  void pill(int x, int y, int w, int h, int icon, int strItem, bool gold, bool kum = false, float prog = -1) {
    uint16_t bg = gold ? C_GOLD : kum ? C_KUM : C_PANEL2, fg = gold ? C_NIGHT : C_INK;
    cv.round(x, y, w, h, h * .5f, bg, gold || kum ? 32 : 30);
    if (!gold && !kum) cv.round(x, y, w, h, h * .5f, C_CHANDAN, 7, 1.2f);
    if (prog >= 0) { cv.setClip(x, y, x + (int)(w * prog), y + h); cv.round(x, y, w, h, h * .5f, C_GOLD, 10); cv.noClip(); }
    int lw = strItem >= 0 ? Canvas::itemW(strItem) - Canvas::itemX0(strItem) : 0, iw = icon >= 0 ? 30 : 0, gap = icon >= 0 && strItem >= 0 ? 4 : 0;
    spinX = -1;
    if (icon == -2) iw = 26, gap = 2;
    if (iw + gap + lw > w - 12) iw = 0, gap = 0;
    int x0 = x + (w - (iw + gap + lw)) / 2;
    if (iw && icon >= 0) cv.item(ICON[icon], x0 - 4, y + (h - 38) / 2, fg);
    if (iw && icon == -2) spinX = x0 + 11;
    if (strItem >= 0) cv.item(strItem, x0 + iw + gap - Canvas::itemX0(strItem), y + (h - (Canvas::itemH(strItem) - Canvas::itemY0(strItem))) / 2 - Canvas::itemY0(strItem), fg);
  }
  void drawToast(const Env &e) {
    if (toastKey < 0 || e.ms > toastUntil) return;
    int it = S(toastKey), w = Canvas::itemW(it) - Canvas::itemX0(it), h = Canvas::itemH(it) - Canvas::itemY0(it);
    int bw = w + 36, bh = h + 22, x = (SW - bw) / 2, y = 318 - bh / 2;
    cv.round(x, y, bw, bh, 18, C_DEEP, 30); cv.round(x, y, bw, bh, 18, C_GOLD, 14, 1.4f);
    cv.itemC(it, SW / 2, y + 11, C_INK);
  }
  // one screen's moving content (for slides)
  void content(Scr s, int tn, int tp, int ox, int oy, const Env &e) {
    if (s == SC_HOME) home(ox, oy, e);
    else if (s == SC_TATTVA) tattva(tn, tp, ox, oy, e);
  }
  void home(int ox, int oy, const Env &e) {
    float t = e.ms / 1000.f;
    cv.glow(184 + ox, 196 + oy, 170, C_GOLD, .10f);
    cv.yantraAt(184 + ox, 196 + oy, 300, t * .12f, C_GOLD, 13);
    if (e.timeOk) { char b[8]; snprintf(b, sizeof b, "%d:%02d", e.hh % 12 ? e.hh % 12 : 12, e.mm); cv.big(b, 184 + ox, 148 + oy, C_INK); }
    else cv.itemC(IT_OM, 184 + ox, 158 + oy, C_GOLD);
    cv.itemC(IT_BRAND, 184 + ox, 288 + oy, C_INK);
    cv.itemC(IT_BRAND_DEV, 184 + ox, 340 + oy, C_GOLD);
    int si = S(S_SWIPE_TO_BEGIN); float k = fmodf(t, 1.6f) / 1.6f;
    cv.itemC(si, 184 + ox - 10, 398 + oy, C_MUTED);
    int ax = 184 + ox + (Canvas::itemW(si) - Canvas::itemX0(si)) / 2 + (int)(k * 10);
    cv.item(ICON[IC_RIGHT], ax - 8, 388 + oy, C_GOLD, (uint32_t)(32 * (1 - k)));
    cv.item(ICON[IC_GEAR], 318 + ox, 392 + oy, C_MUTED); btn(314, 388, 44, 44, B_SET);
    cv.item(ICON[IC_QR], 14 + ox, 392 + oy, C_MUTED); btn(10, 388, 44, 44, B_QR);
  }
  void tattva(int tn, int tp, int ox, int oy, const Env &e) {
    cv.item(PAGE[L()][tn - 1][tp], ox, oy);
    for (int i = 0; i < 3; i++) cv.disc(356 + ox, 206 + i * 16 + oy, i == tp ? 4.f : 3.f, i == tp ? C_GOLD : C_MUTED, i == tp ? 32 : 12);
    // bottom buttons
    bool playV = e.audioN == tn && !e.audioMeaning && (e.audio == AU_PLAYING || e.audio == AU_LOADING), playM = e.audioN == tn && e.audioMeaning && (e.audio == AU_PLAYING || e.audio == AU_LOADING);
    int y = 380 + oy;
    bool ld = e.audio == AU_LOADING;
    pill(8 + ox, y, 113, 52, playV ? (ld ? -2 : IC_STOP) : IC_PLAY, S(playV && !ld ? S_STOP : S_RECITE), false, playV && !ld, playV && !ld ? e.audioProg : -1);
    pill(127 + ox, y, 113, 52, playM ? (ld ? -2 : IC_STOP) : IC_BOOK, S(playM && !ld ? S_STOP : S_MEANING), false, playM && !ld, playM && !ld ? e.audioProg : -1);
    int sp = -1;
    pill(246 + ox, y, 113, 52, IC_MIC, S(S_SING), true);
    if ((playV || playM) && ld) { pill(playV ? 8 + ox : 127 + ox, y, 113, 52, -2, S(playV ? S_RECITE : S_MEANING), false); sp = spinX; }
    if (sp >= 0) { float a = e.ms / 160.f; int cx = sp; for (int i = 0; i < 8; i++) cv.disc(cx + cosf(a + i * .785f) * 8, y + 26 + sinf(a + i * .785f) * 8, 1.6f, C_GOLD, 4 + i * 3); }
    btn(8, 380, 113, 52, B_RECITE); btn(127, 380, 113, 52, B_MEANING); btn(246, 380, 113, 52, B_SINGGO);
  }
  void langScreen(const Env &e) {
    float t = e.ms / 1000.f;
    cv.yantraAt(184, 76, 150, t * .1f, C_GOLD, 9);
    cv.itemC(IT_OM, 184, 50, C_GOLD);
    cv.itemC(S(S_CHOOSE_YOUR_LANGUAGE), 184, 156, C_INK);
    for (int i = 0; i < 4; i++) {
      int x = 20 + (i % 2) * 170, y = 206 + (i / 2) * 84; bool on = lang == i;
      cv.round(x, y, 158, 70, 20, on ? C_GOLD : C_PANEL2, 32); if (!on) cv.round(x, y, 158, 70, 20, C_CHANDAN, 8, 1.4f);
      int it = LANGN[i]; cv.item(it, x + 79 - (Canvas::itemW(it) + Canvas::itemX0(it)) / 2, y + 35 - (Canvas::itemH(it) + Canvas::itemY0(it)) / 2, on ? C_NIGHT : C_INK);
      btn(x, y, 158, 70, B_LANG0 + i);
    }
  }
  void setupScreen(const Env &e) {
    cv.itemC(S(S_SET_UP_WI_FI), 184, 30, C_INK);
    int a = S(S_ON_YOUR_PHONE_JOIN_THIS_WI_FI); cv.itemC(a, 184, 66, C_MUTED);
    int y = 66 + Canvas::itemH(a) - Canvas::itemY0(a) + 8;
    cv.textC("HeyTattva-Setup", 184, y, C_GOLD, true); y += 40;
    int qs = Canvas::qrSize(QR_WIFI_N, 5); cv.qr(QR_WIFI_BITS, QR_WIFI_N, 184 - qs / 2, y, 5); y += qs + 12;
    int b = S(S_A_PAGE_OPENS_PICK_YOUR_WI_FI_AND_TYPE_IT); cv.itemC(b, 184, y, C_INK); y += Canvas::itemH(b) - Canvas::itemY0(b) + 6;
    cv.itemC(S(S_NO_PAGE_OPEN_192_168_4_1), 184, y, C_MUTED);
    if (e.haveCreds || true) { int s = S(S_USE_WITHOUT_WI_FI); int w = Canvas::itemW(s) - Canvas::itemX0(s); cv.itemC(s, 184, 414, C_GOLD, 26); btn(184 - w / 2 - 10, 406, w + 20, 34, B_SKIPWIFI); }
  }
  void connectScreen(const Env &e) {
    float t = e.ms / 1000.f;
    cv.glow(184, 190, 130, C_GOLD, .12f);
    cv.yantraAt(184, 190, 220, t * .9f, C_GOLD, 18);
    cv.itemC(S(S_CONNECTING), 184, 330, C_INK);
    if (e.ssid[0]) cv.textC(e.ssid, 184, 366, C_MUTED);
  }
  void settings(const Env &e) {
    statusBar(e);
    cv.item(ICON[IC_BACK], 14, 40, C_INK); btn(10, 36, 44, 44, B_BACK);
    int st = S(S_SETTINGS); cv.item(st, 60 - Canvas::itemX0(st), 46 - Canvas::itemY0(st), C_INK);
    int ll = S(S_LANGUAGE); cv.item(ll, 22 - Canvas::itemX0(ll), 96 - Canvas::itemY0(ll), C_GOLD);
    for (int i = 0; i < 4; i++) {
      int x = 20 + (i % 2) * 170, y = 122 + (i / 2) * 58; bool on = L() == i;
      cv.round(x, y, 158, 50, 16, on ? C_GOLD : C_PANEL2, 32); if (!on) cv.round(x, y, 158, 50, 16, C_CHANDAN, 8, 1.2f);
      int it = LANGN[i]; cv.item(it, x + 79 - (Canvas::itemW(it) + Canvas::itemX0(it)) / 2, y + 25 - (Canvas::itemH(it) + Canvas::itemY0(it)) / 2, on ? C_NIGHT : C_INK);
      btn(x, y, 158, 50, B_LANG0 + i);
    }
    int bl = S(S_BRIGHTNESS); cv.item(bl, 22 - Canvas::itemX0(bl), 248 - Canvas::itemY0(bl), C_GOLD);
    cv.item(ICON[IC_SUN], 16, 270, C_INK);
    for (int i = 0; i < 5; i++) { int x = 62 + i * 58; bool on = i < e.bright; cv.round(x, 278, 52, 22, 11, on ? C_GOLD : C_PANEL2, on ? 32 : 30); btn(x, 270, 54, 38, B_BR1 + i); }
    cv.item(ICON[IC_WIFI], 16, 316, e.net == NET_OK ? C_INK : C_MUTED);
    if (e.net == NET_OK && e.ssid[0]) cv.text(e.ssid, 60, 322, C_INK);
    else { int nw = S(S_NO_WI_FI); cv.item(nw, 60 - Canvas::itemX0(nw), 326 - Canvas::itemY0(nw), C_MUTED); }
    pill(20, 374, 158, 54, -1, S(S_RESET_WI_FI), false); btn(20, 374, 158, 54, B_WRESET);
    pill(190, 374, 158, 54, IC_QR, S(S_OPEN_ON_PHONE), false); btn(190, 374, 158, 54, B_QR);
  }
  void qrScreen(const Env &e) {
    cv.item(ICON[IC_BACK], 14, 30, C_INK); btn(10, 26, 44, 44, B_BACK);
    cv.itemC(S(S_OPEN_ON_PHONE), 184, 36, C_INK);
    int qs = Canvas::qrSize(QR_SITE_N, 9); if (qs > 270) qs = Canvas::qrSize(QR_SITE_N, 8);
    int mod = qs == Canvas::qrSize(QR_SITE_N, 9) ? 9 : 8;
    cv.qr(QR_SITE_BITS, QR_SITE_N, 184 - qs / 2, 80, mod);
    int cy = 80 + qs + 14; int s = S(S_SCAN_TO_OPEN_HEY_TATTVA_ON_YOUR_PHONE); cv.itemC(s, 184, cy, C_MUTED);
    cv.textC("heytattva.vercel.app", 184, cy + Canvas::itemH(s) - Canvas::itemY0(s) + 8, C_GOLD);
  }
  // ---- Sing ----
  int semiMin = -3, semiMax = 12;
  void singRange(int tn) { const Tune &t = TUNE[tn]; semiMin = 99; semiMax = -99; for (int i = 0; i < t.n; i++) { if (t.notes[i].semi < semiMin) semiMin = t.notes[i].semi; if (t.notes[i].semi > semiMax) semiMax = t.notes[i].semi; } semiMin -= 1; semiMax += 1; }
  float laneY(float semi) const { const int y0 = 74, y1 = 300; return y1 - (semi - semiMin) / (float)(semiMax - semiMin) * (y1 - y0); }
  void singScreen(const Env &e) {
    const Tune &tu = TUNE[n]; singRange(n);
    const float pps = 120.f, px0 = 96.f, spb = 60.f / tu.bpm;
    float now = (e.sing == SG_IDLE || e.sing == SG_COUNT) ? -0.8f : e.singT;
    if (e.sing == SG_DONE) now = -0.8f;
    cv.item(ICON[IC_BACK], 14, 18, C_INK); btn(10, 14, 44, 44, B_SINGBACK);
    int si = S(S_SING); cv.item(si, 58 - Canvas::itemX0(si), 26 - Canvas::itemY0(si), C_INK);
    char b[24]; snprintf(b, sizeof b, "%d", n); int sx = 58 + Canvas::itemW(si) - Canvas::itemX0(si) + 10;
    cv.item(SYM[n], sx, 18, C_GOLD); cv.text(b, sx + 44, 24, C_GOLD, true);
    // lane
    cv.round(10, 64, 348, 248, 18, C_DEEP, 22);
    for (int s : {0, 7, 12}) if (s >= semiMin && s <= semiMax) cv.fillRect(14, (int)laneY(s), 340, 1, s == 7 ? C_MUTED : C_GOLD, 7);
    cv.setClip(12, 66, 356, 310);
    int cur = -1;
    for (int i = 0; i < tu.n; i++) {
      const Note &no = tu.notes[i]; float t0 = no.start / 4.f * spb, t1 = (no.start + no.len) / 4.f * spb;
      int x = (int)(px0 + (t0 - now) * pps), w = (int)((t1 - t0) * pps) - 4;
      if (x > 360 || x + w < 10) continue;
      int y = (int)laneY(no.semi) - 7;
      uint8_t st = e.sc && e.sing != SG_IDLE ? e.sc->st[i] : 0;
      bool isCur = now >= t0 && now < t1; if (isCur) cur = i;
      uint16_t c = st == 1 ? C_GOLD : st == 2 ? C_KUM : isCur ? C_INK : C_PANEL2;
      cv.round(x, y, w < 8 ? 8 : w, 14, 7, c, st == 2 ? 18 : 32);
      if (st == 0 && !isCur) cv.round(x, y, w < 8 ? 8 : w, 14, 7, C_CHANDAN, 10, 1.2f);
      cv.item(SYLI[no.syl], x - 2, y - 26, st == 1 ? C_GOLD : C_MUTED, isCur ? 32 : 22);
    }
    cv.fillRect((int)px0, 68, 2, 240, C_GOLD, 14);
    // pitch trail (folded to the octave nearest the current note)
    if (e.sing == SG_SING) {
      if (!isnan(e.pitch) && (trailN == 0 || trailT[(trailN - 1) % 48] != e.singT)) { trailT[trailN % 48] = e.singT; trailS[trailN % 48] = e.pitch; trailN++; }
      float off = e.sc ? e.sc->offset : 0;
      for (int k = trailN > 48 ? trailN - 48 : 0; k < trailN; k++) {
        float dt = now - trailT[k % 48]; if (dt > 0.75f) continue;
        float s = trailS[k % 48] - off; float ref = cur >= 0 ? tu.notes[cur].semi : 5; while (s - ref > 6) s -= 12; while (s - ref < -6) s += 12;
        cv.disc(px0 - dt * pps, laneY(s), 4.5f, C_INK, (uint32_t)(32 * (1 - dt / .75f)));
      }
    }
    cv.noClip();
    // bottom
    if (e.sing == SG_IDLE) {
      int h = S(S_LISTEN_FIRST_THEN_SING_ANY_KEY_WORKS); cv.itemC(h, 184, 322, C_MUTED);
      pill(20, 380, 158, 52, IC_MUSIC, S(S_LISTEN), false); btn(20, 380, 158, 52, B_LISTEN);
      pill(190, 380, 158, 52, IC_MIC, S(S_SING), true); btn(190, 380, 158, 52, B_SINGSTART);
    } else if (e.sing == SG_LISTEN) {
      cv.itemC(S(S_PLAYING), 184, 330, C_MUTED);
      pill(105, 380, 158, 52, IC_STOP, S(S_STOP), false, true, e.singT / (tu.total4 / 4.f * spb)); btn(105, 380, 158, 52, B_STOPSING);
    } else if (e.sing == SG_COUNT) {
      char c[4]; snprintf(c, sizeof c, "%d", (int)ceilf(-e.singT) < 1 ? 1 : (int)ceilf(-e.singT));
      cv.round(124, 120, 120, 120, 60, C_NIGHT, 26); cv.big(c, 184, 128, C_GOLD);
      cv.itemC(S(S_GET_READY), 184, 330, C_INK);
    } else if (e.sing == SG_SING) {
      int nh = S(S_NOTES_HIT); cv.item(nh, 30 - Canvas::itemX0(nh), 330 - Canvas::itemY0(nh), C_MUTED);
      snprintf(b, sizeof b, "%d / %d", e.sc ? e.sc->hits : 0, tu.n); cv.text(b, 30, 352, C_INK, true);
      pill(190, 380, 158, 52, IC_STOP, S(S_STOP), false, true, e.singT / (tu.total4 / 4.f * spb)); btn(190, 380, 158, 52, B_STOPSING);
    } else if (e.sing == SG_DONE) {
      int sc = e.sc ? e.sc->score() : 0; bool pass = sc >= 80;
      cv.round(24, 70, 320, 296, 26, C_NIGHT, 30); cv.round(24, 70, 320, 296, 26, pass ? C_GOLD : C_CHANDAN, 14, 1.6f);
      int sl = S(S_SCORE); cv.itemC(sl, 184, 92, C_MUTED);
      snprintf(b, sizeof b, "%d%%", sc); cv.big(b, 184, 120, pass ? C_GOLD : C_INK);
      cv.itemC(S(pass ? S_PASSED : S_TRY_AGAIN), 184, 236, pass ? C_GOLD : C_INK);
      int nh = S(S_NOTES_HIT); snprintf(b, sizeof b, "%d / %d", e.sc ? e.sc->hits : 0, tu.n);
      int w1 = Canvas::itemW(nh) - Canvas::itemX0(nh), w2 = Canvas::textW(b), x = 184 - (w1 + 10 + w2) / 2;
      cv.item(nh, x - Canvas::itemX0(nh), 296 - Canvas::itemY0(nh), C_MUTED); cv.text(b, x + w1 + 10, 292, C_INK);
      pill(20, 380, 158, 52, IC_BACK, S(S_VERSE), false); btn(20, 380, 158, 52, B_SINGBACK);
      pill(190, 380, 158, 52, IC_MIC, S(S_SING), true); btn(190, 380, 158, 52, B_AGAIN);
    }
  }
  void boot(const Env &e) {
    float t = (e.ms - scrT0) / 1000.f, k = fminf(1.f, t / 1.4f), ease = 1 - powf(1 - k, 3);
    cv.glow(184, 180, 160 * ease + 1, C_GOLD, .14f * ease);
    cv.yantraAt(184, 180, 120 + 140 * ease, (1 - ease) * 2.2f + t * .1f, C_GOLD, (uint32_t)(28 * ease));
    uint32_t a = (uint32_t)(32 * fminf(1.f, fmaxf(0.f, (t - .7f) / .7f)));
    cv.itemC(IT_BRAND, 184, 322, C_INK, a); cv.itemC(IT_BRAND_DEV, 184, 374, C_GOLD, a);
  }

  // returns true when the frame changed (always true while something moves)
  bool frame(const Env &e) {
    watch(e);
    nb = 0;
    cv.clearBg();
    if (an.on) {
      float k = fminf(1.f, (e.ms - an.t0) / 280.f), q = 1 - powf(1 - k, 3);
      int fx = (int)(an.dx * q), fy = (int)(an.dy * q), tx = (int)(an.dx * (q - 1)), ty = (int)(an.dy * (q - 1));
      content(an.fs, an.fn, an.fp, fx, fy, e); content(an.ts, an.tn, an.tp, tx, ty, e);
      statusBar(e);
      if (k >= 1) { an.on = false; dirty = true; }
      return true;
    }
    switch (scr) {
      case SC_BOOT: boot(e); break;
      case SC_LANG: langScreen(e); break;
      case SC_SETUP: setupScreen(e); break;
      case SC_CONNECT: connectScreen(e); break;
      case SC_HOME: home(0, 0, e); statusBar(e); break;
      case SC_TATTVA: tattva(n, page, 0, 0, e); statusBar(e); break;
      case SC_SING: singScreen(e); break;
      case SC_SETTINGS: settings(e); break;
      case SC_QR: qrScreen(e); break;
    }
    drawToast(e);
    bool moving = scr == SC_BOOT || scr == SC_HOME || scr == SC_LANG || scr == SC_CONNECT || scr == SC_SING || e.audio == AU_LOADING || e.audio == AU_PLAYING || (toastKey >= 0 && e.ms < toastUntil + 100);
    bool r = moving || dirty; dirty = false; return r;
  }
};
