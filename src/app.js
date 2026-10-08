(function(){
'use strict';
const $=s=>document.querySelector(s);
const AC=window.AudioContext||window.webkitAudioContext;
const TT=[1,2,3,4,5,6,7,8].map(n=>{const U=TUNES[n];return{n,bpm:U.bpm,total:U.total,notes:U.n.map(x=>({semi:x[0],beat:x[1],dur:x[2],dev:x[3],iast:x[4],line:x[5],sw:x[6]}))};});
const INSTR={sitar:'Sitar',veena:'Veena',bansuri:'Bansuri',violin:'Violin',harmonium:'Harmonium',piano:'Piano',guitar:'Guitar',santoor:'Santoor',sarangi:'Sarangi',nadaswaram:'Nadaswaram',harp:'Harp',cello:'Cello'};
const AUD={buf:{},ready:false};
const TA=r=>TATTVAS[((r&&r.style?r.style.Tattva:r&&r.Tattva)||1)-1]||TATTVAS[0];
const TNAMES=TATTVAS.map(t=>t.name);
const PADA_AT=[1,2,3,4].map(l=>TT[0].notes.find(n=>n.line===l).beat/TT[0].total);
const TONES={'Tabla':1,'Mridangam':1,'Rock':1,'Lo-fi':1,'None':1};
const LEG_T={Classical:'Tabla',Folk:'Mridangam'};
const LEG_I={'Sitar':'sitar','Veena':'veena','Flute':'bansuri','Harmonium':'harmonium','Soft piano':'piano','Strings':'violin','Harp':'harp','Guitar':'guitar','Bells':'santoor','Handpan':'santoor','Ambient pad':'cello','Tabla':'sitar'};
const VOC={Soft:1,Deep:.5,Choir:1,Chant:1,Bright:2,Whisper:2};
const SYL=['dhum','ta','ka','dhi','na','tsh','pa','ra'];
const FD='"Rozha One",Georgia,serif';
const SCALE=Math.min(window.innerWidth,window.innerHeight)<700?.6:1;
const VISUALS=['Tattva film'].concat(ENGINES,['Beatbox text']);
const HOLD={on:false};
const DEF=()=>({Tattva:1,Tone:'Tabla',Visuals:'Tattva film',Sound:['sitar'],Recitation:'None'});
const DEMOS=[];

const IC={
 lotus:'<path d="M12 20c-2.4-1.9-3.8-4.7-3.8-7.8 0-2.8 1.4-5.6 3.8-7.7 2.4 2.1 3.8 4.9 3.8 7.7 0 3.1-1.4 5.9-3.8 7.8Z"/><path d="M12 20c-4.6 0-8.4-2.6-9.6-6.6 2.6-.4 5 .3 6.8 1.9"/><path d="M12 20c4.6 0 8.4-2.6 9.6-6.6-2.6-.4-5 .3-6.8 1.9"/>',
 remix:'<path d="M4 8h12l-3-3"/><path d="M20 16H8l3 3"/><path d="M4 8v3M20 16v-3"/>',
 share:'<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7Z"/>',
 son:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 9a4 4 0 0 1 0 6"/><path d="M19 6.5a8 8 0 0 1 0 11"/>',
 soff:'<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 5 6M22 9l-5 6"/>',
 home:'<path d="M3 11 12 4l9 7v9h-6v-6H9v6H3Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 20h8"/>',
 music:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
 mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 drum:'<ellipse cx="12" cy="8" rx="8" ry="3"/><path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8"/><path d="m8 3 3 5M16 3l-3 5"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M8 7h7M8 11h7"/>',
 upload:'<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 right:'<path d="m9 6 6 6-6 6"/>',
 check:'<path d="M5 12l5 5L20 7"/>',
 lock:'<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 replay:'<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
 out:'<path d="M10 4H5v16h5"/><path d="m15 8 4 4-4 4M19 12H9"/>',
 diya:'<path d="M3.5 14.5c1.9 3.3 4.8 5 8.5 5s6.6-1.7 8.5-5Z"/><path class="flame" d="M12 13c-1.9-1.5-2.1-3.8-.6-6 .4 1.2 1 1.7 1.7 1.9.2-2.1.9-3.8 2.1-5 .8 3.6.4 7-3.2 9.1Z"/>',
 conch:'<path d="M5 13.5c0-4.6 3.4-8.5 8-8.5 3.4 0 6 2.4 6 5.4 0 3.8-3 6.6-7 6.6l-2.6 3.6-1.6-3.2C6 16.6 5 15.2 5 13.5Z"/><path d="M11 9.2c1.6-.6 3.4.2 3.8 1.8"/>',
 chakra:'<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.4v6.4M12 14.2v6.4M3.4 12h6.4M14.2 12h6.4M5.9 5.9l4.5 4.5M13.6 13.6l4.5 4.5M5.9 18.1l4.5-4.5M13.6 10.4l4.5-4.5"/>',
 bell:'<path d="M12 3v1.6M7 17V11a5 5 0 0 1 10 0v6l1.6 1.6H5.4Z"/><path d="M10.4 21h3.2"/>',
 globe:'<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.3 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.3-3.6-8.6S9.6 5.8 12 3.4Z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
};
const ico=(k,cls)=>'<svg class="i'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const S={sound:false,user:null,emailOn:true,reels:[],loaded:false,offline:false,style:DEF(),t:0,source:null,score:null,takeBuf:null,takeBlob:null,takeOffset:0,view:'feed',idx:-1,feedIds:''};
const TAKES={};
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
// the account comes from the server (/api/me); a cached copy only paints the first frame
LS.del('tr-user');S.user=LS.get('tr-me',null);if(S.user&&!/^[a-z0-9_.]{3,20}$/.test(S.user.handle||''))S.user=null;S.scores=[];
function localReels(){const mine=new Set(LS.get('tr-learnt',[]));return LS.get('tr-reels',[]).map(cleanReel).filter(Boolean).map(r=>Object.assign(r,{mine:mine.has(r.id),own:true,learnt:mine.has(r.id)?1:0}));}

let cur=null;
const EL={bufs:{},busy:false,off:false,ps:{}};
function elBuf(n){return EL.bufs[n||1]||null;}
function elFetch(n){n=n||1;if(EL.bufs[n])return Promise.resolve(EL.bufs[n]);if(EL.off)return Promise.reject(501);if(EL.ps[n])return EL.ps[n];
 EL.ps[n]=fetch('/api/tts?v='+n).then(async r=>{if(!r.ok){if(r.status===501)EL.off=true;throw r.status;}const ab=await r.arrayBuffer(),ac=new AC();const b=await ac.decodeAudioData(ab);closeAC(ac);EL.bufs[n]=b;return b;}).finally(()=>{EL.ps[n]=null;});return EL.ps[n];}
const API=(p,o)=>fetch(p,Object.assign({credentials:'same-origin',headers:{'Content-Type':'application/json'}},o||{})).then(async r=>{let j={};try{j=await r.json();}catch(e){}if(!r.ok){const e=new Error(j.error||'Something went wrong. Try again.');e.status=r.status;throw e;}return j;});

/* ---------- helpers ---------- */
function closeAC(a){try{if(a&&a.state!=='closed'){const p=a.close();if(p&&p.catch)p.catch(()=>{});}}catch(e){}}
function toast(m){const e=$('#toast');e.textContent=m;e.hidden=false;e.style.animation='none';void e.offsetWidth;e.style.animation='';clearTimeout(toast.h);toast.h=setTimeout(()=>e.hidden=true,2800);}
function canvasH(c){const w=c.clientWidth,h=c.clientHeight;return w&&h?Math.max(560,Math.min(900,Math.round(360*h/w))):560;}
function ctx2(c){const H=canvasH(c);if(!c.__g||c.__h!==H){c.__g=setup(c,360,H);c.__h=H;}return c.__g;}
function setup(c,w,h){const d=Math.min(2,window.devicePixelRatio||1);w=w||360;h=h||560;c.width=Math.round(w*d);c.height=Math.round(h*d);const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);return g;}
function handle(u){return u&&u.handle?u.handle:'you';}
function fmt(n){return n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':String(n);}
function norm(s){const d=DEF();s=s&&typeof s==='object'?s:{};const tone=LEG_T[s.Tone]||s.Tone;
 let snd=Array.isArray(s.Sound)?s.Sound.map(x=>INSTR[x]?x:LEG_I[x]).filter(Boolean):null;if(snd)snd=[...new Set(snd)].slice(0,12);
 return{Tattva:Number.isInteger(s.Tattva)&&s.Tattva>=1&&s.Tattva<=8?s.Tattva:1,Tone:TONES[tone]?tone:d.Tone,Visuals:VISUALS.includes(s.Visuals)?s.Visuals:d.Visuals,Sound:snd||d.Sound,Recitation:s.Recitation==='AI voice (demo)'?'AI voice':['None','My recording','AI voice'].includes(s.Recitation)?s.Recitation:'None'};}
function cleanReel(r){if(!r||typeof r!=='object'||typeof r.id!=='string'||!/^[\w-]{1,40}$/.test(r.id))return null;
 return{id:r.id,t:0,name:String(r.name||'seeker').slice(0,24),caption:String(r.caption||'').slice(0,140),style:norm(r.style),score:typeof r.score==='number'?Math.max(0,Math.min(100,Math.round(r.score))):null,createdAt:typeof r.createdAt==='number'?r.createdAt:0,learnt:Math.max(0,+r.learnt||0),mine:!!r.mine,own:!!r.own,hasTake:!!r.hasTake,takeOffset:Math.max(0,+r.takeOffset||0)};}

/* ---------- timeline ---------- */
function build(i,style){const T=TT[((style&&style.Tattva)||1)-1]||TT[0],beat=60/T.bpm,ev=T.notes.map((n,idx)=>({t:n.beat*beat,dur:n.dur*beat,semi:n.semi,idx}));return{ev,total:T.total*beat+1.5,beat};}
function adv(B,t,dt,A){let k=-1;for(let j=0;j<B.ev.length;j++){if(B.ev[j].t<=t)k=j;else break;}
 A.ons=(k!==A.idx&&k>=0);A.idx=k;
 if(k>=0){const e=B.ev[k];A.semi+=(e.semi-A.semi)*Math.min(1,dt*10);A.env=Math.exp(-(t-e.t)*3);}else A.env=0;
 A.t=t;A.total=B.total;}
const newA=()=>({idx:-1,semi:0,env:0,ons:false,t:0,total:1});
function dBeat(g,t,B,HH){const W=360,H=560;g.fillStyle='#07050F';g.fillRect(0,0,W,HH||H);g.save();g.translate(0,((HH||H)-H)/2);
 let c=-1;for(let k=0;k<B.ev.length;k++)if(B.ev[k].t<=t)c=k;
 g.textAlign='center';g.textBaseline='middle';
 for(let j=4;j>=0;j--){const k2=c-j;if(k2<0)continue;const e=B.ev[k2],age=t-e.t,txt=SYL[k2%SYL.length].toUpperCase();
  const sz=j===0?130*(1+.28*Math.exp(-age*9)):44-j*5;
  g.globalAlpha=j===0?1:Math.max(0,.5-j*.1);g.fillStyle=j===0?(k2%2?'#F6D58E':'#E9B44C'):'#8E8470';g.font=sz+'px '+FD;
  if(j===0){g.shadowColor='rgba(233,180,76,.7)';g.shadowBlur=30;}
  g.fillText(txt,W/2+(j===0?0:(k2%2?-36:36)),j===0?H*.5:H*.5-72-j*50);g.shadowBlur=0;}
 g.globalAlpha=1;g.restore();}
function filmOf(style){const f=FILMS[(style&&style.Tattva)||1];return f&&f.init()?f:null;}
function visKind(style){if(style.Visuals==='Tattva film'){if(filmOf(style))return 'film';return GLR.init()?'Mirror city':'beat';}if(ENG[style.Visuals]&&GLR.init())return style.Visuals;return 'beat';}
function drawStatic(c,style,i){const B=build(i||0,style),g=ctx2(c),HH=c.__h,vk=visKind(style);
 if(vk==='film'){const F=filmOf(style);g.drawImage(F.render(F.poster||.4,4,HH),0,0,360,HH);return;}
 if(vk!=='beat'){const sim=makeSim(vk,SCALE*.6),A=newA(),Tend=B.total*.5,dt=.1;GLR.clear();
  for(let t=0;t<Tend;t+=dt){adv(B,t,dt,A);sim.step(dt,A);if(sim.trail>0&&t>Tend-1.2)GLR.draw(sim.n,sim.trail);}
  GLR.draw(sim.n,sim.trail);g.fillStyle='#07050F';g.fillRect(0,0,360,HH);g.drawImage(GLR.canvas,0,(HH-560)/2,360,560);}
 else dBeat(g,B.total*.5,B,HH);}
const pq=[];let pqBusy=false;
function queuePoster(c,style,i){pq.push([c,style,i]);if(!pqBusy)pump();}
function pump(){const it=pq.shift();if(!it){pqBusy=false;return;}pqBusy=true;if(!(cur&&cur.canvas===it[0])){try{drawStatic(it[0],it[1],it[2]);}catch(e){}}setTimeout(pump,30);}

/* ---------- audio ---------- */
function env(g,t,a,d,pk,rel){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.setTargetAtTime(0,t+d,rel);}
function osc(ac,type,f,t,dur,det){const o=ac.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.start(t);o.stop(t+dur);return o;}
function pluck(ac,out,f,t,d,pk,type){const g=ac.createGain();g.gain.setValueAtTime(pk,t);g.gain.exponentialRampToValueAtTime(0.0005,t+d);osc(ac,type||'triangle',f,t,d+.05).connect(g);g.connect(out);}
function noiseBuf(ac){const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
function hiss(ac,out,t,d,ft,fq,pk,nb){const s=ac.createBufferSource();s.buffer=nb;const f=ac.createBiquadFilter();f.type=ft;f.frequency.value=fq;const g=ac.createGain();g.gain.setValueAtTime(pk,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);s.connect(f);f.connect(g);g.connect(out);s.start(t);s.stop(t+d+.05);}
function kick(ac,out,t,pk){const o=ac.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);const g=ac.createGain();g.gain.setValueAtTime(pk,t);g.gain.exponentialRampToValueAtTime(.0005,t+.25);o.connect(g);g.connect(out);o.start(t);o.stop(t+.3);}
function thump(ac,out,t,f0,f1,d,pk){const o=ac.createOscillator();o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d*.7);const g=ac.createGain();g.gain.setValueAtTime(pk,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.05);}
function voiceNote(ac,out,f,t,d,kind,nb,gv){
 const g=ac.createGain();env(g,t,.05,d*.85,.3*gv,.07);const sd=d+.6;
 if(kind==='Choir'){const m=ac.createGain();m.gain.value=.5;[-14,0,14].forEach(c=>osc(ac,'sawtooth',f,t,sd,c).connect(m));
  [[650,.9],[1100,.6]].forEach(F=>{const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=F[0];b.Q.value=5;const gg=ac.createGain();gg.gain.value=F[1];m.connect(b);b.connect(gg);gg.connect(g);});}
 else if(kind==='Whisper'){const s=ac.createBufferSource();s.buffer=nb;s.loop=true;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=14;const bg=ac.createGain();bg.gain.value=4;s.connect(bp);bp.connect(bg);bg.connect(g);s.start(t);s.stop(t+sd);}
 else{const o=osc(ac,{Deep:'sawtooth',Soft:'triangle',Chant:'square',Bright:'sawtooth'}[kind],f,t,sd),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value={Deep:650,Soft:2400,Chant:1700,Bright:3800}[kind];o.connect(lp);lp.connect(g);
  const l=osc(ac,'sine',5.2,t,sd),lg=ac.createGain();lg.gain.value={Deep:5,Soft:10,Chant:4,Bright:14}[kind];l.connect(lg);lg.connect(o.detune);}
 g.connect(out);}
const bars=B=>Math.ceil(B.total/(B.beat*4));
const RT=[0,3,5,0];
function pad(ac,o,f,tb,B,att,pk,cut,shifts){const pg=ac.createGain();env(pg,tb,att,B.beat*3.2,pk,.6);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;shifts.forEach(s=>[-9,9].forEach(c=>osc(ac,'sawtooth',f*Math.pow(2,s/12),tb,B.beat*4+2,c).connect(lp)));lp.connect(pg);pg.connect(o);}
const INST={
 'Sitar':(ac,o,base,t0,B)=>{const n=Math.floor(B.total/B.beat/2);for(let k=0;k<n;k++){const t=t0+k*B.beat*2,f=base*2*Math.pow(2,[0,7,12,10][k%4]/12),g=ac.createGain();g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.0005,t+1.3);const bp=ac.createBiquadFilter();bp.type='bandpass';bp.Q.value=4;bp.frequency.setValueAtTime(f*5,t);bp.frequency.exponentialRampToValueAtTime(f*1.5,t+1);const s=ac.createOscillator();s.type='sawtooth';s.frequency.setValueAtTime(f*1.04,t);s.frequency.exponentialRampToValueAtTime(f,t+.09);s.connect(bp);bp.connect(g);g.connect(o);s.start(t);s.stop(t+1.4);}},
 'Veena':(ac,o,base,t0,B)=>{const n=Math.floor(B.total/(B.beat/2));for(let k=0;k<n;k++){const t=t0+k*B.beat/2,f=base*2*Math.pow(2,[0,3,7,12,7,3][k%6]/12);pluck(ac,o,f,t,1,.07,'triangle');pluck(ac,o,f,t,.5,.03,'sawtooth');}},
 'Flute':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++){const tb=t0+b*B.beat*4,g=ac.createGain();env(g,tb,.4,B.beat*3.5,.08,.3);const f=osc(ac,'sine',base*2*Math.pow(2,RT[b%4]/12),tb,B.beat*4+1),l=osc(ac,'sine',5,tb,B.beat*4+1),lg=ac.createGain();lg.gain.value=9;l.connect(lg);lg.connect(f.detune);f.connect(g);g.connect(o);}},
 'Tabla':(ac,o,base,t0,B,nb)=>{const n=Math.floor(B.total/B.beat);for(let b=0;b<n;b++){const t=t0+b*B.beat,bar=b%4;if(bar===0||bar===3)thump(ac,o,t,110,65,.32,.35);if(bar===1){thump(ac,o,t,520,500,.12,.18);hiss(ac,o,t,.03,'highpass',3000,.1,nb);}if(bar===2){thump(ac,o,t,440,420,.2,.16);thump(ac,o,t+B.beat/2,520,500,.1,.12);}}},
 'Harmonium':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++){const tb=t0+b*B.beat*4,g=ac.createGain();env(g,tb,.1,B.beat*3.7,.07,.25);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;[0,7].forEach(s=>[-6,6].forEach(c=>osc(ac,'sawtooth',base*Math.pow(2,(RT[b%4]+s)/12),tb,B.beat*4+1,c).connect(lp)));lp.connect(g);g.connect(o);}},
 'Bells':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++){[0,2].forEach(bt=>{const t=t0+(b*4+bt)*B.beat,f=base*4*Math.pow(2,[0,7,12,3][b%4]/12),c=osc(ac,'sine',f,t,2.8),m=osc(ac,'sine',f*3.5,t,2.8),mg=ac.createGain();mg.gain.setValueAtTime(f*1.4,t);mg.gain.exponentialRampToValueAtTime(1,t+1.5);m.connect(mg);mg.connect(c.frequency);const g=ac.createGain();g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.0005,t+2.6);c.connect(g);g.connect(o);});}},
 'Soft piano':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++){const tb=t0+b*B.beat*4,r=RT[b%4];for(let k=0;k<4;k++)pluck(ac,o,base*2*Math.pow(2,(r+[0,7,12,7][k])/12),tb+k*B.beat,1.4,.08,'triangle');}},
 'Strings':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++)pad(ac,o,base*2*Math.pow(2,RT[b%4]/12),t0+b*B.beat*4,B,.8,.04,1400,[0,3]);},
 'Ambient pad':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++)pad(ac,o,base*Math.pow(2,RT[b%4]/12),t0+b*B.beat*4,B,1,.05,520,[0,7]);},
 'Harp':(ac,o,base,t0,B)=>{for(let b=0;b<bars(B);b++){const tb=t0+b*B.beat*4;[0,3,5,7,8,10,12,15].forEach((s,k)=>pluck(ac,o,base*2*Math.pow(2,s/12),tb+k*.07,1.6,.06,'sine'));}},
 'Guitar':(ac,o,base,t0,B)=>{const n=Math.floor(B.total/B.beat/2);for(let k=0;k<n;k++){const t=t0+k*B.beat*2,r=RT[Math.floor(k/2)%4];[0,7,12,15].forEach((s,j)=>pluck(ac,o,base*2*Math.pow(2,(r+s)/12),t+j*.025,.9,.06,'triangle'));}},
 'Handpan':(ac,o,base,t0,B)=>{const n=Math.floor(B.total/(B.beat/2)),P=[0,3,7,5,10,7,12,3];for(let k=0;k<n;k++){if(k%3===2)continue;const t=t0+k*B.beat/2,f=base*2*Math.pow(2,P[k%8]/12);pluck(ac,o,f,t,1.6,.07,'sine');pluck(ac,o,f*2,t,1,.03,'sine');}}
};
const INSTS=Object.keys(INST);
function rhythm(ac,out,base,t0,B,tone,nb){if(tone!=='Rock'&&tone!=='Lo-fi')return;const beats=Math.floor(B.total/B.beat);
 for(let b=0;b<beats;b++){const t=t0+b*B.beat,bar=b%4;
  if(tone==='Rock'){if(bar===0||bar===2)kick(ac,out,t,.5);if(bar===1||bar===3)hiss(ac,out,t,.14,'highpass',1500,.25,nb);hiss(ac,out,t,.04,'highpass',7000,.08,nb);hiss(ac,out,t+B.beat/2,.04,'highpass',7000,.06,nb);}
  else if(tone==='Classical'){pluck(ac,out,base*Math.pow(2,[-5,0,0,-12][bar]/12),t,2,.1,'triangle');if(bar===0)hiss(ac,out,t,.05,'bandpass',900,.1,nb);}
  else if(tone==='Lo-fi'){if(bar===0||bar===2)kick(ac,out,t,.3);if(bar===1||bar===3)hiss(ac,out,t,.12,'lowpass',2200,.18,nb);hiss(ac,out,t+B.beat/2,.03,'highpass',8000,.05,nb);}
  else[0,7,12].forEach((s,k)=>pluck(ac,out,base*2*Math.pow(2,s/12),t+k*.02,.7,bar===0?.08:.05,'triangle'));}}

