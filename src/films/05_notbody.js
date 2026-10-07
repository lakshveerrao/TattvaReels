/* Tattva 5 film: not the body. Body, breath, senses, mind and emptiness are each offered as "I", and each falls away;
   what is left is the light that saw them all. */
FILMS[5]=KIT.film({hold:[.5,.78],poster:.36,
 labels:[{p:.03,dev:'देहं',en:'the body?'},{p:.13,dev:'प्राणम्',en:'the breath?'},{p:.23,dev:'इन्द्रियाणि',en:'the senses?'},{p:.33,dev:'चलां बुद्धिं',en:'the restless mind?'},{p:.43,dev:'शून्यं',en:'emptiness?'},{p:.53,dev:'भ्रान्ताः',en:'all mistaken'},{p:.65,dev:'व्यामोहसंहारिणे',en:'the delusion ends'},{p:.82,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP,r=K.rng(505);
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x0b0717,0x030207);scene.add(st.bg);
  st.mand=K.mandala();st.mand.position.set(0,.5,-1.6);scene.add(st.mand);
  st.motes=K.motes(160,[3.4,4.4,2],15);scene.add(st.motes);
  var BY=-.42;st.BY=BY;var HEAD={x:0,y:BY+.78},HEART={x:0,y:BY+.25};st.HEAD=HEAD;st.HEART=HEART;
  function body(g,w,h){g.beginPath();g.arc(w*.5,h*.17,w*.09,0,Math.PI*2);g.fill();g.fillRect(w*.46,h*.24,w*.08,h*.06);g.beginPath();g.moveTo(w*.5,h*.29);g.bezierCurveTo(w*.68,h*.29,w*.73,h*.36,w*.71,h*.6);g.bezierCurveTo(w*.86,h*.65,w*.95,h*.73,w*.93,h*.82);g.bezierCurveTo(w*.82,h*.9,w*.18,h*.9,w*.07,h*.82);g.bezierCurveTo(w*.05,h*.73,w*.14,h*.65,w*.29,h*.6);g.bezierCurveTo(w*.27,h*.36,w*.32,h*.29,w*.5,h*.29);g.fill();}
  var S=1.55,bodyP=K.off(K.shape(body,NP,S,51),0,BY+.18,0);
  var drift=K.cloud(NP,function(r,i){var x=bodyP[i*3],y=bodyP[i*3+1],a=Math.atan2(y-HEART.y,x)+(r()-.5)*.6,d=1.4+r()*1.6;return[x+Math.cos(a)*d,y+Math.sin(a)*d,(r()-.5)*1.5];},52);
  var seen=K.cloud(NP,function(r,i){return[bodyP[i*3]*1.04,bodyP[i*3+1]*1.02,bodyP[i*3+2]-.05];},53);
  st.body=K.morph([bodyP,drift,seen],[new T.Color(1,.78,.48),new T.Color(.7,.5,.4),new T.Color(1,.9,.7)],{size:.85,swirl:.25,seed:54,jitter:.008});scene.add(st.body);
  // outline of the figure, drawn on
  var P=[],bez=K.A.bez,arc=K.A.arc;var ow=512,oh=512,mx=function(x){return x*ow;},my=function(y){return y*oh;};
  P.push(arc(mx(.5),my(.17),mx(.09),0,Math.PI*2,40));
  P.push(bez([mx(.5),my(.29)],[mx(.68),my(.29)],[mx(.73),my(.36)],[mx(.71),my(.6)]).concat(bez([mx(.71),my(.6)],[mx(.86),my(.65)],[mx(.95),my(.73)],[mx(.93),my(.82)])).concat(bez([mx(.93),my(.82)],[mx(.82),my(.9)],[mx(.18),my(.9)],[mx(.07),my(.82)])).concat(bez([mx(.07),my(.82)],[mx(.05),my(.73)],[mx(.14),my(.65)],[mx(.29),my(.6)])).concat(bez([mx(.29),my(.6)],[mx(.27),my(.36)],[mx(.32),my(.29)],[mx(.5),my(.29)])));
  st.outline=K.art(P,ow,oh,S,'rgba(246,213,142,.9)');st.outline.position.set(0,BY+.18,.02);st.outline.renderOrder=3;scene.add(st.outline);
  // breath: particles that circulate in through the nose, down to the belly and out again
  var BN=1400,bp=[],bs=[];for(var i=0;i<BN;i++){bp.push(0,0,0);bs.push(r());}var bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setAttribute('aS',new T.Float32BufferAttribute(bs,1));
  st.breathMat=new T.ShaderMaterial(K.add({uniforms:{uT:{value:0},uA:{value:0},uPx:{value:K.S},uY0:{value:HEAD.y-.07},uY1:{value:BY+.12},uSc:{value:0}},
   vertexShader:'attribute float aS;uniform float uT,uPx,uY0,uY1,uSc;varying float vA;void main(){float ph=fract(aS+uT*.12);float a=ph*6.2832;float side=sin(a);vec3 p=vec3(side*(.2+.04*sin(aS*40.)),mix(uY0,uY1,.5-.5*cos(a)),.14+.1*cos(a+aS*3.));vec3 jr=vec3(fract(sin(aS*127.1)*43758.5),fract(sin(aS*311.7)*24634.6),fract(sin(aS*74.7)*9531.2))-.5;p+=jr*(.16+uSc*3.*aS)+vec3(sin(uT*1.3+aS*50.),cos(uT*1.1+aS*70.),0.)*.02;vA=(.25+.45*sin(ph*3.1416));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(2.2+1.4*aS)*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(.65,.88,1.)*smoothstep(.5,0.,d)*vA*uA,1.);}'}));
  st.breath=new T.Points(bg,st.breathMat);st.breath.frustumCulled=false;st.breath.renderOrder=5;scene.add(st.breath);
  // senses: eyes, ears, nose, tongue, skin
  st.senses=[[-.045,HEAD.y+.01],[.045,HEAD.y+.01],[-.14,HEAD.y],[.14,HEAD.y],[0,HEAD.y-.06],[0,HEAD.y-.1],[.4,BY+.12]].map(function(q){var s=K.sprite('rgba(255,250,235,1)','rgba(120,200,255,.55)',{opacity:0});s.position.set(q[0],q[1],.15);s.renderOrder=6;scene.add(s);
   var ring=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial(K.add({color:0x9fd8ff,opacity:0,side:T.DoubleSide})));ring.position.copy(s.position);ring.renderOrder=6;scene.add(ring);return{s:s,ring:ring};});
  // mind: thoughts racing round the head
  var MN=700,mp=[],ms=[];for(i=0;i<MN;i++){mp.push(r(),r(),r());ms.push(r());}var mg=new T.BufferGeometry();mg.setAttribute('position',new T.Float32BufferAttribute(mp,3));mg.setAttribute('aS',new T.Float32BufferAttribute(ms,1));
  st.mindMat=new T.ShaderMaterial(K.add({uniforms:{uT:{value:0},uA:{value:0},uPx:{value:K.S},uC:{value:new T.Vector3(HEAD.x,HEAD.y,0)},uOut:{value:0}},
   vertexShader:'attribute float aS;uniform float uT,uPx,uOut;uniform vec3 uC;varying float vA;void main(){vec3 q=position;float sp=1.2+q.x*2.5;float a=uT*sp+aS*20.;float rr=.2+q.y*.2+uOut*(1.5+q.z*2.);float tl=(q.z-.5)*2.4;vec3 p=vec3(cos(a)*rr,sin(a)*rr*sin(tl)*.5,sin(a)*rr*cos(tl));p+=uC+vec3(0.,.05+uOut*.6,0.);vA=.5+.5*sin(uT*3.+aS*30.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.3+aS*1.2)*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(.85,.7,1.)*smoothstep(.5,0.,d)*vA*uA,1.);}'}));
  st.mind=new T.Points(mg,st.mindMat);st.mind.frustumCulled=false;st.mind.renderOrder=6;scene.add(st.mind);
  // emptiness: a dark hole that swallows the light
  st.void=new T.Mesh(new T.CircleGeometry(1,64),new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{uA:{value:0},uT:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uA,uT;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float rim=smoothstep(.75,.95,d)*smoothstep(1.,.95,d);vec3 c=vec3(.02,.01,.04)+vec3(.6,.4,.9)*rim*(.6+.4*sin(uT*3.+atan(vUv.y-.5,vUv.x-.5)*6.));gl_FragColor=vec4(c,uA*(smoothstep(1.,.9,d)));}'}));
  st.void.position.set(0,HEART.y,.2);st.void.renderOrder=7;scene.add(st.void);
  // the witness
  st.wit=K.sprite();st.wit.renderOrder=9;scene.add(st.wit);
  st.witRays=K.sprite('rgba(255,235,190,.35)','rgba(220,150,60,.12)',{opacity:0});st.witRays.renderOrder=8;scene.add(st.witRays);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=10;scene.add(st.art);
  return st;},
 render:function(st,pf,t,h){var K=KIT,ss=K.ss,e=K.eio,L=K.lerp,HEAD=st.HEAD,HEART=st.HEART;
  var fall=ss(.52,.62,pf),wit=ss(.58,.66,pf),fin=ss(.8,.9,pf);
  var foc=[ss(.02,.08,pf),ss(.12,.17,pf),ss(.22,.27,pf),ss(.32,.37,pf),ss(.42,.47,pf)];
  var on=function(k){var n=k<4?foc[k+1]:fall;return foc[k]*(1-.55*n);};
  // camera drifts toward whatever is being offered as "I"
  function fyFix(p){var keys=[[0,0],[.1,0],[.2,-.05],[.3,HEAD.y-.18],[.4,HEAD.y-.08],[.48,HEART.y]],v=0;for(var i=0;i<keys.length;i++){if(p>=keys[i][0]){v=keys[i][1];if(i+1<keys.length)v=L(keys[i][1],keys[i+1][1],ss(keys[i+1][0]-.06,keys[i+1][0],p));}}return v;}
  var back=ss(.5,.62,pf),ky=L(fyFix(pf),0,back),cz=L(L(5.2,4.0,ss(.02,.3,pf)),5.2,back)+.1*fin;
  st.cam.position.set(Math.sin(t*.12)*.08,ky+.12*fin,cz);st.cam.lookAt(0,ky+.12*fin,0);
  // body
  st.body.userData.seq(pf,[[0,0],[.62,1,.1],[.66,2,.05]],.1);
  var bm=st.body.material.uniforms;bm.uT.value=t;bm.uAl.value=(.35+.65*on(0))*ss(0,.05,pf)*(1-fall*.75)*(1-fin);
  if(pf>.62){bm.uA.value=1;bm.uB.value=1;bm.uK.value=0;bm.uAl.value=.22*(1-fin)*wit;}
  st.outline.userData.draw(ss(.02,.1,pf));st.outline.material.opacity=(.5+.5*on(0))*(1-fall);
  // breath
  st.breathMat.uniforms.uT.value=t;st.breathMat.uniforms.uA.value=on(1)*(1-fall)+(fall>0&&fall<1?(1-fall)*.5:0);st.breathMat.uniforms.uSc.value=fall;
  // senses
  st.senses.forEach(function(o,k){var a=on(2)*(1-fall)*(.7+.3*Math.sin(t*4+k));o.s.material.opacity=a;o.s.scale.setScalar(.06+.03*a);var ph=(t*.6+k*.17)%1;o.ring.scale.setScalar(.03+ph*.25);o.ring.material.opacity=a*(1-ph)*.6;});
  // mind
  st.mindMat.uniforms.uT.value=t;st.mindMat.uniforms.uA.value=on(3)*(1-ss(.56,.62,pf));st.mindMat.uniforms.uOut.value=fall;
  // emptiness
  var va=foc[4]*(1-ss(.5,.56,pf));st.void.material.uniforms.uA.value=va;st.void.material.uniforms.uT.value=t;st.void.scale.setScalar(.05+.32*e(foc[4])*(1-ss(.5,.56,pf)));
  // witness
  st.wit.position.set(0,HEART.y,.3);st.wit.scale.setScalar((.15+.55*wit)*(1+.05*Math.sin(t*2.5)));st.wit.material.opacity=Math.max(.12*ss(0,.05,pf)*(1-foc[4]),wit);
  st.witRays.position.copy(st.wit.position);st.witRays.scale.setScalar(.5+2.6*wit);st.witRays.material.opacity=wit*.6*(1-fin);
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.04+.04*Math.sin(t*.8)+.15*wit+.1*fin;st.mand.position.y=L(.5,.66,fin);
  st.motes.material.uniforms.uT.value=t;st.bg.material.uniforms.uG.value.setRGB(.5,.3,.14);st.bg.material.uniforms.uGs.value=.12+.3*wit*(1-fin);st.bg.material.uniforms.uGy.value=.45;
  var dA=ss(.84,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.9,.99,pf)});st.art.visible=dA>0;
  if(fin>0){st.wit.position.set(0,L(HEART.y,.44,e(fin)),.5);st.wit.scale.setScalar(L(.7,.6,fin));st.wit.material.opacity=.9;}}
});
