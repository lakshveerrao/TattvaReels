/* Tattva 6 film: the eclipse. Rāhu covers the sun, yet the sun is untouched; in deep sleep the senses fold into the heart
   and only being remains; on waking, "I slept". */
FILMS[6]=KIT.film({hold:[.26,.78],poster:.24,
 labels:[{p:.03,dev:'दिवाकर',en:'the sun'},{p:.12,dev:'राहुग्रस्त',en:'seized by Rāhu'},{p:.21,dev:'मायासमाच्छादनात्',en:'covered by māyā'},{p:.32,dev:'सुषुप्तः',en:'in deep sleep'},{p:.42,dev:'सन्मात्रः',en:'pure being remains'},{p:.53,dev:'प्रबोधसमये',en:'on waking'},{p:.64,dev:'प्रागस्वाप्सम्',en:'"I was asleep"'},{p:.82,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP,r=K.rng(606);
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x1a0f2a,0x050309);scene.add(st.bg);
  st.motes=K.motes(220,[3.6,4.6,2],18);scene.add(st.motes);
  var SY=.42,R=.34;st.SY=SY;st.R=R;
  st.sunMat=new T.ShaderMaterial(K.add({uniforms:{uF:{value:1},uR:{value:R/4},uO:{value:-1},uT:{value:0},uDay:{value:1}},
   vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uR,uO,uT,uDay,uF;varying vec2 vP;'+
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}'+
    'void main(){vec2 p=vP;float d=length(p);vec2 oc=vec2(uO*uR*2.3,uR*.12*uO);float od=length(p-oc);float occ=smoothstep(uR*1.005,uR*.985,od)*smoothstep(1.,.75,abs(uO));'+
    'float disc=smoothstep(uR,uR*.98,d);float limb=sqrt(max(0.,1.-pow(d/uR,2.)));vec3 sun=mix(vec3(1.,.45,.12),vec3(1.,.95,.75),limb)*(.85+.15*n(p*40.+uT*.3));'+
    'float vis=1.-smoothstep(uR*1.6,0.,length(oc));vec2 u=p/max(d,1e-4);float str=pow(n(u*3.+vec2(uT*.05,0.)+7.)*.6+n(u*8.+vec2(0.,uT*.08)+3.)*.4,2.);'+
    'float cor=exp(-(d-uR)/(uR*(.35+.9*str)))*step(uR,d);vec3 corC=vec3(1.,.85,.65)*cor*(.25+1.1*(1.-vis));'+
    'float glare=exp(-(d-uR)/(uR*.5))*step(uR,d)*vis*uDay;'+
    'vec3 c=sun*disc*(1.-occ)+corC*(1.-occ*step(od,uR))+vec3(1.,.6,.25)*glare*.8;'+
    'float edge=smoothstep(.02*uR,0.,abs(od-uR))*disc*(1.-vis)*.0;'+
    'gl_FragColor=vec4(c*smoothstep(.8,.45,d)*uF,1.);}'}));
  st.sun=new T.Mesh(new T.PlaneGeometry(1.6,1.6),st.sunMat);st.sun.scale.setScalar(4);st.sun.position.set(0,SY,-.01);st.sun.renderOrder=1;scene.add(st.sun);
  st.ring=K.sprite('rgba(255,255,250,1)','rgba(255,220,160,.7)',{opacity:0});st.ring.renderOrder=3;scene.add(st.ring);
  st.rahu=K.sprite('rgba(120,60,160,.35)','rgba(60,20,90,.15)',{opacity:0});st.rahu.renderOrder=2;scene.add(st.rahu);
  // the sleeper, who later sits up
  var BY=-.92;st.BY=BY;
  function lying(g,w,h){g.beginPath();g.ellipse(w*.13,h*.47,w*.065,h*.1,0,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(w*.1,h*.53,w*.06,h*.03,0,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.24,h*.44);g.bezierCurveTo(w*.4,h*.36,w*.62,h*.38,w*.7,h*.44);g.bezierCurveTo(w*.84,h*.46,w*.94,h*.5,w*.95,h*.56);g.bezierCurveTo(w*.8,h*.6,w*.4,h*.62,w*.24,h*.58);g.closePath();g.fill();}
  function sitting(g,w,h){g.beginPath();g.arc(w*.5,h*.17,w*.08,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.5,h*.27);g.bezierCurveTo(w*.66,h*.28,w*.7,h*.36,w*.68,h*.6);g.bezierCurveTo(w*.84,h*.66,w*.92,h*.74,w*.9,h*.82);g.bezierCurveTo(w*.8,h*.9,w*.2,h*.9,w*.1,h*.82);g.bezierCurveTo(w*.08,h*.74,w*.16,h*.66,w*.32,h*.6);g.bezierCurveTo(w*.3,h*.36,w*.34,h*.28,w*.5,h*.27);g.fill();}
  var Ly=K.off(K.shape(lying,NP,1.6,61),0,BY,0),Si=K.off(K.shape(sitting,NP,1.2,62),0,BY+.3,0);
  st.HEART=new T.Vector3(.02,BY+.02,.15);st.HEARTS=new T.Vector3(0,BY+.32,.15);st.HEADL=new T.Vector3(-.54,BY+.0,.15);st.HEADS=new T.Vector3(0,BY+.55,.15);
  st.body=K.morph([Ly,Si],[new T.Color(.75,.6,.95),new T.Color(1,.8,.5)],{size:.75,swirl:.2,seed:63,jitter:.006});scene.add(st.body);
  st.mat=new T.Mesh(new T.PlaneGeometry(1.9,.05),new T.MeshBasicMaterial(K.add({color:0x6a4a9a,opacity:.5})));st.mat.position.set(0,BY-.12,0);scene.add(st.mat);
  // senses: lights that withdraw into the heart in sleep and fly back out on waking
  st.sense=[[-.6,.03],[-.5,.03],[-.56,-.04],[.3,-.05],[.9,-.04],[-.2,-.06]].map(function(q){var s=K.sprite('rgba(255,250,235,1)','rgba(160,210,255,.55)',{opacity:0});s.userData.l=new T.Vector3(q[0],BY+q[1],.15);s.renderOrder=6;scene.add(s);return s;});
  st.sOut=[[-.04,.57],[.04,.57],[0,.5],[.3,.25],[-.3,.25],[0,.44]];
  st.core=K.sprite('rgba(255,250,240,1)','rgba(255,200,120,.6)',{opacity:0});st.core.renderOrder=7;scene.add(st.core);
  st.zz=K.sprite('rgba(200,170,255,.6)','rgba(120,80,200,.2)',{opacity:0});st.zz.renderOrder=5;scene.add(st.zz);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=10;scene.add(st.art);
  st.mand=K.mandala();st.mand.position.set(0,.6,-1.4);st.mand.material.opacity=0;scene.add(st.mand);
  return st;},
 render:function(st,pf,t,h){var K=KIT,T=K.T,ss=K.ss,e=K.eio,L=K.lerp;
  var cover=e(ss(.08,.22,pf)),uncover=e(ss(.53,.6,pf)),total=cover*(1-uncover),fin=ss(.8,.9,pf);
  var sleep=ss(.28,.4,pf),wake=ss(.54,.64,pf);
  // camera: start on the sun, tilt down to hold the sun and the sleeper together
  var down=e(ss(.24,.34,pf));st.cam.position.set(0,L(.42,-.12,down)+.25*fin,L(3.3,5.4,down)-.1*fin);st.cam.lookAt(0,L(.42,-.12,down)+.25*fin,0);
  // sun and Rāhu
  var o=cover<1?-(1-cover):uncover;st.sunMat.uniforms.uO.value=o;st.sunMat.uniforms.uT.value=t;st.sunMat.uniforms.uDay.value=1-total*.9;
  st.sun.material.opacity=1;st.sun.visible=fin<1;var sunA=1-fin;st.sunMat.uniforms.uDay.value*=sunA;st.sunMat.uniforms.uF.value=sunA;
  var dia=Math.exp(-Math.pow((pf-.535)/.012,2))+.6*Math.exp(-Math.pow((pf-.215)/.01,2));st.ring.position.set(st.R*.92,st.SY+st.R*.2,.05);st.ring.scale.setScalar(.25+1.3*dia);st.ring.material.opacity=dia;
  st.rahu.position.set(o*st.R*2.3,st.SY+st.R*.12*o,.04);st.rahu.scale.setScalar(st.R*3.2);st.rahu.material.opacity=.6*ss(.06,.14,pf)*(1-ss(.55,.59,pf));
  // sky darkens in the eclipse
  var bgU=st.bg.material.uniforms;bgU.uA.value.setRGB(L(.33,.06,total),L(.17,.035,total),L(.15,.1,total));bgU.uB.value.setRGB(L(.12,.02,total),L(.06,.012,total),L(.08,.035,total));
  bgU.uG.value.setRGB(1,.55,.2);bgU.uGs.value=(.5*(1-total)+.1)*(1-fin);bgU.uGy.value=.72;
  if(fin>0){bgU.uA.value.lerp(new T.Color(0x0b0717),fin);bgU.uB.value.lerp(new T.Color(0x030207),fin);}
  // sleeper
  st.body.userData.seq(pf,[[0,0],[.62,1,.06]],.06);var bm=st.body.material.uniforms;bm.uT.value=t;bm.uAl.value=ss(.27,.33,pf)*(1-.45*sleep*(1-wake))*(1-fin);
  st.mat.material.opacity=.4*ss(.27,.33,pf)*(1-fin);
  var withdraw=ss(.33,.42,pf)*(1-wake),heart=wake>0?st.HEART.clone().lerp(st.HEARTS,wake):st.HEART;
  st.sense.forEach(function(s,k){var out=new T.Vector3(st.sOut[k][0],st.BY+.22+st.sOut[k][1]-.22,.15);var home=s.userData.l.clone().lerp(new T.Vector3(st.sOut[k][0],st.BY+st.sOut[k][1],.15),wake);
   s.position.copy(home.lerp(heart,withdraw));s.scale.setScalar(.07);s.material.opacity=ss(.24,.3,pf)*(1-withdraw*.85)*(1-fin)*(.75+.25*Math.sin(t*3+k));});
  st.core.position.copy(heart);st.core.scale.setScalar((.12+.32*withdraw)*(1+.08*Math.sin(t*1.5)));st.core.material.opacity=(.25*ss(.25,.32,pf)+.75*withdraw)*(1-fin)+.0;
  var hd=st.HEADL.clone().lerp(st.HEADS,wake);st.zz.position.copy(hd);st.zz.scale.setScalar(.5);st.zz.material.opacity=ss(.62,.66,pf)*(1-ss(.76,.8,pf))*(.7+.3*Math.sin(t*4));
  st.motes.material.uniforms.uT.value=t;st.motes.material.uniforms.uA.value=.25+.4*total;
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.22*fin;
  var dA=ss(.84,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.9,.99,pf)});st.art.visible=dA>0;
  if(fin>0){st.core.position.set(0,L(heart.y,.44,e(fin)),.5);st.core.scale.setScalar(.6);st.core.material.opacity=.9;}}
});
