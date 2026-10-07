/* ---------- saved audio: stems shared, instruments per verse, loaded on demand ---------- */
const INS_IDS=['sitar','veena','bansuri','violin','harmonium','piano','guitar','santoor','sarangi','nadaswaram','harp','cello'],STEMS=['drone_tanpura','rhythm_tabla','rhythm_mridangam'];
AUD.st={};AUD.dec=null;
AUD.load=function(key,url,done){if(AUD.st[key])return done&&done();AUD.st[key]=1;
 try{if(!AUD.dec)AUD.dec=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100);}catch(e){return;}
 fetch(url).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(ab=>AUD.dec.decodeAudioData(ab)).then(b=>{AUD.buf[key]=b;}).catch(()=>{}).finally(()=>{AUD.st[key]=2;done&&done();});};
AUD.need=function(n){n=n||1;if(AUD.st['v'+n])return;AUD.st['v'+n]=1;const keys=STEMS.map(id=>[id,'/audio/'+id+'.m4a']).concat(INS_IDS.map(id=>[n+'/'+id,n===1?'/audio/'+id+'.m4a':'/audio/v'+n+'/'+id+'.m4a']));
 let left=keys.length;keys.forEach(k=>AUD.load(k[0],k[1],()=>{if(--left===0){AUD.st['v'+n]=2;AUD.ready=true;onAudioReady(n);}}));};
AUD.has=function(n){return AUD.st['v'+(n||1)]===2;};
AUD.need(1);
function onAudioReady(n){if(!S.sound||!cur||cur.hasAudio||(n&&cur.vn!==n))return;
 if(S.view==='feed'){const el=reelNode(S.idx);if(el&&!el.querySelector('.endcard'))startReel(el);}else if(S.view==='create')startPreview();else if(S.view==='review')startReview();}

/* ---------- sing: Yousician-style practice ---------- */
let SN=TT[0].notes,SPB=60/TT[0].bpm,SONG=TT[0].total*SPB,SV=1;
const SWN={'-5':'Pa','-2':'Ni',0:'Sa',1:'Ri',5:'Ma',7:'Pa',10:'Ni',12:'Sa',13:'Ri'};
const PITCH_TOL=50,NOTE_HIT=.5,PASS_MARK=80;
const PHRASES=[];[1,2,3,4].forEach(l=>{const ks=SN.map((n,k)=>k).filter(k=>SN[k].line===l);PHRASES.push({line:l,part:1,ks:ks.slice(0,12)},{line:l,part:2,ks:ks.slice(12)});});
function setSingVerse(n){n=n||1;SV=n;const T=TT[n-1];SN=T.notes;SPB=60/T.bpm;SONG=T.total*SPB;AUD.need(n);const V=TATTVAS[n-1],h=$('#sg-title');if(h)h.textContent='Sing · Tattva '+n;}
const G={st:'idle',ac:null,stream:null,an:null,buf:null,mr:null,chunks:[],t0:0,recStart:0,frames:[],res:[],raf:0,guideSrc:[],guide:'sitar',drone:true,anyKey:false,keyOff:0,keyLocked:true,lat:.08,streak:0,best:0,only:null,parts:[],pops:[],count:0};
const circ=d=>((d+600)%1200+1200)%1200-600;
function yinF(x,sr){const W=x.length>>1,tmin=Math.floor(sr/1000),tmax=Math.min(W-1,Math.floor(sr/70));let rms=0;for(let i=0;i<W;i++)rms+=x[i]*x[i];if(Math.sqrt(rms/W)<.008)return NaN;
 const d=new Float32Array(tmax+1);for(let t=1;t<=tmax;t++){let s=0;for(let i=0;i<W;i++){const v=x[i]-x[i+t];s+=v*v;}d[t]=s;}
 let run=0,tau=-1;const c=new Float32Array(tmax+1);for(let t=1;t<=tmax;t++){run+=d[t];c[t]=d[t]*t/(run||1);}
 for(let t=tmin;t<=tmax;t++){if(c[t]<.15){while(t+1<=tmax&&c[t+1]<c[t])t++;tau=t;break;}}if(tau<0)return NaN;
 const a=c[tau-1],b=c[tau],e=c[tau+1]||b,den=a-2*b+e,f=sr/(tau+(den?.5*(a-e)/den:0));return 1200*Math.log2(f/196);}
