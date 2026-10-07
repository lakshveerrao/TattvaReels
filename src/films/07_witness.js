/* Tattva 7 film: the unchanging I. Childhood, youth, age, waking, dream and sleep pass along a golden thread;
   the light of "I am" rides the thread through all of them; the thread closes into the jñāna-mudrā. */
FILMS[7]=KIT.film({hold:[.06,.6],poster:.2,
 labels:[{p:.03,dev:'बाल्यादिषु',en:'childhood, youth, age'},{p:.29,dev:'जाग्रदादिषु',en:'waking, dream, sleep'},{p:.47,dev:'व्यावृत्तासु',en:'as the states pass'},{p:.54,dev:'अनुवर्तमानम्',en:'one thing continues'},{p:.61,dev:'अहमिति स्फुरन्तं',en:'shining as "I am"'},{p:.7,dev:'मुद्रया भद्रया',en:'shown by the blessed mudrā'},{p:.84,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP,r=K.rng(707);
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,80);
  st.bg=K.bg(0x0c0717,0x030207);scene.add(st.bg);
  st.motes=K.motes(260,[14,4.6,3],21);st.motes.position.x=4;scene.add(st.motes);
  var TY=-.78,GAP=1.7;st.TY=TY;st.GAP=GAP;
  function child(g,w,h){g.beginPath();g.arc(w*.5,h*.5,w*.1,0,7);g.fill();g.beginPath();g.moveTo(w*.42,h*.6);g.lineTo(w*.58,h*.6);g.lineTo(w*.62,h*.8);g.lineTo(w*.56,h*.8);g.lineTo(w*.55,h*.95);g.lineTo(w*.51,h*.95);g.lineTo(w*.5,h*.82);g.lineTo(w*.49,h*.95);g.lineTo(w*.45,h*.95);g.lineTo(w*.44,h*.8);g.lineTo(w*.38,h*.8);g.closePath();g.fill();g.lineWidth=w*.03;g.lineCap='round';g.beginPath();g.moveTo(w*.42,h*.63);g.lineTo(w*.32,h*.74);g.moveTo(w*.58,h*.63);g.lineTo(w*.68,h*.55);g.stroke();}
  function youth(g,w,h){g.beginPath();g.arc(w*.5,h*.13,w*.065,0,7);g.fill();g.beginPath();g.moveTo(w*.43,h*.22);g.lineTo(w*.57,h*.22);g.lineTo(w*.6,h*.55);g.lineTo(w*.55,h*.56);g.lineTo(w*.56,h*.95);g.lineTo(w*.51,h*.95);g.lineTo(w*.5,h*.6);g.lineTo(w*.49,h*.95);g.lineTo(w*.44,h*.95);g.lineTo(w*.45,h*.56);g.lineTo(w*.4,h*.55);g.closePath();g.fill();g.lineWidth=w*.028;g.lineCap='round';g.beginPath();g.moveTo(w*.43,h*.25);g.lineTo(w*.35,h*.5);g.moveTo(w*.57,h*.25);g.lineTo(w*.65,h*.5);g.stroke();}
  function old(g,w,h){g.save();g.translate(w*.5,h*.95);g.rotate(.22);g.translate(-w*.5,-h*.95);youth(g,w,h*1.0);g.restore();g.lineWidth=w*.02;g.beginPath();g.moveTo(w*.7,h*.45);g.lineTo(w*.74,h*.95);g.stroke();}
  function sun(g,w,h){g.beginPath();g.arc(w*.5,h*.55,w*.16,0,7);g.fill();g.lineWidth=w*.022;g.lineCap='round';for(var i=0;i<12;i++){var a=i/12*Math.PI*2;g.beginPath();g.moveTo(w*.5+Math.cos(a)*w*.22,h*.55+Math.sin(a)*w*.22);g.lineTo(w*.5+Math.cos(a)*w*.32,h*.55+Math.sin(a)*w*.32);g.stroke();}}
  function moon(g,w,h){g.beginPath();g.arc(w*.5,h*.5,w*.18,0,7);g.fill();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(w*.58,h*.45,w*.16,0,7);g.fill();g.globalCompositeOperation='source-over';[[.3,.8,.09],[.42,.77,.12],[.56,.8,.1],[.68,.82,.07]].forEach(function(c){g.beginPath();g.arc(w*c[0],h*c[1],w*c[2],0,7);g.fill();});}
  function sleep(g,w,h){for(var i=0;i<40;i++){var a=i*2.39996,rr=Math.sqrt(i/40)*w*.3;g.beginPath();g.arc(w*.5+Math.cos(a)*rr,h*.6+Math.sin(a)*rr*.6,w*.006,0,7);g.fill();}}
  var SZ=[.7,1.15,1.15,1.1,1.15,1.1],fns=[child,youth,old,sun,moon,sleep];
  var tg=fns.slice(0,5).map(function(f,k){return K.off(K.shape(f,NP,SZ[k],70+k),k*GAP,TY+SZ[k]*.5-.02,0);});
  tg.push(K.cloud(NP,function(r){var a=r()*Math.PI*2,u=r()*2-1,rr=Math.pow(r(),.5)*.3,q=Math.sqrt(1-u*u);return[5*GAP+Math.cos(a)*q*rr,TY+.45+u*rr*.8,Math.sin(a)*q*rr];},79));
  st.forms=K.morph(tg,[new T.Color(1,.82,.55),new T.Color(1,.8,.5),new T.Color(.95,.78,.6),new T.Color(1,.75,.35),new T.Color(.7,.8,1),new T.Color(.32,.28,.55)],{size:.85,swirl:.25,seed:77});scene.add(st.forms);
  // the thread: straight through every state, later closing into the mudrā circle
  var TN=600,a0=[],a1=[];for(var i=0;i<TN;i++){var f=i/(TN-1);a0.push(-3+f*(5*GAP+6),TY,0);var an=Math.PI*.5+f*Math.PI*2;a1.push(Math.cos(an)*.1,Math.sin(an)*.1,0);}
  var tgeo=new T.BufferGeometry();tgeo.setAttribute('position',new T.Float32BufferAttribute(a0,3));tgeo.setAttribute('pB',new T.Float32BufferAttribute(a1,3));
  st.threadMat=new T.ShaderMaterial(K.add({uniforms:{uK:{value:0},uA:{value:1},uT:{value:0},uC:{value:new T.Vector3()},uPx:{value:K.S}},
   vertexShader:'attribute vec3 pB;uniform float uK,uT,uPx;uniform vec3 uC;varying float vG;void main(){vec3 p=mix(position,pB+uC,uK);vG=.6+.4*sin(position.x*6.-uT*3.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=2.6*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vG;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.82,.48)*smoothstep(.5,0.,d)*vG*uA,1.);}'}));
  st.thread=new T.Points(tgeo,st.threadMat);st.thread.frustumCulled=false;st.thread.renderOrder=4;scene.add(st.thread);
  // the light of "I am", riding the thread
  st.me=K.sprite();st.me.renderOrder=7;scene.add(st.me);
  st.meHalo=K.sprite('rgba(255,230,170,.45)','rgba(220,150,60,.15)');st.meHalo.renderOrder=6;scene.add(st.meHalo);
  // the jñāna-mudrā: right hand, index finger touching the thumb
  var P=[],bez=K.A.bez,arc=K.A.arc;
  P.push(bez([196,470],[186,400],[190,340],[214,300]));
  P.push(bez([214,300],[220,250],[236,200],[250,150]).concat(bez([250,150],[256,132],[276,134],[274,154])).concat(bez([274,154],[268,200],[262,250],[262,296])));
  P.push(bez([262,296],[272,240],[284,180],[296,136]).concat(bez([296,136],[302,118],[322,120],[320,142])).concat(bez([320,142],[312,190],[304,250],[300,304])));
  P.push(bez([300,304],[312,260],[326,214],[338,184]).concat(bez([338,184],[346,168],[364,174],[360,192])).concat(bez([360,192],[350,236],[338,290],[330,330])));
  P.push(bez([330,330],[336,380],[326,430],[300,470]));
  P.push(bez([214,300],[180,300],[148,316],[136,344]).concat(arc(156,350,22,Math.PI,Math.PI*2.1,20)));
  P.push(bez([222,296],[196,256],[150,268],[146,330]));
  st.mudra=K.art(P,512,512,2.4);st.mudra.renderOrder=8;scene.add(st.mudra);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.renderOrder=10;scene.add(st.art);
  st.mand=K.mandala();st.mand.material.opacity=0;scene.add(st.mand);
  return st;},
 render:function(st,pf,t,h){var K=KIT,T=K.T,ss=K.ss,e=K.eio,L=K.lerp,G=st.GAP,TY=st.TY;
  // dolly along the thread, pausing at each state
  var stops=[.13,.22,.31,.39,.47],cx=0;stops.forEach(function(s0){cx+=G*e(ss(s0-.045,s0,pf));});var close=ss(.62,.72,pf),fin=ss(.82,.9,pf);
  var mx=5*G;var camX=L(cx,mx-.15,close),camZ=L(4.6,3.6,close)+1.2*fin,camY=L(-.1,TY+.2,close)+L(0,1.05,fin);
  st.cam.position.set(camX+Math.sin(t*.2)*.05,camY,camZ);st.cam.lookAt(camX,camY-.02,0);
  // states: each one arrives, then passes
  st.forms.userData.seq(pf,[[0,0],[.13,1,.045],[.22,2,.045],[.31,3,.045],[.39,4,.045],[.47,5,.045]],.045);
  var fm=st.forms.material.uniforms;fm.uT.value=t;fm.uAl.value=ss(0,.04,pf)*(1-ss(.5,.58,pf));
  // thread closes into a circle at the mudrā's fingertips
  var MC=new T.Vector3(mx-.469,TY+.1-.44,0.01);var tm=st.threadMat.uniforms;tm.uT.value=t;tm.uK.value=e(ss(.62,.72,pf));tm.uC.value.copy(MC);tm.uA.value=ss(0,.03,pf)*(1-fin);
  var meX=L(cx,MC.x,close),meY=L(TY+.09,MC.y,close);st.me.position.set(meX,meY,.1);st.me.scale.setScalar((.22+.1*ss(.54,.62,pf)-.12*close)*(1+.06*Math.sin(t*2.4)));st.me.material.opacity=ss(0,.04,pf)*(1-fin);
  st.meHalo.position.copy(st.me.position);st.meHalo.scale.setScalar(.8+.9*ss(.54,.62,pf)-.9*close);st.meHalo.material.opacity=(.35+.4*ss(.54,.62,pf))*ss(0,.04,pf)*(1-fin);
  st.mudra.position.set(mx,TY+.1,0);var md=ss(.68,.8,pf);st.mudra.userData.draw(md,{x:156,y:350,r:50,a:ss(.76,.82,pf)});st.mudra.visible=md>0;st.mudra.material.opacity=1-fin;
  st.art.position.set(mx,TY+.25+.95+.31,.4);var dA=ss(.86,.97,pf);st.art.userData.draw(dA,{x:206,y:384,r:40,a:ss(.92,.99,pf)});st.art.visible=dA>0;
  st.mand.position.set(mx,TY+1.5,-1.2);st.mand.rotation.z=t*.02;st.mand.material.opacity=.22*fin;
  st.motes.material.uniforms.uT.value=t;var bgU=st.bg.material.uniforms;bgU.uG.value.setRGB(.5,.3,.12);bgU.uGs.value=.18+.2*close;bgU.uGy.value=.4;}
});
