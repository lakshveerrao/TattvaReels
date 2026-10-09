/* ---------- Rock: each tattva in the singer's own voice (his ElevenLabs voice, rock delivery) over a hard-rock band
   made by ElevenLabs Music (/api/music?v=N, stored once). The voice runs through a rock vocal chain (presence, grit,
   compression, slapback, stage reverb); the band is carved and ducks whenever he sings. Opens as a full-screen stage. */
Object.assign(UI18N.te,{"Hear it first":"ముందు వినండి","The AI voice is an ElevenLabs voice. The singer voice is the Agara singer's own voice.":"AI గొంతు ఒక ElevenLabs గొంతు. గాయకుడి గొంతు అగర గాయకుడి సొంత గొంతు.","Couldn’t load the voice. Try again.":"గొంతు లోడ్ కాలేదు. మళ్ళీ ప్రయత్నించండి.","Use your own voice from Sing, an AI voice, or the singer's voice.":"Sing నుండి మీ గొంతు, AI గొంతు లేదా గాయకుడి గొంతు వాడండి.","Ready":"సిద్ధం","Rock":"రాక్","Rock stage":"రాక్ వేదిక","Verse":"శ్లోకం","Meaning":"అర్థం","Voice":"గొంతు","Band":"బ్యాండ్","Tuning up":"శ్రుతి చేస్తోంది","Plugging in the band":"బ్యాండ్ సిద్ధమవుతోంది","Live":"లైవ్","Needs internet":"ఇంటర్నెట్ కావాలి","Tap play":"ప్లే నొక్కండి",
 "Hear this tattva as rock: the singer's voice over a rock band.":"ఈ తత్త్వాన్ని రాక్‌గా వినండి: గాయకుడి గొంతు, రాక్ బ్యాండ్‌తో."});
Object.assign(UI18N.kn,{"Hear it first":"ಮೊದಲು ಕೇಳಿ","The AI voice is an ElevenLabs voice. The singer voice is the Agara singer's own voice.":"AI ಧ್ವನಿ ಒಂದು ElevenLabs ಧ್ವನಿ. ಗಾಯಕನ ಧ್ವನಿ ಅಗರ ಗಾಯಕನ ಸ್ವಂತ ಧ್ವನಿ.","Couldn’t load the voice. Try again.":"ಧ್ವನಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.","Use your own voice from Sing, an AI voice, or the singer's voice.":"Sing ನಿಂದ ನಿಮ್ಮ ಧ್ವನಿ, AI ಧ್ವನಿ ಅಥವಾ ಗಾಯಕನ ಧ್ವನಿ ಬಳಸಿ.","Ready":"ಸಿದ್ಧ","Rock":"ರಾಕ್","Rock stage":"ರಾಕ್ ವೇದಿಕೆ","Verse":"ಶ್ಲೋಕ","Meaning":"ಅರ್ಥ","Voice":"ಧ್ವನಿ","Band":"ಬ್ಯಾಂಡ್","Tuning up":"ಶ್ರುತಿ ಮಾಡುತ್ತಿದೆ","Plugging in the band":"ಬ್ಯಾಂಡ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ","Live":"ಲೈವ್","Needs internet":"ಇಂಟರ್ನೆಟ್ ಬೇಕು","Tap play":"ಪ್ಲೇ ಒತ್ತಿ",
 "Hear this tattva as rock: the singer's voice over a rock band.":"ಈ ತತ್ತ್ವವನ್ನು ರಾಕ್ ಆಗಿ ಕೇಳಿ: ಗಾಯಕನ ಧ್ವನಿ, ರಾಕ್ ಬ್ಯಾಂಡ್‌ನೊಂದಿಗೆ."});
Object.assign(UI18N.hi,{"Hear it first":"पहले सुनें","The AI voice is an ElevenLabs voice. The singer voice is the Agara singer's own voice.":"AI आवाज़ एक ElevenLabs आवाज़ है। गायक की आवाज़ अगर गायक की अपनी आवाज़ है।","Couldn’t load the voice. Try again.":"आवाज़ लोड नहीं हुई। फिर कोशिश करें।","Use your own voice from Sing, an AI voice, or the singer's voice.":"Sing से अपनी आवाज़, AI आवाज़ या गायक की आवाज़ इस्तेमाल करें।","Ready":"तैयार","Rock":"रॉक","Rock stage":"रॉक मंच","Verse":"श्लोक","Meaning":"अर्थ","Voice":"आवाज़","Band":"बैंड","Tuning up":"सुर मिल रहे हैं","Plugging in the band":"बैंड तैयार हो रहा है","Live":"लाइव","Needs internet":"इंटरनेट चाहिए","Tap play":"प्ले दबाएँ",
 "Hear this tattva as rock: the singer's voice over a rock band.":"इस तत्त्व को रॉक में सुनें: गायक की आवाज़, रॉक बैंड के साथ।"});

