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
int main(int argc, char **argv) {
  D = argc > 1 ? argv[1] : ".";
  ADATA = (uint8_t *)malloc(ADATA_LEN); uLongf dl = ADATA_LEN; if (uncompress(ADATA, &dl, ADATA_Z, ADATA_ZLEN) != Z_OK || dl != ADATA_LEN) { printf("inflate failed\n"); return 1; }
  ui.cv.px = (uint16_t *)malloc(SW * SH * 2); ui.cv.bg = (uint16_t *)malloc(SW * SH * 2); ui.cv.yantra = (uint8_t *)malloc(300 * 300);
  ui.cv.makeBg(); ui.cv.loadYantra();
  env.ms = 10000; env.timeOk = true; env.hh = 18; env.mm = 42; env.net = NET_OK; strcpy(env.ssid, "Laksh-Home"); env.rssi = -58; env.best[0] = 140;
  ui.scrT0 = 9000; ui.scr = SC_BOOT; env.ms = 9000 + 1500; shot("01_boot");
  ui.lastNet = NET_PORTAL; env.net = NET_PORTAL; ui.scr = SC_SETUP; shot("02_setup");
  env.net = NET_CONNECTING; ui.lastNet = NET_CONNECTING; ui.scr = SC_CONNECT; shot("03_connect");
  env.net = NET_OK; ui.lastNet = NET_OK; ui.scr = SC_HOME; shot("04_home");
  ui.scr = SC_REEL; ui.reel = 0; env.voice = VO_PLAYING; env.voiceProg = .1f; shot("10_reel1");
  env.voiceProg = .6f; env.ms += 1300; shot("11_reel1_line3");
  ui.reel = 1; env.voiceProg = .3f; shot("12_reel4");
  env.voice = VO_LOADING; env.bedT = 9; shot("13_reel4_loading");
  ui.paused = true; env.voice = VO_PLAYING; shot("14_reel4_paused"); ui.paused = false;
  ui.scr = SC_GAMES; shot("20_games");
  ui.startGame(0, env.ms); for (int i = 0; i < 20; i++) step(33); shot("21_g1");
  ui.startGame(1, env.ms); for (int i = 0; i < 20; i++) step(33); shot("22_g2");
  ui.scr = SC_SETTINGS; shot("30_settings");
  ui.lastScore = 185; ui.lastGame = 0; ui.newBest = true; ui.scr = SC_RESULT; shot("23_result");
  ui.qn = 0;
  // ---- touches ----
  Act a;
  ui.go(SC_HOME, env.ms); ui.reel = 0; step(33);
  tapAt(120, 229); check(ui.scr == SC_REEL && popT(A_REEL, &a) && a.a == 0, "Reels opens tattva 1 and starts its audio");
  swipe(120, 220, 120, 120); check(ui.reel == 1 && popT(A_REEL, &a) && a.a == 1, "swipe up: tattva 4 reel");
  tapAt(120, 120); check(ui.paused && popT(A_REEL_PAUSE), "tap pauses");
  tapAt(120, 120); check(!ui.paused && popT(A_REEL_RESUME), "tap resumes");
  swipe(40, 150, 200, 150); check(ui.scr == SC_HOME && popT(A_REEL_STOP), "swipe right: home, audio stops");
  tapAt(120, 273); check(ui.scr == SC_GAMES, "Games");
  tapAt(120, 100); check(ui.scr == SC_G1 && ui.game == 0, "Mirror Letters starts");
  // play G1: tap the needed letter (alternate: tile / its reflection), then one wrong one
  int good = 0;
  for (int k = 0; k < 40 && ui.scr == SC_G1; k++) {
    if (ui.wordFlash >= 0) { step(100); continue; }
    int nd = ui.need(), hitI = -1, wrongI = -1;
    for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on) { if (ui.tiles[i].ak == nd && hitI < 0) hitI = i; else if (ui.tiles[i].ak != nd) wrongI = i; }
    if (k == 3 && wrongI >= 0) { int s0 = ui.score; UI::Tile &T = ui.tiles[wrongI]; step(0); tapAt((int)T.x + 20, (int)(T.y + 20)); check(ui.score <= s0 && ui.combo == 0, "wrong letter costs points"); continue; }
    if (hitI < 0) { step(100); continue; }
    UI::Tile T = ui.tiles[hitI]; int s0 = ui.score;
    float y = T.y + sinf(T.ph * 1.6f) * 3; int ty = (k & 1) ? (int)(2 * UI::MIRROR_Y - (y + 40) + 20) : (int)(y + 20);
    ui.touchDown((int)T.x + 20, ty, env.ms); ui.touchUp(env);
    if (ui.score > s0) good++;
    step(50);
  }
  check(good >= 8, "letters (and reflections) collected in order");
  printf("     G1 score %d after %d good taps, words done %d\n", ui.score, good, ui.wi);
  ui.qn = 0; ui.gT = 44.9f; step(200); check(ui.scr == SC_RESULT && popT(A_BEST), "time up: result + best saved");
  shot("24_g1_end");
  tapAt(120, 225); check(ui.scr == SC_G1, "Play again");
  swipe(40, 150, 200, 150); check(ui.scr == SC_GAMES, "swipe right leaves the game");
  tapAt(120, 220); check(ui.scr == SC_G2 && ui.game == 1, "Lamp Tilt starts");
  // play G2 with the accelerometer: tilt towards the needed tile
  env.accel = true; int words0 = ui.wi, s0 = ui.score; bool shotMid = false;
  for (int f = 0; f < 30 * 40 && ui.scr == SC_G2; f++) {
    int nd = ui.need(); float gx = 120, gy = 206;
    for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on && ui.tiles[i].ak == nd) { gx = ui.tiles[i].x + 20; gy = ui.tiles[i].y + 20; }
    float dx = gx - ui.bx, dy = gy - ui.by, d = hypotf(dx, dy) + 1; env.tx = dx / d * .35f - ui.bvx * .001f; env.ty = dy / d * .35f - ui.bvy * .001f;
    step(33); if (!shotMid && ui.beamT > .1f) { shot("25_g2_beam"); shotMid = true; }
  }
  printf("     G2 score %d, words %d\n", ui.score, ui.wi - words0);
  check(ui.score > s0 + 100, "tilt steers the light to the letters");
  env.accel = false;
  // drag also works
  ui.startGame(1, env.ms); step(33); { int nd = ui.need(); for (int i = 0; i < ui.nt; i++) if (ui.tiles[i].on && ui.tiles[i].ak == nd) { int s1 = ui.score; ui.touchDown(120, 206, env.ms); ui.touchMove((int)ui.tiles[i].x + 20, (int)ui.tiles[i].y + 20); for (int f = 0; f < 60; f++) step(33); ui.touchUp(env); check(ui.score > s1, "drag steers the light"); break; } }
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
