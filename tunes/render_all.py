"""Deterministic renderer for the Tattva tune library.
Reads tunes/verse-N.B.json (approved candidate B, Revati) and writes
audio/verse-N/<instrument>.{wav,ogg,m4a} (melody), audio/verse-N/stems/{drone_tanpura,rhythm_tabla,rhythm_mridangam}.*
and manifest.json. Same inputs -> byte-identical WAV.
Usage: python3 render_all.py [--wav-all] [--verses 1,2]
"""
import json, os, sys, hashlib, subprocess, wave
import numpy as np
from scipy.signal import resample_poly, lfilter, butter
from scipy.ndimage import maximum_filter1d
import pyloudnorm as pyln

SR = 48000
CAND = 'B'
TARGET_LUFS = -16.0
TP_MAX = -1.5
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'audio')

# instrument registry: octave shift keeps each instrument in its real playing range (pitch classes unchanged)
INSTRUMENTS = {
 'bansuri':        {'name': 'Bansuri (flute)',  'oct': 12, 'family': 'wind',   'quality': 'fair'},
 'veena':          {'name': 'Veena',            'oct': 0,  'family': 'pluck',  'quality': 'rough'},
 'sitar':          {'name': 'Sitar',            'oct': 0,  'family': 'pluck',  'quality': 'rough'},
 'violin':         {'name': 'Violin',           'oct': 12, 'family': 'bow',    'quality': 'rough'},
 'harmonium':      {'name': 'Harmonium',        'oct': 0,  'family': 'reed',   'quality': 'good'},
 'piano':          {'name': 'Piano',            'oct': 0,  'family': 'struck', 'quality': 'fair'},
 'guitar':         {'name': 'Acoustic guitar',  'oct': 0,  'family': 'pluck',  'quality': 'fair'},
 'santoor':        {'name': 'Santoor',          'oct': 12, 'family': 'struck', 'quality': 'fair'},
 'sarangi':        {'name': 'Sarangi',          'oct': 0,  'family': 'bow',    'quality': 'rough'},
 'nadaswaram':     {'name': 'Nadaswaram',       'oct': 12, 'family': 'wind',   'quality': 'rough'},
 'harp':           {'name': 'Harp',             'oct': 0,  'family': 'pluck',  'quality': 'good'},
 'cello':          {'name': 'Cello',            'oct': 0,  'family': 'bow',    'quality': 'fair'},
}

def seed_of(*parts):
    return int(hashlib.sha256('|'.join(map(str, parts)).encode()).hexdigest()[:8], 16)

def load(verse):
    return json.load(open(os.path.join(HERE, f'verse-{verse}.{CAND}.json')))

# ---------- building blocks ----------
def freq_track(n_prev_hz, hz, n, slide_ms=0, vib_cents=0, vib_hz=5.5, vib_delay=.25, scoop_cents=0):
    t = np.arange(n) / SR
    f = np.full(n, hz, float)
    if slide_ms and n_prev_hz:
        L = min(n, int(slide_ms * SR / 1000))
        r = np.linspace(0, 1, L)
        r = r * r * (3 - 2 * r)
        f[:L] = n_prev_hz * (hz / n_prev_hz) ** r
    if scoop_cents:
        L = min(n, int(.06 * SR))
        f[:L] *= 2 ** ((-scoop_cents * (1 - np.linspace(0, 1, L))) / 1200)
    if vib_cents:
        ramp = np.clip((t - vib_delay) / .25, 0, 1)
        f *= 2 ** (vib_cents * ramp * np.sin(2 * np.pi * vib_hz * t) / 1200)
    return f

def additive(f, amps, decays=None, inharm=0.0):
    n = len(f)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros(n)
    for k, a in enumerate(amps, 1):
        if a == 0:
            continue
        mult = k * np.sqrt(1 + inharm * k * k)
        if np.max(f) * mult > SR * .45:
            break
        p = np.sin(ph * mult)
        if decays is not None:
            p *= np.exp(-t * decays[k - 1])
        out += a * p
    return out

def adsr(n, a=.01, d=.08, s=.8, r=.06):
    t = np.arange(n) / SR
    T = n / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((T - t) / r, 0, 1)
    return e * rel

