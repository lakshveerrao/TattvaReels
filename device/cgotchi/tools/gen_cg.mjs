// Renders the text and line art for Hey Tattva on the Cheeko Gotchi (240x296): verse lines for the two reels,
// akshara tiles and words for the two games, ASCII fonts for dynamic English text, icons, the Sri Yantra and the
// two tattva symbols. Writes PNG layers + manifest; pack_cg.py turns them into ../HeyTattvaCG/assets.h.
// Run: node device/cgotchi/tools/gen_cg.mjs   (PLAYWRIGHT, CHROMIUM, FONTROUTE env vars as for the Waveshare tools)
import fs from 'fs';import path from 'path';import { fileURLToPath } from 'url';
const { chromium } = await import(process.env.PLAYWRIGHT||'playwright');
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../../..'),OUT=path.join(HERE,'out');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const src=f=>fs.readFileSync(path.join(ROOT,'src',f),'utf8');
const app=src('app.js'),IC=app.slice(app.indexOf('const IC={'),app.indexOf('};',app.indexOf('const IC={'))+2);
export const TT=[1,4];
const html=`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Eczar:wght@500;600;700&family=Tiro+Devanagari+Sanskrit&family=Mukta:wght@400;500;600;700&display=block">
<style>html,body{margin:0;background:transparent}#s{position:absolute;left:0;top:0;width:240px;height:296px;color:#fff;font-family:Mukta,sans-serif}#s *{box-sizing:border-box}.hide{visibility:hidden!important}</style></head><body><div id="s"></div>
<script>${src('tattvas.js')}\n${src('vedic.js')}\n${src('arcade/00_words.js')}\n${IC}\nvar LANG=null;</script></body></html>`;
fs.writeFileSync(path.join(OUT,'gen.html'),html);
const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
const ctx=await b.newContext({viewport:{width:240,height:296},deviceScaleFactor:1});
if(process.env.FONTROUTE){const m=await import(process.env.FONTROUTE);await m.fontRoute(ctx);}
const p=await ctx.newPage();p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('file://'+path.join(OUT,'gen.html'));
await p.evaluate(async()=>{for(const f of ['600 20px Eczar','20px "Tiro Devanagari Sanskrit"','500 20px Mukta','600 20px Mukta'])await document.fonts.load(f,'अ a');});
const man=[];let seq=0;
async function shoot(id,clip,extra){const f=`${seq++}.png`;await p.screenshot({path:path.join(OUT,f),omitBackground:true,clip});man.push(Object.assign({id,layers:[{file:f,color:'w'}]},extra||{}));}
async function build(fn,arg){return p.evaluate(([fn,arg])=>{const s=document.getElementById('s');s.innerHTML='';return (0,eval)('('+fn+')')(s,arg);},[fn.toString(),arg]);}
// a block of text, wrapped to w px; returns its height
const block=function(s,a){const e=document.createElement('div');e.style.cssText='position:absolute;left:0;top:0;width:'+a.w+'px;'+a.css;e.textContent=a.t;s.appendChild(e);return Math.ceil(e.getBoundingClientRect().height);};
async function text(id,t,w,css){const h=await build(block,{t,w,css});await shoot(id,{x:0,y:0,width:w,height:Math.max(4,Math.min(296,h+4))});}
// ---- reels: each verse line (Devanagari + IAST) and the meaning lines, plus names ----
const T=await p.evaluate(TT=>TT.map(n=>{const x=TATTVAS[n-1];return{n,name:x.name,dev:x.dev.slice(0,4),iast:x.iast.slice(0,4),en:x.en.slice(0,4),teach:x.teach};}),TT);
for(const x of T){
 for(let k=0;k<4;k++){await text(`LD_${x.n}_${k}`,x.dev[k],216,"font-family:'Tiro Devanagari Sanskrit';font-size:19px;line-height:1.3;text-align:center;overflow-wrap:anywhere");
  await text(`LI_${x.n}_${k}`,x.iast[k],216,"font-family:Eczar;font-weight:500;font-size:13px;line-height:1.25;text-align:center;overflow-wrap:anywhere");
  await text(`LM_${x.n}_${k}`,x.en[k],216,'font-size:15px;line-height:1.3;text-align:center');}
 await text(`TEACH_${x.n}`,x.teach,212,"font-family:Eczar;font-weight:500;font-size:17px;line-height:1.3;text-align:center");}
