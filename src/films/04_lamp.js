/* Tattva 4 film: the lamp in the pot. One flame inside a pot with many holes; its light streams out through the senses,
   and the world is lit only where that light falls. */
FILMS[4]=KIT.film({hold:[.28,.78],poster:.48,
 labels:[{p:.03,dev:'नानाच्छिद्र',en:'many holes'},{p:.12,dev:'घटोदरस्थित',en:'inside a pot'},{p:.2,dev:'महादीप',en:'a great lamp'},{p:.3,dev:'चक्षुरादि',en:'through eyes and senses'},{p:.4,dev:'बहिः स्पन्दते',en:'it streams outward'},{p:.53,dev:'जानामि',en:'"I know"'},{p:.63,dev:'अनुभाति',en:'all shines after it'},{p:.82,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,st={},NP=K.NP,r=K.rng(404);
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x0b0716,0x030206);scene.add(st.bg);
  st.mand=K.mandala();st.mand.position.set(0,.5,-1.6);scene.add(st.mand);
  st.motes=K.motes(160,[3.4,4.4,2],12);scene.add(st.motes);
  var PY=-.42;st.PY=PY;
  // the pot: lathe body; translucent when we look inside
  var prof=[];for(var i=0;i<=40;i++){var s=i/40,y=s*1.02-.5,rr;if(s<.08)rr=.18+s*2.2;else if(s<.72){var u=(s-.08)/.64;rr=.36+.16*Math.sin(u*Math.PI)*1.15;}else if(s<.88)rr=K.lerp(.33,.17,(s-.72)/.16);else rr=.17+(s-.88)*.9;prof.push(new T.Vector2(rr,y));}
  st.potMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,uniforms:{uX:{value:0},uA:{value:1},uL:{value:0}},
   vertexShader:'varying vec3 vN,vV,vP;void main(){vN=normalize(normalMatrix*normal);vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uX,uA,uL;varying vec3 vN,vV,vP;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);vec3 clay=mix(vec3(.07,.03,.015),vec3(.2,.09,.04),.5+.5*vN.y);clay+=vec3(1.,.6,.25)*f*(.18+.4*uL);float band=smoothstep(.012,0.,abs(fract(vP.y*6.)-.5)-.47)*.25;clay+=vec3(.9,.6,.3)*band;clay+=vec3(1.,.55,.2)*uL*.18*(1.-f);float a=mix(1.,.12+f*.65,uX)*uA;gl_FragColor=vec4(clay,a);}'});
  var lgeo=new T.LatheGeometry(prof,64);st.pot=new T.Mesh(lgeo,st.potMat);st.pot.position.y=PY;st.pot.rotation.y=Math.PI;st.pot.renderOrder=3;scene.add(st.pot);
  st.potIn=new T.Mesh(lgeo,new T.MeshBasicMaterial({color:0x1a0b05,transparent:true,depthWrite:false,side:T.BackSide}));st.potIn.position.y=PY;st.potIn.renderOrder=1;scene.add(st.potIn);
  // holes and beams: each hole sits on the pot surface; the beam leaves along the line from the flame through the hole
  var FL=new T.Vector3(0,PY-.08,0);st.FL=FL;
  var holes=[[-.15,.05],[.28,-.1],[.62,.12],[1.02,-.06],[1.4,.08],[1.85,-.12],[2.3,.02],[2.7,-.1],[3.2,.1],[3.7,-.05],[4.3,.06],[4.9,-.08],[5.5,.12],[5.95,-.02]];
  st.holes=[];st.beams=[];var dirs=[];
  var beamGeo=new T.CylinderGeometry(.02,.2,1,28,1,true);beamGeo.translate(0,.5,0);
  function surf(a,y){var rr=.36+.16*Math.sin(((y+.5)/1.02-.08)/.64*Math.PI)*1.15;return new T.Vector3(Math.sin(a)*rr,PY+y,Math.cos(a)*rr);}
  holes.forEach(function(hh){var pos=surf(hh[0],hh[1]);var sp=K.sprite('rgba(255,245,220,1)','rgba(255,180,80,.6)',{opacity:0});sp.position.copy(pos);sp.scale.setScalar(.09);sp.renderOrder=6;scene.add(sp);st.holes.push(sp);});
  [[118,.14],[168,0],[218,-.2],[322,-.2],[12,0],[62,.14]].forEach(function(b,k){var ang=b[0]*Math.PI/180,d=new T.Vector3(Math.cos(ang),Math.sin(ang)*.85,.35).normalize();
   var pos=new T.Vector3(d.x*.4,PY+b[1],d.z*.4+.18);var sp=K.sprite('rgba(255,250,235,1)','rgba(255,190,90,.7)',{opacity:0});sp.position.copy(pos);sp.scale.setScalar(.1);sp.renderOrder=6;scene.add(sp);st.holes.push(sp);
   var m=new T.Mesh(beamGeo,new T.ShaderMaterial(K.add({side:T.DoubleSide,uniforms:{uA:{value:0},uT:{value:0}},
    vertexShader:'varying vec2 vUv;varying float vF;void main(){vUv=uv;vec3 n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vF=abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uA,uT;varying vec2 vUv;varying float vF;void main(){float f=pow(1.-vUv.y,1.6)*pow(vF,1.5)*(.85+.15*sin(vUv.y*12.-uT*3.));gl_FragColor=vec4(vec3(1.,.8,.48)*f*uA*.32,1.);}'})));
   m.position.copy(pos);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);m.renderOrder=4;scene.add(m);st.beams.push(m);dirs.push(pos.clone(),d.clone());});
  // the flame and its little lamp
  st.flame=K.sprite('rgba(255,250,235,1)','rgba(255,170,60,.65)');st.flame.renderOrder=7;scene.add(st.flame);
  st.flameCore=K.sprite('rgba(255,255,250,1)','rgba(255,230,170,.8)');st.flameCore.renderOrder=8;scene.add(st.flameCore);
  st.diya=new T.Mesh(new T.SphereGeometry(.07,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2),new T.MeshBasicMaterial({color:0x2a1408,transparent:true,depthWrite:false}));st.diya.scale.set(1.3,.6,1.3);st.diya.position.set(0,PY-.12,0);st.diya.renderOrder=6;scene.add(st.diya);
  // the world outside: forms that exist in the dark but are seen only where the light lands
  function tree(g,w,h){g.fillRect(w*.46,h*.5,w*.08,h*.42);[[.5,.32,.2],[.32,.44,.14],[.68,.44,.14],[.5,.5,.14]].forEach(function(c){g.beginPath();g.arc(w*c[0],h*c[1],w*c[2],0,Math.PI*2);g.fill();});}
  function bird(g,w,h){g.beginPath();g.moveTo(w*.05,h*.45);g.quadraticCurveTo(w*.3,h*.2,w*.5,h*.5);g.quadraticCurveTo(w*.7,h*.2,w*.95,h*.45);g.quadraticCurveTo(w*.7,h*.35,w*.5,h*.62);g.quadraticCurveTo(w*.3,h*.35,w*.05,h*.45);g.fill();}
  function flower(g,w,h){for(var i=0;i<8;i++){g.save();g.translate(w/2,h/2);g.rotate(i*Math.PI/4);g.beginPath();g.ellipse(0,-h*.24,w*.09,h*.2,0,0,Math.PI*2);g.fill();g.restore();}}
  function hill(g,w,h){g.beginPath();g.moveTo(0,h*.85);g.quadraticCurveTo(w*.3,h*.2,w*.55,h*.6);g.quadraticCurveTo(w*.75,h*.35,w,h*.85);g.fill();}
  function rings(g,w,h){g.lineWidth=w*.03;for(var i=1;i<5;i++){g.beginPath();g.arc(w/2,h/2,w*.11*i,-.9,.9);g.stroke();}}
  function face(g,w,h){g.beginPath();g.arc(w*.5,h*.5,w*.36,0,Math.PI*2);g.lineWidth=w*.05;g.stroke();g.beginPath();g.arc(w*.36,h*.42,w*.05,0,7);g.arc(w*.64,h*.42,w*.05,0,7);g.fill();g.beginPath();g.arc(w*.5,h*.55,w*.17,.3,2.84);g.stroke();}
  var forms=[tree,bird,flower,hill,rings,face],pts=new Float32Array(NP*3),per=Math.floor(NP*.8/dirs.length/2*2);var n=0;
  for(var b=0;b<dirs.length/2&&b<forms.length;b++){var o=dirs[b*2],d=dirs[b*2+1],dist=.5+r()*.08,c=o.clone().add(d.clone().multiplyScalar(dist));var sp2=K.shape(forms[b],per,.52,40+b);
   for(i=0;i<per&&n<NP;i++,n++){pts[n*3]=c.x+sp2[i*3];pts[n*3+1]=c.y+sp2[i*3+1];pts[n*3+2]=c.z+sp2[i*3+2];}}
  for(;n<NP;n++){var a3=r()*Math.PI*2,rr3=.8+r()*1.6;pts[n*3]=Math.cos(a3)*rr3;pts[n*3+1]=PY+.2+Math.sin(a3)*rr3*1.1;pts[n*3+2]=(r()-.5)*.8;}
  var bd=[];for(i=0;i<6;i++){var j=Math.min(i,dirs.length/2-1);bd.push(dirs[j*2],dirs[j*2+1]);}
  var wg=new T.BufferGeometry();wg.setAttribute('position',new T.BufferAttribute(pts,3));var sd=new Float32Array(NP);for(i=0;i<NP;i++)sd[i]=r();wg.setAttribute('aS',new T.BufferAttribute(sd,1));
  var u={uT:{value:0},uPx:{value:K.S},uReach:{value:0},uAll:{value:0},uAl:{value:1}};for(i=0;i<6;i++){u['uO'+i]={value:bd[i*2]};u['uD'+i]={value:bd[i*2+1]};}
  st.worldMat=new T.ShaderMaterial(K.add({uniforms:u,
   vertexShader:'attribute float aS;uniform float uT,uPx,uReach,uAll;uniform vec3 uO0,uO1,uO2,uO3,uO4,uO5,uD0,uD1,uD2,uD3,uD4,uD5;varying float vL;varying float vS;'+
    'float lit(vec3 p,vec3 o,vec3 d){vec3 q=p-o;float al=dot(q,d);float pe=length(q-d*al);return step(0.,al)*smoothstep(.06+al*.36,al*.2,pe)*smoothstep(uReach,uReach-.4,al);}'+
    'void main(){vec3 p=position;p+=vec3(sin(uT*.6+aS*30.),cos(uT*.5+aS*20.),0.)*.01;float l=max(max(max(lit(p,uO0,uD0),lit(p,uO1,uD1)),max(lit(p,uO2,uD2),lit(p,uO3,uD3))),max(lit(p,uO4,uD4),lit(p,uO5,uD5)));vL=max(l,uAll*(.55+.45*aS));vS=aS;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.2+1.4*vL+.6*aS)*uPx*5./-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uAl;varying float vL,vS;void main(){float d=length(gl_PointCoord-.5);vec3 c=mix(vec3(.16,.12,.2),mix(vec3(1.,.8,.5),vec3(1.,.95,.8),vS),vL);float a=smoothstep(.5,0.,d)*(.12+.88*vL)*uAl;gl_FragColor=vec4(c*a,1.);}'}));
  st.world=new T.Points(wg,st.worldMat);st.world.frustumCulled=false;st.world.renderOrder=2;scene.add(st.world);
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=9;scene.add(st.art);
  return st;},
 render:function(st,pf,t,h){var K=KIT,ss=K.ss,e=K.eio,L=K.lerp,PY=st.PY;
  var xr=ss(.12,.2,pf),lamp=ss(.17,.24,pf),beam=ss(.28,.45,pf),inF=e(ss(.5,.58,pf))*(1-e(ss(.62,.7,pf))),all=ss(.62,.72,pf),potGone=ss(.68,.78,pf),fin=ss(.8,.9,pf);
  // camera: slow orbit, a push into the flame at "I know", then back out
  var orb=Math.sin(t*.1)*.25*(1-fin);st.cam.position.set(Math.sin(orb)*L(5.4,2.5,inF),L(.05,PY+.02,inF)+.15*fin,Math.cos(orb)*L(5.4,2.5,inF)+.4*fin);st.cam.lookAt(0,L(.0,PY-.06,inF)+.15*fin,0);
  st.potMat.uniforms.uX.value=xr;st.potMat.uniforms.uL.value=lamp;st.potMat.uniforms.uA.value=(1-potGone)*(1-.55*inF);st.potIn.material.opacity=(1-xr*.7)*(1-potGone);
  var fl=1+.08*Math.sin(t*9)+.05*Math.sin(t*23);st.flame.position.set(0,PY-.03,0);st.flame.scale.set(.2*fl*(1+inF*.6),.36*fl*(1+inF*.6),1);st.flame.material.opacity=lamp*(1-fin*.5);
  st.flameCore.position.set(0,PY-.06,0);st.flameCore.scale.set(.06*fl,.13*fl,1);st.flameCore.material.opacity=lamp;
  st.diya.material.opacity=(.3+.7*xr)*(1-potGone);
  var hl=ss(0,.06,pf)*(.22+.1*Math.sin(t*2))+lamp*.75;st.holes.forEach(function(s,k){s.material.opacity=hl*(1-potGone*.6)*(.7+.3*Math.sin(t*3+k));s.scale.setScalar(.07+.05*lamp);});
  st.beams.forEach(function(m,k){var g=ss(.28+k*.02,.4+k*.02,pf);m.scale.set(1+all*.6,(.2+1.9*g)*(1+all*.3),1+all*.6);m.material.uniforms.uA.value=g*(1-fin)*(1-inF*.5)*(1-.6*all);m.material.uniforms.uT.value=t;});
  var wm=st.worldMat.uniforms;wm.uT.value=t;wm.uReach.value=.2+2.6*beam;wm.uAll.value=all*(1-fin*.7);wm.uAl.value=ss(.02,.1,pf)*(1-fin*.85);
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.04+.04*Math.sin(t*.8)+.2*fin;st.mand.position.y=L(.5,.66,fin);
  st.motes.material.uniforms.uT.value=t;st.motes.material.uniforms.uA.value=.3+.3*all;
  st.bg.material.uniforms.uG.value.setRGB(.6,.3,.1);st.bg.material.uniforms.uGs.value=.12+.35*lamp*(1-fin)+.3*all*(1-fin);st.bg.material.uniforms.uGy.value=.4;
  var dA=ss(.84,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.9,.99,pf)});st.art.visible=dA>0;
  if(fin>0){var fy=L(PY-.03,.44,e(fin));st.flame.position.set(0,fy,.5);st.flameCore.position.set(0,fy,.5);st.flame.material.opacity=.95;}}
});