def bandnoise(n, lo, hi, rng):
    b, a = butter(2, [lo / (SR / 2), min(hi, SR * .45) / (SR / 2)], 'band')
    return lfilter(b, a, rng.standard_normal(n))

def fade(x, ms=8):
    L = int(ms * SR / 1000)
    x[:L] *= np.linspace(0, 1, L)
    x[-L:] *= np.linspace(1, 0, L)
    return x

# ---------- instruments: (prev_hz, hz, n samples, dur seconds, rng) -> signal ----------
def inst_note(key, prev, hz, n, rng):
    T = n / SR
    if key == 'bansuri':
        f = freq_track(prev, hz, n, slide_ms=40 if prev else 0, vib_cents=14, vib_hz=4.8, vib_delay=.3, scoop_cents=30)
        tone = additive(f, [1, .22, .09, .04])
        br = bandnoise(n, hz * 1.5, hz * 6, rng) * .05
        return (tone + br) * adsr(n, .05, .1, .85, .08)
    if key == 'harmonium':
        f = freq_track(None, hz, n)
        amps = [1 / k ** .7 * (1.25 if k % 2 else .8) for k in range(1, 14)]
        x = additive(f * 2 ** (4 / 1200), amps) + additive(f * 2 ** (-4 / 1200), amps)
        trem = 1 + .04 * np.sin(2 * np.pi * 5.2 * np.arange(n) / SR)
        return .5 * x * trem * adsr(n, .03, .05, .95, .05)
    if key == 'piano':
        f = freq_track(None, hz, n)
        amps = [1, .6, .35, .22, .14, .09, .06, .04]
        dec = [.8 + .55 * k for k in range(1, 9)]
        x = additive(f, amps, dec, inharm=.0004)
        x += bandnoise(n, 2000, 8000, rng) * np.exp(-np.arange(n) / SR * 60) * .05
        return x * adsr(n, .003, .05, 1, .08)
    if key in ('guitar', 'harp', 'veena', 'sitar'):
        slide = {'veena': 70, 'sitar': 60}.get(key, 0)
        f = freq_track(prev, hz, n, slide_ms=slide if prev else 0, vib_cents=6 if key in ('veena', 'sitar') else 0, vib_hz=5, vib_delay=.4)
        if key == 'guitar':
            amps = [1, .55, .4, .25, .18, .1, .07, .05]; dec = [1.6 + .9 * k for k in range(1, 9)]
        elif key == 'harp':
            amps = [1, .3, .1, .05, .02]; dec = [.9 + .6 * k for k in range(1, 6)]
        elif key == 'veena':
            amps = [1, .7, .5, .35, .25, .15, .1, .07, .05]; dec = [.9 + .5 * k for k in range(1, 10)]
        else:
            amps = [1, .8, .7, .6, .5, .45, .4, .32, .25, .2, .15, .1]; dec = [.7 + .35 * k for k in range(1, 13)]
        x = additive(f, amps, dec, inharm=.00015)
        if key == 'sitar':
            jaw = np.tanh(3 * bandnoise(n, 1500, 5000, rng) * .2 + x * .6)
            x = .7 * x + .3 * jaw * np.exp(-np.arange(n) / SR * 2)
        x += bandnoise(n, 3000, 9000, rng) * np.exp(-np.arange(n) / SR * 120) * .04
        return x * adsr(n, .002, .02, 1, .05)
    if key == 'santoor':
        out = np.zeros(n)
        step = max(1, int(.11 * SR))
        strokes = range(0, n, step) if T > .5 else [0]
        for j, s0 in enumerate(strokes):
            L = n - s0
            f = np.full(L, hz)
            amps = [1, .45, .3, .2, .12, .08]; dec = [3 + 1.4 * k for k in range(1, 7)]
            g = 1 if j == 0 else .55
            x = additive(f, amps, dec) + .6 * additive(f * 2 ** (3 / 1200), amps, dec)
            out[s0:] += g * x
        return out * adsr(n, .002, .02, 1, .05)
    if key in ('violin', 'sarangi', 'cello'):
        slide = {'violin': 55, 'sarangi': 65, 'cello': 50}[key]
        vib = {'violin': 18, 'sarangi': 24, 'cello': 14}[key]
        f = freq_track(prev, hz, n, slide_ms=slide if prev else 0, vib_cents=vib, vib_hz={'violin': 5.8, 'sarangi': 5.2, 'cello': 5.0}[key], vib_delay=.2)
        K = 16
        peaks = {'violin': [(450, 1), (2500, .9), (3500, .6)], 'sarangi': [(700, 1), (1600, .8), (3000, .5)], 'cello': [(220, 1), (650, .7), (1500, .4)]}[key]
        amps = []
        for k in range(1, K + 1):
            fk = hz * k
            w = sum(a * np.exp(-((np.log2(fk / p)) ** 2) / .5) for p, a in peaks)
            amps.append((.35 + w) / k)
        x = additive(f, amps)
        x += bandnoise(n, 1500, 7000, rng) * .03
        return x * adsr(n, .06, .1, .9, .08)
    if key == 'nadaswaram':
        f = freq_track(prev, hz, n, slide_ms=45 if prev else 0, vib_cents=16, vib_hz=5.6, vib_delay=.25)
        amps = [1, .9, .85, .7, .6, .5, .4, .32, .25, .2, .15, .12]
        x = np.tanh(1.6 * additive(f, amps) / 3)
        x += bandnoise(n, 2000, 6000, rng) * .03
        return x * adsr(n, .03, .08, .9, .06)
    raise KeyError(key)

