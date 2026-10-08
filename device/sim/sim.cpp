// PC simulator: renders the device screens to PPM images and tests the Sing scorer with a synthetic voice.
// Build: g++ -O2 -std=c++17 -I../HeyTattva sim.cpp -o sim && ./sim outdir
#include <cstdio>
#include <cstdlib>
#include <vector>
#include <string>
#include <random>
#include <zlib.h>
#include "ui.h"
static UI ui; static Env env;
static void save(const std::string &f) {
  FILE *o = fopen(f.c_str(), "wb"); fprintf(o, "P6 %d %d 255\n", SW, SH);
  for (int i = 0; i < SW * SH; i++) { uint16_t c = ui.cv.px[i]; unsigned char p[3] = {(unsigned char)(((c >> 11) & 31) * 255 / 31), (unsigned char)(((c >> 5) & 63) * 255 / 63), (unsigned char)((c & 31) * 255 / 31)}; fwrite(p, 1, 3, o); }
  fclose(o);
}
static void shot(const char *dir, const char *name) { ui.frame(env); save(std::string(dir) + "/" + name + ".ppm"); }
// synthetic singer: sings the tune with a key shift, vibrato, noise and small timing jitter
static int singTest(int v, float shift, float wrongFrac, unsigned seed) {
  const Tune &t = TUNE[v]; SingScore sc; sc.begin(&t);
  float spb = 60.f / t.bpm, len = t.total4 / 4.f * spb; int N = (int)((len + 1) * SING_SR);
  std::vector<int16_t> a(N, 0); std::mt19937 rng(seed); std::uniform_real_distribution<float> U(0, 1);
  double ph = 0;
  for (int i = 0; i < t.n; i++) {
    const Note &no = t.notes[i]; float t0 = no.start / 4.f * spb + .12f, t1 = (no.start + no.len) / 4.f * spb + .12f - .03f;
    float semi = no.semi + shift + (U(rng) < wrongFrac ? (1.f + U(rng) * 4.f) * (U(rng) < .5f ? 1 : -1) : 0);
    for (int s = (int)(t0 * SING_SR); s < (int)(t1 * SING_SR) && s < N; s++) {
      float tt = s / (float)SING_SR, f = SA_HZ * powf(2, (semi + .25f * sinf(tt * 2 * M_PI * 5.5f)) / 12.f);
      ph += 2 * M_PI * f / SING_SR; float env_ = fminf(1, (tt - t0) * 30) * fminf(1, (t1 - tt) * 30);
      a[s] = (int16_t)(env_ * 6000 * (sin(ph) + .5 * sin(2 * ph) + .25 * sin(3 * ph)) + (U(rng) - .5f) * 900);
    }
  }
  float d[YIN_TMAX + 2];
  for (int p = 0; p + YIN_N < N; p += YIN_HOP) { float hz = yinPitch(&a[p], d); sc.feed((p + YIN_N / 2) / (float)SING_SR, hz > 0 ? hzToSemi(hz) : NAN); }
  return sc.finish();
}
int main(int argc, char **argv) {
  const char *dir = argc > 1 ? argv[1] : ".";
  ADATA = (uint8_t *)malloc(ADATA_LEN); uLongf dl = ADATA_LEN; if (uncompress(ADATA, &dl, ADATA_Z, ADATA_ZLEN) != Z_OK || dl != ADATA_LEN) { printf("inflate failed\n"); return 1; }
  ui.cv.px = (uint16_t *)malloc(SW * SH * 2); ui.cv.bg = (uint16_t *)malloc(SW * SH * 2); ui.cv.yantra = (uint8_t *)malloc(300 * 300);
  ui.cv.makeBg(); ui.cv.loadYantra();
  env.ms = 10000; env.timeOk = true; env.hh = 18; env.mm = 42; env.batt = 76; env.net = NET_OK; strcpy(env.ssid, "Laksh-Home"); env.rssi = -58;
  ui.scrT0 = 9000; ui.scr = SC_BOOT; env.ms = 9000 + 1500; shot(dir, "01_boot");
  ui.lang = 1; ui.scr = SC_LANG; shot(dir, "02_lang");
  ui.lang = 0; env.net = NET_PORTAL; ui.lastNet = NET_PORTAL; ui.scr = SC_SETUP; shot(dir, "03_setup");
  env.net = NET_CONNECTING; ui.lastNet = NET_CONNECTING; ui.scr = SC_CONNECT; shot(dir, "04_connect");
  env.net = NET_OK; ui.lastNet = NET_OK; ui.scr = SC_HOME; shot(dir, "05_home");
  ui.scr = SC_PICK; shot(dir, "06_pick"); ui.lang = 1; shot(dir, "06_pick_te"); ui.lang = 0;
  const char *ln[] = {"en", "te", "kn", "hi"};
  for (int l = 0; l < 4; l++) { ui.lang = l; for (int p = 0; p < 3; p++) { ui.scr = SC_TATTVA; ui.n = l == 0 ? 1 : l == 1 ? 3 : l == 2 ? 4 : 6; ui.page = p; char nm[32]; snprintf(nm, 32, "10_tattva_%s_%d", ln[l], p); shot(dir, nm); } }
  ui.lang = 0; ui.n = 2; ui.page = 0; env.audio = AU_PLAYING; env.audioN = 2; env.audioProg = .4f; shot(dir, "11_playing");
  env.audio = AU_LOADING; shot(dir, "12_loading");
  env.audio = AU_ERR_NET; ui.watch(env); env.audio = AU_IDLE; shot(dir, "13_toast"); ui.toastKey = -1;
  ui.an = {true, 2, 3, -SW, env.ms}; env.ms += 110; shot(dir, "14_slide"); ui.an.on = false;
  ui.lang = 1; ui.scr = SC_SETTINGS; env.bright = 3; shot(dir, "20_settings_te");
  ui.lang = 0; shot(dir, "21_settings_en");
  ui.scr = SC_QR; shot(dir, "22_qr");
  static SingScore sc; ui.scr = SC_SING; ui.n = 1; env.sc = &sc; sc.begin(&TUNE[1]);
  env.sing = SG_IDLE; shot(dir, "30_sing_idle");
  env.sing = SG_COUNT; env.singT = -2.2f; shot(dir, "31_sing_count");
  env.sing = SG_SING; sc.offset = 0; { const Note &no = TUNE[1].notes[5]; float t0 = no.start / 4.f * .4f; for (int k = 0; k < 8; k++) { env.singT = t0 + k * .03f; env.pitch = no.semi + .1f; ui.frame(env); } env.pitch = no.semi + .2f; shot(dir, "32_sing_intune"); env.pitch = no.semi - 1.6f; shot(dir, "33_sing_low"); }
  env.sing = SG_LISTEN; env.singT = 3.1f; shot(dir, "34_listen");
  env.sing = SG_DONE; for (int i = 0; i < TUNE[1].n; i++) sc.st[i] = i % 9 == 0 ? 2 : 1; sc.hits = TUNE[1].n - (TUNE[1].n + 8) / 9; shot(dir, "35_sing_done");
  ui.lang = 3; shot(dir, "36_sing_done_hi"); ui.lang = 0; env.sing = SG_IDLE;
  // scripted touches
  {
    UI &u = ui; u.toastKey = -1; env.audio = AU_IDLE; u.qn = 0; int fails = 0;
    auto step = [&](uint32_t dt) { env.ms += dt; u.frame(env); };
    auto swipe = [&](int x0, int y0, int x1, int y1) { u.touchDown(x0, y0, env.ms); u.touchMove(x1, y1); u.touchUp(env); for (int i = 0; i < 12; i++) step(33); };
    auto tapAt = [&](int x, int y) { step(33); u.touchDown(x, y, env.ms); step(33); u.touchUp(env); step(33); };
    auto check = [&](bool ok, const char *what) { printf("%s %s\n", ok ? "ok  " : "FAIL", what); if (!ok) fails++; };
    Act a;
    u.go(SC_HOME, env.ms); step(33);
    tapAt(184, 336); check(u.scr == SC_PICK && !u.pickSing, "Learn opens the 8 tattvas");
    tapAt(270, 216); check(u.scr == SC_TATTVA && u.n == 4, "tile 4 opens tattva 4");
    tapAt(184, 115); check(u.page == 1, "Meaning tab");
    tapAt(90, 405); check(u.pop(a) && a.t == A_PLAY && a.a == 4 && a.b == 1, "Listen on Meaning plays the meaning");
    env.audio = AU_PLAYING; env.audioN = 4; env.audioMeaning = true; step(33);
    tapAt(90, 405); check(u.pop(a) && a.t == A_STOP, "Listen again stops"); env.audio = AU_IDLE;
    tapAt(70, 115); check(u.page == 0, "Verse tab");
    tapAt(90, 405); check(u.pop(a) && a.t == A_PLAY && a.b == 0, "Listen on Verse plays the verse");
    swipe(300, 250, 60, 255); check(u.n == 5 && u.page == 0, "swipe left: tattva 5");
    swipe(60, 250, 300, 255); check(u.n == 4, "swipe right: tattva 4");
    tapAt(270, 405); check(u.scr == SC_SING, "Sing button opens Sing");
    tapAt(270, 405); check(u.pop(a) && a.t == A_SING && a.a == 4, "Sing starts");
    tapAt(90, 405); check(u.pop(a) && a.t == A_LISTEN, "Listen plays the tune");
    tapAt(40, 38); check(u.scr == SC_TATTVA, "back to the tattva");
    tapAt(40, 38); check(u.scr == SC_PICK, "back to the tiles");
    tapAt(40, 38); check(u.scr == SC_HOME, "back home");
    tapAt(98, 412); check(u.scr == SC_PICK && u.pickSing, "home Sing opens the tiles for Sing");
    tapAt(90, 120); check(u.scr == SC_SING && u.n == 1, "tile 1 opens Sing for tattva 1");
    u.qn = 0; u.go(SC_HOME, env.ms); tapAt(270, 412); check(u.scr == SC_SETTINGS, "Settings");
    tapAt(184, 124); check(u.scr == SC_LANG, "language row opens languages");
    tapAt(270, 236); check(u.lang == 1 && u.scr == SC_SETTINGS && u.pop(a) && a.t == A_LANG, "pick Telugu, back to settings");
    env.bright = 3; tapAt(318, 214); check(u.pop(a) && a.t == A_BRIGHT && a.a == 4, "brighter");
    tapAt(98, 214); check(u.pop(a) && a.t == A_BRIGHT && a.a == 2, "dimmer");
    tapAt(184, 304); check(!u.pop(a), "Wi-Fi reset needs a second tap"); tapAt(184, 304); check(u.pop(a) && a.t == A_WIFI_RESET, "second tap resets Wi-Fi");
    tapAt(184, 394); check(u.scr == SC_QR, "open on phone");
    swipe(60, 250, 300, 255); check(u.scr == SC_SETTINGS, "swipe right from QR: settings");
    u.lang = 0; env.net = NET_PORTAL; step(33); check(u.scr == SC_SETUP, "no Wi-Fi: setup screen");
    env.net = NET_CONNECTING; step(33); check(u.scr == SC_CONNECT, "after saving: connecting");
    env.net = NET_FAILED; step(33); env.net = NET_PORTAL; step(33); check(u.scr == SC_SETUP, "failed: setup again");
    tapAt(184, 412); check(u.scr == SC_HOME && u.pop(a) && a.t == A_WIFI_SKIP, "use without Wi-Fi");
    u.lang = -1; u.go(SC_BOOT, env.ms); step(2300); check(u.scr == SC_LANG, "first boot: languages");
    tapAt(270, 360); check(u.lang == 3 && u.scr == SC_HOME, "pick Hindi, then home");
    printf("touch test: %d failed\n", fails);
  }
  // scorer tests
  printf("sing test: in tune (+0)          v1 %d  v4 %d  v8 %d\n", singTest(1, 0, 0, 1), singTest(4, 0, 0, 2), singTest(8, 0, 0, 3));
  printf("sing test: other key (+3.4 st)    v1 %d  v4 %d\n", singTest(1, 3.4f, 0, 4), singTest(4, -4.6f, 0, 5));
  printf("sing test: 30%% wrong notes        v1 %d  v4 %d\n", singTest(1, 0, .3f, 6), singTest(4, 2, .3f, 7));
  printf("sing test: all wrong (random)     v1 %d\n", singTest(1, 0, 1.f, 8));
  return 0;
}
