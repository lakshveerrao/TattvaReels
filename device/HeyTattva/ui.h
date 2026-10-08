// Hey Tattva device screens, minimal: few things per screen, big buttons (at least 52 px, most 68–80 px), big text.
// Home → Learn (8 tiles) → a tattva (Verse · Meaning · Idea, Listen, Sing) · Sing (match the note) · Settings.
// The hardware layer fills Env each frame and carries out the Acts. No Arduino calls, so the PC simulator draws
// exactly what the device shows.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include "gfx.h"
#include "sing.h"

enum NetSt { NET_OFF, NET_CONNECTING, NET_OK, NET_PORTAL, NET_FAILED };
enum Au { AU_IDLE, AU_LOADING, AU_PLAYING, AU_ERR_NET, AU_ERR };
enum SgPhase { SG_IDLE, SG_LISTEN, SG_COUNT, SG_SING, SG_DONE };
enum Scr { SC_BOOT, SC_LANG, SC_SETUP, SC_CONNECT, SC_HOME, SC_PICK, SC_TATTVA, SC_SING, SC_SETTINGS, SC_QR };
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
  Scr scr = SC_BOOT, langBack = SC_HOME;
  int n = 1, page = 0;     // tattva, tab (0 verse, 1 meaning, 2 idea)
  bool pickSing = false;   // the picker opens Sing instead of the tattva
  uint32_t scrT0 = 0;
  bool skippedWifi = false;
  struct Anim { bool on = false; int fn, tn, dx; uint32_t t0; } an;  // slide between tattvas
  Btn btns[24]; int nb = 0;
  int toastKey = -1; uint32_t toastUntil = 0;
  uint32_t resetArmed = 0;
  Act q[8]; int qn = 0;
  Au lastAudio = AU_IDLE; NetSt lastNet = NET_OFF;
  bool down = false; int tx0 = 0, ty0 = 0, tx = 0, ty = 0; uint32_t td0 = 0;
  int pressId = -1;        // the button under the finger, drawn pressed
  // Sing: how long the voice has been on the current note
  int curNote = -1; float lastT = 0, okSec = 0;
  bool dirty = true;

  int L() const { return lang < 0 ? 0 : lang; }
  int S(int key) const { return STR[L()][key]; }
  void push(ActT t, int a = 0, int b = 0) { if (qn < 8) q[qn++] = {t, a, b}; }
  bool pop(Act &a) { if (!qn) return false; a = q[0]; for (int i = 1; i < qn; i++) q[i - 1] = q[i]; qn--; return true; }
  void go(Scr s, uint32_t ms) { scr = s; scrT0 = ms; an.on = false; dirty = true; }
  void toast(int key, uint32_t ms, uint32_t dur = 2600) { toastKey = key; toastUntil = ms + dur; }
  void btn(int x, int y, int w, int h, int id) { if (nb < 24 && !an.on) btns[nb++] = {x, y, w, h, id}; }
  int hit(int x, int y) const { for (int i = 0; i < nb; i++) { const Btn &b = btns[i]; if (x >= b.x - 6 && x < b.x + b.w + 6 && y >= b.y - 6 && y < b.y + b.h + 6) return b.id; } return -1; }

  // ---------- input ----------
  void touchDown(int x, int y, uint32_t ms) { down = true; tx0 = tx = x; ty0 = ty = y; td0 = ms; pressId = hit(x, y); dirty = true; }
  void touchMove(int x, int y) { tx = x; ty = y; if (abs(tx - tx0) > 18 || abs(ty - ty0) > 18) { if (pressId >= 0) dirty = true; pressId = -1; } }
  void touchUp(const Env &e) {
    if (!down) return; down = false; int pid = pressId; pressId = -1; dirty = true;
    int dx = tx - tx0, dy = ty - ty0;
    if (an.on) return;
    if (abs(dx) > 50 && abs(dx) > abs(dy) * 1.3f) { swipe(dx < 0 ? 'L' : 'R', e); return; }
    if (abs(dx) < 18 && abs(dy) < 18 && pid >= 0) press(pid, e);
  }
  void stopAudio(const Env &e) { if (e.audio == AU_PLAYING || e.audio == AU_LOADING) push(A_STOP); }
  bool singBusy(const Env &e) const { return e.sing == SG_SING || e.sing == SG_LISTEN || e.sing == SG_COUNT; }
  void swipe(char d, const Env &e) {
    uint32_t ms = e.ms;
    if (scr == SC_TATTVA) {
      if (d == 'L' && n < 8) { stopAudio(e); an = {true, n, n + 1, -SW, ms}; n++; page = 0; }
      else if (d == 'R' && n > 1) { stopAudio(e); an = {true, n, n - 1, SW, ms}; n--; page = 0; }
      else if (d == 'R') { stopAudio(e); go(SC_PICK, ms); }
    } else if (d == 'R') {
      if (scr == SC_PICK || scr == SC_SETTINGS) go(SC_HOME, ms);
      else if (scr == SC_QR) go(SC_SETTINGS, ms);
      else if (scr == SC_SING && !singBusy(e)) go(SC_TATTVA, ms);
      else if (scr == SC_LANG && lang >= 0) go(langBack, ms);
    }
  }
  enum { B_BACK = 1, B_LEARN, B_SINGHOME, B_SET, B_TILE0, B_TILE7 = B_TILE0 + 7, B_TAB0, B_TAB2 = B_TAB0 + 2, B_LISTEN, B_SINGGO,
         B_TUNE, B_SINGSTART, B_STOPSING, B_AGAIN, B_SINGBACK, B_LANG0, B_LANG3 = B_LANG0 + 3, B_LANGROW, B_DIM, B_BRIGHT, B_WIFI, B_QR, B_SKIPWIFI };
  void press(int id, const Env &e) {
    uint32_t ms = e.ms; dirty = true;
    if (id == B_BACK) { stopAudio(e); go(scr == SC_TATTVA ? SC_PICK : scr == SC_QR ? SC_SETTINGS : scr == SC_LANG ? langBack : SC_HOME, ms); }
    else if (id == B_LEARN) { pickSing = false; go(SC_PICK, ms); }
    else if (id == B_SINGHOME) { pickSing = true; go(SC_PICK, ms); }
    else if (id == B_SET) go(SC_SETTINGS, ms);
    else if (id >= B_TILE0 && id <= B_TILE7) { n = id - B_TILE0 + 1; page = 0; go(pickSing ? SC_SING : SC_TATTVA, ms); }
    else if (id >= B_TAB0 && id <= B_TAB2) { page = id - B_TAB0; }
    else if (id == B_LISTEN) { bool m = page > 0; if ((e.audio == AU_PLAYING || e.audio == AU_LOADING) && e.audioN == n && e.audioMeaning == m) push(A_STOP); else push(A_PLAY, n, m); }
    else if (id == B_SINGGO) { stopAudio(e); go(SC_SING, ms); }
    else if (id == B_TUNE) push(A_LISTEN, n);
    else if (id == B_SINGSTART || id == B_AGAIN) { curNote = -1; okSec = 0; push(A_SING, n); }
    else if (id == B_STOPSING) push(A_SING_STOP);
    else if (id == B_SINGBACK) { push(A_SING_STOP); go(SC_TATTVA, ms); }
    else if (id >= B_LANG0 && id <= B_LANG3) { bool first = lang < 0; lang = id - B_LANG0; push(A_LANG, lang); if (first) afterLang(e); else go(langBack, ms); }
    else if (id == B_LANGROW) { langBack = SC_SETTINGS; go(SC_LANG, ms); }
    else if (id == B_DIM) push(A_BRIGHT, e.bright > 1 ? e.bright - 1 : 1);
    else if (id == B_BRIGHT) push(A_BRIGHT, e.bright < 5 ? e.bright + 1 : 5);
    else if (id == B_WIFI) { if (resetArmed && ms - resetArmed < 4000) { push(A_WIFI_RESET); resetArmed = 0; } else { resetArmed = ms; toast(S_TAP_AGAIN_TO_RESET, ms, 4000); } }
    else if (id == B_QR) go(SC_QR, ms);
    else if (id == B_SKIPWIFI) { skippedWifi = true; push(A_WIFI_SKIP); go(SC_HOME, ms); }
  }
  void afterLang(const Env &e) {
    if (e.net == NET_PORTAL && !skippedWifi) go(SC_SETUP, e.ms);
    else if (e.net == NET_CONNECTING) go(SC_CONNECT, e.ms);
    else go(SC_HOME, e.ms);
  }
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
    if (scr == SC_BOOT && e.ms - scrT0 > 2200) { if (lang < 0) { langBack = SC_HOME; go(SC_LANG, e.ms); } else afterLang(e); }
  }

  // ---------- drawing helpers ----------
  int iw(int it) const { return Canvas::itemW(it) - Canvas::itemX0(it); }
  int ih(int it) const { return Canvas::itemH(it) - Canvas::itemY0(it); }
  void itemAt(int it, int x, int y, uint16_t c, uint32_t a = 32) { cv.item(it, x - Canvas::itemX0(it), y - Canvas::itemY0(it), c, a); }  // ink's top-left at x,y
  void itemMid(int it, int cx, int cy, uint16_t c, uint32_t a = 32) { itemAt(it, cx - iw(it) / 2, cy - ih(it) / 2, c, a); }      // ink centred
  // a big button: rounded, icon + label centred; style 0 quiet, 1 gold, 2 kumkum
  void button(int x, int y, int w, int h, int id, int icon, int label, int style, float prog = -1) {
    bool pr = pressId == id && down;
    uint16_t bg = style == 1 ? C_GOLD : style == 2 ? C_KUM : C_PANEL2, fg = style == 1 ? C_NIGHT : C_INK;
    int r = h / 2 < 26 ? h / 2 : 26;
    cv.round(x, y, w, h, r, bg, pr ? 22 : 32);
    if (style == 0) cv.round(x, y, w, h, r, C_CHANDAN, pr ? 16 : 9, 1.4f);
    if (prog >= 0) { cv.setClip(x, y, x + (int)(w * prog), y + h); cv.round(x, y, w, h, r, C_WHITE, 7); cv.noClip(); }
    int lw = label >= 0 ? iw(label) : 0, icw = icon >= 0 ? 34 : 0, gap = icon >= 0 && label >= 0 ? 8 : 0;
    if (icw + gap + lw > w - 16) icw = gap = 0;
    int x0 = x + (w - (icw + gap + lw)) / 2;
    if (icw) cv.item(ICON[icon], x0 - 2, y + (h - 38) / 2, fg);
    if (label >= 0) itemAt(label, x0 + icw + gap, y + (h - ih(label)) / 2, fg);
    btn(x, y, w, h, id);
  }
  void backBtn(int id = B_BACK) {
    bool pr = pressId == id && down;
    cv.disc(40, 38, 26, C_PANEL2, pr ? 20 : 32); cv.ring(40, 38, 26, 1.4f, C_CHANDAN, 9);
    cv.item(ICON[IC_BACK], 21, 19, C_INK); btn(12, 10, 58, 58, id);
  }
  void statusBar(const Env &e) {
    char b[16];
    if (e.timeOk) { snprintf(b, sizeof b, "%d:%02d", e.hh % 12 ? e.hh % 12 : 12, e.mm); cv.textC(b, 184, 8, C_MUTED); }
    if (e.batt >= 0) { int bx = 318, by = 14; cv.round(bx, by, 24, 12, 3.5f, C_MUTED, 22, 1.3f); int w = (e.batt * 18 + 50) / 100; cv.round(bx + 3, by + 3, w < 2 ? 2 : w, 6, 1.5f, e.batt <= 15 && !e.charging ? C_KUM : e.charging ? C_GOLD : C_MUTED, 28); }
    for (int i = 0; i < 3; i++) { int h = 4 + i * 4; bool on = e.net == NET_OK && (i == 0 || e.rssi > (i == 1 ? -75 : -62)); cv.round(28 + i * 6, 26 - h, 4, h, 1.5f, on ? C_MUTED : C_PANEL2, on ? 30 : 32); }
  }
  void drawToast(const Env &e) {
    if (toastKey < 0 || e.ms > toastUntil) return;
    int it = S(toastKey), w = iw(it), h = ih(it), bw = w + 40, bh = h + 26, x = (SW - bw) / 2, y = 300 - bh / 2;
    cv.round(x, y, bw, bh, 20, C_DEEP, 31); cv.round(x, y, bw, bh, 20, C_GOLD, 16, 1.5f);
    itemMid(it, SW / 2, y + bh / 2, C_INK);
  }

  // ---------- screens ----------
  void boot(const Env &e) {
    float t = (e.ms - scrT0) / 1000.f, k = fminf(1.f, t / 1.4f), ease = 1 - powf(1 - k, 3);
    cv.glow(184, 180, 160 * ease + 1, C_GOLD, .14f * ease);
    cv.yantraAt(184, 180, 120 + 140 * ease, (1 - ease) * 2.2f + t * .1f, C_GOLD, (uint32_t)(28 * ease));
    uint32_t a = (uint32_t)(32 * fminf(1.f, fmaxf(0.f, (t - .7f) / .7f)));
    cv.itemC(IT_BRAND, 184, 322, C_INK, a); cv.itemC(IT_BRAND_DEV, 184, 374, C_GOLD, a);
  }
  void home(const Env &e) {
    float t = e.ms / 1000.f;
    statusBar(e);
    cv.glow(184, 132, 120, C_GOLD, .12f);
    cv.yantraAt(184, 132, 196, t * .12f, C_GOLD, 22);
    cv.itemC(IT_BRAND, 184, 238, C_INK);
    button(16, 300, 336, 72, B_LEARN, IC_BOOK, S(S_LEARN), 1);
    button(16, 382, 164, 60, B_SINGHOME, IC_MIC, S(S_SING), 0);
    button(188, 382, 164, 60, B_SET, IC_GEAR, S(S_SETTINGS), 0);
  }
  void picker(const Env &e) {
    backBtn();
    itemMid(S(S_CHOOSE_A_TATTVA), 206, 38, C_INK);
    for (int i = 0; i < 8; i++) {
      int x = 14 + (i % 2) * 174, y = 82 + (i / 2) * 90, w = 166, h = 82, id = B_TILE0 + i; bool pr = pressId == id && down;
      cv.round(x, y, w, h, 20, C_PANEL2, pr ? 20 : 32); cv.round(x, y, w, h, 20, C_CHANDAN, 8, 1.2f);
      cv.item(SYM[i + 1], x + 10, y + (h - 40) / 2, C_GOLD);
      int nt = NAMET[L()][i + 1]; itemAt(nt, x + 58, y + (h - ih(nt)) / 2, C_INK);
      btn(x, y, w, h, id);
    }
  }
  void tattvaBody(int tn, int ox, const Env &e) {
    // header: symbol + name; 8 dots show where you are
    cv.item(SYM[tn], 80 + ox, 18, C_GOLD);
    int nm = NAME[L()][tn]; cv.setClip(0, 0, SW - 8, SH); itemAt(nm, 128 + ox, 38 - ih(nm) / 2, C_INK); cv.noClip();
    for (int i = 0; i < 8; i++) cv.disc(135 + i * 14 + ox, 76, i + 1 == tn ? 3.6f : 2.6f, i + 1 == tn ? C_GOLD : C_MUTED, i + 1 == tn ? 32 : 12);
    // tabs
    const int tabs[3] = {S_VERSE, S_MEANING, S_IDEA};
    cv.round(14 + ox, 88, 340, 54, 27, C_DEEP, 30);
    for (int i = 0; i < 3; i++) {
      int x = 14 + i * 113 + ox; bool on = page == i;
      if (on) cv.round(x + 3, 91, 108, 48, 24, C_GOLD);
      itemMid(S(tabs[i]), x + 57, 115, on ? C_NIGHT : C_MUTED);
      btn(14 + i * 113, 88, 113, 54, B_TAB0 + i);
    }
    // the text
    cv.item(PAGE[L()][tn - 1][page], 16 + ox, 150);
    // big buttons
    bool m = page > 0, mine = e.audioN == tn && e.audioMeaning == m, playing = mine && e.audio == AU_PLAYING, loading = mine && e.audio == AU_LOADING;
    button(16 + ox, 370, 164, 70, B_LISTEN, playing ? IC_STOP : IC_PLAY, S(playing ? S_STOP : S_LISTEN), playing ? 2 : 1, playing ? e.audioProg : -1);
    if (loading) { cv.round(16 + ox, 370, 164, 70, 26, C_GOLD); float a = e.ms / 150.f; for (int i = 0; i < 8; i++) cv.disc(98 + ox + cosf(a + i * .785f) * 13, 405 + sinf(a + i * .785f) * 13, 2.6f, C_NIGHT, 6 + i * 3); }
    button(188 + ox, 370, 164, 70, B_SINGGO, IC_MIC, S(S_SING), 0);
  }
  void tattva(const Env &e) {
    if (an.on) {
      float k = fminf(1.f, (e.ms - an.t0) / 260.f), q = 1 - powf(1 - k, 3);
      tattvaBody(an.fn, (int)(an.dx * q), e); tattvaBody(an.tn, (int)(an.dx * (q - 1)), e);
      if (k >= 1) { an.on = false; dirty = true; }
    } else tattvaBody(n, 0, e);
    backBtn();
  }
  // ---- Sing: match the note ----
  void singScreen(const Env &e) {
    const Tune &tu = TUNE[n]; const float spb = 60.f / tu.bpm, len = tu.total4 / 4.f * spb;
    backBtn(B_SINGBACK);
    int si = S(S_SING); itemAt(si, 82, 38 - ih(si) / 2, C_INK);
    cv.item(SYM[n], 92 + iw(si), 18, C_GOLD);
    bool live = e.sing == SG_SING || e.sing == SG_LISTEN;
    if (live) { cv.round(16, 76, 336, 6, 3, C_PANEL2); cv.round(16, 76, (int)(336 * fminf(1, fmaxf(0, e.singT / len))), 6, 3, C_GOLD); }
    // which note now
    int cur = 0; float t = live ? e.singT : 0;
    for (int i = 0; i < tu.n; i++) if (t >= tu.notes[i].start / 4.f * spb) cur = i;
    const Note &no = tu.notes[cur]; float t0 = no.start / 4.f * spb, t1 = (no.start + no.len) / 4.f * spb;
    // how long the voice has been in tune on this note
    float dev = NAN;
    if (e.sing == SG_SING) {
      if (cur != curNote) { curNote = cur; okSec = 0; lastT = e.singT; }
      if (!isnan(e.pitch)) dev = wrap12(e.pitch - (e.sc ? e.sc->offset : 0) - no.semi);
      float dt = e.singT - lastT; lastT = e.singT;
      if (!isnan(dev) && fabsf(dev) <= .5f && dt > 0 && dt < .2f) okSec += dt;
    }
    const int cx = 156, cy = 196, R = 92;
    // the ring: fills as you hold the note (Sing) or as the note plays (Listen)
    cv.ring(cx, cy, R, 10, C_PANEL2);
    float fill = e.sing == SG_SING ? fminf(1, okSec / fmaxf(.15f, (t1 - t0) * .5f)) : e.sing == SG_LISTEN ? fminf(1, (t - t0) / (t1 - t0)) : 0;
    if (fill > 0) for (int k = 0; k < 120 * fill; k++) { float a = -1.5708f + k / 120.f * 6.2832f; cv.disc(cx + cosf(a) * R, cy + sinf(a) * R, 5.2f, C_GOLD); }
    if (e.sing == SG_COUNT) { char c[4]; int k = (int)ceilf(-e.singT); snprintf(c, sizeof c, "%d", k < 1 ? 1 : k > 3 ? 3 : k); cv.big(c, cx, cy - 52, C_GOLD); }
    else if (e.sing == SG_DONE) {
      int sc = e.sc ? e.sc->score() : 0; char b[8]; snprintf(b, sizeof b, "%d%%", sc); cv.big(b, cx, cy - 52, sc >= 80 ? C_GOLD : C_INK);
    } else itemMid(SYLB[no.syl], cx, cy, fill >= 1 ? C_GOLD : C_INK);
    // the meter: your voice against the note (Sing only)
    const int mx = 300, my0 = 106, my1 = 286, mc = (my0 + my1) / 2;
    if (e.sing == SG_SING || e.sing == SG_COUNT) {
      cv.round(mx, my0, 36, my1 - my0, 18, C_DEEP, 30);
      cv.round(mx + 3, mc - 15, 30, 30, 12, C_GOLD, 12);
      cv.fillRect(mx + 6, mc, 24, 2, C_GOLD, 28);
      if (!isnan(dev)) { float d = fmaxf(-3.f, fminf(3.f, dev)); float y = mc - d / 3.f * (mc - my0 - 16); bool ok = fabsf(dev) <= .5f; cv.disc(mx + 18, y, 12, ok ? C_GOLD : C_INK); }
    }
    // a word under the ring
    int hint = -1; uint16_t hc = C_MUTED;
    if (e.sing == SG_IDLE) hint = S(S_SING_THIS);
    else if (e.sing == SG_COUNT) hint = S(S_GET_READY);
    else if (e.sing == SG_LISTEN) hint = S(S_PLAYING);
    else if (e.sing == SG_SING) { if (isnan(dev)) hint = S(S_SING_THIS); else if (fabsf(dev) <= .5f) { hint = S(S_IN_TUNE); hc = C_GOLD; } else if (dev < 0) { hint = S(S_HIGHER); hc = C_INK; } else { hint = S(S_LOWER); hc = C_INK; } }
    else if (e.sing == SG_DONE) { bool pass = e.sc && e.sc->score() >= 80; hint = S(pass ? S_PASSED : S_TRY_AGAIN); hc = pass ? C_GOLD : C_INK; }
    if (hint >= 0) itemMid(hint, cx, 312, hc);
    // the next syllables
    if (e.sing != SG_DONE) for (int k = 1; k <= 3 && cur + k < tu.n; k++) itemMid(SYLI[tu.notes[cur + k].syl], cx - 60 + k * 50 - 50, 345, C_MUTED, 32 - k * 7);
    else { char b[24]; snprintf(b, sizeof b, "%d / %d", e.sc ? e.sc->hits : 0, tu.n); cv.textC(b, cx, 334, C_MUTED); }
    // big buttons
    if (e.sing == SG_IDLE) { button(16, 370, 164, 70, B_TUNE, IC_MUSIC, S(S_LISTEN), 0); button(188, 370, 164, 70, B_SINGSTART, IC_MIC, S(S_SING), 1); }
    else if (e.sing == SG_DONE) { button(16, 370, 164, 70, B_SINGBACK, IC_BACK, S(S_BACK), 0); button(188, 370, 164, 70, B_AGAIN, IC_MIC, S(S_AGAIN), 1); }
    else button(16, 370, 336, 70, B_STOPSING, IC_STOP, S(S_STOP), 2);
  }
  void langScreen(const Env &e) {
    if (lang >= 0) backBtn();
    cv.itemC(IT_OM, 184, 30, C_GOLD);
    itemMid(S(S_CHOOSE_YOUR_LANGUAGE), 184, 140, C_INK);
    for (int i = 0; i < 4; i++) {
      int x = 16 + (i % 2) * 172, y = 180 + (i / 2) * 124, id = B_LANG0 + i; bool on = lang == i, pr = pressId == id && down;
      cv.round(x, y, 164, 112, 24, on ? C_GOLD : C_PANEL2, pr ? 20 : 32); if (!on) cv.round(x, y, 164, 112, 24, C_CHANDAN, 9, 1.4f);
      itemMid(LANGN[i], x + 82, y + 56, on ? C_NIGHT : C_INK);
      btn(x, y, 164, 112, id);
    }
  }
  void row(int y, int id, int icon, int label) {
    bool pr = pressId == id && down;
    cv.round(16, y, 336, 80, 24, C_PANEL2, pr ? 20 : 32); cv.round(16, y, 336, 80, 24, C_CHANDAN, 8, 1.2f);
    if (icon >= 0) cv.item(ICON[icon], 30, y + 21, C_GOLD);
    if (label >= 0) itemAt(label, 78, y + 40 - ih(label) / 2, C_INK);
    if (id) btn(16, y, 336, 80, id);
  }
  void settings(const Env &e) {
    backBtn();
    itemMid(S(S_SETTINGS), 206, 38, C_INK);
    row(84, B_LANGROW, IC_GLOBE, S(S_LANGUAGE));
    int ln = LANGN[L()]; itemAt(ln, 336 - iw(ln), 124 - ih(ln) / 2, C_GOLD);
    row(174, 0, IC_SUN, -1);
    for (int k = 0; k < 2; k++) { int x = k ? 290 : 74, id = k ? B_BRIGHT : B_DIM; bool pr = pressId == id && down; cv.disc(x + 24, 214, 26, C_NIGHT, pr ? 18 : 30); cv.fillRect(x + 13, 213, 22, 3, C_INK); if (k) cv.fillRect(x + 23, 203, 3, 22, C_INK); btn(x - 4, 182, 56, 64, id); }
    for (int i = 0; i < 5; i++) cv.disc(152 + i * 22, 214, i < e.bright ? 7.f : 5.f, i < e.bright ? C_GOLD : C_MUTED, i < e.bright ? 32 : 12);
    row(264, B_WIFI, IC_WIFI, -1);
    if (e.net == NET_OK && e.ssid[0]) { char b[24]; snprintf(b, sizeof b, "%.18s", e.ssid); cv.text(b, 78, 288, C_INK, true); }
    else { int nw = S(S_NO_WI_FI); itemAt(nw, 78, 304 - ih(nw) / 2, C_MUTED); }
    int rs = S(S_RESET_WI_FI); cv.setClip(0, 0, 344, SH); itemAt(rs, 338 - iw(rs) > 210 ? 338 - iw(rs) : 210, 304 - ih(rs) / 2, C_MUTED, 26); cv.noClip();
    row(354, B_QR, IC_QR, S(S_OPEN_ON_PHONE));
  }
  void qrScreen(const Env &e) {
    backBtn();
    itemMid(S(S_OPEN_ON_PHONE), 206, 38, C_INK);
    int mod = Canvas::qrSize(QR_SITE_N, 10) <= 290 ? 10 : 9, qs = Canvas::qrSize(QR_SITE_N, mod);
    cv.qr(QR_SITE_BITS, QR_SITE_N, 184 - qs / 2, 82, mod);
    cv.textC("heytattva.vercel.app", 184, 82 + qs + 18, C_GOLD, true);
  }
  void setupScreen(const Env &e) {
    itemMid(S(S_SET_UP_WI_FI), 184, 30, C_INK);
    int a = S(S_ON_YOUR_PHONE_JOIN_THIS_WI_FI); cv.itemC(a, 184, 54, C_MUTED);
    int y = 54 + ih(a) + 8;
    cv.textC("HeyTattva-Setup", 184, y, C_GOLD, true); y += 40;
    int qs = Canvas::qrSize(QR_WIFI_N, 6); cv.qr(QR_WIFI_BITS, QR_WIFI_N, 184 - qs / 2, y, 6); y += qs + 12;
    int b = S(S_A_PAGE_OPENS_PICK_YOUR_WI_FI_AND_TYPE_IT); cv.itemC(b, 184, y, C_INK, 28);
    button(60, 384, 248, 56, B_SKIPWIFI, -1, S(S_USE_WITHOUT_WI_FI), 0);
  }
  void connectScreen(const Env &e) {
    float t = e.ms / 1000.f;
    cv.glow(184, 190, 130, C_GOLD, .12f);
    cv.yantraAt(184, 190, 220, t * .9f, C_GOLD, 18);
    itemMid(S(S_CONNECTING), 184, 340, C_INK);
    if (e.ssid[0]) cv.textC(e.ssid, 184, 370, C_MUTED);
  }

  bool frame(const Env &e) {
    watch(e);
    nb = 0;
    cv.clearBg();
    switch (scr) {
      case SC_BOOT: boot(e); break;
      case SC_LANG: langScreen(e); break;
      case SC_SETUP: setupScreen(e); break;
      case SC_CONNECT: connectScreen(e); break;
      case SC_HOME: home(e); break;
      case SC_PICK: picker(e); break;
      case SC_TATTVA: tattva(e); break;
      case SC_SING: singScreen(e); break;
      case SC_SETTINGS: settings(e); break;
      case SC_QR: qrScreen(e); break;
    }
    drawToast(e);
    bool moving = an.on || scr == SC_BOOT || scr == SC_HOME || scr == SC_CONNECT || (scr == SC_SING && e.sing != SG_IDLE) || e.audio == AU_LOADING || e.audio == AU_PLAYING || (toastKey >= 0 && e.ms < toastUntil + 100);
    bool r = moving || dirty; dirty = false; return r;
  }
};