def render_melody(tune, key, rng):
    spb = 60 / tune['tempo_bpm']
    total = tune['total_beats'] * spb + 1.5
    out = np.zeros(int(total * SR))
    shift = INSTRUMENTS[key]['oct']
    prev = None
    for nt in tune['notes']:
        hz = nt['pitch_hz'] * 2 ** (shift / 12)
        s0 = int(round(nt['start_beat'] * spb * SR))
        n = int(round(nt['duration_beats'] * spb * SR))
        tail = (int(.12 * SR) if key == 'santoor' else int(.35 * SR)) if INSTRUMENTS[key]['family'] in ('pluck', 'struck') else 0
        n2 = min(n + tail, len(out) - s0)
        sig = inst_note(key, prev, hz, n2, rng)
        if tail:
            sig[n:] *= np.linspace(1, 0, n2 - n) ** 2
        out[s0:s0 + n2] += sig
        prev = hz
    return fade(out)

def render_drone(tune, rng):
    spb = 60 / tune['tempo_bpm']
    total = tune['total_beats'] * spb + 1.5
    n = int(total * SR)
    out = np.zeros(n)
    sa = tune['tonic_hz']
    strings = [sa * .75, sa, sa, sa / 2]
    period = 3.2
    t0 = 0.0
    k = 0
    while t0 < total:
        hz = strings[k % 4]
        s0 = int(t0 * SR)
        L = min(int(4.5 * SR), n - s0)
        t = np.arange(L) / SR
        f = np.full(L, hz)
        amps = [1, .9, .8, .75, .7, .6, .55, .5, .45, .4, .35, .3, .25, .2]
        sweep = [(.6 + .4 * np.cos(2 * np.pi * (t * .35 + j * .13))) for j in range(len(amps))]
        x = np.zeros(L)
        ph = 2 * np.pi * hz * t
        for j, a in enumerate(amps, 1):
            x += a * sweep[j - 1] * np.sin(ph * j) / j ** .5
        x *= np.exp(-t * .55) * np.minimum(1, t / .01)
        out[s0:s0 + L] += x
        t0 += period / 4
        k += 1
    return fade(out)

def drum(n, f0, f1, dec, noise, rng, bright=4000):
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)
    if noise:
        x += bandnoise(n, 800, bright, rng) * np.exp(-t * 40) * noise
    return x

def render_rhythm(tune, kind, rng):
    spb = 60 / tune['tempo_bpm']
    total = tune['total_beats'] * spb + 1.5
    n = int(total * SR)
    out = np.zeros(n)
    beats = int(tune['total_beats'])
    if kind == 'tabla':
        pat = [('dha', 1), ('dhin', .7), ('na', .6), ('dhin', .7), ('dha', .9), ('tin', .6), ('na', .6), ('ta', .7)]
    else:
        pat = [('thom', 1), ('ta', .6), ('ki', .5), ('nam', .7), ('thom', .9), ('di', .6), ('nam', .7), ('ta', .6)]
    for b in range(beats):
        name, g = pat[b % 8]
        s0 = int(round(b * spb * SR))
        L = min(int(.9 * SR), n - s0)
        if name in ('dha', 'thom'):
            x = drum(L, 130, 70, 6, 0, rng) + .6 * drum(L, 520, 480, 9, .4, rng)
        elif name in ('dhin', 'nam'):
            x = .5 * drum(L, 110, 70, 7, 0, rng) + drum(L, 600, 560, 7, .3, rng)
        elif name in ('na', 'ta', 'di', 'tin'):
            x = drum(L, 700, 660, 14, .5, rng)
        else:
            x = drum(L, 900, 850, 25, .8, rng)
        out[s0:s0 + L] += g * x
    return fade(out)