/* ---------- player ---------- */
function stopCur(){if(cur)cur.stop();}
function play(canvas,i,style,o){
 stopCur();o=o||{};const B=build(i,style),take=o.take||null,vn=style.Tattva||1,elB=elBuf(vn);if(take)B.total=Math.max(B.total,take.duration+1.4);const elOn=style.Recitation==='AI voice'&&elB;if(elOn)B.total=Math.max(B.total,elB.duration+2);AUD.need(vn);
 let ac=null,master=null,t0=0,speaking=false;const p0=performance.now();
 if(o.sound&&AC&&AUD.has(vn)){try{
  ac=new AC();if(ac.resume)ac.resume();master=ac.createGain();master.gain.value=.85;const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);t0=ac.currentTime+.12;
  const layer=(id,gain,off)=>{const b=AUD.buf[id];if(!b)return;const s=ac.createBufferSource(),gg=ac.createGain();gg.gain.value=gain;s.buffer=b;s.connect(gg);gg.connect(master);s.start(t0+(off||0));};
  layer('drone_tanpura',.4);
  const ins=style.Sound,gi=((take||elOn)?.42:.72)/Math.sqrt(Math.max(1,ins.length));ins.forEach(id=>layer(vn+'/'+id,gi));
  if(style.Tone==='Tabla')layer('rhythm_tabla',.45);else if(style.Tone==='Mridangam')layer('rhythm_mridangam',.45);else rhythm(ac,master,164.81,t0,B,style.Tone,noiseBuf(ac));
  if(take){const src=ac.createBufferSource(),tg=ac.createGain();tg.gain.value=1.15;src.buffer=take;src.connect(tg);tg.connect(master);src.start(t0,Math.max(0,o.takeOffset||0));}
  if(elOn){const es=ac.createBufferSource(),eg=ac.createGain();eg.gain.value=1.1;es.buffer=elB;es.connect(eg);eg.connect(master);es.start(t0+.6);}
  if(style.Recitation==='AI voice'&&!elOn&&window.speechSynthesis){try{const u=new SpeechSynthesisUtterance(TA(style).dev.join(' '));u.lang='hi-IN';u.rate=.6;speechSynthesis.cancel();speechSynthesis.speak(u);speaking=true;}catch(e){}}
 }catch(e){ac=null;}}
 const g=ctx2(canvas),HH=canvas.__h;
 const vk=visKind(style),film=vk==='film',F=film?filmOf(style):null;let sim=null,boost=0;if(!film&&vk!=='beat'){sim=makeSim(vk,SCALE);GLR.clear();}
 const A=newA();let raf=0,done=false,last=performance.now();
 const clock=()=>ac?ac.currentTime-t0:(performance.now()-p0)/1000-.08;
 const h={canvas,hasAudio:!!ac,vn,
  stop(){end(false);},
  setMuted(m){if(master)master.gain.setTargetAtTime(m?0:.85,ac.currentTime,.04);if(m&&speaking){try{speechSynthesis.cancel();}catch(e){}speaking=false;}}};
 function end(fin){if(done)return;done=true;cancelAnimationFrame(raf);if(ac){closeAC(ac);}if(speaking){try{speechSynthesis.cancel();}catch(e){}}if(cur===h)cur=null;if(fin&&o.onEnd)o.onEnd();}
 function frame(){const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;let t=clock();if(t>=B.total){end(true);return;}t=Math.max(0,t);adv(B,t,dt,A);
  const p=t/B.total;let pf=p;
  if(film){const hr=F.hold||[.26,.82];if(HOLD.on&&o.hold&&p+boost>hr[0]&&p+boost<hr[1])boost+=dt*2.2/B.total;pf=Math.min(1,p+boost);g.drawImage(F.render(pf,t,HH),0,0,360,HH);F.overlay(g,pf,B.total,HH);}
  else if(sim){sim.step(dt,A);GLR.draw(sim.n,sim.trail);g.fillStyle='#07050F';g.fillRect(0,0,360,HH);g.drawImage(GLR.canvas,0,(HH-560)/2,360,560);}else dBeat(g,t,B,HH);
  if(o.onTick)o.onTick(p,pf,film);raf=requestAnimationFrame(frame);}
 cur=h;frame();return h;}