function judge(k,frames,keyOff){const n=SN[k],s=n.beat*SPB,d=n.dur*SPB;let best={on:0,med:null};
 for(let sh=-.05;sh<=.451;sh+=.025){const a=s+.18*d+sh,b=s+.85*d+sh;const dv=[];for(const f of frames){if(f.t<a)continue;if(f.t>b)break;if(!isNaN(f.c))dv.push(circ(f.c-keyOff-n.semi*100));}
  if(!dv.length)continue;const on=dv.filter(x=>Math.abs(x)<=PITCH_TOL).length/dv.length;if(on>best.on||best.med===null){dv.sort((x,y)=>x-y);best={on,med:dv[dv.length>>1]};}}
 return{on:best.on,med:best.med,hit:best.on>=NOTE_HIT};}
function keyFrom(frames,ks){const dv=[];ks.forEach(k=>{const no=SN[k],a=no.beat*SPB,b=a+no.dur*SPB+.45;frames.forEach(f=>{if(f.t>=a&&f.t<=b&&!isNaN(f.c))dv.push({c:f.c,s:no.semi*100});});});
 if(dv.length<8)return 0;let best=0,bo=0;for(let off=0;off<1200;off+=5){let n=0;for(const d of dv)if(Math.abs(circ(d.c-d.s-off))<=40)n++;if(n>best){best=n;bo=off;}}
 const near=dv.map(d=>circ(d.c-d.s-bo)).filter(x=>Math.abs(x)<=40).sort((x,y)=>x-y);return (bo+(near.length?near[near.length>>1]:0)+1200)%1200;}
function totals(res){const w=SN.map(n=>n.dur);let sw=0,on=0,hit=0,nh=0;res.forEach((r,k)=>{if(!r)return;sw+=w[k];on+=w[k]*r.on;hit+=w[k]*(r.hit?1:0);nh+=r.hit?1:0;});return{score:sw?Math.round(100*(.5*on+.5*hit)/sw):0,hits:nh,judged:res.filter(Boolean).length};}

const SG=$('#v-sing');
function openSing(){stopCur();setSingVerse(S.style.Tattva||1);showView('sing');singReset();}
function singReset(){singStop(true);G.st='idle';G.res=new Array(SN.length).fill(null);G.frames=[];G.streak=0;G.best=0;G.pops=[];G.only=null;G.keyOff=0;G.keyLocked=!G.anyKey;G.nowK=-1;G.lyLine=0;
 $('#sg-result').hidden=true;$('#sg-go').hidden=false;$('#sg-go').className='sg-go';$('#sg-go').innerHTML='<span>Start</span>';$('#sg-count').hidden=true;
 $('#sg-guide').innerHTML=ico('music')+'<span>'+INSTR[G.guide]+'</span>';$('#sg-key').innerHTML='<span>'+(G.anyKey?'Any key':'Key of G · any octave')+'</span>';
 paintHUD();singDraw(-1.2);}
function paintHUD(){const t=totals(G.res);$('#sg-score').textContent=t.score;$('#sg-streak').textContent=G.streak;$('#sg-hits').textContent=t.hits+'/'+SN.length;}
function curNote(t){for(let k=0;k<SN.length;k++){const s=SN[k].beat*SPB,e=s+SN[k].dur*SPB;if(t<e)return t>=s-.3?k:Math.max(0,k);}return SN.length-1;}
function paintNow(t){const k=Math.max(0,curNote(t)),n=SN[k];if(G.nowK===k)return;G.nowK=k;$('#sg-dev').textContent=n.dev;$('#sg-ia').textContent=n.iast+' · '+SWN[n.semi];
 const L=$('#sg-lyric');if(G.lyLine!==n.line){G.lyLine=n.line;L.innerHTML=SN.map((x,i)=>x.line===n.line?'<span data-k="'+i+'">'+esc(x.dev)+'</span>':'').join('');}
 L.querySelectorAll('span').forEach(s=>{const i=+s.dataset.k;s.className=i===k?'now':(G.res[i]?(G.res[i].hit?'hit':'miss'):'');});}

