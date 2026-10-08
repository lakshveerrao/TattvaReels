/* ---------- games: three styles (Stickman Quest, Letter Builder, Block Builder) × the eight tattvas; narrated shloka +
   meaning first, the recitation continues line by line during play; solo or live ---------- */
const SB_URL='https://uodkcmhoszjlgxowkucw.supabase.co',SB_KEY='sb_publishable_ZZxIRgg3b8amPGJzQz1r0g_v_1zdIsc';
const LEVELS={1:'Easy',2:'Normal',3:'Hard'};
const STYLES=['stick','letters','build'],SL={stick:'s',letters:'l',build:'b'},CODE_AB='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GS={games:[],loaded:false,local:false,live:null,me:LS.get('tr-pid',null),best:LS.get('tr-best',{})};
if(!GS.me||!/^p[a-z0-9]{8}$/.test(GS.me)){GS.me='p'+Math.random().toString(36).slice(2,10).padEnd(8,'0');LS.set('tr-pid',GS.me);}
const myName=()=>S.user&&S.user.handle?S.user.handle:(LS.get('tr-gname','')||'');
const styleOf=g=>ARCADE[g&&g.settings&&g.settings.style]||ARCADE.stick,secsOf=g=>styleOf(g).secs||60;
const official=(st,n)=>({id:'o'+SL[st]+n,name:'Hey Tattva',title:ARCADE[st].name+' · '+TATTVAS[n-1].name,type:'arcade',tattva:n,settings:{style:st,level:2,seed:1},plays:0,official:true});
GS.pick=Object.assign({stick:1,letters:1,build:1},LS.get('tr-gpick',{}));
function cleanGame(g){if(!g||typeof g!=='object'||!/^(g[a-z0-9]{6,24}|o[slb][1-8])$/.test(g.id||''))return null;const s=g.settings||{},st=STYLES.includes(s.style)?s.style:'stick',n=Math.min(8,Math.max(1,+g.tattva||1));
 return{id:g.id,name:String(g.name||'seeker').slice(0,24),title:String(g.title||'').slice(0,60)||(ARCADE[st].name+' · '+TATTVAS[n-1].name),type:'arcade',tattva:n,
  settings:{style:st,level:[1,2,3].includes(+s.level)?+s.level:2,seed:+s.seed||1},plays:+g.plays||0,official:!!g.official||/^o/.test(g.id)};}
// signed in: the server keeps my best per game (shown on the Me page)
function saveScore(id,sc){if(!S.user||!/^(g[a-z0-9]{6,24}|o[slb][1-8])$/.test(id)||id==='gdraft000')return;
 API('/api/me',{method:'POST',body:JSON.stringify({score:{game:id,s:sc}})}).then(j=>{const x=S.scores.find(y=>y.game===id);if(x){x.best=Math.max(x.best,j.best);x.plays++;}else S.scores.unshift({game:id,best:j.best,plays:1});}).catch(()=>{});}
function setBest(id,sc){if(sc>(GS.best[id]||0)){GS.best[id]=sc;LS.set('tr-best',GS.best);return true;}return false;}

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



/* ---------- narration: the AI voice recites the shloka, then says what it means ---------- */
const NARR={buf:{},src:null,ctx:null,run:0};
function narrBuf(key,url){if(NARR.buf[key])return Promise.resolve(NARR.buf[key]);return fetch(url).then(r=>{if(!r.ok)throw r.status;return r.arrayBuffer();}).then(ab=>ARC.audio().decodeAudioData(ab)).then(b=>NARR.buf[key]=b);}
function narrStop(){NARR.run++;if(NARR.src){try{NARR.src.stop();}catch(e){}NARR.src=null;}try{speechSynthesis.cancel();}catch(e){}}
function narrPlay(buf){return new Promise(ok=>{const a=ARC.audio();if(!a||!buf){ok();return;}let done=false;const fin=()=>{if(!done){done=true;ok();}};const s=a.createBufferSource();s.buffer=buf;s.connect(a.destination);s.onended=fin;s.start();NARR.src=s;setTimeout(fin,(buf.duration+.6)*1000);});}
function narrSpeak(text,lang){return new Promise(ok=>{try{const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=lang==='en-IN'?.95:.7;u.onend=ok;u.onerror=ok;speechSynthesis.cancel();speechSynthesis.speak(u);setTimeout(ok,lang==='en-IN'?9000:30000);}catch(e){ok();}});}
// Plays recitation then meaning; onStep(stage, lineIndex) drives the captions. Resolves when done (or skipped).
async function narrate(n,onStep){narrStop();const my=++NARR.run,V=TATTVAS[n-1],alive=()=>NARR.run===my;
 let rec=null,mean=null;onStep('load');
 try{[rec,mean]=await Promise.all([narrBuf('r'+n,'/api/tts?v='+n),narrBuf('m'+n,'/api/tts?v='+n+'&m=1')]);}catch(e){}
 if(!alive())return;
 if(rec){onStep('verse',0);const t0=Date.now(),line=rec.duration*1000/4,iv=setInterval(()=>{if(!alive()){clearInterval(iv);return;}onStep('verse',Math.min(3,Math.floor((Date.now()-t0)/line)));},200);await narrPlay(rec);clearInterval(iv);}
 else{const t0=Date.now(),iv=setInterval(()=>{if(!alive()){clearInterval(iv);return;}onStep('verse',Math.min(3,Math.floor((Date.now()-t0)/2500)));},250);onStep('verse',0);await Promise.all([narrSpeak(V.dev.join(' '),'hi-IN'),new Promise(r=>setTimeout(r,10000))]);clearInterval(iv);}
 if(!alive())return;onStep('meaning');
 if(mean)await narrPlay(mean);else await Promise.all([narrSpeak(V.teach,'en-IN'),new Promise(r=>setTimeout(r,4500))]);
 if(alive())onStep('done');}