/* ---------- data ---------- */
function allReels(){return S.reels.slice();}
function counts(){const c={};S.reels.forEach(r=>c[r.id]=r.learnt||0);return c;}
function isLearnt(id){const r=S.reels.find(x=>x.id===id);return !!(r&&r.mine);}
function setLearnt(r,val){const x=S.reels.find(y=>y.id===r.id);if(!x||x.mine===val){refreshCounts();return;}
 if(S.local){x.mine=val;x.learnt=val?1:0;const s=new Set(LS.get('tr-learnt',[]));val?s.add(r.id):s.delete(r.id);LS.set('tr-learnt',[...s]);refreshCounts();return;}
 const before=x.learnt;x.mine=val;x.learnt=Math.max(0,before+(val?1:-1));refreshCounts();const seq=x._seq=(x._seq||0)+1;
 API('/api/learn',{method:'POST',body:JSON.stringify({id:x.id,val})}).then(j=>{if(x._seq!==seq)return;x.learnt=j.count;refreshCounts();if(S.view==='top')renderTop();})
  .catch(e=>{if(x._seq!==seq)return;x.mine=!val;x.learnt=before;refreshCounts();toast(e.status===404?'That reel is gone':'Couldn’t save that. Try again.');});}
let firstLoad=true;
async function loadReels(){S.offline=false;
 try{const j=await API('/api/reels');S.local=false;S.reels=(j.reels||[]).map(cleanReel).filter(Boolean);}
 catch(e){if(e.status===501||!e.status){S.local=true;S.reels=localReels();}else{S.local=false;S.offline=true;S.reels=[];}}
 S.loaded=true;renderFeed();if(S.view==='top')renderTop();
 if(firstLoad){firstLoad=false;const h=location.hash.match(/^#r-([\w-]{1,40})$/);if(h){const ix=reelList.findIndex(r=>r.id===h[1]);if(ix>0){reelsEl.scrollTop=ix*reelsEl.clientHeight;requestAnimationFrame(()=>activate(ix,true));}}}}

/* ---------- feed ---------- */
const reelsEl=$('#reels');let reelList=[];
function reelEl(r,ix){
 const el=document.createElement('article');el.className='reel';el.dataset.id=r.id;el.id='r-'+r.id;
 const s=r.style,mus=s.Sound.map(x=>LX(INSTR[x])).concat([LX(s.Tone==='None'?'no rhythm':s.Tone)]).join(' · ');
 el.innerHTML='<canvas></canvas><div class="shade"></div>'+
  '<div class="rail"><button class="rbtn" data-a="learn" aria-label="'+esc(LX('I learnt this'))+'">'+ico('diya')+'<span class="ct">0</span></button>'+
  '<button class="rbtn" data-a="read" aria-label="'+esc(LX('Meaning'))+'">'+ico('book')+'<span>'+esc(LX('Meaning'))+'</span></button>'+
  '<button class="rbtn" data-a="remix" aria-label="'+esc(LX('Remix'))+'">'+ico('remix')+'<span>'+esc(LX('Remix'))+'</span></button>'+
  '<button class="rbtn" data-a="share" aria-label="'+esc(LX('Share'))+'">'+ico('conch')+'<span>'+esc(LX('Share'))+'</span></button></div>'+
  '<div class="cap"><div class="crow"><span class="tmed">'+tsym(TA(r).n)+'</span><div class="ctt"><span class="tno">'+esc(LX('Tattva'))+' '+TA(r).n+'</span><span class="rtitle">'+esc(TL(TA(r).n).name)+'</span></div>'+
  '<div class="who" data-notr><span class="ava"></span><span class="nm"></span></div></div>'+
  (r.caption?'<div class="rcap" data-notr></div>':'')+
  '<div class="pada"><span class="dev"></span><span class="mean"></span></div>'+
  '<div class="music">'+ico('music')+'<div class="mq"><span></span></div></div></div>'+
  '<div class="prog"><i></i></div><div class="holdhint glass" hidden><span class="ring"></span><span>Hold to awaken</span></div><div class="holdglow" hidden></div>';
 el.querySelector('.ava').textContent=(r.name[0]||'t').toUpperCase();
 const nm=el.querySelector('.nm');nm.textContent=r.name;if(r.score!=null){const p=document.createElement('span');p.className='pill';p.textContent='Tune '+r.score+'%';nm.after(p);}
 if(r.caption)el.querySelector('.rcap').textContent=r.caption;
 el.querySelector('.mq span').textContent=mus+'   ·   '+mus+'   ·   ';
 el.__r=r;el.__ix=ix;
 setPada(el,0,true);
 el.addEventListener('click',e=>{if(el.__held){el.__held=false;return;}onReelTap(e,el);});
 let ht=0,sx=0,sy=0;const hg=el.querySelector('.holdglow');
 const endHold=()=>{clearTimeout(ht);if(HOLD.on){HOLD.on=false;hg.hidden=true;}};
 el.addEventListener('pointerdown',e=>{if(e.target.closest('.rail,.endcard,button'))return;sx=e.clientX;sy=e.clientY;clearTimeout(ht);
  ht=setTimeout(()=>{if(el.__r.style.Visuals!=='Tattva film')return;el.__held=true;HOLD.on=true;const rc=el.getBoundingClientRect();hg.style.left=(sx-rc.left)+'px';hg.style.top=(sy-rc.top)+'px';hg.hidden=false;},300);});
 el.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>12)endHold();});
 ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,endHold));
 el.addEventListener('contextmenu',e=>{if(el.__r.style.Visuals==='Tattva film')e.preventDefault();});
 return el;}