let LG=null;
function laneCtx(){const c=$('#c-sing'),w=c.clientWidth,h=c.clientHeight;if(!LG||LG.w!==w||LG.h!==h){const d=Math.min(2,devicePixelRatio||1);c.width=w*d;c.height=h*d;const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);LG={g,w,h};}return LG;}
const LO=-4,HI=15;
function singDraw(t){const{g,w,h}=laneCtx();const pps=w/4.6,nowX=w*.28,top=10,bot=h-10,yC=c=>top+(HI-c/100)/(HI-LO)*(bot-top),rowH=(bot-top)/(HI-LO);
 g.clearRect(0,0,w,h);
 Object.keys(SWN).forEach(k=>{const s=+k,y=yC(s*100);g.fillStyle=s%12===0?'rgba(233,180,76,.12)':'rgba(246,235,210,.045)';g.fillRect(0,y-rowH*.45,w,rowH*.9);g.fillStyle=s%12===0?'#E9B44C':'rgba(246,235,210,.45)';g.font='600 11px Mukta,system-ui';g.textBaseline='middle';g.fillText(SWN[k]+(s>=12?'′':s<0?'·':''),6,y);});
 for(let b=Math.ceil((t-nowX/pps)/SPB);b*SPB<t+(w-nowX)/pps;b++){const x=nowX+(b*SPB-t)*pps;if(x<30)continue;g.fillStyle=b%4?'rgba(246,235,210,.04)':'rgba(246,235,210,.09)';g.fillRect(x,0,1,h);}
 SN.forEach((n,k)=>{if(G.only&&!G.only.includes(k))return;const s=n.beat*SPB,e=s+n.dur*SPB,x0=nowX+(s-t)*pps,x1=nowX+(e-t)*pps-3;if(x1<30||x0>w)return;const y=yC(n.semi*100),r=G.res[k],act=t>=s&&t<e;
  g.fillStyle=r?(r.hit?'#7FD1A6':'rgba(255,142,132,.75)'):(act?'#FFF4D6':(e<t?'rgba(246,213,142,.35)':'#F6D58E'));
  const xa=Math.max(30,x0),hh=rowH*.86;g.beginPath();if(g.roundRect)g.roundRect(xa,y-hh/2,Math.max(4,x1-xa),hh,hh/2);else g.rect(xa,y-hh/2,Math.max(4,x1-xa),hh);g.fill();
  if(x1-xa>22){g.fillStyle='#1A1206';g.font='15px "Tiro Devanagari Sanskrit",serif';g.textBaseline='middle';g.fillText(n.dev,xa+7,y+1);}});
 // singer's pitch trail, folded to the octave of the nearest note
 let last=null;g.lineWidth=3;g.lineCap='round';
 for(let i=Math.max(0,G.frames.length-400);i<G.frames.length;i++){const f=G.frames[i],x=nowX+(f.t-t)*pps;if(x<30||isNaN(f.c)){last=null;continue;}
  const k=Math.max(0,curNote(f.t)),tgt=SN[k].semi*100+G.keyOff,c=tgt+circ(f.c-tgt)-G.keyOff,y=yC(c),on=Math.abs(circ(f.c-G.keyOff-SN[k].semi*100))<=PITCH_TOL;
  if(last){g.strokeStyle=on?'#FFE6A8':'rgba(255,142,132,.9)';g.beginPath();g.moveTo(last.x,last.y);g.lineTo(x,y);g.stroke();}last={x,y,on};}
 g.fillStyle='rgba(246,235,210,.9)';g.fillRect(nowX-1,0,2,h);
 if(last&&G.st==='run'){g.fillStyle=last.on?'#FFE6A8':'#FF8E84';g.beginPath();g.arc(last.x,last.y,7,0,7);g.fill();g.fillStyle=last.on?'rgba(255,230,168,.25)':'rgba(255,142,132,.2)';g.beginPath();g.arc(last.x,last.y,16,0,7);g.fill();}
 G.pops=G.pops.filter(p=>t-p.t<.9);G.pops.forEach(p=>{const a=1-(t-p.t)/.9,y=yC(p.c)-24-(t-p.t)*40;g.globalAlpha=a;g.fillStyle=p.col;g.font='700 14px Mukta,system-ui';g.textAlign='center';g.fillText(p.txt,nowX+30,y);g.textAlign='left';
  if(p.hit)for(let q=0;q<8;q++){const an=q/8*Math.PI*2,rr=(t-p.t)*70;g.fillRect(nowX+Math.cos(an)*rr-1.5,yC(p.c)+Math.sin(an)*rr-1.5,3,3);}g.globalAlpha=1;});
 paintNow(Math.max(0,t));
 const pr=G.only?0:Math.max(0,Math.min(1,t/SONG));$('#sg-prog').style.width=(pr*100).toFixed(1)+'%';}

