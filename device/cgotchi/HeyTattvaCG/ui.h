// Hey Tattva on the Cheeko Gotchi: screens, two reels and two games. Plain C++ (no Arduino calls), so the PC
// simulator draws exactly what the device shows. The hardware layer fills Env each frame and carries out Acts.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include "gfx.h"

enum NetSt { NET_OFF, NET_CONNECTING, NET_OK, NET_PORTAL, NET_FAILED };
enum VoiceSt { VO_NONE, VO_LOADING, VO_PLAYING, VO_NEEDNET, VO_ERR };
enum Scr { SC_BOOT, SC_SETUP, SC_CONNECT, SC_HOME, SC_REEL, SC_GAMES, SC_G1, SC_G2, SC_RESULT, SC_SETTINGS };
enum ActT { A_NONE, A_REEL, A_REEL_PAUSE, A_REEL_RESUME, A_REEL_STOP, A_SFX, A_VOL, A_WIFI_RESET, A_WIFI_SKIP, A_BEST };
enum Sfx { SFX_TAP = 1, SFX_GOOD, SFX_BAD, SFX_WORD, SFX_END };
struct Act { ActT t; int a, b; };

struct Env {
  uint32_t ms = 0;
  bool timeOk = false; int hh = 0, mm = 0;
  NetSt net = NET_OFF; char ssid[33] = ""; int rssi = -100;
  VoiceSt voice = VO_NONE; float voiceProg = 0; float bedT = 0;  // reel audio
  int vol = 6;                                                     // 0..10
  bool accel = false; float tx = 0, ty = 0;                        // tilt in g, already mapped to screen axes
  int best[2] = {0, 0};
};
struct Btn { int x, y, w, h, id; };
struct Part { float x, y, vx, vy, life; uint16_t c; };

struct UI {
  Canvas cv;
  Scr scr = SC_BOOT; uint32_t scrT0 = 0;
  int reel = 0;              // 0 = tattva 1, 1 = tattva 4
  bool paused = false, skippedWifi = false;
  Btn btns[16]; int nb = 0; int pressId = -1;
  Act q[8]; int qn = 0;
  bool down = false; int tx0 = 0, ty0 = 0, tx = 0, ty = 0; uint32_t td0 = 0;
  int toastMs = 0; char toastTxt[48] = ""; uint32_t toastUntil = 0;
  NetSt lastNet = NET_OFF; uint32_t resetArmed = 0;
  Part parts[48]; int np = 0;
  uint32_t seed = 12345;
  // ---- game state ----
  int game = 0; float gT = 0, gLen = 45; int score = 0, combo = 0, wi = 0, got = 0; uint32_t lastMs = 0;
  struct Tile { float x, y, vx, ph, shake; uint8_t ak; bool on; int hole; float cool; } tiles[8]; int nt = 0;
  float bx = 120, by = 200, bvx = 0, bvy = 0;  // the lamp's light
  float laneX[2] = {10, 40}, laneV = 18;       // Mirror Letters: two rows moving opposite ways
  float beamT = -1; int beamHole = 0; float wordFlash = -1;
  uint8_t order[8];
  int lastScore = 0, lastGame = 0; bool newBest = false;

  float rnd() { seed = seed * 1664525u + 1013904223u; return (seed >> 8) / 16777216.f; }
  void push(ActT t, int a = 0, int b = 0) { if (qn < 8) q[qn++] = {t, a, b}; }
  bool pop(Act &a) { if (!qn) return false; a = q[0]; for (int i = 1; i < qn; i++) q[i - 1] = q[i]; qn--; return true; }
  void go(Scr s, uint32_t ms) { if (scr == SC_REEL && s != SC_REEL) push(A_REEL_STOP); scr = s; scrT0 = ms; }
  void toast(const char *t, uint32_t ms, uint32_t dur = 2200) { snprintf(toastTxt, sizeof toastTxt, "%s", t); toastUntil = ms + dur; }
  void btn(int x, int y, int w, int h, int id) { if (nb < 16) btns[nb++] = {x, y, w, h, id}; }
  int hit(int x, int y) const { for (int i = nb - 1; i >= 0; i--) { const Btn &b = btns[i]; if (x >= b.x - 5 && x < b.x + b.w + 5 && y >= b.y - 5 && y < b.y + b.h + 5) return b.id; } return -1; }
  void burst(float x, float y, uint16_t c, int n) { for (int i = 0; i < n && np < 48; i++) { float a = rnd() * 6.283f, s = 40 + rnd() * 90; parts[np++] = {x, y, cosf(a) * s, sinf(a) * s - 30, .7f + rnd() * .4f, c}; } }