function setPada(el,k,now){const p=el.querySelector('.pada');if(el.__pada===k)return;el.__pada=k;
 const put=()=>{const V=TL(TA(el.__r).n),d=p.querySelector('.dev');d.textContent=V.verse[k];d.classList.toggle('roman',V.roman);p.querySelector('.mean').textContent=V.en[k];p.classList.remove('swap');};
 if(now){put();return;}p.classList.add('swap');setTimeout(put,300);}
const posterIO=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){posterIO.unobserve(e.target);const el=e.target;queuePoster(el.querySelector('canvas'),el.__r.style,0);}}),{root:reelsEl,rootMargin:'100% 0px'}):null;
function renderFeed(force){
 const list=allReels(),ids=list.map(r=>r.id).join(',');
 const es=S.loaded?(S.offline?2:1):0;if(!force&&ids===S.feedIds&&(list.length||S.feedES===es)){refreshCounts();return;}
 S.feedES=es;
 const keepId=reelList[S.idx]&&reelList[S.idx].id;
 S.feedIds=ids;reelList=list;stopCur();reelsEl.innerHTML='';S.idx=-1;
 if(!list.length){reelsEl.appendChild(emptyEl());return;}
 list.forEach((r,ix)=>{const el=reelEl(r,ix);reelsEl.appendChild(el);if(posterIO)posterIO.observe(el);else queuePoster(el.querySelector('canvas'),r.style,0);});
 refreshCounts();
 if(keepId&&!force){const ix=list.findIndex(r=>r.id===keepId);if(ix>0)reelsEl.scrollTop=ix*reelsEl.clientHeight;}
 if(S.view==='feed')requestAnimationFrame(()=>activate(currentIx(),true));}
function emptyEl(){const el=document.createElement('div');el.className='reel emptyreel';
 const st=!S.loaded?['Loading reels…','']:S.offline?['Couldn’t load reels','Check your connection, then try again.']:['No reels yet','Sing the first verse or make a reel. Your reels show up here.'];
 el.innerHTML='<canvas></canvas><div class="shade"></div><div class="emptybox"><p class="eyebrow">Dakṣiṇāmūrti Aṣṭakam · 8 tattvas</p><h2 class="sh-title"></h2><p class="note"></p>'+(S.loaded?'<div class="row2">'+(S.offline?'<button class="btn gold" id="em-retry">Try again</button>':'<button class="btn gold" id="em-create">'+ico('plus')+'Make a reel</button><button class="btn line" id="em-sing">'+ico('mic')+'Sing the verse</button>')+'</div>':'')+'</div>';
 el.querySelector('.sh-title').textContent=st[0];el.querySelector('.note').textContent=st[1];
 const b1=el.querySelector('#em-create'),b2=el.querySelector('#em-sing'),b3=el.querySelector('#em-retry');if(b1)b1.onclick=()=>openCreate();if(b2)b2.onclick=()=>openSing();if(b3)b3.onclick=()=>{S.loaded=false;renderFeed(true);loadReels();};
 queuePoster(el.querySelector('canvas'),DEF(),0);return el;}
function currentIx(){const h=reelsEl.clientHeight||1;return Math.max(0,Math.min(reelList.length-1,Math.round(reelsEl.scrollTop/h)));}
function reelNode(ix){return reelsEl.children[ix]||null;}
function activate(ix,force){
 if(S.view!=='feed')return;if(!force&&ix===S.idx&&cur)return;
 const prev=reelNode(S.idx);if(prev&&prev.__r){const ec=prev.querySelector('.endcard');if(ec)ec.remove();prev.querySelector('.prog i').style.width='0';}
 S.idx=ix;const el=reelNode(ix);if(!el||!el.__r)return;startReel(el);}