/* during play: one line of the recitation at a time (the verse has four lines of equal metre), and the meaning at the end */
function narrPreload(n){narrBuf('r'+n,'/api/tts?v='+n).catch(()=>{});narrBuf('m'+n,'/api/tts?v='+n+'&m=1').catch(()=>{});}
function playSlice(buf,from,dur){const a=ARC.audio();if(!a||!buf)return;if(NARR.src){try{NARR.src.stop();}catch(e){}}const s=a.createBufferSource(),g=a.createGain();s.buffer=buf;g.gain.value=1.1;s.connect(g);g.connect(a.destination);s.start(0,from,dur);NARR.src=s;}
function gameVoice(n){return{line:i=>{const b=NARR.buf['r'+n];if(b)playSlice(b,b.duration*i/4,b.duration/4+.25);},meaning:()=>{const b=NARR.buf['m'+n];if(b)playSlice(b,0,b.duration);}};}

/* ---------- a play session: solo, or a live room where the host's phone keeps time and scores ---------- */
function newCode(){let c='';for(let i=0;i<6;i++)c+=CODE_AB[Math.floor(Math.random()*CODE_AB.length)];return c;}
function startRoom(opts){ARC.audio();closeRoom();narrStop();ARC.stop();
 const R=GS.live={code:opts.code||null,host:!!opts.host,solo:!!opts.solo,g:opts.g||null,phase:opts.solo?'intro':'lobby',players:{},online:{},net:null,lastState:0,stateSeq:0,startAt:0,seed:0,myScore:0,lastSent:0};
 R.players[GS.me]={pid:GS.me,name:opts.name,score:0,fin:false};
 showView('play');if(R.g){AUD.need(R.g.tattva);narrPreload(R.g.tattva);}paintPlay();
 if(R.solo){startIntro(R);return;}
 const me={pid:GS.me,name:opts.name};$('#pl-net').textContent='Connecting…';
 liveOpen(R.code,me,{ready:()=>{if(GS.live!==R)return;$('#pl-net').textContent='';if(!R.host)send({e:'hello',pid:GS.me,name:opts.name});else{broadcastState(true);announce(R);}},
  fail:()=>{if(GS.live!==R)return;$('#pl-net').textContent='';playMsg('Couldn’t connect to the live room. Check your connection and try again.');},
  lost:()=>{if(GS.live!==R)return;$('#pl-net').textContent='Reconnecting…';},
  presence:list=>{if(GS.live!==R)return;R.online={};list.forEach(p=>{if(p&&p.pid)R.online[p.pid]=p.name;});announce(R);if(R.host){list.forEach(p=>{if(p&&p.pid&&!R.players[p.pid])R.players[p.pid]={pid:p.pid,name:String(p.name||'player').slice(0,24),score:0,fin:false};});broadcastState(true);}if(R.phase==='lobby')paintPlay();},
  msg:m=>{if(GS.live===R)onMsg(R,m);}}).then(n=>{if(GS.live===R)R.net=n;else n.close();}).catch(()=>{if(GS.live===R)playMsg('Couldn’t load live play. Check your connection.');});
 R.t=setInterval(()=>tick(R),250);}