  // ---------- input ----------
  enum { B_REELS = 1, B_GAMES, B_SET, B_BACK, B_G1, B_G2, B_AGAIN, B_HOME, B_VDN, B_VUP, B_WIFI, B_SKIP };
  void touchDown(int x, int y, uint32_t ms) { down = true; tx0 = tx = x; ty0 = ty = y; td0 = ms; pressId = hit(x, y); }
  void touchMove(int x, int y) { tx = x; ty = y; if (abs(tx - tx0) > 16 || abs(ty - ty0) > 16) pressId = -1; }
  void touchUp(const Env &e) {
    if (!down) return; down = false; int pid = pressId; pressId = -1;
    int dx = tx - tx0, dy = ty - ty0;
    if (scr == SC_G2) return;  // dragging steers the light
    if (abs(dy) > 40 && abs(dy) > abs(dx) * 1.2f && scr == SC_REEL) { reel ^= 1; paused = false; startReel(e); return; }
    if (abs(dx) > 50 && abs(dx) > abs(dy) * 1.2f) { if (dx > 0) back(e); return; }
    if (abs(dx) < 16 && abs(dy) < 16) {
      if (pid >= 0) { press(pid, e); return; }
      if (scr == SC_REEL) { paused = !paused; push(paused ? A_REEL_PAUSE : A_REEL_RESUME); }
      else if (scr == SC_G1) tapG1(tx0, ty0, e);
    }
  }
  void back(const Env &e) {
    if (scr == SC_REEL || scr == SC_GAMES || scr == SC_SETTINGS) go(SC_HOME, e.ms);
    else if (scr == SC_G1 || scr == SC_G2 || scr == SC_RESULT) go(SC_GAMES, e.ms);
  }
  void startReel(const Env &e) { push(A_REEL, reel); }
  void press(int id, const Env &e) {
    uint32_t ms = e.ms; push(A_SFX, SFX_TAP);
    if (id == B_REELS) { go(SC_REEL, ms); paused = false; startReel(e); }
    else if (id == B_GAMES) go(SC_GAMES, ms);
    else if (id == B_SET) go(SC_SETTINGS, ms);
    else if (id == B_BACK) back(e);
    else if (id == B_HOME) go(SC_HOME, ms);
    else if (id == B_G1 || id == B_G2) startGame(id == B_G1 ? 0 : 1, ms);
    else if (id == B_AGAIN) startGame(lastGame, ms);
    else if (id == B_VDN) push(A_VOL, e.vol > 0 ? e.vol - 1 : 0);
    else if (id == B_VUP) push(A_VOL, e.vol < 10 ? e.vol + 1 : 10);
    else if (id == B_WIFI) { if (resetArmed && ms - resetArmed < 4000) push(A_WIFI_RESET); else { resetArmed = ms; toast("Tap again to reset Wi-Fi", ms, 4000); } }
    else if (id == B_SKIP) { skippedWifi = true; push(A_WIFI_SKIP); go(SC_HOME, ms); }
  }
  void watch(const Env &e) {
    if (e.net != lastNet) {
      if (scr != SC_BOOT) {
        if (e.net == NET_PORTAL && !skippedWifi && scr != SC_SETUP) go(SC_SETUP, e.ms);
        else if (e.net == NET_CONNECTING && (scr == SC_SETUP || scr == SC_CONNECT)) go(SC_CONNECT, e.ms);
        else if (e.net == NET_OK && (scr == SC_SETUP || scr == SC_CONNECT)) { go(SC_HOME, e.ms); toast("Connected", e.ms); }
      }
      lastNet = e.net;
    }
    if (scr == SC_BOOT && e.ms - scrT0 > 2000) { if (e.net == NET_PORTAL) go(SC_SETUP, e.ms); else if (e.net == NET_CONNECTING) go(SC_CONNECT, e.ms); else go(SC_HOME, e.ms); }
  }

