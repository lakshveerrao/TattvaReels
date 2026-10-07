/* Tattva 1 film: one continuous take. Pure function of story progress pf (0..1). */
var FILM=(function(){
 var ok=null,R,T,W=360,H=560,curH=560,S=Math.min(2,window.devicePixelRatio||1);
 var scene,cam,cityScene,cityCam,rt,mirror,mirrorMat,frame,frameGlow,beadsF,sleeper,head,headGlow,threads=[],beads,beadPos,parts,partMat,light,halo,haloMat,art,artCtx,artTex,artPaths=null,artLen=0,artDrawn=-1,mandala,mandalaMat,motes,motesMat,lamps,lampMat;
 var MC={x:0,y:.7},RX=.78,RY=1.12,HEART={x:0,y:-.74,z:.86},HEADP={x:0,y:-.33,z:.82},HALO={x:0,y:.69,z:.03},ARTY=.56;
 var NP=Math.min(window.innerWidth,window.innerHeight)<700?1700:2800;
 function ss(a,b,v){var t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}
 function eio(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
 function lerp(a,b,t){return a+(b-a)*t;}
 function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function cv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function glowTex(inner,outer){var c=cv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,inner);gr.addColorStop(.25,outer);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);var t=new T.CanvasTexture(c);return t;}
 function winTex(seed){var r=rng(seed),c=cv(64,128),g=c.getContext('2d');g.fillStyle='#140d1c';g.fillRect(0,0,64,128);
  for(var y=0;y<10;y++)for(var x=0;x<4;x++){var lit=r()<.42;g.fillStyle=lit?'rgba(255,'+(170+Math.floor(r()*60))+',90,'+(.55+r()*.45)+')':'#1e1528';g.fillRect(6+x*14,6+y*12,8,7);}
  var t=new T.CanvasTexture(c);t.magFilter=T.LinearFilter;return t;}

 function buildCity(){
  cityScene=new T.Scene();cityScene.fog=new T.FogExp2(0x2b1431,.042);
  var sky=new T.Mesh(new T.SphereGeometry(90,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
   vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec3 vP;void main(){vec3 d=normalize(vP);float h=d.y;vec3 top=vec3(.04,.025,.11),mid=vec3(.28,.09,.26),hor=vec3(1.,.52,.2);vec3 c=h>0.?mix(mix(hor,mid,smoothstep(0.,.12,h)),top,smoothstep(.1,.55,h)):mix(hor*.5,vec3(.03,.02,.05),smoothstep(0.,-.08,h));float sun=pow(max(dot(d,normalize(vec3(0.,.04,-1.))),0.),90.);c+=vec3(1.,.75,.4)*sun*1.4+vec3(1.,.5,.2)*pow(max(dot(d,normalize(vec3(0.,.04,-1.))),0.),8.)*.25;gl_FragColor=vec4(c,1.);}'}));
  cityScene.add(sky);
  var ground=new T.Mesh(new T.PlaneGeometry(300,300),new T.MeshBasicMaterial({color:0x0c0815}));ground.rotation.x=-Math.PI/2;cityScene.add(ground);
  var river=new T.Mesh(new T.PlaneGeometry(3.2,120),new T.MeshBasicMaterial({color:0x2a1830}));river.rotation.x=-Math.PI/2;river.position.set(0,.01,-30);cityScene.add(river);
  var r=rng(5),box=new T.BoxGeometry(1,1,1);box.translate(0,.5,0);var m4=new T.Matrix4(),q=new T.Quaternion(),sc=new T.Vector3(),po=new T.Vector3();
  for(var k=0;k<3;k++){var im=new T.InstancedMesh(box,new T.MeshBasicMaterial({map:winTex(11+k)}),90),n=0;
   while(n<90){var x=(r()<.5?-1:1)*(2+r()*13),z=8-r()*52;var w=.6+r()*1.1,h=.6+r()*2.8*(1-Math.abs(x)/22);po.set(x,0,z);sc.set(w,h,.6+r()*1.1);q.setFromAxisAngle(new T.Vector3(0,1,0),(r()-.5)*.3);m4.compose(po,q,sc);im.setMatrixAt(n++,m4);}
   im.instanceMatrix.needsUpdate=true;cityScene.add(im);}
  var prof=[];for(var i=0;i<=28;i++){var s=i/28;prof.push(new T.Vector2(Math.max(.02,(1-Math.pow(s,1.55))*.95*(1+.07*Math.sin(s*46))),s*4));}
  var lg=new T.LatheGeometry(prof,28),cols=[],pa=lg.attributes.position;
  for(i=0;i<pa.count;i++){var y=pa.getY(i)/4,rid=.75+.25*Math.sin(y*46);var c0=new T.Color(0x2a170a),c1=new T.Color(0xf3b65a);c0.lerp(c1,Math.pow(y,.8));c0.multiplyScalar(rid);cols.push(c0.r,c0.g,c0.b);}
  lg.setAttribute('color',new T.Float32BufferAttribute(cols,3));
  var tm=new T.MeshBasicMaterial({vertexColors:true}),kalG=new T.SphereGeometry(.16,12,8),kalM=new T.MeshBasicMaterial({color:0xffd27a});
  var glow=glowTex('rgba(255,225,150,1)','rgba(255,170,70,.35)');
  [[0,-24,2.3],[-6,-17,1.2],[6,-17,1.2],[-9.5,-30,1.5],[9.5,-30,1.5],[-4,-36,1.1],[4,-38,1.3],[-3,-9,.8],[3.4,-11,.85]].forEach(function(t){var m=new T.Mesh(lg,tm);m.position.set(t[0],0,t[1]);m.scale.set(t[2],t[2],t[2]);cityScene.add(m);
   var base=new T.Mesh(box,new T.MeshBasicMaterial({color:0x22140d}));base.position.set(t[0],0,t[1]);base.scale.set(t[2]*2.4,t[2]*.5,t[2]*2.4);cityScene.add(base);
   var k2=new T.Mesh(kalG,kalM);k2.position.set(t[0],t[2]*4.1,t[1]);k2.scale.setScalar(t[2]);cityScene.add(k2);
   var sp=new T.Sprite(new T.SpriteMaterial({map:glow,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8}));sp.position.copy(k2.position);sp.scale.setScalar(t[2]*1.6);cityScene.add(sp);});
  var dg=new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),dm=new T.MeshBasicMaterial({color:0x3a2416});
  for(i=0;i<10;i++){var d=new T.Mesh(dg,dm);var x2=(r()<.5?-1:1)*(3+r()*10),z2=-4-r()*36,h2=1+r()*1.5,s2=.5+r()*.5;var b2=new T.Mesh(box,new T.MeshBasicMaterial({map:winTex(30+i)}));b2.position.set(x2,0,z2);b2.scale.set(s2*2,h2,s2*2);cityScene.add(b2);d.position.set(x2,h2,z2);d.scale.setScalar(s2);cityScene.add(d);}
  var lp=[],ls=[];for(i=0;i<700;i++){var side=r()<.5?-1:1,z3=8-r()*56;if(r()<.55){lp.push(side*(1.75+r()*.15),.18,z3);}else{lp.push(side*(2+r()*13),.3+r()*3,z3);}ls.push(r());}
  var lgeo=new T.BufferGeometry();lgeo.setAttribute('position',new T.Float32BufferAttribute(lp,3));lgeo.setAttribute('aS',new T.Float32BufferAttribute(ls,1));
  lampMat=new T.ShaderMaterial({uniforms:{uT:{value:0},uPx:{value:S*768/560},tG:{value:glow}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
   vertexShader:'attribute float aS;uniform float uT;uniform float uPx;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vA=.55+.45*sin(uT*(1.5+aS*3.)+aS*30.);gl_PointSize=(14.+10.*aS)*uPx/-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform sampler2D tG;varying float vA;void main(){vec4 c=texture2D(tG,gl_PointCoord);gl_FragColor=vec4(c.rgb*vec3(1.,.8,.5)*vA,1.)*c.a;}'});
  lamps=new T.Points(lgeo,lampMat);cityScene.add(lamps);
  var st=[];for(i=0;i<500;i++){var a=r()*Math.PI*2,e=.08+r()*1.3;st.push(Math.cos(a)*Math.cos(e)*85,Math.sin(e)*85,Math.sin(a)*Math.cos(e)*85);}
  var sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(st,3));cityScene.add(new T.Points(sg,new T.PointsMaterial({color:0xfff0d0,size:.35,fog:false,transparent:true,opacity:.7})));
  cityCam=new T.PerspectiveCamera(58,RX/RY,.1,220);
  rt=new T.WebGLRenderTarget(768,1104,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 }
 function placeCityCam(pf){var g=eio(Math.min(1,pf/.32));var z=10-13*g-4*pf;cityCam.position.set(Math.sin(pf*5)*.35,2.9-.6*g,z);cityCam.lookAt(Math.sin(pf*5+.6)*.2,1.6,z-10);}

 function sleeperTex(){var c=cv(512,512),g=c.getContext('2d');
  g.beginPath();g.moveTo(232,40);g.lineTo(280,40);g.lineTo(284,92);g.bezierCurveTo(330,96,380,104,394,140);g.bezierCurveTo(408,190,404,260,402,318);g.bezierCurveTo(450,340,486,380,484,420);g.bezierCurveTo(470,470,360,486,256,486);g.bezierCurveTo(152,486,42,470,28,420);g.bezierCurveTo(26,380,62,340,110,318);g.bezierCurveTo(108,260,104,190,118,140);g.bezierCurveTo(132,104,182,96,228,92);g.closePath();
  g.fillStyle='#040209';g.fill();g.save();g.clip();var gr=g.createLinearGradient(0,40,0,480);gr.addColorStop(0,'rgba(233,180,76,.16)');gr.addColorStop(.5,'rgba(233,180,76,.03)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,512,512);g.restore();
  g.lineWidth=3;var sg=g.createLinearGradient(0,40,0,480);sg.addColorStop(0,'rgba(246,213,142,.95)');sg.addColorStop(.6,'rgba(233,180,76,.45)');sg.addColorStop(1,'rgba(233,180,76,0)');g.strokeStyle=sg;g.shadowColor='rgba(233,180,76,.9)';g.shadowBlur=14;g.stroke();
  return new T.CanvasTexture(c);}
 function headTex(){var c=cv(256,256),g=c.getContext('2d');g.beginPath();g.arc(128,150,68,0,Math.PI*2);g.moveTo(158,66);g.arc(128,66,30,0,Math.PI*2);g.fillStyle='#040209';g.fill();
  g.lineWidth=3;g.strokeStyle='rgba(246,213,142,.95)';g.shadowColor='rgba(233,180,76,.9)';g.shadowBlur=12;g.beginPath();g.arc(128,150,68,Math.PI*1.08,Math.PI*1.92);g.stroke();g.beginPath();g.arc(128,66,30,Math.PI*.9,Math.PI*2.1);g.stroke();
  return new T.CanvasTexture(c);}
 function mandalaTex(){var c=cv(512,512),g=c.getContext('2d');g.translate(256,256);g.strokeStyle='rgba(233,180,76,1)';g.lineWidth=1.4;
  [250,236,190,150].forEach(function(r){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();});
  for(var i=0;i<24;i++){g.save();g.rotate(i*Math.PI/12);g.beginPath();g.moveTo(0,-150);g.quadraticCurveTo(22,-172,0,-190);g.quadraticCurveTo(-22,-172,0,-150);g.stroke();g.restore();}
  for(i=0;i<16;i++){g.save();g.rotate(i*Math.PI/8);g.beginPath();g.moveTo(0,-190);g.quadraticCurveTo(30,-216,0,-236);g.quadraticCurveTo(-30,-216,0,-190);g.stroke();g.restore();}
  return new T.CanvasTexture(c);}

 function buildArt(){artPaths=[];var P=function(pts){artPaths.push(pts);};
  var arc=function(cx,cy,r,a0,a1,n){var o=[];n=n||24;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;};
  var bez=function(a,b,c,d,n){var o=[];n=n||20;for(var i=0;i<=n;i++){var t=i/n,u=1-t;o.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return o;};
  var canopy=[];[[70,240,48],[120,178,58],[200,146,62],[300,144,64],[386,176,58],[440,240,48]].forEach(function(c,i,A){var seg=arc(c[0],c[1],c[2],Math.PI*(i===0?.8:1.05),Math.PI*(i===A.length-1?2.2:1.95),18);canopy=canopy.concat(seg);});P(canopy);
  P(bez([212,262],[210,296],[206,322],[204,345]));P(bez([300,262],[302,296],[306,322],[308,345]));
  [[64,274,480],[96,282,520],[128,272,440],[384,272,440],[416,282,520],[448,274,480]].forEach(function(a){P(bez([a[0],a[1]],[a[0]+6,a[1]+70],[a[0]-6,a[2]-80],[a[0]+3,a[2]]));});
  P(arc(256,252,13,Math.PI*.5,Math.PI*2.5,24));
  P(arc(256,288,30,Math.PI*-.5,Math.PI*1.5,40));
  P(arc(271,248,9,Math.PI*.6,Math.PI*1.9,12));
  P([[244,318],[244,332]]);P([[268,318],[268,332]]);
  P(bez([244,332],[214,336],[196,346],[190,366]));P(bez([268,332],[298,336],[316,346],[322,366]));
  P(bez([190,366],[194,410],[206,440],[214,474]));P(bez([322,366],[318,410],[306,440],[298,474]));
  P(bez([190,366],[166,392],[160,420],[176,430]));P(bez([176,430],[190,420],[200,404],[204,388]));
  P(bez([322,366],[350,396],[352,440],[340,486]));P(bez([340,486],[328,494],[314,494],[304,488]));
  P(bez([214,474],[160,480],[134,506],[150,528]));P(bez([150,528],[200,548],[312,548],[362,528]));P(bez([362,528],[378,506],[352,480],[298,474]));
  P(bez([200,512],[230,500],[260,500],[290,514]));P(bez([222,524],[252,514],[282,514],[312,526]));
  for(var i=0;i<7;i++){var x0=136+i*34;P(bez([x0,560],[x0+4,540],[x0+30,540],[x0+34,560]));}
  P([[132,562],[380,562]]);
  P(arc(206,384,6.5,0,Math.PI*2,16));
  artLen=0;artPaths.forEach(function(p){var L=0;for(var i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);p.L=L;artLen+=L;});}
 function drawArt(pa,glowMudra){if(Math.abs(pa-artDrawn)<.002&&pa<1)return;artDrawn=pa;var g=artCtx;g.clearRect(0,0,512,640);
  var lim=pa*artLen,acc=0;
  for(var pass=0;pass<2;pass++){g.lineCap='round';g.lineJoin='round';g.strokeStyle=pass?'rgba(255,230,170,1)':'rgba(233,180,76,.35)';g.lineWidth=pass?2.6:9;acc=0;
   for(var k=0;k<artPaths.length;k++){var p=artPaths[k];if(acc>=lim)break;var rem=lim-acc;g.beginPath();g.moveTo(p[0][0],p[0][1]);
    for(var i=1;i<p.length;i++){var sl=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(rem<sl){var f=rem/sl;g.lineTo(p[i-1][0]+(p[i][0]-p[i-1][0])*f,p[i-1][1]+(p[i][1]-p[i-1][1])*f);rem=0;break;}g.lineTo(p[i][0],p[i][1]);rem-=sl;}
    g.stroke();acc+=p.L;}}
  if(glowMudra>0){var gr=g.createRadialGradient(206,384,0,206,384,40);gr.addColorStop(0,'rgba(255,240,200,'+(.95*glowMudra)+')');gr.addColorStop(.3,'rgba(255,200,110,'+(.5*glowMudra)+')');gr.addColorStop(1,'rgba(255,180,80,0)');g.fillStyle=gr;g.fillRect(150,330,112,112);}
  artTex.needsUpdate=true;}

 function addMat(o){return Object.assign({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending},o||{});}
 function init(){
  if(ok!==null)return ok;
  try{
   T=window.THREE;if(!T){ok=false;return ok;}
   var canvas=cv(Math.round(W*S),Math.round(H*S));
   R=new T.WebGLRenderer({canvas:canvas,antialias:true,preserveDrawingBuffer:true,alpha:false});R.setPixelRatio(1);R.setSize(Math.round(W*S),Math.round(H*S),false);R.setClearColor(0x07050f,1);
   buildCity();
   scene=new T.Scene();cam=new T.PerspectiveCamera(40,W/H,.05,50);
   mandalaMat=new T.MeshBasicMaterial(addMat({map:mandalaTex(),opacity:.1}));mandala=new T.Mesh(new T.PlaneGeometry(3.4,3.4),mandalaMat);mandala.position.set(MC.x,MC.y,-.6);mandala.renderOrder=0;scene.add(mandala);
   mirrorMat=new T.ShaderMaterial({uniforms:{tCity:{value:rt.texture},uRip:{value:0},uT:{value:0},uFade:{value:1},uA:{value:1}},transparent:true,depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D tCity;uniform float uRip,uT,uFade,uA;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=length(c);float w=sin(d*46.-uT*3.2)*uRip*.009*smoothstep(.5,.05,d);vec2 uv=vUv+c/(d+1e-3)*w;vec3 col=texture2D(tCity,uv).rgb*uFade;col*=mix(1.,.5,smoothstep(.33,.5,d));float sh=smoothstep(.035,0.,abs(vUv.x+vUv.y*.45-.62-.25*sin(uT*.25)))*.07;col+=vec3(1.,.8,.5)*sh+vec3(.035,.02,.06)*(1.-uFade);col+=vec3(.9,.65,.3)*abs(w)*6.;gl_FragColor=vec4(col,uA);}'});
   mirror=new T.Mesh(new T.CircleGeometry(1,96),mirrorMat);mirror.renderOrder=1;scene.add(mirror);
   frame=new T.Mesh(new T.TorusGeometry(1,.028,10,180),new T.MeshBasicMaterial({color:0xe9b44c,transparent:true,depthTest:false,depthWrite:false}));frame.renderOrder=2;scene.add(frame);
   frameGlow=new T.Mesh(new T.TorusGeometry(1,.09,8,180),new T.MeshBasicMaterial(addMat({color:0xa86a1c,opacity:.35})));frameGlow.renderOrder=2;scene.add(frameGlow);
   var bp=[];for(var i=0;i<56;i++){var a=i/56*Math.PI*2;bp.push(Math.cos(a)*1.075,Math.sin(a)*1.075,0);}var bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));
   beadsF=new T.Points(bg,new T.PointsMaterial(addMat({color:0xffd58a,size:.035,map:glowTex('rgba(255,240,200,1)','rgba(255,190,90,.5)')})));beadsF.renderOrder=2;scene.add(beadsF);
   var r=rng(21);
   for(i=0;i<26;i++){var a2=r()*Math.PI*2,rr=Math.sqrt(r())*.85,tx=MC.x+Math.cos(a2)*rr*RX,ty=MC.y+Math.sin(a2)*rr*RY*.9+.05;var pts=[];
    var c1={x:lerp(HEADP.x,tx,.3)+(r()-.5)*.6,y:lerp(HEADP.y,ty,.5)+.2,z:.5};
    for(var j=0;j<=40;j++){var t=j/40,u=1-t;pts.push(u*u*HEADP.x+2*u*t*c1.x+t*t*tx,u*u*(HEADP.y+.04)+2*u*t*c1.y+t*t*ty,u*u*HEADP.z+2*u*t*c1.z+t*t*.01);}
    var g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(pts,3));var ln=new T.Line(g2,new T.LineBasicMaterial(addMat({color:0xf2c26a,opacity:.45})));ln.renderOrder=3;ln.userData.pts=pts;ln.userData.ph=r();scene.add(ln);threads.push(ln);}
   beadPos=new Float32Array(threads.length*2*3);var bg2=new T.BufferGeometry();bg2.setAttribute('position',new T.BufferAttribute(beadPos,3));
   beads=new T.Points(bg2,new T.PointsMaterial(addMat({color:0xffe6b0,size:.07,map:glowTex('rgba(255,250,230,1)','rgba(255,200,110,.6)')})));beads.renderOrder=3;scene.add(beads);
   sleeper=new T.Mesh(new T.PlaneGeometry(1.6,1.6),new T.MeshBasicMaterial({map:sleeperTex(),transparent:true,depthTest:false,depthWrite:false}));sleeper.position.set(0,-.95,.8);sleeper.renderOrder=4;scene.add(sleeper);
   head=new T.Mesh(new T.PlaneGeometry(.44,.44),new T.MeshBasicMaterial({map:headTex(),transparent:true,depthTest:false,depthWrite:false}));head.renderOrder=5;scene.add(head);
   headGlow=new T.Sprite(new T.SpriteMaterial(addMat({map:glowTex('rgba(210,170,255,1)','rgba(150,90,220,.4)'),opacity:0})));headGlow.renderOrder=6;scene.add(headGlow);
   artCtx=cv(512,640).getContext('2d');artTex=new T.CanvasTexture(artCtx.canvas);buildArt();
   art=new T.Mesh(new T.PlaneGeometry(1.6,2.0),new T.MeshBasicMaterial(addMat({map:artTex,opacity:1})));art.position.set(0,ARTY,.05);art.renderOrder=7;scene.add(art);
   haloMat=new T.PointsMaterial(addMat({color:0xffd58a,size:.05,map:glowTex('rgba(255,240,200,1)','rgba(255,190,90,.5)'),opacity:0}));
   var hp=[];for(i=0;i<36;i++){var a3=i/36*Math.PI*2;hp.push(Math.cos(a3)*.34,Math.sin(a3)*.34,0);}var hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));halo=new T.Points(hg,haloMat);halo.position.set(HALO.x,HALO.y,HALO.z);halo.renderOrder=7;scene.add(halo);
   light=new T.Sprite(new T.SpriteMaterial(addMat({map:glowTex('rgba(255,250,235,1)','rgba(255,190,90,.55)'),opacity:0})));light.renderOrder=9;scene.add(light);
   var mp=[],ms=[];for(i=0;i<240;i++){mp.push((r()-.5)*2.8,-1.6+r()*3.8,-.4+r()*1.6);ms.push(r());}var mg=new T.BufferGeometry();mg.setAttribute('position',new T.Float32BufferAttribute(mp,3));mg.setAttribute('aS',new T.Float32BufferAttribute(ms,1));
   motesMat=new T.ShaderMaterial(addMat({uniforms:{uT:{value:0},uPx:{value:S},uA:{value:.5}},vertexShader:'attribute float aS;uniform float uT,uPx;varying float vA;void main(){vec3 p=position;p.y=mod(p.y+1.6+uT*(.03+.05*aS),3.8)-1.6;p.x+=sin(uT*.3+aS*20.)*.06;vec4 mv=modelViewMatrix*vec4(p,1.);vA=.3+.7*aS;gl_PointSize=(2.+3.*aS)*uPx*3./-mv.z;gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA*uA;gl_FragColor=vec4(vec3(1.,.82,.5)*a,1.);}'}));
   motes=new T.Points(mg,motesMat);motes.renderOrder=8;scene.add(motes);
   placeCityCam(.58);R.setRenderTarget(rt);R.render(cityScene,cityCam);var px=new Uint8Array(768*1104*4);R.readRenderTargetPixels(rt,0,0,768,1104,px);R.setRenderTarget(null);
   var st=[],co=[],de=[],sd=[],n=0,tries=0;
   while(n<NP&&tries<NP*30){tries++;var u=r(),v=r(),lx=(u-.5)*2,ly=(v-.5)*2;if(lx*lx+ly*ly>.96)continue;var ix=Math.floor(u*767),iy=Math.floor(v*1103),o=(iy*768+ix)*4,cr=px[o]/255,cg=px[o+1]/255,cb=px[o+2]/255,lum=.3*cr+.6*cg+.1*cb;
    if(r()>Math.max(.07,lum*1.6))continue;st.push(MC.x+lx*RX,MC.y+ly*RY,.01);co.push(Math.min(1,cr*1.25+.05),Math.min(1,cg*1.25+.03),Math.min(1,cb*1.2+.02));de.push(Math.min(1,Math.hypot(lx,ly)*.7+r()*.3));sd.push(r());n++;}
   var pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(st,3));pg.setAttribute('aC',new T.Float32BufferAttribute(co,3));pg.setAttribute('aD',new T.Float32BufferAttribute(de,1));pg.setAttribute('aS',new T.Float32BufferAttribute(sd,1));
   partMat=new T.ShaderMaterial(addMat({uniforms:{uK:{value:0},uH:{value:new T.Vector3(HEART.x,HEART.y,HEART.z)},uPx:{value:S},uT:{value:0}},
    vertexShader:'attribute vec3 aC;attribute float aD,aS;uniform float uK,uPx,uT;uniform vec3 uH;varying vec3 vC;varying float vA;void main(){float k=clamp(uK*1.45-aD*.45,0.,1.);k=k*k*(3.-2.*k);vec3 p=mix(position,uH,k);float an=aS*6.283+k*7.;p.xy+=vec2(cos(an),sin(an))*sin(k*3.1416)*(.18+.3*aS);vC=mix(aC,vec3(1.,.86,.55),k);vA=uK>.001?1.-smoothstep(.97,1.,k)*.85:0.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.6+2.6*sin(k*3.1416)+.6*aS)*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA;gl_FragColor=vec4(vC*a,1.);}'}));
   parts=new T.Points(pg,partMat);parts.renderOrder=9;parts.frustumCulled=false;scene.add(parts);
   ok=true;
  }catch(e){if(window.console)console.warn('film init failed',e);ok=false;}
  return ok;}

 function size(h){h=Math.round(h||560);if(h===curH)return;curH=h;R.setSize(Math.round(W*S),Math.round(h*S),false);cam.aspect=W/h;cam.fov=2*Math.atan(Math.tan(20*Math.PI/180)*((W/H)/(W/h)))*180/Math.PI;cam.updateProjectionMatrix();}
 function render(pf,t,h){size(h);
  var s=Math.max(0,Math.min(1,pf));
  var pull=eio(ss(.06,.24,s)),push=ss(.82,1,s);
  var camZ=lerp(2.0,5.25,pull)-.3*push,lookY=lerp(MC.y,.25,pull)+.15*push;cam.position.set(0,lookY,camZ);cam.lookAt(0,lookY,0);
  var kc=ss(.54,.68,s),rise=ss(.69,.8,s),drawA=ss(.75,.93,s),mud=ss(.92,.99,s),down=ss(.7,.8,s);
  var sleep=ss(.25,.32,s),wake=ss(.5,.57,s),rip=ss(.29,.38,s)*(1-kc),thr=ss(.33,.43,s)*(1-ss(.52,.6,s));
  placeCityCam(s);lampMat.uniforms.uT.value=t;R.setRenderTarget(rt);R.render(cityScene,cityCam);R.setRenderTarget(null);
  var m1=kc,m2=rise;
  var fx=lerp(lerp(MC.x,HEART.x,m1),HALO.x,m2),fy=lerp(lerp(MC.y,HEART.y,m1),HALO.y,m2),fz=lerp(lerp(0,HEART.z,m1),HALO.z,m2);
  var sx=lerp(lerp(RX,.08,eio(m1)),.26,eio(m2)),sy=lerp(lerp(RY,.08,eio(m1)),.26,eio(m2));
  mirror.position.set(fx,fy,fz);mirror.scale.set(sx,sy,1);frame.position.set(fx,fy,fz+.001);frame.scale.set(sx,sy,1);frameGlow.position.copy(frame.position);frameGlow.scale.set(sx,sy,1);beadsF.position.copy(frame.position);beadsF.scale.set(sx,sy,1);beadsF.rotation.z=t*.05;
  mirrorMat.uniforms.uT.value=t;mirrorMat.uniforms.uRip.value=rip;mirrorMat.uniforms.uFade.value=1-ss(.0,.75,kc);mirrorMat.uniforms.uA.value=1-ss(.5,.95,m1);
  frame.material.opacity=1;frameGlow.material.opacity=.3+.4*m1*(1-m2)+.2*m2;
  mandala.rotation.z=t*.02;mandalaMat.opacity=.07+.05*Math.sin(t*.8)*.5+.22*rise;mandala.position.y=lerp(MC.y,ARTY+.1,rise);
  var sy2=lerp(-1.35,-.95,eio(sleep))-.13*down;sleeper.position.y=sy2;sleeper.material.opacity=sleep;
  var hy=lerp(-1.35+.62,HEADP.y-.06,eio(sleep))+.08*wake-.13*down;head.position.set(0,hy,HEADP.z);head.material.opacity=sleep;head.rotation.z=Math.sin(t*.7)*.02*(1-wake);
  headGlow.position.set(0,hy,.83);headGlow.scale.setScalar(.5+.08*Math.sin(t*2.2));headGlow.material.opacity=(.25+.15*Math.sin(t*2.2))*sleep*(1-wake);
  for(var i=0;i<threads.length;i++){var ln=threads[i],n=Math.floor(41*Math.min(1,thr*1.4-ln.userData.ph*.4));ln.geometry.setDrawRange(0,Math.max(0,n));ln.material.opacity=.45*thr;
   for(var b=0;b<2;b++){var q=((t*.35+ln.userData.ph+b*.5)%1),pts=ln.userData.pts,j=Math.min(40,Math.floor(q*40))*3,o=(i*2+b)*3;var vis=thr>.6?1:0;beadPos[o]=pts[j];beadPos[o+1]=pts[j+1];beadPos[o+2]=vis?pts[j+2]:-9;}}
  beads.geometry.attributes.position.needsUpdate=true;beads.material.opacity=thr;
  partMat.uniforms.uK.value=kc*(1-ss(.9,1,kc)*0)+0;partMat.uniforms.uT.value=t;parts.visible=kc>0&&kc<1.0001&&rise<1;
  if(kc>=1){partMat.uniforms.uK.value=1;}
  var lx=lerp(HEART.x,HALO.x,eio(rise)),ly=lerp(HEART.y,HALO.y,eio(rise)),lz=lerp(HEART.z,HALO.z+.02,rise);light.position.set(lx,ly,lz);
  var ls=.15+.55*kc+2.4*Math.sin(Math.PI*Math.min(1,rise*1.2))*(1-drawA*.4)+.9*drawA;light.scale.setScalar(ls*(1+.04*Math.sin(t*3)));light.material.opacity=Math.min(1,kc*.9+rise*.2)*(1-.45*drawA);
  drawArt(drawA,mud);art.material.opacity=Math.min(1,drawA*3);art.visible=drawA>0;
  haloMat.opacity=ss(.7,1,rise)*(.6+.4*Math.sin(t*2));halo.rotation.z=-t*.15;
  motesMat.uniforms.uT.value=t;
  R.render(scene,cam);
  return R.domElement;}

 var LABELS=[{p:.03,dev:'विश्वं',en:'the universe'},{p:.14,dev:'दर्पण',en:'a mirror'},{p:.28,dev:'बहिरिव',en:'seems outside'},{p:.39,dev:'निद्रया',en:'as in a dream'},{p:.51,dev:'प्रबोधसमये',en:'on awakening'},{p:.6,dev:'स्वात्मानम्',en:'one’s own Self'},{p:.68,dev:'अद्वयं',en:'one, without a second'},{p:.8,dev:'नमः',en:'salutations'}];
 function spring(x){return 1-Math.exp(-7*x)*Math.cos(10*x);}
 function overlay(g,pf,total,h){var off=((h||560)-560)*.42;
  var k=-1;for(var i=0;i<LABELS.length;i++)if(pf>=LABELS[i].p)k=i;if(k<0)return;
  var L=LABELS[k],end=k+1<LABELS.length?LABELS[k+1].p:1.2,tin=(pf-L.p)*total,tout=(end-pf)*total;
  var y0=(pf>=.79?96:124)+off,rise=spring(Math.min(1.2,tin))*1,out=pf<1?ss(.3,0,tout):0,hold=1-out;
  var lw=Math.min(1,tin*3)*70*(1-out);
  g.save();g.globalAlpha=1;g.strokeStyle='rgba(233,180,76,.9)';g.lineWidth=1.2;g.beginPath();g.moveTo(180-lw,y0+8);g.lineTo(180+lw,y0+8);g.stroke();
  g.beginPath();g.rect(0,y0-60,360,68);g.clip();
  g.textAlign='center';g.textBaseline='alphabetic';g.shadowColor='rgba(7,5,15,.9)';g.shadowBlur=12;
  var dy=(1-rise)*46-out*30;g.globalAlpha=hold;g.fillStyle='#F6D58E';g.font='34px "Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif';g.fillText(L.dev,180,y0-4+dy);g.restore();
  g.save();var e=ss(.15,.5,tin)*hold;g.globalAlpha=e;g.textAlign='center';g.fillStyle='#F6EBD2';g.shadowColor='rgba(7,5,15,.95)';g.shadowBlur=10;g.font='600 12.5px "Mukta", system-ui, sans-serif';
  var txt=L.en.toUpperCase().split('').join(String.fromCharCode(8202));g.fillText(txt,180,y0+28+(1-e)*6);g.restore();}
 return{init:init,render:render,overlay:overlay,ss:ss};
})();
