/* ---------- games: make a tattva game, share a join code, play live together ---------- */
const SB_URL='https://uodkcmhoszjlgxowkucw.supabase.co',SB_KEY='sb_publishable_ZZxIRgg3b8amPGJzQz1r0g_v_1zdIsc';
const GTYPES={quiz:{name:'Tattva quiz',blurb:'Questions on the verse and its meaning. Fastest right answer scores most.',icon:'book'},
 puzzle:{name:'Shloka puzzle race',blurb:'The verse is scrambled into tiles. Race to put each line back in order.',icon:'remix'}};
const THEMES={Gold:['#2a1a08','#E9B44C'],Lotus:['#2a0b1e','#FF8FB1'],Night:['#0b1030','#8FB4FF'],Ember:['#2a0c06','#FF7A45']};
const CODE_AB='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GS={games:[],loaded:false,local:false,live:null,me:LS.get('tr-pid',null)};
if(!GS.me||!/^p[a-z0-9]{8}$/.test(GS.me)){GS.me='p'+Math.random().toString(36).slice(2,10).padEnd(8,'0');LS.set('tr-pid',GS.me);}
const myName=()=>S.user&&S.user.handle?S.user.handle:(LS.get('tr-gname','')||'');
function rngOf(seed){const r=mulberry32(seed>>>0);return r;}
function shuf(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function cleanGame(g){if(!g||typeof g!=='object'||!/^g[a-z0-9]{6,24}$/.test(g.id||''))return null;const s=g.settings||{};
 return{id:g.id,name:String(g.name||'seeker').slice(0,24),title:String(g.title||'').slice(0,60)||('Tattva '+g.tattva),type:g.type==='puzzle'?'puzzle':'quiz',tattva:Math.min(8,Math.max(1,+g.tattva||1)),
  settings:{count:+s.count||8,secs:+s.secs||15,lines:+s.lines||4,hard:!!s.hard,theme:THEMES[s.theme]?s.theme:'Gold',seed:+s.seed||1},plays:+g.plays||0,createdAt:+g.createdAt||0};}

/* ---------- content: questions and puzzles, generated from the verse with the game's seed so every phone sees the same ---------- */
function quizQs(g){const r=rngOf(g.settings.seed),V=TATTVAS[g.tattva-1],pick=a=>a[Math.floor(r()*a.length)];
 const W=V.words.filter(w=>w[0]!=='namaḥ'),others=TATTVAS.filter(t=>t.n!==V.n),strip=s=>s.replace(/[।॥]/g,'').trim();
 const gens=[
  ()=>{const w=pick(W);return{q:'What does “'+w[0]+'” mean?',o:[w[1]].concat(shuf(W.filter(x=>x!==w),r).slice(0,3).map(x=>x[1])),k:'m'+w[0]};},
  ()=>{const w=pick(W);return{q:'Which word means “'+w[1]+'”?',o:[w[0]].concat(shuf(W.filter(x=>x!==w),r).slice(0,3).map(x=>x[0])),k:'w'+w[0],it:1};},
  ()=>{const li=Math.floor(r()*3),ws=strip(V.dev[li]).split(/\s+/);if(ws.length<2)return null;const k=Math.floor(r()*ws.length),ans=ws[k];
   const pool=shuf([...new Set(V.dev.slice(0,3).map(strip).join(' ').split(/\s+/))].filter(x=>x&&x!==ans),r);if(pool.length<3)return null;
   return{q:'Fill the gap in line '+(li+1),line:ws.map((x,i)=>i===k?'_____':x).join(' '),o:[ans].concat(pool.slice(0,3)),k:'g'+li+k,dv:1};},
  ()=>({q:'What does this tattva teach?',o:[V.teach].concat(shuf(others,r).slice(0,3).map(t=>t.teach)),k:'t',sm:1}),
  ()=>{const li=Math.floor(r()*3);return{q:'This line comes from which tattva?',line:strip(V.dev[li]),o:[V.name].concat(shuf(others,r).slice(0,3).map(t=>t.name)),k:'n'+li};}];
 const out=[],seen=new Set();let guard=0;
 while(out.length<g.settings.count&&guard++<200){const q=gens[Math.floor(r()*gens.length)]();if(!q||seen.has(q.k))continue;seen.add(q.k);
  const ord=shuf([0,1,2,3],r);q.opts=ord.map(i=>q.o[i]);q.ans=ord.indexOf(0);delete q.o;out.push(q);}
 return out;}
function puzzleLines(g){const r=rngOf(g.settings.seed),V=TATTVAS[g.tattva-1],n=g.settings.lines===2?2:4,out=[];
 for(let li=0;li<n;li++){const tiles=V.iast[li].split(/[\s-]+/).filter(Boolean);let deco=[];
  if(g.settings.hard){const pool=TATTVAS.filter(t=>t.n!==V.n).flatMap(t=>t.iast[0].split(/[\s-]+/));deco=shuf(pool,r).slice(0,2);}
  const all=tiles.map((t,i)=>({t,i})).concat(deco.map(t=>({t,i:-1})));out.push({dev:V.dev[li],en:V.en[li],tiles,deck:shuf(all,r)});}
 return out;}

/* ---------- live transport: Supabase Realtime broadcast + presence (a local relay can stand in for tests via ?live=ws://…) ---------- */
let sbLoad=null;
function loadSB(){if(window.supabase)return Promise.resolve();if(sbLoad)return sbLoad;sbLoad=new Promise((ok,no)=>{const s=document.createElement('script');s.src='/vendor/supabase.min.js';s.onload=ok;s.onerror=()=>{sbLoad=null;no(new Error('load'));};document.head.appendChild(s);});return sbLoad;}
let sbClient=null;
function sbc(){if(!sbClient)sbClient=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:false,autoRefreshToken:false},realtime:{params:{eventsPerSecond:30}}});return sbClient;}
async function liveOpen(code,me,h){
 const wsu=new URLSearchParams(location.search).get('live');
 if(wsu&&/^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(wsu)){const ws=new WebSocket(wsu);let open=false;
  ws.onopen=()=>{open=true;ws.send(JSON.stringify({join:code,me}));h.ready();};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.presence)h.presence(m.presence);else if(m.m)h.msg(m.m);};ws.onclose=()=>{if(open)h.lost();};ws.onerror=()=>{if(!open)h.fail();};
  return{send:m=>{if(ws.readyState===1)ws.send(JSON.stringify({m}));},track:x=>{if(ws.readyState===1)ws.send(JSON.stringify({track:x}));},close:()=>{open=false;try{ws.close();}catch(e){}}};}
 await loadSB();const cl=sbc();
 const ch=cl.channel('tr-room-'+code,{config:{broadcast:{self:false},presence:{key:me.pid}}});let joined=false;
 ch.on('broadcast',{event:'m'},({payload})=>h.msg(payload));
 ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState();h.presence(Object.keys(st).map(k=>st[k][0]).filter(Boolean));});
 ch.subscribe(async s=>{if(s==='SUBSCRIBED'){joined=true;try{await ch.track(me);}catch(e){}h.ready();}else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT'){if(joined)h.lost();else h.fail();}});
 return{send:m=>{ch.send({type:'broadcast',event:'m',payload:m});},track:x=>{if(joined)ch.track(x).catch(()=>{});},close:()=>{try{cl.removeChannel(ch);}catch(e){}}};}

/* ---------- a game room: the host's phone is the referee; everyone (host included) plays ---------- */
function newCode(){let c='';for(let i=0;i<6;i++)c+=CODE_AB[Math.floor(Math.random()*CODE_AB.length)];return c;}
function startRoom(opts){closeRoom();
 const R=GS.live={code:opts.code||null,host:!!opts.host,solo:!!opts.solo,g:opts.g||null,phase:'lobby',qi:-1,deadline:0,players:{},online:{},answers:{},my:{c:null},prog:{},t:null,net:null,lastState:0,startAt:0,stateSeq:0};
 if(R.g){R.qs=R.g.type==='quiz'?quizQs(R.g):null;R.lines=R.g.type==='puzzle'?puzzleLines(R.g):null;}
 R.players[GS.me]={pid:GS.me,name:opts.name,score:0,streak:0,delta:0,ok:null};
 showView('play');paintPlay();
 if(R.solo){R.host=true;hostBegin();return;}
 const me={pid:GS.me,name:opts.name};$('#pl-net').textContent='Connecting…';
 liveOpen(R.code,me,{ready:()=>{if(GS.live!==R)return;$('#pl-net').textContent='';if(!R.host)send({e:'hello',pid:GS.me,name:opts.name});else{broadcastState(true);announce(R);}},
  fail:()=>{if(GS.live!==R)return;$('#pl-net').textContent='';playMsg('Couldn’t connect to the live room. Check your connection and try again.');},
  lost:()=>{if(GS.live!==R)return;$('#pl-net').textContent='Reconnecting…';},
  presence:list=>{if(GS.live!==R)return;R.online={};list.forEach(p=>{if(p&&p.pid)R.online[p.pid]=p.name;});announce(R);if(R.host){list.forEach(p=>{if(p&&p.pid&&!R.players[p.pid])R.players[p.pid]={pid:p.pid,name:String(p.name||'player').slice(0,24),score:0,streak:0,delta:0,ok:null};});broadcastState(true);}paintPlay();},
  msg:m=>{if(GS.live===R)onMsg(R,m);}}).then(n=>{if(GS.live===R)R.net=n;else n.close();}).catch(()=>{if(GS.live===R)playMsg('Couldn’t load live play. Check your connection.');});
 R.t=setInterval(()=>tick(R),200);}
function closeRoom(){const R=GS.live;if(!R)return;clearInterval(R.t);clearInterval(R.anim);if(R.net)R.net.close();if(R.ann)R.ann.close();GS.live=null;}
/* public lobby: every live room is listed here, so anyone on the site can join without a code */
function roomInfo(R){return{pid:'room-'+R.code,code:R.code,gid:R.g.id,title:R.g.title,type:R.g.type,tattva:R.g.tattva,n:Object.keys(R.online).length||1,phase:R.phase,host:(R.players[GS.me]||{}).name||''};}
function announce(R){if(!R.host||R.solo||!R.g||!R.code)return;const info=roomInfo(R),k=JSON.stringify(info);
 if(R.ann){if(k!==R.annKey){R.annKey=k;R.ann.track(info);}return;}if(R.annPending)return;R.annPending=true;
 liveOpen('LOBBY',info,{ready:()=>{if(GS.live===R&&R.ann){R.annKey=JSON.stringify(roomInfo(R));R.ann.track(roomInfo(R));}},fail:()=>{R.annPending=false;},lost:()=>{},presence:()=>{},msg:()=>{}})
  .then(n=>{if(GS.live===R){R.ann=n;R.annKey=JSON.stringify(roomInfo(R));n.track(roomInfo(R));}else n.close();}).catch(()=>{R.annPending=false;});}
const LOBBY={net:null,rooms:[],on:false};
function watchLobby(on){if(on===LOBBY.on)return;LOBBY.on=on;if(!on){if(LOBBY.net)LOBBY.net.close();LOBBY.net=null;return;}
 liveOpen('LOBBY',{pid:GS.me,watch:1},{ready:()=>{},fail:()=>{},lost:()=>{},msg:()=>{},presence:list=>{LOBBY.rooms=list.filter(x=>x&&x.code&&x.gid&&/^[A-Z0-9]{6}$/.test(x.code)&&x.phase!=='done');paintLive();if(GS.loaded&&LOBBY.rooms.some(r=>!GS.games.find(g=>g.id===r.gid))&&Date.now()-(LOBBY.reload||0)>8000){LOBBY.reload=Date.now();loadGames();}}})
  .then(n=>{if(LOBBY.on)LOBBY.net=n;else n.close();}).catch(()=>{});}
function paintLive(){gamesEl.querySelectorAll('.gcard').forEach(el=>{const id=el.id.slice(2),box=el.querySelector('.glive');if(!box)return;const rs=LOBBY.rooms.filter(r=>r.gid===id);
  if(!rs.length){box.hidden=true;box.innerHTML='';return;}box.hidden=false;
  box.innerHTML=rs.slice(0,3).map(r=>'<button class="btn joinlive" data-code="'+esc(r.code)+'"><span class="dot"></span><span>Join '+esc(r.host||'a')+'’s game</span><small>'+(r.phase==='lobby'?'waiting':'playing')+' · '+(+r.n||1)+' in</small></button>').join('');
  box.querySelectorAll('.joinlive').forEach(b=>b.onclick=()=>askName(name=>startRoom({code:b.dataset.code,name})));});
 const live=LOBBY.rooms.length,pill=$('#gx-live');if(pill){pill.hidden=!live;pill.textContent=live+' live';}}
function send(m){const R=GS.live;if(R&&R.net)R.net.send(m);}
function playMsg(t){const R=GS.live;if(R){R.err=t;paintPlay();}}
function onMsg(R,m){
 if(m.e==='state'&&!R.host){if(m.seq<R.stateSeq)return;R.stateSeq=m.seq;const fresh=!R.g||R.g.id!==m.g.id;R.g=cleanGame(m.g);if(fresh||!R.qs&&!R.lines){R.qs=R.g.type==='quiz'?quizQs(R.g):null;R.lines=R.g.type==='puzzle'?puzzleLines(R.g):null;}
  const newQ=m.phase!==R.phase||m.qi!==R.qi;R.players={};m.players.forEach(p=>R.players[p.pid]=p);R.prog=m.prog||{};
  if(newQ){if(m.phase==='q'){R.my={c:null};}if(m.phase==='q'||m.phase==='race')R.deadline=Date.now()+m.rem;if(m.phase==='race'&&R.phase!=='race')R.pz=null;}
  R.phase=m.phase;R.qi=m.qi;R.over=m.over||null;paintPlay(newQ);return;}
 if(!R.host)return;
 if(m.e==='hello'){if(!R.players[m.pid])R.players[m.pid]={pid:m.pid,name:String(m.name||'player').replace(/[<>]/g,'').slice(0,24),score:0,streak:0,delta:0,ok:null};broadcastState(true);paintPlay();}
 else if(m.e==='ans'&&R.phase==='q'&&m.qi===R.qi&&R.players[m.pid]&&!R.answers[m.pid]){R.answers[m.pid]={c:+m.c,ms:Math.max(0,+m.ms||0)};maybeReveal(R);paintPlay();}
 else if(m.e==='prog'&&R.phase==='race'&&R.players[m.pid]){R.prog[m.pid]={line:+m.line||0,done:!!m.done,ms:+m.ms||0};broadcastState();maybeEndRace(R);paintPlay();}}
function snapshot(R){return Object.values(R.players).map(p=>({pid:p.pid,name:p.name,score:p.score,streak:p.streak,delta:p.delta,ok:p.ok}));}
function broadcastState(force){const R=GS.live;if(!R||!R.host||R.solo)return;announce(R);const now=Date.now();if(!force&&now-R.lastState<300)return;R.lastState=now;
 send({e:'state',seq:++R.stateSeq,g:R.g,phase:R.phase,qi:R.qi,rem:Math.max(0,R.deadline-now),players:snapshot(R),prog:R.prog,over:R.over||null});}
function tick(R){if(GS.live!==R)return;const now=Date.now();
 if(R.host){if(R.phase==='q'&&now>=R.deadline)reveal(R);else if(R.phase==='reveal'&&now>=R.nextAt)nextQ(R);else if(R.phase==='race'&&now>=R.deadline)endRace(R);
  if(now-R.lastState>2000)broadcastState(true);}
 paintTimer();}
function hostBegin(){const R=GS.live;if(!R||!R.host)return;Object.values(R.players).forEach(p=>{p.score=0;p.streak=0;p.delta=0;p.ok=null;});R.prog={};R.over=null;
 if(!R.solo&&R.g)API('/api/games',{method:'POST',body:JSON.stringify({played:R.g.id})}).catch(()=>{});
 if(R.g.type==='quiz'){R.qi=-1;nextQ(R);}else{R.phase='race';R.pz=null;R.deadline=Date.now()+(R.g.settings.lines===2?75:140)*1000;broadcastState(true);paintPlay(true);}
 if(R.solo&&!R.t)R.t=setInterval(()=>tick(R),200);}
function nextQ(R){R.qi++;if(R.qi>=R.qs.length){R.phase='done';broadcastState(true);paintPlay(true);return;}R.phase='q';R.answers={};R.my={c:null};R.deadline=Date.now()+R.g.settings.secs*1000;Object.values(R.players).forEach(p=>{p.delta=0;p.ok=null;});broadcastState(true);paintPlay(true);}
function maybeReveal(R){const ids=Object.keys(R.players).filter(id=>R.solo||R.online[id]||id===GS.me);if(ids.every(id=>R.answers[id]))reveal(R);}
function reveal(R){if(R.phase!=='q')return;const q=R.qs[R.qi],T=R.g.settings.secs*1000;
 Object.values(R.players).forEach(p=>{const a=R.answers[p.pid];if(a&&a.c===q.ans){p.streak++;p.delta=Math.round(500+500*Math.max(0,1-a.ms/T))+(p.streak>=3?100:0);p.score+=p.delta;p.ok=true;}else{p.streak=0;p.delta=0;p.ok=a?false:null;}});
 R.phase='reveal';R.nextAt=Date.now()+4200;broadcastState(true);paintPlay(true);}
function answer(c){const R=GS.live;if(!R||R.phase!=='q'||R.my.c!=null)return;const ms=R.g.settings.secs*1000-Math.max(0,R.deadline-Date.now());R.my={c,ms};
 if(R.host){R.answers[GS.me]={c,ms};maybeReveal(R);}else send({e:'ans',pid:GS.me,qi:R.qi,c,ms});paintPlay();}
function maybeEndRace(R){const ids=Object.keys(R.players).filter(id=>R.solo||R.online[id]||id===GS.me);if(ids.length&&ids.every(id=>R.prog[id]&&R.prog[id].done))endRace(R);}
function endRace(R){if(R.phase!=='race')return;const L=R.lines.length;
 const rank=Object.values(R.players).map(p=>({p,pr:R.prog[p.pid]||{line:0,ms:1e9}})).sort((a,b)=>b.pr.line-a.pr.line||a.pr.ms-b.pr.ms);
 rank.forEach((x,i)=>{x.p.delta=x.pr.line*150+(x.pr.line>=L?Math.max(0,1000-i*200):0);x.p.score=x.p.delta;});R.phase='done';broadcastState(true);paintPlay(true);}
function sendProg(){const R=GS.live,pz=R.pz;const pr={line:pz.line,done:pz.line>=R.lines.length,ms:Date.now()-pz.t0+pz.pen};
 if(R.host){R.prog[GS.me]=pr;broadcastState();maybeEndRace(R);}else send(Object.assign({e:'prog',pid:GS.me},pr));}

/* ---------- play screen ---------- */
function ranked(R){return Object.values(R.players).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));}
function paintTimer(){const R=GS.live,el=$('#pl-timer');if(!R||!el)return;const on=R.phase==='q'||R.phase==='race';el.hidden=!on;if(!on)return;
 const tot=R.phase==='q'?R.g.settings.secs*1000:(R.g.settings.lines===2?75:140)*1000,rem=Math.max(0,R.deadline-Date.now());el.querySelector('b').textContent=Math.ceil(rem/1000);el.style.setProperty('--p',(rem/tot).toFixed(3));}