  // ---------- drawing helpers ----------
  int iw(int it) const { return Canvas::itemW(it) - Canvas::itemX0(it); }
  int ih(int it) const { return Canvas::itemH(it) - Canvas::itemY0(it); }
  void itemAt(int it, int x, int y, uint16_t c, uint32_t a = 32) { cv.item(it, x - Canvas::itemX0(it), y - Canvas::itemY0(it), c, a); }
  void itemMid(int it, int cx, int cy, uint16_t c, uint32_t a = 32) { itemAt(it, cx - iw(it) / 2, cy - ih(it) / 2, c, a); }
  void button(int x, int y, int w, int h, int id, int icon, const char *label, int style) {
    bool pr = pressId == id && down; uint16_t bg = style == 1 ? C_GOLD : C_PANEL2, fg = style == 1 ? C_NIGHT : C_INK; int r = h / 2 < 20 ? h / 2 : 20;
    cv.round(x, y, w, h, r, bg, pr ? 22 : 32); if (style == 0) cv.round(x, y, w, h, r, C_CHANDAN, pr ? 16 : 9, 1.3f);
    int lw = label ? Canvas::textW(label, 1) : 0, icw = icon >= 0 ? 30 : 0, gap = icon >= 0 && label ? 6 : 0, x0 = x + (w - icw - gap - lw) / 2;
    if (icw) cv.item(ICON[icon], x0 - 2, y + (h - 34) / 2, fg);
    if (label) cv.text(label, x0 + icw + gap, y + (h - 24) / 2, fg, 1);
    btn(x, y, w, h, id);
  }
  void backBtn() { bool pr = pressId == B_BACK && down; cv.disc(24, 22, 17, C_PANEL2, pr ? 20 : 32); cv.item(ICON[IC_BACK], 7, 5, C_INK); btn(4, 2, 40, 40, B_BACK); }
  void parts_(float dt) {
    for (int i = 0; i < np; i++) { Part &p = parts[i]; p.life -= dt; if (p.life <= 0) { parts[i--] = parts[--np]; continue; } p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt; cv.disc(p.x, p.y, 2.2f, p.c, (uint32_t)(32 * fminf(1, p.life * 2))); }
  }
  void drawToast(const Env &e) {
    if (e.ms > toastUntil) return; int w = Canvas::textW(toastTxt, 0) + 28, x = (SW - w) / 2;
    cv.round(x, 150, w, 32, 16, C_DEEP, 31); cv.round(x, 150, w, 32, 16, C_GOLD, 16, 1.4f); cv.textC(toastTxt, SW / 2, 156, C_INK, 0);
  }
  void line(float x0, float y0, float x1, float y1, float r, uint16_t c, uint32_t a) { float d = hypotf(x1 - x0, y1 - y0); int n = (int)(d / 2) + 1; for (int i = 0; i <= n; i++) { float k = (float)i / n; cv.disc(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r, c, a); } }

