/* Block Builder: Minecraft-style creative mode, short. Unlimited blocks, no hunger, no enemies. A faint outline shows
   the tattva's shape (a mirror and its city, the banyan, the temple, the pot with its lamp, the body, the eclipse,
   the thread through the beads, the dream house). Tap to place, switch to Erase to remove, drag to turn the view.
   Score = how much of the shape you built, plus the seconds left if you finish it. */
ARCADE.build=(function(){
 var G={name:'Block Builder',secs:90,persp:true,short:'Build the tattva, block by block',how:'Tap the glowing outline to place blocks, drag to turn around. Fill the shape before time runs out.',s:null};
 var PAL=['#e8b84a','#f4efe6','#c0392b','#3f8a44','#6b4423','#4a90d9','#8a8fa8','#1a1206'];
 var SKY={1:['#3b2b6e','#0c0820'],2:['#3a7a6a','#0a1a14'],3:['#8a4a2a','#1a0c08'],4:['#2a2a52','#06060e'],5:['#5a6a9a','#121a2c'],6:['#7a3a14','#140806'],7:['#2f5a7a','#0a141c'],8:['#2a1f5a','#07051a']};
 var NAME={1:'The mirror and its city',2:'The banyan from a seed',3:'The temple of That',4:'The lamp in the pot',5:'The body (not the Self)',6:'The sun and Rāhu',7:'The thread through the beads',8:'The dream house'};
 function goal(n){var c=[],has={};function put(x,y,z,col){var k=x+','+y+','+z;if(has[k]!=null){c[has[k]][3]=col;return;}has[k]=c.length;c.push([x,y,z,col]);}
  function box(x0,x1,y0,y1,z0,z1,col){for(var x=x0;x<=x1;x++)for(var y=y0;y<=y1;y++)for(var z=z0;z<=z1;z++)put(x,y,z,col);}
  function ring(x0,x1,y,z0,z1,col,holes){for(var x=x0;x<=x1;x++)for(var z=z0;z<=z1;z++){if(x>x0&&x<x1&&z>z0&&z<z1)continue;if(holes&&((x===(x0+x1)/2)||(z===(z0+z1)/2)))continue;put(x,y,z,col);}}
  if(n===1){for(var x=-3;x<=3;x++)for(var y=0;y<=6;y++)if(x===-3||x===3||y===0||y===6)put(x,y,-3,'#e8b84a');box(-3,-2,0,1,0,1,'#f4a261');box(-3,-2,2,2,0,1,'#c0392b');box(2,3,0,1,0,1,'#a8dadc');box(2,3,2,2,0,1,'#c0392b');box(0,0,0,2,1,1,'#f4efe6');}
  else if(n===2){box(0,0,0,3,0,0,'#6b4423');box(-2,2,4,4,-2,2,'#3f8a44');box(-1,1,5,5,-1,1,'#4f9a4a');box(-2,-2,1,3,0,0,'#6b4423');box(2,2,1,3,0,0,'#6b4423');}
  else if(n===3){box(-2,2,0,0,-2,2,'#8a8fa8');box(-1,1,1,2,-1,1,'#d8a05a');put(0,3,0,'#d8a05a');put(0,4,0,'#e8b84a');}
  else if(n===4){box(-1,1,0,0,-1,1,'#a0522d');ring(-2,2,1,-2,2,'#a0522d');ring(-2,2,2,-2,2,'#a0522d',true);ring(-1,1,3,-1,1,'#a0522d');put(0,1,0,'#e8b84a');put(0,2,0,'#ff9a3c');}
  else if(n===5){box(-1,-1,0,2,0,0,'#4a5a8a');box(1,1,0,2,0,0,'#4a5a8a');box(-1,1,3,5,0,0,'#f4efe6');box(-2,-2,4,5,0,0,'#ffd9a8');box(2,2,4,5,0,0,'#ffd9a8');box(-1,1,6,7,0,0,'#ffd9a8');}
  else if(n===6){for(var x=-3;x<=3;x++)for(var y=1;y<=7;y++)if(x*x+(y-4)*(y-4)<=10)put(x,y,0,'#e8b84a');for(x=0;x<=3;x++)for(y=4;y<=7;y++)if((x-1.5)*(x-1.5)+(y-5.5)*(y-5.5)<=2.6)put(x,y,1,'#2a1a2a');}
  else if(n===7){box(-5,-5,0,3,0,0,'#6b4423');box(5,5,0,3,0,0,'#6b4423');box(-4,4,3,3,0,0,'#f4efe6');[-3,-1,1,3].forEach(function(b,i){var col=['#c0392b','#4a90d9','#3f8a44','#e8b84a'][i];put(b,2,0,col);put(b,4,0,col);put(b,3,-1,col);put(b,3,1,col);});}
  else{ring(-2,2,0,-1,1,'#e9c46a');ring(-2,2,1,-1,1,'#e9c46a');box(-2,2,2,2,-1,1,'#c0392b');box(-1,1,3,3,0,0,'#c0392b');put(3,6,0,'#f4f0d0');put(4,6,0,'#f4f0d0');put(4,7,0,'#f4f0d0');put(4,5,0,'#f4f0d0');
   var k=has['0,0,1'];if(k!=null){c.splice(k,1);}}
  return c;}
 function noiseTex(T,col){var cv=document.createElement('canvas');cv.width=cv.height=16;var x=cv.getContext('2d'),c=new T.Color(col),h=7;
  for(var i=0;i<16;i++)for(var j=0;j<16;j++){h=(h*1103515245+12345)&0x7fffffff;var f=.86+(h%1000)/1000*.2;if(i===0||j===0)f*=1.08;if(i===15||j===15)f*=.8;x.fillStyle='rgb('+Math.min(255,c.r*255*f|0)+','+Math.min(255,c.g*255*f|0)+','+Math.min(255,c.b*255*f|0)+')';x.fillRect(i,j,1,1);}
  var t=new T.CanvasTexture(cv);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;return t;}
 var mats={},box1=null,ghostGeo=null,edgeGeo=null;
 function mat(T,col){if(!mats[col])mats[col]=new T.MeshLambertMaterial({map:noiseTex(T,col)});return mats[col];}
 G.setup=function(c){var T=c.T,n=c.tattva,sk=SKY[n]||SKY[1];
  var bg=c.bgMesh();c.remove(bg);
  var sky=new T.Mesh(new T.SphereGeometry(90,24,12),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{a:{value:new T.Color(sk[0])},b:{value:new T.Color(sk[1])}},
   vertexShader:'varying float vY;void main(){vY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 a,b;varying float vY;void main(){gl_FragColor=vec4(mix(mix(b,a,.4),a*1.15,smoothstep(-.5,.7,vY)),1.);}'}));c.add(sky);var sun=c.glow(n===6?'rgba(255,170,60,.9)':'rgba(255,230,180,.8)',14);sun.position.set(-30,34,-50);c.add(sun);
  if(!box1){box1=new T.BoxGeometry(1,1,1);ghostGeo=new T.BoxGeometry(.98,.98,.98);edgeGeo=new T.EdgesGeometry(ghostGeo);}
  var parts=[];for(var x=-5;x<=5;x++)for(var z=-5;z<=5;z++)parts.push([x,-.5,z,1,1,1,(x+z)&1?'#7cc46a':'#8fd17e']);
  parts.push([0,-1.5,0,11,1,11,'#7a4e2c'],[0,-2.4,0,9,.8,9,'#6b4423']);
  var ground=c.model('bgnd',parts,1);ground.rotation.set(0,0,0);c.add(ground);
  var gl=goal(n),s=G.s={c:c,n:n,cells:{},goal:{},ghosts:{},solids:[],ghostList:[],ground:ground,mode:'build',col:PAL[0],yaw:.65,pitch:.55,filled:0,total:gl.length,shown:0,done:false,line:0,lastLine:-99,orbit:0,ray:new T.Raycaster()};s.gop=c.level>=3?.1:c.level===2?.16:.22;
  var gop=c.level>=3?.1:c.level===2?.16:.22;
  gl.forEach(function(g){var k=g[0]+','+g[1]+','+g[2];s.goal[k]=g[3];
   var m=new T.Mesh(ghostGeo,new T.MeshBasicMaterial({color:g[3],transparent:true,opacity:gop,depthWrite:false}));m.position.set(g[0],g[1]+.5,g[2]);
   var e=new T.LineSegments(edgeGeo,new T.LineBasicMaterial({color:g[3],transparent:true,opacity:gop*2.6}));m.add(e);m.userData.cell=[g[0],g[1],g[2]];m.userData.ghost=true;c.add(m);s.ghosts[k]=m;s.ghostList.push(m);});
  if(n===4){s.lamp=c.glow('rgba(255,190,90,.95)',3.2);s.lamp.position.set(0,2.6,0);s.lamp.visible=false;c.add(s.lamp);}
  var tb=c.tools('<div class="bt-mode"><button class="on" data-m="build">Build</button><button data-m="erase">Erase</button></div><div class="bt-pal">'+PAL.map(function(p,i){return'<button data-c="'+p+'" style="--c:'+p+'"'+(i===0?' class="on"':'')+'></button>';}).join('')+'</div>');
  tb.querySelectorAll('[data-m]').forEach(function(b){b.onclick=function(){s.mode=b.dataset.m;tb.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x===b);});};});
  tb.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){s.col=b.dataset.c;s.mode='build';tb.querySelectorAll('[data-c]').forEach(function(x){x.classList.toggle('on',x===b);});tb.querySelectorAll('[data-m]').forEach(function(x){x.classList.toggle('on',x.dataset.m==='build');});};});
  c.word('<div class="ww"><span class="wk">Build</span><b class="bname">'+NAME[n]+'</b><span class="wm" id="bpct">0% built · '+s.total+' blocks</span></div>');
  c.help('Tap the outline to build · drag to turn');place(s);};
 function key(x,y,z){return x+','+y+','+z;}
 function addBlock(s,x,y,z,col){var c=s.c,k=key(x,y,z);if(s.cells[k]||Math.abs(x)>5||Math.abs(z)>5||y<0||y>10)return false;
  var gc=s.goal[k];if(gc)col=gc;var m=new c.T.Mesh(box1,mat(c.T,col));m.position.set(x,y+.5,z);m.userData.cell=[x,y,z];m.scale.setScalar(.2);m.userData.grow=0;c.add(m);s.cells[k]=m;s.solids.push(m);
  if(gc){s.ghosts[k].visible=false;s.filled++;}c.SFX.pop();progress(s);return true;}
 function delBlock(s,m){var c=s.c,p=m.userData.cell,k=key(p[0],p[1],p[2]);c.remove(m);delete s.cells[k];s.solids.splice(s.solids.indexOf(m),1);
  if(s.goal[k]){s.ghosts[k].visible=true;s.filled--;}c.SFX.bad();progress(s);}
 function progress(s){var c=s.c,pct=Math.round(s.filled/s.total*100);if(pct!==s.shown){c.score(pct-s.shown);s.shown=pct;}
  var el=c.hud.querySelector('#bpct');if(el)el.textContent=pct+'% built · '+(s.total-s.filled)+' to go';
  if(s.lamp)s.lamp.visible=s.filled>=s.total-3;
  if(pct>=100&&!s.done){s.done=true;var bonus=Math.ceil(c.left);c.score(bonus,0,c.HH-6,'time bonus');c.SFX.big();c.help('Complete!');setTimeout(function(){if(G.s===s)c.end();},1400);}
  if(!s.done&&s.filled>0&&s.filled%Math.max(6,Math.round(s.total/4))===0&&c.t-s.lastLine>6){c.recite(s.line++);s.lastLine=c.t;}}
 G.fill=function(k){var s=G.s,g=s.goal[k];if(!g)return false;var p=k.split(',').map(Number);return addBlock(s,p[0],p[1],p[2]);};
 G.tap=function(x,y,c,p){var s=G.s;if(!p||s.done)return;s.ray.setFromCamera(new c.T.Vector2(p.nx,p.ny),c.cam);
  if(s.mode==='build'){var gh=s.ray.intersectObjects(s.ghostList.filter(function(m){return m.visible;}),false)[0];if(gh){var gcl=gh.object.userData.cell;addBlock(s,gcl[0],gcl[1],gcl[2]);return;}}
  var objs=s.solids.concat([s.ground]),hit=s.ray.intersectObjects(objs,false)[0];if(!hit)return;var o=hit.object;
  if(s.mode==='erase'){if(o.userData.cell)delBlock(s,o);return;}
  if(o===s.ground){var px=Math.round(hit.point.x),pz=Math.round(hit.point.z);addBlock(s,px,0,pz,s.col);return;}
  var cc=o.userData.cell,nn=hit.face.normal;addBlock(s,cc[0]+Math.round(nn.x),cc[1]+Math.round(nn.y),cc[2]+Math.round(nn.z),s.col);};
 G.drag=function(x,y,dx,dy,c){var s=G.s;s.yaw-=dx*.28;s.pitch=Math.max(.12,Math.min(1.25,s.pitch-dy*.12));};
 function placeCam(s){var c=s.c,cam=c.cam,a=cam.aspect||.56,vf=cam.fov*Math.PI/360,hf=Math.atan(Math.tan(vf)*a),r=Math.max(14,6.9/Math.tan(Math.min(vf,hf)));
  var ty=3.2;cam.position.set(Math.sin(s.yaw)*Math.cos(s.pitch)*r,ty+Math.sin(s.pitch)*r,Math.cos(s.yaw)*Math.cos(s.pitch)*r);cam.lookAt(0,ty-.6,0);}
 function place(s){placeCam(s);}
 G.update=function(dt,t,c){var s=G.s;if(t>4&&t<4.2&&!s.done)c.help('');
  if(t>1&&s.lastLine<0){c.recite(0);s.line=1;s.lastLine=t;}
  if(t>s.lastLine+22&&!s.done){c.recite(s.line++);s.lastLine=t;}
  s.solids.forEach(function(m){if(m.userData.grow<1){m.userData.grow=Math.min(1,m.userData.grow+dt*7);var e=m.userData.grow;m.scale.setScalar(.2+.8*(1-Math.pow(1-e,3))+Math.sin(e*Math.PI)*.12);}});
  s.ghostList.forEach(function(m,i){if(m.visible){var o=s.gop+.07*Math.sin(t*3-m.position.y*.8);m.material.opacity=o;m.children[0].material.opacity=Math.min(1,o*2.8);}});
  placeCam(s);};
 G.finish=function(c){var s=G.s;s.ghostList.forEach(function(m){m.visible=false;});c.tools('');c.help('');if(c.voice.meaning)c.voice.meaning();
  c.word('<div class="ww done"><span class="wk">You built</span><b class="bname">'+NAME[s.n]+'</b><span class="wm">'+Math.round(s.filled/s.total*100)+'% of the shape</span></div>');return 4200;};
 G.after=function(dt,c){var s=G.s;s.yaw+=dt*.9;s.pitch+=(.45-s.pitch)*Math.min(1,dt*2);placeCam(s);};
 return G;})();
