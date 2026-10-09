// Hey Tattva on the Cheeko Gotchi: screens, five reels, five games and the Rock stage, for tattvas 1, 2, 4, 6, 8.
// Plain C++ (no Arduino calls), so the PC simulator draws exactly what the device shows. The hardware layer fills Env
// each frame and carries out Acts.
#pragma once
#include <stdio.h>
#include <stdlib.h>
#include "gfx.h"

enum NetSt { NET_OFF, NET_CONNECTING, NET_OK, NET_PORTAL, NET_FAILED };
enum VoiceSt { VO_NONE, VO_LOADING, VO_PLAYING, VO_NEEDNET, VO_ERR };
enum Scr { SC_BOOT, SC_SETUP, SC_CONNECT, SC_HOME, SC_REEL, SC_GAMES, SC_GAME, SC_RESULT, SC_ROCK, SC_SETTINGS };
enum ActT { A_NONE, A_REEL, A_ROCK, A_PAUSE, A_RESUME, A_STOP, A_GAME, A_SFX, A_VOL, A_WIFI_RESET, A_WIFI_SKIP, A_BEST };
enum Sfx { SFX_TAP = 1, SFX_GOOD, SFX_BAD, SFX_WORD, SFX_END };
struct Act { ActT t; int a, b; };

struct Env {
  uint32_t ms = 0;
  bool timeOk = false; int hh = 0, mm = 0;
  NetSt net = NET_OFF; char ssid[33] = ""; int rssi = -100;
  VoiceSt voice = VO_NONE, band = VO_NONE;  // the recitation; the rock band track
  float voiceProg = 0, bedT = 0, bedLen = 30, level = 0;
  int vol = 6;                               // 0..10
  bool accel = false; float tx = 0, ty = 0;  // tilt in g, already mapped to screen axes
  int best[NT] = {0};
};
struct Btn { int x, y, w, h, id; };
struct Part { float x, y, vx, vy, life; uint16_t c; };
#define C_FIRE RGB(255, 96, 24)
#define C_EMBER RGB(255, 170, 60)

static const char *GNAME[NT] = {"Mirror Letters", "Grow the Seed", "Lamp Tilt", "Eclipse", "Dream Cards"};

struct UI {
  Canvas cv;
  Scr scr = SC_BOOT; uint32_t scrT0 = 0;
  int reel = 0, rock = 0;    // which tattva (0..NT-1) the reel / rock stage shows
  bool paused = false, skippedWifi = false;
  Btn btns[20]; int nb = 0; int pressId = -1;
  Act q[12]; int qn = 0;
  bool down = false; int tx0 = 0, ty0 = 0, tx = 0, ty = 0; uint32_t td0 = 0;
  char toastTxt[48] = ""; uint32_t toastUntil = 0;
  NetSt lastNet = NET_OFF; uint32_t resetArmed = 0;
  Part parts[48]; int np = 0;
  uint32_t seed = 12345;
  // ---- game state ----
  int game = 0; float gT = 0, gLen = 45; int score = 0, combo = 0, wi = 0, got = 0, wordsDone = 0; uint32_t lastMs = 0;
  struct Tile { float x, y, vx, vy, ph, shake, cool, open, peek; uint8_t ak; bool on, done; int hole; } tiles[9]; int nt = 0;
  float bx = 120, by = 200, bvx = 0, bvy = 0;   // Lamp Tilt: the light
  float laneX[2] = {10, 40}, laneV = 18;        // Mirror Letters: two rows moving opposite ways
  float ringA = 0, moonA = 3.14f;               // Eclipse: the letter ring and the moon
  float growK = 0;                              // Grow the Seed: how grown the tree is
  float beamT = -1; int beamHole = 0; float wordFlash = -1;
  uint8_t order[8];
  int lastScore = 0, lastGame = 0; bool newBest = false;

  float rnd() { seed = seed * 1664525u + 1013904223u; return (seed >> 8) / 16777216.f; }
  void push(ActT t, int a = 0, int b = 0) { if (qn < 12) q[qn++] = {t, a, b}; }
  bool pop(Act &a) { if (!qn) return false; a = q[0]; for (int i = 1; i < qn; i++) q[i - 1] = q[i]; qn--; return true; }
  bool playing() const { return scr == SC_REEL || scr == SC_ROCK || scr == SC_GAME; }
  void go(Scr s, uint32_t ms) { if (playing() && s != scr) push(A_STOP); scr = s; scrT0 = ms; }
  void toast(const char *t, uint32_t ms, uint32_t dur = 2200) { snprintf(toastTxt, sizeof toastTxt, "%s", t); toastUntil = ms + dur; }
  void btn(int x, int y, int w, int h, int id) { if (nb < 20) btns[nb++] = {x, y, w, h, id}; }
  int hit(int x, int y) const { for (int i = nb - 1; i >= 0; i--) { const Btn &b = btns[i]; if (x >= b.x - 5 && x < b.x + b.w + 5 && y >= b.y - 5 && y < b.y + b.h + 5) return b.id; } return -1; }
  void burst(float x, float y, uint16_t c, int n) { for (int i = 0; i < n && np < 48; i++) { float a = rnd() * 6.283f, s = 40 + rnd() * 90; parts[np++] = {x, y, cosf(a) * s, sinf(a) * s - 30, .7f + rnd() * .4f, c}; } }

