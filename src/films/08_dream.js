/* Tattva 8 film: the dream of roles. A dreamer sees cause and effect, owner and owned, student and teacher, father and son;
   every figure is spun out of the dreamer, and on waking they all return to him. */
FILMS[8]=KIT.film({hold:[.1,.72],poster:.33,
 labels:[{p:.03,dev:'विश्वं पश्यति',en:'one sees a world'},{p:.12,dev:'कार्यकारण',en:'cause and effect'},{p:.21,dev:'स्वस्वामि',en:'owned and owner'},{p:.3,dev:'शिष्याचार्य',en:'student and teacher'},{p:.39,dev:'पितृपुत्र',en:'father and son'},{p:.48,dev:'भेदतः',en:'all as division'},{p:.57,dev:'स्वप्ने जाग्रति वा',en:'in dream or waking'},{p:.66,dev:'मायापरिभ्रामितः',en:'spun round by māyā'},{p:.84,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP,r=K.rng(808);
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x0d0819,0x030207);scene.add(st.bg);
  st.motes=K.motes(200,[3.4,4.6,2],24);scene.add(st.motes);
  var BC=new T.Vector3(0,.0,0),BR=.84;st.BC=BC;st.BR=BR;
  var DY=-1.32;st.DY=DY;st.HEAD=new T.Vector3(-.5,DY+.02,.1);st.HEADS=new T.Vector3(0,DY+.62,.1);
  // figure drawing helpers for the pairs
  function fig(g,x,y,s){g.beginPath();g.arc(x,y-s*.82,s*.13,0,7);g.fill();g.beginPath();g.moveTo(x-s*.13,y-s*.66);g.lineTo(x+s*.13,y-s*.66);g.lineTo(x+s*.17,y-s*.25);g.lineTo(x+s*.08,y-s*.25);g.lineTo(x+s*.08,y);g.lineTo(x-s*.08,y);g.lineTo(x-s*.08,y-s*.25);g.lineTo(x-s*.17,y-s*.25);g.closePath();g.fill();}
  function seated(g,x,y,s){g.beginPath();g.arc(x,y-s*.62,s*.12,0,7);g.fill();g.beginPath();g.moveTo(x,y-s*.5);g.bezierCurveTo(x+s*.18,y-s*.48,x+s*.2,y-s*.3,x+s*.18,y-s*.18);g.bezierCurveTo(x+s*.34,y-s*.12,x+s*.36,y,x+s*.3,y);g.lineTo(x-s*.3,y);g.bezierCurveTo(x-s*.36,y,x-s*.34,y-s*.12,x-s*.18,y-s*.18);g.bezierCurveTo(x-s*.2,y-s*.3,x-s*.18,y-s*.48,x,y-s*.5);g.fill();}
  function arrow(g,x0,x1,y,w){g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.moveTo(x1-w*3,y-w*2.4);g.lineTo(x1,y);g.lineTo(x1-w*3,y+w*2.4);g.stroke();}
  function cause(g,w,h){g.beginPath();g.ellipse(w*.2,h*.66,w*.12,h*.08,0,0,7);g.fill();arrow(g,w*.37,w*.58,h*.6,w*.018);g.beginPath();g.ellipse(w*.78,h*.6,w*.13,h*.12,0,0,7);g.fill();g.fillRect(w*.72,h*.4,w*.12,h*.1);g.beginPath();g.ellipse(w*.78,h*.4,w*.08,h*.02,0,0,7);g.fill();}
  function owner(g,w,h){fig(g,w*.26,h*.8,h*.5);arrow(g,w*.4,w*.56,h*.55,w*.016);g.beginPath();g.moveTo(w*.6,h*.55);g.lineTo(w*.78,h*.38);g.lineTo(w*.96,h*.55);g.closePath();g.fill();g.fillRect(w*.63,h*.55,w*.3,h*.25);}
  function teach(g,w,h){seated(g,w*.3,h*.82,h*.62);seated(g,w*.74,h*.82,h*.42);g.lineWidth=w*.012;for(var i=1;i<4;i++){g.beginPath();g.arc(w*.42,h*.45,w*.05*i,-.6,.6);g.stroke();}}
  function father(g,w,h){fig(g,w*.38,h*.86,h*.66);fig(g,w*.62,h*.86,h*.38);g.lineWidth=w*.016;g.beginPath();g.moveTo(w*.44,h*.5);g.quadraticCurveTo(w*.52,h*.62,w*.58,h*.62);g.stroke();}
  function division(g,w,h){var cells=[[fig,.18,.42],[seated,.5,.42],[fig,.82,.42],[seated,.18,.86],[fig,.5,.86],[fig,.82,.86]];cells.forEach(function(c,k){c[0](g,w*c[1],h*c[2],h*(k%2?.28:.32));});g.fillRect(w*.33,h*.08,w*.008,h*.84);g.fillRect(w*.66,h*.08,w*.008,h*.84);g.fillRect(w*.04,h*.5,w*.92,h*.008);}
  var SW=1.36,inHead=K.cloud(NP,function(r){var a=r()*Math.PI*2,rr=Math.pow(r(),.6)*.09;return[st.HEAD.x+Math.cos(a)*rr,st.HEAD.y+.05+Math.sin(a)*rr,.1];},81);
  var tg=[inHead].concat([cause,owner,teach,father,division].map(function(f,k){return K.off(K.shape(f,NP,SW,82+k),BC.x,BC.y-.05,0);}));
  st.dream=K.morph(tg,[new T.Color(.8,.65,1),new T.Color(1,.8,.5),new T.Color(1,.75,.55),new T.Color(.95,.85,.55),new T.Color(1,.78,.5),new T.Color(.9,.75,.95)],{size:.8,swirl:.4,seed:88});scene.add(st.dream);
  // the dream bubble
  var bp=[];for(var i=0;i<=160;i++){var a=i/160*Math.PI*2;bp.push(Math.cos(a)*BR,Math.sin(a)*BR*1.08,0);}
  var bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));
  st.bubble=new T.Line(bg,new T.LineBasicMaterial(K.add({color:0xc9a6ff,opacity:0})));st.bubble.position.copy(BC);st.bubble.renderOrder=3;scene.add(st.bubble);
  st.bubGlow=K.sprite('rgba(170,120,255,.25)','rgba(90,50,160,.1)',{opacity:0});st.bubGlow.position.copy(BC);st.bubGlow.scale.set(2.6,2.8,1);st.bubGlow.renderOrder=1;scene.add(st.bubGlow);
  st.puffs=[.04,.065,.095].map(function(s,k){var m=new T.Mesh(new T.RingGeometry(.88,1,40),new T.MeshBasicMaterial(K.add({color:0xc9a6ff,opacity:0,side:T.DoubleSide})));m.scale.setScalar(s);m.renderOrder=3;scene.add(m);return m;});
  // threads: every figure is spun from the dreamer's head
  st.threads=[];for(i=0;i<30;i++){var tx=BC.x+(r()-.5)*1.5,ty=BC.y+(r()-.5)*1.4,pts=[],c1=new T.Vector3(K.lerp(st.HEAD.x,tx,.4)+(r()-.5)*.6,K.lerp(st.HEAD.y,ty,.5),.3);
   for(var j=0;j<=40;j++){var u=j/40,v=1-u;pts.push(v*v*st.HEAD.x+2*v*u*c1.x+u*u*tx,v*v*(st.HEAD.y+.05)+2*v*u*c1.y+u*u*ty,v*v*.1+2*v*u*.3+u*u*.02);}
   var g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(pts,3));var ln=new T.Line(g2,new T.LineBasicMaterial(K.add({color:0xf2c26a,opacity:0})));ln.userData.ph=r();ln.renderOrder=4;scene.add(ln);st.threads.push(ln);}
  // the dreamer
  function lying(g,w,h){g.beginPath();g.ellipse(w*.13,h*.47,w*.065,h*.1,0,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.24,h*.44);g.bezierCurveTo(w*.4,h*.36,w*.62,h*.38,w*.7,h*.44);g.bezierCurveTo(w*.84,h*.46,w*.94,h*.5,w*.95,h*.56);g.bezierCurveTo(w*.8,h*.6,w*.4,h*.62,w*.24,h*.58);g.closePath();g.fill();}
  function sitting(g,w,h){g.beginPath();g.arc(w*.5,h*.17,w*.08,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.5,h*.27);g.bezierCurveTo(w*.66,h*.28,w*.7,h*.36,w*.68,h*.6);g.bezierCurveTo(w*.84,h*.66,w*.92,h*.74,w*.9,h*.82);g.bezierCurveTo(w*.8,h*.9,w*.2,h*.9,w*.1,h*.82);g.bezierCurveTo(w*.08,h*.74,w*.16,h*.66,w*.32,h*.6);g.bezierCurveTo(w*.3,h*.36,w*.34,h*.28,w*.5,h*.27);g.fill();}
  var Ly=K.off(K.shape(lying,Math.round(NP*.5),1.4,91),0,DY,0),Si=K.off(K.shape(sitting,Math.round(NP*.5),1.0,92),0,DY+.38,0);
  st.dreamer=K.morph([Ly,Si],[new T.Color(.7,.55,.95),new T.Color(1,.82,.55)],{size:.75,swirl:.2,seed:93,jitter:.006});scene.add(st.dreamer);
  st.headGlow=K.sprite('rgba(210,170,255,1)','rgba(150,90,220,.4)',{opacity:0});st.headGlow.renderOrder=6;scene.add(st.headGlow);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=10;scene.add(st.art);
  st.mand=K.mandala();st.mand.position.set(0,.66,-1.4);st.mand.material.opacity=0;scene.add(st.mand);
  return st;},
 render:function(st,pf,t,h){var K=KIT,ss=K.ss,e=K.eio,L=K.lerp,BC=st.BC;
  var open=ss(.04,.11,pf),inside=e(ss(.1,.16,pf))*(1-e(ss(.54,.6,pf))),wake=ss(.72,.8,pf),fin=ss(.82,.9,pf),spin=ss(.64,.7,pf)*(1-ss(.72,.76,pf));
  // camera: close on the dream while it plays, wide to show the dreamer behind it
  var cz=L(5.6,4.5,inside),cy=L(-.3,BC.y,inside);cy=L(cy,.15,fin);st.cam.position.set(Math.sin(t*.13)*.08,cy,cz+.0*fin);st.cam.lookAt(0,cy,0);
  // dream figures
  st.dream.userData.seq(pf,[[0,0],[.13,1,.07],[.22,2,.06],[.31,3,.06],[.4,4,.06],[.49,5,.06],[.78,0,.08]],.06);
  var dm=st.dream.material.uniforms;dm.uT.value=t;dm.uAl.value=ss(.04,.09,pf)*(1-ss(.79,.83,pf));dm.uSw.value=.4+2.2*spin;
  st.dream.rotation.z=0;st.dream.position.set(0,0,0);if(spin>0){var ang=Math.sin(spin*Math.PI)*.9*Math.sin(t*1.7)+spin*(t-.0)*0;st.dream.position.set(BC.x,BC.y,0);st.dream.rotation.z=spin*Math.sin(t*1.2)*.6;st.dream.position.sub(new KIT.T.Vector3(BC.x,BC.y,0).applyAxisAngle(new KIT.T.Vector3(0,0,1),st.dream.rotation.z));}
  // bubble
  var ba=open*(1-ss(.74,.78,pf));st.bubble.material.opacity=.55*ba;st.bubble.scale.setScalar(L(.15,1,e(open))*(1+.01*Math.sin(t*2))*(1+.12*ss(.74,.78,pf)));
  st.bubGlow.material.opacity=.6*ba;
  st.puffs.forEach(function(m,k){var f=(k+1)/4;m.position.set(L(st.HEAD.x,BC.x-.2,f),L(st.HEAD.y+.15,BC.y-st.BR,f),.05);m.material.opacity=.5*ss(.03+k*.01,.07+k*.01,pf)*(1-ss(.74,.78,pf));});
  // threads: shown when we pull back to see the dreamer
  var thr=ss(.57,.63,pf)*(1-ss(.72,.76,pf));st.threads.forEach(function(ln){var n=Math.floor(41*Math.min(1,thr*1.4-ln.userData.ph*.4));ln.geometry.setDrawRange(0,Math.max(0,n));ln.material.opacity=.45*thr;});
  // dreamer
  st.dreamer.userData.seq(pf,[[0,0],[.8,1,.06]],.06);var dr=st.dreamer.material.uniforms;dr.uT.value=t;dr.uAl.value=ss(0,.04,pf)*(1-.65*inside)*(1-fin);
  var hd=st.HEAD.clone().lerp(st.HEADS,wake);st.headGlow.position.copy(hd);st.headGlow.scale.setScalar(.45+.1*Math.sin(t*2)+.4*ss(.74,.8,pf));st.headGlow.material.opacity=(.3+.5*ss(.74,.8,pf))*(1-fin)*ss(0,.05,pf);
  st.motes.material.uniforms.uT.value=t;var bgU=st.bg.material.uniforms;bgU.uG.value.setRGB(.4,.25,.55);bgU.uGs.value=.25*ba;bgU.uGy.value=.6;
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.22*fin;
  var dA=ss(.86,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.92,.99,pf)});st.art.visible=dA>0;
  if(fin>0){st.headGlow.position.set(0,L(hd.y,.44,e(fin)),.5);st.headGlow.material.opacity=.9;st.headGlow.material.color.setRGB(1,.9,.7);}else st.headGlow.material.color.setRGB(1,1,1);}
});
