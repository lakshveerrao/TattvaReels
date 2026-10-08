// Renders everything the device shows as text or line art, using the website's own fonts and content, so Telugu,
// Kannada and Devanagari are shaped correctly. Writes one PNG per colour layer plus a manifest; pack.py turns them
// into 4-bit masks in ../HeyTattva/assets.h.  Run:  node device/tools/gen.mjs  (needs Playwright + Chromium)
// Optional: FONTROUTE=/path/fonts.mjs to serve Google Fonts locally.
import fs from 'fs';import path from 'path';import { fileURLToPath } from 'url';
const PW=process.env.PLAYWRIGHT||'playwright';
const { chromium } = await import(PW);
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../..'),OUT=path.join(HERE,'out');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const src=f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8');
const app=src('app.js'),IC=app.slice(app.indexOf('const IC={'),app.indexOf('};',app.indexOf('const IC={'))+2);

// device-only text, translated (drafted; review with the app's other translations)
const D={
 'Swipe to begin':{te:'మొదలుపెట్టడానికి స్వైప్ చేయండి',kn:'ಆರಂಭಿಸಲು ಸ್ವೈಪ್ ಮಾಡಿ',hi:'शुरू करने के लिए स्वाइप करें'},
 'Recite':{te:'పఠనం',kn:'ಪಠಣ',hi:'पाठ'},'Meaning':{te:'అర్థం',kn:'ಅರ್ಥ',hi:'अर्थ'},'Sing':{te:'పాడండి',kn:'ಹಾಡಿ',hi:'गाएँ'},
 'Listen':{te:'వినండి',kn:'ಕೇಳಿ',hi:'सुनें'},'Stop':{te:'ఆపు',kn:'ನಿಲ್ಲಿಸಿ',hi:'रोकें'},'Verse':{te:'శ్లోకం',kn:'ಶ್ಲೋಕ',hi:'श्लोक'},
 'Remember':{te:'గుర్తుంచుకోండి',kn:'ನೆನಪಿಡಿ',hi:'याद रखें'},'Settings':{te:'సెట్టింగ్స్',kn:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',hi:'सेटिंग्स'},
 'Language':{te:'భాష',kn:'ಭಾಷೆ',hi:'भाषा'},'Brightness':{te:'ప్రకాశం',kn:'ಪ್ರಕಾಶ',hi:'चमक'},'Wi-Fi':{te:'Wi-Fi',kn:'Wi-Fi',hi:'Wi-Fi'},
 'Reset Wi-Fi':{te:'Wi-Fi రీసెట్',kn:'Wi-Fi ಮರುಹೊಂದಿಸಿ',hi:'Wi-Fi रीसेट'},'Open on phone':{te:'ఫోన్‌లో తెరవండి',kn:'ಫೋನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',hi:'फ़ोन पर खोलें'},
 'Scan to open Hey Tattva on your phone':{te:'ఫోన్‌లో హే తత్త్వ తెరవడానికి స్కాన్ చేయండి',kn:'ಫೋನ್‌ನಲ್ಲಿ ಹೇ ತತ್ತ್ವ ತೆರೆಯಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',hi:'फ़ोन पर हे तत्त्व खोलने के लिए स्कैन करें'},
 'Set up Wi-Fi':{te:'Wi-Fi సెటప్',kn:'Wi-Fi ಸೆಟಪ್',hi:'Wi-Fi सेटअप'},
 'On your phone, join this Wi-Fi:':{te:'మీ ఫోన్‌లో ఈ Wi-Fi కి కనెక్ట్ అవ్వండి:',kn:'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಈ Wi-Fi ಗೆ ಸೇರಿ:',hi:'अपने फ़ोन पर इस Wi-Fi से जुड़ें:'},
 'A page opens. Pick your Wi-Fi and type its password.':{te:'ఒక పేజీ తెరుచుకుంటుంది. మీ Wi-Fi ఎంచుకుని పాస్‌వర్డ్ టైప్ చేయండి.',kn:'ಒಂದು ಪುಟ ತೆರೆಯುತ್ತದೆ. ನಿಮ್ಮ Wi-Fi ಆರಿಸಿ ಪಾಸ್‌ವರ್ಡ್ ಟೈಪ್ ಮಾಡಿ.',hi:'एक पेज खुलेगा। अपना Wi-Fi चुनें और पासवर्ड लिखें।'},
 'No page? Open 192.168.4.1':{te:'పేజీ రాలేదా? 192.168.4.1 తెరవండి',kn:'ಪುಟ ಬರಲಿಲ್ಲವೇ? 192.168.4.1 ತೆರೆಯಿರಿ',hi:'पेज नहीं खुला? 192.168.4.1 खोलें'},
 'Connecting…':{te:'కనెక్ట్ అవుతోంది…',kn:'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ…',hi:'जुड़ रहा है…'},'Connected':{te:'కనెక్ట్ అయింది',kn:'ಸಂಪರ್ಕಗೊಂಡಿದೆ',hi:'जुड़ गया'},
 'Couldn’t connect. Opening setup again.':{te:'కనెక్ట్ కాలేదు. మళ్ళీ సెటప్ తెరుస్తోంది.',kn:'ಸಂಪರ್ಕವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಸೆಟಪ್ ತೆರೆಯುತ್ತಿದೆ.',hi:'जुड़ नहीं पाया। सेटअप फिर खुल रहा है।'},
 'No Wi-Fi':{te:'Wi-Fi లేదు',kn:'Wi-Fi ಇಲ್ಲ',hi:'Wi-Fi नहीं'},'Loading voice…':{te:'గొంతు లోడ్ అవుతోంది…',kn:'ಧ್ವನಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',hi:'आवाज़ लोड हो रही है…'},
 'The voice needs Wi-Fi the first time':{te:'మొదటిసారి గొంతుకు Wi-Fi అవసరం',kn:'ಮೊದಲ ಬಾರಿ ಧ್ವನಿಗೆ Wi-Fi ಬೇಕು',hi:'पहली बार आवाज़ के लिए Wi-Fi चाहिए'},
 'Couldn’t load the voice':{te:'గొంతు లోడ్ కాలేదు',kn:'ಧ್ವನಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ',hi:'आवाज़ लोड नहीं हुई'},
 'Score':{te:'స్కోరు',kn:'ಅಂಕ',hi:'अंक'},'Passed!':{te:'పాస్!',kn:'ಉತ್ತೀರ್ಣ!',hi:'पास!'},'Try again':{te:'మళ్ళీ ప్రయత్నించండి',kn:'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',hi:'फिर कोशिश करें'},
 'Sing with the notes':{te:'స్వరాలతో పాడండి',kn:'ಸ್ವರಗಳೊಂದಿಗೆ ಹಾಡಿ',hi:'सुरों के साथ गाएँ'},'Get ready':{te:'సిద్ధంగా ఉండండి',kn:'ಸಿದ್ಧರಾಗಿ',hi:'तैयार हो जाइए'},
 'Listen first, then sing. Any key works.':{te:'ముందు వినండి, తర్వాత పాడండి. ఏ శ్రుతి అయినా సరే.',kn:'ಮೊದಲು ಕೇಳಿ, ನಂತರ ಹಾಡಿ. ಯಾವ ಶ್ರುತಿಯಾದರೂ ಸರಿ.',hi:'पहले सुनें, फिर गाएँ। कोई भी सुर चलेगा।'},
 'Notes hit':{te:'సరైన స్వరాలు',kn:'ಸರಿಯಾದ ಸ್ವರಗಳು',hi:'सही सुर'},
 'Hold BOOT 5 s to reset Wi-Fi':{te:'Wi-Fi రీసెట్‌కు BOOT 5 సె. నొక్కి ఉంచండి',kn:'Wi-Fi ಮರುಹೊಂದಿಸಲು BOOT 5 ಸೆ. ಒತ್ತಿ ಹಿಡಿಯಿರಿ',hi:'Wi-Fi रीसेट के लिए BOOT 5 सेकंड दबाएँ'},
 'Choose your language':{te:'మీ భాష ఎంచుకోండి',kn:'ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ',hi:'अपनी भाषा चुनें'},'Saved. Restarting…':{te:'సేవ్ అయింది. రీస్టార్ట్ అవుతోంది…',kn:'ಉಳಿಸಲಾಗಿದೆ. ಮರುಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ…',hi:'सेव हो गया। फिर से शुरू हो रहा है…'},
 'Tap again to reset':{te:'రీసెట్‌కు మళ్ళీ నొక్కండి',kn:'ಮರುಹೊಂದಿಸಲು ಮತ್ತೆ ಒತ್ತಿ',hi:'रीसेट के लिए फिर दबाएँ'},
 'Use without Wi-Fi':{te:'Wi-Fi లేకుండా వాడండి',kn:'Wi-Fi ಇಲ್ಲದೆ ಬಳಸಿ',hi:'बिना Wi-Fi चलाएँ'},'Tattva':{te:'తత్త్వం',kn:'ತತ್ತ್ವ',hi:'तत्त्व'},
 'The eight tattvas of the Dakṣiṇāmūrti Aṣṭakam':null,'Playing':{te:'వినిపిస్తోంది',kn:'ಕೇಳಿಸುತ್ತಿದೆ',hi:'चल रहा है'},
};
const KEYS=Object.keys(D).filter(k=>D[k]!==null);
const LANGS=['en','te','kn','hi'];
const html=`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Eczar:wght@500;600;700&family=Tiro+Devanagari+Sanskrit&family=Mukta:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Serif+Telugu:wght@500;600&family=Noto+Sans+Kannada:wght@400;600&family=Noto+Serif+Kannada:wght@500;600&display=block">
<style>
html,body{margin:0;background:transparent}
:root{--disp:'Eczar','Noto Serif Telugu','Noto Serif Kannada',serif;--dev:'Tiro Devanagari Sanskrit','Noto Serif Telugu','Noto Serif Kannada',serif;--ui:'Mukta','Noto Sans Telugu','Noto Sans Kannada',sans-serif}
#s{position:absolute;left:0;top:0;width:368px;height:448px;color:#fff;font-family:var(--ui);overflow:hidden}
#s *{box-sizing:border-box}
.hide{visibility:hidden!important}
svg.ic{fill:none;stroke:#fff;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
</style></head><body><div id="s"></div>
<script>${src('tattvas.js')}\n${src('i18n.js')}\n${src('vedic.js')}\n${src('tunes.js')}\n${IC}
const D=${JSON.stringify(D)};
window.setL=l=>{LANG=l==='en'?null:l;};
window.T=s=>{const l=LANG;if(!l)return s;if(D[s]&&D[s][l])return D[s][l];return LX(s);};
</script></body></html>`;
fs.writeFileSync(path.join(OUT,'gen.html'),html);

const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
const ctx=await b.newContext({viewport:{width:368,height:448},deviceScaleFactor:1});
if(process.env.FONTROUTE){const m=await import(process.env.FONTROUTE);await m.fontRoute(ctx);}
const p=await ctx.newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.join(OUT,'gen.html'));await p.evaluate(()=>document.fonts.ready);
await p.evaluate(async()=>{for(const f of ['600 20px Eczar','20px "Tiro Devanagari Sanskrit"','400 20px Mukta','600 20px Mukta','400 20px "Noto Sans Telugu"','600 20px "Noto Serif Telugu"','400 20px "Noto Sans Kannada"','600 20px "Noto Serif Kannada"'])await document.fonts.load(f,'अ అ ಅ a');});
const man=[];let seq=0;
// render the current #s with one layer per colour; each element carries data-c
async function shoot(id,colors,clip){const out=[];
 for(const c of colors){await p.evaluate(c=>{document.querySelectorAll('#s [data-c]').forEach(e=>e.classList.toggle('hide',e.dataset.c!==c));},c);
  const f=`${seq++}.png`;await p.screenshot({path:path.join(OUT,f),omitBackground:true,clip:clip||{x:0,y:0,width:368,height:448}});out.push({file:f,color:c});}
 man.push({id,layers:out,clip:clip||null});}