function paintPlay(anim){const R=GS.live,box=$('#pl-body');if(!R||!box)return;const g=R.g,th=g?THEMES[g.settings.theme]:THEMES.Gold;
 $('#v-play').style.setProperty('--th',th[1]);$('#v-play').style.setProperty('--thb',th[0]);
 $('#pl-title').textContent=g?g.title:'Joining…';$('#pl-code').hidden=R.solo||!R.code;$('#pl-code').innerHTML='<span>Code</span><b>'+esc(R.code||'')+'</b>';
 if(R.err){box.innerHTML='<div class="pl-card"><p class="note">'+esc(R.err)+'</p><button class="btn gold" id="pl-x2">Back to games</button></div>';$('#pl-x2').onclick=()=>{closeRoom();showView('games');};return;}
 if(!g){box.innerHTML='<div class="pl-card pl-wait"><span class="spin"></span><p class="note">Waiting for the host…</p></div>';return;}
 const n=Object.keys(R.players).length;
 if(R.phase==='lobby'){const url=location.origin+'/#join-'+R.code;
  box.innerHTML='<div class="pl-card"><p class="eyebrow">'+esc(GTYPES[g.type].name)+' · Tattva '+g.tattva+'</p><h2 class="sh-title">'+esc(TATTVAS[g.tattva-1].name)+'</h2>'+
   (R.host?'<p class="note">Friends open Tattva Reels, tap <b>Games → Join</b> and type the code. Or send them the link.</p><div class="bigcode">'+esc(R.code)+'</div><button class="btn line" id="pl-share">'+ico('share')+'Share join link</button>':'<p class="note">You’re in. The host will start the game.</p>')+
   '<p class="lab">Players · '+n+'</p><div class="pl-players">'+Object.values(R.players).map(p=>'<span class="pchip'+(p.pid===GS.me?' me':'')+'">'+esc(p.name)+'</span>').join('')+'</div>'+
   (R.host?'<button class="btn gold" id="pl-start">'+(n<2?'Start (you can play alone)':'Start game')+'</button>':'<div class="pl-wait"><span class="spin"></span></div>')+'</div>';
  if(R.host){$('#pl-start').onclick=hostBegin;$('#pl-share').onclick=()=>{if(navigator.share)navigator.share({title:g.title,text:'Join my Tattva game. Code '+R.code,url}).catch(()=>{});else{try{navigator.clipboard.writeText(url);toast('Join link copied');}catch(e){toast(url);}}};}
  return;}
 if(g.type==='quiz'&&(R.phase==='q'||R.phase==='reveal')){const q=R.qs[R.qi],rv=R.phase==='reveal',me=R.players[GS.me]||{};
  const cols=['c0','c1','c2','c3'],sh=['◆','●','▲','■'];
  box.innerHTML='<div class="qhead"><span class="lab">Question '+(R.qi+1)+' of '+R.qs.length+'</span><span class="lab">'+(R.phase==='q'?Object.keys(R.answers||{}).length&&R.host?Object.keys(R.answers).length+' of '+n+' answered':'':'')+'</span></div>'+
   '<h2 class="qtext">'+esc(q.q)+'</h2>'+(q.line?'<p class="qline">'+esc(q.line)+'</p>':'')+
   '<div class="opts'+(q.sm?' small':'')+'">'+q.opts.map((o,i)=>{const cls=['opt',cols[i]];if(R.my.c===i)cls.push('picked');if(rv){cls.push(i===q.ans?'right':'dim');}return '<button class="'+cls.join(' ')+'" data-i="'+i+'"'+(R.my.c!=null||rv?' disabled':'')+'><span class="sh">'+sh[i]+'</span><span class="ot'+(q.it?' it':'')+(q.dv?' dv':'')+'">'+esc(o)+'</span></button>';}).join('')+'</div>'+
   (rv?'<div class="rv '+(me.ok?'ok':'no')+'">'+(me.ok?ico('check')+'<b>+'+me.delta+'</b>'+(me.streak>=3?'<span>streak '+me.streak+'</span>':''):me.ok===false?'<b>Not this time</b>':'<b>Time’s up</b>')+'</div>'+miniBoard(R):R.my.c!=null?'<p class="note pl-wait"><span class="spin"></span> Locked in. Waiting for the others…</p>':'');
  box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.i));if(anim)box.classList.remove('pop'),void box.offsetWidth,box.classList.add('pop');return;}
 if(g.type==='puzzle'&&R.phase==='race'){if(!R.pz)R.pz={line:0,pos:0,t0:Date.now(),pen:0,used:{}};const key='pz'+R.pz.line+'.'+R.pz.pos;if(!anim&&box.dataset.k===key&&box.querySelector('.race')){box.querySelector('.race').innerHTML=raceRows(R);return;}box.dataset.k=key;paintPuzzle(R,box);return;}
 box.dataset.k='';
 if(R.phase==='done'){const rk=ranked(R),podium=rk.slice(0,3);
  box.innerHTML='<div class="pl-card"><p class="eyebrow">Final scores</p><div class="podium">'+[1,0,2].filter(i=>podium[i]).map(i=>'<div class="pod p'+(i+1)+'"><span class="pn">'+esc(podium[i].name)+'</span><span class="ps">'+fmt(podium[i].score)+'</span><i>'+(i+1)+'</i></div>').join('')+'</div>'+
   '<div class="board">'+rk.map((p,i)=>'<div class="brow'+(p.pid===GS.me?' me':'')+'"><span class="rk">'+(i+1)+'</span><span class="bn">'+esc(p.name)+'</span><b>'+fmt(p.score)+'</b></div>').join('')+'</div>'+
   '<p class="note">'+esc(TATTVAS[g.tattva-1].teach)+'</p>'+
   (R.host?'<div class="row2"><button class="btn line" id="pl-again">'+ico('replay')+'Play again</button><button class="btn gold" id="pl-done">Done</button></div>':'<button class="btn gold" id="pl-done">Done</button>')+'</div>';
  if(R.host)$('#pl-again').onclick=()=>{R.phase='lobby';R.qi=-1;Object.values(R.players).forEach(p=>{p.score=0;p.delta=0;p.ok=null;p.streak=0;});if(R.solo){hostBegin();}else{broadcastState(true);paintPlay();}};
  $('#pl-done').onclick=()=>{closeRoom();showView('games');};return;}
 box.innerHTML='<div class="pl-card pl-wait"><span class="spin"></span></div>';}
