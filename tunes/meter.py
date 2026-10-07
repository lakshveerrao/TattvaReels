import json,sys
from verses import V
CONS=set(chr(c) for c in range(0x915,0x93A))|{'ळ'}
VIR='्';NUK='़'
LONGM=set('ाीूॄेैोौ');SHORTM=set('िुृॢ')
IND={'अ':('a',0),'आ':('ā',1),'इ':('i',0),'ई':('ī',1),'उ':('u',0),'ऊ':('ū',1),'ऋ':('ṛ',0),'ॠ':('ṝ',1),'ए':('e',1),'ऐ':('ai',1),'ओ':('o',1),'औ':('au',1)}
TR={'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'ṅ','च':'c','छ':'ch','ज':'j','झ':'jh','ञ':'ñ','ट':'ṭ','ठ':'ṭh','ड':'ḍ','ढ':'ḍh','ण':'ṇ','त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'ś','ष':'ṣ','स':'s','ह':'h','ळ':'ḷ'}
MV={'ा':'ā','ि':'i','ी':'ī','ु':'u','ू':'ū','ृ':'ṛ','ॄ':'ṝ','े':'e','ै':'ai','ो':'o','ौ':'au'}
PAT='GGGLLGLGLLLGGGLGGL'
def syl(line):
    s=[c for c in line if c in CONS or c in VIR or c in LONGM or c in SHORTM or c in IND or c in 'ंःँ']
    out=[];onset=[];dev='';i=0
    while i<len(s):
        c=s[i]
        if c in CONS:
            if i+1<len(s) and s[i+1]==VIR:
                onset.append(c);dev+=c+VIR;i+=2;continue
            onset.append(c);dev+=c;i+=1
            if i<len(s) and (s[i] in LONGM or s[i] in SHORTM):
                v=s[i];dev+=v;i+=1;vow=MV[v];lng=v in LONGM
            else: vow='a';lng=False
            out.append({'on':onset,'v':vow,'long':lng,'coda':'','dev':dev});onset=[];dev=''
        elif c in IND:
            out.append({'on':onset,'v':IND[c][0],'long':bool(IND[c][1]),'coda':'','dev':dev+c});onset=[];dev='';i+=1
        elif c in 'ंःँ':
            out[-1]['coda']+=c;out[-1]['dev']+=c;i+=1
        else: i+=1
    if onset:
        out[-1]['tail']=onset;out[-1]['dev']+=dev
    for k,x in enumerate(out):
        nxt=out[k+1]['on'] if k+1<len(out) else x.get('tail',[])
        heavy=x['long'] or x['coda'] in('ं','ः') or len(nxt)>=2 or (k==len(out)-1 and x.get('tail'))
        x['w']='G' if heavy else 'L'
        ia=''.join(TR[c] for c in x['on'])+x['v']+('ṁ' if 'ं' in x['coda'] else '')+('ḥ' if 'ः' in x['coda'] else '')+''.join(TR[c] for c in x.get('tail',[]))
        x['iast']=ia
    return out
bad=0;data={}
for n,ls in V.items():
    data[n]=[]
    for j,l in enumerate(ls):
        S=syl(l);w=''.join(x['w'] for x in S)
        ok=len(S)==19 and w[:18]==PAT
        if not ok:bad+=1
        diff=''.join(' ' if k<len(w) and k<18 and w[k]==PAT[k] else '^' for k in range(max(len(w),18)))
        print(n,j+1,len(S),w,'OK' if ok else 'MISMATCH');
        if not ok:print('        ',PAT,'\n        ',diff,' '.join(x['iast'] for x in S))
        data[n].append([{'dev':x['dev'],'iast':x['iast'],'w':x['w']} for x in S])
print('mismatches',bad)
json.dump(data,open('syllables.json','w'),ensure_ascii=False)