async function build(fn,arg){return p.evaluate(([fn,arg])=>{const s=document.getElementById('s');s.innerHTML='';return (0,eval)('('+fn+')')(s,arg);},[fn.toString(),arg]);}

// ---- tattva pages: V verse, M meaning, K remember ----
const page=function(s,arg){const [n,kind]=arg;const x=TL(n),D2=(t,c,css)=>{const e=document.createElement('div');e.dataset.c=c;e.style.cssText=css;e.textContent=t;s.appendChild(e);return e;};
 const scr={te:"'Noto Serif Telugu'",kn:"'Noto Serif Kannada'"}[LANG]||'var(--dev)';
 // header: medallion + Tattva N + name
 const med=document.createElement('div');med.dataset.c='gold';med.style.cssText='position:absolute;left:18px;top:38px;width:52px;height:52px;border-radius:50%;border:2px solid #fff;display:grid;place-items:center';
 med.innerHTML=n===3?'<span style="font-family:var(--dev);font-size:30px;line-height:1">ॐ</span>':'<svg viewBox="0 0 24 24" width="32" height="32" style="fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round">'+TSYM[n]+'</svg>';s.appendChild(med);
 D2(T('Tattva')+' '+n,'gold','position:absolute;left:82px;top:33px;font-size:15px;line-height:1.25;font-weight:600;letter-spacing:.04em');
 D2(x.name,'ink','position:absolute;left:82px;top:58px;right:14px;font-family:var(--disp);font-weight:600;font-size:25px;line-height:1.25;white-space:nowrap;overflow:hidden');
 const box=document.createElement('div');box.style.cssText='position:absolute;left:18px;right:22px;top:104px;bottom:86px;display:flex;flex-direction:column;justify-content:center;gap:10px';s.appendChild(box);
 const add=(t,c,css)=>{const e=document.createElement('div');e.dataset.c=c;e.style.cssText=css;e.textContent=t;box.appendChild(e);return e;};
 let fs0;
 if(kind==='V'){fs0=x.roman?19:22;x.verse.forEach((l,i)=>add(l,i===3?'muted':'ink','overflow-wrap:anywhere;font-family:'+(x.roman?'var(--disp)':scr)+';font-style:normal;line-height:1.38;font-size:'+fs0+'px'+(x.roman?';font-weight:500':'')));}
 if(kind==='M'){add(T('Meaning'),'gold','font-size:14px;font-weight:600;letter-spacing:.08em;text-transform:uppercase');fs0=18;x.en.forEach((l,i)=>add(l,i===3?'muted':'ink','font-size:'+fs0+'px;line-height:1.38'));}
 if(kind==='K'){add(T('Remember'),'gold','font-size:14px;font-weight:600;letter-spacing:.08em;text-transform:uppercase');fs0=18;add(x.teach,'ink','font-size:'+fs0+'px;line-height:1.38;font-family:var(--disp);font-weight:500');
  x.keep.forEach(k=>{const e=add('','ink','font-size:16px;line-height:1.35;display:flex;gap:8px');e.innerHTML='<span data-c="gold" style="flex:none">●</span><span data-c="muted">'+k.replace(/[<&]/g,'')+'</span>';e.removeAttribute('data-c');});}
 // shrink until it fits
 let k=1;while(box.scrollHeight>box.clientHeight+1&&k>.55){k-=.04;box.querySelectorAll('div,span').forEach(e=>{const f=parseFloat(e.dataset.f||getComputedStyle(e).fontSize);e.dataset.f=f;e.style.fontSize=(f*k)+'px';});}
 return {k,over:box.scrollHeight>box.clientHeight+1};};