async function singStart(){if(G.st==='run'||G.st==='count'){singFinish();return;}
 singReset();
 if(!AUD.has(SV)){AUD.need(SV);toast('The guide audio is still loading. Try again in a second.');return;}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){singNoMic();return;}
 try{G.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false}});}catch(e){singNoMic();return;}
 const ac=G.ac=new AC();if(ac.resume)ac.resume();const src=ac.createMediaStreamSource(G.stream);G.an=ac.createAnalyser();G.an.fftSize=2048;src.connect(G.an);G.buf=new Float32Array(2048);
 G.lat=(ac.baseLatency||0)+(ac.outputLatency||0)+.06;
 try{G.chunks=[];G.mr=new MediaRecorder(G.stream);G.mr.ondataavailable=e=>{if(e.data.size)G.chunks.push(e.data);};G.mr.start();G.recStart=ac.currentTime;}catch(e){G.mr=null;}
 const lead=G.only?0:3;const from=G.only?Math.max(0,SN[G.only[0]].beat*SPB-1.6):0,to=G.only?SN[G.only[G.only.length-1]].beat*SPB+SN[G.only[G.only.length-1]].dur*SPB+.8:SONG+1.4;
 G.t0=ac.currentTime+lead+.15-from;G.end=to;
 const m=ac.createGain();m.gain.value=.9;m.connect(ac.destination);
 const lay=(id,gain)=>{const b=AUD.buf[id];if(!b)return;const s=ac.createBufferSource(),gg=ac.createGain();gg.gain.value=gain;s.buffer=b;s.connect(gg);gg.connect(m);s.start(G.t0+from,from,to-from+.3);G.guideSrc.push(s);};
 lay(SV+'/'+G.guide,.8);if(G.drone)lay('drone_tanpura',.35);
 G.st=lead?'count':'run';$('#sg-go').className='sg-go live';$('#sg-go').innerHTML='<span>Stop</span>';$('#sg-tip').hidden=true;
 const W=1024,ds=new Float32Array(W),sr=ac.sampleRate/2;
 const loop=()=>{const t=ac.currentTime-G.t0;
  if(G.st==='count'){const n=Math.ceil(G.t0+from-ac.currentTime),cnt=$('#sg-count');if(n<=0){cnt.hidden=true;G.st='run';}else if(n<=3){cnt.hidden=false;if(cnt.textContent!==String(n)){cnt.textContent=n;cnt.style.animation='none';void cnt.offsetWidth;cnt.style.animation='';}}}
  if(G.st==='run'||G.st==='count'){G.an.getFloatTimeDomainData(G.buf);for(let i=0;i<W;i++)ds[i]=(G.buf[2*i]+G.buf[2*i+1])*.5;const c=yinF(ds,sr);G.frames.push({t:t-G.lat-.021,c});
   if(G.anyKey&&!G.keyLocked){const ks=(G.only||SN.map((n,k)=>k)).slice(0,4),lastK=ks[ks.length-1],e=SN[lastK].beat*SPB+SN[lastK].dur*SPB;if(t>e+.4){G.keyOff=keyFrom(G.frames,ks);G.keyLocked=true;toast('Your Sa is set. Keep going');}}
   if(G.keyLocked)SN.forEach((n,k)=>{if(G.res[k]||(G.only&&!G.only.includes(k)))return;const e=n.beat*SPB+n.dur*SPB;if(t>e+.4){const r=judge(k,G.frames,G.keyOff);G.res[k]=r;
    if(r.hit){G.streak++;G.best=Math.max(G.best,G.streak);}else G.streak=0;
    G.pops.push({t,c:n.semi*100,txt:r.on>=.8?'Perfect':r.hit?'Good':'Miss',col:r.on>=.8?'#FFE6A8':r.hit?'#7FD1A6':'#FF8E84',hit:r.hit});paintHUD();}});
   if(t>G.end){singFinish();return;}}
  singDraw(t);G.raf=requestAnimationFrame(loop);};
 loop();}
