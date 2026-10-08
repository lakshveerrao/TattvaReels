/* Chakra Launch: the young brahmachari stands at the bottom holding a spinning Sudarshana chakra. Drag to aim, let go
   to throw. The chakra cuts through the walls of māyā (dark blocks) and must strike the akṣaras of the word in order;
   it bounces off the sides and flies back to his hand. Finished words show their meaning; the shloka plays line by line. */
ARCADE.chakra=(function(){
 var SKY={1:['#3b2b6e','#0c0820'],2:['#245a4a','#06120c'],3:['#6a3424','#120806'],4:['#24244a','#05050c'],5:['#3e4e7e','#0c1220'],6:['#5a2410','#100503'],7:['#24445e','#060e16'],8:['#2a1f5a','#07051a']};
 var G={name:'Chakra Launch',secs:60,short:'Aim the chakra, break māyā',how:'Drag to aim, let go to throw the chakra. Break the walls of māyā and hit the letters of each word in order.',s:null};
 function escH(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var MAYA=['#3a2a6a','#4a3480','#2f2458','#56408f'];
 G.setup=function(c){var T=c.T,n=c.tattva,sk=SKY[n]||SKY[1];c.sky(sk[0],sk[1]);
  var r2=ARC.rngOf(Math.floor(c.rnd()*1e9));
  var words=WORDS.forTattva(n),key=words.filter(function(w){return WORDS.isKey(n,w);}),rest=words.filter(function(w){return !WORDS.isKey(n,w);});
  for(var i=rest.length-1;i>0;i--){var j=Math.floor(r2()*(i+1)),t=rest[i];rest[i]=rest[j];rest[j]=t;}
  var order=key.slice(0,1).concat(rest);
  var pool=[];words.forEach(function(w){w.ak.forEach(function(a){if(pool.indexOf(a)<0)pool.push(a);});});
  c.chakraBg('#F4B73A',9,0,1,-20,.04,.12);c.hud.classList.add('captop','capbelow');
  var by=-c.HH+1.1,s=G.s={c:c,order:order,wi:0,got:0,pool:pool,blocks:[],tiles:[],combo:0,words:0,line:0,lastLine:-99,aim:Math.PI/2,aiming:false,
   lx:0,ly:by+2.1,fly:null,regrow:6,top:c.HH-7.4,bot:-c.HH*.3,dots:[]};
  // the hero, facing up the screen, chakra raised
  var h=c.hero();h.F.position.set(0,by,1);h.F.scale.setScalar(1.25);h.F.rotation.y=.25;h.aR.rotation.z=2.6;h.aL.rotation.z=-.5;c.add(h.F);s.hero=h;
  var ground=c.model('ckg',(function(){var p=[];for(var x=0;x<22;x++)p.push([x-10.5,0,0,1,1,2,x%2?'#6b5a48':'#7a6854']);return p;})(),.5);ground.rotation.set(.3,0,0);ground.position.set(0,by,0);c.add(ground);
  s.ch=new T.Sprite(new T.SpriteMaterial({map:c.chakraTex('#FFC94A',true),transparent:true,depthWrite:false}));s.ch.scale.setScalar(1.05);s.ch.position.set(s.lx,s.ly,2);c.add(s.ch);
  var gl=c.glow('rgba(255,200,90,.9)',1.8);gl.position.z=-.1;s.ch.add(gl);
  for(i=0;i<9;i++){var d=c.glow('rgba(255,230,160,.9)',.32);d.visible=false;c.add(d);s.dots.push(d);}
  buildWall(s);layLetters(s);showWord(s);c.help(LX('Drag to aim, let go to throw'));};
 function cellKey(x,y){return x.toFixed(1)+','+y.toFixed(1);}
 function buildWall(s){var c=s.c,rows=Math.floor((s.top-s.bot)/1.0);
  for(var r=0;r<rows;r++)for(var col=0;col<9;col++){if(c.rnd()<.28)continue;addBlock(s,-4+col,s.bot+r*1.0);}}
 function addBlock(s,x,y){var c=s.c;if(s.blocks.some(function(b){return Math.abs(b.x-x)<.5&&Math.abs(b.y-y)<.5;})||s.tiles.some(function(t){return Math.abs(t.x-x)<.5&&Math.abs(t.y-y)<.5;}))return;
  var col=MAYA[Math.floor(c.rnd()*MAYA.length)],m=c.model('maya'+col,[[0,0,0,3.4,3.4,3.4,col],[0,0,1.75,2.2,.3,.1,'#7a5fc0'],[0,.9,1.75,.3,.3,.1,'#9d86e0']],.25);m.rotation.set(.18,.25,0);m.position.set(x,y,0);m.scale.setScalar(.01);m.userData.g=0;c.add(m);
  s.blocks.push({x:x,y:y,m:m});}
 function word(s){return s.order[s.wi%s.order.length];}
 function need(s){var w=word(s);return s.got<w.ak.length?w.ak[s.got]:null;}
 function isKeyW(s){return WORDS.isKey(s.c.tattva,word(s));}
 function showWord(s,done){var w=word(s),k=isKeyW(s);
  s.c.word('<div class="ww'+(done?' done':'')+(k?' key':'')+'"><span class="wk">'+escH(LX(done?'Word complete':k?'Key word · double points':'Strike in order'))+'</span><div class="wak">'+
   w.ak.map(function(a,i){return'<i class="'+(done||i<s.got?'on':'')+(!done&&i===s.got?' nx':'')+'">'+escH(a)+'</i>';}).join('')+'</div><span class="wm">'+escH(w.iast)+' · '+escH(w.mean)+'</span></div>');}
 // put the letters of the word (and a few decoys) into the wall, replacing blocks
 function layLetters(s){var c=s.c;s.tiles.forEach(function(t){c.remove(t.m);});s.tiles=[];var w=word(s),list=w.ak.slice(),dec=Math.min(4,2+c.level);
  for(var i=0;i<dec;i++){var d=s.pool[Math.floor(c.rnd()*s.pool.length)];if(list.indexOf(d)<0)list.push(d);}
  var cells=[];for(var r=0;r<Math.floor((s.top-s.bot)/1.0);r++)for(var col=0;col<9;col++)cells.push([-4+col,s.bot+r]);
  for(i=cells.length-1;i>0;i--){var j=Math.floor(c.rnd()*(i+1)),t=cells[i];cells[i]=cells[j];cells[j]=t;}
  list.forEach(function(txt,i){var cl=cells[i];s.blocks=s.blocks.filter(function(b){if(Math.abs(b.x-cl[0])<.5&&Math.abs(b.y-cl[1])<.5){c.remove(b.m);return false;}return true;});
   var m=c.tile(txt,isKeyW(s)&&w.ak.indexOf(txt)>=0?'#ffd27a':'#f6e7c8',.86);m.position.set(cl[0],cl[1],.2);c.add(m);s.tiles.push({x:cl[0],y:cl[1],txt:txt,m:m,bad:0});});}
 function aimAt(s,x,y){var a=Math.atan2(y-s.ly,x-s.lx);s.aim=Math.max(.22,Math.min(Math.PI-.22,a));}
 function launch(s){if(s.fly)return;var sp=13+s.c.level;s.fly={vx:Math.cos(s.aim)*sp,vy:Math.sin(s.aim)*sp,t:0,back:false,hit:{}};s.c.SFX.jump();s.c.help('');}
 G.down=function(x,y,c){var s=G.s;if(s.fly)return;s.aiming=true;aimAt(s,x,y);};
 G.drag=function(x,y,dx,dy,c){var s=G.s;if(s.aiming)aimAt(s,x,y);};
 G.up=function(x,y,c){var s=G.s;if(!s.aiming)return;s.aiming=false;aimAt(s,x,y);launch(s);};
 G.key=function(k,c){var s=G.s;if(k==='ArrowLeft')s.aim=Math.min(Math.PI-.22,s.aim+.12);else if(k==='ArrowRight')s.aim=Math.max(.22,s.aim-.12);else launch(s);};
 G.throwAt=function(x,y){var s=G.s;aimAt(s,x,y);launch(s);};
 function strike(s,t){var c=s.c,nd=need(s),k=isKeyW(s)?2:1;
  if(t.txt===nd){s.got++;s.combo++;c.combo(s.combo);c.score((10+Math.min(10,s.combo*2))*k,t.x,t.y);c.SFX.good(s.combo);c.burst(t.x,t.y,'#ffd27a',10);c.remove(t.m);s.tiles.splice(s.tiles.indexOf(t),1);
   if(s.got>=word(s).ak.length){c.score(25*k,0,c.HH-6,LX('word'));c.SFX.big();showWord(s,true);s.words++;
    if(s.words%2===1&&c.t-s.lastLine>7){c.recite(s.line++);s.lastLine=c.t;}
    setTimeout(function(){if(G.s!==s)return;s.wi++;s.got=0;layLetters(s);showWord(s);},1200);}
   else showWord(s);return true;}
  s.combo=0;c.combo(0);c.score(-5,t.x,t.y);c.SFX.bad();c.shake();t.bad=.5;return false;}
 G.update=function(dt,t,c){var s=G.s,i;
  if(t>1&&s.lastLine<0){c.recite(0);s.line=1;s.lastLine=t;}
  s.blocks.forEach(function(b){if(b.m.userData.g<1){b.m.userData.g=Math.min(1,b.m.userData.g+dt*4);b.m.scale.setScalar(b.m.userData.g);}});
  s.tiles.forEach(function(tl,k){tl.m.rotation.set(.12,Math.sin(t*1.6+k)*.3,0);tl.bad=Math.max(0,tl.bad-dt);tl.m.position.x=tl.x+(tl.bad>0?Math.sin(tl.bad*60)*.1:0);});
  // aim guide
  var show=!s.fly;s.dots.forEach(function(d,k){d.visible=show;if(show){var r=1.1+k*.75;d.position.set(s.lx+Math.cos(s.aim)*r,s.ly+Math.sin(s.aim)*r,1.5);d.material.opacity=1-k/10;}});
  var ch=s.ch;ch.material.rotation-=dt*(s.fly?18:5);
  if(s.fly){var f=s.fly;f.t+=dt;
   if(f.back||f.t>1.9){f.back=true;var dx=s.lx-ch.position.x,dy=s.ly-ch.position.y,d=Math.hypot(dx,dy),sp=17;if(d<.4){s.fly=null;ch.position.set(s.lx,s.ly,2);}else{f.vx=dx/d*sp;f.vy=dy/d*sp;}}
   if(s.fly){ch.position.x+=f.vx*dt;ch.position.y+=f.vy*dt;
    if(!f.back){if(ch.position.x<-c.HW+.5){ch.position.x=-c.HW+.5;f.vx=Math.abs(f.vx);}if(ch.position.x>c.HW-.5){ch.position.x=c.HW-.5;f.vx=-Math.abs(f.vx);}if(ch.position.y>c.HH-1.2){f.back=true;}}
    var px=ch.position.x,py=ch.position.y;
    for(i=s.blocks.length-1;i>=0;i--){var b=s.blocks[i];if(Math.abs(b.x-px)<.75&&Math.abs(b.y-py)<.75){c.remove(b.m);s.blocks.splice(i,1);c.burst(b.x,b.y,'#9d86e0',6);c.score(1);c.SFX.pop();}}
    if(!f.back)for(i=s.tiles.length-1;i>=0;i--){var tl=s.tiles[i],kk=tl.txt+tl.x+tl.y;if(f.hit[kk])continue;if(Math.abs(tl.x-px)<.58&&Math.abs(tl.y-py)<.58){f.hit[kk]=1;strike(s,tl);}}}}
  else ch.position.set(s.lx,s.ly,2);
  s.hero.aR.rotation.z=s.fly?1.2:2.6;
  // māyā grows back
  s.regrow-=dt;if(s.regrow<=0){s.regrow=3.5-Math.min(1.5,c.level*.4);for(var k2=0;k2<3;k2++)addBlock(s,-4+Math.floor(c.rnd()*9),s.bot+Math.floor(c.rnd()*Math.floor((s.top-s.bot))));}};
 return G;})();