for(const l of LANGS){await p.evaluate(l=>setL(l),l);
 for(let n=1;n<=8;n++)for(const kind of ['V','M','K']){const r=await build(page,[n,kind]);if(r.over||r.k<.7)console.log('fit',l,n,kind,r);await shoot(`P_${l}_${n}_${kind}`,['gold','ink','muted']);}
 // UI strings: each on its own, centred, wrapping inside 330px
 for(const [i,key] of KEYS.entries()){
  await build(function(s,arg){const e=document.createElement('div');e.dataset.c='w';e.style.cssText='position:absolute;left:0;top:0;width:330px;font-size:'+arg[1]+'px;line-height:1.3;font-weight:'+arg[2]+';text-align:center';e.textContent=T(arg[0]);s.appendChild(e);},[key,key.length>34?16:18,600]);
  await shoot(`S_${l}_${i}`,['w'],{x:0,y:0,width:330,height:120});}
 // big title for the language screen etc.
}
await p.evaluate(()=>setL('en'));
// language names
for(const [i,L] of [['en','English'],['te','తెలుగు'],['kn','ಕನ್ನಡ'],['hi','हिन्दी']].entries()){
 await build(function(s,a){const e=document.createElement('div');e.dataset.c='w';e.style.cssText='position:absolute;left:0;top:0;font-size:26px;font-weight:600;font-family:var(--ui)';e.textContent=a;s.appendChild(e);},L[1]);await shoot('LANG_'+i,['w'],{x:0,y:0,width:200,height:50});}
