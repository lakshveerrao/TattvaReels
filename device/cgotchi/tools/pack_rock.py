"""Packs the Cheeko rock mixes (band + singer's rock voice, 16 kHz WAV from /api/music?fmt=pcm&mix=1, fetched by the
rock-assets workflow) into flash/cgotchi/rock.bin, which the installer writes into the "ffat" partition at 0x450000.
Layout: "HTRU", count, 8 x {tattva, offset, samples, voiceStart, voiceLen} (uint32 LE), then G.711 mu-law bytes
(8 bits a sample: cleaner than ADPCM for dense rock, and all five still fit the 3.7 MB partition).
Usage: python3 pack_rock.py DIR_WITH_rock-vN.wav_AND_.hdr"""
import sys,os,struct,wave
STEP=[7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767]
IDX=[-1,-1,-1,-1,2,4,6,8,-1,-1,-1,-1,2,4,6,8]
def mulaw(samples):
    out=bytearray(len(samples))
    for i,x in enumerate(samples):
        sign=0x80 if x<0 else 0; x=min(32635,abs(x))+0x84; e=7
        for k in range(7,-1,-1):
            if x&(0x4000>>(7-k)): e=k; break
        m=(x>>(e+3))&0x0F; out[i]=~(sign|(e<<4)|m)&0xFF
    return bytes(out)
def enc(samples):
    pred=0;ix=0;nib=[]
    for s in samples:
        st=STEP[ix];d=s-pred;code=0
        if d<0:code=8;d=-d
        diff=st>>3
        if d>=st:code|=4;d-=st;diff+=st
        if d>=st>>1:code|=2;d-=st>>1;diff+=st>>1
        if d>=st>>2:code|=1;diff+=st>>2
        pred=pred-diff if code&8 else pred+diff;pred=max(-32768,min(32767,pred))
        ix=max(0,min(88,ix+IDX[code]));nib.append(code)
    if len(nib)%2:nib.append(0)
    return bytes(nib[k]|(nib[k+1]<<4) for k in range(0,len(nib),2))
D=sys.argv[1];TT=[1,2,4,6,8];PART=0x3b0000
ents=[];blobs=[];off=4096
for n in TT:
    w=wave.open(os.path.join(D,'rock-v%d.wav'%n));assert w.getframerate()==16000 and w.getnchannels()==1
    s=struct.unpack('<%dh'%w.getnframes(),w.readframes(w.getnframes()))
    h={l.split(':')[0].strip().lower():int(l.split(':')[1]) for l in open(os.path.join(D,'rock-v%d.hdr'%n)) if ':' in l}
    b=mulaw(s);ents.append((n,off,len(s),h.get('x-voice-start',0),h.get('x-voice-len',0)));blobs.append(b)
    print('tattva',n,'%.1fs'%(len(s)/16000),'voice',h.get('x-voice-start'),h.get('x-voice-len'),'bytes',len(b))
    off+=(len(b)+4095)//4096*4096
assert off<=PART,'too big for the partition'
hdr=b'HTRU'+struct.pack('<I',len(ents))+b''.join(struct.pack('<5I',*e) for e in ents)+b'\0'*(20*(8-len(ents)))
out=bytearray(hdr.ljust(4096,b'\xff'))
for e,b in zip(ents,blobs): out[len(out):]=b'\xff'*(e[1]-len(out)); out+=b
dst=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','flash','cgotchi','rock.bin')
open(dst,'wb').write(out);print('rock.bin',len(out),'bytes')
