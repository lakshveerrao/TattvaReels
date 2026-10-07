/* Shared toolkit for the tattva films 2–8: one WebGL renderer, a morphing golden-particle system,
   silhouette sampling, draw-on line art, and the label overlay used by every film. */
var KIT=(function(){
 var ok=null,T,R,S=Math.min(2,window.devicePixelRatio||1),W=360,H=560,curH=0,glows={};
 var NP=Math.min(window.innerWidth,window.innerHeight)<700?1800:2800;
 function ss(a,b,v){var t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}
 function eio(t){t=Math.max(0,Math.min(1,t));return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
 function lerp(a,b,t){return a+(b-a)*t;}
 function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function cv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function init(){if(ok!==null)return ok;
  try{T=window.THREE;if(!T){ok=false;return ok;}
   var c=cv(Math.round(W*S),Math.round(H*S));
   R=new T.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:true,alpha:false});R.setPixelRatio(1);R.setClearColor(0x07050f,1);size(560);ok=true;
  }catch(e){if(window.console)console.warn('film kit init failed',e);ok=false;}
  return ok;}
 function size(h){h=Math.round(h||560);if(h===curH)return;curH=h;R.setSize(Math.round(W*S),Math.round(h*S),false);}
 // Keep the 360×560 safe frame fully visible whatever the canvas height (same rule as film 1).
 function fit(cam,h){var f=2*Math.atan(Math.tan(cam.userData.fov0*Math.PI/360)*((W/H)/(W/h)))*180/Math.PI;if(cam.aspect!==W/h||cam.fov!==f){cam.aspect=W/h;cam.fov=f;cam.updateProjectionMatrix();}}
 function camera(fov,near,far){var c=new T.PerspectiveCamera(fov,W/H,near||.05,far||80);c.userData.fov0=fov;return c;}
 function draw(scene,cam,h){size(h);fit(cam,curH);R.render(scene,cam);return R.domElement;}
 function glowTex(inner,outer){var k=inner+outer;if(glows[k])return glows[k];var c=cv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,inner);gr.addColorStop(.25,outer);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return glows[k]=new T.CanvasTexture(c);}
 function add(o){return Object.assign({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending},o||{});}
 function sprite(inner,outer,o){var s=new T.Sprite(new T.SpriteMaterial(add(Object.assign({map:glowTex(inner||'rgba(255,250,235,1)',outer||'rgba(255,190,90,.55)')},o||{}))));return s;}
 function bg(top,bot){var m=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthWrite:false,depthTest:false,uniforms:{uA:{value:new T.Color(top||0x0b0718)},uB:{value:new T.Color(bot||0x050309)},uG:{value:new T.Color(0x000000)},uGy:{value:.5},uGs:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform vec3 uA,uB,uG;uniform float uGy,uGs;varying vec2 vUv;void main(){vec3 c=mix(uB,uA,vUv.y);float d=length((vUv-vec2(.5,uGy))*vec2(1.,1.5));c+=uG*uGs*exp(-d*d*6.);gl_FragColor=vec4(c,1.);}'}));m.frustumCulled=false;m.renderOrder=-10;return m;}
 function mandala(){var c=cv(512,512),g=c.getContext('2d');g.translate(256,256);g.strokeStyle='rgba(233,180,76,1)';g.lineWidth=1.4;
  [250,236,190,150].forEach(function(r){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();});
  for(var i=0;i<24;i++){g.save();g.rotate(i*Math.PI/12);g.beginPath();g.moveTo(0,-150);g.quadraticCurveTo(22,-172,0,-190);g.quadraticCurveTo(-22,-172,0,-150);g.stroke();g.restore();}
  for(i=0;i<16;i++){g.save();g.rotate(i*Math.PI/8);g.beginPath();g.moveTo(0,-190);g.quadraticCurveTo(30,-216,0,-236);g.quadraticCurveTo(-30,-216,0,-190);g.stroke();g.restore();}
  var m=new T.Mesh(new T.PlaneGeometry(3.4,3.4),new T.MeshBasicMaterial(add({map:new T.CanvasTexture(c),opacity:.1})));return m;}
 function motes(n,box,seed){var r=rng(seed||7),p=[],s=[];for(var i=0;i<n;i++){p.push((r()-.5)*box[0],(r()-.5)*box[1],(r()-.5)*box[2]);s.push(r());}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('aS',new T.Float32BufferAttribute(s,1));
  var m=new T.ShaderMaterial(add({uniforms:{uT:{value:0},uPx:{value:S},uA:{value:.5},uH:{value:box[1]},uC:{value:new T.Color(1,.82,.5)}},
   vertexShader:'attribute float aS;uniform float uT,uPx,uH;varying float vA;void main(){vec3 p=position;p.y=mod(p.y+uH*.5+uT*(.03+.05*aS),uH)-uH*.5;p.x+=sin(uT*.3+aS*20.)*.06;vec4 mv=modelViewMatrix*vec4(p,1.);vA=.3+.7*aS;gl_PointSize=(2.+3.*aS)*uPx*3./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;uniform vec3 uC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*uA;gl_FragColor=vec4(uC*a,1.);}'}));
  var o=new T.Points(g,m);o.frustumCulled=false;return o;}

 /* Sample n points from a filled 2D silhouette. draw(g,w,h) paints white on a w×h canvas. Returns Float32Array xyz in world units (width sw). */
 function shape(draw,n,sw,seed,w,h,z){w=w||256;h=h||256;var c=cv(w,h),g=c.getContext('2d');g.fillStyle='#fff';g.strokeStyle='#fff';draw(g,w,h);
  var d=g.getImageData(0,0,w,h).data,pix=[];for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(d[(y*w+x)*4+3]>110)pix.push(x,y);
  var r=rng(seed||3),out=new Float32Array(n*3),sc=sw/w,np=pix.length/2;if(!np)return out;
  for(var i=0;i<n;i++){var k=Math.floor(r()*np)*2;out[i*3]=(pix[k]+r()-w/2)*sc;out[i*3+1]=(h/2-pix[k+1]-r())*sc;out[i*3+2]=(z||0)+(r()-.5)*.04;}return out;}
 function cloud(n,f,seed){var r=rng(seed||9),o=new Float32Array(n*3);for(var i=0;i<n;i++){var p=f(r,i);o[i*3]=p[0];o[i*3+1]=p[1];o[i*3+2]=p[2];}return o;}
 function off(a,dx,dy,dz){for(var i=0;i<a.length;i+=3){a[i]+=dx||0;a[i+1]+=dy||0;a[i+2]+=dz||0;}return a;}

 /* Morphing particle field: up to 6 target shapes, blended pairwise with per-particle delay and a swirl in flight. */
 function morph(targets,colors,o){o=o||{};var n=targets[0].length/3,g=new T.BufferGeometry(),r=rng(o.seed||11),sd=new Float32Array(n),i;
  for(i=0;i<n;i++)sd[i]=r();
  targets.forEach(function(t,k){g.setAttribute(k?'p'+k:'position',new T.BufferAttribute(t,3));});
  for(i=targets.length;i<6;i++)g.setAttribute('p'+i,new T.BufferAttribute(targets[0],3));
  g.setAttribute('aS',new T.BufferAttribute(sd,1));
  var vi=new Float32Array(n);for(i=0;i<n;i++)vi[i]=Math.floor(r()*4);g.setAttribute('aV',new T.BufferAttribute(vi,1));
  var pal=o.pal||[new T.Color(1,.5,.6),new T.Color(.45,.9,.7),new T.Color(.5,.7,1),new T.Color(1,.85,.4)];
  var cl=colors||[new T.Color(1,.82,.5)];while(cl.length<6)cl.push(cl[cl.length-1]);
  var m=new T.ShaderMaterial(add({uniforms:{uA:{value:0},uB:{value:1},uK:{value:0},uT:{value:0},uPx:{value:S},uSz:{value:o.size||1},uAl:{value:1},uSw:{value:o.swirl==null?.35:o.swirl},uJ:{value:o.jitter==null?.012:o.jitter},
    uVar:{value:0},uP0:{value:pal[0]},uP1:{value:pal[1]},uP2:{value:pal[2]},uP3:{value:pal[3]},uC0:{value:cl[0]},uC1:{value:cl[1]},uC2:{value:cl[2]},uC3:{value:cl[3]},uC4:{value:cl[4]},uC5:{value:cl[5]}},
   vertexShader:'attribute vec3 p1,p2,p3,p4,p5;attribute float aS,aV;uniform float uA,uB,uK,uT,uPx,uSz,uSw,uJ,uVar;uniform vec3 uC0,uC1,uC2,uC3,uC4,uC5,uP0,uP1,uP2,uP3;varying vec3 vC;varying float vF;'+
    'vec3 P(float i){if(i<.5)return position;if(i<1.5)return p1;if(i<2.5)return p2;if(i<3.5)return p3;if(i<4.5)return p4;return p5;}'+
    'vec3 C(float i){if(i<.5)return uC0;if(i<1.5)return uC1;if(i<2.5)return uC2;if(i<3.5)return uC3;if(i<4.5)return uC4;return uC5;}'+
    'void main(){float k=clamp(uK*1.5-aS*.5,0.,1.);k=k*k*(3.-2.*k);vec3 a=P(uA),b=P(uB);vec3 p=mix(a,b,k);float an=aS*6.283+k*6.;float fl=sin(k*3.1416);p.xy+=vec2(cos(an),sin(an))*fl*uSw*(.4+aS);p.z+=fl*uSw*.5*(aS-.5);'+
    'p+=vec3(sin(uT*.9+aS*40.),cos(uT*.7+aS*31.),sin(uT*.5+aS*17.))*uJ;vC=mix(C(uA),C(uB),k);vec3 pv=aV<.5?uP0:aV<1.5?uP1:aV<2.5?uP2:uP3;vC=mix(vC,pv,uVar);vF=fl;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.5+.9*aS+1.6*fl)*uSz*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uAl;varying vec3 vC;varying float vF;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*uAl;gl_FragColor=vec4(vC*(1.+vF*.6)*a,1.);}'}));
  var pts=new T.Points(g,m);pts.frustumCulled=false;
  // play a sequence of [pf, shapeIndex] keys: holds each shape, morphs over `dur` of pf before the next key
  pts.userData.seq=function(pf,keys,dur){var a=keys[0][1],b=a,k=0;for(var j=0;j<keys.length;j++){if(pf>=keys[j][0]){a=keys[j][1];b=a;k=0;var du=j+1<keys.length&&keys[j+1][2]!=null?keys[j+1][2]:dur;if(j+1<keys.length&&pf>keys[j+1][0]-du){b=keys[j+1][1];k=ss(keys[j+1][0]-du,keys[j+1][0],pf);}}}
   m.uniforms.uA.value=a;m.uniforms.uB.value=b;m.uniforms.uK.value=k;};
  return pts;}

 /* Line art that draws itself on, with an optional glowing point. paths: arrays of [x,y] in a w×h space. */
 function art(paths,w,h,pw,col){var c=cv(w,h),g=c.getContext('2d'),tex=new T.CanvasTexture(c),len=0,last=-1;
  paths.forEach(function(p){var L=0;for(var i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);p.L=L;len+=L;});
  var mesh=new T.Mesh(new T.PlaneGeometry(pw,pw*h/w),new T.MeshBasicMaterial(add({map:tex})));
  mesh.userData.draw=function(pa,glow){if(Math.abs(pa-last)<.002&&pa<1&&!glow)return;last=pa;g.clearRect(0,0,w,h);var lim=pa*len;
   for(var pass=0;pass<2;pass++){g.lineCap='round';g.lineJoin='round';g.strokeStyle=pass?(col||'rgba(255,230,170,1)'):'rgba(233,180,76,.35)';g.lineWidth=pass?2.6:9;var acc=0;
    for(var k=0;k<paths.length;k++){var p=paths[k];if(acc>=lim)break;var rem=lim-acc;g.beginPath();g.moveTo(p[0][0],p[0][1]);
     for(var i=1;i<p.length;i++){var sl=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(rem<sl){var f=rem/sl;g.lineTo(p[i-1][0]+(p[i][0]-p[i-1][0])*f,p[i-1][1]+(p[i][1]-p[i-1][1])*f);break;}g.lineTo(p[i][0],p[i][1]);rem-=sl;}
     g.stroke();acc+=p.L;}}
   if(glow&&glow.a>0){var gr=g.createRadialGradient(glow.x,glow.y,0,glow.x,glow.y,glow.r||40);gr.addColorStop(0,'rgba(255,240,200,'+(.95*glow.a)+')');gr.addColorStop(.3,'rgba(255,200,110,'+(.5*glow.a)+')');gr.addColorStop(1,'rgba(255,180,80,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);}
   tex.needsUpdate=true;};
  return mesh;}
 var A={arc:function(cx,cy,r,a0,a1,n){var o=[];n=n||24;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;},
  bez:function(a,b,c,d,n){var o=[];n=n||20;for(var i=0;i<=n;i++){var t=i/n,u=1-t;o.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return o;}};
 // Dakṣiṇāmūrti under the banyan: the closing image shared by every film (same drawing as film 1).
 function guruPaths(){var P=[],arc=A.arc,bez=A.bez,canopy=[];
  [[70,240,48],[120,178,58],[200,146,62],[300,144,64],[386,176,58],[440,240,48]].forEach(function(c,i,Ar){canopy=canopy.concat(arc(c[0],c[1],c[2],Math.PI*(i===0?.8:1.05),Math.PI*(i===Ar.length-1?2.2:1.95),18));});P.push(canopy);
  P.push(bez([212,262],[210,296],[206,322],[204,345]));P.push(bez([300,262],[302,296],[306,322],[308,345]));
  [[64,274,480],[96,282,520],[128,272,440],[384,272,440],[416,282,520],[448,274,480]].forEach(function(a){P.push(bez([a[0],a[1]],[a[0]+6,a[1]+70],[a[0]-6,a[2]-80],[a[0]+3,a[2]]));});
  P.push(arc(256,252,13,Math.PI*.5,Math.PI*2.5,24));P.push(arc(256,288,30,Math.PI*-.5,Math.PI*1.5,40));P.push(arc(271,248,9,Math.PI*.6,Math.PI*1.9,12));
  P.push([[244,318],[244,332]]);P.push([[268,318],[268,332]]);
  P.push(bez([244,332],[214,336],[196,346],[190,366]));P.push(bez([268,332],[298,336],[316,346],[322,366]));
  P.push(bez([190,366],[194,410],[206,440],[214,474]));P.push(bez([322,366],[318,410],[306,440],[298,474]));
  P.push(bez([190,366],[166,392],[160,420],[176,430]));P.push(bez([176,430],[190,420],[200,404],[204,388]));
  P.push(bez([322,366],[350,396],[352,440],[340,486]));P.push(bez([340,486],[328,494],[314,494],[304,488]));
  P.push(bez([214,474],[160,480],[134,506],[150,528]));P.push(bez([150,528],[200,548],[312,548],[362,528]));P.push(bez([362,528],[378,506],[352,480],[298,474]));
  P.push(bez([200,512],[230,500],[260,500],[290,514]));P.push(bez([222,524],[252,514],[282,514],[312,526]));
  for(var i=0;i<7;i++){var x0=136+i*34;P.push(bez([x0,560],[x0+4,540],[x0+30,540],[x0+34,560]));}
  P.push([[132,562],[380,562]]);P.push(arc(206,384,6.5,0,Math.PI*2,16));return P;}

 /* Label overlay: Sanskrit word springs up, English underneath (identical to film 1). */
 function spring(x){return 1-Math.exp(-7*x)*Math.cos(10*x);}
 function overlay(LABELS,hiFrom){return function(g,pf,total,h){var off=((h||560)-560)*.42;
  var k=-1;for(var i=0;i<LABELS.length;i++)if(pf>=LABELS[i].p)k=i;if(k<0)return;
  var L=LABELS[k],end=k+1<LABELS.length?LABELS[k+1].p:1.2,tin=(pf-L.p)*total,tout=(end-pf)*total;
  var y0=(pf>=(hiFrom||.79)?96:124)+off,rise=spring(Math.min(1.2,tin)),out=pf<1?ss(.3,0,tout):0,hold=1-out;
  var lw=Math.min(1,tin*3)*70*(1-out);
  g.save();g.strokeStyle='rgba(233,180,76,.9)';g.lineWidth=1.2;g.beginPath();g.moveTo(180-lw,y0+8);g.lineTo(180+lw,y0+8);g.stroke();
  g.beginPath();g.rect(0,y0-60,360,68);g.clip();g.textAlign='center';g.textBaseline='alphabetic';g.shadowColor='rgba(7,5,15,.9)';g.shadowBlur=12;
  var dy=(1-rise)*46-out*30;g.globalAlpha=hold;g.fillStyle='#F6D58E';g.font=(L.dev.length>12?'27px ':'34px ')+'"Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif';g.fillText(L.dev,180,y0-4+dy);g.restore();
  g.save();var e=ss(.15,.5,tin)*hold;g.globalAlpha=e;g.textAlign='center';g.fillStyle='#F6EBD2';g.shadowColor='rgba(7,5,15,.95)';g.shadowBlur=10;g.font='600 12.5px "Mukta", system-ui, sans-serif';
  g.fillText(L.en.toUpperCase().split('').join(String.fromCharCode(8202)),180,y0+28+(1-e)*6);g.restore();};}

 /* Wrap a film: build() once on first use; render(pf,t) updates the scene. */
 function film(def){var built=false,st=null;
  return{hold:def.hold,poster:def.poster,overlay:overlay(def.labels,def.hiFrom),
   init:function(){if(!init())return false;if(!built){try{st=def.build(T);built=true;}catch(e){if(window.console)console.warn('film build failed',e);built=true;st=null;}}return !!st;},
   render:function(pf,t,h){pf=Math.max(0,Math.min(1,pf));def.render(st,pf,t,h||560);return draw(st.scene,st.cam,h);}};}
 return{init:init,ss:ss,eio:eio,lerp:lerp,rng:rng,cv:cv,glowTex:glowTex,add:add,sprite:sprite,bg:bg,mandala:mandala,motes:motes,shape:shape,cloud:cloud,off:off,morph:morph,art:art,A:A,guruPaths:guruPaths,film:film,camera:camera,
  get NP(){return NP;},get T(){return T;},get S(){return S;}};
})();
