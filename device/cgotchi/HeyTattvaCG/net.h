// Wi-Fi: connect to the saved network; if there is none or it fails, open the "HeyTattva-Setup" hotspot with a
// setup page (captive portal) where the phone picks a network and types the password. Saving restarts the device.
#pragma once
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <time.h>

#define AP_SSID "HeyTattva-Setup"
#define CONNECT_TIMEOUT_MS 20000

namespace Net {
static WebServer web(80);
static DNSServer dns;
static Preferences pref;
static String ssid, pass;
static int state = 0;  // mirrors ::Net enum in ui.h
static uint32_t t0 = 0, retryAt = 0;
static bool portal = false, skipped = false, timeStarted = false, everConnected = false;
static String scanHtml;

static const char PAGE_HEAD[] PROGMEM = R"HTML(<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hey Tattva setup</title><style>
body{margin:0;font:17px/1.45 system-ui,sans-serif;background:#15123A;color:#F7EBD3}
.w{max-width:440px;margin:0 auto;padding:22px 18px 40px}
h1{font:600 30px Georgia,serif;margin:6px 0 2px;color:#FFF4DC}.dv{color:#F4B73A;margin:0 0 18px}
p{color:#B4ABCF;margin:0 0 14px}.n{display:block;width:100%;text-align:left;padding:14px;margin:0 0 8px;border:0;border-radius:14px;background:#2A2462;color:#F7EBD3;font-size:17px}
.n.on{background:#F4B73A;color:#15123A}.n small{float:right;opacity:.7}
input{width:100%;box-sizing:border-box;padding:14px;border-radius:14px;border:1.5px solid #4a4290;background:#1F1A4E;color:#F7EBD3;font-size:17px;margin:4px 0 12px}
button.go{width:100%;padding:15px;border:0;border-radius:14px;background:#C4262E;color:#FFE9C4;font-weight:700;font-size:17px}
label{font-size:14px;color:#FFD98A;letter-spacing:.04em}a{color:#FFD98A}
</style></head><body><div class="w"><h1>Hey Tattva</h1><p class="dv">हे तत्त्व · Wi-Fi setup</p>)HTML";

static String esc(const String &s) { String o; for (char c : s) { if (c == '<') o += "&lt;"; else if (c == '>') o += "&gt;"; else if (c == '&') o += "&amp;"; else if (c == '"') o += "&quot;"; else o += c; } return o; }
static void scan() {
  int n = WiFi.scanNetworks(false, false);
  scanHtml = "";
  for (int i = 0; i < n && i < 20; i++) {
    String s = WiFi.SSID(i); if (!s.length() || scanHtml.indexOf(">" + esc(s) + "<") >= 0) continue;
    int q = WiFi.RSSI(i); const char *bars = q > -60 ? "●●●" : q > -72 ? "●●○" : "●○○";
    scanHtml += "<button type=button class=n onclick=\"pick(this)\" data-s=\"" + esc(s) + "\"><span>" + esc(s) + "</span><small>" + bars + (WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? " open" : "") + "</small></button>";
  }
  WiFi.scanDelete();
}
static void hRoot() {
  String h = FPSTR(PAGE_HEAD);
  h += "<p>Pick your Wi-Fi and type its password. Hey Tattva will restart and connect.</p><form method=post action=/save>";
  h += scanHtml.length() ? scanHtml : String("<p>No networks found. <a href=/rescan>Scan again</a></p>");
  h += "<label>NETWORK NAME</label><input name=s id=s maxlength=32 autocomplete=off value=\"" + esc(ssid) + "\">";
  h += "<label>PASSWORD</label><input name=p id=p type=password maxlength=64 autocomplete=off>";
  h += "<button class=go>Save and connect</button></form><p style=\"margin-top:16px\"><a href=/rescan>Scan again</a></p></div>";
  h += "<script>function pick(b){document.querySelectorAll('.n').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.getElementById('s').value=b.dataset.s;document.getElementById('p').focus();}</script></body></html>";
  web.send(200, "text/html; charset=utf-8", h);
}
static void hSave() {
  String s = web.arg("s"), p = web.arg("p"); s.trim();
  if (!s.length()) { web.sendHeader("Location", "/"); web.send(302); return; }
  pref.putString("ssid", s); pref.putString("pass", p);
  String h = FPSTR(PAGE_HEAD);
  h += "<p style=\"color:#F7EBD3;font-size:20px\">Saved. Hey Tattva is restarting and will join <b>" + esc(s) + "</b>.</p><p>If it can't connect, this setup network comes back so you can try again.</p></div></body></html>";
  web.send(200, "text/html; charset=utf-8", h);
  delay(1200); ESP.restart();
}
static void hRedirect() { web.sendHeader("Location", String("http://") + WiFi.softAPIP().toString() + "/", true); web.send(302, "text/plain", ""); }

static void startPortal() {
  if (portal) return;
  WiFi.disconnect(true, false); delay(100);
  WiFi.mode(WIFI_AP_STA);
  scan();
  WiFi.softAP(AP_SSID);
  delay(100);
  dns.setErrorReplyCode(DNSReplyCode::NoError);
  dns.start(53, "*", WiFi.softAPIP());
  web.on("/", hRoot);
  web.on("/save", HTTP_POST, hSave);
  web.on("/rescan", []() { scan(); hRedirect(); });
  for (const char *u : {"/generate_204", "/gen_204", "/hotspot-detect.html", "/library/test/success.html", "/connecttest.txt", "/ncsi.txt", "/fwlink", "/redirect"}) web.on(u, hRedirect);
  web.onNotFound(hRedirect);
  web.begin();
  portal = true; state = 3;  // NET_PORTAL
}
static void stopPortal() { if (!portal) return; web.stop(); dns.stop(); WiFi.softAPdisconnect(true); portal = false; }
static void connect() { if (!ssid.length()) { startPortal(); return; } WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true); WiFi.begin(ssid.c_str(), pass.c_str()); t0 = millis(); state = 1; }

static void begin() {
  pref.begin("heytattva", false);
  ssid = pref.getString("ssid", ""); pass = pref.getString("pass", "");
  WiFi.persistent(false);
  WiFi.setHostname("heytattva");
  connect();
}
static void reset() { pref.remove("ssid"); pref.remove("pass"); delay(200); ESP.restart(); }
static void skip() { skipped = true; stopPortal(); WiFi.mode(WIFI_STA); state = 0; retryAt = millis() + 120000; }
static void loop() {
  if (portal) { dns.processNextRequest(); web.handleClient(); }
  uint32_t now = millis();
  if (state == 1) {  // connecting
    if (WiFi.status() == WL_CONNECTED) { state = 2; everConnected = true; stopPortal(); }
    else if (now - t0 > CONNECT_TIMEOUT_MS) {
      if (everConnected) { WiFi.disconnect(); WiFi.begin(ssid.c_str(), pass.c_str()); t0 = now; }  // it worked before (router restarting?): keep trying quietly
      else { state = 4; t0 = now; }  // failed: show it briefly, then open setup
    }
  } else if (state == 4) {
    if (now - t0 > 2500) { if (skipped) { state = 0; retryAt = now + 120000; WiFi.disconnect(); } else startPortal(); }
  } else if (state == 2) {
    if (WiFi.status() != WL_CONNECTED) { state = 1; t0 = now; }  // dropped: auto-reconnect is on; fall back after the timeout
  } else if (state == 0 && skipped && ssid.length() && now > retryAt) { connect(); }
  if (state == 2 && !timeStarted) { configTzTime("IST-5:30", "pool.ntp.org", "time.google.com"); timeStarted = true; }
}
static bool haveCreds() { return ssid.length() > 0; }
}  // namespace Net