function closeRoom(){narrStop();ARC.stop();const R=GS.live;if(!R)return;clearInterval(R.t);if(R.net)R.net.close();if(R.ann)R.ann.close();GS.live=null;}
/* public lobby: every live room is listed here, so anyone on the site can join without a code */
function roomInfo(R){return{pid:'room-'+R.code,code:R.code,gid:R.g.id,title:R.g.title,type:R.g.type,tattva:R.g.tattva,n:Object.keys(R.online).length||1,phase:R.phase,host:(R.players[GS.me]||{}).name||''};}
function announce(R){if(!R.host||R.solo||!R.g||!R.code)return;const info=roomInfo(R),k=JSON.stringify(info);
 if(R.ann){if(k!==R.annKey){R.annKey=k;R.ann.track(info);}return;}if(R.annPending)return;R.annPending=true;
 liveOpen('LOBBY',info,{ready:()=>{if(GS.live===R&&R.ann){R.annKey=JSON.stringify(roomInfo(R));R.ann.track(roomInfo(R));}},fail:()=>{R.annPending=false;},lost:()=>{},presence:()=>{},msg:()=>{}})
  .then(n=>{if(GS.live===R){R.ann=n;R.annKey=JSON.stringify(roomInfo(R));n.track(roomInfo(R));}else n.close();}).catch(()=>{R.annPending=false;});}
const LOBBY={net:null,rooms:[],on:false};
function watchLobby(on){if(on===LOBBY.on)return;LOBBY.on=on;if(!on){if(LOBBY.net)LOBBY.net.close();LOBBY.net=null;return;}
 liveOpen('LOBBY',{pid:GS.me,watch:1},{ready:()=>{},fail:()=>{},lost:()=>{},msg:()=>{},presence:list=>{LOBBY.rooms=list.filter(x=>x&&x.code&&x.gid&&/^[A-Z0-9]{6}$/.test(x.code)&&x.phase!=='done');paintLive();if(GS.loaded&&LOBBY.rooms.some(r=>/^g/.test(r.gid)&&!GS.games.find(g=>g.id===r.gid))&&Date.now()-(LOBBY.reload||0)>8000){LOBBY.reload=Date.now();loadGames();}}})
  .then(n=>{if(LOBBY.on)LOBBY.net=n;else n.close();}).catch(()=>{});}
function paintLive(){gamesEl.querySelectorAll('.gcard').forEach(el=>{const id=el.id.slice(2),box=el.querySelector('.glive');if(!box)return;const rs=LOBBY.rooms.filter(r=>r.gid===id||(id.length===2&&String(r.gid).slice(0,2)===id));
  if(!rs.length){box.hidden=true;box.innerHTML='';return;}box.hidden=false;
  box.innerHTML=rs.slice(0,3).map(r=>'<button class="btn joinlive" data-code="'+esc(r.code)+'"><span class="dot"></span><span>Join '+esc(r.host||'a')+'’s game</span><small>Tattva '+(+r.tattva||1)+' · '+(r.phase==='lobby'?'waiting':'playing')+' · '+(+r.n||1)+' in</small></button>').join('');
  box.querySelectorAll('.joinlive').forEach(b=>b.onclick=()=>askName(name=>startRoom({code:b.dataset.code,name})));});
 const live=LOBBY.rooms.length,pill=$('#gx-live');if(pill){pill.hidden=!live;pill.textContent=live+' live';}}

function send(m){const R=GS.live;if(R&&R.net)R.net.send(m);}
function playMsg(t){const R=GS.live;if(R){R.err=t;paintPlay();}}
function onMsg(R,m){
 if(m.e==='state'&&!R.host){if(m.seq<R.stateSeq)return;R.stateSeq=m.seq;const was=R.phase;const og=R.g&&R.g.tattva;R.g=cleanGame(m.g);if(R.g&&R.g.tattva!==og){AUD.need(R.g.tattva);narrPreload(R.g.tattva);}
  m.players.forEach(p=>{if(p.pid!==GS.me||!R.players[p.pid])R.players[p.pid]=p;else{R.players[p.pid].fin=p.fin;}});
  if(m.phase==='count'&&was!=='count'&&was!=='play'){R.seed=m.seed;R.startAt=Date.now()+m.rem;R.phase='count';paintPlay();return;}
  if(m.phase==='done'&&was!=='done'){R.phase='done';ARC.stop();paintPlay();return;}
  if(m.phase==='lobby'&&was==='done'){R.phase='lobby';R.myScore=0;paintPlay();return;}
  if(R.phase==='lobby'||R.phase==='done')paintPlay();else paintLiveBoard(R);return;}
 if(!R.host)return;
 if(m.e==='hello'){if(!R.players[m.pid])R.players[m.pid]={pid:m.pid,name:String(m.name||'player').replace(/[<>]/g,'').slice(0,24),score:0,fin:false};broadcastState(true);if(R.phase==='lobby')paintPlay();}
 else if(m.e==='sc'&&R.players[m.pid]&&(R.phase==='play'||R.phase==='count')){const p=R.players[m.pid];p.score=Math.max(0,Math.min(99999,+m.s||0));if(m.fin)p.fin=true;broadcastState();paintLiveBoard(R);maybeDone(R);}}