const ROCK={ac:null,cache:{},cur:null,n:1,m:false,el:null,vol:{v:1,b:.8}};
function rockCtx(){if(!ROCK.ac)ROCK.ac=new AC();return ROCK.ac;}
async function rockBuf(url,ms){if(ROCK.cache[url])return ROCK.cache[url];const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
 try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error(r.status);const ab=await r.arrayBuffer();return ROCK.cache[url]=await rockCtx().decodeAudioData(ab);}finally{clearTimeout(t);}}
function rockImpulse(ac,sec,decay){const n=ac.sampleRate*sec,b=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
function rockCurve(k){const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/n*2-1;c[i]=Math.tanh(k*x)/Math.tanh(k);}return c;}
// if the band can't load: the singer's own guitar loop with a rock beat
async function rockFallback(ac,dur){let g=null;try{g=await rockBuf('/audio/singer_guitar.mp3',15000);}catch(e){}
 const sr=ac.sampleRate,len=Math.ceil(dur*sr),b=ac.createBuffer(1,len,sr),d=b.getChannelData(0),spb=60/96,gd=g?g.getChannelData(0):null;
 if(gd)for(let i=0;i<len;i++)d[i]=gd[i%gd.length]*.9;
 for(let beat=0;beat*spb<dur;beat++){const t0=Math.floor(beat*spb*sr),bar=beat%4;
  const hit=(f,l,amp,noise)=>{for(let i=0;i<l*sr&&t0+i<len;i++){const tt=i/sr,e=Math.exp(-tt*(noise?18:9));d[t0+i]+=amp*e*(noise?(Math.random()*2-1):Math.sin(2*Math.PI*f*tt*(1+2*Math.exp(-tt*40))));}};
  if(bar===0||bar===2)hit(52,.35,.8,false);if(bar%2)hit(0,.22,.45,true);}
 return b;}

function rockStop(){const r=ROCK.cur;if(!r)return;ROCK.cur=null;cancelAnimationFrame(r.raf);
 try{r.master.gain.setTargetAtTime(0,r.ac.currentTime,.2);setTimeout(()=>r.srcs.forEach(x=>{try{x.stop()}catch(e){}}),800);}catch(e){}
 rockPaint();}
