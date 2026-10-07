"""Verify rendered melody files against the canonical tune: per-note pitch error (cents) and onset error (ms)."""
import json, os, sys, wave, subprocess
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000

def read_audio(path):
    if path.endswith('.wav'):
        w = wave.open(path); x = np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768.0; return x, w.getframerate()
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2') / 32768.0, SR

def yin(frame, sr, fmin=70, fmax=1400, th=.12):
    N = len(frame) // 2
    x = frame - frame.mean()
    d = np.array([np.sum((x[:N] - x[tau:tau + N]) ** 2) for tau in range(1, int(sr / fmin) + 1)])
    d = np.concatenate([[0], d])
    cmnd = np.ones_like(d); run = np.cumsum(d[1:]); cmnd[1:] = d[1:] * np.arange(1, len(d)) / (run + 1e-12)
    lo = int(sr / fmax)
    idx = np.where(cmnd[lo:] < th)[0]
    if len(idx) == 0:
        tau = lo + np.argmin(cmnd[lo:])
    else:
        tau = lo + idx[0]
        while tau + 1 < len(cmnd) and cmnd[tau + 1] < cmnd[tau]: tau += 1
    if 1 <= tau < len(cmnd) - 1:
        a, b, c = cmnd[tau - 1], cmnd[tau], cmnd[tau + 1]; den = a - 2 * b + c
        tau = tau + (.5 * (a - c) / den if den else 0)
    return sr / tau, float(cmnd[int(round(tau))]) if int(round(tau)) < len(cmnd) else 1.0

def check(path, tune, octave_shift, fast=False):
    x, sr = read_audio(path)
    spb = 60 / tune['tempo_bpm']
    W = 2048 if sr >= 44100 else 1024
    pe, oe = [], []
    for nt in tune['notes']:
        target = nt['pitch_hz'] * 2 ** (octave_shift / 12)
        s = nt['start_beat'] * spb; d = nt['duration_beats'] * spb
        ests = []
        for q in np.linspace(.35, .8, 4):
            i = int((s + d * q) * sr)
            if i + W > len(x): continue
            f, c = yin(x[i:i + W], sr)
            ests.append(f)
        f0 = np.median(ests)
        c = 1200 * np.log2(f0 / target)
        pe.append(c)
        # onset: first time (from expected-120ms) the pitch sits within 50 cents for 2 consecutive hops
        if fast:
            oe.append(0.0); continue
        hop = int(.01 * sr); t0 = int((s - .12) * sr); ok = 0; on = None
        for k in range(0, int(.45 * sr), hop):
            i = t0 + k
            if i < 0 or i + W > len(x): continue
            seg = x[i:i + W]
            if np.sqrt(np.mean(seg ** 2)) < 1e-3: ok = 0; continue
            f, _ = yin(seg, sr)
            if abs(1200 * np.log2(f / target)) < 50:
                ok += 1
                if ok == 2: on = (i - hop) / sr + (W / 2) / sr; break
            else:
                ok = 0
        oe.append(1000 * ((on if on is not None else s + .45) - s))
    return np.array(pe), np.array(oe)

if __name__ == '__main__':
    man = json.load(open(os.path.join(HERE, 'manifest.json')))
    verses = sorted({f['verse'] for f in man['files']})
    if '--verses' in sys.argv: verses = [int(v) for v in sys.argv[sys.argv.index('--verses') + 1].split(',')]
    res = []
    for f in man['files']:
        if f['role'] != 'melody' or f['verse'] not in verses: continue
        tune = json.load(open(os.path.join(HERE, f'verse-{f["verse"]}.B.json')))
        src = f['files'].get('wav') or f['files']['m4a']
        pe, oe = check(os.path.join(HERE, src), tune, f['octave_shift'])
        r = {'verse': f['verse'], 'id': f['id'], 'source': os.path.basename(src), 'max_cents': round(float(np.max(np.abs(pe))), 1), 'mean_cents': round(float(np.mean(np.abs(pe))), 1),
             'notes_out_of_tol': int(np.sum(np.abs(pe) > 50)), 'max_onset_ms': round(float(np.max(oe)), 0), 'median_onset_ms': round(float(np.median(oe)), 0), 'onsets_over_90ms': int(np.sum(oe > 90)),
             'worst_note': int(np.argmax(np.abs(pe))) + 1}
        res.append(r)
        print(f"v{r['verse']} {r['id']:11s} pitch max {r['max_cents']:6.1f}c mean {r['mean_cents']:5.1f}c out {r['notes_out_of_tol']:2d} | onset median {r['median_onset_ms']:4.0f}ms max {r['max_onset_ms']:4.0f}ms >90ms {r['onsets_over_90ms']}", flush=True)
    json.dump(res, open(os.path.join(HERE, 'verify_results.json'), 'w'), indent=1)