function snapshot(R){return Object.values(R.players).map(p=>({pid:p.pid,name:p.name,score:p.score,fin:!!p.fin}));}
function broadcastState(force){const R=GS.live;if(!R||!R.host||R.solo)return;announce(R);const now=Date.now();if(!force&&now-R.lastState<500)return;R.lastState=now;
 send({e:'state',seq:++R.stateSeq,g:R.g,phase:R.phase,seed:R.seed,rem:Math.max(0,R.startAt-now),players:snapshot(R)});}
function tick(R){if(GS.live!==R)return;const now=Date.now();
 if(R.phase==='count'){const n=Math.ceil((R.startAt-now)/1000),el=$('#pl-count');if(el&&el.textContent!==String(Math.max(1,n))){el.textContent=Math.max(1,n);el.style.animation='none';void el.offsetWidth;el.style.animation='';}if(now>=R.startAt)beginGame(R);}
 if(R.host&&!R.solo){if(R.phase==='play'&&now>R.startAt+secsOf(R.g)*1000+6000)finishRoom(R);if(now-R.lastState>2000)broadcastState(true);}}
function hostStart(){const R=GS.live;if(!R||!R.host)return;narrStop();Object.values(R.players).forEach(p=>{p.score=0;p.fin=false;});R.myScore=0;R.seed=Math.floor(Math.random()*1e9);R.startAt=Date.now()+4000;R.phase='count';
 if(R.g&&!R.g.official)API('/api/games',{method:'POST',body:JSON.stringify({played:R.g.id})}).catch(()=>{});broadcastState(true);paintPlay();}
function maybeDone(R){const ids=Object.keys(R.players).filter(id=>R.online[id]||id===GS.me);if(R.phase==='play'&&ids.length&&ids.every(id=>R.players[id].fin))finishRoom(R);}
function finishRoom(R){if(R.phase==='done')return;R.phase='done';ARC.stop();broadcastState(true);paintPlay();}
function beginGame(R){if(R.phase!=='count')return;R.phase='play';paintPlay();
 const host=$('#ar-host');narrStop();const ok=ARC.start(styleOf(R.g),{host,seed:R.seed||Math.floor(Math.random()*1e9),level:R.g.settings.level,tattva:R.g.tattva,secs:secsOf(R.g),voice:gameVoice(R.g.tattva),
  onScore:sc=>{R.myScore=sc;if(!R.solo){const me=R.players[GS.me];if(me)me.score=sc;if(R.host){broadcastState();paintLiveBoard(R);}else if(Date.now()-R.lastSent>600){R.lastSent=Date.now();send({e:'sc',pid:GS.me,s:sc});}}},
  onEnd:sc=>{if(GS.live!==R)return;R.myScore=sc;saveScore(R.g.id,sc);const me=R.players[GS.me];if(me){me.score=sc;me.fin=true;}
   if(R.solo){R.phase='done';R.newBest=setBest(R.g.id,sc);if(!R.g.official)API('/api/games',{method:'POST',body:JSON.stringify({played:R.g.id})}).catch(()=>{});paintPlay();return;}
   R.newBest=setBest(R.g.id,sc);if(R.host){broadcastState(true);maybeDone(R);}else{send({e:'sc',pid:GS.me,s:sc,fin:true});}paintLiveBoard(R);}});
 if(!ok)playMsg('This game needs WebGL, which your browser has turned off.');
 if(!R.solo)paintLiveBoard(R);}
function startIntro(R){R.phase='intro';paintPlay();
 narrate(R.g.tattva,(st,li)=>{if(GS.live!==R||R.phase!=='intro')return;const box=$('#pl-body .intro');if(!box)return;box.dataset.st=st;
  box.querySelectorAll('.iv .dev').forEach((el,i)=>el.classList.toggle('on',st==='verse'&&i===li));box.querySelector('.imean').classList.toggle('on',st==='meaning'||st==='done');
  const lab=box.querySelector('.istate');lab.textContent=st==='load'?'Loading the recitation…':st==='verse'?'Listen: the shloka':st==='meaning'?'What it means':'Ready';
  if(st==='done')setTimeout(()=>{if(GS.live===R&&R.phase==='intro')goCount(R);},700);});}
function goCount(R){narrStop();R.startAt=Date.now()+3000;R.phase='count';paintPlay();if(R.solo&&!R.t)R.t=setInterval(()=>tick(R),250);}