async function rockPlay(){const n=ROCK.n,m=ROCK.m;rockStop();const me={n,m,state:'tune'};ROCK.cur=me;rockPaint();
 const ac=rockCtx();if(ac.state==='suspended')await ac.resume();
 let voice,band,real=true;
 try{voice=await rockBuf('/api/tts?v='+n+'&voice=singer&sv=2&rock=1'+(m?'&m=1':''),60000);}catch(e){if(ROCK.cur===me){me.state='err';rockPaint();ROCK.cur=null;}return;}
 if(ROCK.cur!==me)return;me.state='band';rockPaint();
 try{band=await rockBuf('/api/music?v='+n,150000);}catch(e){band=null;}
 if(ROCK.cur!==me)return;
 if(!band){real=false;band=await rockFallback(ac,voice.duration+8);}
 const t=ac.currentTime+.1,intro=real?3.2:2.4,end=intro+voice.duration+3.5;
 const master=ac.createGain();master.gain.value=0;master.gain.setTargetAtTime(1,t,.08);
 const lim=ac.createDynamicsCompressor();lim.threshold.value=-6;lim.knee.value=2;lim.ratio.value=12;lim.attack.value=.002;lim.release.value=.12;master.connect(lim);lim.connect(ac.destination);
 // the rock vocal chain
 const vs=ac.createBufferSource();vs.buffer=voice;
 const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=110;
 const mud=ac.createBiquadFilter();mud.type='peaking';mud.frequency.value=320;mud.gain.value=-3;
 const pres=ac.createBiquadFilter();pres.type='peaking';pres.frequency.value=2900;pres.gain.value=6;pres.Q.value=.9;
 const air=ac.createBiquadFilter();air.type='highshelf';air.frequency.value=8000;air.gain.value=3;
 const grit=ac.createWaveShaper();grit.curve=rockCurve(3.2);grit.oversample='4x';const gmix=ac.createGain();gmix.gain.value=.35;const dry=ac.createGain();dry.gain.value=.8;
 const comp=ac.createDynamicsCompressor();comp.threshold.value=-24;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.14;comp.knee.value=6;
 const vg=ac.createGain();vg.gain.value=ROCK.vol.v*1.9;
 vs.connect(hp);hp.connect(mud);mud.connect(pres);pres.connect(air);air.connect(dry);air.connect(grit);grit.connect(gmix);dry.connect(comp);gmix.connect(comp);comp.connect(vg);vg.connect(master);
 const dl=ac.createDelay(1);dl.delayTime.value=.118;const fb=ac.createGain();fb.gain.value=.22;const dlf=ac.createBiquadFilter();dlf.type='lowpass';dlf.frequency.value=3200;const dw=ac.createGain();dw.gain.value=.2;
 vg.connect(dl);dl.connect(dlf);dlf.connect(fb);fb.connect(dl);dlf.connect(dw);dw.connect(master);
 const rv=ac.createConvolver();rv.buffer=rockImpulse(ac,2.2,3);const rw=ac.createGain();rw.gain.value=.18;vg.connect(rv);rv.connect(rw);rw.connect(master);
 const van=ac.createAnalyser();van.fftSize=1024;comp.connect(van);
 // the band: room for the voice, and it ducks when he sings
 const bs=ac.createBufferSource();bs.buffer=band;bs.loop=true;
 const carve=ac.createBiquadFilter();carve.type='peaking';carve.frequency.value=2600;carve.gain.value=-6;carve.Q.value=.8;
 const duck=ac.createGain();const bg=ac.createGain();bg.gain.value=ROCK.vol.b*.55;
 bs.connect(carve);carve.connect(duck);duck.connect(bg);bg.connect(master);const ban=ac.createAnalyser();ban.fftSize=1024;bg.connect(ban);
 bs.start(t);vs.start(t+intro);bs.stop(t+end+.1);
 Object.assign(me,{ac,master,srcs:[bs,vs],vg,bg,t,intro,vdur:voice.duration,end,real,state:'live'});rockPaint();
 const buf=new Float32Array(1024),lvl=a=>{a.getFloatTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++)s+=buf[i]*buf[i];return Math.sqrt(s/buf.length);};
 const tick=()=>{if(ROCK.cur!==me)return;const v=lvl(van),b=lvl(ban),now=ac.currentTime-t;
  duck.gain.setTargetAtTime(Math.max(.45,1-v*3.2),ac.currentTime,v>.02?.03:.25);
  vg.gain.value=ROCK.vol.v*1.9;const tb=ROCK.vol.b*.55*(now>end-2.2?Math.max(0,(end-now)/2.2):1);bg.gain.value=tb;
  const el=ROCK.el;if(el){el.querySelector('.rk-mv').style.width=Math.min(100,v*260)+'%';el.querySelector('.rk-mb').style.width=Math.min(100,b*260)+'%';
   const k=Math.min(1,v*6);el.querySelector('.rk-yan').style.transform='scale('+(1+k*.06)+')';el.querySelector('.rk-yan').style.filter='drop-shadow(0 0 '+(14+k*30)+'px rgba(255,74,28,.85))';
   const p=(now-me.intro)/me.vdur,li=p<0?-1:Math.min(3,Math.floor(p*4));el.querySelectorAll('.rk-ln').forEach((x,i)=>x.classList.toggle('on',i===li));el.querySelector('.rk-prog i').style.width=Math.max(0,Math.min(100,now/end*100))+'%';}
  if(now>end+.3){rockStop();return;}me.raf=requestAnimationFrame(tick);};
 me.raf=requestAnimationFrame(tick);}
function rockPaint(){const el=ROCK.el;if(!el)return;const r=ROCK.cur,V=TL(ROCK.n);
 const st=!r?'idle':r.state;
 el.querySelector('.rk-go').innerHTML=ico(st==='idle'||st==='err'?'play':'pause');
 el.querySelector('.rk-go').setAttribute('aria-label',LX(st==='idle'?'Play':'Stop'));
 el.querySelector('.rk-st').textContent=LX(st==='tune'?'Tuning up':st==='band'?'Plugging in the band':st==='live'?'Live':st==='err'?'Needs internet':'Tap play');
 el.querySelector('.rk-st').classList.toggle('live',st==='live');
 el.querySelectorAll('.rk-seg button').forEach(b=>b.classList.toggle('on',(b.dataset.m==='1')===ROCK.m));
 if(st!=='live'){el.querySelector('.rk-mv').style.width='0';el.querySelector('.rk-mb').style.width='0';el.querySelectorAll('.rk-ln').forEach(x=>x.classList.remove('on'));if(st==='idle')el.querySelector('.rk-prog i').style.width='0';}}