function miniBoard(R){return '<div class="board mini">'+ranked(R).slice(0,5).map((p,i)=>'<div class="brow'+(p.pid===GS.me?' me':'')+'"><span class="rk">'+(i+1)+'</span><span class="bn">'+esc(p.name)+'</span>'+(p.delta?'<span class="dl">+'+p.delta+'</span>':'')+'<b>'+fmt(p.score)+'</b></div>').join('')+'</div>';}
function raceRows(R){const pz=R.pz,L=R.lines;return Object.values(R.players).map(p=>{const pr=p.pid===GS.me?{line:pz.line,done:pz.line>=L.length}:(R.prog[p.pid]||{line:0});return '<div class="prow'+(p.pid===GS.me?' me':'')+'"><span class="bn">'+esc(p.name)+'</span><i><b style="width:'+Math.round(100*pr.line/L.length)+'%"></b></i>'+(pr.done?ico('check'):'<span class="lab">'+pr.line+'/'+L.length+'</span>')+'</div>';}).join('');}
function paintPuzzle(R,box){const pz=R.pz,L=R.lines,g=R.g,others=raceRows(R);box.dataset.k='pz'+pz.line+'.'+pz.pos;
 if(pz.line>=L.length){box.innerHTML='<div class="pl-card"><p class="eyebrow">All lines in place</p><div class="shloka">'+L.map(l=>'<div class="ln"><span class="dev">'+esc(l.dev)+'</span></div>').join('')+'</div><p class="lab">Race</p><div class="race">'+others+'</div><p class="note pl-wait"><span class="spin"></span> Waiting for the others…</p></div>';return;}
 const ln=L[pz.line];
 box.innerHTML='<div class="qhead"><span class="lab">Line '+(pz.line+1)+' of '+L.length+'</span></div>'+
  (g.settings.hard?'':'<p class="qhint">'+esc(ln.en)+'</p>')+
  '<div class="built">'+ln.tiles.slice(0,pz.pos).map(t=>'<span class="bt">'+esc(t)+'</span>').join('')+'<span class="caret"></span></div>'+
  '<div class="tiles">'+ln.deck.map((d,k)=>'<button class="tile'+(pz.used[k]?' used':'')+'" data-k="'+k+'"'+(pz.used[k]?' disabled':'')+'>'+esc(d.t)+'</button>').join('')+'</div>'+
  '<p class="lab">Race</p><div class="race">'+others+'</div>';
 box.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{const k=+b.dataset.k,d=ln.deck[k];
  if(d.t===ln.tiles[pz.pos]){pz.used[k]=1;pz.pos++;
   if(pz.pos>=ln.tiles.length){pz.line++;pz.pos=0;pz.used={};toast(pz.line>=L.length?'Done!':'Line '+pz.line+' in place');sendProg();if(GS.live!==R||R.phase!=='race')return;}
   paintPuzzle(R,box);}
  else{pz.pen+=2000;b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');if(navigator.vibrate)navigator.vibrate(60);}});}

/* ---------- games feed ---------- */
const gamesEl=$('#games');
async function loadGames(){
 try{const j=await API('/api/games');GS.local=false;GS.games=(j.games||[]).map(cleanGame).filter(Boolean);}
 catch(e){GS.local=true;GS.games=LS.get('tr-games',[]).map(cleanGame).filter(Boolean);}
 GS.loaded=true;renderGames();}
function renderGames(){gamesEl.innerHTML='';setTimeout(paintLive,0);
 if(!GS.games.length){const el=document.createElement('div');el.className='gcard gempty';
  el.innerHTML='<canvas></canvas><div class="shade"></div><div class="emptybox"><p class="eyebrow">Games</p><h2 class="sh-title">'+(GS.loaded?'No games yet':'Loading games…')+'</h2><p class="note">'+(GS.loaded?'Make a quiz or a puzzle race on any tattva, then play it live with friends.':'')+'</p>'+(GS.loaded?'<button class="btn gold" id="ge-make">'+ico('plus')+'Make a game</button>':'')+'</div>';
  gamesEl.appendChild(el);queuePoster(el.querySelector('canvas'),DEF(),0);const b=el.querySelector('#ge-make');if(b)b.onclick=()=>openMake();return;}
 GS.games.forEach(g=>{const V=TATTVAS[g.tattva-1],th=THEMES[g.settings.theme],el=document.createElement('article');el.className='gcard';el.id='g-'+g.id;el.style.setProperty('--th',th[1]);
  el.innerHTML='<canvas></canvas><div class="shade"></div><div class="gtint"></div>'+
   '<div class="gcap"><span class="gtype">'+ico(GTYPES[g.type].icon)+esc(GTYPES[g.type].name)+'</span><h2 class="gtitle"></h2>'+
   '<p class="gsub">Tattva '+g.tattva+' · '+esc(V.name)+'</p><p class="note gmeta"></p>'+
   '<div class="glive" hidden></div><div class="row2"><button class="btn line g-solo">'+ico('replay')+'Play solo</button><button class="btn gold g-host">'+ico('share')+'Host live</button></div></div>';
  el.querySelector('.gtitle').textContent=g.title;
  el.querySelector('.gmeta').textContent='by '+g.name+' · '+(g.type==='quiz'?g.settings.count+' questions · '+g.settings.secs+'s each':g.settings.lines+' lines'+(g.settings.hard?' · hard':''))+(g.plays?' · played '+fmt(g.plays)+'×':'');
  el.querySelector('.g-solo').onclick=()=>startRoom({g,solo:true,name:myName()||'you'});
  el.querySelector('.g-host').onclick=()=>askName(name=>startRoom({g,host:true,code:newCode(),name}));
  gamesEl.appendChild(el);if(gposter)gposter.observe(el);else queuePoster(el.querySelector('canvas'),{Tattva:g.tattva,Visuals:'Tattva film',Sound:['sitar'],Tone:'None',Recitation:'None'},0);});}
const gposter=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){gposter.unobserve(e.target);const g=GS.games.find(x=>'g-'+x.id===e.target.id);if(g)queuePoster(e.target.querySelector('canvas'),norm({Tattva:g.tattva}),0);}}),{root:gamesEl,rootMargin:'100% 0px'}):null;
function askName(cb){const cur=myName();if(cur){cb(cur);return;}
 openSheet('gname','<div class="shead"><div><h2 class="sh-title">Your player name</h2><p class="note">Shown to the others in the game.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div><input class="field" id="gn-in" maxlength="20" placeholder="e.g. Laksh" autocomplete="nickname"><p class="err" id="gn-err"></p><button class="btn gold" id="gn-go">Continue</button>');
 const inp=$('#gn-in');setTimeout(()=>inp.focus(),300);$('#sh-x').onclick=closeSheet;
 const go=()=>{const v=inp.value.replace(/[^\w .-]/g,'').trim().slice(0,20);if(!v){$('#gn-err').textContent='Type a name.';return;}LS.set('tr-gname',v);closeSheet();cb(v);};
 $('#gn-go').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}
