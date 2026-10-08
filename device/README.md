# Hey Tattva on the Waveshare ESP32-S3-Touch-AMOLED-1.8

The eight tattvas on a 1.8" touch screen, in English, Telugu, Kannada or Hindi:

- each tattva's verse, meaning and key points;
- the recitation through the built-in speaker;
- Sing mode with live pitch scoring through the built-in microphone;
- Wi-Fi setup from your phone.

Works on both versions of the board, V1 and V2. The code works out which one it is.

## Easiest: install from the browser

Open **https://heytattva.vercel.app/flash** in Chrome or Edge on a laptop, plug the board in with USB-C, and click **Install Hey Tattva**. No Arduino setup needed. (After changing the code, rebuild and copy the trimmed merged image to `flash/heytattva.bin`.)

## Install it with Arduino IDE

1. Install **Arduino IDE 2** (arduino.cc/en/software).
2. In **File → Preferences → Additional boards manager URLs**, paste:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. In **Tools → Board → Boards Manager**, search **esp32** and install **esp32 by Espressif Systems**, version 3.3.x.
4. In **Tools → Manage Libraries**, search **GFX Library for Arduino** and install it (by Moon On Our Nation, 1.6.x).
5. Open `device/HeyTattva/HeyTattva.ino`.
6. In the **Tools** menu, set:
   - **Board:** Waveshare ESP32-S3-Touch-AMOLED-1.8
   - **PSRAM:** Enabled (required; it is Disabled by default for this board, and without it the screen only shows "PSRAM is off")
   - **USB CDC On Boot:** Enabled (optional; it shows messages in the Serial Monitor)
   - **Partition Scheme:** leave as is. The sketch carries its own `partitions.csv` (7 MB app, 9 MB storage for voices), and the IDE uses it automatically.
7. Plug the board in with USB-C, pick its port in **Tools → Port**, and click **Upload**.
   - If the upload can't connect: hold **BOOT**, press and release **PWR** (or unplug and replug), let go of BOOT, then try again.

## First start

1. **Language.** Tap English, తెలుగు, ಕನ್ನಡ or हिन्दी. You can change it later in Settings.
2. **Wi-Fi setup.** The screen shows "Set up Wi-Fi" and a QR code.
   - On your phone, join the Wi-Fi **HeyTattva-Setup** (scan the QR, or pick it in your phone's Wi-Fi list).
   - A page opens on the phone. If it doesn't, open **192.168.4.1** in the browser.
   - Pick your Wi-Fi, type its password and tap **Save and connect**.
3. The device restarts and joins your Wi-Fi.
   - If it can't connect, the HeyTattva-Setup network comes back so you can try again.
   - If your Wi-Fi drops later (say the router restarts), it keeps retrying quietly.
4. Don't want Wi-Fi right now? Tap **Use without Wi-Fi**. Everything works except downloading new voices.

## Using it

- **Home:** clock (from the internet), turning Sri Yantra. **Swipe left** to begin. The gear opens Settings; the square opens a QR code for the website.
- **A tattva:**
  - **Swipe left/right** for the next or previous tattva.
  - **Swipe up/down** for verse → meaning → remember.
  - **Recite** plays the verse; **Meaning** speaks its meaning (in English). The first time, each one downloads from heytattva.vercel.app (about 1 MB). After that it's saved on the device and plays without Wi-Fi.
- **Sing:**
  - **Listen** plays the tune.
  - **Sing** counts 3-2-1 and then scores you note by note, in any key. A score of 80 or more passes.
- **Settings:** language, brightness, Wi-Fi name, **Reset Wi-Fi** (tap twice), open on phone.
- **Buttons:**
  - **BOOT** tap: go home.
  - **BOOT** hold 5 seconds: forget the Wi-Fi and restart.
  - **PWR:** the board's own power button.
- **Screen sleep:** the screen dims after 1 minute and turns off after 3 minutes (not while playing or singing). Touch it to wake it.
- **Time zone:** fixed to India time (IST). Change `configTzTime("IST-5:30", ...)` in `net.h` for elsewhere.

## How it's built

| File | What it does |
|---|---|
| `HeyTattva.ino` | Board start-up: picks V1 or V2 by its touch chip, display, touch, battery (AXP2101), BOOT button, sleep, main loop. |
| `ui.h`, `gfx.h` | Every screen, plus drawing into a 368×448 frame. Plain C++, so the PC simulator draws exactly what the device shows. |
| `net.h` | Wi-Fi: saved network, the HeyTattva-Setup hotspot with its setup page, retries. |
| `audio.h` | ES8311 codec: recitation download and caching, the tune, the microphone. |
| `sing.h` | YIN pitch tracking and note scoring (same rules as the website). |
| `assets.h` | Generated; don't edit. All text and line art, rendered with the website's fonts so Telugu, Kannada and Devanagari letters join correctly. Stored as compressed 4-bit masks. |
| `es8311.*` | Espressif's codec driver (Apache-2.0). |

**Regenerating the text** (after changing tattva text or translations):

```
node device/tools/gen.mjs && python3 device/tools/pack.py
```

This needs Playwright and Chromium, and Python with Pillow and qrcode.

**Simulator:** renders all screens to images, runs a scripted touch test and tests the pitch scorer with a synthetic voice:

```
cd device/sim && g++ -O2 -std=c++17 -I../HeyTattva sim.cpp -lz -o sim && ./sim out
```

The voice for the device comes from `/api/tts?v=N&fmt=pcm` (16 kHz WAV), plus `&m=1` for the meaning.
