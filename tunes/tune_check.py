"""Reference implementation of the Tattva "did they sing it correctly?" check.
Usage: python3 tune_check.py recording.wav [verse]   |   python3 tune_check.py --selftest
Compares pitch relative to the singer's own key (any transposition, any octave) and tolerates tempo 0.6x-1.6x.
"""
import json, os, sys, wave, subprocess
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
HOP = 0.01
PITCH_TOL = 50       # cents: a frame counts as on-pitch inside this band
NOTE_HIT = 0.5       # a note is "hit" when at least this share of its voiced frames is on pitch
RHYTHM_TOL = 0.45    # a note's length may differ by this fraction (after global tempo) before it is flagged
PASS = 80            # overall score needed to publish (good takes score 99+, the worst passing-looking failure scored 77)

def load_tune(verse=1):
    return json.load(open(os.path.join(HERE, f'verse-{verse}.B.json')))

def read(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<i2') / 32768.0, 16000

def track(x, sr, fmin=70, fmax=1000):
    W = int(.04 * sr); H = int(HOP * sr); taumax = int(sr / fmin); taumin = int(sr / fmax)
    out = []
    for i in range(0, len(x) - W - taumax, H):
        fr = x[i:i + W + taumax]
        if np.sqrt(np.mean(fr[:W] ** 2)) < .006:
            out.append(np.nan); continue
        a = fr[:W]
        d = np.array([np.sum((a - fr[t:t + W]) ** 2) for t in range(1, taumax)])
        c = d * np.arange(1, taumax) / (np.cumsum(d) + 1e-12)
        idx = np.where(c[taumin:] < .2)[0]
        if not len(idx):
            out.append(np.nan); continue
        t = taumin + idx[0]
        while t + 1 < len(c) and c[t + 1] < c[t]: t += 1
        out.append(1200 * np.log2(sr / (t + 1) / 196.0))
    return np.array(out)

def reference(tune, hop=HOP):
    spb = 60 / tune['tempo_bpm']; total = int(round(tune['total_beats'] * spb / hop))
    seq = np.zeros(total); lab = np.zeros(total, int); cur = tune['notes'][0]['semitone'] * 100; k = 0
    for i in range(total):
        b = i * hop / spb
        while k + 1 < len(tune['notes']) and tune['notes'][k + 1]['start_beat'] <= b: k += 1
        seq[i] = tune['notes'][k]['semitone'] * 100; lab[i] = k
    return seq, lab

def circ(d):
    return (d + 600) % 1200 - 600

def dtw(u, r, off, band=.5):
    n, m = len(u), len(r)
    C = np.abs(circ(u[:, None] - off - r[None, :])) / 100.0
    C = np.minimum(C, 3.0)
    D = np.full((n + 1, m + 1), np.inf); D[0, 0] = 0
    for i in range(1, n + 1):
        lo = max(1, int(i * m / n - band * m)); hi = min(m, int(i * m / n + band * m))
        for j in range(lo, hi + 1):
            D[i, j] = C[i - 1, j - 1] + min(D[i - 1, j - 1], D[i - 1, j] + .3, D[i, j - 1] + .3)
    i, j, path = n, m, []
    while i > 0 and j > 0:
        path.append((i - 1, j - 1))
        k = np.argmin([D[i - 1, j - 1], D[i - 1, j] + .3, D[i, j - 1] + .3])
        i, j = (i - 1, j - 1) if k == 0 else (i - 1, j) if k == 1 else (i, j - 1)
    return D[n, m] / (n + m), path[::-1]

def check(f0, tune):
    v = ~np.isnan(f0)
    if v.sum() * HOP < 3:
        return {'pass': False, 'score': 0, 'reason': 'too little singing detected'}
    first = np.argmax(v); last = len(v) - np.argmax(v[::-1])
    u = f0[first:last]; uv = ~np.isnan(u)
    idx = np.where(uv)[0]; u_f = u.copy(); u_f[~uv] = np.interp(np.where(~uv)[0], idx, u[idx])
    r, lab = reference(tune)
    ds = 5; us, rs = u_f[::ds], r[::ds]
    best = None
    for k in range(12):
        cost, _ = dtw(us, rs, k * 100)
        if best is None or cost < best[0]: best = (cost, k * 100)
    off0 = best[1]; _, path = dtw(us, rs, off0)
    P = np.array(path, float) * ds * HOP                       # (t_user, t_ref)
    keep = np.ones(len(P), bool)
    for _ in range(3):                                          # robust line fit: user time = a + b * ref time
        bb, aa = np.polyfit(P[keep, 1], P[keep, 0], 1)
        err = np.abs(P[:, 0] - (aa + bb * P[:, 1])); keep = err < max(.15, np.percentile(err, 70))
    bb = float(np.clip(bb, .6, 1.6))
    resid = [circ(us[i] - off0 - rs[j]) for i, j in path if uv[min(len(uv) - 1, i * ds)]]
    off = off0 + float(np.median(resid))
    spb = 60 / tune['tempo_bpm']
    def note_score(n, shift):
        s0 = aa + bb * n['start_beat'] * spb + shift; d = bb * n['duration_beats'] * spb
        i0 = int((s0 + .18 * d) / HOP); i1 = int((s0 + .85 * d) / HOP)
        seg = u[max(0, i0):max(0, i1)]; seg = seg[~np.isnan(seg)] if len(seg) else seg
        if len(seg) == 0: return 0.0, None
        dev = circ(seg - off - n['semitone'] * 100)
        return float(np.mean(np.abs(dev) <= PITCH_TOL)), float(np.median(dev))
    notes = [None] * len(tune['notes']); phrases = []
    w = np.array([n['duration_beats'] for n in tune['notes']])
    for p in tune['phrases']:
        ks = [k for k, n in enumerate(tune['notes']) if n['line'] == p['line'] and p['start_beat'] <= n['start_beat'] < p['end_beat']]
        bestp = None
        for sh in np.arange(-.2, .201, .02):
            sc = sum(w[k] * note_score(tune['notes'][k], sh)[0] for k in ks)
            if bestp is None or sc > bestp[0]: bestp = (sc, sh)
        for k in ks:
            on, med = note_score(tune['notes'][k], bestp[1]); n = tune['notes'][k]
            notes[k] = {'i': k + 1, 'syllable': n['syllable'], 'line': n['line'], 'on_pitch': round(on, 2), 'median_cents': None if med is None else round(med), 'hit': on >= NOTE_HIT}
        hit = float(np.mean([notes[k]['hit'] for k in ks]))
        phrases.append({'line': p['line'], 'part': p['part'], 'notes_hit': round(hit, 2), 'shift_s': round(float(bestp[1]), 2), 'deviates': hit < 1.0})
    on = np.array([x['on_pitch'] for x in notes]); hits = np.array([x['hit'] for x in notes])
    pitch = float(np.sum(w * on) / w.sum()); noteacc = float(np.sum(w * hits) / w.sum())
    score = round(100 * (.5 * pitch + .5 * noteacc))
    return {'pass': score >= PASS, 'score': score, 'pitch_score': round(100 * pitch), 'notes_hit': int(hits.sum()), 'notes_total': len(notes),
            'key_offset_cents': round(off % 1200), 'tempo_factor': round(bb, 2), 'notes': notes, 'phrases': phrases}

def synth(tune, shift=0, tempo=1.0, wrong=None, rhythm=False, detune=0, mild=0, seed=1, sr=16000):
    rng = np.random.default_rng(seed); spb = 60 / tune['tempo_bpm'] * tempo; out = [np.zeros(int(.4 * sr))]; prev_end = 0.0
    for k, n in enumerate(tune['notes']):
        gap = n['start_beat'] - prev_end; prev_end = n['start_beat'] + n['duration_beats']
        if gap > 0: out.append(np.zeros(int(gap * spb * sr)))
        d = n['duration_beats'] * spb
        if rhythm: d *= [2.0, .5, 1.0][k % 3]
        s = n['semitone'] + shift + (2 if wrong == k else 0)
        cents = s * 100 + (rng.choice([-1, 1]) * rng.uniform(60, 90) if detune else 0) + (rng.uniform(-mild, mild) if mild else 0)
        f = 196 * 2 ** (cents / 1200); t = np.arange(int(d * sr)) / sr
        f_t = f * 2 ** (25 * np.sin(2 * np.pi * 5.5 * t) / 1200)
        ph = 2 * np.pi * np.cumsum(f_t) / sr
        env = np.minimum(1, t / .03) * np.minimum(1, (d - t) / .05)
        out.append(.3 * env * (np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3 * ph)) + .004 * rng.standard_normal(len(t)))
    return np.concatenate(out + [np.zeros(int(.4 * sr))]), sr