// brand
await build(function(s){s.innerHTML='<div data-c="w" style="position:absolute;left:0;top:0;width:368px;text-align:center;font-family:var(--disp);font-weight:600;font-size:46px;line-height:1">Hey Tattva</div>';});await shoot('BRAND',['w'],{x:0,y:0,width:368,height:60});
await build(function(s){s.innerHTML='<div data-c="w" style="position:absolute;left:0;top:0;width:368px;text-align:center;font-family:var(--dev);font-size:26px;line-height:1.3">हे तत्त्व</div>';});await shoot('BRAND_DEV',['w'],{x:0,y:0,width:368,height:44});
await build(function(s){s.innerHTML='<div data-c="w" style="position:absolute;left:0;top:0;width:368px;text-align:center;font-size:15px;letter-spacing:.06em">Dakṣiṇāmūrti Aṣṭakam</div>';});await shoot('BRAND_SUB',['w'],{x:0,y:0,width:368,height:26});
await build(function(s){s.innerHTML='<div data-c="w" style="position:absolute;left:0;top:0;width:368px;text-align:center;font-family:var(--dev);font-size:64px;line-height:1">ॐ</div>';});await shoot('OM',['w'],{x:0,y:0,width:368,height:80});
// ASCII glyphs (dynamic text: Wi-Fi names, numbers) in two sizes, and big clock digits
for(const [tag,size,w] of [['A16',17,500],['A24',26,600],['D64',76,600]]){const chars=tag==='D64'?'0123456789:%':Array.from({length:95},(_,i)=>String.fromCharCode(32+i)).join('');
 for(const ch of chars){const r=await build(function(s,a){const e=document.createElement('span');e.dataset.c='w';e.style.cssText='position:absolute;left:4px;top:0;white-space:pre;font-family:'+(a[3]?'var(--disp)':'var(--ui)')+';font-size:'+a[1]+'px;font-weight:'+a[2]+';line-height:1.25';e.textContent=a[0];s.appendChild(e);return e.getBoundingClientRect().width;},[ch,size,w,tag==='D64']);
  await shoot(`G_${tag}_${ch.charCodeAt(0)}`,['w'],{x:0,y:0,width:Math.ceil(size*1.4)+8,height:Math.ceil(size*1.3)});man[man.length-1].adv=r;}}