function startReel(el){const r=el.__r,bar=el.querySelector('.prog i');paintSide(r);const ec=el.querySelector('.endcard');if(ec)ec.remove();
 const hh=el.querySelector('.holdhint');
 const rec=r.style.Recitation,tk=rec==='My recording'?TAKES[r.id]:null;
 if(rec==='My recording'&&r.hasTake&&!TAKES[r.id]&&!TAKES['_'+r.id]){TAKES['_'+r.id]=1;(S.local?Promise.resolve(LS.get('tr-take-'+r.id,null)).then(t=>{if(!t)throw 0;const bin=atob(t.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;}):fetch('/api/take?id='+encodeURIComponent(r.id)).then(x=>{if(!x.ok)throw 0;return x.arrayBuffer();})).then(ab=>{const ac=new AC();return ac.decodeAudioData(ab).finally(()=>closeAC(ac));}).then(b=>{TAKES[r.id]=b;if(reelNode(S.idx)===el&&S.sound&&!el.querySelector('.endcard'))startReel(el);}).catch(()=>{});}
 if(rec==='AI voice'&&!elBuf(r.style.Tattva)&&!EL.off)elFetch(r.style.Tattva).then(()=>{if(reelNode(S.idx)===el&&S.sound&&!el.querySelector('.endcard'))startReel(el);}).catch(()=>{});
 play(el.querySelector('canvas'),0,r.style,{sound:S.sound,hold:true,take:tk,takeOffset:r.takeOffset||0,onTick:(p,pf,film)=>{bar.style.width=(p*100).toFixed(2)+'%';let k=0;for(let j=0;j<4;j++)if(pf>=PADA_AT[j])k=j;setPada(el,k);sideLine(k);
  if(hh){const hr=(FILMS[r.style.Tattva]||{}).hold||[.26,.82],show=film&&pf>hr[0]+.01&&pf<hr[1]-.2;if(hh.hidden===show)hh.hidden=!show;hh.classList.toggle('on',HOLD.on);hh.lastChild.textContent=HOLD.on?'Awakening…':'Hold to awaken';}},onEnd:()=>showEnd(el)});}
/* laptop layout: a panel beside the reel with the shloka (current line lit), its meaning and the learnt button */
const WIDE=window.matchMedia('(min-width: 900px)');let sideR=null,sideK=-1;
function paintSide(r){sideR=r;sideK=-1;if(!WIDE.matches)return;const box=$('#rside'),n=TA(r).n,V=TL(n);
 box.innerHTML='<div class="lhead"><span class="tmed">'+tsym(n)+'</span><div><p class="tno">'+esc(LX('Tattva'))+' '+n+'</p><h2 class="rs-name">'+esc(V.name)+'</h2></div></div><p class="rs-teach">'+esc(V.teach)+'</p>'+
  '<div class="rs-learn"><span class="bignum" id="rs-n">0</span><span class="lab">'+esc(LX('people learnt from this reel'))+'</span><button class="btn" id="rs-btn"></button></div>'+
  '<div class="rs-sh"><p class="lab">'+esc(LX('The shloka'))+'</p>'+V.verse.map((d,k)=>'<div class="ln" data-k="'+k+'"><span class="dev'+(V.roman?' roman':'')+'">'+esc(d)+'</span><span class="en">'+esc(V.en[k])+'</span></div>').join('')+'</div>'+
  '<div><p class="lab">'+esc(LX('Keep these three'))+'</p><ul class="keep">'+V.keep.map(k=>'<li>'+tsym(n,'tsy ksym')+'<span>'+esc(k)+'</span></li>').join('')+'</ul></div>'+
  '<div class="row2"><button class="btn line" id="rs-sing">'+ico('mic')+esc(LX('Sing this verse'))+'</button><button class="btn line" id="rs-share">'+ico('conch')+esc(LX('Share'))+'</button></div>'+
  '<p class="note rs-by" data-notr>'+(r.caption?'“'+esc(r.caption)+'” · ':'')+esc(r.name)+'</p>';
 $('#rs-btn').onclick=()=>{const v=!isLearnt(r.id);setLearnt(r,v);};$('#rs-sing').onclick=()=>{S.style=norm(Object.assign({},S.style,{Tattva:n}));openSing();};$('#rs-share').onclick=()=>openShare(r);
 paintSideCount();}
function paintSideCount(){if(!sideR||!WIDE.matches)return;const b=$('#rs-btn');if(!b)return;const n=counts()[sideR.id]||0,m=isLearnt(sideR.id);$('#rs-n').textContent=fmt(n);b.className='btn '+(m?'done':'gold');b.innerHTML=ico(m?'check':'diya')+esc(LX(m?'You learnt this':'I learnt this'));}
function sideLine(k){if(k===sideK||!WIDE.matches)return;sideK=k;$('#rside').querySelectorAll('.ln').forEach(el=>el.classList.toggle('on',+el.dataset.k===k));}
WIDE.addEventListener&&WIDE.addEventListener('change',()=>{if(sideR)paintSide(sideR);});
let scrollT=0;
reelsEl.addEventListener('scroll',()=>{clearTimeout(scrollT);scrollT=setTimeout(()=>activate(currentIx()),110);},{passive:true});
let lastTap=0,tapT=0;
function onReelTap(e,el){
 const a=e.target.closest('[data-a]');if(a){e.stopPropagation();railAction(a.dataset.a,el,a);return;}
 if(e.target.closest('.endcard'))return;
 const now=Date.now();
 if(now-lastTap<300){clearTimeout(tapT);lastTap=0;const rc=el.getBoundingClientRect();burst(el,e.clientX-rc.left,e.clientY-rc.top);setLearnt(el.__r,true);popLearn(el);return;}
 lastTap=now;tapT=setTimeout(()=>{toggleSound();flash(el);},280);}
function railAction(a,el,btn){const r=el.__r;
 if(a==='learn'){const v=!isLearnt(r.id);setLearnt(r,v);if(v){popLearn(el);const rc=el.getBoundingClientRect(),bc=btn.getBoundingClientRect();burst(el,bc.left-rc.left+bc.width/2,bc.top-rc.top+14);}}
 else if(a==='read')openLearn(r);
 else if(a==='remix')openCreate(Object.assign({},r.style,{Sound:r.style.Sound.slice()}));
 else if(a==='share')openShare(r);}
function popLearn(el){const b=el.querySelector('[data-a="learn"]');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
function burst(el,x,y){const d=document.createElement('div');d.className='burst';d.style.left=x+'px';d.style.top=y+'px';
 d.innerHTML='<svg class="i" viewBox="0 0 24 24">'+IC.lotus+'</svg>'+[0,45,90,135,180,225,270,315].map(a=>'<i style="--a:'+a+'deg"></i>').join('');
 el.appendChild(d);setTimeout(()=>d.remove(),1000);}
function flash(el){const f=document.createElement('div');f.className='flash';f.innerHTML=ico(S.sound?'son':'soff');el.appendChild(f);setTimeout(()=>f.remove(),800);}
function showEnd(el){
 const r=el.__r;if(el.querySelector('.endcard'))return;el.querySelector('.prog i').style.width='100%';
 const ec=document.createElement('div');ec.className='endcard';
 ec.innerHTML='<div class="ecard"><p class="eyebrow">What I learnt</p><p class="teach"></p><p class="count ec-count"></p>'+
  '<button class="btn ec-learn"></button><div class="row2"><button class="btn line ec-replay">'+ico('replay')+'Replay</button><button class="btn line ec-read">'+ico('book')+'Read the shloka</button></div></div>';
 ec.querySelector('.teach').textContent=TA(r).teach;
 ec.querySelector('.ec-learn').onclick=e=>{e.stopPropagation();const v=!isLearnt(r.id);setLearnt(r,v);if(v){popLearn(el);const rc=el.getBoundingClientRect(),bc=e.currentTarget.getBoundingClientRect();burst(el,bc.left-rc.left+bc.width/2,bc.top-rc.top);}};
 ec.querySelector('.ec-replay').onclick=e=>{e.stopPropagation();startReel(el);};
 ec.querySelector('.ec-read').onclick=e=>{e.stopPropagation();openLearn(r);};
 el.appendChild(ec);refreshCounts();}
function learnLine(n,mine){if(mine)return n<=1?'You learnt this. You’re the first.':'You and <b>'+fmt(n-1)+'</b> other'+(n-1===1?'':'s')+' learnt this.';
 return n===0?'Tap “I learnt this” when it clicks.':'<b>'+fmt(n)+'</b> '+(n===1?'person':'people')+' learnt from this reel.';}
function refreshCounts(){const c=counts();
 reelsEl.querySelectorAll('.reel').forEach(el=>{if(!el.__r)return;const id=el.__r.id,n=c[id]||0,m=isLearnt(id),b=el.querySelector('[data-a="learn"]');
  b.classList.toggle('on',m);b.setAttribute('aria-pressed',String(m));b.querySelector('.ct').textContent=n?fmt(n):'I learnt';
  const ec=el.querySelector('.endcard');if(ec){ec.querySelector('.ec-count').innerHTML=learnLine(n,m);const lb=ec.querySelector('.ec-learn');lb.className='btn ec-learn '+(m?'done':'gold');lb.innerHTML=ico(m?'check':'lotus')+(m?'You learnt this':'I learnt this');}});
 if(sheetFor&&sheetFor.kind==='learn')paintLearnBox();paintSideCount();
 if(S.view==='top')renderTop();}

/* ---------- sheets ---------- */
let sheetFor=null;
function openSheet(kind,html,ctx){sheetFor=Object.assign({kind},ctx||{});$('#sbody').innerHTML=html;$('#sbody').scrollTop=0;$('#scrim').classList.add('on');$('#sheet').classList.add('open');}
function closeSheet(){sheetFor=null;$('#scrim').classList.remove('on');$('#sheet').classList.remove('open');}
$('#scrim').onclick=closeSheet;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetFor)closeSheet();});
function openLearn(r){const n=TA(r).n,V=TL(n);
 const lines=V.verse.map((d,k)=>'<div class="ln"><span class="dev'+(V.roman?' roman':'')+'">'+esc(d)+'</span>'+(V.roman||lang()==='hi'?'':'<span class="ia">'+esc(V.iast[k])+'</span>')+'<span class="en">'+esc(V.en[k])+'</span></div>').join('');
 const words=V.words.map(w=>'<div class="word"><b>'+esc(w[0])+'</b><span>'+esc(w[1])+'</span></div>').join('');
 const keep=V.keep.map(k=>'<li>'+tsym(n,'tsy ksym')+'<span>'+esc(k)+'</span></li>').join('');
 openSheet('learn','<div class="shead"><div class="lhead"><span class="tmed">'+tsym(n)+'</span><div><p class="tno">'+esc(LX('Tattva'))+' '+n+' · '+esc(V.name)+'</p><h2 class="sh-title">'+esc(V.teach)+'</h2></div></div><button class="icon-btn glass" id="sh-x" aria-label="'+esc(LX('Close'))+'">'+ico('x')+'</button></div>'+
  '<div class="learnbox" id="lbox"><span class="bignum" id="lb-n">0</span><span class="lab">'+esc(LX('people learnt from this reel'))+'</span><p class="count" id="lb-line"></p><button class="btn" id="lb-btn"></button></div>'+
  '<button class="btn line" id="lb-sing">'+ico('mic')+esc(LX('Sing this verse'))+'</button><div><p class="lab">'+esc(LX('Keep these three'))+'</p><ul class="keep" style="margin-top:10px">'+keep+'</ul></div>'+
  '<div><p class="lab">'+esc(LX('The shloka'))+'</p><div class="shloka">'+lines+'</div></div>'+
  '<div><p class="lab" style="margin-bottom:10px">'+esc(LX('Word by word'))+'</p><div class="words">'+words+'</div></div>',{r});
 $('#sh-x').onclick=closeSheet;$('#lb-sing').onclick=()=>{closeSheet();S.style=norm(Object.assign({},S.style,{Tattva:n}));openSing();};$('#lb-btn').onclick=()=>{const v=!isLearnt(r.id);setLearnt(r,v);if(v){const e=$('#lb-n');e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');}};
 paintLearnBox();}
function paintLearnBox(){const r=sheetFor.r,n=counts()[r.id]||0,m=isLearnt(r.id),b=$('#lb-btn');if(!b)return;
 $('#lb-n').textContent=fmt(n);$('#lb-line').innerHTML=learnLine(n,m);b.className='btn '+(m?'done':'gold');b.innerHTML=ico(m?'check':'diya')+esc(LX(m?'You learnt this':'I learnt this'));}
function openShare(r){const url=location.origin+'/#r-'+r.id;if(navigator.share){navigator.share({title:'Hey Tattva',text:'Tattva '+TA(r).n+' · '+TA(r).name,url}).catch(()=>{});return;}
 openSheet('share','<div class="shead"><h2 class="sh-title">Share this reel</h2><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div>'+
  '<div class="linkbox"><input id="sh-url" readonly aria-label="Reel link"><button class="btn gold" id="sh-copy">Copy</button></div>'+
  '<p class="note">The link opens this reel for anyone you’ve shared Tattva with.</p>');
 $('#sh-url').value=url;$('#sh-x').onclick=closeSheet;
 $('#sh-copy').onclick=()=>{const done=()=>{toast('Link copied');closeSheet();};
  try{navigator.clipboard.writeText(url).then(done,()=>{$('#sh-url').select();toast('Press copy on your keyboard to copy the link');});}catch(e){$('#sh-url').select();toast('Press copy on your keyboard to copy the link');}};}

/* ---------- views & sound ---------- */
function setSoundIcons(){const k=S.sound?'son':'soff',lab=S.sound?'Turn sound off':'Turn sound on';['#snd','#cr-snd'].forEach(s=>{$(s).innerHTML=ico(k);$(s).setAttribute('aria-label',lab);});
 $('#hint').hidden=S.sound||S.view!=='feed';}
function toggleSound(){S.sound=!S.sound;setSoundIcons();
 if(!cur)return;
 if(cur.hasAudio){cur.setMuted(!S.sound);return;}
 if(S.sound){if(S.view==='feed'){const el=reelNode(S.idx);if(el&&!el.querySelector('.endcard'))startReel(el);}else if(S.view==='create'&&!recording)startPreview();else if(S.view==='review')startReview();}}
function showView(v){
 if(S.view==='create'&&v!=='create'){stopRecIfAny();}
 stopCur();closeSheet();S.view=v;
 $('#v-feed').hidden=v!=='feed';$('#v-top').hidden=v!=='top';$('#v-games').hidden=v!=='games';$('#v-gmake').hidden=v!=='gmake';$('#v-play').hidden=v!=='play';if(v!=='play'&&typeof closeRoom==='function'&&GS.live)closeRoom();if(typeof watchLobby==='function')watchLobby(v==='games');$('#v-create').hidden=v!=='create';$('#v-review').hidden=v!=='review';$('#v-sing').hidden=v!=='sing';if(v!=='sing'&&typeof singStop==='function')singStop(true);
 $('#nv-feed').setAttribute('aria-current',v==='feed'?'page':'false');$('#nv-top').setAttribute('aria-current',v==='top'?'page':'false');$('#nv-games').setAttribute('aria-current',v==='games'?'page':'false');
 setSoundIcons();
 if(v==='feed')requestAnimationFrame(()=>activate(currentIx(),true));
 if(v==='top')renderTop();}
$('#snd').onclick=toggleSound;$('#hint').onclick=toggleSound;$('#cr-snd').onclick=toggleSound;
function paintNavLabels(){$('#nv-feed').innerHTML=ico('home')+'<span>'+esc(LX('Reels'))+'</span>';$('#nv-create').innerHTML=ico('plus')+'<span class="cl">'+esc(LX('Create a reel'))+'</span>';$('#nv-create').setAttribute('aria-label',LX('Create a reel'));if(typeof paintNav==='function')paintNav();if($('#nv-games'))$('#nv-games').innerHTML=ico('chakra')+'<span>'+esc(LX('Games'))+'</span>';}
paintNavLabels();
$('#nv-feed').onclick=()=>{if(S.view==='feed'){reelsEl.scrollTo({top:0,behavior:'smooth'});return;}showView('feed');};
$('#nv-create').onclick=()=>openCreate();
$('#nv-top').onclick=()=>showView('top');
$('#hint').innerHTML=ico('soff')+'Tap for sound';
document.addEventListener('keydown',e=>{if(S.view!=='feed'||sheetFor||/input|textarea/i.test(e.target.tagName))return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();reelsEl.scrollBy({top:(e.key==='ArrowDown'?1:-1)*reelsEl.clientHeight,behavior:'smooth'});}
 else if(e.key==='m'||e.key==='M')toggleSound();});

/* ---------- me: my account, my reels, what I learnt, my game scores, and the top reels ---------- */
S.meTab='mine';
function reelRow(r,k,n){const b=document.createElement('button');b.className='lrow';
 b.innerHTML='<span class="rk">'+(k+1)+'</span><span class="lthumb"><canvas></canvas></span><span class="lmid"><b></b><small></small></span><span class="lcount">'+ico('lotus')+fmt(n)+'<small>learnt</small></span>';
 b.querySelector('b').textContent=r.caption||('Tattva '+TA(r).n+' · '+TA(r).name);
 const sm=b.querySelector('small');sm.textContent=r.name+' · '+r.style.Visuals;if(r.score!=null){const s=document.createElement('span');s.className='score';s.textContent='Tune '+r.score+'%';sm.appendChild(s);}
 b.onclick=()=>{const ix=reelList.findIndex(x=>x.id===r.id);showView('feed');if(ix>=0){reelsEl.scrollTop=ix*reelsEl.clientHeight;activate(ix,true);}};
 queuePoster(b.querySelector('canvas'),r.style,0);return b;}
function gameName(id){const m=/^o([slbc])([1-8])$/.exec(id);if(m&&typeof ARCADE!=='undefined'){const st={s:'stick',l:'letters',b:'build',c:'chakra'}[m[1]];return ARCADE[st].name+' · Tattva '+m[2];}
 const g=typeof GS!=='undefined'&&GS.games.find(x=>x.id===id);return g?g.title:'A community game';}
function renderTop(){const c=counts(),all=allReels(),mine=all.filter(r=>r.own),learnt=all.filter(r=>r.mine),u=S.user;
 const plays=S.scores.reduce((a,x)=>a+(x.plays||0),0),best=S.scores.reduce((a,x)=>Math.max(a,x.best||0),0);
 const box=$('#v-top .top');
 const got=new Set(learnt.map(r=>TA(r).n)),LN=(LANGS.find(l=>l[0]===lang())||LANGS[0])[1];
 const beads=Array.from({length:21},(_,i)=>'<circle cx="'+(10+i*15.5).toFixed(1)+'" cy="'+(22+9*Math.sin(i/20*Math.PI)).toFixed(1)+'" r="5.6" class="bead'+(i<Math.round(Math.min(108,learnt.length)/108*21)||(i===0&&learnt.length)?' on':'')+'"/>').join('');
 box.innerHTML='<div class="mehead">'+(u?'<span class="ava big">'+esc(u.handle[0].toUpperCase())+'</span><div class="meid"><h1>'+esc(u.handle)+'</h1><p class="note">'+esc(LX('{n} of 8 tattvas learnt').replace('{n}',got.size))+'</p></div>'+
   '<div class="mebtns"><button class="tpill glass" id="me-edit">'+ico('edit')+esc(LX('Name'))+'</button><button class="tpill glass" id="me-out">'+ico('out')+esc(LX('Sign out'))+'</button></div>'
  :'<span class="ava big ghost">'+ico('user')+'</span><div class="meid"><h1>'+esc(LX('Your space'))+'</h1><p class="note">'+esc(LX('Sign in to keep your reels, learnings and game scores on every device.'))+'</p></div>')+'</div>'+
  (u?'':'<button class="btn gold" id="me-in">'+ico('mail')+esc(LX('Sign in with email'))+'</button>')+
  '<button class="langrow" id="me-lang">'+ico('globe')+'<span>'+esc(LX('Language'))+'</span><b>'+esc(LN)+'</b></button>'+
  '<div class="mala"><svg viewBox="0 0 330 40" aria-hidden="true">'+beads+'</svg><p>'+esc(LX('Learning mala: {n} of 108 reels').replace('{n}',fmt(learnt.length)))+'</p></div>'+
  '<p class="lab">'+esc(LX('Your tattvas'))+'</p><div class="tgrid">'+TATTVAS.map(T=>'<div class="tt'+(got.has(T.n)?' got':'')+'">'+tsym(T.n)+'<span>'+esc(TL(T.n).name)+'</span></div>').join('')+'</div>'+
  '<div class="stats s4"><div class="stat"><b>'+fmt(learnt.length)+'</b><span>'+esc(LX('Learnt'))+'</span></div><div class="stat"><b>'+fmt(mine.length)+'</b><span>'+esc(LX('My reels'))+'</span></div><div class="stat"><b>'+fmt(plays)+'</b><span>'+esc(LX('Games played'))+'</span></div><div class="stat"><b>'+fmt(best)+'</b><span>'+esc(LX('Best score'))+'</span></div></div>'+
  '<div class="metabs" role="tablist">'+[['mine','My reels'],['learnt','Learnt'],['scores','Game scores'],['top','Top reels']].map(x=>'<button role="tab" data-tab="'+x[0]+'" aria-selected="'+(S.meTab===x[0])+'">'+esc(LX(x[1]))+'</button>').join('')+'</div><div class="lb" id="lb"></div>';
 $('#me-lang').onclick=()=>openLang();
 if(u){$('#me-out').onclick=signOut;$('#me-edit').onclick=()=>openName(false);}else $('#me-in').onclick=()=>openSignin(()=>renderTop(),'Sign in');
 box.querySelectorAll('.metabs button').forEach(b=>b.onclick=()=>{S.meTab=b.dataset.tab;renderTop();});
 const lb=$('#lb'),t=S.meTab;
 if(t==='scores'){if(!u){lb.innerHTML='<p class="note">Sign in and your best score in every game is kept here.</p>';return;}
  if(!S.scores.length){lb.innerHTML='<p class="note">No games yet. Play one from the Games tab.</p>';return;}
  S.scores.slice().sort((a,b)=>b.best-a.best).forEach((x,k)=>{const r=document.createElement('div');r.className='lrow srow';r.innerHTML='<span class="rk">'+(k+1)+'</span><span class="lmid"><b></b><small></small></span><span class="lcount"><b class="sbest"></b><small>best</small></span>';
   r.querySelector('b').textContent=gameName(x.game);r.querySelector('small').textContent='Played '+fmt(x.plays)+(x.plays===1?' time':' times');r.querySelector('.sbest').textContent=fmt(x.best);lb.appendChild(r);});return;}
 let list=t==='mine'?mine:t==='learnt'?learnt:all.slice();
 list=list.map(r=>({r,n:c[r.id]||0}));if(t==='top')list.sort((a,b)=>b.n-a.n||(b.r.score||0)-(a.r.score||0)||b.r.createdAt-a.r.createdAt);
 if(!list.length){lb.innerHTML='<p class="note">'+(t==='mine'?(u?'You haven’t shared a reel yet. Tap + to make one.':'Reels you share show up here.'):t==='learnt'?'Tap the lotus on a reel when it clicks, and it’s kept here.':'No reels yet.')+'</p>';return;}
 list.slice(0,100).forEach((x,k)=>lb.appendChild(reelRow(x.r,k,x.n)));}
async function loadMe(){try{const j=await API('/api/me');S.user=j.user&&j.user.handle?j.user:null;S.pendingEmail=j.user&&!j.user.handle?j.user.email:null;S.scores=j.scores||[];}
 catch(e){if(e.status===501||!e.status){S.user=null;}}
 if(S.user)LS.set('tr-me',{handle:S.user.handle,email:S.user.email});else LS.del('tr-me');
 if(typeof GS!=='undefined'){S.scores.forEach(x=>{if(x.best>(GS.best[x.game]||0))GS.best[x.game]=x.best;});}
 paintNav();if(S.view==='top')renderTop();
 if(S.pendingEmail)openName(true);}
// language: a full screen the first time the app opens, then a sheet from Me
function langButtons(cls){return LANGS.map(l=>'<button class="lopt'+(cls?' '+cls:'')+(lang()===l[0]&&LANG?' on':'')+'" data-l="'+l[0]+'" lang="'+l[0]+'"><b>'+esc(l[1])+'</b><span>'+esc(l[2])+'</span><i>'+ico('check')+'</i></button>').join('');}
function openLang(){openSheet('lang','<div class="shead"><div><h2 class="sh-title">'+esc(LX('Language'))+'</h2><p class="note">'+esc(LX('The whole app, the meanings and the shloka letters switch. Singing stays in Sanskrit sounds.'))+'</p></div><button class="icon-btn glass" id="sh-x" aria-label="'+esc(LX('Close'))+'">'+ico('x')+'</button></div><div class="lops">'+langButtons('sm')+'</div>');
 $('#sh-x').onclick=closeSheet;$('#sbody').querySelectorAll('.lopt').forEach(b=>b.onclick=()=>{closeSheet();setLang(b.dataset.l);});}
function firstLang(){if(LANG)return;const el=document.createElement('div');el.className='langscreen';el.setAttribute('role','dialog');el.setAttribute('aria-label','Choose your language');let pick='en';
 el.innerHTML='<div class="lsy">'+yantra()+'</div><div class="lsom">ॐ</div><div class="lst"><h1>Hey Tattva</h1><p class="dv">हे तत्त्व</p><p class="sub">The eight tattvas of the Dakṣiṇāmūrti Aṣṭakam, in reels, songs and games.</p></div>'+
  '<h2 class="lsh">Choose your language</h2><div class="lops">'+langButtons()+'</div><button class="btn gold" id="ls-go">Continue</button><p class="lsn">You can change it any time in Me.</p>';
 $('#app').appendChild(el);const paint=()=>el.querySelectorAll('.lopt').forEach(b=>b.classList.toggle('on',b.dataset.l===pick));paint();
 el.querySelectorAll('.lopt').forEach(b=>b.onclick=()=>{pick=b.dataset.l;paint();});
 $('#ls-go').onclick=()=>{if(pick!=='en'){setLang(pick);return;}setLang(pick,true);el.classList.add('out');setTimeout(()=>el.remove(),400);};}
function signOut(){API('/api/auth',{method:'POST',body:JSON.stringify({logout:true})}).catch(()=>{});S.user=null;S.scores=[];LS.del('tr-me');paintNav();toast('Signed out');loadReels();if(S.view==='top')renderTop();}
function paintNav(){const u=S.user;$('#nv-top').innerHTML=(u?'<span class="ava sm">'+esc(u.handle[0].toUpperCase())+'</span>':ico('user'))+'<span>'+esc(LX('Me'))+'</span>';$('#nv-top').setAttribute('aria-label',u?LX('Me')+': '+u.handle:LX('Me'));}
// pick or change my name (the handle everyone sees)
function openName(first,after){const cur=S.user?S.user.handle:'',sug=first?((S.pendingEmail||'').split('@')[0]||'').toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,20):cur;
 openSheet('name','<div class="shead"><div><h2 class="sh-title">'+(first?'Pick your name':'Change your name')+'</h2><p class="note">Everyone sees it on your reels and in games. 3–20 letters, numbers, dots or underscores.</p></div>'+(first?'':'<button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button>')+'</div>'+
  '<input class="field" id="nm-in" maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="e.g. laksh" value="'+esc(sug)+'"><p class="err" id="nm-err"></p><button class="btn gold" id="nm-go">'+(first?'Continue':'Save')+'</button>');
 const x=$('#sh-x');if(x)x.onclick=closeSheet;const inp=$('#nm-in');setTimeout(()=>{inp.focus();inp.select();},350);inp.oninput=()=>{inp.value=inp.value.toLowerCase().replace(/[^a-z0-9_.]/g,'');$('#nm-err').textContent='';};
 const go=async()=>{const v=inp.value.trim();if(!/^[a-z0-9_.]{3,20}$/.test(v)){$('#nm-err').textContent='Use 3–20 letters, numbers, dots or underscores.';return;}
  const b=$('#nm-go');b.disabled=true;try{const j=await API('/api/me',{method:'POST',body:JSON.stringify({handle:v})});S.user=j.user;S.pendingEmail=null;LS.set('tr-me',S.user);closeSheet();paintNav();toast(first?'Welcome, '+S.user.handle:'Name saved');
   if(!first)loadReels();if(S.view==='top')renderTop();if(typeof after==='function')after();}
  catch(e){$('#nm-err').textContent=e.message;}finally{if($('#nm-go'))$('#nm-go').disabled=false;}};
 $('#nm-go').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}

