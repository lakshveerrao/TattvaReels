/* Tattva 2 film: the seed. The whole tree lies folded in a seed; space and time unfold it; the magician folds it back. */
FILMS[2]=KIT.film({hold:[.3,.78],poster:.56,
 labels:[{p:.03,dev:'बीजस्य',en:'of the seed'},{p:.15,dev:'अन्तः अङ्कुरः',en:'the sprout within'},{p:.3,dev:'जगदिदं',en:'this world'},{p:.47,dev:'देशकाल',en:'space and time'},{p:.57,dev:'वैचित्र्य',en:'endless variety'},{p:.67,dev:'मायावी',en:'like a magician'},{p:.75,dev:'स्वेच्छया',en:'by his own will'},{p:.83,dev:'नमः',en:'salutations'}],
 build:function(T){var K=KIT,r=K.rng(42),st={},NP=K.NP;
  var scene=st.scene=new T.Scene();st.cam=K.camera(40,.05,60);
  st.bg=K.bg(0x0d0818,0x040208);scene.add(st.bg);
  st.mand=K.mandala();st.mand.position.set(0,.55,-1.2);scene.add(st.mand);
  st.motes=K.motes(220,[3.2,4.4,2],5);scene.add(st.motes);
  var SY=-1.18;st.SY=SY;
  // ground: a faint disc of soil light, and the deśa grid that unfolds
  var gl=[],gc=[];for(var i=-10;i<=10;i++){gl.push(i*.32,0,-3.2,i*.32,0,3.2,-3.2,0,i*.32,3.2,0,i*.32);}
  var gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(gl,3));
  st.grid=new T.LineSegments(gg,new T.ShaderMaterial(K.add({uniforms:{uR:{value:0},uA:{value:0}},
   vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uR,uA;varying vec3 vP;void main(){float d=length(vP.xz);float a=smoothstep(uR,uR-.6,d)*smoothstep(3.2,1.2,d)*uA;gl_FragColor=vec4(vec3(.9,.65,.3)*a*.55,1.);}'})));
  st.grid.position.y=SY-.02;scene.add(st.grid);
  // kāla: rings of time with tick marks, expanding from the trunk
  st.rings=[];for(i=0;i<4;i++){var rp=[];for(var j=0;j<=128;j++){var a=j/128*Math.PI*2;rp.push(Math.cos(a),0,Math.sin(a));}
   for(j=0;j<24;j++){var a2=j/24*Math.PI*2,l=j%6?1.04:1.09;rp.push(Math.cos(a2),0,Math.sin(a2),Math.cos(a2)*l,0,Math.sin(a2)*l);}
   var rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp.slice(0,129*3),3));
   var ring=new T.Line(rg,new T.LineBasicMaterial(K.add({color:0xf2c26a,opacity:0})));ring.position.y=SY;scene.add(ring);st.rings.push(ring);}
  // the tree: recursive branches with growth times, drawn as lines plus glowing bark points
  var segs=[];(function br(x,y,z,ang,tilt,len,d,t0){var dx=Math.sin(ang)*Math.cos(tilt),dz=Math.sin(ang)*Math.sin(tilt),dy=Math.cos(ang);var x2=x+dx*len,y2=y+dy*len,z2=z+dz*len,t1=t0+.13+.02*d;
   segs.push([x,y,z,x2,y2,z2,t0,t1,d]);if(d>=7)return;var n=d<2?2:(r()<.35?3:2);
   for(var k=0;k<n;k++){var sp=(k-(n-1)/2)*(.55+.2*r())+(r()-.5)*.3;br(x2,y2,z2,ang*.55+sp,tilt+(r()-.5)*1.4,len*(.72+.1*r()),d+1,t1);}})(0,SY,0,0,0,.62,0,0);
  var lp=[],la=[],lt=[];segs.forEach(function(s){lp.push(s[0],s[1],s[2],s[3],s[4],s[5]);la.push(s[0],s[1],s[2],s[0],s[1],s[2]);lt.push(s[6],s[7],s[6],s[7]);});
  var lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));lg.setAttribute('aA',new T.Float32BufferAttribute(la,3));lg.setAttribute('aT',new T.Float32BufferAttribute(lt,2));
  st.treeMat=new T.ShaderMaterial(K.add({uniforms:{uG:{value:0},uA:{value:1}},
   vertexShader:'attribute vec3 aA;attribute vec2 aT;uniform float uG;varying float vV;void main(){float k=clamp((uG-aT.x)/(aT.y-aT.x),0.,1.);vV=step(aT.x,uG);vec3 p=mix(aA,position,k);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
   fragmentShader:'uniform float uA;varying float vV;void main(){if(vV<.5)discard;gl_FragColor=vec4(vec3(1.,.78,.42)*uA,1.);}'}));
  st.tree=new T.LineSegments(lg,st.treeMat);st.tree.frustumCulled=false;scene.add(st.tree);
  var bp=[],bt=[],bs=[];segs.forEach(function(s){var m=Math.max(2,Math.round(14-s[8]*1.6));for(var q=0;q<m;q++){var f=q/m;bp.push(K.lerp(s[0],s[3],f),K.lerp(s[1],s[4],f),K.lerp(s[2],s[5],f));bt.push(K.lerp(s[6],s[7],f));bs.push(Math.max(.4,3.2-s[8]*.42));}});
  var bg2=new T.BufferGeometry();bg2.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg2.setAttribute('aT',new T.Float32BufferAttribute(bt,1));bg2.setAttribute('aW',new T.Float32BufferAttribute(bs,1));
  st.barkMat=new T.ShaderMaterial(K.add({uniforms:{uG:{value:0},uA:{value:1},uPx:{value:K.S}},
   vertexShader:'attribute float aT,aW;uniform float uG,uPx;varying float vA,vW;void main(){vA=smoothstep(aT,aT+.04,uG);vW=aW;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aW*uPx*4.5/-mv.z*vA;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying float vA,vW;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.72,.36)*smoothstep(.5,0.,d)*vA*uA*(.25+.2*vW),1.);}'}));
  st.bark=new T.Points(bg2,st.barkMat);st.bark.frustumCulled=false;scene.add(st.bark);
  st.growEnd=Math.max.apply(null,segs.map(function(s){return s[7];}));
  // leaves: particles that live folded in the seed, bloom on the branch tips, take on colour, then spiral home
  var tips=segs.filter(function(s){return s[8]>=5;});
  var inSeed=K.cloud(NP,function(r){var a=r()*Math.PI*2,u=r()*2-1,rr=Math.pow(r(),.6),s=Math.sqrt(1-u*u);return[Math.cos(a)*s*rr*.1,SY+.02+u*rr*.15,Math.sin(a)*s*rr*.1];},4);
  var curl=K.cloud(NP,function(r){var t=r(),a=t*Math.PI*7,rr=.02+t*.085;return[Math.cos(a)*rr,SY+.0+t*.17-.06,Math.sin(a)*rr*.6];},6);
  var canopy=K.cloud(NP,function(r){var s=tips[Math.floor(r()*tips.length)],f=r();return[K.lerp(s[0],s[3],f)+(r()-.5)*.14,K.lerp(s[1],s[4],f)+(r()-.5)*.12,K.lerp(s[2],s[5],f)+(r()-.5)*.14];},8);
  var galaxy=K.cloud(NP,function(r){var arm=Math.floor(r()*3),t=Math.pow(r(),.7),a=arm*2.094+t*5.2,rr=.1+t*1.15;return[Math.cos(a)*rr+(r()-.5)*.12,.35+Math.sin(a)*rr*.42+(r()-.5)*.08,(r()-.5)*.2];},10);
  st.leaves=K.morph([inSeed,curl,canopy,galaxy,inSeed],[new T.Color(1,.86,.55),new T.Color(1,.86,.55),new T.Color(.85,1,.6),new T.Color(1,.85,.5),new T.Color(1,.9,.6)],{size:.9,swirl:.5,seed:21,pal:[new T.Color(1,.35,.5),new T.Color(.3,1,.6),new T.Color(.35,.6,1),new T.Color(1,.75,.2)]});
  scene.add(st.leaves);
  // the seed: a glowing shell in two halves
  st.shellMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uA:{value:1},uIn:{value:0},uT:{value:0}},side:T.DoubleSide,
   vertexShader:'varying vec3 vN,vV;varying float vY;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA,uIn,uT;varying vec3 vN,vV;varying float vY;void main(){float f=pow(1.-abs(dot(vN,vV)),2.2);vec3 c=mix(vec3(.55,.32,.1),vec3(1.,.82,.45),f);float rid=.94+.06*sin(vY*90.);c*=rid;float a=mix(.95,.18+f*.8,uIn);gl_FragColor=vec4(c*(1.+.3*sin(uT*2.)*0.),a*uA);}'});
  var hg=new T.SphereGeometry(1,40,20,0,Math.PI);st.halves=[0,1].map(function(k){var m=new T.Mesh(hg,st.shellMat);m.rotation.y=k?Math.PI:0;m.scale.set(.13,.2,.13);m.position.set(0,SY+.02,0);m.renderOrder=3;scene.add(m);return m;});
  st.glow=K.sprite();st.glow.renderOrder=6;scene.add(st.glow);
  st.soil=K.sprite('rgba(255,200,120,.7)','rgba(180,90,30,.25)',{opacity:.5});st.soil.scale.set(1.6,.35,1);st.soil.position.set(0,SY-.03,0);scene.add(st.soil);
  // closing: Dakṣiṇāmūrti under the banyan
  st.art=K.art(K.guruPaths(),512,640,1.6);st.art.position.set(0,.56,.4);st.art.renderOrder=8;scene.add(st.art);
  return st;},
 render:function(st,pf,t,h){var K=KIT,ss=K.ss,e=K.eio,L=K.lerp,SY=st.SY;
  var pull=e(ss(.12,.44,pf)),fin=ss(.8,.9,pf);
  var cz=L(1.7,6.2,pull),cy=L(SY+.1,.42,pull);cz=L(cz,5.25,fin);cy=L(cy,.25,fin);
  st.cam.position.set(Math.sin(t*.12)*.12*pull,cy,cz);st.cam.lookAt(0,cy-.02*(1-pull),0);
  var crack=ss(.27,.33,pf),grow=ss(.3,.55,pf)*(1-ss(.66,.78,pf)),fold=ss(.66,.8,pf);
  // seed
  st.shellMat.uniforms.uIn.value=ss(.12,.2,pf);st.shellMat.uniforms.uT.value=t;st.shellMat.uniforms.uA.value=1-ss(.34,.42,pf)+ss(.74,.8,pf)*(1-fin);
  st.halves.forEach(function(m,k){var o=(k?-1:1)*crack*.16;m.position.set(o,SY+.02+crack*.03,0);m.rotation.z=(k?1:-1)*crack*.5;var sc=1-ss(.74,.8,pf)*0;m.scale.set(.13,.2,.13);});
  if(pf>.74){st.halves.forEach(function(m){m.position.set(0,SY+.02,0);m.rotation.z=0;});}
  var gs=.35+.25*Math.sin(t*2)*.3+.9*ss(.25,.3,pf)*(1-crack)+1.2*fold*(1-fin);st.glow.scale.setScalar(gs);st.glow.position.set(0,SY+.03,.05);st.glow.material.opacity=(.7-.4*ss(.35,.45,pf)+.5*fold)*(1-fin*.9);
  st.soil.material.opacity=.35+.3*grow;
  // tree growth and folding
  var g=grow*st.growEnd*1.02;st.treeMat.uniforms.uG.value=g;st.barkMat.uniforms.uG.value=g;st.treeMat.uniforms.uA.value=.55*(1-fold);st.barkMat.uniforms.uA.value=1-fold;
  st.leaves.userData.seq(pf,[[0,0],[.19,1,.07],[.52,2,.2],[.72,3,.07],[.8,4,.07]],.1);
  var lm=st.leaves.material.uniforms;lm.uT.value=t;lm.uVar.value=ss(.55,.6,pf)*(1-ss(.74,.8,pf));lm.uAl.value=ss(.13,.2,pf)*(1-fin)*(1-.45*ss(.5,.56,pf)*(1-ss(.68,.74,pf)));lm.uSz.value=pf<.3?.55:1+.5*ss(.52,.58,pf)*(1-ss(.7,.76,pf));lm.uSw.value=pf<.3?.03:.5;
  // space and time
  var sp=ss(.46,.56,pf)*(1-ss(.68,.76,pf));st.grid.material.uniforms.uR.value=.2+3.2*ss(.46,.58,pf);st.grid.material.uniforms.uA.value=sp;
  st.rings.forEach(function(rg,k){var ph=((t*.12+k/4)%1),rr=.25+ph*2.6;rg.scale.set(rr,1,rr);rg.material.opacity=sp*(1-ph)*.7;});
  // backdrop
  st.mand.rotation.z=t*.02;st.mand.material.opacity=.05+.04*Math.sin(t*.8)+.2*fin;st.mand.position.set(0,L(.4,.66,fin),-1.2);
  st.motes.material.uniforms.uT.value=t;st.bg.material.uniforms.uG.value.setRGB(.5,.3,.12);st.bg.material.uniforms.uGs.value=.25*grow+.2*fold;st.bg.material.uniforms.uGy.value=.3+.3*pull;
  var dA=ss(.84,.97,pf);st.art.userData.draw(dA,{x:256,y:300,r:46,a:ss(.9,.99,pf)});st.art.visible=dA>0;
  if(fin>0){st.glow.position.set(0,L(SY+.03,.44,e(fin)),.5);st.glow.material.opacity=.9*(1-ss(.9,1,pf)*.6);st.glow.scale.setScalar(L(.5,.9,fin));}}
});
