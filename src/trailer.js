/* The trailer on the landing page: a 38-second studio-lit 3D piece in the style of a product launch. A gold Sri Yantra
   floats in exploded layers, clicks together ("Introducing"), the eight tattva medallions orbit it, a phone turns on a
   turntable showing a reel, a game and Sing, the Sudarshana chakra flies round it, and the name cycles through the
   four scripts. Everything is a pure function of t (seconds), so the same code plays live and renders to video. */
const TRAILER=(function(){
 const T=window.THREE,LEN=38;
 const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);},
  e3=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,lerp=(a,b,k)=>a+(b-a)*k,win=(t,a,b,f)=>ss(a,a+(f||.6),t)*(1-ss(b-(f||.6),b,t));
 // the Sri Yantra's nine triangles and lotus petals, from the logo's SVG (100-unit box)
 const TRI=[[50,23.3,24.7,64.7,75.3,64.7],[50,76.7,24.7,35.3,75.3,35.3],[50,31.9,30.2,64.1,69.8,64.1],[50,68.1,30.2,35.9,69.8,35.9],[50,33.7,35.8,56.9,64.2,56.9],[50,66.5,35.8,43.4,64.2,43.4],[50,42.5,40.9,57.4,59.1,57.4],[50,58.5,40.4,42.8,59.6,42.8],[50,55.3,44.9,47.1,55.1,47.1]];
 const P=(x,y)=>[(x-50)/50,-(y-50)/50];
 function petals(R0,R1,n,w){const out=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,da=Math.PI/n;
   const p0=[Math.cos(a-da)*R0,Math.sin(a-da)*R0],tip=[Math.cos(a)*R1,Math.sin(a)*R1],p1=[Math.cos(a+da)*R0,Math.sin(a+da)*R0],
    c0=[Math.cos(a-da*w)*R1*.97,Math.sin(a-da*w)*R1*.97],c1=[Math.cos(a+da*w)*R1*.97,Math.sin(a+da*w)*R1*.97];out.push([p0,c0,tip],[tip,c1,p1]);}return out;}
 function mount(box){
  const cv=document.createElement('canvas');cv.className='trcv';box.appendChild(cv);
  const ov=document.createElement('div');ov.className='trov';box.appendChild(ov);
  ov.innerHTML=
   '<div class="trk tr-intro"><span>INTRODUCING</span></div>'+
   '<div class="trk tr-title"><h3>HEY TATTVA</h3><p class="dv">हे तत्त्व</p><p class="sub">'+LX('The eight tattvas of the Dakṣiṇāmūrti Aṣṭakam')+'</p></div>'+
   feat('f1','01','VERSES','8 TATTVAS',LX('One truth about the Self in every verse.'))+
   feat('f2','02','REELS','WATCH',LX('Each verse is a reel and a 3D film.'))+
   feat('f3','03','GAMES','PLAY',LX('Four games for every tattva.'))+
   feat('f4','04','SING','SING',LX('Your voice, scored live, note by note.'))+
   '<div class="trk tr-lang"><span class="lk">05 · LANGUAGES</span><b>हे तत्त्व</b><b>హే తత్త్వ</b><b>ಹೇ ತತ್ತ್ವ</b><b>Hey Tattva</b><span class="ls">English · తెలుగు · ಕನ್ನಡ · हिन्दी</span></div>'+
   '<div class="trk tr-end"><h3>HEY TATTVA</h3><p class="sub">'+LX('Watch. Understand. Sing. Play.')+'</p><p class="url">heytattva.vercel.app</p></div>'+
   '<div class="trveil"></div>';
  function feat(id,n,k,big,sub){return'<div class="trk tr-feat '+id+'"><span class="fk"><i></i>'+n+' / '+k+'</span><h4>'+big+'</h4><p>'+sub+'</p></div>';}
  const K={};ov.querySelectorAll('.trk').forEach(e=>{K[e.classList[1]]=e;});const veil=ov.querySelector('.trveil'),langs=K['tr-lang'].querySelectorAll('b');
  const R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:false,preserveDrawingBuffer:true});
  R.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));R.setClearColor(0x05040c,1);
  R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.physicallyCorrectLights=false;
  const sc=new T.Scene();sc.fog=new T.Fog(0x05040c,7,16);
  const cam=new T.PerspectiveCamera(32,16/9,.1,60);
  // a studio for reflections: dark room with long soft light strips
  const env=(function(){const es=new T.Scene();es.add(new T.Mesh(new T.SphereGeometry(20,24,12),new T.MeshBasicMaterial({color:0x0b0918,side:T.BackSide})));
   const strip=(w,h,col,x,y,z,ry,rx)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:col,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);es.add(m);};
   strip(14,1.6,0xfff1d6,0,9,0,0,Math.PI/2);strip(1.2,10,0xffd9a0,-9,2,2,Math.PI/2);strip(1.2,10,0x9fb4ff,9,1,-2,-Math.PI/2);strip(10,.8,0xffe7b8,0,-1,-10,0);strip(6,.5,0xff8a5c,0,-6,6,0,-Math.PI/3);
   const pm=new T.PMREMGenerator(R);const tx=pm.fromScene(es,.04).texture;pm.dispose();return tx;})();
  sc.environment=env;
  const key=new T.DirectionalLight(0xfff0d8,1.4);key.position.set(3,4,5);sc.add(key);
  const rim=new T.PointLight(0xffb45a,2.2,12);rim.position.set(-3,1,-2);sc.add(rim);
  const fill=new T.PointLight(0x7f8cff,.8,12);fill.position.set(3,-2,2);sc.add(fill);sc.add(new T.AmbientLight(0x2a2450,.6));
  const GOLD=new T.MeshStandardMaterial({color:0xF4B73A,metalness:1,roughness:.26,envMapIntensity:1.25});
  const GOLD2=new T.MeshStandardMaterial({color:0xE8963A,metalness:1,roughness:.32,envMapIntensity:1.1});
  const KUM=new T.MeshStandardMaterial({color:0xC4262E,metalness:.4,roughness:.3,emissive:0x7a0d12,emissiveIntensity:.8});
  const glowTex=(function(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
   r.addColorStop(0,'rgba(255,220,150,1)');r.addColorStop(.35,'rgba(255,170,70,.45)');r.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
  const glow=(s,op)=>{const m=new T.Sprite(new T.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:op||1}));m.scale.setScalar(s);return m;};
  const tube=(pts,r,mat)=>new T.Mesh(new T.TubeGeometry(pts.length===3?new T.QuadraticBezierCurve3(...pts.map(p=>new T.Vector3(p[0],p[1],0))):new T.LineCurve3(new T.Vector3(pts[0][0],pts[0][1],0),new T.Vector3(pts[1][0],pts[1][1],0)),pts.length===3?14:2,r,6,false),mat);

  /* ---- the Sri Yantra, built as layers so it can explode and click together ---- */
  const Y=new T.Group(),layers=[];sc.add(Y);
  const addLayer=g=>{const L=new T.Group();g.forEach(m=>L.add(m));Y.add(L);layers.push(L);return L;};
  (function(){const S=1.12,bar=(x,y,w,h)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,.05),GOLD2);m.position.set(x,y,0);return m;},ms=[];
   for(const k of [0,.07]){const s=S-k,th=.028;ms.push(bar(0,s,2*s,th),bar(0,-s,2*s,th),bar(s,0,th,2*s),bar(-s,0,th,2*s));}
   for(let i=0;i<4;i++){const g=new T.Group();g.add(bar(0,S+.12,.36,.03),bar(-.17,S+.06,.03,.14),bar(.17,S+.06,.03,.14));g.rotation.z=i*Math.PI/2;ms.push(g);}
   addLayer(ms);})();
  addLayer([.92,.8556].map(r=>new T.Mesh(new T.TorusGeometry(r,.014,8,120),GOLD)));
  addLayer(petals(.8,.9,16,.55).map(p=>tube(p,.011,GOLD2)));
  addLayer(petals(.62,.79,8,.6).map(p=>tube(p,.012,GOLD)).concat([new T.Mesh(new T.TorusGeometry(.62,.011,8,90),GOLD2)]));
  TRI.forEach((t,i)=>{const a=P(t[0],t[1]),b=P(t[2],t[3]),c=P(t[4],t[5]),cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3,sh=new T.Shape(),hole=new T.Path();
   const r=Math.hypot(a[0]-cx,a[1]-cy),k=1-.034/r*2.2,In=p=>[cx+(p[0]-cx)*k,cy+(p[1]-cy)*k];
   sh.moveTo(...a);sh.lineTo(...b);sh.lineTo(...c);sh.lineTo(...a);const ia=In(a),ib=In(b),ic=In(c);hole.moveTo(...ia);hole.lineTo(...ic);hole.lineTo(...ib);hole.lineTo(...ia);sh.holes.push(hole);
   const g=new T.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelThickness:.006,bevelSize:.005,bevelSegments:1,curveSegments:1});g.translate(0,0,-.02);
   addLayer([new T.Mesh(g,i%2?GOLD2:GOLD)]);});
  const bindu=new T.Mesh(new T.SphereGeometry(.035,20,14),KUM);const bg=glow(.5,.9);addLayer([bindu,bg]);
  /* ---- the eight medallions ---- */
  const MED=new T.Group();sc.add(MED);const meds=[];
  for(let n=1;n<=8;n++){const c=document.createElement('canvas');c.width=c.height=256;const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;
   const face=new T.MeshStandardMaterial({map:tx,metalness:.35,roughness:.4,envMapIntensity:.6});
   const m=new T.Mesh(new T.CylinderGeometry(.3,.3,.06,48),[GOLD,face,GOLD]);m.rotation.x=Math.PI/2;const g=new T.Group();g.add(m);MED.add(g);meds.push(g);
   paintMed(c,tx,n);}
  function paintMed(c,tx,n){const g=c.getContext('2d'),r=g.createRadialGradient(128,110,10,128,128,128);r.addColorStop(0,'#2b2468');r.addColorStop(1,'#120f33');
   g.fillStyle=r;g.beginPath();g.arc(128,128,128,0,7);g.fill();g.strokeStyle='#F4B73A';g.lineWidth=7;g.beginPath();g.arc(128,128,112,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(128,128,100,0,7);g.stroke();
   g.fillStyle='#F4B73A';g.font='600 26px Eczar, serif';g.textAlign='center';g.fillText(String(n),128,226);
   if(n===3){const go=()=>{g.font='118px "Tiro Devanagari Sanskrit", serif';g.textBaseline='middle';g.fillText('ॐ',128,132);tx.needsUpdate=true;};(document.fonts?document.fonts.load('118px "Tiro Devanagari Sanskrit"','ॐ').then(go,go):go());return;}
   const im=new Image();im.onload=()=>{g.drawImage(im,48,40,160,160);tx.needsUpdate=true;};
   im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F4B73A" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">'+TSYM[n]+'</svg>');tx.needsUpdate=true;}
  /* ---- the phone on a turntable ---- */
  const PH=new T.Group();sc.add(PH);
  (function(){const w=.96,h=2.06,r=.14,s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
   s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
   const g=new T.ExtrudeGeometry(s,{depth:.07,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:3,curveSegments:8});g.translate(0,0,-.035);
   PH.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x1b1836,metalness:.85,roughness:.3})));
})();
  const SCR=['img/tr_reel.jpg','img/tr_game.jpg','img/tr_sing.jpg'].map(u=>{const tx=new T.TextureLoader().load(u);tx.encoding=T.sRGBEncoding;tx.anisotropy=4;return tx;});
  const scrM=new T.MeshBasicMaterial({map:SCR[0],toneMapped:false});const scr=new T.Mesh(new T.PlaneGeometry(.88,1.9),scrM);scr.position.z=.062;PH.add(scr);
  const flash=new T.Mesh(new T.PlaneGeometry(.88,1.9),new T.MeshBasicMaterial({color:0xfff2d0,transparent:true,opacity:0,toneMapped:false}));flash.position.z=.064;PH.add(flash);
  /* ---- the Sudarshana chakra ---- */
  const CK=new T.Group(),ckSpin=new T.Group();CK.add(ckSpin);sc.add(CK);
  (function(){const FIRE=new T.MeshStandardMaterial({color:0xFFB347,metalness:.9,roughness:.25,emissive:0xff6a00,emissiveIntensity:.35});
   ckSpin.add(new T.Mesh(new T.TorusGeometry(.42,.04,10,64),GOLD),new T.Mesh(new T.TorusGeometry(.16,.03,8,40),GOLD),new T.Mesh(new T.CylinderGeometry(.08,.08,.05,24).rotateX(Math.PI/2),KUM));
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2,sp=new T.Mesh(new T.BoxGeometry(.26,.025,.025),GOLD2);sp.position.set(Math.cos(a)*.29,Math.sin(a)*.29,0);sp.rotation.z=a;ckSpin.add(sp);}
   for(let i=0;i<24;i++){const a=i/24*Math.PI*2,tooth=new T.Mesh(new T.ConeGeometry(.045,.16,4),FIRE);tooth.position.set(Math.cos(a)*.5,Math.sin(a)*.5,0);tooth.rotation.z=a-Math.PI/2-.35;ckSpin.add(tooth);}
   const gl=glow(1.9,.75);gl.position.z=-.1;CK.add(gl);})();
  /* ---- sound rings for Sing ---- */
  const RINGS=[];for(let i=0;i<5;i++){const m=new T.Mesh(new T.TorusGeometry(1,.008,6,120),new T.MeshBasicMaterial({color:0xF4B73A,transparent:true,opacity:0,toneMapped:false,depthWrite:false}));sc.add(m);RINGS.push(m);}
  /* ---- gold dust ---- */
  const dust=(function(){const n=700,g=new T.BufferGeometry(),p=new Float32Array(n*3),rnd=mulberry32(7);for(let i=0;i<n;i++){p[i*3]=(rnd()-.5)*12;p[i*3+1]=(rnd()-.5)*7;p[i*3+2]=-6+rnd()*8;}
   g.setAttribute('position',new T.BufferAttribute(p,3));const m=new T.Points(g,new T.PointsMaterial({color:0xFFD98A,size:.022,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));sc.add(m);return m;})();
  const halo=glow(5,.0);halo.position.z=-1.5;sc.add(halo);
  // camera path: keyframes [t, position, target]
  const CAMK=[[0,[.3,.12,4.5],[0,0,0]],[6.8,[0,0,4.3],[0,0,0]],[9.8,[0,0,4.6],[0,-.15,0]],[10.8,[.1,1.15,4.9],[.55,-.3,0]],[14.6,[-.1,.95,4.7],[.55,-.25,0]],
   [15.8,[0,0,4.5],[.55,0,0]],[29.6,[0,.1,4.25],[.55,0,0]],[30.8,[0,0,4.4],[0,0,0]],[38,[0,0,4.9],[0,0,0]]];
  function camAt(t){let i=0;while(i<CAMK.length-2&&t>CAMK[i+1][0])i++;const a=CAMK[i],b=CAMK[i+1],k=e3(cl((t-a[0])/(b[0]-a[0]),0,1));
   const f=j=>[0,1,2].map(q=>lerp(a[j][q],b[j][q],k));return[f(1),f(2)];}
  let W=0,H=0;
  function size(){const w=box.clientWidth,h=box.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
  function render(t){size();t=((t%LEN)+LEN)%LEN;
   R.toneMappingExposure=1.15*ss(0,1.6,t)*(1-ss(37.1,38,t));
   const [cp,ct]=camAt(t);cam.position.set(cp[0]+Math.sin(t*.23)*.06,cp[1]+Math.sin(t*.31)*.04,cp[2]);cam.lookAt(ct[0],ct[1],ct[2]);
   // yantra: exploded → click (7.0) → title → floor of the medallions → away → back for the end
   const ex=1-e3(cl((t-4.1)/2.9,0,1)),click=Math.exp(-Math.pow((t-7.05)/.12,2));
   layers.forEach((L,i)=>{const z=(i-(layers.length-1)/2)*.15*ex;L.position.z=z;L.rotation.z=ex*(i%2?.25:-.25)*(1-i/layers.length)+(i===0?t*.02:0);});
   let yx=-.42,yy=-.62+t*.09,ys=.86,ypy=0,ypx=0,ypz=0;
   const f2=ss(7.2,9.6,t);yy=lerp(yy,Math.sin(t*.4)*.08,f2);yx=lerp(yx,-.05,f2);ypy=lerp(0,.4,f2);ys=lerp(ys,.6,f2);
   const f3=ss(9.9,11.2,t);yx=lerp(yx,-1.36,f3);yy=lerp(yy,0,f3);ypx=lerp(ypx,1.75,f3);ypy=lerp(ypy,-.82,f3);ys=lerp(ys,.95,f3);
   const f4=ss(14.6,15.6,t);ypy=lerp(ypy,-3.2,f4);ypz=lerp(0,-1.5,f4);
   if(t>15.6){ypx=0;ypy=.4;ypz=-9;}const f5=ss(29.9,31.4,t);yx=lerp(yx,-.1,f5);yy=lerp(yy,Math.sin(t*.5)*.25,f5);ypx=lerp(ypx,0,f5);ypy=lerp(ypy,.46,f5);ypz=lerp(ypz,0,f5);ys=lerp(ys,.52,f5);
   Y.visible=!(t>15.6&&t<29.9);Y.position.set(ypx,ypy,ypz);Y.rotation.set(yx,yy,0);Y.scale.setScalar(ys*(1+click*.04));
   bindu.material.emissiveIntensity=.8+click*4+ss(30.5,32,t)*1.5;bg.material.opacity=.6+click*1.2+ss(31,33,t)*.6;
   // medallions orbit above the floor yantra
   const mOn=ss(10.4,12.2,t)*(1-ss(14.7,15.5,t));MED.visible=mOn>0;
   meds.forEach((g,i)=>{const a=i/8*Math.PI*2+t*.42,on=ss(10.4+i*.16,11.2+i*.16,t),out=ss(14.7,15.6,t),rr=lerp(.85,3.6,out)*(.4+.6*on);
    g.position.set(1.75+Math.cos(a)*rr,-.42+Math.sin(t*1.3+i)*.06+on*.22,Math.sin(a)*rr*.38);g.rotation.set(0,Math.sin(t*.8+i)*.35,0);g.scale.setScalar(on*.82*(1-out*.5));});
   // phone: in from the right, turntable, out to the left
   const pin=e3(cl((t-15.1)/1.3,0,1)),pout=e3(cl((t-29.4)/1.1,0,1));PH.visible=pin>0&&pout<1;
   PH.position.set(lerp(3.4,.95,pin)+lerp(0,-4.6,pout),lerp(-.25,0,pin)+Math.sin(t*.9)*.03,0);PH.rotation.set(-.06,lerp(-1.9,-.42,pin)+Math.sin((t-15)*.5)*.22+pout*-1.2,lerp(.2,0,pin));
   const si=t<20?0:t<25?1:2;if(scrM.map!==SCR[si])scrM.map=SCR[si];flash.material.opacity=Math.max(Math.exp(-Math.pow((t-20)/.09,2)),Math.exp(-Math.pow((t-25)/.09,2)))*.9;
   // chakra flies round the phone during GAMES
   const con=ss(19.7,20.6,t)*(1-ss(24.6,25.4,t));CK.visible=con>0;const ca=(t-20)*1.35;
   CK.position.set(.95+Math.cos(ca)*1.15,Math.sin(ca*.9)*.5,Math.sin(ca)*.8+.25);CK.scale.setScalar(con*.82);ckSpin.rotation.z=-t*9;CK.rotation.y=Math.sin(ca)*.4;
   // sound rings during SING
   RINGS.forEach((m,i)=>{const ph=((t-25.2)*.55+i/5)%1,on=win(t,25.2,30.2,.5);m.visible=on>0;m.position.set(.95,.05,-.2);m.scale.setScalar(.6+ph*2.1);m.material.opacity=on*(1-ph)*.7;});
   halo.material.opacity=.18*win(t,7,10.4,.8)+.25*win(t,30.4,38,1.2)+click*.35;halo.position.set(Y.position.x,Y.position.y,-1.5);
   dust.rotation.y=t*.012;dust.position.y=Math.sin(t*.1)*.15;
   rim.position.set(Math.cos(t*.35)*3.2,1+Math.sin(t*.5),-2+Math.sin(t*.35)*1.5);key.position.set(3*Math.cos(t*.12),4,5*Math.sin(.6+t*.05));
   R.render(sc,cam);
   // the words
   setK('tr-intro',win(t,1.1,4.7,.7),e=>{e.style.letterSpacing=lerp(.9,.42,ss(1.1,4.7,t))+'em';});
   setK('tr-title',win(t,7.15,10.1,.5),e=>{e.style.transform='translateY('+(1-ss(7.15,8,t))*14+'px)';});
   [['f1',10.6,15],['f2',15.9,20],['f3',20.6,25],['f4',25.6,30]].forEach(([id,a,b])=>setK('tr-feat '+id,win(t,a,b,.45),e=>{e.style.setProperty('--ln',ss(a,a+.9,t));e.style.transform='translateX('+(1-ss(a,a+.7,t))*-18+'px)';}));
   setK('tr-lang',win(t,30.6,33.5,.4));const li=Math.min(3,Math.floor(cl((t-30.8)/.68,0,3.99)));langs.forEach((b,i)=>b.classList.toggle('on',i===li));
   setK('tr-end',ss(34,35,t)*(1-ss(37.1,37.9,t)),e=>{e.style.letterSpacing=lerp(.5,.18,ss(34,36,t))+'em';});
   veil.style.opacity=(1-ss(0,1.2,t))+ss(37.2,38,t);}
  const vis={};
  ['f1','f2','f3','f4'].forEach(id=>{K[id]=ov.querySelector('.'+id);});
  function setK(cls,o,f){const e=cls.indexOf('tr-feat')===0?K[cls.split(' ')[1]]:K[cls];if(!e)return;if(vis[cls]!==o){e.style.opacity=o;e.style.visibility=o>0?'visible':'hidden';vis[cls]=o;}if(f&&o>0)f(e);}
  return{render,len:LEN,dispose(){R.dispose();env.dispose();try{R.forceContextLoss();}catch(e){}box.innerHTML='';}};}
 return{mount,LEN};})();