function openJoin(pre){openSheet('join','<div class="shead"><div><h2 class="sh-title">Join a game</h2><p class="note">Type the 6-letter code from the host’s screen.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div>'+
 '<input class="field codein" id="jn-code" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABC123" value="'+esc(pre||'')+'">'+(myName()?'':'<input class="field" id="jn-name" maxlength="20" placeholder="Your name" autocomplete="nickname">')+'<p class="err" id="jn-err"></p><button class="btn gold" id="jn-go">Join</button>');
 const ci=$('#jn-code');setTimeout(()=>ci.focus(),300);$('#sh-x').onclick=closeSheet;ci.oninput=()=>{ci.value=ci.value.toUpperCase().replace(/[^A-Z0-9]/g,'');$('#jn-err').textContent='';};
 const go=()=>{const c=ci.value.toUpperCase();if(!/^[A-Z0-9]{6}$/.test(c)){$('#jn-err').textContent='Codes have 6 letters and numbers.';return;}
  let name=myName();const ni=$('#jn-name');if(!name){name=(ni.value||'').replace(/[^\w .-]/g,'').trim().slice(0,20);if(!name){$('#jn-err').textContent='Add your name.';return;}LS.set('tr-gname',name);}
  closeSheet();startRoom({code:c,name});};
 $('#jn-go').onclick=go;ci.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}

