import json,struct,wave,math,hashlib
import numpy as np
SYL=json.load(open('syllables.json'))
TONIC=196.0;BPM=150
CANDS={
 'A':{'raga':'Mohanam','scale':'S R2 G3 P D2','names':{0:'Sa',2:'Ri',4:'Ga',7:'Pa',9:'Dha',12:'Sa',14:'Ri',-3:'Dha',-5:'Pa'},
  'lines':[[0,0,2, 4,2,4, 7,4,2, 4,2,0, 2,4,7, 9,7,4, 7],
           [7,7,9, 12,9,7, 9,7,4, 4,2,4, 7,4,2, 4,2,0, 2],
           [4,7,9, 12,12,9, 12,14,12, 9,7,9, 12,9,7, 9,7,4, 7],
           [12,9,7, 9,7,4, 7,4,2, 4,2,0, 2,4,7, 4,2,2, 0]],
  'mood':'bright, devotional, easy to sing'},
 'B':{'raga':'Revati','scale':'S R1 M1 P N2','names':{0:'Sa',1:'Ri',5:'Ma',7:'Pa',10:'Ni',12:'Sa',13:'Ri',-2:'Ni',-5:'Pa'},
  'lines':[[0,0,1, 5,1,5, 7,5,1, 5,1,0, -2,0,1, 5,7,5, 7],
           [7,7,10, 12,10,7, 10,7,5, 7,5,1, 5,1,0, 1,5,5, 1],
           [5,7,10, 12,12,10, 12,13,12, 10,7,10, 12,10,7, 10,7,5, 7],
           [12,10,7, 10,7,5, 7,5,1, 5,1,0, 1,5,7, 5,1,1, 0]],
  'mood':'meditative, Vedic colour (the rāga of Bho Śambho)'}}
def octv(s):return -1 if s<0 else (1 if s>=12 else 0)
def make(verse,key):
    C=CANDS[key];notes=[];phr=[];beat=0.0
    for li,line in enumerate(SYL[str(verse)]):
        mel=C['lines'][li];start=beat
        for k,sy in enumerate(line):
            d=2.0 if sy['w']=='G' else 1.0
            if k==18:d=3.0
            s=mel[k]
            notes.append({'i':len(notes),'line':li+1,'pos':k+1,'syllable':sy['iast'],'dev':sy['dev'],'weight':sy['w'],'swara':C['names'][s],'octave':['mandra','madhya','tara'][octv(s)+1],'semitone':s,
                          'pitch_hz':round(TONIC*2**(s/12),3),'start_beat':beat,'duration_beats':d,'cents_tol':50})
            beat+=d
            if k==11:phr.append({'line':li+1,'part':1,'start_beat':start,'end_beat':beat});beat+=1;start=beat
        phr.append({'line':li+1,'part':2,'start_beat':start,'end_beat':beat});beat+=2 if li<3 else 3
    return{'verse':verse,'candidate':key,'status':'DRAFT - NOT TRADITIONAL','source':'Composed on the śārdūlavikrīḍita syllable grid (guru = 2 beats, laghu = 1, pause after syllable 12). No traditional notation was available.',
           'raga':C['raga'],'scale':C['scale'],'mood':C['mood'],'tonic_hz':TONIC,'tala':'metre-led chant (beat = one laghu)','tempo_bpm':BPM,'time_signature':'free','total_beats':beat,'notes':notes,'phrases':phr,'version':'0.1'}
def midi(t,path):
    tpq=480;ev=[];tick=lambda b:int(round(b*tpq))
    for n in t['notes']:
        m=int(round(69+12*math.log2(n['pitch_hz']/440)));ev.append((tick(n['start_beat']),0x90,m,96));ev.append((tick(n['start_beat']+n['duration_beats'])-1,0x80,m,0))
    ev.sort();trk=b'';last=0
    def vlq(v):
        o=[v&0x7f];v>>=7
        while v:o.insert(0,(v&0x7f)|0x80);v>>=7
        return bytes(o)
    us=int(60e6/t['tempo_bpm']);trk+=b'\x00\xff\x51\x03'+us.to_bytes(3,'big')
    for tk,st,m,v in ev:trk+=vlq(tk-last)+bytes([st,m,v]);last=tk
    trk+=b'\x00\xff\x2f\x00'
    open(path,'wb').write(b'MThd'+struct.pack('>IHHH',6,0,1,tpq)+b'MTrk'+struct.pack('>I',len(trk))+trk)
def render(t,path,sr=48000):
    spb=60/t['tempo_bpm'];dur=t['total_beats']*spb+1.5;N=int(dur*sr);out=np.zeros(N);tt=np.arange(N)/sr
    # tanpura-like drone: Pa, Sa, Sa, lower Sa
    for f,a in [(TONIC*1.5/2,.05),(TONIC,.06),(TONIC,.05),(TONIC/2,.06)]:
        ph=2*np.pi*f*tt;out+=a*(np.sin(ph)+.5*np.sin(2*ph)+.3*np.sin(3*ph)+.2*np.sin(4*ph))*(.85+.15*np.sin(2*np.pi*.3*tt))
    for n in t['notes']:
        s0=int(n['start_beat']*spb*sr);ln=int(n['duration_beats']*spb*sr);x=np.arange(ln)/sr;f=n['pitch_hz']
        env=np.minimum(1,x/.03)*np.minimum(1,(ln/sr-x)/.06)*(.75+.25*np.exp(-x*3))
        ph=2*np.pi*f*x;tone=(np.sin(ph)+.45*np.sin(2*ph)+.25*np.sin(3*ph)+.12*np.sin(4*ph))
        out[s0:s0+ln]+=.28*env*tone
    out/=np.max(np.abs(out))*1.05
    pcm=(out*32767*.89).astype('<i2')
    with wave.open(path,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
ALL={}
for v in range(1,9):
    for k in 'AB':
        t=make(v,k);ALL[f'{v}{k}']=t;json.dump(t,open(f'verse-{v}.{k}.json','w'),ensure_ascii=False,indent=1);midi(t,f'verse-{v}.{k}.mid')
for k in 'AB':render(ALL['1'+k],f'verse-1.{k}.reference.wav')
json.dump(ALL,open('all_tunes.json','w'),ensure_ascii=False)
print('beats per verse',ALL['1A']['total_beats'],'seconds',round(ALL['1A']['total_beats']*60/BPM,1),'notes',len(ALL['1A']['notes']))