function rockFill(){const el=ROCK.el,n=ROCK.n,V=TL(n);
 el.querySelector('.rk-no').textContent=LX('Tattva')+' '+n;el.querySelector('.rk-name').textContent=V.name;el.querySelector('.rk-sym').innerHTML=tsym(n);
 el.querySelector('.rk-lines').innerHTML=(ROCK.m?V.en:V.verse).map((l,i)=>'<p class="rk-ln'+(ROCK.m?' en':V.roman?' roman':'')+'">'+esc(l)+'</p>').join('');rockPaint();}
function openRock(n){stopCur();if(typeof closeSheet==='function')closeSheet();ROCK.n=n||1;ROCK.m=false;
 if(!ROCK.el){const el=document.createElement('div');el.className='rockstage';el.setAttribute('role','dialog');el.setAttribute('aria-label',LX('Rock stage'));
  el.innerHTML='<div class="rk-top"><button class="icon-btn rk-x" aria-label="'+esc(LX('Close'))+'">'+ico('x')+'</button><span class="rk-tag"><span class="rk-eq"><i></i><i></i><i></i></span>'+esc(LX('Rock'))+'</span>'+
   '<span class="rk-nav"><button class="icon-btn rk-prev" aria-label="'+esc(LX('Previous'))+'">'+ico('back')+'</button><button class="icon-btn rk-next" aria-label="'+esc(LX('Next'))+'">'+ico('right')+'</button></span></div>'+
   '<div class="rk-body"><div class="rk-yan">'+yantra()+'<span class="rk-sym"></span></div><p class="rk-no"></p><h2 class="rk-name"></h2>'+
   '<div class="rk-seg"><button data-m="0">'+esc(LX('Verse'))+'</button><button data-m="1">'+esc(LX('Meaning'))+'</button></div>'+
   '<div class="rk-lines"></div>'+
   '<div class="rk-ctl"><button class="rk-go"></button><div class="rk-info"><p class="rk-st"></p><div class="rk-prog"><i></i></div></div></div>'+
   '<div class="rk-meters"><div class="rk-m"><b>'+esc(LX('Voice'))+'</b><div><i class="rk-mv"></i></div><input type="range" class="rk-fv" min="0" max="1.5" step=".01" value="1" aria-label="'+esc(LX('Voice'))+'"></div>'+
   '<div class="rk-m"><b>'+esc(LX('Band'))+'</b><div><i class="rk-mb"></i></div><input type="range" class="rk-fb" min="0" max="1.5" step=".01" value=".8" aria-label="'+esc(LX('Band'))+'"></div></div></div>';
  $('#app').appendChild(el);ROCK.el=el;
  el.querySelector('.rk-x').onclick=closeRock;
  el.querySelector('.rk-go').onclick=()=>{if(ROCK.cur)rockStop();else rockPlay();};
  el.querySelector('.rk-prev').onclick=()=>{rockStop();ROCK.n=ROCK.n>1?ROCK.n-1:8;rockFill();};
  el.querySelector('.rk-next').onclick=()=>{rockStop();ROCK.n=ROCK.n<8?ROCK.n+1:1;rockFill();};
  el.querySelectorAll('.rk-seg button').forEach(b=>b.onclick=()=>{rockStop();ROCK.m=b.dataset.m==='1';rockFill();});
  el.querySelector('.rk-fv').oninput=e=>{ROCK.vol.v=+e.target.value;};el.querySelector('.rk-fb').oninput=e=>{ROCK.vol.b=+e.target.value;};}
 ROCK.el.hidden=false;ROCK.el.classList.remove('out');rockFill();rockPlay();}
function closeRock(){rockStop();if(!ROCK.el)return;ROCK.el.classList.add('out');setTimeout(()=>{if(ROCK.el)ROCK.el.hidden=true;},250);if(S.view==='feed')requestAnimationFrame(()=>activate(currentIx(),true));}
// direct link: #rock opens the rock stage on tattva 1, #rock-3 on tattva 3
(function(){const go=d=>{const m=location.hash.match(/^#rock(?:-([1-8]))?$/);if(m)setTimeout(()=>openRock(+(m[1]||1)),d);};go(600);addEventListener('hashchange',()=>go(50));})();
