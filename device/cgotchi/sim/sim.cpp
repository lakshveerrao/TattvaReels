// PC simulator for Hey Tattva on the Cheeko Gotchi: renders the screens to PPM and runs scripted touch and game tests.
// Build: g++ -O2 -std=c++17 -I../HeyTattvaCG sim.cpp -o sim -lz && ./sim outdir
#include <cstdio>
#include <cstdlib>
#include <string>
#include <zlib.h>
#include "ui.h"
static UI ui; static Env env;
static void save(const std::string &f) {
  FILE *o = fopen(f.c_str(), "wb"); fprintf(o, "P6 %d %d 255\n", SW, SH);
  for (int i = 0; i < SW * SH; i++) { uint16_t c = ui.cv.px[i]; unsigned char p[3] = {(unsigned char)(((c >> 11) & 31) * 255 / 31), (unsigned char)(((c >> 5) & 63) * 255 / 63), (unsigned char)((c & 31) * 255 / 31)}; fwrite(p, 1, 3, o); }
  fclose(o);
}
static const char *D;
static void shot(const char *name) { ui.frame(env); save(std::string(D) + "/" + name + ".ppm"); }
static int fails = 0;
static void check(bool ok, const char *what) { printf("%s %s\n", ok ? "ok  " : "FAIL", what); if (!ok) fails++; }
static void step(uint32_t dt) { env.ms += dt; ui.frame(env); }
static void tapAt(int x, int y) { step(33); ui.touchDown(x, y, env.ms); step(33); ui.touchUp(env); step(33); }
static void swipe(int x0, int y0, int x1, int y1) { ui.touchDown(x0, y0, env.ms); ui.touchMove(x1, y1); ui.touchUp(env); for (int i = 0; i < 6; i++) step(33); }
static bool popT(ActT t, Act *out = nullptr) { Act a; while (ui.pop(a)) if (a.t == t) { if (out) *out = a; return true; } return false; }
// plays a tap game by tapping the needed letter (tile or reflection); returns good taps; one wrong tap at k==3
static int autoplay(int g, int frames, bool useReflection, int &wrongOk) {
  int good = 0; wrongOk = -1;
  for (int f = 0; f < frames && ui.scr == SC_GAME; f++) {
    step(33); ui.qn = 0;
    if (ui.wordFlash >= 0 || f % 6) continue;
    int nd = ui.need(), hitI = -1, wrongI = -1;
    for (int i = 0; i < ui.nt; i++) { UI::Tile &T = ui.tiles[i]; if (!T.on || T.done) continue; if (g == 3 && ui.hiddenE(T)) continue; if (g == 4 && T.peek > 0) continue; if (T.ak == nd && hitI < 0) hitI = i; else if (T.ak != nd) wrongI = i; }
    if (g == 4 && ui.gT < 1.7f) continue;
    if (wrongOk < 0 && good == 3 && wrongI >= 0) { int s0 = ui.score; UI::Tile &T = ui.tiles[wrongI]; int w = g == 4 ? 32 : 20, h = g == 4 ? 25 : 20; ui.touchDown((int)T.x + w, (int)T.y + h, env.ms); ui.touchUp(env); wrongOk = ui.score <= s0 && ui.combo == 0; continue; }
    if (hitI < 0) continue;
    UI::Tile T = ui.tiles[hitI]; int s0 = ui.score, w = g == 4 ? 32 : 20, h = g == 4 ? 25 : 20;
    int ty = (int)T.y + h; if (g == 0) { float y = T.y + sinf(T.ph * 1.6f) * 3; ty = (useReflection && good % 2) ? (int)(2 * UI::MIRROR_Y - (y + 40) + 20) : (int)(y + 20); }
    ui.touchDown((int)T.x + w, ty, env.ms); ui.touchUp(env);
    if (ui.score > s0) good++;
  }
  return good;
}
int main(int argc, char **argv) {
  D = argc > 1 ? argv[1] : ".";
  ADATA = (uint8_t *)malloc(ADATA_LEN); uLongf dl = ADATA_LEN; if (uncompress(ADATA, &dl, ADATA_Z, ADATA_ZLEN) != Z_OK || dl != ADATA_LEN) { printf("inflate failed\n"); return 1; }
  ui.cv.px = (uint16_t *)malloc(SW * SH * 2); ui.cv.bg = (uint16_t *)malloc(SW * SH * 2); ui.cv.yantra = (uint8_t *)malloc(300 * 300);
  ui.cv.makeBg(); ui.cv.loadYantra();
  env.ms = 10000; env.timeOk = true; env.hh = 18; env.mm = 42; env.net = NET_OK; strcpy(env.ssid, "Laksh-Home"); env.rssi = -58; env.best[0] = 140; env.best[2] = 320;
  ui.scrT0 = 9000; ui.scr = SC_BOOT; env.ms = 9000 + 1500; shot("01_boot");
  ui.lastNet = NET_PORTAL; env.net = NET_PORTAL; ui.scr = SC_SETUP; shot("02_setup");
  env.net = NET_CONNECTING; ui.lastNet = NET_CONNECTING; ui.scr = SC_CONNECT; shot("03_connect");
  env.net = NET_OK; ui.lastNet = NET_OK; ui.scr = SC_HOME; shot("04_home");
  ui.scr = SC_REEL; env.voice = VO_PLAYING;
  for (int k = 0; k < NT; k++) { ui.reel = k; env.voiceProg = .1f + k * .2f; env.ms += 4100; char nm[32]; snprintf(nm, 32, "1%d_reel_t%d", k, TTN[k]); shot(nm); }
  ui.reel = 1; for (int i = 0; i < 4; i++) { env.ms += 3000; char nm[32]; snprintf(nm, 32, "16_seed_%d", i); shot(nm); }
  ui.reel = 3; for (int i = 0; i < 3; i++) { env.ms += 3000; char nm[32]; snprintf(nm, 32, "17_eclipse_%d", i); shot(nm); }
  env.voice = VO_NEEDNET; ui.reel = 4; shot("18_reel_nonet"); env.voice = VO_PLAYING;
  ui.scr = SC_ROCK; env.level = .8f;
  for (int k = 0; k < NT; k++) { ui.rock = k; env.voiceProg = .3f; env.ms += 700; char nm[32]; snprintf(nm, 32, "3%d_rock_t%d", k, TTN[k]); shot(nm); }
  env.band = VO_LOADING; ui.paused = true; shot("36_rock_loading_paused"); ui.paused = false; env.band = VO_PLAYING;
  ui.scr = SC_GAMES; shot("40_games");
  for (int g = 0; g < NT; g++) { ui.startGame(g, env.ms); for (int i = 0; i < (g == 4 ? 70 : 25); i++) step(33); char nm[32]; snprintf(nm, 32, "4%d_game%d", g + 1, g); shot(nm); }
  ui.scr = SC_SETTINGS; shot("50_settings");
  ui.lastScore = 185; ui.lastGame = 3; ui.newBest = true; ui.scr = SC_RESULT; shot("49_result");
  ui.qn = 0;
  // ---- touches ----
  Act a;
  ui.go(SC_HOME, env.ms); ui.reel = 0; ui.rock = 0; step(33); ui.qn = 0;
  tapAt(120, 185); check(ui.scr == SC_REEL && popT(A_REEL, &a) && a.a == 0, "Reels opens tattva 1 and starts its audio");
  for (int k = 1; k < NT; k++) { swipe(120, 220, 120, 120); check(ui.reel == k && popT(A_REEL, &a) && a.a == k, "swipe up: next reel"); }
  swipe(120, 220, 120, 120); check(ui.reel == 0, "after the last reel: the first again");
  swipe(120, 120, 120, 220); check(ui.reel == NT - 1, "swipe down: previous reel");
  tapAt(120, 120); check(ui.paused && popT(A_PAUSE), "tap pauses");
  tapAt(120, 120); check(!ui.paused && popT(A_RESUME), "tap resumes");
  swipe(40, 150, 200, 150); check(ui.scr == SC_HOME && popT(A_STOP), "swipe right: home, audio stops");
  tapAt(120, 273); check(ui.scr == SC_ROCK && popT(A_ROCK, &a) && a.a == 0, "Rock opens the stage for tattva 1");
  tapAt(196, 110); check(ui.rock == 1 && popT(A_ROCK, &a) && a.a == 1, "next on the stage");
  tapAt(44, 110); check(ui.rock == 0 && popT(A_ROCK, &a) && a.a == 0, "previous on the stage");
  tapAt(120, 110); check(ui.paused && popT(A_PAUSE), "play button pauses the rock");
  tapAt(120, 110); check(!ui.paused && popT(A_RESUME), "and plays again");
  swipe(120, 220, 120, 120); check(ui.rock == 1, "swipe up on the stage: next tattva");
  env.band = VO_ERR; env.err = -11; shot("37_rock_err"); tapAt(120, 110); check(!ui.paused && popT(A_ROCK, &a) && a.a == 1, "band failed: play button tries again"); env.band = VO_PLAYING; env.err = 0;
  tapAt(24, 22); check(ui.scr == SC_HOME && popT(A_STOP), "back from rock stops it");
  tapAt(120, 229); check(ui.scr == SC_GAMES, "Games");
  for (int g = 0; g < NT; g++) {
    ui.go(SC_GAMES, env.ms); step(33); ui.qn = 0;
    tapAt(120, 70 + g * 49); char m[64]; snprintf(m, 64, "%s starts", GNAME[g]); check(ui.scr == SC_GAME && ui.game == g && popT(A_GAME), m);
    int wrong; int good;
    if (g == 2) { env.accel = true; int s0 = ui.score; bool shotMid = false;
      for (int f = 0; f < 30 * 40 && ui.scr == SC_GAME; f++) { int nd = ui.need(); float gx = 120, gy = 206;
        for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on && ui.tiles[i].ak == nd) { gx = ui.tiles[i].x + 20; gy = ui.tiles[i].y + 20; }
        float dx = gx - ui.bx, dy = gy - ui.by, d = hypotf(dx, dy) + 1; env.tx = dx / d * .35f - ui.bvx * .001f; env.ty = dy / d * .35f - ui.bvy * .001f; step(33); ui.qn = 0;
        if (!shotMid && ui.beamT > .1f) { shot("43_game2_beam"); shotMid = true; } }
      env.accel = false; good = ui.score > s0 + 100 ? 10 : 0; wrong = 1; }
    else good = autoplay(g, 30 * 30, true, wrong);
    snprintf(m, 64, "%s: letters collected (%d, score %d, words %d)", GNAME[g], good, ui.score, ui.wordsDone); check(good >= 8, m);
    snprintf(m, 64, "%s: wrong letter costs points", GNAME[g]); check(wrong == 1, m);
    if (g == 1) shot("42_seed_grown"); if (g == 3) shot("44_eclipse_mid"); if (g == 4) shot("45_dream_mid");
    ui.qn = 0; env.best[g] = 0; ui.gT = 44.95f; step(100); snprintf(m, 64, "%s: time up, result + best saved", GNAME[g]); check(ui.scr == SC_RESULT && popT(A_BEST, &a) && a.a == g, m);
  }
  tapAt(120, 225); check(ui.scr == SC_GAME && ui.game == 4, "Play again");
  swipe(40, 150, 200, 150); check(ui.scr == SC_GAMES && popT(A_STOP), "swipe right leaves the game");
  // Eclipse: a letter behind the moon can't be tapped
  ui.startGame(3, env.ms); for (int f = 0; f < 60; f++) step(33);
  { bool tested = false; for (int f = 0; f < 600 && !tested; f++) { step(33); for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on && ui.hiddenE(ui.tiles[i])) { tested = true; check(ui.tileAt((int)ui.tiles[i].x + 20, (int)ui.tiles[i].y + 20) < 0, "Eclipse: hidden letter can't be tapped"); break; } } if (!tested) check(false, "Eclipse: moon passes a letter"); }
  // Lamp: drag also works
  ui.startGame(2, env.ms); step(33); { int nd = ui.need(); for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on && ui.tiles[i].ak == nd) { int s1 = ui.score; ui.touchDown(120, 206, env.ms); ui.touchMove((int)ui.tiles[i].x + 20, (int)ui.tiles[i].y + 20); for (int f = 0; f < 60; f++) step(33); ui.touchUp(env); check(ui.score > s1, "Lamp Tilt: drag steers the light"); break; } }
  ui.go(SC_HOME, env.ms); step(33); ui.qn = 0;
  tapAt(219, 18); check(ui.scr == SC_SETTINGS, "gear opens Settings");
  env.vol = 6; tapAt(200, 86); check(popT(A_VOL, &a) && a.a == 7, "volume up");
  tapAt(82, 86); check(popT(A_VOL, &a) && a.a == 5, "volume down");
  tapAt(120, 154); check(!popT(A_WIFI_RESET), "Wi-Fi reset needs a second tap"); tapAt(120, 154); check(popT(A_WIFI_RESET), "second tap resets Wi-Fi");
  tapAt(24, 22); check(ui.scr == SC_HOME, "back");
  env.net = NET_PORTAL; step(33); check(ui.scr == SC_SETUP, "no Wi-Fi: setup screen");
  env.net = NET_CONNECTING; step(33); check(ui.scr == SC_CONNECT, "after saving: connecting");
  env.net = NET_FAILED; step(33); env.net = NET_PORTAL; step(33); check(ui.scr == SC_SETUP, "failed: setup again");
  tapAt(120, 272); check(ui.scr == SC_HOME && popT(A_WIFI_SKIP), "Skip: use without Wi-Fi");
  ui.go(SC_BOOT, env.ms); env.net = NET_CONNECTING; step(2300); check(ui.scr == SC_CONNECT, "boot with saved Wi-Fi: connecting");
  env.net = NET_OK; step(33); check(ui.scr == SC_HOME, "connected: home");
  printf("touch test: %d failed\n", fails);
  return fails ? 1 : 0;
}
