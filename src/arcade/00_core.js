/* Arcade core: blocky (voxel) 60-second games, one per tattva. One WebGL renderer, an orthographic camera looking
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
 function glow(color,size){var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,color);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
  var s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.scale.setScalar(size||1);return s;}
 /* ---- common blocky figures ---- */
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
 function size(){var w=host.clientWidth||360,h=host.clientHeight||640;R.setSize(w,h,false);HH=HW*h/w;if(cam){cam.left=-HW;cam.right=HW;cam.top=HH;cam.bottom=-HH;cam.updateProjectionMatrix();}return{w:w,h:h};}
 function toWorld(e){var r=cv.getBoundingClientRect();return{x:((e.clientX-r.left)/r.width*2-1)*HW,y:-((e.clientY-r.top)/r.height*2-1)*HH};}
 function toScreen(x,y){return{x:(x/HW*.5+.5)*100,y:(-y/HH*.5+.5)*100};}
 function start(game,o){stop();if(!init())return false;host=o.host;host.innerHTML='';host.appendChild(cv);
  scene=new T.Scene();cam=new T.OrthographicCamera(-5,5,8,-8,-50,50);cam.position.z=20;
  hemi=new T.HemisphereLight(0xfff4dd,0x3a2a50,.75);scene.add(hemi);sun=new T.DirectionalLight(0xffffff,.65);sun.position.set(3,6,8);scene.add(sun);
  var hud=document.createElement('div');hud.className='arhud';hud.innerHTML='<div class="arscore"><b>0</b><span>score</span></div><div class="arcombo" hidden></div><div class="pl-timer artimer"><b>60</b></div><div class="arpops"></div><div class="arhelp"></div>';host.appendChild(hud);
  var dims=size(),rnd=rngOf(o.seed||1),dur=Math.min(60,o.secs||60),st={score:0,t:0,over:false,combo:0,lives:null};
  var ctx={T:T,scene:scene,model:model,glow:glow,LIB:LIB,rnd:rnd,SFX:SFX,level:o.level||1,get HW(){return HW;},get HH(){return HH;},
   add:function(o3){scene.add(o3);return o3;},remove:function(o3){scene.remove(o3);},
   score:function(n,x,y,label){st.score=Math.max(0,st.score+n);hud.querySelector('.arscore b').textContent=st.score;if(x!=null)pop((n>0?'+':'')+n+(label?' '+label:''),x,y,n>0?'good':'bad');if(o.onScore)o.onScore(st.score);},
   combo:function(k){st.combo=k;var el=hud.querySelector('.arcombo');el.hidden=k<2;if(k>=2){el.textContent='×'+k+' combo';el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}},
   pop:function(t,x,y,cls){pop(t,x,y,cls);},help:function(t){var el=hud.querySelector('.arhelp');el.textContent=t||'';el.classList.toggle('on',!!t);},
   shake:function(){host.classList.remove('arshake');void host.offsetWidth;host.classList.add('arshake');},
   burst:function(x,y,color,n){for(var i=0;i<(n||10);i++){var m=model('shard'+color,[[0,0,0,1,1,1,color]],.12);m.position.set(x,y,1);m.userData.v=new T.Vector3((rnd()-.5)*8,rnd()*7+2,0);m.userData.life=.7;scene.add(m);shards.push(m);}},
   end:function(){finish();},get t(){return st.t;},get left(){return Math.max(0,dur-st.t);},get dur(){return dur;}};
  var shards=[];
  function pop(t,x,y,cls){var el=document.createElement('span'),p=toScreen(x,y);el.className='arpop '+(cls||'');el.textContent=t;el.style.left=p.x+'%';el.style.top=p.y+'%';hud.querySelector('.arpops').appendChild(el);setTimeout(function(){el.remove();},900);}
  var bg=new T.Mesh(new T.PlaneGeometry(40,60),new T.ShaderMaterial({depthWrite:false,uniforms:{a:{value:new T.Color(game.sky?game.sky[0]:'#1b1030')},b:{value:new T.Color(game.sky?game.sky[1]:'#07050f')}},vertexShader:'varying float vY;void main(){vY=position.y/60.+.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 a,b;varying float vY;void main(){gl_FragColor=vec4(mix(b,a,smoothstep(.3,.75,vY)),1.);}'}));bg.position.z=-30;scene.add(bg);
  game.setup(ctx);
  var down=null,last=null,trail=[];
  function pd(e){e.preventDefault();var p=toWorld(e);down=p;last=p;trail=[{x:p.x,y:p.y,t:st.t}];audio();if(game.down)game.down(p.x,p.y,ctx);}
  function pm(e){var p=toWorld(e);if(down){trail.push({x:p.x,y:p.y,t:st.t});if(trail.length>12)trail.shift();if(game.drag)game.drag(p.x,p.y,p.x-last.x,p.y-last.y,ctx,trail);}else if(game.hover)game.hover(p.x,p.y,ctx);last=p;}
  function pu(e){if(!down)return;var p=toWorld(e),moved=Math.hypot(p.x-down.x,p.y-down.y);if(moved<.35&&game.tap)game.tap(down.x,down.y,ctx);if(game.up)game.up(p.x,p.y,ctx);down=null;}
  cv.onpointerdown=pd;cv.onpointermove=pm;cv.onpointerup=pu;cv.onpointercancel=pu;cv.onpointerleave=pu;
  var kd=function(e){if(game.key&&(e.key===' '||e.key==='ArrowUp'||e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();game.key(e.key,ctx);}};window.addEventListener('keydown',kd);
  if(o.music!==false)startMusic(o.tattva||1);
  var prev=performance.now(),lastSec=dur;
  function frame(now){var dt=Math.min(.05,(now-prev)/1000)*(o.timeScale||1);prev=now;if(o.onFrame)o.onFrame(dt,ctx);if(!st.over){st.t+=dt;
    var left=Math.max(0,dur-st.t),tl=hud.querySelector('.artimer');tl.querySelector('b').textContent=Math.ceil(left);tl.style.setProperty('--p',(left/dur).toFixed(3));
    if(Math.ceil(left)!==lastSec){lastSec=Math.ceil(left);if(lastSec<=5&&lastSec>0)SFX.tick();}
    game.update(dt,st.t,ctx);if(st.t>=dur){finish();}}
   for(var i=shards.length-1;i>=0;i--){var m=shards[i];m.userData.v.y-=18*dt;m.position.addScaledVector(m.userData.v,dt);m.rotation.x+=dt*8;m.userData.life-=dt;m.scale.setScalar(Math.max(.01,m.userData.life/.7));if(m.userData.life<=0){scene.remove(m);shards.splice(i,1);}}
   R.render(scene,cam);raf=requestAnimationFrame(frame);}
  function finish(){if(st.over)return;st.over=true;stopMusic();SFX.big();if(o.onEnd)setTimeout(function(){o.onEnd(st.score);},700);}
  var ro=new ResizeObserver(size);ro.observe(host);
  run={ctx:ctx,stop:function(){cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',kd);stopMusic();cv.onpointerdown=cv.onpointermove=cv.onpointerup=null;},st:st};
  raf=requestAnimationFrame(frame);return true;}
 function stop(){if(run){run.stop();run=null;}}
 // A static preview frame of a game for the feed card.
 return{start:start,stop:stop,init:init,rngOf:rngOf,audio:audio,SFX:SFX,get running(){return !!run;},get ctx(){return run?run.ctx:null;},get score(){return run?run.st.score:0;}};
})();
var ARCADE={};