function singStop(silent){cancelAnimationFrame(G.raf);G.guideSrc.forEach(s=>{try{s.stop();}catch(e){}});G.guideSrc=[];
 if(G.mr&&G.mr.state==='recording'){G.mr.onstop=null;try{G.mr.stop();}catch(e){}}G.mr=silent?null:G.mr;
 if(G.stream){G.stream.getTracks().forEach(t=>t.stop());G.stream=null;}if(G.ac&&silent){closeAC(G.ac);G.ac=null;}if(silent)G.st='idle';}
function singFinish(){if(G.st!=='run'&&G.st!=='count')return;const ac=G.ac,recLead=G.t0-G.recStart;G.st='done';
 const mr=G.mr;G.mr=null;cancelAnimationFrame(G.raf);G.guideSrc.forEach(s=>{try{s.stop();}catch(e){}});G.guideSrc=[];if(G.stream){G.stream.getTracks().forEach(t=>t.stop());G.stream=null;}
 G.takeBuf=null;G.takeOffset=Math.max(0,recLead);
 G.takeBlob=null;if(mr&&mr.state==='recording'){mr.onstop=async()=>{try{const b=new Blob(G.chunks,{type:mr.mimeType});G.takeBlob=b;G.takeBuf=await ac.decodeAudioData(await b.arrayBuffer());}catch(e){}closeAC(ac);};mr.stop();}else{closeAC(ac);}
 $('#sg-count').hidden=true;singResults(totals(G.res),G.res,false);}
function singNoMic(){openSheet('mic','<div class="shead"><div><h2 class="sh-title">We can’t hear your microphone</h2><p class="note">Allow microphone access for this site in your browser settings, then try again. You can also check a recording you made.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div>'+
 '<label class="btn gold" for="sg-file">'+ico('upload')+'Check a recording</label>');$('#sh-x').onclick=closeSheet;}

/* ---------- offline check: same rules as tune_check.py ---------- */
async function to16k(buf){const n=Math.ceil(buf.duration*16000),oc=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,n,16000),s=oc.createBufferSource();s.buffer=buf;s.connect(oc.destination);s.start();const r=await oc.startRendering();return r.getChannelData(0);}
function trackOff(x,sr,hop){const W=400,out=[];for(let i=0;i+W*2<x.length;i+=Math.round(hop*sr))out.push({t:out.length*hop,c:yinF(x.subarray(i,i+W*2),sr)});return out;}
function dtwOff(u,r,off){const n=u.length,m=r.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF);prev[0]=0;const back=new Uint8Array((n+1)*(m+1));
 for(let i=1;i<=n;i++){const curR=new Float64Array(m+1).fill(INF);const lo=Math.max(1,Math.floor(i*m/n-.5*m)),hi=Math.min(m,Math.ceil(i*m/n+.5*m));
  for(let j=lo;j<=hi;j++){const c=Math.min(3,Math.abs(circ(u[i-1]-off-r[j-1]))/100);const a=prev[j-1],b=prev[j]+.3,d=curR[j-1]+.3;let mn=a,bk=0;if(b<mn){mn=b;bk=1;}if(d<mn){mn=d;bk=2;}curR[j]=c+mn;back[i*(m+1)+j]=bk;}prev=curR;}
 const cost=prev[m]/(n+m),path=[];let i=n,j=m;while(i>0&&j>0){path.push([i-1,j-1]);const bk=back[i*(m+1)+j];if(bk===0){i--;j--;}else if(bk===1)i--;else j--;}return{cost,path:path.reverse()};}
