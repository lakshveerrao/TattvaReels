/* Arcade core for the game styles (Stickman Quest, Letter Builder, Block Builder): blocky voxel worlds. One WebGL renderer, an orthographic camera looking
   straight at the play plane (z=0) so taps map exactly to world x/y, chunky cube models with Minecraft-style shading,
   seeded randomness (same spawns for every player in a live game), a DOM HUD and tiny synth sound effects. */
var ARC=(function(){
 var T,R,ok=null,cv=null,host=null,scene,cam,hemi,sun,raf=0,run=null,ac=null,music=[],geoCache={},matV=null;
 var HW=5,HH=8;   // half extents of the visible world (x always ±5; y follows the screen aspect)
 function rngOf(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function init(){if(ok!==null)return ok;try{T=window.THREE;if(!T){ok=false;return ok;}
   cv=document.createElement('canvas');cv.className='arcv';R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:false});R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   matV=new T.MeshLambertMaterial({vertexColors:true});ok=true;}catch(e){if(window.console)console.warn('arcade init failed',e);ok=false;}return ok;}
 /* ---- models: parts = [[x,y,z,w,h,d,color],...] in blocks; merged once into one coloured mesh ---- */
 function model(key,parts,unit){unit=unit||.25;var g=geoCache[key];if(!g){var pos=[],nor=[],col=[],idx=[],c=new T.Color();
   parts.forEach(function(p){var b=new T.BoxGeometry(p[3]*unit,p[4]*unit,p[5]*unit);b.translate(p[0]*unit,p[1]*unit,p[2]*unit);c.set(p[6]);
    var bp=b.attributes.position,bn=b.attributes.normal,base=pos.length/3;for(var i=0;i<bp.count;i++){pos.push(bp.getX(i),bp.getY(i),bp.getZ(i));nor.push(bn.getX(i),bn.getY(i),bn.getZ(i));
     var sh=1-.06*((bp.getX(i)*7.3+bp.getY(i)*3.1)%1+1)%1;col.push(c.r*sh,c.g*sh,c.b*sh);}
    var bi=b.index.array;for(i=0;i<bi.length;i++)idx.push(base+bi[i]);});
   g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);geoCache[key]=g;}
  var m=new T.Mesh(g,matV);m.rotation.set(-.32,.55,0);return m;}
 var tileMats={},sideMat=null;
 function tile(text,color,size){var k=text+'|'+color;if(!tileMats[k]){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,128,128);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(0,0,128,10);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,118,128,10);
   x.fillStyle='#1A1206';var fs=text.length>3?50:text.length>2?62:76;x.font=fs+'px "Tiro Devanagari Sanskrit","Noto Serif Devanagari",serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,70);var tx=new T.CanvasTexture(c);tx.anisotropy=4;tileMats[k]=new T.MeshLambertMaterial({map:tx});}
  if(!sideMat)sideMat=new T.MeshLambertMaterial({color:0xb5803a});var s=size||1,m=new T.Mesh(new T.BoxGeometry(s,s,s*.6),[sideMat,sideMat,sideMat,sideMat,tileMats[k],sideMat]);return m;}
 function glow(color,size){var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,color);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
  var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size||1);return s;}
 /* ---- common blocky figures ---- */
 /* Sudarshana chakra drawn on a canvas (rings, spokes, a rim of flames); used as a spinning backdrop and as the thrown chakra */
 var chakraCache={};
 function chakraTex(color,flames){var k=color+(flames?'f':'');if(chakraCache[k])return chakraCache[k];var S=512,c=document.createElement('canvas');c.width=c.height=S;var x=c.getContext('2d'),m=S/2;
  x.strokeStyle=color;x.fillStyle=color;x.lineCap='round';x.lineJoin='round';
  if(flames){for(var i=0;i<24;i++){var a=i/24*Math.PI*2;x.save();x.translate(m,m);x.rotate(a);x.beginPath();x.moveTo(-18,-200);x.quadraticCurveTo(-6,-236,0,-252);x.quadraticCurveTo(6,-236,18,-200);x.closePath();x.globalAlpha=.85;x.fill();x.restore();}x.globalAlpha=1;}
  [[200,10],[178,4],[120,6],[64,8],[26,0]].forEach(function(r){x.beginPath();x.arc(m,m,r[0],0,Math.PI*2);if(r[1]){x.lineWidth=r[1];x.stroke();}else x.fill();});
  x.lineWidth=5;for(i=0;i<16;i++){a=i/16*Math.PI*2;x.beginPath();x.moveTo(m+Math.cos(a)*64,m+Math.sin(a)*64);x.lineTo(m+Math.cos(a)*178,m+Math.sin(a)*178);x.stroke();}
  x.lineWidth=3;for(i=0;i<16;i++){a=(i+.5)/16*Math.PI*2;x.beginPath();x.ellipse(m+Math.cos(a)*150,m+Math.sin(a)*150,16,9,a,0,Math.PI*2);x.stroke();}
  var t=new T.CanvasTexture(c);chakraCache[k]=t;return t;}
 // the hero: a young brahmachari with a shikha, vibhuti tripundra and a red dot, sacred thread, angavastram and dhoti
 function hero(){var F=new T.Group(),m=function(c){return new T.MeshLambertMaterial({color:c});},skin=m('#c98b5e'),dhoti=m('#fff3dc'),saf=m('#f08a24'),dk=m('#1a1206'),wh=m('#ffffff'),red=m('#d6202c');
  function box(w,h,d,mat,x,y,z,par,rz){var b=new T.Mesh(new T.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);if(rz)b.rotation.z=rz;(par||F).add(b);return b;}
  function limb(x,y,len,mat,w){var p=new T.Group();p.position.set(x,y,0);F.add(p);box(w||.13,len,.13,mat,0,-len/2,0,p);return p;}
  box(.46,.48,.46,skin,0,1.46,0);                                  // shaved head
  box(.1,.16,.1,dk,0,1.76,-.14);box(.06,.12,.06,dk,0,1.86,-.2);      // shikha
  box(.07,.09,.02,dk,.11,1.45,.235);box(.07,.09,.02,dk,-.07,1.45,.235); // eyes
  [1.56,1.6,1.64].forEach(function(y){box(.32,.022,.02,wh,0,y,.236);});box(.05,.05,.02,red,0,1.6,.248); // tripundra + kumkum
  box(.3,.6,.18,skin,0,.9,0);                                      // bare chest
  box(.035,.74,.02,wh,.02,.92,.095,null,-.5);                      // sacred thread
  box(.09,.7,.2,saf,-.06,.95,0,null,.55);                          // angavastram over the shoulder
  box(.4,.36,.24,dhoti,0,.5,0);box(.42,.05,.25,saf,0,.34,0);        // dhoti with a saffron border
  var r={F:F,aL:limb(-.2,1.15,.55,skin),aR:limb(.2,1.15,.55,skin),lL:limb(-.08,.5,.5,dhoti,.15),lR:limb(.08,.5,.5,dhoti,.15)};
  return r;}
 var LIB={
  person:function(skin,shirt,legs,s){s=s||1;return[[0,6*s,0,4*s,4*s,4*s,skin],[0,2.5*s,0,4*s,3*s,2*s,shirt],[-2.5*s,2.5*s,0,1*s,3*s,1.6*s,shirt],[2.5*s,2.5*s,0,1*s,3*s,1.6*s,shirt],[-1*s,-.5*s,0,1.8*s,3*s,1.8*s,legs],[1*s,-.5*s,0,1.8*s,3*s,1.8*s,legs],[-.9*s,6.3*s,2.05*s,.7*s,.7*s,.1,'#1a1206'],[.9*s,6.3*s,2.05*s,.7*s,.7*s,.1,'#1a1206']];},
  tree:function(trunk,leaf){return[[0,1,0,1.6,4,1.6,trunk],[0,4.5,0,6,3,6,leaf],[0,7,0,4,2,4,leaf],[0,8.6,0,2,1.2,2,leaf],[-2.2,4,1.5,1.4,1.4,1.4,'#7cc46a']];},
  pot:function(c){return[[0,0,0,4,1,4,c],[0,1.5,0,5,2,5,c],[0,3,0,4,1,4,c],[0,4,0,2.4,1,2.4,c],[0,4.8,0,3,.6,3,'#c98a4b']];},
  mountain:function(){return[[0,0,0,8,2,4,'#6b6f86'],[0,2,0,6,2,3.6,'#7a7f98'],[0,4,0,4,2,3,'#8a8fa8'],[0,5.6,0,2,1.4,2.4,'#eef2ff']];},
  temple:function(c){return[[0,0,0,4,2,4,'#8a5a2b'],[0,2.5,0,3.2,3,3.2,c],[0,5,0,2.4,2,2.4,c],[0,6.8,0,1.4,1.6,1.4,c],[0,8,0,.8,.8,.8,'#ffd27a']];},
  house:function(c,w){w=w||4;return[[0,0,0,w,4,4,c],[0,2.6,0,w+.6,1.2,4.4,'#7a3b22'],[-w/4,.6,2.05,1,1,.1,'#ffd27a'],[w/4,.6,2.05,1,1,.1,'#ffd27a']];}};
 /* ---- sound ---- */
 function audio(){if(!ac){try{var A=window.AudioContext||window.webkitAudioContext;ac=new A();}catch(e){ac=null;}}if(ac&&ac.state==='suspended')ac.resume();return ac;}
 function blip(f,d,type,vol,slide){var a=audio();if(!a)return;var t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime((vol||.08),t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02);}
 var SFX={good:function(k){blip(523*Math.pow(1.06,Math.min(12,k||0)),.12,'square',.06);setTimeout(function(){blip(784*Math.pow(1.06,Math.min(12,k||0)),.1,'square',.05);},60);},
  bad:function(){blip(180,.25,'sawtooth',.07,70);},pop:function(){blip(880,.06,'triangle',.07,1320);},jump:function(){blip(330,.15,'square',.05,660);},
  tick:function(){blip(1200,.03,'square',.03);},big:function(){[523,659,784,1046].forEach(function(f,i){setTimeout(function(){blip(f,.18,'square',.06);},i*70);});}};
 function startMusic(n){stopMusic();var a=audio();if(!a||typeof AUD==='undefined')return;[[n+'/sitar',.22],['drone_tanpura',.18],['rhythm_tabla',.2]].forEach(function(x){var b=AUD.buf[x[0]];if(!b)return;var s=a.createBufferSource(),g=a.createGain();g.gain.value=x[1];s.buffer=b;s.loop=true;s.connect(g);g.connect(a.destination);s.start();music.push(s);});}
 function stopMusic(){music.forEach(function(s){try{s.stop();}catch(e){}});music=[];}
 /* ---- run a game ---- */
 function size(){var w=host.clientWidth||360,h=host.clientHeight||640;R.setSize(w,h,false);HH=HW*h/w;if(cam){if(cam.isPerspectiveCamera){cam.aspect=w/h;}else{cam.left=-HW;cam.right=HW;cam.top=HH;cam.bottom=-HH;}cam.updateProjectionMatrix();}return{w:w,h:h};}
 function toWorld(e){var r=cv.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width*2-1,ny=-((e.clientY-r.top)/r.height*2-1);return{x:nx*HW,y:ny*HH,nx:nx,ny:ny};}
 function toScreen(x,y){return{x:(x/HW*.5+.5)*100,y:(-y/HH*.5+.5)*100};}
 function start(game,o){stop();if(!init())return false;host=o.host;host.innerHTML='';host.appendChild(cv);
  scene=new T.Scene();if(game.persp){cam=new T.PerspectiveCamera(45,1,.1,200);cam.position.set(0,8,14);cam.lookAt(0,0,0);}else{cam=new T.OrthographicCamera(-5,5,8,-8,-50,50);cam.position.z=20;}
  hemi=new T.HemisphereLight(0xfff4dd,0x3a2a50,.75);scene.add(hemi);sun=new T.DirectionalLight(0xffffff,.65);sun.position.set(3,6,8);scene.add(sun);
  var hud=document.createElement('div');hud.className='arhud';hud.innerHTML='<div class="arscore"><b>0</b><span>score</span></div><div class="arcombo" hidden></div><div class="pl-timer artimer"><b>60</b></div><div class="arpops"></div><div class="arword" hidden></div><div class="arline" hidden></div><div class="arhelp"></div><div class="artools"></div>';host.appendChild(hud);
  var dims=size(),rnd=rngOf(o.seed||1),dur=Math.min(120,o.secs||60),st={score:0,t:0,over:false,combo:0,lives:null};
  var ctx={T:T,scene:scene,cam:cam,model:model,glow:glow,LIB:LIB,rnd:rnd,SFX:SFX,level:o.level||1,tattva:o.tattva||1,voice:o.voice||{},hud:hud,tile:tile,
   word:function(html){var el=hud.querySelector('.arword');el.hidden=!html;if(html)el.innerHTML=html;},tools:function(html){var el=hud.querySelector('.artools');el.innerHTML=html||'';return el;},get HW(){return HW;},get HH(){return HH;},
   sky:function(a,b){bg.material.uniforms.a.value.set(a);bg.material.uniforms.b.value.set(b);},bgMesh:function(){return bg;},
   add:function(o3){scene.add(o3);return o3;},remove:function(o3){scene.remove(o3);},
   score:function(n,x,y,label){st.score=Math.max(0,st.score+n);hud.querySelector('.arscore b').textContent=st.score;if(x!=null)pop((n>0?'+':'')+n+(label?' '+label:''),x,y,n>0?'good':'bad');if(o.onScore)o.onScore(st.score);},
   combo:function(k){st.combo=k;var el=hud.querySelector('.arcombo');el.hidden=k<2;if(k>=2){el.textContent='×'+k+' combo';el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}},
   pop:function(t,x,y,cls){pop(t,x,y,cls);},help:function(t){var el=hud.querySelector('.arhelp');el.textContent=t||'';el.classList.toggle('on',!!t);},
   shake:function(){host.classList.remove('arshake');void host.offsetWidth;host.classList.add('arshake');},
   burst:function(x,y,color,n){for(var i=0;i<(n||10);i++){var m=model('shard'+color,[[0,0,0,1,1,1,color]],.12);m.position.set(x,y,1);m.userData.v=new T.Vector3((rnd()-.5)*8,rnd()*7+2,0);m.userData.life=.7;scene.add(m);shards.push(m);}},
   hero:hero,chakraTex:chakraTex,
   // a big chakra slowly turning behind the scene
   chakraBg:function(color,size,x,y,z,speed,op){var sp=new T.Sprite(new T.SpriteMaterial({map:chakraTex(color,true),transparent:true,opacity:op==null?.22:op,depthWrite:false}));sp.scale.setScalar(size);sp.position.set(x||0,y||0,z==null?-25:z);sp.userData.spin=speed==null?.08:speed;scene.add(sp);spins.push(sp);return sp;},
   recite:function(i){i=((i%4)+4)%4;var V=typeof TATTVAS!=='undefined'?TATTVAS[(o.tattva||1)-1]:null;if(ctx.voice.line)ctx.voice.line(i);if(!V)return;var el=hud.querySelector('.arline');
    el.innerHTML='<b>'+(i<3?V.dev[i]:L4.dev)+'</b><span>'+(i<3?V.en[i]:L4.en)+'</span>';el.hidden=false;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');clearTimeout(lineT);lineT=setTimeout(function(){el.hidden=true;},7500);},
   end:function(){finish();},get t(){return st.t;},get left(){return Math.max(0,dur-st.t);},get dur(){return dur;}};
  var shards=[],lineT=0,spins=[];
  function pop(t,x,y,cls){var el=document.createElement('span'),p=toScreen(x,y);el.className='arpop '+(cls||'');el.textContent=t;el.style.left=p.x+'%';el.style.top=p.y+'%';hud.querySelector('.arpops').appendChild(el);setTimeout(function(){el.remove();},900);}
  var bg=new T.Mesh(new T.PlaneGeometry(40,60),new T.ShaderMaterial({depthWrite:false,uniforms:{a:{value:new T.Color(game.sky?game.sky[0]:'#1b1030')},b:{value:new T.Color(game.sky?game.sky[1]:'#07050f')}},vertexShader:'varying float vY;void main(){vY=position.y/60.+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 a,b;varying float vY;void main(){gl_FragColor=vec4(mix(b,a,smoothstep(.3,.75,vY)),1.);}'}));bg.position.z=-30;scene.add(bg);
  game.setup(ctx);
  var down=null,last=null,trail=[];
  function pd(e){e.preventDefault();var p=toWorld(e);down=p;last=p;trail=[{x:p.x,y:p.y,t:st.t}];audio();if(game.down)game.down(p.x,p.y,ctx,p);}
  function pm(e){var p=toWorld(e);if(down){trail.push({x:p.x,y:p.y,t:st.t});if(trail.length>12)trail.shift();if(game.drag)game.drag(p.x,p.y,p.x-last.x,p.y-last.y,ctx,trail,p);}else if(game.hover)game.hover(p.x,p.y,ctx);last=p;}
  function pu(e){if(!down)return;var p=toWorld(e),moved=Math.hypot(p.x-down.x,p.y-down.y);if(moved<.35&&game.tap)game.tap(down.x,down.y,ctx,down);if(game.up)game.up(p.x,p.y,ctx,p);down=null;}
  cv.onpointerdown=pd;cv.onpointermove=pm;cv.onpointerup=pu;cv.onpointercancel=pu;cv.onpointerleave=pu;
  var kd=function(e){if(game.key&&(e.key===' '||e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();game.key(e.key,ctx);}};window.addEventListener('keydown',kd);
  if(o.music!==false)startMusic(o.tattva||1);
  var prev=performance.now(),lastSec=dur;
  // the clock follows real time even on a slow phone (live players must finish together); motion is stepped in ≤50 ms slices
  function frame(now){var real=Math.min(.25,(now-prev)/1000)*(o.timeScale||1),dt=Math.min(.05,real);prev=now;if(o.onFrame)o.onFrame(dt,ctx);
   while(real>0){dt=Math.min(.05,real);real-=dt;
    if(!st.over){st.t+=dt;game.update(dt,st.t,ctx);if(st.t>=dur){finish();}}else if(game.after)game.after(dt,ctx);}
   if(!st.over){var left=Math.max(0,dur-st.t),tl=hud.querySelector('.artimer');tl.querySelector('b').textContent=Math.ceil(left);tl.style.setProperty('--p',(left/dur).toFixed(3));
    if(Math.ceil(left)!==lastSec){lastSec=Math.ceil(left);if(lastSec<=5&&lastSec>0)SFX.tick();}}
   spins.forEach(function(sp){sp.material.rotation+=sp.userData.spin*dt*(o.timeScale||1);});
   for(var i=shards.length-1;i>=0;i--){var m=shards[i];m.userData.v.y-=18*dt;m.position.addScaledVector(m.userData.v,dt);m.rotation.x+=dt*8;m.userData.life-=dt;m.scale.setScalar(Math.max(.01,m.userData.life/.7));if(m.userData.life<=0){scene.remove(m);shards.splice(i,1);}}
   R.render(scene,cam);raf=requestAnimationFrame(frame);}
  function finish(){if(st.over)return;st.over=true;stopMusic();SFX.big();var d=game.finish?game.finish(ctx):0;if(o.onEnd)setTimeout(function(){o.onEnd(st.score);},d||700);}
  var ro=new ResizeObserver(size);ro.observe(host);
  run={ctx:ctx,stop:function(){cancelAnimationFrame(raf);clearTimeout(lineT);ro.disconnect();window.removeEventListener('keydown',kd);stopMusic();cv.onpointerdown=cv.onpointermove=cv.onpointerup=null;},st:st};
  raf=requestAnimationFrame(frame);return true;}
 function stop(){if(run){run.stop();run=null;}}
 // A static preview frame of a game for the feed card.
 return{start:start,stop:stop,init:init,rngOf:rngOf,audio:audio,SFX:SFX,get running(){return !!run;},get ctx(){return run?run.ctx:null;},get score(){return run?run.st.score:0;}};
})();
var ARCADE={};