/* ---------- make a game ---------- */
const GM={type:'quiz',tattva:1,count:8,secs:15,lines:4,hard:false,theme:'Gold',title:''};
function openMake(){showView('gmake');paintMake();}
function paintMake(){const b=$('#gm-body'),V=TATTVAS[GM.tattva-1];
 const chip=(k,v,lab,on)=>'<button class="chip'+(on?' on':'')+'" data-k="'+k+'" data-v="'+esc(String(v))+'">'+esc(lab)+'</button>';
 b.innerHTML='<p class="lab">Game type</p><div class="gtypes">'+Object.keys(GTYPES).map(k=>'<button class="gtcard'+(GM.type===k?' on':'')+'" data-k="type" data-v="'+k+'">'+ico(GTYPES[k].icon)+'<b>'+GTYPES[k].name+'</b><span>'+GTYPES[k].blurb+'</span></button>').join('')+'</div>'+
  '<p class="lab">Tattva</p><div class="chips">'+TATTVAS.map(t=>chip('tattva',t.n,t.n+' · '+t.name,GM.tattva===t.n)).join('')+'</div><p class="note">'+esc(V.teach)+'</p>'+
  (GM.type==='quiz'?'<p class="lab">Questions</p><div class="chips">'+[5,8,10].map(n=>chip('count',n,n+' questions',GM.count===n)).join('')+'</div><p class="lab">Time per question</p><div class="chips">'+[10,15,20].map(n=>chip('secs',n,n+' seconds',GM.secs===n)).join('')+'</div>'
   :'<p class="lab">Lines</p><div class="chips">'+chip('lines',2,'First 2 lines',GM.lines===2)+chip('lines',4,'Whole verse',GM.lines===4)+'</div><p class="lab">Difficulty</p><div class="chips">'+chip('hard',0,'Easy · meaning shown',!GM.hard)+chip('hard',1,'Hard · extra tiles, no hints',GM.hard)+'</div>')+
  '<p class="lab">Look</p><div class="chips">'+Object.keys(THEMES).map(k=>'<button class="chip th'+(GM.theme===k?' on':'')+'" data-k="theme" data-v="'+k+'" style="--th:'+THEMES[k][1]+'"><i></i>'+k+'</button>').join('')+'</div>'+
  '<label class="lab" for="gm-title">Title</label><input class="field" id="gm-title" maxlength="60" placeholder="Tattva '+GM.tattva+(GM.type==='quiz'?' quiz':' puzzle race')+'" value="'+esc(GM.title)+'">'+
  '<div class="row2"><button class="btn line" id="gm-try">'+ico('replay')+'Try it</button><button class="btn gold" id="gm-pub">Publish</button></div><p class="note">Publishing adds it to the Games feed. Anyone can play it solo or host it live with a join code.</p>';
 b.querySelectorAll('[data-k]').forEach(el=>el.onclick=()=>{const k=el.dataset.k,v=el.dataset.v;GM.title=$('#gm-title').value;GM[k]=k==='type'||k==='theme'?v:k==='hard'?v==='1':+v;paintMake();});
 $('#gm-title').oninput=e=>GM.title=e.target.value;
 $('#gm-try').onclick=()=>startRoom({g:draftGame(),solo:true,name:myName()||'you'});
 $('#gm-pub').onclick=()=>{if(S.user)publishGame();else openSignin(publishGame);};}