function checkOffline(fr){const hop=.025;let first=fr.findIndex(f=>!isNaN(f.c)),last=fr.length-1;while(last>0&&isNaN(fr[last].c))last--;
 if(first<0||fr.filter(f=>!isNaN(f.c)).length*hop<3)return null;
 const seg=fr.slice(first,last+1),u=seg.map(f=>f.c);let lv=u.find(v=>!isNaN(v));const uf=u.map(v=>isNaN(v)?lv:(lv=v));
 const ref=[];for(let t=0;t<SONG;t+=hop){const k=Math.max(0,SN.findIndex((n,i)=>i+1===SN.length||SN[i+1].beat*SPB>t));ref.push(SN[k].semi*100);}
 const us=uf.filter((v,i)=>i%2===0),rs=ref.filter((v,i)=>i%2===0);let best=null;for(let k=0;k<12;k++){const d=dtwOff(us,rs,k*100);if(!best||d.cost<best.cost)best={cost:d.cost,off:k*100,path:d.path};}
 const P=best.path.map(([i,j])=>[i*2*hop,j*2*hop]);let keep=P.map(()=>true),a=0,b=1;
 for(let it=0;it<3;it++){let n=0,sx=0,sy=0,sxx=0,sxy=0;P.forEach((p,q)=>{if(!keep[q])return;n++;sx+=p[1];sy+=p[0];sxx+=p[1]*p[1];sxy+=p[1]*p[0];});b=(n*sxy-sx*sy)/(n*sxx-sx*sx);a=(sy-b*sx)/n;
  const err=P.map(p=>Math.abs(p[0]-(a+b*p[1])));const srt=err.slice().sort((x,y)=>x-y),thr=Math.max(.15,srt[Math.floor(srt.length*.7)]);keep=err.map(e=>e<thr);}
 b=Math.min(1.6,Math.max(.6,b));const resid=best.path.map(([i,j])=>circ(us[i]-best.off-rs[j])).sort((x,y)=>x-y),off=best.off+resid[resid.length>>1];
 const frames=seg.map((f,i)=>({t:(i*hop-a)/b,c:f.c}));
 const res=new Array(SN.length).fill(null);
 PHRASES.forEach(p=>{let bs=null;for(let sh=-.2;sh<=.201;sh+=.02){let sc=0;const rr=p.ks.map(k=>{const r=judgeAt(k,frames,off,sh);sc+=SN[k].dur*r.on;return r;});if(!bs||sc>bs.sc)bs={sc,rr};}p.ks.forEach((k,q)=>res[k]=bs.rr[q]);});
 return{res,tot:totals(res),start:a+first*hop,tempo:b,off:((off%1200)+1200)%1200};}
function judgeAt(k,frames,keyOff,sh){const n=SN[k],s=n.beat*SPB,d=n.dur*SPB,a=s+.18*d+sh,b=s+.85*d+sh,dv=[];frames.forEach(f=>{if(f.t>=a&&f.t<=b&&!isNaN(f.c))dv.push(circ(f.c-keyOff-n.semi*100));});
 const on=dv.length?dv.filter(x=>Math.abs(x)<=PITCH_TOL).length/dv.length:0;return{on,hit:on>=NOTE_HIT};}
async function singUpload(file){if(S.view!=='sing'){setSingVerse(S.style.Tattva||1);showView('sing');singReset();}toast('Checking your recording…');
 try{const ac=new AC(),buf=await ac.decodeAudioData(await file.arrayBuffer());closeAC(ac);await new Promise(r=>setTimeout(r,30));const x=await to16k(buf),fr=trackOff(x,16000,.025),r=checkOffline(fr);
  if(!r){toast('We didn’t hear enough singing in that file.');return;}G.res=r.res;G.takeBuf=buf;G.takeBlob=file;G.takeOffset=Math.max(0,r.start);singDraw(-1.2);singResults(r.tot,r.res,true);}catch(e){toast('Couldn’t read that audio. Try another file.');}}
