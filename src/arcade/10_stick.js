/* Stickman Quest: a side-scrolling run through a blocky world themed on the tattva. Tap to jump (tap again in the air
   for a double jump). Collect the akṣaras of each word in order; a finished word shows its meaning and the shloka is
   recited line by line as you go. Falling only costs points. Same seed = same world for every player. */
ARCADE.stick=(function(){
 var TH={
  1:{sky:['#3b2b6e','#0c0820'],g1:'#8fd17e',g2:'#7cc46a',dirt:'#7a4e2c',stone:'#8a8fa8',prop:'house',orb:'#dfe6ff'},
  2:{sky:['#2f6a5a','#08160f'],g1:'#79c96a',g2:'#6ab85c',dirt:'#6b4423',stone:'#8a7a5a',prop:'tree',orb:'#fff1b0'},
  3:{sky:['#7a3d2a','#140a08'],g1:'#d8b46a',g2:'#c9a55c',dirt:'#8a5a2b',stone:'#a08a6a',prop:'temple',orb:'#ffd27a'},
  4:{sky:['#24244a','#05050c'],g1:'#86b86e',g2:'#78a862',dirt:'#5a3a22',stone:'#6b6f86',prop:'pot',orb:'#ffcf80'},
  5:{sky:['#4a5a8a','#0e1424'],g1:'#9fd3a0',g2:'#8cc48e',dirt:'#6a5040',stone:'#9a9fb8',prop:'mountain',orb:'#ffffff'},
  6:{sky:['#6a2a10','#120604'],g1:'#c9a050',g2:'#b8904a',dirt:'#6b3a1c',stone:'#7a5a3a',prop:'temple',orb:'#ffb040'},
  7:{sky:['#2a4a6a','#081018'],g1:'#7fcf9a',g2:'#70c08a',dirt:'#5a4030',stone:'#8a8fa8',prop:'tree',orb:'#e8f0ff'},
  8:{sky:['#2a1f5a','#07051a'],g1:'#8fb0e0',g2:'#80a0d0',dirt:'#4a3a6a',stone:'#7a70a0',prop:'house',orb:'#f4f0d0'}};
 var HOUSES=['#e9c46a','#f4a261','#e76f51','#8ab17d','#a8dadc','#cdb4db'];
 var G={name:'Stickman Quest',secs:75,short:'Run, jump, collect the letters',how:'Tap to jump, tap again in the air to double jump. Collect the letters of each word in order.',s:null};
 function h32(n){var a=n*2654435761>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function escH(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function figure(T,c){var r=c.hero();r.F.rotation.y=.55;r.F.scale.setScalar(1.3);return r;}
 G.setup=function(c){var T=c.T,n=c.tattva,th=TH[n]||TH[1];c.sky(th.sky[0],th.sky[1]);
  var r2=ARC.rngOf(Math.floor(c.rnd()*1e9)),gy=-c.HH*.32,px=-2.6,lv=c.level;
  var words=WORDS.forTattva(n),key=words.filter(function(w){return WORDS.isKey(n,w);}),rest=words.filter(function(w){return !WORDS.isKey(n,w);});
  for(var i=rest.length-1;i>0;i--){var j=Math.floor(r2()*(i+1)),t=rest[i];rest[i]=rest[j];rest[j]=t;}
  var order=rest.slice(0,1).concat(key.slice(0,1),rest.slice(1));if(!order.length)order=[{dev:'ॐ',ak:['ॐ'],iast:'om',mean:'Om'}];
  var pool=[];words.forEach(function(w){w.ak.forEach(function(a){if(pool.indexOf(a)<0)pool.push(a);});});
  var s=G.s={c:c,th:th,gy:gy,px:px,y:gy,vy:0,ground:true,jumps:0,v:4.2+lv*.6,segs:[],tiles:[],props:[],genX:-c.HW-2,segN:0,dist:0,nextTile:3,nextProp:0,
   order:order,wi:0,got:0,pool:pool,since:0,combo:0,words:0,line:0,lastLine:-99,inv:0,pause:0,ph:0,fig:figure(T,c)};
  c.add(s.fig.F);s.fig.F.position.set(px,gy,1);
  var halo=c.glow('rgba(255,210,120,.6)',1.6);s.fig.F.add(halo);halo.position.set(0,1.45,-.3);
  c.chakraBg(th.orb,c.HH*1.5,0,c.HH*.18,-28,.06,.16);
  var orb=c.glow(th.orb,n===6?5:3.6);orb.position.set(2.7,c.HH-7,-20);c.add(orb);
  if(n===6){var d=new T.Mesh(new T.CircleGeometry(.95,32),new T.MeshBasicMaterial({color:0x120604}));d.position.set(2.95,c.HH-6.75,-19);c.add(d);s.rahu=d;}
  // ground runs off the left edge at the start
  addSeg(s,-c.HW-2,Math.ceil((c.HW*2+8)/.5)*.5,false);
  showWord(s);c.help('Tap to jump · tap again to double jump');
  for(var k=0;k<4;k++)addProp(s,-c.HW+k*3.4+r2()*.5);};
 function addSeg(s,x,len,plat,y){var c=s.c,nb=Math.round(len/.5),depth=plat?2:Math.ceil((s.gy+c.HH+3)/.5),hr=h32(nb*31+(plat?7:3)+depth),parts=[];
  for(var i=0;i<nb;i++){parts.push([i+.5,-.5,0,1,1,2,i%2?s.th.g1:s.th.g2]);parts.push([i+.5,-1-depth/2,0,1,depth,2,s.th.dirt]);
   if(!plat&&hr()<.35)parts.push([i+.5,-2.5-Math.floor(hr()*(depth-3)),0,1,1,2.1,s.th.stone]);}
  if(plat){parts[0][6]=s.th.stone;}
  var m=c.model('stk'+nb+(plat?'p':'g')+depth+s.th.g1,parts,.5);m.rotation.set(.28,0,0);var sy=y==null?s.gy:y;m.position.set(x,sy,0);c.add(m);
  s.segs.push({x:x,w:nb*.5,y:sy,m:m,plat:!!plat});}
 function addProp(s,x){var c=s.c,th=s.th,k=th.prop,hr=s.props.length,parts,key;
  if(k==='house'){var col=HOUSES[(s.segN+hr)%HOUSES.length];parts=c.LIB.house(col,3+(hr%3));key='sh'+col+(hr%3);}
  else if(k==='tree'){parts=c.LIB.tree('#6b4423',hr%2?'#4f9a4a':'#3f8a44');key='st'+(hr%2);}
  else if(k==='temple'){parts=c.LIB.temple('#c98a4b');key='stp';}
  else if(k==='pot'){parts=c.LIB.pot('#a0522d');key='spt';}
  else{parts=c.LIB.mountain();key='smt';}
  var m=c.model(key,parts,k==='mountain'?.5:.3);m.rotation.set(.05,.5,0);m.position.set(x,s.gy+(k==='mountain'?.5:.55),-8);c.add(m);
  if(k==='pot'){var gl=c.glow('rgba(255,180,80,.9)',1.6);gl.position.set(0,2.4,0);m.add(gl);}
  s.props.push(m);}
 function word(s){return s.order[s.wi%s.order.length];}
 function isKeyW(s){return WORDS.isKey(s.c.tattva,word(s));}
 function showWord(s,done){var w=word(s),k=isKeyW(s);
  s.c.word('<div class="ww'+(done?' done':'')+(k?' key':'')+'"><span class="wk">'+(done?'Word complete':k?'Key word · double points':'Collect')+'</span><div class="wak">'+
   w.ak.map(function(a,i){return'<i class="'+(done||i<s.got?'on':'')+(!done&&i===s.got?' nx':'')+'">'+escH(a)+'</i>';}).join('')+'</div><span class="wm">'+escH(w.iast)+' · '+escH(w.mean)+'</span></div>');}
 function jump(c){var s=G.s;if(!s||s.pause>0)return;if(s.ground){s.vy=11.2;s.ground=false;s.jumps=1;c.SFX.jump();}else if(s.jumps<2){s.vy=10;s.jumps=2;c.SFX.jump();}}
 G.jump=jump;G.tap=function(x,y,c){jump(c);};G.key=function(k,c){if(k===' '||k==='ArrowUp')jump(c);};
 function segAt(s,x){for(var i=0;i<s.segs.length;i++){var g=s.segs[i];if(!g.plat&&x>g.x+.2&&x<g.x+g.w-.2)return g;}return null;}
 function spawnTile(s){var c=s.c,w=word(s),need=w.ak[s.got];if(need==null)return;var x=c.HW+1.5,over=segAt(s,x),r=c.rnd();
  var isNeed=s.since>=1||r<.55,txt=need;if(!isNeed){var tries=0;do{txt=s.pool[Math.floor(c.rnd()*s.pool.length)];}while(txt===need&&++tries<8);if(txt===need)isNeed=true;}
  var hs=over?[.95,2.3,3.6]:[2.3,3.4],hy=hs[Math.floor(c.rnd()*hs.length)];
  var m=c.tile(txt,isKeyW(s)?'#ffd27a':'#f6e7c8',.95);m.position.set(x,s.gy+hy,.6);c.add(m);s.tiles.push({m:m,txt:txt,t:0});s.since=isNeed?0:s.since+1;}
 function shift(s,dx){s.segs.forEach(function(g){g.x-=dx;g.m.position.x=g.x;});s.tiles.forEach(function(t){t.m.position.x-=dx;});s.genX-=dx;}
 G.update=function(dt,t,c){var s=G.s,i;
  if(t>4&&t<4.2)c.help('');
  if(t>1&&s.lastLine<0){c.recite(0);s.line=1;s.lastLine=t;}
  // world generation ahead of the screen (only the segment order uses the shared seed, so everyone gets the same world)
  while(s.genX<c.HW+12){var gap=s.segN===0?0:1.2+c.rnd()*(.7+.35*s.c.level),len=Math.round((4+c.rnd()*6)*2)/2;s.genX+=gap;
   addSeg(s,s.genX,len,false);if(s.segN>1&&c.rnd()<.35){var pl=Math.round((1.5+c.rnd()*1.5)*2)/2;addSeg(s,s.genX-gap*.5-pl*.5+(c.rnd()<.5?0:len*.4),pl,true,s.gy+2.3);}
   s.genX+=len;s.segN++;}
  var v=s.pause>0?s.v*.35:s.v;s.pause=Math.max(0,s.pause-dt);var dx=v*dt;s.dist+=dx;shift(s,dx);
  for(i=0;i<s.props.length;i++){var p=s.props[i];p.position.x-=dx*.35;if(p.position.x<-c.HW-4){c.remove(p);s.props.splice(i,1);i--;}}
  if(s.dist>s.nextProp){s.nextProp=s.dist+3+c.rnd()*2.5;addProp(s,c.HW+4);}
  if(s.dist>s.nextTile){s.nextTile=s.dist+2.4-Math.min(.6,t*.006);spawnTile(s);}
  // physics
  var prevY=s.y;s.vy-=30*dt;s.y+=s.vy*dt;var landed=false;
  if(s.vy<=0)for(i=0;i<s.segs.length;i++){var g=s.segs[i];if(px(s)>g.x-.15&&px(s)<g.x+g.w+.15&&prevY>=g.y-.05&&s.y<=g.y){s.y=g.y;s.vy=0;landed=true;break;}}
  if(landed){if(!s.ground){s.ground=true;s.jumps=0;}}else s.ground=false;
  if(s.y<s.gy-3.5){var nx=null;s.segs.forEach(function(g){if(!g.plat&&g.x>px(s)-1&&(!nx||g.x<nx.x))nx=g;});if(nx)shift(s,nx.x-px(s)+.8);s.y=s.gy+2.5;s.vy=0;s.inv=1.2;s.combo=0;c.combo(0);c.score(-10,px(s),s.gy+1.5,'fell');c.SFX.bad();c.shake();}
  // tiles
  for(i=s.tiles.length-1;i>=0;i--){var tl=s.tiles[i],m=tl.m;tl.t+=dt;m.rotation.set(.12,Math.sin(tl.t*2.2+i)*.35,0);m.position.y+=Math.sin(tl.t*3+i)*.004;
   if(Math.abs(m.position.x-px(s))<.62&&m.position.y>s.y-.35&&m.position.y<s.y+2.05){collect(s,tl);c.remove(m);s.tiles.splice(i,1);continue;}
   if(m.position.x<-c.HW-2){c.remove(m);s.tiles.splice(i,1);}}
  for(i=s.segs.length-1;i>=0;i--)if(s.segs[i].x+s.segs[i].w<-c.HW-3){c.remove(s.segs[i].m);s.segs.splice(i,1);}
  // figure
  var f=s.fig;f.F.position.y=s.y;s.inv=Math.max(0,s.inv-dt);f.F.visible=s.inv<=0||Math.floor(s.inv*12)%2===0;
  if(s.ground){s.ph+=dt*v*2.3;var sw=Math.sin(s.ph);f.lL.rotation.z=sw*.75;f.lR.rotation.z=-sw*.75;f.aL.rotation.z=-sw*.6;f.aR.rotation.z=sw*.6;f.F.rotation.z=0;}
  else{f.lL.rotation.z=.9;f.lR.rotation.z=-.2;f.aL.rotation.z=-2.4;f.aR.rotation.z=2.4;f.F.rotation.z=s.jumps===2?f.F.rotation.z-dt*9:0;}
  if(s.rahu)s.rahu.position.x=2.95-Math.sin(t*.25)*.8;};
 function px(s){return s.px;}
 function collect(s,tl){var c=s.c,w=word(s),need=w.ak[s.got],x=tl.m.position.x,y=tl.m.position.y,k=isKeyW(s)?2:1;if(need==null)return;
  if(tl.txt===need){s.got++;s.combo++;c.combo(s.combo);c.score((10+Math.min(10,s.combo*2))*k,x,y);c.SFX.good(s.combo);c.burst(x,y,'#ffd27a',8);
   if(s.got>=w.ak.length){c.score(25*k,x,y+1,'word');c.SFX.big();showWord(s,true);s.words++;s.pause=.8;
    if(s.words%2===0&&c.t-s.lastLine>8){c.recite(s.line++);s.lastLine=c.t;}
    setTimeout(function(){if(G.s!==s)return;s.wi++;s.got=0;s.since=1;showWord(s);},1500);}
   else showWord(s);}
  else{s.combo=0;c.combo(0);c.score(-5,x,y);c.SFX.bad();c.shake();c.burst(x,y,'#ff6a5a',6);}}
 return G;})();