function draftGame(){return cleanGame({id:'gdraft000',name:myName()||'you',title:GM.title.trim()||('Tattva '+GM.tattva+(GM.type==='quiz'?' quiz':' puzzle race')),type:GM.type,tattva:GM.tattva,settings:{count:GM.count,secs:GM.secs,lines:GM.lines,hard:GM.hard,theme:GM.theme,seed:Math.floor(Math.random()*1e9)}});}
async function publishGame(){const d=draftGame(),body={name:S.user?S.user.handle:'seeker',title:d.title,type:d.type,tattva:d.tattva,settings:d.settings};const btn=$('#gm-pub');if(btn)btn.disabled=true;
 try{let g;if(!GS.local){try{g=cleanGame((await API('/api/games',{method:'POST',body:JSON.stringify(body)})).game);}catch(e){if(e.status===501)GS.local=true;else throw e;}}
  if(GS.local){g=cleanGame(Object.assign({},body,{id:'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),createdAt:Date.now()}));const l=LS.get('tr-games',[]);l.unshift(g);LS.set('tr-games',l.slice(0,40));}
  GS.games.unshift(g);GM.title='';showView('games');renderGames();gamesEl.scrollTop=0;toast('Published. Host it live to get a join code');}
 catch(e){toast(e.message||'Couldn’t publish. Try again.');}finally{if(btn)btn.disabled=false;}}

/* ---------- wiring ---------- */
$('#gm-close').innerHTML=ico('x');$('#gm-close').onclick=()=>showView('games');
$('#pl-close').innerHTML=ico('x');$('#pl-close').onclick=()=>{closeRoom();showView('games');};
$('#gx-live').onclick=()=>{const r=LOBBY.rooms[0];const el=r&&document.getElementById('g-'+r.gid);if(el)el.scrollIntoView({behavior:'smooth'});};
$('#gx-join').innerHTML=ico('right')+'Join';$('#gx-join').onclick=()=>openJoin();
$('#gx-make').innerHTML=ico('plus')+'Make';$('#gx-make').onclick=()=>openMake();
$('#nv-games').innerHTML=ico('drum')+'Games';$('#nv-games').onclick=()=>{if(S.view==='games'){gamesEl.scrollTo({top:0,behavior:'smooth'});return;}showView('games');if(!GS.loaded)loadGames();};
(function(){const m=location.hash.match(/^#join-([A-Z0-9]{6})$/i);if(m){showView('games');loadGames();setTimeout(()=>openJoin(m[1].toUpperCase()),300);}
 const g=location.hash.match(/^#g-(g[a-z0-9]{6,24})$/);if(g){showView('games');loadGames().then(()=>{const el=document.getElementById('g-'+g[1]);if(el)el.scrollIntoView();});}})();