/* ---------- create ---------- */
const GROUPS={
 music:{k:'Sound',multi:true,title:'Instruments',note:'Each one plays the approved tune, pre-recorded. Pick as many as you like; they layer together.',opts:Object.keys(INSTR),lab:INSTR,icon:'music',label:'Music'},
 rhythm:{k:'Tone',multi:false,title:'Rhythm',note:'Tabla and mridangam are pre-recorded on the tune’s beat.',opts:Object.keys(TONES),icon:'drum',label:'Rhythm'},
 recite:{k:'Recitation',multi:false,title:'Shloka recitation',note:'Use your own voice from Sing, or let an AI voice read the shloka.',opts:['None','My recording','AI voice'],icon:'book',label:'Recite'}};
let recording=false,mr=null,stream=null,chunks=[],recTimer=0,recSec=0,guideRaf=0,prevT=0;
function openCreate(style){S.style=norm(style||S.style||DEF());paintTattvaPill();S.source=null;S.score=null;S.takeBuf=null;$('#rescard').hidden=true;
 showView('create');renderTools();renderFx(true);startPreview();}
function renderTools(){const t=$('#tools');t.innerHTML='';
 Object.keys(GROUPS).forEach(id=>{const G=GROUPS[id],v=S.style[G.k],b=document.createElement('button');b.className='tool';
  const badge=G.multi?'<span class="badge">'+v.length+'</span>':'';
  b.innerHTML='<span class="ib glass">'+ico(G.icon)+badge+'</span>'+G.label;b.onclick=()=>openGroup(id);t.appendChild(b);});}