def selftest():
    tune = load_tune(1)
    cases = [('correct', {}), ('transposed +3 semitones', {'shift': 3}), ('slower (0.8x speed)', {'tempo': 1.25}), ('one wrong note (#30, a whole tone off)', {'wrong': 29}),
             ('wrong rhythm (lengths 2x / 0.5x)', {'rhythm': True}), ('slightly out of tune (random ±30 cents)', {'mild': 30}), ('off-key throughout (every note 60-90 cents off)', {'detune': 1}), ('different tune (verse melody reversed)', {'_rev': True})]
    rows = []
    for name, kw in cases:
        if kw.get('_rev'):
            t2 = json.loads(json.dumps(tune)); sem = [n['semitone'] for n in t2['notes']][::-1]
            for n, s in zip(t2['notes'], sem): n['semitone'] = s
            x, sr = synth(t2)
        else:
            x, sr = synth(tune, **kw)
        r = check(track(x, sr), tune)
        dev = [f"{p['line']}.{p['part']}" for p in r.get('phrases', []) if p['deviates']]
        rows.append((name, r['score'], r.get('pitch_score'), r.get('notes_hit'), r['pass'], r.get('key_offset_cents'), r.get('tempo_factor'), ','.join(dev) or '-'))
        print(f"{name:48s} score {r['score']:3d}  pitch {r.get('pitch_score')}  notes hit {r.get('notes_hit')}/{r.get('notes_total')}  {'PASS' if r['pass'] else 'FAIL'}  key {r.get('key_offset_cents')}c  tempo {r.get('tempo_factor')}  phrases flagged: {','.join(dev) or '-'}", flush=True)
    json.dump(rows, open(os.path.join(HERE, 'tune_check_selftest.json'), 'w'), indent=1)

if __name__ == '__main__':
    if '--selftest' in sys.argv: selftest()
    else:
        x, sr = read(sys.argv[1]); tune = load_tune(int(sys.argv[2]) if len(sys.argv) > 2 else 1)
        print(json.dumps(check(track(x, sr), tune), indent=1, ensure_ascii=False))
