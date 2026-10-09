// Drawing into a 240x296 RGB565 frame (Cheeko Gotchi): the night background, tinted 4-bit text masks (from assets.h), soft shapes,
// the turning Sri Yantra and QR codes. Plain C++ with no Arduino calls, so the same code runs in the PC simulator.
#pragma once
#include <stdint.h>
#include <string.h>
#include <math.h>
#include "assets.h"

#define SW 240
#define SH 296
static inline uint16_t RGB(uint8_t r, uint8_t g, uint8_t b) { return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3); }
#define C_NIGHT RGB(21, 18, 58)
#define C_DEEP RGB(16, 13, 46)
#define C_PANEL RGB(31, 26, 78)
#define C_PANEL2 RGB(42, 36, 98)
#define C_GOLD RGB(244, 183, 58)
#define C_GOLD2 RGB(255, 217, 138)
#define C_INK RGB(247, 235, 211)
#define C_MUTED RGB(180, 171, 207)
#define C_KUM RGB(196, 38, 46)
#define C_CHANDAN RGB(242, 227, 198)
#define C_BLACK 0
#define C_WHITE 0xFFFF
static const uint16_t BLKCOL[3] = {C_GOLD, C_INK, C_MUTED};
#include <string.h>

// a = 0..32
static inline uint16_t mix565(uint16_t b, uint16_t f, uint32_t a) {
  if (a >= 32) return f;
  if (!a) return b;
  uint32_t bb = (b | ((uint32_t)b << 16)) & 0x07E0F81F, ff = (f | ((uint32_t)f << 16)) & 0x07E0F81F;
  uint32_t r = ((bb * (32 - a) + ff * a) >> 5) & 0x07E0F81F;
  return (uint16_t)(r | (r >> 16));
}

struct Clip { int x0, y0, x1, y1; };