function openGroup(id){const G=GROUPS[id];
 const paint=()=>{const v=S.style[G.k];$('#gchips').innerHTML=G.opts.map(o=>{const on=G.multi?v.includes(o):v===o;return '<button class="chip'+(on?' on':'')+'" aria-pressed="'+on+'" data-o="'+esc(o)+'">'+esc(G.lab?G.lab[o]:o)+'</button>';}).join('');};
 openSheet('group','<div class="shead"><div><h2 class="sh-title">'+G.title+'</h2><p class="note">'+esc(G.note)+'</p></div><button class="icon-btn glass" id="sh-x" aria-label="Done">'+ico('check')+'</button></div><div class="chips" id="gchips"></div>');
 paint();$('#sh-x').onclick=closeSheet;if(G.k==='Recitation')elPanel(paint);
 $('#gchips').onclick=e=>{const b=e.target.closest('[data-o]');if(!b)return;const o=b.dataset.o;
  if(G.multi){const a=S.style[G.k],ix=a.indexOf(o);if(ix>=0){if(a.length===1){toast('Keep at least one instrument');return;}a.splice(ix,1);}else a.push(o);}
  else{if(o==='My recording'&&!S.takeBuf){toast('Sing first: tap Sing and share your take');return;}S.style[G.k]=o;}
  paint();renderTools();clearTimeout(prevT);prevT=setTimeout(startPreview,250);};}
function elPanel(paint){const box=document.createElement('div');box.className='elbox';
 box.innerHTML='<div class="elhead"><p class="lab">AI voice</p><span class="elstat" id="el-stat"></span></div><p class="note">An ElevenLabs voice reads the shloka over your music.</p><button class="btn gold" id="el-gen">Preview AI recitation</button><p class="note" id="el-msg"></p>';
 $('#sbody').appendChild(box);const stat=$('#el-stat'),msg=$('#el-msg'),setStat=()=>{const eb=elBuf(S.style.Tattva);stat.textContent=eb?'Ready · '+Math.round(eb.duration)+'s':'';stat.classList.toggle('ok',!!eb);};setStat();
 $('#el-gen').onclick=async e=>{if(EL.busy)return;const b=e.currentTarget;msg.style.color='';
  try{EL.busy=true;b.textContent='Loading…';await elFetch(S.style.Tattva);S.style.Recitation='AI voice';paint();renderTools();setStat();msg.textContent='Ready. It plays over the music in your reel.';if(!S.sound)toast('Turn sound on to hear it');startPreview();}
  catch(r){msg.style.color='var(--bad)';msg.textContent=r===501?'AI voice isn’t switched on for this site yet, so your browser’s voice reads it instead.':'Couldn’t load the AI voice. Try again.';}
  finally{EL.busy=false;b.textContent='Preview AI recitation';}};}
function renderFx(scroll){const fx=$('#fx');fx.innerHTML='';
 VISUALS.forEach(v=>{const b=document.createElement('button');b.className='fxb'+(S.style.Visuals===v?' on':'');b.setAttribute('role','option');b.setAttribute('aria-selected',String(S.style.Visuals===v));b.setAttribute('aria-label',v);
  if(v==='Beatbox text')b.innerHTML='<span class="tx">Aa</span>';else{b.innerHTML='<canvas></canvas>';queuePoster(b.querySelector('canvas'),Object.assign({},S.style,{Visuals:v}),0);}
  b.onclick=()=>{if(S.style.Visuals===v)return;S.style.Visuals=v;fx.querySelectorAll('.fxb').forEach(x=>{const on=x.getAttribute('aria-label')===v;x.classList.toggle('on',on);x.setAttribute('aria-selected',String(on));});
   b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});$('#fxname').textContent=v;startPreview();};
  fx.appendChild(b);});
 $('#fxname').textContent=S.style.Visuals;$('#fxname').classList.remove('rec');
 if(scroll)requestAnimationFrame(()=>{const on=fx.querySelector('.on');if(on)fx.scrollLeft=on.offsetLeft-fx.clientWidth/2+on.clientWidth/2;});}