/* ---------- play screen ---------- */
function ranked(R){return Object.values(R.players).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));}
function introHTML(g){const V=TATTVAS[g.tattva-1],A=styleOf(g);
 return '<div class="intro" data-st="load"><p class="eyebrow">Tattva '+g.tattva+' · '+esc(V.name)+'</p><p class="lab istate">Loading the recitation…</p>'+
  '<div class="iv">'+V.dev.map((d,i)=>'<span class="dev">'+esc(d)+'</span>').join('')+'</div>'+
  '<div class="imean"><p class="lab">Meaning</p><p class="it">'+esc(V.teach)+'</p></div>'+
  '<div class="ihow">'+ico('remix')+'<div><b>'+esc(A.name)+'</b><span>'+esc(A.how)+'</span></div></div></div>';}
function paintLiveBoard(R){const el=$('#pl-live');if(!el)return;if(R.solo||R.phase!=='play'){el.hidden=true;return;}el.hidden=false;
 el.innerHTML=ranked(R).slice(0,4).map((p,i)=>'<div class="lb'+(p.pid===GS.me?' me':'')+'"><span>'+(i+1)+'</span><b>'+esc(p.name)+'</b><i>'+fmt(p.score)+'</i></div>').join('');}
function paintPlay(){const R=GS.live,box=$('#pl-body');if(!R||!box)return;const g=R.g;
 $('#pl-title').textContent=g?g.title:'Joining…';$('#pl-code').hidden=R.solo||!R.code;$('#pl-code').innerHTML='<span>Code</span><b>'+esc(R.code||'')+'</b>';
 $('#v-play').classList.toggle('gaming',R.phase==='play');const lv=$('#pl-live');if(lv)lv.hidden=true;
 if(R.err){box.innerHTML='<div class="pl-card"><p class="note">'+esc(R.err)+'</p><button class="btn gold" id="pl-x2">Back to games</button></div>';$('#pl-x2').onclick=()=>{closeRoom();showView('games');};return;}
 if(!g){box.innerHTML='<div class="pl-card pl-wait"><span class="spin"></span><p class="note">Waiting for the host…</p></div>';return;}
 if(R.phase==='intro'){box.innerHTML=introHTML(g)+'<button class="btn gold" id="pl-skip">'+ico('right')+'Skip to the game</button>';$('#pl-skip').onclick=()=>goCount(R);return;}
 if(R.phase==='lobby'){const n=Object.keys(R.players).length,url=location.origin+'/#join-'+R.code;
  box.innerHTML='<div class="pl-card">'+(R.host?'<p class="note">Friends tap <b>Games</b>, then <b>Join</b> on this game’s card, or type the code. You can also send the link.</p><div class="bigcode">'+esc(R.code)+'</div><button class="btn line" id="pl-share">'+ico('share')+'Share join link</button>':'<p class="note">You’re in. The host will start the game.</p>')+
   '<p class="lab">Players · '+n+'</p><div class="pl-players">'+Object.values(R.players).map(p=>'<span class="pchip'+(p.pid===GS.me?' me':'')+'">'+esc(p.name)+'</span>').join('')+'</div>'+
   (R.host?'<button class="btn gold" id="pl-start">'+(n<2?'Start (you can play alone)':'Start · '+secsOf(g)+' seconds')+'</button>':'<div class="pl-wait"><span class="spin"></span></div>')+'</div>'+
   introHTML(g)+'<button class="btn line" id="pl-listen">'+ico('son')+'Listen to the shloka</button>';
  $('#pl-listen').onclick=()=>{const b=$('#pl-listen');b.disabled=true;narrate(g.tattva,(st,li)=>{const bx=$('#pl-body .intro');if(!bx)return;bx.querySelectorAll('.iv .dev').forEach((el,i)=>el.classList.toggle('on',st==='verse'&&i===li));bx.querySelector('.imean').classList.toggle('on',st==='meaning'||st==='done');bx.querySelector('.istate').textContent=st==='load'?'Loading…':st==='verse'?'Listen: the shloka':st==='meaning'?'What it means':'Ready';if(st==='done'&&$('#pl-listen'))$('#pl-listen').disabled=false;});};
  if(R.host){$('#pl-start').onclick=hostStart;$('#pl-share').onclick=()=>{if(navigator.share)navigator.share({title:g.title,text:'Play my Tattva game. Code '+R.code,url}).catch(()=>{});else{try{navigator.clipboard.writeText(url);toast('Join link copied');}catch(e){toast(url);}}};}
  return;}
 if(R.phase==='count'){box.innerHTML='<div class="countbox"><p class="eyebrow">'+esc(styleOf(g).name)+' · Tattva '+g.tattva+'</p><div class="bigcount" id="pl-count">3</div><p class="note">'+esc(styleOf(g).how)+'</p></div>';return;}
 if(R.phase==='play'){if(!$('#ar-host'))box.innerHTML='<div class="arhost" id="ar-host"></div><div class="pl-live" id="pl-live" hidden></div>';return;}
 if(R.phase==='done'){ARC.stop();const rk=ranked(R),V=TATTVAS[g.tattva-1],best=GS.best[g.id]||0,next=official(g.settings.style,g.tattva%8+1);
  const board=R.solo?'':'<p class="lab">Scores</p><div class="board">'+rk.map((p,i)=>'<div class="brow'+(p.pid===GS.me?' me':'')+'"><span class="rk">'+(i+1)+'</span><span class="bn">'+esc(p.name)+(p.fin?'':' <small>· playing</small>')+'</span><b>'+fmt(p.score)+'</b></div>').join('')+'</div>';
  box.innerHTML='<div class="pl-card result"><p class="eyebrow">'+esc(styleOf(g).name)+' · Tattva '+g.tattva+' · '+LEVELS[g.settings.level]+'</p><div class="bignum">'+fmt(R.myScore)+'</div><p class="count">'+(R.newBest?'New best!':'Best: <b>'+fmt(best)+'</b>')+'</p>'+board+
   '<div class="lesson"><p class="lab">Tattva '+g.tattva+' · '+esc(V.name)+'</p><p>'+esc(V.teach)+'</p></div>'+
   (R.solo?'<div class="row2"><button class="btn line" id="pl-again">'+ico('replay')+'Play again</button><button class="btn gold" id="pl-host">'+ico('share')+'Play with friends</button></div><button class="btn line" id="pl-next">Next: Tattva '+next.tattva+' · '+esc(TATTVAS[next.tattva-1].name)+' '+ico('right')+'</button>'
    :R.host?'<div class="row2"><button class="btn line" id="pl-again">'+ico('replay')+'Play again</button><button class="btn gold" id="pl-done">Done</button></div>':'<button class="btn gold" id="pl-done">Done</button>')+'</div>';
  const ag=$('#pl-again');if(ag)ag.onclick=()=>{if(R.solo){R.myScore=0;R.newBest=false;goCount(R);}else{R.phase='lobby';Object.values(R.players).forEach(p=>{p.score=0;p.fin=false;});R.myScore=0;broadcastState(true);paintPlay();}};
  const ho=$('#pl-host');if(ho)ho.onclick=()=>askName(name=>startRoom({g,host:true,code:newCode(),name}));
  const nx=$('#pl-next');if(nx)nx.onclick=()=>startRoom({g:next,solo:true,name:myName()||'you'});
  const dn=$('#pl-done');if(dn)dn.onclick=()=>{closeRoom();showView('games');};return;}}

