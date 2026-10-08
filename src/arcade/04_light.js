/* 4 · Light the World: the lamp in the pot shines out through its holes. Spin the pot so the beams light the dark forms before they reach it. */
ARCADE[4]={name:'Light the World',how:'Drag left or right to spin the pot. Light every dark form before it reaches you.',sky:['#1a1030','#05030a'],
 setup:function(c){var T=c.T,s=this.s={ang:0,forms:[],next:1,combo:0};
  s.pot=c.add(c.model('lpot',c.LIB.pot('#a85a32'),.3));s.pot.position.set(0,-.4,0);s.flame=c.add(c.glow('rgba(255,190,90,.9)',1.6));s.flame.position.set(0,.6,1);
  s.beams=[];for(var i=0;i<3;i++){var g=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{a:{value:1}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float a;varying vec2 vUv;void main(){float w=1.-abs(vUv.y-.5)*2.;float f=pow(w,1.5)*(1.-vUv.x*.85);gl_FragColor=vec4(vec3(1.,.82,.45)*f*.55*a,1.);}'}));
   g.geometry.translate(.5,0,0);g.scale.set(9,1.4,1);g.position.set(0,.2,.5);c.add(g);s.beams.push(g);}
  c.help('Drag to spin the beams');},
 drag:function(x,y,dx){this.s.ang-=dx*.55;},key:function(k){if(k==='ArrowLeft')this.s.ang+=.35;if(k==='ArrowRight')this.s.ang-=.35;},
 tap:function(x){this.s.ang+=x<0?.45:-.45;},
 shapes:[['dtree',function(c){return c.LIB.tree('#3a3346','#4a4258');}],['dhouse',function(c){return c.LIB.house('#4a4258');}],['dbird',function(){return[[0,0,0,2,1,1,'#4a4258'],[-1.5,.5,0,1.4,.4,1,'#4a4258'],[1.5,.5,0,1.4,.4,1,'#4a4258']];}],['dtemple',function(c){return c.LIB.temple('#4a4258');}],['dflower',function(){return[[0,0,0,1,1,1,'#4a4258'],[0,1,0,1,1,1,'#4a4258'],[1,0,0,1,1,1,'#4a4258'],[-1,0,0,1,1,1,'#4a4258'],[0,-1,0,1,1,1,'#4a4258'],[0,-2.2,0,.4,2,.4,'#3a3346']];}]],
 lit:{dtree:function(c){return c.LIB.tree('#8a5a2b','#58b45f');},dhouse:function(c){return c.LIB.house('#f4a259');},dbird:function(){return[[0,0,0,2,1,1,'#ffd23f'],[-1.5,.5,0,1.4,.4,1,'#ffb627'],[1.5,.5,0,1.4,.4,1,'#ffb627']];},dtemple:function(c){return c.LIB.temple('#ffd27a');},dflower:function(){return[[0,0,0,1,1,1,'#ffd23f'],[0,1,0,1,1,1,'#ff8fb1'],[1,0,0,1,1,1,'#ff8fb1'],[-1,0,0,1,1,1,'#ff8fb1'],[0,-1,0,1,1,1,'#ff8fb1'],[0,-2.2,0,.4,2,.4,'#58b45f']];}},
 update:function(dt,t,c){var s=this.s,self=this;if(t>3)c.help('');
  s.beams.forEach(function(b,i){b.rotation.z=s.ang+i*Math.PI*2/3;});s.pot.rotation.y=.55+s.ang*.4;s.flame.scale.setScalar(1.5+Math.sin(t*9)*.08);
  s.next-=dt;if(s.next<=0){s.next=Math.max(.5,(1.8-t*.022)/(.8+.2*c.level));var k=self.shapes[Math.floor(c.rnd()*self.shapes.length)],a=c.rnd()*Math.PI*2,r=Math.max(c.HW,c.HH)*1.05;
   var m=c.model(k[0],k[1](c),.26);m.position.set(Math.cos(a)*r*.95,Math.sin(a)*r*.95-.2,0);m.userData={k:k[0],lit:0,done:false,sp:(.9+t*.018)*(.85+.15*c.level)};c.add(m);s.forms.push(m);}
  for(var i=s.forms.length-1;i>=0;i--){var m=s.forms[i],u=m.userData,dx=-m.position.x,dy=-.2-m.position.y,d=Math.hypot(dx,dy);
   if(u.done){u.t=(u.t||0)+dt;m.position.y+=dt*1.5;m.scale.setScalar(Math.max(.01,1-u.t*.8));if(u.t>1.2){c.remove(m);s.forms.splice(i,1);}continue;}
   var fa=Math.atan2(m.position.y+.2,m.position.x),inBeam=false;s.beams.forEach(function(b){var da=Math.atan2(Math.sin(fa-b.rotation.z),Math.cos(fa-b.rotation.z));if(Math.abs(da)<Math.max(.11,.55/Math.max(1,d)))inBeam=true;});
   if(inBeam){u.lit+=dt*2.6;m.scale.setScalar(1+.1*Math.sin(u.lit*20));if(u.lit>=1){u.done=true;var nm=c.model(u.k+'L',self.lit[u.k](c),.26);nm.position.copy(m.position);nm.userData=u;c.remove(m);c.add(nm);s.forms[i]=nm;s.combo++;c.combo(s.combo);c.score(10*Math.min(4,1+Math.floor(s.combo/4)),nm.position.x,nm.position.y+1);c.SFX.good(s.combo);c.burst(nm.position.x,nm.position.y,'#ffd27a',10);}}
   else{u.lit=Math.max(0,u.lit-dt);m.position.x+=dx/d*u.sp*dt;m.position.y+=dy/d*u.sp*dt;}
   if(!u.done&&d<1.3){c.remove(m);s.forms.splice(i,1);s.combo=0;c.combo(0);c.score(-10,0,1.5);c.SFX.bad();c.shake();}}}
};