// ---- games: words and their aksharas for the two tattvas ----
const W=await p.evaluate(TT=>TT.map(n=>({n,words:WORDS.forTattva(n).slice(0,8).map(w=>({iast:w.iast,dev:w.dev,ak:w.ak,mean:w.mean,key:WORDS.isKey(n,w)}))})),TT);
const ak=[];W.forEach(t=>t.words.forEach(w=>w.ak.forEach(a=>{if(!ak.includes(a))ak.push(a);})));
for(const [i,a] of ak.entries()){await build(function(s,a){s.innerHTML='<span style="position:absolute;left:4px;top:0;font-family:\'Tiro Devanagari Sanskrit\';font-size:30px;line-height:1.3;white-space:nowrap"></span>';s.firstChild.textContent=a;},a);await shoot('K_'+i,{x:0,y:0,width:70,height:44});}
for(const t of W)for(const [j,w] of t.words.entries()){await text(`WD_${t.n}_${j}`,w.dev,216,"font-family:'Tiro Devanagari Sanskrit';font-size:20px;line-height:1.3;text-align:center");
 await text(`WM_${t.n}_${j}`,w.iast+' · '+w.mean.replace(/\s*\(.*\)\s*/g,'').trim(),216,'font-size:14px;line-height:1.25;text-align:center');}
// ---- ASCII fonts for dynamic English text ----
for(const [tag,css,size] of [['F14','font-weight:500;font-size:15px',15],['F18','font-weight:600;font-size:19px',19],['F26','font-family:Eczar;font-weight:600;font-size:27px',27],['F48','font-family:Eczar;font-weight:600;font-size:50px',50]]){
 const chars=tag==='F48'?'0123456789:%/ ':Array.from({length:95},(_,i)=>String.fromCharCode(32+i)).join('');
 for(const ch of chars){const r=await build(function(s,a){const e=document.createElement('span');e.style.cssText='position:absolute;left:4px;top:0;white-space:pre;line-height:1.25;'+a[1];e.textContent=a[0];s.appendChild(e);return e.getBoundingClientRect().width;},[ch,css]);
  await shoot(`G_${tag}_${ch.charCodeAt(0)}`,{x:0,y:0,width:Math.ceil(size*1.4)+8,height:Math.ceil(size*1.3)},{adv:r});}}
// ---- icons, yantra, symbols ----
const ICONS={play:'IC.play',pause:'IC.pause',back:'IC.back',right:'IC.right',check:'IC.check',x:'IC.x',chakra:'IC.chakra',diya:'IC.diya',music:'IC.music',lotus:'IC.lotus',
 film:"'<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"14\" rx=\"2.5\"/><path d=\"M10 9.5v5l4.5-2.5Z\" fill=\"#fff\"/>'",
 gear:"'<circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8\"/><circle cx=\"12\" cy=\"12\" r=\"6.6\"/>'",
 wifi:"'<path d=\"M2.5 9a14 14 0 0 1 19 0\"/><path d=\"M5.8 12.6a9 9 0 0 1 12.4 0\"/><path d=\"M9.2 16.1a4.2 4.2 0 0 1 5.6 0\"/><circle cx=\"12\" cy=\"19.3\" r=\"1\" fill=\"#fff\"/>'",
 vol:"'<path d=\"M4 9.5h3.5L12 6v12l-4.5-3.5H4Z\"/><path d=\"M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11\"/>'"};
for(const [k,v] of Object.entries(ICONS)){await build(function(s,a){s.innerHTML='<svg viewBox="0 0 24 24" width="30" height="30" style="position:absolute;left:2px;top:2px;fill:'+(a[1]?'#fff':'none')+';stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">'+eval(a[0])+'</svg>';},[v,k==='play'||k==='pause']);await shoot('I_'+k,{x:0,y:0,width:34,height:34});}
await build(function(s){s.innerHTML='<div style="position:absolute;left:0;top:0;width:200px;height:200px">'+YANTRA.replace('stroke-width="1"','stroke-width="0.9"')+'</div>';const v=s.querySelector('svg');v.setAttribute('width','200');v.setAttribute('height','200');});await shoot('YANTRA',{x:0,y:0,width:200,height:200});
for(const n of TT){await build(function(s,n){s.innerHTML=n===3?'<div style="position:absolute;left:0;top:0;width:36px;height:36px;font-family:\'Tiro Devanagari Sanskrit\';font-size:28px;line-height:36px;text-align:center">ॐ</div>':'<svg viewBox="0 0 24 24" width="36" height="36" style="position:absolute;left:0;top:0;fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round">'+TSYM[n]+'</svg>';},n);await shoot('SYM_'+n,{x:0,y:0,width:36,height:36});}
await build(function(s){s.innerHTML='<div style="position:absolute;left:0;top:0;width:240px;text-align:center;font-family:\'Tiro Devanagari Sanskrit\';font-size:22px;line-height:1.3">हे तत्त्व</div>';});await shoot('BRAND_DEV',{x:0,y:0,width:240,height:34});
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({man,T,W,ak,TT}));
await b.close();console.log('rendered',man.length);