// icons
const ICONS={play:'IC.play',stop:"'<rect x=\"6.5\" y=\"6.5\" width=\"11\" height=\"11\" rx=\"2\"/>'",mic:'IC.mic',book:'IC.book',chakra:'IC.chakra',globe:'IC.globe',back:'IC.back',right:'IC.right',check:'IC.check',x:'IC.x',
 gear:"'<circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8\"/><circle cx=\"12\" cy=\"12\" r=\"6.6\"/>'",
 wifi:"'<path d=\"M2.5 9a14 14 0 0 1 19 0\"/><path d=\"M5.8 12.6a9 9 0 0 1 12.4 0\"/><path d=\"M9.2 16.1a4.2 4.2 0 0 1 5.6 0\"/><circle cx=\"12\" cy=\"19.3\" r=\"1\" fill=\"#fff\"/>'",
 sun:"'<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6\"/>'",
 qr:"'<rect x=\"3.5\" y=\"3.5\" width=\"6.5\" height=\"6.5\" rx=\"1\"/><rect x=\"14\" y=\"3.5\" width=\"6.5\" height=\"6.5\" rx=\"1\"/><rect x=\"3.5\" y=\"14\" width=\"6.5\" height=\"6.5\" rx=\"1\"/><path d=\"M14 14h3v3h-3zM18 18h2.5v2.5M14 20.5h1\"/>'",
 home:"'<path d=\"M4 11 12 4l8 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z\"/>'",music:'IC.music',diya:'IC.diya'};