  // ---------- input ----------
  enum { B_REELS = 1, B_GAMES, B_ROCK, B_SET, B_BACK, B_AGAIN, B_VDN, B_VUP, B_WIFI, B_SKIP, B_PLAY, B_PREV, B_NEXT, B_G0 = 40 };
  void touchDown(int x, int y, uint32_t ms) { down = true; tx0 = tx = x; ty0 = ty = y; td0 = ms; pressId = hit(x, y); }
  void touchMove(int x, int y) { tx = x; ty = y; if (abs(tx - tx0) > 16 || abs(ty - ty0) > 16) pressId = -1; }
  void touchUp(const Env &e) {
    if (!down) return; down = false; int pid = pressId; pressId = -1;
    int dx = tx - tx0, dy = ty - ty0;
    if (scr == SC_GAME && game == 2) { if (abs(dx) > 70 && abs(dy) < 30 && dx > 0 && tx0 < 40) back(e); return; }  // dragging steers the light; edge swipe leaves
    if (abs(dy) > 40 && abs(dy) > abs(dx) * 1.2f && (scr == SC_REEL || scr == SC_ROCK)) { step(dy < 0 ? 1 : -1); return; }
    if (abs(dx) > 50 && abs(dx) > abs(dy) * 1.2f) { if (dx > 0) back(e); return; }
    if (abs(dx) < 16 && abs(dy) < 16) {
      if (pid >= 0) { press(pid, e); return; }
      if (scr == SC_REEL || scr == SC_ROCK) togglePause();
      else if (scr == SC_GAME) tapGame(tx0, ty0, e);
    }
  }
  void togglePause() { paused = !paused; push(paused ? A_PAUSE : A_RESUME); }
  void step(int d) {  // next / previous tattva on the reel or rock stage
    paused = false;
    if (scr == SC_REEL) { reel = (reel + d + NT) % NT; push(A_REEL, reel); }
    else { rock = (rock + d + NT) % NT; push(A_ROCK, rock); }
  }
  void back(const Env &e) {
    if (scr == SC_REEL || scr == SC_GAMES || scr == SC_SETTINGS || scr == SC_ROCK) go(SC_HOME, e.ms);
    else if (scr == SC_GAME || scr == SC_RESULT) go(SC_GAMES, e.ms);
  }
  void press(int id, const Env &e) {
    uint32_t ms = e.ms; push(A_SFX, SFX_TAP);
    if (id == B_REELS) { go(SC_REEL, ms); paused = false; push(A_REEL, reel); }
    else if (id == B_ROCK) { go(SC_ROCK, ms); paused = false; push(A_ROCK, rock); }
    else if (id == B_GAMES) go(SC_GAMES, ms);
    else if (id == B_SET) go(SC_SETTINGS, ms);
    else if (id == B_BACK) back(e);
    else if (id >= B_G0 && id < B_G0 + NT) startGame(id - B_G0, ms);
    else if (id == B_AGAIN) startGame(lastGame, ms);
    else if (id == B_PLAY) togglePause();
    else if (id == B_PREV) step(-1);
    else if (id == B_NEXT) step(1);
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
    bool pr = pressId == id && down; uint16_t bg = style == 1 ? C_GOLD : style == 2 ? C_KUM : C_PANEL2, fg = style == 1 ? C_NIGHT : C_INK; int r = h / 2 < 20 ? h / 2 : 20;
    cv.round(x, y, w, h, r, bg, pr ? 22 : 32); if (style == 0) cv.round(x, y, w, h, r, C_CHANDAN, pr ? 16 : 9, 1.3f); if (style == 2) cv.round(x, y, w, h, r, C_EMBER, pr ? 14 : 20, 1.3f);
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
  void pill(const char *st, int y, uint16_t bg = C_NIGHT) { int w = Canvas::textW(st, 0) + 20; cv.round(120 - w / 2, y, w, 24, 12, bg, 28); cv.textC(st, 120, y + 2, C_MUTED, 0); }

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
    cv.glow(120, 70, 64, C_GOLD, .12f); cv.yantraAt(120, 70, 100, t * .12f, C_GOLD, 24);
    cv.textC("Hey Tattva", 120, 120, C_INK, 2);
    button(14, 166, 212, 38, B_REELS, IC_FILM, "Reels", 1);
    button(14, 210, 212, 38, B_GAMES, IC_CHAKRA, "Games", 0);
    button(14, 254, 212, 38, B_ROCK, IC_GUITAR, "Rock", 2);
  }
  // ---- reel visuals ----
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
  // tattva 2: a seed that becomes a tree (the world rests in the Self like a tree in a seed), and back
  void branch(float x, float y, float an, float len, int d, float g, float t) {
    if (d == 0 || len < 2) return;
    float k = fminf(1, fmaxf(0, g * 6 - (6 - d))); if (k <= 0) return;  // deeper branches appear later
    float sw = sinf(t * 1.3f + d) * .04f, x2 = x + cosf(an + sw) * len * k, y2 = y + sinf(an + sw) * len * k;
    line(x, y, x2, y2, .6f + d * .45f, RGB(150, 98, 58), 30);
    if (d <= 2 && k > .6f) { cv.disc(x2, y2, d == 1 ? 2.2f : 3.f, d == 1 ? C_GOLD2 : RGB(120, 190, 90), 26); if (d == 1 && g > .9f) cv.glow(x2, y2, 9, C_GOLD, .3f); }
    branch(x2, y2, an - .45f, len * .72f, d - 1, g, t); branch(x2, y2, an + .42f, len * .7f, d - 1, g, t);
  }
  void seedTree(float t) {
    float cyc = fmodf(t / 16.f, 1.f), g = cyc < .7f ? cyc / .7f : cyc < .85f ? 1 : 1 - (cyc - .85f) / .15f;
    cv.glow(120, 120, 110, C_GOLD, .07f + .06f * g);
    cv.fillRect(20, 164, 200, 2, RGB(150, 98, 58), 24);
    for (int i = 0; i < 18; i++) cv.disc(28 + i * 11, 168 + (i * 7 % 5), 1.4f, RGB(150, 98, 58), 16);
    // the seed, glowing inside when small
    float sr = 9 * (1 - g * .6f); cv.round(120 - (int)sr, (int)(160 - sr * 1.3f), (int)(sr * 2), (int)(sr * 2.6f), sr, RGB(150, 98, 58), 30);
    cv.glow(120, 156, 16 * (1 - g) + 2, C_GOLD, .5f * (1 - g));
    if (g > .02f) branch(120, 158, -1.5708f, 31, 6, g, t);
    for (int i = 0; i < 8; i++) { float ph = fmodf(t * .2f + i * .125f, 1.f); cv.disc(40 + i * 23 + sinf(t + i) * 5, 160 - ph * 130, 1.4f, C_GOLD2, (uint32_t)(22 * (1 - ph) * g)); }
  }
  // tattva 6: the sun eclipsed by the moon, then shining again (deep sleep and waking)
  void eclipse(float t) {
    const float cx = 120, cy = 104; float cyc = fmodf(t / 12.f, 1.f), mx = -40 + cyc * 320, cover = fmaxf(0, 1 - fabsf(mx - cx) / 70.f);
    for (int i = 0; i < 24; i++) { float sx = 14 + (i * 97 % 212), sy = 40 + (i * 53 % 130); cv.disc(sx, sy, 1, C_INK, (uint32_t)(28 * cover * (.5f + .5f * sinf(t * 2 + i)))); }
    cv.glow(cx, cy, 100, C_GOLD, .22f * (1 - cover * .7f));
    for (int i = 0; i < 16; i++) { float an = i / 16.f * 6.283f + t * .1f, l = 52 + 10 * sinf(t * 1.7f + i * 2); line(cx + cosf(an) * 44, cy + sinf(an) * 44, cx + cosf(an) * l, cy + sinf(an) * l, 1.3f, C_GOLD2, (uint32_t)(12 + 14 * cover)); }
    cv.disc(cx, cy, 40, C_GOLD); cv.disc(cx, cy, 30, C_GOLD2, 20);
    cv.disc(mx, cy - 2, 41, RGB(12, 10, 32));
    if (cover > .9f) { float an = -.9f; cv.glow(cx + cosf(an) * 40, cy + sinf(an) * 40, 16, C_WHITE, .7f); }
  }
  // tattva 8: one light playing many roles, like a dreamer in a dream
  void dream(float t) {
    const float cx = 120, cy = 98; static const char *R[6] = {"teacher", "student", "parent", "child", "owner", "owned"};
    cv.glow(cx, cy, 110, C_GOLD, .08f);
    cv.disc(26, 162, 11, C_GOLD2, 28); cv.disc(31, 158, 10, C_DEEP);  // crescent moon
    for (int i = 0; i < 3; i++) { float ph = fmodf(t * .3f + i * .33f, 1.f); cv.text("z", 38 + (int)(ph * 12), 150 - (int)(ph * 30), C_MUTED, 0, (uint32_t)(24 * (1 - ph))); }
    for (int i = 0; i < 6; i++) {
      float an = i / 6.f * 6.283f + t * .35f, x = cx + cosf(an) * 76, y = cy + sinf(an) * 38, depth = (sinf(an) + 1) * .5f;
      line(cx, cy, x, y, .7f, C_GOLD, (uint32_t)(5 + 6 * depth));
      cv.disc(x, y, 10 + 4 * depth, C_PANEL2, 30); cv.disc(x, y, 4 + depth * 2, C_GOLD, (uint32_t)(18 + 12 * depth));
      cv.textC(R[i], (int)x, (int)y + (depth > .5f ? 13 : -32), C_MUTED, 0, (uint32_t)(12 + 18 * depth));
    }
    float p = 1 + .08f * sinf(t * 2.5f); cv.glow(cx, cy, 30 * p, C_GOLD, .55f); cv.disc(cx, cy, 11, C_GOLD2); cv.disc(cx, cy, 5, C_WHITE);
  }
  void visual(int k, float t) { if (k == 0) mirrorCity(t); else if (k == 1) seedTree(t); else if (k == 2) lampPot(t); else if (k == 3) eclipse(t); else dream(t); }
  // the verse line in a panel, following the recitation
  void versePanel(int k, const Env &e, uint16_t bg, uint16_t edge, uint32_t ea) {
    int li = e.voice == VO_PLAYING ? (int)fminf(3, e.voiceProg * 4) : ((int)(e.bedT / 7)) % 4;
    int d = LD[k][li], is = LI[k][li], h = ih(d) + 5 + ih(is), y0 = 188 + (102 - h) / 2;
    cv.round(6, 184, 228, 108, 16, bg, 27); if (ea) cv.round(6, 184, 228, 108, 16, edge, ea, 1.4f);
    itemAt(d, 120 - iw(d) / 2, y0, C_INK); itemAt(is, 120 - iw(is) / 2, y0 + ih(d) + 5, C_GOLD2);
  }
  void dots(int k, uint16_t on) { for (int i = 0; i < NT; i++) cv.disc(232, 96 + i * 12, i == k ? 3.2f : 2.4f, i == k ? on : C_MUTED, i == k ? 32 : 14); }
  void reelScreen(const Env &e) {
    float t = e.ms / 1000.f; int n = TTN[reel];
    visual(reel, t);
    float prog = e.voice == VO_PLAYING ? e.voiceProg : fmodf(e.bedT / e.bedLen, 1.f);
    cv.fillRect(0, 0, SW, 3, C_PANEL2); cv.fillRect(0, 0, (int)(SW * prog), 3, C_GOLD);
    cv.item(SYMI[reel], 6, 8, C_GOLD);
    char b[24]; snprintf(b, sizeof b, "Tattva %d", n); cv.text(b, 46, 8, C_GOLD, 0); cv.text(TNAME[reel], 46, 24, C_INK, 0);
    dots(reel, C_GOLD);
    versePanel(reel, e, C_DEEP, 0, 0);
    const char *st = e.voice == VO_LOADING ? "Loading voice..." : e.voice == VO_NEEDNET ? "No Wi-Fi: music only" : e.voice == VO_ERR ? "Voice not reachable" : nullptr;
    if (st) pill(st, 156);
    if (paused) { cv.disc(120, 100, 30, C_NIGHT, 24); cv.item(ICON[IC_PLAY], 104, 84, C_INK); }
  }
  // ---- Rock stage: black and fire, stage lights, the band's level on an equaliser ----
  void rockScreen(const Env &e) {
    float t = e.ms / 1000.f; int n = TTN[rock];
    cv.fill(RGB(8, 4, 6));
    cv.glow(120, 300, 170, C_KUM, .55f); cv.glow(120, 290, 90, C_FIRE, .35f + .3f * e.level);
    // two stage lights sweeping
    for (int s = 0; s < 2; s++) { float sx = s ? 230 : 10, an = 1.5708f + (s ? 1 : -1) * (.35f + .3f * sinf(t * .9f + s * 2)); for (int k = 0; k < 3; k++) line(sx, 66, sx + cosf(an + (k - 1) * .06f) * 130, 66 + sinf(an + (k - 1) * .06f) * 130, 3.5f - k * .8f, s ? C_EMBER : C_GOLD2, 3); cv.disc(sx, 66, 4, C_GOLD2, 26); }
    // equaliser
    for (int i = 0; i < 18; i++) { float v = e.level * (.45f + .55f * fabsf(sinf(t * (3 + i * .37f) + i * 1.7f))); if (paused) v = .05f; int h = 4 + (int)(v * 70);
      for (int y = 0; y < h; y += 4) { uint16_t c = y > 50 ? C_GOLD2 : y > 26 ? C_EMBER : C_FIRE; cv.fillRect(12 + i * 12, 176 - y, 9, 3, c, 30); } }
    // embers rising
    for (int i = 0; i < 16; i++) { float ph = fmodf(t * (.3f + (i % 4) * .07f) + i * .0625f, 1.f); cv.disc(16 + (i * 53 % 208) + sinf(t * 2 + i) * 8, 180 - ph * 150, 1.5f, i % 3 ? C_FIRE : C_GOLD2, (uint32_t)(28 * (1 - ph))); }
    backBtn();
    cv.text("ROCK", 52, 0, C_FIRE, 4);
    char b[24]; snprintf(b, sizeof b, "TATTVA %d", n); cv.textR(b, 226, 12, C_GOLD2, 1); cv.textC(TNAME[rock], 120, 44, C_INK, 0);
    dots(rock, C_FIRE);
    // controls on the stage
    bool pp = pressId == B_PLAY && down; cv.disc(120, 110, 28, C_KUM, pp ? 22 : 30); cv.ring(120, 110, 28, 1.6f, C_EMBER, 24); cv.item(ICON[paused ? IC_PLAY : IC_PAUSE], 104, 94, C_INK); btn(88, 78, 64, 64, B_PLAY);
    for (int k = 0; k < 2; k++) { int x = k ? 196 : 44, id = k ? B_NEXT : B_PREV; bool pr = pressId == id && down; cv.disc(x, 110, 18, RGB(40, 14, 16), pr ? 20 : 30);
      int s = k ? 1 : -1; for (int j = 0; j < 7; j++) cv.fillRect(x - s * 4 + s * j, 110 - (6 - j), 2, 2 * (6 - j) + 1, C_INK); btn(x - 22, 88, 44, 44, id); }
    versePanel(rock, e, RGB(20, 8, 10), C_FIRE, 18);
    const char *st = e.band == VO_LOADING ? "Loading the band..." : e.voice == VO_LOADING ? "Loading voice..." : e.band == VO_NEEDNET ? "Wi-Fi needed for the band" : e.band == VO_ERR ? "Band not reachable" : nullptr;
    if (st) pill(st, 148, RGB(30, 10, 12));
  }
  void gamesScreen(const Env &e) {
    backBtn(); cv.text("Games", 52, 6, C_INK, 2);
    for (int g = 0; g < NT; g++) {
      int y = 48 + g * 49, id = B_G0 + g; bool pr = pressId == id && down;
      cv.round(10, y, 220, 44, 16, C_PANEL2, pr ? 22 : 32); cv.round(10, y, 220, 44, 16, C_CHANDAN, 7, 1.1f);
      cv.item(SYMI[g], 16, y + 4, C_GOLD); cv.text(GNAME[g], 58, y + 2, C_INK, 1);
      char b[40]; snprintf(b, sizeof b, "Tattva %d", TTN[g]); cv.text(b, 58, y + 23, C_MUTED, 0);
      snprintf(b, sizeof b, "%d", e.best[g]); if (e.best[g]) cv.textR(b, 220, y + 12, C_GOLD, 1); else cv.item(ICON[IC_PLAY], 190, y + 5, C_GOLD);
      btn(10, y, 220, 44, id);
    }
  }
  // ---------- games ----------
  const Word &word() const { return WORDS[game][order[wi % NWORDS[game]]]; }
  int need() const { const Word &w = word(); return got < w.n ? w.ak[got] : -1; }
  void startGame(int g, uint32_t ms) {
    game = g; gT = 0; score = 0; combo = 0; wi = 0; got = 0; wordsDone = 0; np = 0; beamT = -1; wordFlash = -1; lastMs = ms; seed = ms * 2654435761u + 1; growK = 0;
    int n = NWORDS[g]; for (int i = 0; i < n; i++) order[i] = i; for (int i = n - 1; i > 0; i--) { int j = (int)(rnd() * (i + 1)); uint8_t t = order[i]; order[i] = order[j]; order[j] = t; }
    for (int i = 0; i < n; i++) if (WORDS[g][order[i]].key) { uint8_t t = order[0]; order[0] = order[i]; order[i] = t; break; }  // the key word first
    bx = 120; by = 214; bvx = bvy = 0; nt = 0;
    layout(true); scr = SC_GAME; scrT0 = ms; push(A_GAME, g);
  }
  // which letters are on screen: the one needed, the next ones of the word and decoys from the same tattva
  void pickLetters(int *list, int &nl, int want, bool wholeWord) {
    const Word &w = word(); int pool[48], pn = 0; nl = 0;
    for (int k = 0; k < NWORDS[game]; k++) { const Word &x = WORDS[game][k]; for (int j = 0; j < x.n; j++) { bool dup = false; for (int q = 0; q < pn; q++) if (pool[q] == x.ak[j]) dup = true; if (!dup && pn < 48) pool[pn++] = x.ak[j]; } }
    auto add = [&](int c) { for (int q = 0; q < nl; q++) if (list[q] == c) return; if (nl < want) list[nl++] = c; };
    if (wholeWord) for (int j = 0; j < w.n; j++) add(w.ak[j]);
    else { add(need()); for (int j = got + 1; j < w.n && nl < 3; j++) add(w.ak[j]); }
    int guard = 0; while (nl < want && guard++ < 80) add(pool[(int)(rnd() * pn)]);
    for (int i = nl - 1; i > 0; i--) { int j = (int)(rnd() * (i + 1)); int t = list[i]; list[i] = list[j]; list[j] = t; }
  }
  void layout(bool fresh) {
    int list[9], nl;
    if (game == 4) {  // Dream Cards: a 3x3 grid holding the whole word, dealt once per word
      if (!fresh) return;
      pickLetters(list, nl, 9, true); nt = nl;
      for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; T = {}; T.ak = list[i]; T.on = true; T.x = 16 + (i % 3) * 72; T.y = 118 + (i / 3) * 59; T.open = 1; T.peek = 1.6f; }  // a peek at the start
      return;
    }
    pickLetters(list, nl, 5, false);
    int holes[8] = {0, 1, 2, 3, 4, 5, 6, 7}; for (int i = 7; i > 0; i--) { int j = (int)(rnd() * (i + 1)); int t = holes[i]; holes[i] = holes[j]; holes[j] = t; }
    bool keep = !fresh && nt == nl && game != 2;
    nt = nl;
    for (int i = 0; i < nl; i++) { Tile &T = tiles[i]; T.ak = list[i]; T.on = true; T.done = false; T.shake = 0; T.cool = 0; if (keep) continue; T.ph = rnd() * 6;
      if (game == 0) { int row = i < 3 ? 0 : 1; T.x = (row ? laneX[1] + (i - 3) * 140 : laneX[0] + i * 93); if (T.x > 240) T.x -= 280; T.y = row ? 150 : 104; T.vx = row ? -laneV : laneV; }
      else if (game == 1) { T.x = 6 + i * 46; T.y = 140 + rnd() * 100; T.vy = -(14 + rnd() * 12); }
      else if (game == 2) { T.hole = holes[i]; float an = T.hole / 8.f * 6.283f - 1.5708f; T.x = 120 + cosf(an) * 64 - 20; T.y = 206 + sinf(an) * 64 - 20; }
      else { T.hole = i; } }
  }
  bool hiddenE(const Tile &T) const { float d = fmodf(fabsf(T.ph - moonA), 6.2832f); if (d > 3.1416f) d = 6.2832f - d; return d < .42f; }  // Eclipse: behind the moon
  void collect(Tile &T, const Env &e) {
    const Word &w = word(); bool key = w.key;
    if (T.ak == need()) {
      got++; combo++; score += (10 + (combo > 5 ? 10 : combo * 2)) * (key ? 2 : 1); push(A_SFX, SFX_GOOD);
      burst(T.x + 20, T.y + 20, C_GOLD, 14);
      if (game == 4) { T.done = true; T.open = 1; } else T.on = false;
      if (game == 2) { beamT = 0; beamHole = T.hole; }
      if (got >= w.n) { score += 25 * (key ? 2 : 1); wordFlash = 0; wordsDone++; push(A_SFX, SFX_WORD); }
      else layout(false);
    } else { combo = 0; int pen = game == 4 ? 3 : 5; score = score > pen ? score - pen : 0; T.shake = .4f; T.cool = .7f; push(A_SFX, SFX_BAD); if (game == 4) T.peek = .9f; }
  }
  // where a tile is tapped; returns its index or -1
  int tileAt(int x, int y) {
    for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; if (!T.on || T.done) continue;
      if (game == 3 && hiddenE(T)) continue;
      int w = game == 4 ? 64 : 40, h = game == 4 ? 48 : 40;
      if (x >= T.x - 4 && x < T.x + w + 4 && y >= T.y - 4 && y < T.y + h + 4) return i;
      if (game == 0) { float ry = 2 * MIRROR_Y - (T.y + sinf(T.ph * 1.6f) * 3 + 40); if (x >= T.x - 4 && x < T.x + 44 && y >= ry - 4 && y < ry + 44) return i; } }
    return -1;
  }
  void tapGame(int x, int y, const Env &e) {
    if (wordFlash >= 0) return;
    int i = tileAt(x, y); if (i < 0) return;
    Tile &T = tiles[i]; if (game == 4 && T.peek > 0) return;  // that card is already showing
    collect(T, e);
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
    if (wordFlash >= 0) { wordFlash += dt; if (wordFlash > .9f) { wordFlash = -1; wi++; got = 0; layout(true); } }
    if (beamT >= 0) { beamT += dt; if (beamT > .6f) beamT = -1; }
    growK += (fminf(1.f, (wordsDone + (float)got / word().n) / 5.f) - growK) * fminf(1, dt * 3);
    ringA += dt * .28f; moonA -= dt * (.62f + gT * .006f);
    for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; T.shake = fmaxf(0, T.shake - dt); T.cool = fmaxf(0, T.cool - dt); T.peek = fmaxf(0, T.peek - dt);
      if (game == 0) { T.ph += dt; T.x += T.vx * dt; if (T.x > 240) T.x -= 280; if (T.x < -40) T.x += 280; }
      else if (game == 1) { T.ph += dt; T.y += T.vy * dt; T.x = 6 + i * 46 + sinf(T.ph * 1.3f) * 3; if (T.y < 100) { T.y = 250; T.vy = -(14 + rnd() * 12); } }
      else if (game == 3) { T.ph = ringA + T.hole * 6.2832f / nt; T.x = 120 + cosf(T.ph) * 74 - 20; T.y = 196 + sinf(T.ph) * 74 - 20; }
      else if (game == 4) { float want = T.done || T.peek > 0 ? 1 : 0; T.open += (want - T.open) * fminf(1, dt * 10); } }
    if (game == 0) { laneX[0] = fmodf(laneX[0] + laneV * dt + 280, 280); laneX[1] = fmodf(laneX[1] - laneV * dt + 280, 280); if (laneX[0] > 240) laneX[0] -= 280; if (laneX[1] > 240) laneX[1] -= 280; }
    if (game == 2) {  // the light: tilt, or drag towards the finger
      if (down) { bvx += (tx - bx) * 9 * dt; bvy += (ty - by) * 9 * dt; bvx *= .9f; bvy *= .9f; }
      else if (e.accel) { bvx += e.tx * 900 * dt; bvy += e.ty * 900 * dt; bvx *= powf(.4f, dt); bvy *= powf(.4f, dt); }
      float sp = hypotf(bvx, bvy); if (sp > 260) { bvx *= 260 / sp; bvy *= 260 / sp; }
      bx += bvx * dt; by += bvy * dt;
      float dx = bx - 120, dy = by - 206, d = hypotf(dx, dy); if (d > 78) { float nx = dx / d, ny = dy / d; bx = 120 + nx * 78; by = 206 + ny * 78; float vn = bvx * nx + bvy * ny; if (vn > 0) { bvx -= 1.6f * vn * nx; bvy -= 1.6f * vn * ny; } }
      if (wordFlash < 0) for (int i = 0; i < nt; i++) { Tile &T = tiles[i]; if (!T.on || T.cool > 0) continue; if (hypotf(T.x + 20 - bx, T.y + 20 - by) < 24) { collect(T, e); if (T.on) { bvx = -bvx * .8f; bvy = -bvy * .8f; } break; } }
    }
    if (gT >= gLen) { lastScore = score; lastGame = game; newBest = score > e.best[game]; if (newBest) push(A_BEST, game, score); push(A_SFX, SFX_END); scr = SC_RESULT; scrT0 = e.ms; }
  }
  bool keyTile(const Tile &T) const { return word().key && T.ak == need(); }
  void hint(const char *s) { if (gT < 5) cv.textC(s, 120, 99, C_MUTED, 0, (uint32_t)(28 * fminf(1, 5 - gT))); }
  void drawMirror(float t) {
    cv.fillRect(0, MIRROR_Y + 1, SW, SH - MIRROR_Y, C_DEEP, 18);
    for (int x = 0; x < SW; x++) cv.fillRect(x, MIRROR_Y, 1, 2, C_GOLD, (uint32_t)(18 + 10 * sinf(x * .08f + t * 3)));
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0, y = T.y + sinf(T.ph * 1.6f) * 3;
      tileDraw(T, T.x + sh, y, keyTile(T)); tileDraw(T, T.x + sh, 2 * MIRROR_Y - (y + 40), keyTile(T), 11, true); }
    cv.text("Tap a letter or its reflection", 8, 278, C_MUTED, 0, 22);
  }
  void drawSeed(float t) {
    // the tree grows as words are finished
    cv.fillRect(0, 262, SW, 34, RGB(60, 38, 28), 30); cv.fillRect(0, 262, SW, 2, RGB(150, 98, 58), 30);
    if (growK > .01f) branch(120, 262, -1.5708f, 52, 6, growK, t); else cv.disc(120, 258, 5, RGB(150, 98, 58));
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0;
      cv.glow(T.x + 20, T.y + 20, 26, C_GOLD, .12f); tileDraw(T, T.x + sh, T.y, keyTile(T)); cv.disc(T.x + 20, T.y + 43, 3, RGB(120, 190, 90), 24); }
    hint("Tap the rising seeds in order");
  }
  void drawLamp(float t) {
    const float cx = 120, cy = 206;
    if (beamT >= 0) { float an = beamHole / 8.f * 6.283f - 1.5708f; for (int k = 0; k < 3; k++) line(cx + cosf(an) * 70, cy + sinf(an) * 70, cx + cosf(an) * (90 + beamT * 200), cy + sinf(an) * (90 + beamT * 200), 2.5f - k * .6f, C_GOLD2, (uint32_t)(28 * (1 - beamT / .6f))); }
    cv.ring(cx, cy, 86, 9, RGB(150, 60, 38)); cv.ring(cx, cy, 86, 2, RGB(196, 96, 52), 24);
    for (int h = 0; h < 8; h++) { float an = h / 8.f * 6.283f - 1.5708f; cv.disc(cx + cosf(an) * 86, cy + sinf(an) * 86, 5, C_NIGHT); }
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0; tileDraw(T, T.x + sh, T.y, keyTile(T), T.cool > 0 ? 18 : 32); }
    float f = 1 + .12f * sinf(t * 10);
    cv.glow(bx, by, 26 * f, C_GOLD, .5f); cv.disc(bx, by, 8, C_GOLD2); cv.disc(bx, by, 3.5f, C_WHITE);
  }
  void drawEclipse(float t, const Env &e) {
    const float cx = 120, cy = 196;
    cv.glow(cx, cy, 60, C_GOLD, .3f); cv.disc(cx, cy, 26, C_GOLD); cv.disc(cx, cy, 18, C_GOLD2, 18);
    cv.ring(cx, cy, 74, 1, C_GOLD, 8);
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; if (!T.on) continue; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0; tileDraw(T, T.x + sh, T.y, keyTile(T), hiddenE(T) ? 6 : 32); }
    float mx = cx + cosf(moonA) * 74, my = cy + sinf(moonA) * 74;  // Rahu, the moon that hides letters
    cv.glow(mx, my, 40, C_KUM, .18f); cv.disc(mx, my, 30, RGB(12, 10, 32)); cv.ring(mx, my, 30, 1.2f, C_KUM, 18);
    hint("Tap before the moon hides it");
  }
  void drawDream(float t) {
    for (int i = 0; i < nt; i++) { const Tile &T = tiles[i]; float sh = T.shake > 0 ? sinf(T.shake * 60) * 4 : 0;
      float o = T.open, s = fabsf(1 - 2 * o); int w = (int)(64 * fmaxf(.08f, s)), x = (int)(T.x + sh) + (64 - w) / 2, y = (int)T.y;
      if (o < .5f) {  // back: night card with a crescent
        cv.round(x, y, w, 48, 10, C_PANEL2); cv.round(x, y, w, 48, 10, C_GOLD, 12, 1.2f);
        if (w > 30) { cv.disc(x + w / 2, y + 24, 9, C_GOLD2, 26); cv.disc(x + w / 2 + 4, y + 21, 8, C_PANEL2); }
      } else {
        cv.round(x, y, w, 48, 10, T.done ? C_GOLD : C_CHANDAN, T.done ? 22 : 32);
        if (w > 40) { int it = AKI[T.ak]; itemAt(it, x + w / 2 - iw(it) / 2, y + 24 - ih(it) / 2, C_NIGHT, T.done ? 20 : 32); }
      } }
    hint(gT < 1.6f ? "Remember the letters!" : "Find the letters under the cards");
  }
  void gameScreen(const Env &e) {
    float t = e.ms / 1000.f; wordPanel(e);
    if (game == 0) drawMirror(t); else if (game == 1) drawSeed(t); else if (game == 2) { drawLamp(t); hint(e.accel ? "Tilt to move the light" : "Drag to move the light"); } else if (game == 3) drawEclipse(t, e); else drawDream(t);
  }
  void resultScreen(const Env &e) {
    cv.glow(120, 110, 110, C_GOLD, .16f);
    cv.textC(GNAME[lastGame], 120, 30, C_MUTED, 1);
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
      case SC_ROCK: rockScreen(e); break;
      case SC_GAMES: gamesScreen(e); break;
      case SC_GAME: updGame(dt, e); if (scr == SC_GAME) gameScreen(e); else resultScreen(e); break;
      case SC_RESULT: resultScreen(e); break;
      case SC_SETTINGS: settings(e); break;
    }
    parts_(dt); drawToast(e);
    return true;
  }
};