/* ---------- games feed: the eight tattva games, then games people made ---------- */
const gamesEl=$('#games');
async function loadGames(){
 try{const j=await API('/api/games');GS.local=false;GS.games=(j.games||[]).filter(g=>g&&g.settings&&g.settings.style).map(cleanGame).filter(Boolean);}
 catch(e){GS.local=true;GS.games=LS.get('tr-games',[]).filter(g=>g&&g.settings&&g.settings.style).map(cleanGame).filter(Boolean);}
 GS.loaded=true;renderGames();}
const cardGame=el=>{const id=el.id.slice(2);if(/^o[slb]$/.test(id)){const st=STYLES.find(x=>SL[x]===id[1]);return official(st,GS.pick[st]);}return GS.games.find(g=>g.id===id);};
function renderGames(){gamesEl.innerHTML='';setTimeout(paintLive,0);
 STYLES.forEach(st=>gamesEl.appendChild(gameCard(official(st,GS.pick[st]),st)));
 GS.games.forEach(g=>gamesEl.appendChild(gameCard(g)));}
// one card per style (pick any of the eight tattvas on it), then one card per game someone made
function gameCard(g,styleCard){const el=document.createElement('article');el.className='gcard'+(styleCard?' gstyle':'');el.id='g-'+(styleCard?'o'+SL[styleCard]:g.id);
 el.innerHTML='<canvas></canvas><div class="shade"></div>'+
  '<div class="gcap"><span class="gtype">'+ico('remix')+(styleCard?'Game style':'Made by '+esc(g.name))+' · <span class="gsecs"></span>s</span><h2 class="gtitle"></h2>'+
  '<p class="gsub"></p>'+(styleCard?'<div class="tchips">'+[1,2,3,4,5,6,7,8].map(n=>'<button class="tchip" data-n="'+n+'" aria-label="Tattva '+n+'">'+n+'</button>').join('')+'</div>':'')+'<p class="note gmeta"></p>'+
  '<div class="glive" hidden></div><div class="row2"><button class="btn gold g-solo">'+ico('right')+'Play</button><button class="btn line g-host">'+ico('share')+'With friends</button></div></div>';
 const fill=()=>{const G=cardGame(el)||g,A=styleOf(G),V=TATTVAS[G.tattva-1];
  el.querySelector('.gsecs').textContent=A.secs;el.querySelector('.gtitle').textContent=styleCard?A.name:G.title;
  el.querySelector('.gsub').textContent='Tattva '+G.tattva+' · '+V.name+(styleCard?'':' · '+A.name);
  el.querySelector('.gmeta').textContent=A.how+(G.official?'':' · '+LEVELS[G.settings.level])+(GS.best[G.id]?' · your best '+fmt(GS.best[G.id]):'')+(G.plays?' · played '+fmt(G.plays)+'×':'');
  el.querySelectorAll('.tchip').forEach(b=>b.classList.toggle('on',+b.dataset.n===G.tattva));return G;};
 fill();
 el.querySelectorAll('.tchip').forEach(b=>b.onclick=()=>{GS.pick[styleCard]=+b.dataset.n;LS.set('tr-gpick',GS.pick);const G=fill();queuePoster(el.querySelector('canvas'),norm({Tattva:G.tattva}),0);});
 el.querySelector('.g-solo').onclick=()=>startRoom({g:cardGame(el)||g,solo:true,name:myName()||'you'});
 el.querySelector('.g-host').onclick=()=>askName(name=>startRoom({g:cardGame(el)||g,host:true,code:newCode(),name}));
 if(gposter)gposter.observe(el);else queuePoster(el.querySelector('canvas'),norm({Tattva:g.tattva}),0);return el;}