for(const [k,v] of Object.entries(ICONS)){await build(function(s,a){s.innerHTML='<svg data-c="w" class="ic" viewBox="0 0 24 24" width="34" height="34" style="position:absolute;left:2px;top:2px'+(a[1]?';fill:#fff':'')+'">'+eval(a[0])+'</svg>';},[v,k==='play']);await shoot('I_'+k,['w'],{x:0,y:0,width:38,height:38});}
// Sri Yantra for the turning logo (big) and the 8 tattva symbols for the home ring
await build(function(s){s.innerHTML='<div data-c="w" style="position:absolute;left:0;top:0;width:300px;height:300px;color:#fff">'+YANTRA.replace('stroke-width="1"','stroke-width="0.85"')+'</div>';s.querySelector('svg').setAttribute('width','300');s.querySelector('svg').setAttribute('height','300');});await shoot('YANTRA',['w'],{x:0,y:0,width:300,height:300});
for(let n=1;n<=8;n++){await build(function(s,n){s.innerHTML=n===3?'<div data-c="w" style="position:absolute;left:0;top:0;width:40px;height:40px;font-family:var(--dev);font-size:30px;line-height:40px;text-align:center">ॐ</div>':'<svg data-c="w" viewBox="0 0 24 24" width="40" height="40" style="position:absolute;left:0;top:0;fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round">'+TSYM[n]+'</svg>';},n);await shoot('SYM_'+n,['w'],{x:0,y:0,width:40,height:40});}
// tune syllables for the Sing lane (Devanagari, deduplicated)
const syl=await p.evaluate(()=>{const u=[];for(let v=1;v<=8;v++)for(const x of TUNES[v].n)if(u.indexOf(x[3])<0)u.push(x[3]);return u;});
for(const [i,t] of syl.entries()){await build(function(s,a){s.innerHTML='<span data-c="w" style="position:absolute;left:2px;top:0;font-family:var(--dev);font-size:19px;line-height:1.3;white-space:nowrap"></span>';s.firstChild.textContent=a;},t);await shoot('Y_'+i,['w'],{x:0,y:0,width:72,height:30});}
const tunes=await p.evaluate(()=>{const o={};for(let v=1;v<=8;v++){const t=TUNES[v];o[v]={bpm:t.bpm,total:t.total,n:t.n.map(x=>[x[0],x[1],x[2],x[3]])};}return o;});
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({man,keys:KEYS,syl,tunes}));
await b.close();console.log('rendered',man.length,'items');
