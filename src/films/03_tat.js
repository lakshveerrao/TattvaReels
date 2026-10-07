/* Tattva 3 film: that you are. One light of being shines through every passing form; it is pointed out as you; the ocean of becoming falls still. */
FILMS[3]=KIT.film({hold:[.28,.76],poster:.5,
 labels:[{p:.03,dev:'स्फुरणं',en:'his shining'},{p:.13,dev:'सदात्मकम्',en:'is existence itself'},{p:.24,dev:'असत्',en:'forms that pass'},{p:.36,dev:'तत्',en:'that'},{p:.44,dev:'त्वम्',en:'you'},{p:.51,dev:'असि',en:'are'},{p:.62,dev:'न पुनरावृत्तिः',en:'no return'},{p:.8,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP;
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x0c0717,0x030207);scene.add(st.bg);
  st.mand=K.mandala();st.mand.position.set(0,.45,-1.4);scene.add(st.mand);
  st.motes=K.motes(200,[3.2,4.4,2],8);scene.add(st.motes);
  var W=1.5,Y=-.38;
  function pot(g,w,h){g.beginPath();g.ellipse(w/2,h*.62,w*.33,h*.27,0,0,Math.PI*2);g.fill();g.fillRect(w*.38,h*.2,w*.24,h*.2);g.beginPath();g.ellipse(w/2,h*.2,w*.17,h*.045,0,0,Math.PI*2);g.fill();}
  function tree(g,w,h){g.fillRect(w*.46,h*.5,w*.08,h*.42);[[.5,.3,.2],[.32,.42,.15],[.68,.42,.15],[.4,.22,.13],[.6,.22,.13],[.5,.48,.14]].forEach(function(c){g.beginPath();g.arc(w*c[0],h*c[1],w*c[2],0,Math.PI*2);g.fill();});g.fillRect(w*.2,h*.9,w*.6,h*.03);}
  function mount(g,w,h){g.beginPath();g.moveTo(w*.02,h*.9);g.lineTo(w*.36,h*.22);g.lineTo(w*.5,h*.45);g.lineTo(w*.66,h*.12);g.lineTo(w*.98,h*.9);g.closePath();g.fill();}
  function person(g,w,h){g.beginPath();g.arc(w*.5,h*.17,w*.075,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(w*.5,h*.27);g.bezierCurveTo(w*.66,h*.28,w*.7,h*.36,w*.68,h*.6);g.bezierCurveTo(w*.84,h*.66,w*.92,h*.74,w*.9,h*.82);g.bezierCurveTo(w*.8,h*.9,w*.2,h*.9,w*.1,h*.82);g.bezierCurveTo(w*.08,h*.74,w*.16,h*.66,w*.32,h*.6);g.bezierCurveTo(w*.3,h*.36,w*.34,h*.28,w*.5,h*.27);g.fill();}
  var A=K.shape(pot,NP,W*.9,1),B=K.shape(tree,NP,W,2),C=K.shape(mount,NP,W*1.15,3),P=K.shape(person,NP,W*1.05,4);
  [A,B,C,P].forEach(function(a){K.off(a,0,Y,0);});
  st.OY=.5;var halo=K.cloud(NP,function(r){var a=r()*Math.PI*2,rr=.16+Math.pow(r(),2)*.5;return[Math.cos(a)*rr,st.OY+Math.sin(a)*rr,(r()-.5)*.1];},5);
  st.HY=Y+.08;var heart=K.cloud(NP,function(r){var a=r()*Math.PI*2,rr=Math.pow(r(),1.5)*.2;return[Math.cos(a)*rr,st.HY+Math.sin(a)*rr,.1];},6);
  st.forms=K.morph([A,B,C,halo,P,heart],[new T.Color(1,.75,.42),new T.Color(.9,.85,.5),new T.Color(1,.78,.55),new T.Color(1,.92,.7),new T.Color(1,.8,.5),new T.Color(1,.95,.8)],{size:.95,swirl:.32,seed:31});
  scene.add(st.forms);
  // the light of being: core, halo and slowly turning rays
  st.core=K.sprite('rgba(255,252,240,1)','rgba(255,200,110,.6)');st.core.renderOrder=5;scene.add(st.core);
  st.aura=K.sprite('rgba(255,220,150,.5)','rgba(200,120,40,.18)');st.aura.renderOrder=4;scene.add(st.aura);
  var rp=[];for(var i=0;i<48;i++){var a=i/48*Math.PI*2,l=i%2?.55:.9;rp.push(Math.cos(a)*.14,Math.sin(a)*.14,0,Math.cos(a)*l,Math.sin(a)*l,0);}
  var rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));
  st.rays=new T.LineSegments(rg,new T.ShaderMaterial(K.add({uniforms:{uA:{value:0}},vertexShader:'varying float vD;void main(){vD=length(position.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uA;varying float vD;void main(){gl_FragColor=vec4(vec3(1.,.8,.45)*uA*smoothstep(.9,.15,vD),1.);}'})));st.rays.renderOrder=3;scene.add(st.rays);
  // the beam that points: "that" is "you"
  st.beam=new T.Mesh(new T.PlaneGeometry(.09,1),new T.ShaderMaterial(K.add({uniforms:{uA:{value:0},uT:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uA,uT;varying vec2 vUv;void main(){float x=1.-abs(vUv.x-.5)*2.;float f=pow(x,3.)*(.7+.3*sin(vUv.y*40.-uT*8.));gl_FragColor=vec4(vec3(1.,.85,.55)*f*uA,1.);}'})));st.beam.renderOrder=4;scene.add(st.beam);
  // the ocean of becoming: a field of points that heaves, then falls still and mirrors the light
  var op=[];for(var z=0;z<44;z++)for(var x=0;x<60;x++)op.push((x/59-.5)*5.2,0,-z*.11+.6);
  var og=new T.BufferGeometry();og.setAttribute('position',new T.Float32BufferAttribute(op,3));
  st.sea=new T.Points(og,new T.ShaderMaterial(K.add({uniforms:{uT:{value:0},uAmp:{value:1},uA:{value:0},uPx:{value:K.S},uL:{value:new T.Vector2(0,-2)}},
   vertexShader:'uniform float uT,uAmp,uPx;uniform vec2 uL;varying float vA;void main(){vec3 p=position;float w=sin(p.x*2.1+uT*1.7)*.5+sin(p.z*3.3-uT*2.3+p.x)*.35+sin((p.x+p.z)*5.-uT*3.)*.15;p.y+=w*.16*uAmp;vec4 mv=modelViewMatrix*vec4(p,1.);float glint=exp(-pow(p.x-uL.x,2.)*3.)*(.4+.6*(1.-uAmp));vA=(.25+.75*glint)*smoothstep(-4.8,-1.,p.z);gl_PointSize=(1.4+1.5*glint)*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.78,.45)*smoothstep(.5,0.,d)*vA*uA*1.7,1.);}'})));
  st.sea.position.y=-1.25;st.sea.frustumCulled=false;scene.add(st.sea);
  st.refl=K.sprite('rgba(255,230,170,.7)','rgba(200,130,50,.25)');st.refl.scale.set(.5,1.2,1);st.refl.renderOrder=2;scene.add(st.refl);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=8;scene.add(st.art);
  return st;},
 render:function(st,pf,t,h){var K=KIT,ss=K.ss,e=K.eio,L=K.lerp;
  var fin=ss(.8,.9,pf),sea=ss(.6,.66,pf)*(1-ss(.78,.84,pf));
  st.cam.position.set(Math.sin(t*.15)*.1,L(.05,-.25,sea)+.2*fin,5.2-.4*ss(.36,.56,pf)+.3*fin);st.cam.lookAt(0,L(.05,-.35,sea)+.2*fin,0);
  // forms: pot, tree, mountain each glowing with the same light; then they dissolve into it; then a person
  st.forms.userData.seq(pf,[[0,0],[.1,1,.06],[.18,2,.06],[.29,3,.07],[.43,4,.09],[.82,5,.05]],.06);
  var fm=st.forms.material.uniforms;fm.uT.value=t;fm.uAl.value=ss(0,.04,pf)*(1-fin)*(1-.35*ss(.66,.74,pf));fm.uC4.value.setRGB(1,L(.8,.92,ss(.56,.62,pf)),L(.5,.7,ss(.56,.62,pf)));fm.uSz.value=.95+.25*ss(.56,.62,pf);
  var oy=L(st.OY,st.HY,e(ss(.52,.6,pf)));
  var rad=.8+.2*Math.sin(t*1.6);st.core.position.set(0,oy,.2);st.core.scale.setScalar((.38+.12*ss(.22,.3,pf)*(1-ss(.5,.56,pf))+.25*ss(.58,.62,pf))*rad*(1-fin*.6));st.core.material.opacity=ss(0,.05,pf)*(1-fin*.8);
  st.aura.position.set(0,oy,.15);st.aura.scale.setScalar(2.2+.6*ss(.22,.3,pf)-.8*ss(.52,.6,pf));st.aura.material.opacity=.5*ss(0,.06,pf)*(1-fin);
  st.rays.position.set(0,oy,.1);st.rays.rotation.z=t*.06;st.rays.material.uniforms.uA.value=.5*ss(.1,.2,pf)*(1-ss(.5,.56,pf));st.rays.scale.setScalar(1+.15*Math.sin(t));
  var bm=ss(.45,.5,pf)*(1-ss(.56,.6,pf)),y0=st.HY,y1=st.OY;st.beam.position.set(0,(y0+y1)/2,.12);st.beam.scale.set(1,(y1-y0)*ss(.45,.5,pf),1);st.beam.material.uniforms.uA.value=bm;st.beam.material.uniforms.uT.value=t;
  // the sea
  var su=st.sea.material.uniforms;su.uT.value=t;su.uA.value=sea;su.uAmp.value=1-ss(.66,.74,pf);
  st.refl.position.set(0,-1.45,.4);st.refl.material.opacity=sea*ss(.68,.76,pf)*.8;
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.05+.04*Math.sin(t*.8)+.2*fin;st.mand.position.y=L(.45,.66,fin);
  st.motes.material.uniforms.uT.value=t;st.bg.material.uniforms.uG.value.setRGB(.55,.32,.12);st.bg.material.uniforms.uGs.value=.35*(1-fin)+.15*fin;st.bg.material.uniforms.uGy.value=L(.62,.42,ss(.52,.6,pf));
  var dA=ss(.84,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.9,.99,pf)});st.art.visible=dA>0;
  if(fin>0){st.core.position.set(0,L(oy,.44,e(fin)),.5);st.core.scale.setScalar(L(.5,.7,fin));st.core.material.opacity=.9;}}
});