const gposter=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){gposter.unobserve(e.target);const g=cardGame(e.target);if(g)queuePoster(e.target.querySelector('canvas'),norm({Tattva:g.tattva}),0);}}),{root:gamesEl,rootMargin:'100% 0px'}):null;
function askName(cb){const cur=myName();if(cur){cb(cur);return;}
 openSheet('gname','<div class="shead"><div><h2 class="sh-title">Your player name</h2><p class="note">Shown to the others in the game.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div><input class="field" id="gn-in" maxlength="20" placeholder="e.g. Laksh" autocomplete="nickname"><p class="err" id="gn-err"></p><button class="btn gold" id="gn-go">Continue</button>');
 const inp=$('#gn-in');setTimeout(()=>inp.focus(),300);$('#sh-x').onclick=closeSheet;
 const go=()=>{const v=inp.value.replace(/[^\w .-]/g,'').trim().slice(0,20);if(!v){$('#gn-err').textContent='Type a name.';return;}LS.set('tr-gname',v);closeSheet();cb(v);};
 $('#gn-go').onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}
function openJoin(pre){openSheet('join','<div class="shead"><div><h2 class="sh-title">Join with a code</h2><p class="note">Type the 6-letter code from the host’s screen. Live games also show a Join button on their card.</p></div><button class="icon-btn glass" id="sh-x" aria-label="Close">'+ico('x')+'</button></div>'+
 '<input class="field codein" id="jn-code" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABC123" value="'+esc(pre||'')+'">'+(myName()?'':'<input class="field" id="jn-name" maxlength="20" placeholder="Your name" autocomplete="nickname">')+'<p class="err" id="jn-err"></p><button class="btn gold" id="jn-go">Join</button>');
 const ci=$('#jn-code');setTimeout(()=>ci.focus(),300);$('#sh-x').onclick=closeSheet;ci.oninput=()=>{ci.value=ci.value.toUpperCase().replace(/[^A-Z0-9]/g,'');$('#jn-err').textContent='';};
 const go=()=>{const c=ci.value.toUpperCase();if(!/^[A-Z0-9]{6}$/.test(c)){$('#jn-err').textContent='Codes have 6 letters and numbers.';return;}
  let name=myName();const ni=$('#jn-name');if(!name){name=(ni.value||'').replace(/[^\w .-]/g,'').trim().slice(0,20);if(!name){$('#jn-err').textContent='Add your name.';return;}LS.set('tr-gname',name);}
  closeSheet();startRoom({code:c,name});};
 $('#jn-go').onclick=go;ci.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}