function startPreview(){if(S.view!=='create')return;play($('#c-create'),0,S.style,{sound:S.sound&&!recording,onEnd:()=>startPreview()});}
$('#cr-close').onclick=()=>showView('feed');
function paintTattvaPill(){const V=TA(S.style);$('#cr-tattva').innerHTML='<span>Tattva '+V.n+' · '+esc(V.name)+'</span>'+ico('down');}
paintTattvaPill();
function setTattva(n){if(S.style.Tattva===n)return;S.style.Tattva=n;S.takeBuf=null;S.takeBlob=null;S.score=null;S.source=null;if(S.style.Recitation==='My recording')S.style.Recitation='None';$('#rescard').hidden=true;
 paintTattvaPill();renderTools();renderFx(true);startPreview();}
$('#cr-tattva').onclick=()=>{openSheet('tattva','<div class="shead"><h2 class="sh-title">Choose a tattva</h2><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div>'+
 '<p class="note">The eight tattvas of the Dakṣiṇāmūrti Aṣṭakam, one per verse.</p>'+
 TATTVAS.map((t,k)=>'<button class="trow'+(t.n===S.style.Tattva?' on':'')+'" data-k="'+t.n+'"><span class="n">'+t.n+'</span><span class="t"><b>'+esc(t.name)+'</b><small>'+esc(t.teach)+'</small></span>'+(t.n===S.style.Tattva?ico('check'):'')+'</button>').join(''));
 $('#sh-x').onclick=closeSheet;$('#sbody').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{closeSheet();setTattva(+b.dataset.k);});};
$('#ic-up').innerHTML=ico('upload');
$('#cr-next').innerHTML='Next'+ico('right');
$('#cr-next').onclick=()=>{if(recording)return;S.source='generated';S.score=null;S.takeBuf=null;if(S.style.Recitation==='My recording')S.style.Recitation='None';openReview();};
$('#shutter').onclick=()=>openSing();
$('#file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f){closeSheet();singUpload(f);}};
function stopRecIfAny(){}

/* ---------- review & publish ---------- */
function openReview(){showView('review');$('#caption').value='';
 $('#rv-tag').innerHTML=(S.source==='recorded'||S.source==='sung')?ico('check')+'<span>Tune match '+S.score+'%</span>':'<span>Generated · not ranked</span>';
 const s=S.style;$('#rv-sum').innerHTML=[s.Visuals,s.Tone==='None'?'No rhythm':s.Tone].concat(s.Sound.map(x=>INSTR[x]),s.Recitation!=='None'?[s.Recitation==='My recording'?'Your voice':(elBuf(s.Tattva)?'ElevenLabs recitation':'AI recitation')]:[]).map(x=>'<span>'+esc(x)+'</span>').join('');
 startReview();}
function startReview(){if(S.view!=='review')return;const take=S.style.Recitation==='My recording'?S.takeBuf:null;play($('#c-review'),0,S.style,{sound:S.sound,take,takeOffset:S.takeOffset||0,onEnd:()=>startReview()});}
$('#rv-back').innerHTML=ico('back');$('#rv-back').onclick=()=>{showView('create');renderTools();renderFx(true);startPreview();};
$('#cr-close').innerHTML=ico('x');
$('#rv-share').onclick=async()=>{const b=$('#rv-share');if(b.disabled)return;b.disabled=true;try{const d=await makeDraft();if(S.user||S.local)await publish(d);else{saveDraft(d);openSignin();}}finally{b.disabled=false;}};
// Real sign-in: email → Supabase Auth emails a sign-in link (or a code, if a custom mailer's template shows one).
// Tapping the link opens the site with #access_token=…; boot picks it up. A tab that is waiting checks /api/me, so a
// link opened in the same browser signs this tab in too.
function finishSignin(user,after){const done=()=>{loadReels();loadMe();if(typeof after==='function'){after();return;}const d=loadDraft();if(d)publish(d);};
 if(user.handle){S.user=user;LS.set('tr-me',S.user);closeSheet();paintNav();toast('Signed in as '+user.handle);done();}
 else{S.pendingEmail=user.email;openName(true,done);}}
// Simulated sign-in for now (Laksh, 2026-10-08): email, then a name the first time. No email is sent; the server
// finds or creates the account. The email-link flow (linkSignin below) stays ready for when a mail service is added.
function openSignin(after,title){
 openSheet('signin','<div class="shead"><div><h2 class="sh-title">'+esc(title||LX('Sign in to share'))+'</h2><p class="note">'+esc(LX('Just your email. No password, no code. We’ll remember you on this device.'))+'</p></div><button class="icon-btn glass" id="sh-x" aria-label="'+esc(LX('Close'))+'">'+ico('x')+'</button></div>'+
  '<div class="sistep"><label class="lab" for="si-email">'+esc(LX('Email'))+'</label><input class="field" id="si-email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com"><p class="err" id="si-err"></p><button class="btn gold" id="si-send">'+esc(LX('Continue'))+'</button></div>');
 $('#sh-x').onclick=closeSheet;const em=$('#si-email');setTimeout(()=>em.focus(),350);
 const go=async()=>{const v=em.value.trim().toLowerCase();if(!/^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/.test(v)){$('#si-err').textContent=LX('Enter an email like you@example.com.');return;}
  const b=$('#si-send');if(b.disabled)return;b.disabled=true;b.innerHTML='<span class="spin"></span>';$('#si-err').textContent='';
  try{const j=await API('/api/auth',{method:'POST',body:JSON.stringify({email:v,simulate:true})});finishSignin(j.user,after);}
  catch(e){$('#si-err').textContent=e.status===501?LX('Sign-in isn’t available right now.'):e.message;if($('#si-send')){b.disabled=false;b.textContent=LX('Continue');}}};
 em.addEventListener('input',()=>$('#si-err').textContent='');em.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});$('#si-send').onclick=go;}
// the email link lands here: #access_token=…&type=magiclink (or #error=…)
function linkSignin(){const h=location.hash;if(!/(^#|&)(access_token|error)=/.test(h))return false;const q=new URLSearchParams(h.slice(1));history.replaceState(null,'',location.pathname+location.search);
 if(q.get('error')){toast(/expired/i.test(q.get('error_description')||q.get('error_code')||'')?'That sign-in link has expired. Ask for a new one.':'That sign-in link didn’t work. Ask for a new one.');return true;}
 API('/api/auth',{method:'POST',body:JSON.stringify({access_token:q.get('access_token')})}).then(j=>finishSignin(j.user)).catch(e=>toast(e.message));return true;}
function blobB64(b){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(b);});}
async function makeDraft(){const d={caption:$('#caption').value.trim().slice(0,140),style:JSON.parse(JSON.stringify(S.style)),score:(S.source==='recorded'||S.source==='sung')?S.score:null,takeOffset:S.takeOffset||0,take:null};
 if(d.style.Recitation==='My recording'){if(S.takeBlob&&S.takeBlob.size<=880000){d.take={mime:(S.takeBlob.type||'audio/webm').replace(/\s/g,''),b64:await blobB64(S.takeBlob)};}else{if(S.takeBlob)toast('Your recording is too long to attach, so the reel shares without it');d.style.Recitation='None';}}
 return d;}
function saveDraft(d){try{localStorage.setItem('tr-draft',JSON.stringify(d));}catch(e){try{const x=Object.assign({},d,{take:null,style:Object.assign({},d.style,{Recitation:d.style.Recitation==='My recording'?'None':d.style.Recitation})});localStorage.setItem('tr-draft',JSON.stringify(x));}catch(e2){}}}
function loadDraft(){try{return JSON.parse(localStorage.getItem('tr-draft')||'null');}catch(e){return null;}}
function clearDraft(){try{localStorage.removeItem('tr-draft');}catch(e){}}
async function publish(d){
 if(!S.local){try{const j=await API('/api/reels',{method:'POST',body:JSON.stringify({caption:d.caption,style:d.style,score:d.score,take:d.take,takeOffset:d.takeOffset})});
   const c=cleanReel(j.reel);if(c){if(c.hasTake&&S.takeBuf)TAKES[c.id]=S.takeBuf;S.reels.unshift(c);}clearDraft();showView('feed');renderFeed(true);reelsEl.scrollTop=0;requestAnimationFrame(()=>activate(0,true));toast('Shared. Everyone can see it now');}
  catch(e){if(e.status===501){S.local=true;return publish(d);}saveDraft(d);if(e.status===401){S.user=null;paintNav();openSignin();return;}if(e.status===403){openName(true,()=>publish(d));return;}toast(e.message||'Couldn’t share. Try again.');}
  return;}
 const id='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);let hasTake=false;
 if(d.take){try{localStorage.setItem('tr-take-'+id,JSON.stringify(d.take));hasTake=true;if(S.takeBuf)TAKES[id]=S.takeBuf;}catch(e){toast('Not enough space on this device to keep your voice, so the reel saves without it');}}
 const r={id,t:0,name:S.user?S.user.handle:'seeker',caption:d.caption,style:Object.assign({},d.style,{Recitation:d.style.Recitation==='My recording'&&!hasTake?'None':d.style.Recitation}),score:d.score,createdAt:Date.now(),hasTake,takeOffset:hasTake?(d.takeOffset||0):0};
 const list=LS.get('tr-reels',[]);list.unshift(r);LS.set('tr-reels',list.slice(0,40));
 clearDraft();const c=cleanReel(r);if(c)S.reels.unshift(c);showView('feed');renderFeed(true);reelsEl.scrollTop=0;requestAnimationFrame(()=>activate(0,true));toast('Shared to your reels');}

/* ---------- boot ---------- */
document.querySelectorAll('.crest').forEach(e=>e.innerHTML=yantra());applyI18n();startTranslator();
window.addEventListener('langchange',()=>{paintNavLabels();setSoundIcons();renderFeed(true);requestAnimationFrame(()=>activate(currentIx(),true));if(S.view==='top')renderTop();if(sheetFor&&sheetFor.kind==='learn'){const r=sheetFor.r;openLearn(r);}if(typeof renderGames==='function')renderGames();});
setSoundIcons();paintNav();renderFeed(true);loadReels();if(!linkSignin())loadMe();firstLang();
})();