function singResults(tot,res,offline,label){const box=$('#sg-result'),pass=tot.score>=PASS_MARK&&tot.judged>=SN.length*(G.only?0:1);
 const lines=[1,2,3,4].map(l=>{const ks=SN.map((n,k)=>k).filter(k=>SN[k].line===l&&res[k]);const h=ks.filter(k=>res[k].hit).length;return{l,h,n:ks.length};});
 const weak=PHRASES.filter(p=>p.ks.some(k=>res[k]&&!res[k].hit));
 const lamps=[60,80,95].map(th=>'<span class="lamp'+(tot.score>=th?' on':'')+'">'+ico('lotus')+'</span>').join('');
 box.innerHTML='<div class="sg-card"><p class="eyebrow">'+(label?esc(label):G.only?'Line practice':'Your take')+'</p><div class="lamps">'+lamps+'</div><div class="sg-big">'+tot.score+'</div>'+
  '<p class="count"><b>'+tot.hits+'</b> of '+tot.judged+' notes on pitch'+(G.best?' · best streak <b>'+G.best+'</b>':'')+'</p>'+
  '<div class="sg-lines">'+lines.filter(x=>x.n).map(x=>'<div class="sg-ln"><span>Line '+x.l+'</span><i><b style="width:'+Math.round(100*x.h/x.n)+'%"></b></i><span>'+x.h+'/'+x.n+'</span></div>').join('')+'</div>'+
  (weak.length?'<p class="lab" style="text-align:left">Practise these</p><div class="chips">'+weak.slice(0,6).map(p=>'<button class="chip" data-ph="'+(p.line*10+p.part)+'">Line '+p.line+(p.part===1?', first half':', second half')+'</button>').join('')+'</div>':'')+
  (G.only?'':pass?'<p class="note" style="color:var(--ok)">That’s a match. You can share it.</p>':'<p class="note">'+PASS_MARK+' is needed to share. You’re '+Math.max(0,PASS_MARK-tot.score)+' away.</p>')+
  '<div class="row2"><button class="btn line" id="sg-again">'+ico('replay')+(G.only?'Full verse':'Try again')+'</button>'+(pass&&!G.only?'<button class="btn gold" id="sg-share">Share your take</button>':'')+'</div></div>';
 box.hidden=false;$('#sg-go').hidden=true;
 $('#sg-again').onclick=()=>{G.only=null;singReset();};
 box.querySelectorAll('[data-ph]').forEach(b=>b.onclick=()=>{const v=+b.dataset.ph,p=PHRASES.find(x=>x.line*10+x.part===v);singReset();G.only=p.ks;singDraw(SN[p.ks[0]].beat*SPB-1.6);$('#sg-tip').hidden=false;$('#sg-tip').textContent='Practising line '+p.line+(p.part===1?', first half':', second half')+'. Press Start.';});
 const sh=$('#sg-share');if(sh)sh.onclick=()=>{S.source='sung';S.score=tot.score;S.takeBuf=G.takeBuf;S.takeBlob=G.takeBlob||null;S.takeOffset=G.takeOffset||0;if(G.takeBuf)S.style.Recitation='My recording';openReview();};}

$('#sg-close').innerHTML=ico('x');$('#sg-close').onclick=()=>{singStop(true);showView('create');renderTools();renderFx(true);startPreview();};
$('#sg-go').onclick=()=>singStart();
$('#sg-file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f){closeSheet();singUpload(f);}};
$('#sg-up').innerHTML=ico('upload')+'<span>Check a file</span>';
$('#sg-key').onclick=()=>{if(G.st==='run'||G.st==='count')return;G.anyKey=!G.anyKey;singReset();toast(G.anyKey?'Sing in any key: the first 4 notes set your Sa':'Key of G: sing along with the guide, any octave');};
$('#sg-guide').onclick=()=>{if(G.st==='run'||G.st==='count')return;openSheet('guide','<div class="shead"><div><h2 class="sh-title">Guide</h2><p class="note">The pre-recorded instrument you sing along with.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Done">'+ico('check')+'</button></div><div class="chips" id="gd-ch"></div><label class="chk"><input type="checkbox" id="gd-dr"> Tanpura drone</label>');
 const paint=()=>{$('#gd-ch').innerHTML=Object.keys(INSTR).map(k=>'<button class="chip'+(G.guide===k?' on':'')+'" data-k="'+k+'">'+INSTR[k]+'</button>').join('');};paint();$('#gd-dr').checked=G.drone;
 $('#gd-ch').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;G.guide=b.dataset.k;paint();$('#sg-guide').innerHTML=ico('music')+'<span>'+INSTR[G.guide]+'</span>';};$('#gd-dr').onchange=e=>G.drone=e.target.checked;$('#sh-x').onclick=closeSheet;};
addEventListener('resize',()=>{if(S.view==='sing'&&G.st!=='run')singDraw(-1.2);});
