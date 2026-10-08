/* 7 · Thread Runner: childhood, youth, age, waking, dream and sleep all pass; the "I am" runs through every one. Tap to jump. */
ARCADE[7]={name:'Thread Runner',how:'Tap to jump (tap again in the air to double jump). Hop over every passing state; collect the beads.',sky:['#3a2a12','#0c0806'],
 setup:function(c){var T=c.T,s=this.s={y:0,vy:0,jumps:0,obs:[],beads:[],next:1.4,nextB:.6,speed:4.2,combo:0,hurt:0,dist:0,stage:0};
  s.TY=-c.HH*.25;var th=c.model('thread',[[0,0,0,120,.4,.4,'#ffd27a']],.25);th.rotation.set(0,0,0);th.position.set(0,s.TY,0);c.add(th);s.threadGlow=c.add(c.glow('rgba(255,210,120,.35)',1));s.threadGlow.scale.set(30,.8,1);s.threadGlow.position.set(0,s.TY,-.2);
  s.me=c.add(c.model('runner',c.LIB.person('#e0a878','#e9b44c','#6b4423',.8),.22));s.me.rotation.set(-.1,1.1,0);s.mx=-c.HW+1.6;s.me.position.set(s.mx,s.TY+.2,0);
  s.aham=c.add(c.glow('rgba(255,230,160,.95)',1.2));
  s.hills=[];for(var i=0;i<6;i++){var h=c.model('hill'+(i%3),[[0,0,0,10+i%3*4,4+i%2*3,2,['#2a1d10','#3a2814','#231a0e'][i%3]]],.3);h.position.set(-6+i*4,s.TY-1.6,-6);c.add(h);s.hills.push(h);}
  c.help('Tap to jump');},
 stages:[['child','childhood'],['youth','youth'],['old','old age'],['wake','waking'],['dream','dream'],['sleep','deep sleep']],
 obsModel:function(c,k){var L=c.LIB;return k==='child'?c.model('ochild',L.person('#e0a878','#ff8fb1','#3d7fb5',.55),.22):k==='youth'?c.model('oyouth',L.person('#c98a5b','#3d7fb5','#2a2a3a',.85),.22):
  k==='old'?c.model('oold',L.person('#d9b08c','#9a9a9a','#555',.8).concat([[3.6,1,0,.5,6,.5,'#6b4423']]),.22):k==='wake'?c.model('owake',[[0,0,0,3,3,3,'#ffd23f'],[0,2.4,0,.6,1.4,.6,'#ffb627'],[2.4,0,0,1.4,.6,.6,'#ffb627'],[-2.4,0,0,1.4,.6,.6,'#ffb627']],.24):
  k==='dream'?c.model('odream',[[0,0,0,3,3,1,'#cfd8ff'],[1,1,0,1.6,1.6,1.2,'#0c0806'],[-.6,-1.8,0,4,1.2,1.2,'#9fb0e8']],.26):c.model('osleep',[[0,0,0,3.4,3.4,3.4,'#1d1730'],[0,0,1.8,2,.5,.2,'#6b5a9a'],[1.2,2.6,0,.8,.8,.2,'#b9a8ff'],[2,3.4,0,.6,.6,.2,'#b9a8ff']],.25);},
 tap:function(x,y,c){this.jump(c);},key:function(k,c){if(k===' '||k==='ArrowUp')this.jump(c);},
 jump:function(c){var s=this.s;if(s.jumps<2){s.vy=s.jumps?7.5:9.2;s.jumps++;c.SFX.jump();}},
 update:function(dt,t,c){var s=this.s,self=this;if(t>3)c.help('');s.speed=(4.2+t*.07)*(.9+.1*c.level);s.dist+=s.speed*dt;
  s.vy-=24*dt;s.y+=s.vy*dt;if(s.y<=0){s.y=0;s.vy=0;s.jumps=0;}s.hurt=Math.max(0,s.hurt-dt);
  s.me.position.y=s.TY+.2+s.y;s.me.rotation.z=s.y>0?-.15:Math.sin(t*14)*.08;s.me.visible=!(s.hurt>0&&Math.floor(t*12)%2);s.aham.position.set(s.mx,s.TY+.2+s.y+1.85,1);s.aham.scale.setScalar(1.1+Math.sin(t*5)*.12);
  s.hills.forEach(function(h){h.position.x-=s.speed*.25*dt;if(h.position.x<-c.HW-6)h.position.x+=24;});
  s.stage=Math.min(5,Math.floor(t/10));
  s.next-=dt;if(s.next<=0){s.next=Math.max(.75,(1.7-t*.015)-c.rnd()*.4);var k=self.stages[Math.min(5,s.stage-(c.rnd()<.3&&s.stage>0?1:0))];var m=self.obsModel(c,k[0]);
   var fly=k[0]==='dream'&&c.rnd()<.5;m.position.set(c.HW+1.5,s.TY+(fly?1.9:.2),0);m.userData={k:k,passed:false,fly:fly};c.add(m);s.obs.push(m);}
  s.nextB-=dt;if(s.nextB<=0){s.nextB=.5+c.rnd()*.6;var b=c.model('bead',[[0,0,0,1,1,1,'#ffd27a']],.25);b.position.set(c.HW+1,s.TY+.6+c.rnd()*2.6,0);c.add(b);s.beads.push(b);}
  for(var i=s.obs.length-1;i>=0;i--){var m=s.obs[i];m.position.x-=s.speed*dt;var dx=Math.abs(m.position.x-s.mx),meY=s.y+.2,top=m.userData.k[0]==='child'?.75:1.05,bottom=m.userData.fly?1.4:0;
   if(dx<.6&&s.hurt<=0&&((!m.userData.fly&&meY<top)||(m.userData.fly&&meY+1.6>bottom&&meY<2.6))){s.hurt=1.1;s.combo=0;c.combo(0);c.score(-15,s.mx,s.TY+2.5);c.SFX.bad();c.shake();}
   if(!m.userData.passed&&m.position.x<s.mx-.7){m.userData.passed=true;if(s.hurt<=0){s.combo++;c.combo(s.combo);c.score(10+2*Math.min(10,s.combo),m.position.x,s.TY+2.2,m.userData.k[1]+' passes');c.SFX.pop();}}
   if(m.position.x<-c.HW-2){c.remove(m);s.obs.splice(i,1);}}
  for(i=s.beads.length-1;i>=0;i--){var b=s.beads[i];b.position.x-=s.speed*dt;b.rotation.y+=dt*4;if(Math.abs(b.position.x-s.mx)<.6&&Math.abs(b.position.y-(s.TY+.9+s.y))<.9){c.remove(b);s.beads.splice(i,1);c.score(5,b.position.x,b.position.y+.6);c.SFX.good(0);}else if(b.position.x<-c.HW-1){c.remove(b);s.beads.splice(i,1);}}}
};