  // ---------- screens ----------
  void boot(const Env &e) {
    float t = (e.ms - scrT0) / 1000.f, k = fminf(1.f, t / 1.3f), ease = 1 - powf(1 - k, 3);
    cv.glow(120, 120, 110 * ease + 1, C_GOLD, .14f * ease);
    cv.yantraAt(120, 120, 80 + 100 * ease, (1 - ease) * 2.2f + t * .1f, C_GOLD, (uint32_t)(28 * ease));
    uint32_t a = (uint32_t)(32 * fminf(1.f, fmaxf(0.f, (t - .6f) / .6f)));
    cv.textC("Hey Tattva", 120, 222, C_INK, 2, a); itemMid(IT_BRAND_DEV, 120, 268, C_GOLD, a);
  }
  void home(const Env &e) {
    float t = e.ms / 1000.f; char b[12];
    if (e.timeOk) { snprintf(b, sizeof b, "%d:%02d", e.hh % 12 ? e.hh % 12 : 12, e.mm); cv.textC(b, 120, 4, C_MUTED, 0); }
    for (int i = 0; i < 3; i++) { int h = 3 + i * 3; bool on = e.net == NET_OK && (i == 0 || e.rssi > (i == 1 ? -75 : -62)); cv.round(10 + i * 5, 18 - h, 3, h, 1.2f, on ? C_MUTED : C_PANEL2); }
    cv.item(ICON[IC_GEAR], 204, 2, C_MUTED); btn(198, 0, 42, 38, B_SET);
    cv.glow(120, 84, 74, C_GOLD, .12f); cv.yantraAt(120, 84, 120, t * .12f, C_GOLD, 24);
    cv.textC("Hey Tattva", 120, 150, C_INK, 2); itemMid(IT_BRAND_DEV, 120, 192, C_GOLD);
    button(14, 210, 212, 38, B_REELS, IC_FILM, "Reels", 1);
    button(14, 254, 212, 38, B_GAMES, IC_CHAKRA, "Games", 0);
  }
  // ---- the two reel visuals ----
  void mirrorCity(float t) {
    const float cx = 120, cy = 106, rx = 54, ry = 64;
    cv.glow(cx, cy, 120, C_GOLD, .08f);
    cv.round((int)(cx - rx), (int)(cy - ry), (int)(rx * 2), (int)(ry * 2), rx, C_DEEP, 28);
    // the city inside the mirror
    uint32_t s = 7; auto r = [&]() { s = s * 1103515245u + 12345u; return (s >> 16 & 1023) / 1023.f; };
    int x = (int)(cx - rx);
    while (x < cx + rx) { int w = 8 + (int)(r() * 11), h = 18 + (int)(r() * 50); int top = (int)(cy + 38 - h);
      cv.fillRect(x, top, w - 2, h, C_PANEL2, 30);
      for (int wy = top + 5; wy < cy + 32; wy += 7) for (int wx = x + 2; wx < x + w - 4; wx += 5) { float tw = sinf(t * 1.7f + wx * .9f + wy * 1.3f); if (tw > .2f) cv.fillRect(wx, wy, 2, 3, C_GOLD, (uint32_t)(10 + 18 * tw)); }
      x += w; }
    cv.disc(cx, cy - 8, 12, C_PANEL2, 30); cv.fillRect((int)cx - 12, (int)cy - 8, 24, 46, C_PANEL2, 30); cv.fillRect((int)cx - 1, (int)cy - 31, 2, 12, C_GOLD, 26);
    cv.fillRect((int)(cx - rx), (int)(cy + 38), (int)(rx * 2), 30, C_PANEL, 30);
    // shimmer band across the glass
    float sx = fmodf(t * 40, 260) - 70;
    for (int yy = (int)(cy - ry); yy < cy + ry; yy++) { int xa = (int)(sx + (yy - cy) * .5f); if (xa > cx - rx - 12 && xa < cx + rx + 2) cv.fillRect(xa, yy, 10, 1, C_WHITE, 4); }
    // mask everything outside the oval back to the background
    for (int yy = (int)(cy - ry) - 2; yy <= cy + ry + 2; yy++) { if (yy < 0 || yy >= SH) continue; float dy = (yy + .5f - cy) / ry, w = dy * dy < 1 ? rx * sqrtf(1 - dy * dy) : 0;
      int a = (int)(cx - w), b = (int)(cx + w); for (int xx = (int)(cx - rx) - 3; xx <= cx + rx + 3; xx++) if (xx >= 0 && xx < SW && (xx < a || xx > b)) cv.px[yy * SW + xx] = cv.bg[yy * SW + xx]; }
    // the gold frame and the stand
    for (int k = 0; k < 2; k++) { float g = 2.5f - k; for (int a = 0; a < 360; a += 1) { float an = a * .01745f; cv.disc(cx + cosf(an) * (rx + k * 4), cy + sinf(an) * (ry + k * 4), g * .6f, C_GOLD, k ? 14 : 30); } }
    cv.round((int)cx - 4, (int)(cy + ry + 3), 8, 7, 3, C_GOLD); cv.round((int)cx - 20, (int)(cy + ry + 9), 40, 5, 2.5f, C_GOLD);
    for (int i = 0; i < 10; i++) { float ph = fmodf(t * .25f + i * .1f, 1.f); cv.disc(30 + i * 20 + sinf(t + i) * 6, 180 - ph * 140, 1.6f, C_GOLD2, (uint32_t)(26 * (1 - ph))); }
  }
  void lampPot(float t) {
    const float cx = 120, cy = 118;
    cv.glow(cx, cy, 120, C_GOLD, .1f + .03f * sinf(t * 3));
    // rays of light through the holes
    const int NH = 10;
    for (int i = 0; i < NH; i++) { float an = i / (float)NH * 6.283f + .2f, hx = cx + cosf(an) * 50, hy = cy + 5 + sinf(an) * 42, len = 46 + 18 * sinf(t * 2.2f + i);
      line(hx, hy, hx + cosf(an) * len, hy + sinf(an) * len, 1.6f, C_GOLD2, (uint32_t)(10 + 8 * sinf(t * 3 + i))); }
    // the pot
    cv.round((int)cx - 64, (int)cy - 50, 128, 110, 55, RGB(120, 46, 30), 32);
    cv.round((int)cx - 64, (int)cy - 50, 128, 110, 55, RGB(196, 96, 52), 18, 3.f);
    cv.round((int)cx - 28, (int)cy - 60, 56, 16, 7, RGB(150, 60, 38), 32);
    for (int i = 0; i < NH; i++) { float an = i / (float)NH * 6.283f + .2f, hx = cx + cosf(an) * 50, hy = cy + 5 + sinf(an) * 42;
      cv.disc(hx, hy, 6, C_GOLD2, 30); cv.glow(hx, hy, 14, C_GOLD, .25f); }
    // the flame inside, seen through the mouth
    float f = sinf(t * 9) * 1.5f;
    cv.glow(cx, cy - 58, 22, C_GOLD, .35f); cv.round((int)(cx - 4 + f * .3f), (int)(cy - 73), 8, 15, 4, C_GOLD2); cv.disc(cx, cy - 63, 2.5f, C_WHITE, 30);
  }
  void reelScreen(const Env &e) {
    float t = e.ms / 1000.f; int n = TTN[reel];
    if (reel == 0) mirrorCity(t); else lampPot(t);
    // top: progress, tattva and name
    float prog = e.voice == VO_PLAYING ? e.voiceProg : fmodf(e.bedT / 56.f, 1.f);
    cv.fillRect(0, 0, SW, 3, C_PANEL2); cv.fillRect(0, 0, (int)(SW * prog), 3, C_GOLD);
    cv.item(SYMI[reel], 6, 8, C_GOLD);
    char b[24]; snprintf(b, sizeof b, "Tattva %d", n); cv.text(b, 46, 8, C_GOLD, 0); cv.text(TNAME[reel], 46, 24, C_INK, 0);
    // two dots: swipe for the other reel
    for (int i = 0; i < 2; i++) cv.disc(232, 120 + i * 12, i == reel ? 3.2f : 2.4f, i == reel ? C_GOLD : C_MUTED, i == reel ? 32 : 14);
    // the verse line, following the recitation
    int li = e.voice == VO_PLAYING ? (int)fminf(3, e.voiceProg * 4) : ((int)(e.bedT / 7)) % 4;
    int d = LD[reel][li], is = LI[reel][li], h = ih(d) + 5 + ih(is), y0 = 188 + (102 - h) / 2;
    cv.round(6, 184, 228, 108, 16, C_DEEP, 27);
    itemAt(d, 120 - iw(d) / 2, y0, C_INK); itemAt(is, 120 - iw(is) / 2, y0 + ih(d) + 5, C_GOLD2);
    { const char *st = e.voice == VO_LOADING ? "Loading voice..." : e.voice == VO_NEEDNET ? "No Wi-Fi: music only" : e.voice == VO_ERR ? "Voice not reachable" : nullptr;
      if (st) { int w = Canvas::textW(st, 0) + 20; cv.round(120 - w / 2, 160, w, 24, 12, C_NIGHT, 28); cv.textC(st, 120, 162, C_MUTED, 0); } }
    if (paused) { cv.disc(120, 100, 30, C_NIGHT, 24); cv.item(ICON[IC_PLAY], 104, 84, C_INK); }
  }
  void gamesScreen(const Env &e) {
    backBtn(); cv.text("Games", 52, 6, C_INK, 2);
    const char *nm[2] = {"Mirror Letters", "Lamp Tilt"}, *how[2] = {"Tap the letters in order", "Tilt to steer the light"};
    for (int g = 0; g < 2; g++) {
      int y = 52 + g * 118, id = g ? B_G2 : B_G1; bool pr = pressId == id && down;
      cv.round(12, y, 216, 108, 20, C_PANEL2, pr ? 22 : 32); cv.round(12, y, 216, 108, 20, C_CHANDAN, 8, 1.2f);
      cv.item(SYMI[g], 24, y + 14, C_GOLD); cv.text(nm[g], 70, y + 12, C_INK, 1);
      char b[40]; cv.text(TNAME[g], 70, y + 36, C_MUTED, 0);
      cv.text(how[g], 24, y + 62, C_INK, 0);
      snprintf(b, sizeof b, "Best %d", e.best[g]); cv.text(b, 24, y + 82, C_GOLD, 0);
      cv.disc(200, y + 80, 16, C_GOLD); cv.item(ICON[IC_PLAY], 185, y + 64, C_NIGHT);
      btn(12, y, 216, 108, id);
    }
  }
  // ---- games ----
  const Word &word() const { return WORDS[game][order[wi % NWORDS[game]]]; }
  int need() const { const Word &w = word(); return got < w.n ? w.ak[got] : -1; }
  void startGame(int g, uint32_t ms) {
    game = g; gT = 0; score = 0; combo = 0; wi = 0; got = 0; np = 0; beamT = -1; wordFlash = -1; lastMs = ms; seed = ms * 2654435761u + 1;
    int n = NWORDS[g]; for (int i = 0; i < n; i++) order[i] = i; for (int i = n - 1; i > 0; i--) { int j = (int)(rnd() * (i + 1)); uint8_t t = order[i]; order[i] = order[j]; order[j] = t; }
    // put the key word first
    for (int i = 0; i < n; i++) if (WORDS[g][order[i]].key) { uint8_t t = order[0]; order[0] = order[i]; order[i] = t; break; }
    bx = 120; by = 214; bvx = bvy = 0;
    layout(); scr = g ? SC_G2 : SC_G1; scrT0 = ms;
  }
  // letters on screen: the needed one plus decoys from the same tattva
  void layout() {
    const Word &w = word(); nt = 0;
    int want = game ? 5 : 5; int pool[24], np_ = 0;
    for (int k = 0; k < NWORDS[game]; k++) { const Word &x = WORDS[game][k]; for (int j = 0; j < x.n; j++) { bool dup = false; for (int q = 0; q < np_; q++) if (pool[q] == x.ak[j]) dup = true; if (!dup && np_ < 24) pool[np_++] = x.ak[j]; } }
    int list[8], nl = 0; list[nl++] = need();
    for (int j = got + 1; j < w.n && nl < 3; j++) { bool dup = false; for (int q = 0; q < nl; q++) if (list[q] == w.ak[j]) dup = true; if (!dup) list[nl++] = w.ak[j]; }
    int guard = 0; while (nl < want && guard++ < 50) { int c = pool[(int)(rnd() * np_)]; bool dup = false; for (int q = 0; q < nl; q++) if (list[q] == c) dup = true; if (!dup) list[nl++] = c; }
    int holes[8] = {0, 1, 2, 3, 4, 5, 6, 7}; for (int i = 7; i > 0; i--) { int j = (int)(rnd() * (i + 1)); int t = holes[i]; holes[i] = holes[j]; holes[j] = t; }
    for (int i = 0; i < nl; i++) { Tile &T = tiles[nt++]; T.ak = list[i]; T.on = true; T.shake = 0; T.cool = 0; T.ph = rnd() * 6;
      if (!game) { int row = i < 3 ? 0 : 1; T.x = (row ? laneX[1] + (i - 3) * 140 : laneX[0] + i * 93); if (T.x > 240) T.x -= 280; T.y = row ? 150 : 104; T.vx = row ? -laneV : laneV; }
      else { T.hole = holes[i]; float an = T.hole / 8.f * 6.283f - 1.5708f; T.x = 120 + cosf(an) * 64 - 20; T.y = 206 + sinf(an) * 64 - 20; T.vx = 0; } }
  }
  void collect(Tile &T, const Env &e) {
    const Word &w = word(); bool key = w.key;
    if (T.ak == need()) {
      got++; combo++; score += (10 + (combo > 5 ? 10 : combo * 2)) * (key ? 2 : 1); T.on = false; burst(T.x + 20, T.y + 20, C_GOLD, 14); push(A_SFX, SFX_GOOD);
      if (game) { beamT = 0; beamHole = T.hole; }
      if (got >= w.n) { score += 25 * (key ? 2 : 1); wordFlash = 0; push(A_SFX, SFX_WORD); }
      else layout();
    } else { combo = 0; score = score > 5 ? score - 5 : 0; T.shake = .4f; T.cool = .7f; push(A_SFX, SFX_BAD); }
  }
  void tapG1(int x, int y, const Env &e) {
    for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; if (!T.on) continue; float ry = 2 * MIRROR_Y - (T.y + 40);
      if ((x >= T.x - 4 && x < T.x + 44 && y >= T.y - 4 && y < T.y + 44) || (x >= T.x - 4 && x < T.x + 44 && y >= ry - 4 && y < ry + 44)) { collect(T, e); return; } }
  }
  static constexpr int MIRROR_Y = 196;
  void wordPanel(const Env &e) {
    const Word &w = word(); char b[16];
    snprintf(b, sizeof b, "%d", score); cv.text(b, 10, 2, C_INK, 1);
    int left = (int)ceilf(gLen - gT); snprintf(b, sizeof b, "%d", left < 0 ? 0 : left); cv.textR(b, 230, 2, left <= 10 ? C_KUM : C_GOLD, 1);
    cv.fillRect(60, 12, 120, 4, C_PANEL2); cv.fillRect(60, 12, (int)(120 * fmaxf(0, 1 - gT / gLen)), 4, C_GOLD);
    cv.round(8, 30, 224, 66, 16, C_DEEP, 30); if (w.key) cv.round(8, 30, 224, 66, 16, C_GOLD, 16, 1.4f);
    int tw = 0; for (int j = 0; j < w.n; j++) tw += iw(AKI[w.ak[j]]) + 8; int x = 120 - tw / 2;
    for (int j = 0; j < w.n; j++) { int it = AKI[w.ak[j]]; bool done = j < got || wordFlash >= 0; uint16_t c = done ? C_GOLD : j == got ? C_INK : C_MUTED;
      itemAt(it, x + 4, 36, c, done || j == got ? 32 : 14); if (j == got && wordFlash < 0) cv.fillRect(x + 4, 72, iw(it), 2, C_GOLD); x += iw(it) + 8; }
    int wm = w.wm; itemAt(wm, 120 - iw(wm) / 2, 78, C_MUTED);
  }
  void tileDraw(const Tile &T, float x, float y, bool keyLetter, uint32_t a = 32, bool flip = false) {
    cv.round((int)x, (int)y, 40, 40, 10, keyLetter ? C_GOLD2 : C_CHANDAN, a);
    int it = AKI[T.ak];
    if (!flip) itemAt(it, (int)(x + 20 - iw(it) / 2), (int)(y + 20 - ih(it) / 2), C_NIGHT, a);
    else { int ox = (int)(x + 20 - iw(it) / 2) - Canvas::itemX0(it), oy = (int)(y + 20 - ih(it) / 2) - (ITEMS[it].h - Canvas::itemH(it)); cv.itemFlip(it, ox, oy, C_NIGHT, a); }
  }
  void updGame(float dt, const Env &e) {
    gT += dt;
    if (wordFlash >= 0) { wordFlash += dt; if (wordFlash > .9f) { wordFlash = -1; wi++; got = 0; layout(); } }
    if (beamT >= 0) { beamT += dt; if (beamT > .6f) beamT = -1; }
    for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; T.shake = fmaxf(0, T.shake - dt); T.cool = fmaxf(0, T.cool - dt); T.ph += dt;
      if (!game) { T.x += T.vx * dt; if (T.x > 240) T.x -= 280; if (T.x < -40) T.x += 280; } }
    if (!game) { laneX[0] = fmodf(laneX[0] + laneV * dt + 280, 280) ; laneX[1] = fmodf(laneX[1] - laneV * dt + 280, 280); if (laneX[0] > 240) laneX[0] -= 280; if (laneX[1] > 240) laneX[1] -= 280; }
    if (game) {  // the light: tilt, or drag towards the finger
      if (down) { bvx += (tx - bx) * 9 * dt; bvy += (ty - by) * 9 * dt; bvx *= .9f; bvy *= .9f; }
      else if (e.accel) { bvx += e.tx * 900 * dt; bvy += e.ty * 900 * dt; bvx *= powf(.4f, dt); bvy *= powf(.4f, dt); }
      float sp = hypotf(bvx, bvy); if (sp > 260) { bvx *= 260 / sp; bvy *= 260 / sp; }
      bx += bvx * dt; by += bvy * dt;
      float dx = bx - 120, dy = by - 206, d = hypotf(dx, dy); if (d > 78) { float nx = dx / d, ny = dy / d; bx = 120 + nx * 78; by = 206 + ny * 78; float vn = bvx * nx + bvy * ny; if (vn > 0) { bvx -= 1.6f * vn * nx; bvy -= 1.6f * vn * ny; } }
      if (wordFlash < 0) for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; if (!T.on || T.cool > 0) continue; if (hypotf(T.x + 20 - bx, T.y + 20 - by) < 24) { collect(T, e); if (T.on) { bvx = -bvx * .8f; bvy = -bvy * .8f; } break; } }
    }
    if (gT >= gLen) { lastScore = score; lastGame = game; newBest = score > e.best[game]; if (newBest) push(A_BEST, game, score); push(A_SFX, SFX_END); scr = SC_RESULT; scrT0 = e.ms; }
  }
  void g1Screen(const Env &e) {
    float t = e.ms / 1000.f; wordPanel(e);
    // the mirror
    cv.fillRect(0, MIRROR_Y + 1, SW, SH - MIRROR_Y, C_DEEP, 18);
    for (int x = 0; x < SW; x++) cv.fillRect(x, MIRROR_Y, 1, 2, C_GOLD, (uint32_t)(18 + 10 * sinf(x * .08f + t * 3)));
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0, y = T.y + sinf(T.ph * 1.6f) * 3;
      bool k = word().key && T.ak == need();
      tileDraw(T, T.x + sh, y, k);
      float ry = 2 * MIRROR_Y - (y + 40); tileDraw(T, T.x + sh, ry, k, 11, true); }
    cv.text("Tap a letter or its reflection", 8, 278, C_MUTED, 0, 22);
  }
  void g2Screen(const Env &e) {
    float t = e.ms / 1000.f; wordPanel(e);
    const float cx = 120, cy = 206;
    // beam out through the hole just lit
    if (beamT >= 0) { float an = beamHole / 8.f * 6.283f - 1.5708f; for (int k = 0; k < 3; k++) line(cx + cosf(an) * 70, cy + sinf(an) * 70, cx + cosf(an) * (90 + beamT * 200), cy + sinf(an) * (90 + beamT * 200), 2.5f - k * .6f, C_GOLD2, (uint32_t)(28 * (1 - beamT / .6f))); }
    cv.ring(cx, cy, 86, 9, RGB(150, 60, 38)); cv.ring(cx, cy, 86, 2, RGB(196, 96, 52), 24);
    for (int h = 0; h < 8; h++) { float an = h / 8.f * 6.283f - 1.5708f; cv.disc(cx + cosf(an) * 86, cy + sinf(an) * 86, 5, C_NIGHT); }
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0; tileDraw(T, T.x + sh, T.y, word().key && T.ak == need(), T.cool > 0 ? 18 : 32); }
    // the light
    float f = 1 + .12f * sinf(t * 10);
    cv.glow(bx, by, 26 * f, C_GOLD, .5f); cv.disc(bx, by, 8, C_GOLD2); cv.disc(bx, by, 3.5f, C_WHITE);
    if (gT < 5) cv.textC(e.accel ? "Tilt to move the light" : "Drag to move the light", 120, 99, C_MUTED, 0, (uint32_t)(28 * fminf(1, 5 - gT)));
  }
  void resultScreen(const Env &e) {
    cv.glow(120, 110, 110, C_GOLD, .16f);
    cv.textC(lastGame ? "Lamp Tilt" : "Mirror Letters", 120, 30, C_MUTED, 1);
    char b[12]; snprintf(b, sizeof b, "%d", lastScore); cv.textC(b, 120, 66, C_GOLD, 3);
    cv.textC(newBest ? "New best!" : "Score", 120, 142, newBest ? C_GOLD : C_INK, 1);
    snprintf(b, sizeof b, "Best %d", e.best[lastGame] > lastScore ? e.best[lastGame] : lastScore); cv.textC(b, 120, 172, C_MUTED, 0);
    button(14, 206, 212, 38, B_AGAIN, IC_PLAY, "Play again", 1);
    button(14, 252, 212, 38, B_GAMES, IC_BACK, "Games", 0);
  }
  void settings(const Env &e) {
    backBtn(); cv.text("Settings", 52, 6, C_INK, 2);
    cv.round(12, 54, 216, 64, 18, C_PANEL2); cv.item(ICON[IC_VOL], 22, 70, C_GOLD);
    for (int k = 0; k < 2; k++) { int x = k ? 182 : 64, id = k ? B_VUP : B_VDN; cv.disc(x + 18, 86, 18, C_NIGHT, pressId == id && down ? 18 : 30); cv.fillRect(x + 10, 85, 16, 3, C_INK); if (k) cv.fillRect(x + 17, 78, 3, 16, C_INK); btn(x - 2, 64, 40, 44, id); }
    for (int i = 0; i < 10; i++) cv.round(108 + i * 7, 96 - i * 2 - 6, 5, i * 2 + 6, 1.5f, i < e.vol ? C_GOLD : C_MUTED, i < e.vol ? 32 : 12);
    cv.round(12, 126, 216, 56, 18, C_PANEL2); cv.item(ICON[IC_WIFI], 22, 137, e.net == NET_OK ? C_GOLD : C_MUTED);
    char b[24]; if (e.net == NET_OK) snprintf(b, sizeof b, "%.14s", e.ssid); else snprintf(b, sizeof b, "No Wi-Fi");
    cv.text(b, 60, 132, C_INK, 0); cv.text("Tap to reset", 60, 152, C_MUTED, 0); btn(12, 126, 216, 56, B_WIFI);
    int qs = Canvas::qrSize(QR_SITE_N, 3); cv.qr(QR_SITE_BITS, QR_SITE_N, 12, 192, 3);
    cv.text("Open Hey Tattva", 12 + qs + 10, 206, C_INK, 0); cv.text("on your phone", 12 + qs + 10, 224, C_MUTED, 0); cv.text("heytattva", 12 + qs + 10, 250, C_GOLD, 0); cv.text(".vercel.app", 12 + qs + 10, 266, C_GOLD, 0);
  }
  void setupScreen(const Env &e) {
    cv.textC("Set up Wi-Fi", 120, 4, C_INK, 1);
    cv.textC("On your phone, join:", 120, 30, C_MUTED, 0);
    cv.textC("HeyTattva-Setup", 120, 48, C_GOLD, 1);
    int qs = Canvas::qrSize(QR_WIFI_N, 4); cv.qr(QR_WIFI_BITS, QR_WIFI_N, 120 - qs / 2, 76, 4);
    cv.textC("Pick your Wi-Fi on the page", 120, 80 + qs + 4, C_INK, 0); cv.textC("that opens (or 192.168.4.1)", 120, 98 + qs + 2, C_MUTED, 0);
    button(40, 254, 160, 36, B_SKIP, -1, "Skip", 0);
  }
  void connectScreen(const Env &e) {
    float t = e.ms / 1000.f; cv.glow(120, 120, 90, C_GOLD, .12f); cv.yantraAt(120, 120, 150, t * .9f, C_GOLD, 18);
    cv.textC("Connecting...", 120, 216, C_INK, 1); if (e.ssid[0]) cv.textC(e.ssid, 120, 244, C_MUTED, 0);
  }

  bool frame(const Env &e) {
    watch(e);
    float dt = fminf(.1f, (e.ms - (lastMs ? lastMs : e.ms)) / 1000.f); lastMs = e.ms;
    nb = 0; cv.clearBg();
    switch (scr) {
      case SC_BOOT: boot(e); break;
      case SC_SETUP: setupScreen(e); break;
      case SC_CONNECT: connectScreen(e); break;
      case SC_HOME: home(e); break;
      case SC_REEL: reelScreen(e); break;
      case SC_GAMES: gamesScreen(e); break;
      case SC_G1: updGame(dt, e); if (scr == SC_G1) g1Screen(e); break;
      case SC_G2: updGame(dt, e); if (scr == SC_G2) g2Screen(e); break;
      case SC_RESULT: resultScreen(e); break;
      case SC_SETTINGS: settings(e); break;
    }
    parts_(dt); drawToast(e);
    return true;
  }
};
