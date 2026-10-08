/* Letter Builder: akṣara blocks float up like lanterns. Tap the next letter of the word to build it; the tattva's key
   word glows gold and scores double; a golden ॐ block fills the next letter for you. Every finished word is laid as a
   row in the wall of the verse, and the shloka is recited line by line as the wall grows. */
ARCADE.letters=(function(){
 var SKY={1:['#3b2b6e','#0c0820'],2:['#245a4a','#06120c'],3:['#6a3424','#120806'],4:['#24244a','#05050c'],5:['#3e4e7e','#0c1220'],6:['#5a2410','#100503'],7:['#24445e','#060e16'],8:['#2a1f5a','#07051a']};
 var G={name:'Letter Builder',secs:60,short:'Tap the letters, build the words',how:'Tap the floating letters in order to build each word. Gold words score double, ॐ fills a letter for you.',s:null};
 function escH(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 G.setup=function(c){var n=c.tattva,sk=SKY[n]||SKY[1];c.sky(sk[0],sk[1]);
  var r2=ARC.rngOf(Math.floor(c.rnd()*1e9));
  var words=WORDS.forTattva(n),key=words.filter(function(w){return WORDS.isKey(n,w);}),rest=words.filter(function(w){return !WORDS.isKey(n,w);});
  for(var i=rest.length-1;i>0;i--){var j=Math.floor(r2()*(i+1)),t=rest[i];rest[i]=rest[j];rest[j]=t;}
  var order=rest.slice(0,1).concat(key.slice(0,1),rest.slice(1));
  var pool=[];words.forEach(function(w){w.ak.forEach(function(a){if(pool.indexOf(a)<0)pool.push(a);});});
  var s=G.s={c:c,order:order,wi:0,got:0,pool:pool,tiles:[],fly:[],wall:[],rows:0,combo:0,words:0,line:0,lastLine:-99,nextSpawn:0,nextOm:9+c.rnd()*4,hold:0,
   speed:.9+.3*c.level};
  // a stone floor for the wall of the verse
  var fl=[];for(var x=0;x<20;x++)fl.push([x-9.5,0,0,1,1,2,x%2?'#6b5a48':'#7a6854']);var floor=c.model('lbfl',fl,.5);floor.rotation.set(.3,0,0);floor.position.set(0,-c.HH+.6,-2);c.add(floor);
  c.hud.classList.add('captop');
  var halo=c.glow('rgba(233,180,76,.25)',11);halo.position.set(0,-.5,-12);halo.material.opacity=.35;c.add(halo);s.motes=[];
  for(var q=0;q<14;q++){var mo=c.glow(q%3?'rgba(255,200,120,.7)':'rgba(180,200,255,.6)',.25+(q%4)*.08);mo.position.set(-4.6+(q*0.71%9.2),-c.HH+(q*1.37%(c.HH*2)),-4);mo.userData.v=.25+(q%5)*.08;c.add(mo);s.motes.push(mo);}
  c.help('Tap the letters in order');showWord(s);
  for(var k=0;k<5;k++)spawn(s,-c.HH+2+k*2.6);};
 function word(s){return s.order[s.wi%s.order.length];}
 function isKeyW(s){return WORDS.isKey(s.c.tattva,word(s));}
 function showWord(s,done){var w=word(s),k=isKeyW(s);
  s.c.word('<div class="ww'+(done?' done':'')+(k?' key':'')+'"><span class="wk">'+(done?'Word built':k?'Key word · double points':'Build the word')+'</span><div class="wak">'+
   w.ak.map(function(a,i){return'<i class="'+(done||i<s.got?'on':'')+(!done&&i===s.got?' nx':'')+'">'+escH(a)+'</i>';}).join('')+'</div><span class="wm">'+escH(w.iast)+' · '+escH(w.mean)+'</span></div>');}
 function need(s){var w=word(s);return s.got<w.ak.length?w.ak[s.got]:null;}
 function spawn(s,y,txt,om){var c=s.c,nd=need(s);
  if(!txt){var haveNeed=s.tiles.some(function(t){return t.txt===nd&&t.m.position.y<c.HH-4;});
   if(nd&&(!haveNeed||c.rnd()<.3))txt=nd;else{var tries=0;do{txt=s.pool[Math.floor(c.rnd()*s.pool.length)];}while(txt===nd&&++tries<6);}}
  if(!txt)return;var x=-3.6+c.rnd()*7.2;
  for(var k=0;k<6;k++){var clash=s.tiles.some(function(t){return Math.abs(t.m.position.x-x)<1.25&&Math.abs(t.m.position.y-(y==null?-c.HH-1:y))<1.3;});if(!clash)break;x=-3.6+c.rnd()*7.2;}
  var m=c.tile(om?'ॐ':txt,om?'#ffb648':(isKeyW(s)&&txt===nd?'#ffd27a':'#f6e7c8'),1.15);m.position.set(x,y==null?-c.HH-1:y,0);c.add(m);
  var t={m:m,txt:txt,om:!!om,x0:x,ph:c.rnd()*6,v:s.speed*(.85+c.rnd()*.4),bad:0};
  if(om){t.g=c.glow('rgba(255,190,90,.9)',2.4);t.g.position.z=-.2;m.add(t.g);}
  s.tiles.push(t);}
 G.tap=function(x,y,c){var s=G.s,best=null,bd=.95;if(s.hold>0)return;
  s.tiles.forEach(function(t){var d=Math.hypot(t.m.position.x-x,t.m.position.y-y);if(d<bd){bd=d;best=t;}});if(!best)return;take(s,best);};
 function take(s,t){var c=s.c,nd=need(s),p=t.m.position,k=isKeyW(s)?2:1;if(!nd)return;
  if(t.om||t.txt===nd){s.got++;s.combo++;c.combo(s.combo);c.score((t.om?15:10+Math.min(10,s.combo*2))*k,p.x,p.y);c.SFX.good(s.combo);c.burst(p.x,p.y,t.om?'#ffb648':'#ffd27a',8);
   s.tiles.splice(s.tiles.indexOf(t),1);t.fly={x:p.x,y:p.y,tt:0};s.fly.push(t);
   if(s.got>=word(s).ak.length)wordDone(s);else showWord(s);}
  else{s.combo=0;c.combo(0);c.score(-5,p.x,p.y);c.SFX.bad();c.shake();t.bad=.5;}}
 G.take=function(t){take(G.s,t);};
 function wordDone(s){var c=s.c,w=word(s),k=isKeyW(s)?2:1;c.score(20*k,0,c.HH-5,'word');c.SFX.big();showWord(s,true);s.words++;s.hold=.6;
  // lay the word as a row in the wall of the verse
  var row=s.rows++,sz=.72,wdt=w.ak.length*sz,y=-c.HH+1.25+row*(sz+.04);
  w.ak.forEach(function(a,i){var m=c.tile(a,k>1?'#ffd27a':'#e8d2a8',sz);m.position.set(-wdt/2+sz/2+i*sz+(row%2?.15:-.15),y+4,-2);m.rotation.set(.2,0,0);m.userData.ty=y;m.userData.d=i*.06;c.add(m);s.wall.push(m);});
  if(s.rows>6){s.wall.forEach(function(m){m.userData.ty-=sz+.04;});s.rows=6;}
  if(s.words%2===1&&c.t-s.lastLine>7){c.recite(s.line++);s.lastLine=c.t;}
  setTimeout(function(){if(G.s!==s)return;s.wi++;s.got=0;showWord(s);},1300);}
 G.update=function(dt,t,c){var s=G.s,i;s.hold=Math.max(0,s.hold-dt);
  if(t>3.5&&t<3.7)c.help('');
  if(t>1&&s.lastLine<0){c.recite(0);s.line=1;s.lastLine=t;}
  var want=6+c.level;if(s.tiles.length<want&&t>s.nextSpawn){spawn(s);s.nextSpawn=t+.45;}
  if(t>s.nextOm){s.nextOm=t+11+c.rnd()*5;spawn(s,null,'ॐ',true);}
  var nd=need(s);if(nd&&!s.tiles.some(function(x){return x.txt===nd&&x.m.position.y<c.HH-3.5;}))spawn(s,null,nd);
  for(i=s.tiles.length-1;i>=0;i--){var tl=s.tiles[i],m=tl.m;tl.ph+=dt;m.position.y+=tl.v*(1+t/120)*dt;m.position.x=tl.x0+Math.sin(tl.ph*1.3)*.35+(tl.bad>0?Math.sin(tl.bad*60)*.12:0);
   m.rotation.set(.15+Math.sin(tl.ph)*.08,Math.sin(tl.ph*.9)*.4,0);tl.bad=Math.max(0,tl.bad-dt);
   if(m.position.y>c.HH+1){c.remove(m);s.tiles.splice(i,1);}}
  for(i=s.fly.length-1;i>=0;i--){var f=s.fly[i];f.fly.tt+=dt*2.4;var e=Math.min(1,f.fly.tt),q=1-Math.pow(1-e,3);f.m.position.set(f.fly.x+(0-f.fly.x)*q,f.fly.y+(c.HH-3.2-f.fly.y)*q,1);f.m.scale.setScalar(1-q*.7);f.m.rotation.y+=dt*8;
   if(e>=1){c.remove(f.m);s.fly.splice(i,1);}}
  s.motes.forEach(function(m,i){m.position.y+=m.userData.v*dt;m.position.x+=Math.sin(t*.7+i)*.004;if(m.position.y>c.HH+1)m.position.y=-c.HH-1;});
  s.wall.forEach(function(m){if(m.userData.d>0){m.userData.d-=dt;return;}m.position.y+=(m.userData.ty-m.position.y)*Math.min(1,dt*9);});};
 return G;})();