/* ---------- make your own version: pick the tattva game, the difficulty and a title ---------- */
const GM={style:'stick',tattva:1,level:2,title:''};
function openMake(){showView('gmake');paintMake();}
function paintMake(){const b=$('#gm-body'),V=TATTVAS[GM.tattva-1],A=ARCADE[GM.style];
 const chip=(k,v,lab,on)=>'<button class="chip'+(on?' on':'')+'" data-k="'+k+'" data-v="'+v+'">'+esc(lab)+'</button>';
 b.innerHTML='<p class="lab">Game style</p><div class="gtypes g3">'+STYLES.map(st=>'<button class="gtcard'+(GM.style===st?' on':'')+'" data-k="style" data-v="'+st+'"><b>'+esc(ARCADE[st].name)+'</b><span>'+esc(ARCADE[st].short)+' · '+ARCADE[st].secs+'s</span></button>').join('')+'</div>'+
  '<p class="lab">Tattva</p><div class="gtypes">'+TATTVAS.map(t=>'<button class="gtcard'+(GM.tattva===t.n?' on':'')+'" data-k="tattva" data-v="'+t.n+'"><b>'+t.n+'</b><span>'+esc(t.name)+'</span></button>').join('')+'</div>'+
  '<p class="note">'+esc(A.how)+'</p><p class="lab">Difficulty</p><div class="chips">'+[1,2,3].map(n=>chip('level',n,LEVELS[n],GM.level===n)).join('')+'</div>'+
  '<label class="lab" for="gm-title">Title</label><input class="field" id="gm-title" maxlength="60" placeholder="'+esc(A.name)+' · '+esc(V.name)+'" value="'+esc(GM.title)+'">'+
  '<div class="row2"><button class="btn line" id="gm-try">'+ico('right')+'Try it</button><button class="btn gold" id="gm-pub">Publish</button></div><p class="note">Every game starts with the shloka and its meaning, and the shloka keeps playing line by line as you go. Publishing adds it to the Games feed for everyone.</p>';
 b.querySelectorAll('[data-k]').forEach(el=>el.onclick=()=>{GM.title=$('#gm-title').value;const k=el.dataset.k;GM[k]=k==='style'?el.dataset.v:+el.dataset.v;paintMake();});
 $('#gm-title').oninput=e=>GM.title=e.target.value;
 $('#gm-try').onclick=()=>startRoom({g:draftGame(),solo:true,name:myName()||'you'});
 $('#gm-pub').onclick=()=>{if(S.user||GS.local)publishGame();else openSignin(publishGame,'Sign in to publish');};}
function draftGame(){return cleanGame({id:'gdraft000',name:myName()||'you',title:GM.title.trim()||(ARCADE[GM.style].name+' · '+TATTVAS[GM.tattva-1].name),tattva:GM.tattva,settings:{style:GM.style,level:GM.level,seed:1}});}
async function publishGame(){const d=draftGame(),body={title:d.title,type:'arcade',tattva:d.tattva,settings:d.settings};const btn=$('#gm-pub');if(btn)btn.disabled=true;
 try{let g;if(!GS.local){try{g=cleanGame((await API('/api/games',{method:'POST',body:JSON.stringify(body)})).game);}catch(e){if(e.status===501)GS.local=true;else throw e;}}
  if(GS.local){g=cleanGame(Object.assign({},body,{id:'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}));const l=LS.get('tr-games',[]);l.unshift(g);LS.set('tr-games',l.slice(0,40));}
  GS.games.unshift(g);GM.title='';showView('games');renderGames();const el=document.getElementById('g-'+g.id);if(el)el.scrollIntoView();toast('Published. Tap With friends to play it live');}
 catch(e){if(e.status===401){S.user=null;openSignin(publishGame,'Sign in to publish');}else if(e.status===403)openName(true,publishGame);else toast(e.message||'Couldn’t publish. Try again.');}finally{if(btn)btn.disabled=false;}}

/* ---------- wiring ---------- */
$('#gm-close').innerHTML=ico('x');$('#gm-close').onclick=()=>showView('games');
$('#pl-close').innerHTML=ico('x');$('#pl-close').onclick=()=>{closeRoom();showView('games');};
$('#gx-live').onclick=()=>{const r=LOBBY.rooms[0];const el=r&&(document.getElementById('g-'+r.gid)||document.getElementById('g-'+String(r.gid).slice(0,2)));if(el)el.scrollIntoView({behavior:'smooth'});};
$('#gx-join').innerHTML=ico('right')+'Code';$('#gx-join').onclick=()=>openJoin();
$('#gx-make').innerHTML=ico('plus')+'Make';$('#gx-make').onclick=()=>openMake();
$('#nv-games').innerHTML=ico('drum')+'Games';$('#nv-games').onclick=()=>{if(S.view==='games'){gamesEl.scrollTo({top:0,behavior:'smooth'});return;}showView('games');if(!GS.loaded)loadGames();};
renderGames();
(function(){const m=location.hash.match(/^#join-([A-Z0-9]{6})$/i);if(m){showView('games');loadGames();setTimeout(()=>openJoin(m[1].toUpperCase()),300);}
 const g=location.hash.match(/^#g-((g[a-z0-9]{6,24})|o[slb][1-8])$/);if(g){showView('games');let id=g[1];if(/^o/.test(id)){const st=STYLES.find(x=>SL[x]===id[1]);GS.pick[st]=+id[2];id=id.slice(0,2);}loadGames().then(()=>{const el=document.getElementById('g-'+id);if(el)el.scrollIntoView();});}})();
