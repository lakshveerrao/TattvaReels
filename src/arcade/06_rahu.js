/* 6 · Escape Rāhu: in deep sleep the sun of the Self is only covered, never touched. Steer the sun, collect the light, keep away from Rāhu. */
ARCADE[6]={name:'Escape Rāhu',how:'Drag to steer the sun. Collect the light; keep away from Rāhu’s shadows.',sky:['#1d2d5a','#070912'],
 setup:function(c){var T=c.T,s=this.s={x:0,y:-2,tx:0,ty:-2,motes:[],rahus:[],eclipse:0,combo:0,next:.2};
  var parts=[[0,0,0,4,4,4,'#ffd23f'],[0,0,2.1,2.4,2.4,.3,'#fff1a8']];for(var i=0;i<8;i++){var a=i/8*Math.PI*2;parts.push([Math.cos(a)*3.4,Math.sin(a)*3.4,0,1.1,1.1,1.1,'#ffb627']);}
  s.sun=c.add(c.model('psun',parts,.22));s.sun.rotation.set(0,0,0);s.halo=c.add(c.glow('rgba(255,200,90,.7)',3.6));
  this.addRahu(c);c.help('Drag to move the sun');},
 addRahu:function(c){var s=this.s,m=c.model('rahu',[[0,0,0,5,4,4,'#1a1028'],[-1.2,.6,2.05,1,1,.2,'#ff3b5c'],[1.2,.6,2.05,1,1,.2,'#ff3b5c'],[0,-1.2,2.05,3,.6,.2,'#3a2552'],[-2.6,2,0,.8,1.6,.8,'#2a1a3e'],[2.6,2,0,.8,1.6,.8,'#2a1a3e']],.25);
  var e=c.rnd()<.5;m.position.set(e?(c.rnd()<.5?-c.HW-1:c.HW+1):(c.rnd()*2-1)*c.HW,e?(c.rnd()*2-1)*c.HH:c.HH+1,0);m.userData={vx:0,vy:0,sp:1.3+s.rahus.length*.25};c.add(m);
  var sh=c.glow('rgba(80,30,120,.6)',3);sh.material.blending=c.T.NormalBlending;m.add(sh);s.rahus.push(m);},
 drag:function(x,y){this.s.tx=x;this.s.ty=y+.8;},down:function(x,y){this.s.tx=x;this.s.ty=y+.8;},hover:function(x,y){this.s.tx=x;this.s.ty=y;},
 key:function(k){var s=this.s;if(k==='ArrowLeft')s.tx-=1.2;if(k==='ArrowRight')s.tx+=1.2;if(k==='ArrowUp'||k===' ')s.ty+=1.2;},
 update:function(dt,t,c){var s=this.s,self=this;if(t>3)c.help('');
  s.tx=Math.max(-c.HW+.8,Math.min(c.HW-.8,s.tx));s.ty=Math.max(-c.HH+.8,Math.min(c.HH-1.6,s.ty));
  s.x+=(s.tx-s.x)*Math.min(1,dt*10);s.y+=(s.ty-s.y)*Math.min(1,dt*10);s.sun.position.set(s.x,s.y,0);s.sun.rotation.z+=dt*.8;s.halo.position.set(s.x,s.y,-.5);
  s.eclipse=Math.max(0,s.eclipse-dt);var dim=s.eclipse>0;s.halo.material.opacity=dim?.15:.7+.2*Math.sin(t*4);s.sun.scale.setScalar(dim?.75:1);
  var want=1+Math.floor(t/12)+(c.level>1?1:0);if(s.rahus.length<want)self.addRahu(c);
  s.next-=dt;if(s.next<=0&&s.motes.length<9){s.next=.45;var m=c.model('mote',[[0,0,0,1,1,1,'#fff1a8']],.25);m.position.set((c.rnd()*2-1)*(c.HW-.8),(c.rnd()*2-1)*(c.HH-1.6),0);var g=c.glow('rgba(255,220,140,.7)',1);m.add(g);m.userData={t:0};c.add(m);s.motes.push(m);}
  for(var i=s.motes.length-1;i>=0;i--){var m=s.motes[i];m.userData.t+=dt;m.rotation.y+=dt*3;m.position.y+=Math.sin(m.userData.t*3)*dt*.3;
   if(!dim&&Math.hypot(m.position.x-s.x,m.position.y-s.y)<.95){c.remove(m);s.motes.splice(i,1);s.combo++;c.combo(s.combo);c.score(5*Math.min(4,1+Math.floor(s.combo/5)),m.position.x,m.position.y+.8);c.SFX.good(Math.min(12,s.combo));}
   else if(m.userData.t>7){c.remove(m);s.motes.splice(i,1);}}
  s.rahus.forEach(function(r,k){var dx=s.x-r.position.x,dy=s.y-r.position.y,d=Math.hypot(dx,dy)||1,sp=r.userData.sp*(.85+.15*c.level)*(1+t*.01);
   r.userData.vx+=(dx/d*sp-r.userData.vx)*dt*1.2;r.userData.vy+=(dy/d*sp-r.userData.vy)*dt*1.2;r.position.x+=r.userData.vx*dt;r.position.y+=r.userData.vy*dt;r.rotation.z=Math.sin(t*2+k)*.15;
   if(d<1.3&&s.eclipse<=0){s.eclipse=2;s.combo=0;c.combo(0);c.score(-20,s.x,s.y+1.2,'eclipsed');c.SFX.bad();c.shake();r.userData.vx*=-2.5;r.userData.vy*=-2.5;}});}
};