# ---------- mastering ----------
METER = pyln.Meter(SR)
def true_peak_db(x):
    up = resample_poly(x, 4, 1)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)

def limit(x, ceiling_db):
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = 10 ** (ceiling_db / 20)
    W = int(.004 * SR)
    g = np.minimum(1, c / (np.abs(x) + 1e-12))
    g = minimum_filter1d(g, size=2 * W + 1)
    g = uniform_filter1d(g, size=W)
    return x * g

def master(x):
    for _ in range(4):
        L = METER.integrated_loudness(x)
        x = x * 10 ** ((TARGET_LUFS - L) / 20)
        if true_peak_db(x) > TP_MAX:
            x = limit(x, TP_MAX - .6)
    return x, METER.integrated_loudness(x), true_peak_db(x)

def write_wav(path, x):
    pcm = np.clip(np.round(x * 32767), -32768, 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def encode(wav, base):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '4', base + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', base + '.m4a'], check=True)

def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()

def main():
    wav_all = '--wav-all' in sys.argv
    verses = list(range(1, 9))
    if '--verses' in sys.argv:
        verses = [int(v) for v in sys.argv[sys.argv.index('--verses') + 1].split(',')]
    man = []
    for v in verses:
        tune = load(v)
        d = os.path.join(OUT, f'verse-{v}')
        os.makedirs(os.path.join(d, 'stems'), exist_ok=True)
        jobs = [(k, 'melody') for k in INSTRUMENTS] + [('drone_tanpura', 'drone'), ('rhythm_tabla', 'rhythm'), ('rhythm_mridangam', 'rhythm')]
        for key, role in jobs:
            rng = np.random.default_rng(seed_of(v, key, tune['version']))
            if role == 'melody':
                x = render_melody(tune, key, rng); base = os.path.join(d, key)
            elif role == 'drone':
                x = render_drone(tune, rng); base = os.path.join(d, 'stems', key)
            else:
                x = render_rhythm(tune, key.split('_')[1], rng); base = os.path.join(d, 'stems', key)
            x, lufs, tp = master(x)
            wav = base + '.wav'
            write_wav(wav, x)
            encode(wav, base)
            rec = {'verse': v, 'id': key, 'role': role, 'name': INSTRUMENTS.get(key, {}).get('name', key.replace('_', ' ')),
                   'octave_shift': INSTRUMENTS.get(key, {}).get('oct', 0), 'quality': INSTRUMENTS.get(key, {}).get('quality', 'fair'),
                   'files': {e: os.path.relpath(base + '.' + e, HERE) for e in ('wav', 'ogg', 'm4a')},
                   'duration_s': round(len(x) / SR, 3), 'bpm': tune['tempo_bpm'], 'raga': tune['raga'], 'tonic_hz': tune['tonic_hz'],
                   'lufs': round(lufs, 2), 'true_peak_dbtp': round(tp, 2), 'sha256_wav': sha(wav), 'sha256_m4a': sha(base + '.m4a'),
                   'tune_version': tune['version'], 'candidate': CAND, 'status': 'DRAFT (approved candidate B, not traditional)'}
            if not (wav_all or v == 1):
                os.remove(wav); rec['files'].pop('wav'); rec['note'] = 'WAV regenerable with render_all.py --wav-all'
            man.append(rec)
            print(f'verse {v} {key:17s} LUFS {lufs:6.2f}  TP {tp:5.2f}', flush=True)
    json.dump({'generated_by': 'render_all.py', 'sample_rate': SR, 'target_lufs': TARGET_LUFS, 'true_peak_max': TP_MAX, 'files': man},
              open(os.path.join(HERE, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__':
    main()