struct Canvas {
  uint16_t *px = nullptr;
  uint16_t *bg = nullptr;
  uint8_t *yantra = nullptr;  // decoded 200x200 alpha (0..15) for rotation
  Clip clip{0, 0, SW, SH};
  void setClip(int x0, int y0, int x1, int y1) { clip = {x0 < 0 ? 0 : x0, y0 < 0 ? 0 : y0, x1 > SW ? SW : x1, y1 > SH ? SH : y1}; }
  void noClip() { clip = {0, 0, SW, SH}; }
  inline void put(int x, int y, uint16_t c, uint32_t a) {
    if (x < clip.x0 || y < clip.y0 || x >= clip.x1 || y >= clip.y1) return;
    uint16_t &d = px[y * SW + x];
    d = mix565(d, c, a);
  }
  // the background: night blue, a warm kumkum glow at the top, a faint gold glow at the bottom
  void makeBg() {
    for (int y = 0; y < SH; y++)
      for (int x = 0; x < SW; x++) {
        float t = (float)y / SH;
        float r = 21 - 5 * t, g = 18 - 5 * t, b = 58 - 12 * t;
        float dx = (x - SW / 2) / (float)SW, dy = (y + 40) / (float)SH;
        float k = expf(-(dx * dx * 3.2f + dy * dy * 9.f)) * .55f;
        r += (110 - r) * k * .45f; g += (20 - g) * k * .25f; b += (60 - b) * k * .2f;
        float dy2 = (SH - y) / (float)SH, k2 = expf(-(dx * dx * 4.f + dy2 * dy2 * 14.f)) * .18f;
        r += (244 - r) * k2 * .25f; g += (183 - g) * k2 * .2f; b += (58 - b) * k2 * .05f;
        // gentle dither so the gradient does not band on the AMOLED
        float d = ((x * 7 + y * 13) % 5) - 2;
        bg[y * SW + x] = RGB((uint8_t)fminf(255, fmaxf(0, r + d)), (uint8_t)fminf(255, fmaxf(0, g + d)), (uint8_t)fminf(255, fmaxf(0, b + d)));
      }
  }
  void clearBg() { memcpy(px, bg, SW * SH * 2); }
  void fill(uint16_t c) { for (int i = 0; i < SW * SH; i++) px[i] = c; }
  void fillRect(int x, int y, int w, int h, uint16_t c, uint32_t a = 32) {
    int x0 = x < clip.x0 ? clip.x0 : x, y0 = y < clip.y0 ? clip.y0 : y, x1 = x + w > clip.x1 ? clip.x1 : x + w, y1 = y + h > clip.y1 ? clip.y1 : y + h;
    for (int yy = y0; yy < y1; yy++) { uint16_t *p = px + yy * SW; for (int xx = x0; xx < x1; xx++) p[xx] = a >= 32 ? c : mix565(p[xx], c, a); }
  }
  // anti-aliased rounded rectangle (filled), optional outline width
  void round(int x, int y, int w, int h, float r, uint16_t c, uint32_t a = 32, float line = 0) {
    int x0 = x < clip.x0 ? clip.x0 : x, y0 = y < clip.y0 ? clip.y0 : y, x1 = x + w > clip.x1 ? clip.x1 : x + w, y1 = y + h > clip.y1 ? clip.y1 : y + h;
    float cx = x + w * .5f, cy = y + h * .5f, hw = w * .5f - r, hh = h * .5f - r;
    for (int yy = y0; yy < y1; yy++)
      for (int xx = x0; xx < x1; xx++) {
        float qx = fabsf(xx + .5f - cx) - hw, qy = fabsf(yy + .5f - cy) - hh;
        float ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0;
        float d = sqrtf(ox * ox + oy * oy) + fminf(fmaxf(qx, qy), 0.f) - r;  // signed distance
        float cov = line > 0 ? fminf(fmaxf(.5f - d, 0.f), 1.f) * fminf(fmaxf(d + line + .5f, 0.f), 1.f) : fminf(fmaxf(.5f - d, 0.f), 1.f);
        if (cov > 0) put(xx, yy, c, (uint32_t)(cov * a));
      }
  }
  void disc(float cx, float cy, float r, uint16_t c, uint32_t a = 32) { round((int)(cx - r - 1), (int)(cy - r - 1), (int)(2 * r + 3), (int)(2 * r + 3), r + 1, c, a); }
  void ring(float cx, float cy, float r, float lw, uint16_t c, uint32_t a = 32) {
    int x0 = (int)(cx - r - 2), x1 = (int)(cx + r + 3), y0 = (int)(cy - r - 2), y1 = (int)(cy + r + 3);
    for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
      float d = fabsf(sqrtf((x + .5f - cx) * (x + .5f - cx) + (y + .5f - cy) * (y + .5f - cy)) - r) - lw * .5f;
      float cov = fminf(fmaxf(.5f - d, 0.f), 1.f);
      if (cov > 0) put(x, y, c, (uint32_t)(cov * a));
    }
  }
  // soft glow
  void glow(float cx, float cy, float r, uint16_t c, float strength) {
    int x0 = (int)(cx - r), x1 = (int)(cx + r), y0 = (int)(cy - r), y1 = (int)(cy + r);
    for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
      float d2 = ((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (r * r);
      if (d2 < 1) put(x, y, c, (uint32_t)(32 * strength * (1 - d2) * (1 - d2)));
    }
  }
  // ---- masks from assets.h ----
  // walk one run-length coded block, calling f(x, y, alpha 0..15) for non-zero pixels
  template <class F> static void decode(const Blk &b, F f) {
    const uint8_t *p = ADATA + b.off;
    int n = b.w * b.h, i = 0;
    while (i < n) {
      uint8_t c = *p++;
      if (c & 0x80) i += (c & 0x7F) + 1;
      else if (c & 0x40) { int k = (c & 0x3F) + 1; for (int j = 0; j < k; j++, i++) f(i % b.w, i / b.w, 15); }
      else { int k = c + 1; for (int j = 0; j < k; j++, i++) { uint8_t v = (j & 1) ? (p[j >> 1] & 15) : (p[j >> 1] >> 4); if (v) f(i % b.w, i / b.w, v); } p += (k + 1) >> 1; }
    }
  }
  // draw an item; tint 0 means "use each layer's own colour"; a = 0..32 overall opacity
  void item(int id, int x, int y, uint16_t tint = 0, uint32_t a = 32) {
    const Item &it = ITEMS[id];
    for (int k = 0; k < it.n; k++) {
      const Blk &b = BLK[it.first + k];
      uint16_t c = tint ? tint : (b.col < 3 ? BLKCOL[b.col] : C_INK);
      int ox = x + b.x, oy = y + b.y;
      if (ox >= clip.x1 || oy >= clip.y1 || ox + b.w <= clip.x0 || oy + b.h <= clip.y0) continue;
      decode(b, [&](int px_, int py_, uint8_t v) { put(ox + px_, oy + py_, c, (v * a + 7) / 15); });
    }
  }
  void itemFlip(int id, int x, int y, uint16_t tint, uint32_t a) {  // mirrored vertically about its own box
    const Item &it = ITEMS[id];
    for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; int ox = x + b.x, oy = y + (it.h - b.y - b.h);
      decode(b, [&](int px_, int py_, uint8_t v) { put(ox + px_, oy + (b.h - 1 - py_), tint, (v * a + 7) / 15); }); }
  }
  static int itemW(int id) { const Item &it = ITEMS[id]; int w = 0; for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; if (b.x + b.w > w) w = b.x + b.w; } return w; }
  static int itemX0(int id) { const Item &it = ITEMS[id]; int m = 9999; for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; if (b.x < m) m = b.x; } return it.n ? m : 0; }
  static int itemH(int id) { const Item &it = ITEMS[id]; int h = 0; for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; if (b.y + b.h > h) h = b.y + b.h; } return h; }
  static int itemY0(int id) { const Item &it = ITEMS[id]; int m = 9999; for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; if (b.y < m) m = b.y; } return it.n ? m : 0; }
  // centre an item's ink horizontally on cx; y is the top of its ink
  void itemC(int id, int cx, int y, uint16_t tint = 0, uint32_t a = 32) { int x0 = itemX0(id), w = itemW(id) - x0; item(id, cx - w / 2 - x0, y - itemY0(id), tint, a); }
  // ---- dynamic ASCII text: font 0 = 15 px, 1 = 19 px, 2 = 27 px display, 3 = 50 px digits ----
  static const uint16_t *font(int f) { return f == 4 ? GFB : f == 2 ? GF26 : f == 1 ? GF18 : GF14; }  // 4 = Bebas Neue (rock)
  static int glyph(int f, unsigned ch) { if (f == 3) { const char *p = strchr(G48CH, (int)ch); return p && ch ? GF48[p - G48CH] : GF48[13]; } if (ch < 32 || ch > 126) ch = '?'; return font(f)[ch - 32]; }
  int text(const char *s, int x, int y, uint16_t c, int f = 0, uint32_t a = 32) { int cx = x; for (; *s; s++) { int id = glyph(f, (uint8_t)*s); item(id, cx - 4, y, c, a); cx += ITEMS[id].adv; } return cx - x; }
  static int textW(const char *s, int f = 0) { int w = 0; for (; *s; s++) w += ITEMS[glyph(f, (uint8_t)*s)].adv; return w; }
  void textC(const char *s, int cx, int y, uint16_t c, int f = 0, uint32_t a = 32) { text(s, cx - textW(s, f) / 2, y, c, f, a); }
  void textR(const char *s, int rx, int y, uint16_t c, int f = 0, uint32_t a = 32) { text(s, rx - textW(s, f), y, c, f, a); }
  // ---- the turning yantra ----
  void loadYantra() {
    memset(yantra, 0, 200 * 200);
    const Item &it = ITEMS[IT_YANTRA];
    for (int k = 0; k < it.n; k++) { const Blk &b = BLK[it.first + k]; decode(b, [&](int x, int y, uint8_t v) { int X = b.x + x, Y = b.y + y; if (X < 200 && Y < 200) yantra[Y * 200 + X] = v; }); }
  }
  void yantraAt(float cx, float cy, float size, float ang, uint16_t c, uint32_t a) {
    float s = 200.f / size, ca = cosf(ang) * s, sa = sinf(ang) * s;
    int r = (int)(size * .5f) + 1;
    int y0 = (int)cy - r, y1 = (int)cy + r, x0 = (int)cx - r, x1 = (int)cx + r;
    if (y0 < clip.y0) y0 = clip.y0; if (y1 > clip.y1) y1 = clip.y1; if (x0 < clip.x0) x0 = clip.x0; if (x1 > clip.x1) x1 = clip.x1;
    for (int y = y0; y < y1; y++) {
      float dy = y + .5f - cy;
      for (int x = x0; x < x1; x++) {
        float dx = x + .5f - cx, u = dx * ca + dy * sa + 100.f, v = -dx * sa + dy * ca + 100.f;
        int iu = (int)u, iv = (int)v;
        if (iu < 0 || iv < 0 || iu >= 199 || iv >= 199) continue;
        float fu = u - iu, fv = v - iv;
        const uint8_t *q = yantra + iv * 200 + iu;
        float m = (q[0] * (1 - fu) + q[1] * fu) * (1 - fv) + (q[200] * (1 - fu) + q[201] * fu) * fv;
        if (m > .3f) { uint16_t &d = px[y * SW + x]; d = mix565(d, c, (uint32_t)(m * a / 15)); }
      }
    }
  }
  // ---- QR code on a light card ----
  void qr(const uint8_t *bits, int n, int x, int y, int mod) {
    int pad = mod * 2, s = n * mod + pad * 2;
    round(x, y, s, s, 10, C_CHANDAN);
    for (int j = 0; j < n; j++) for (int i = 0; i < n; i++) { int k = j * n + i; if (bits[k >> 3] & (1 << (k & 7))) fillRect(x + pad + i * mod, y + pad + j * mod, mod, mod, C_NIGHT); }
  }
  static int qrSize(int n, int mod) { return n * mod + mod * 4; }
};
