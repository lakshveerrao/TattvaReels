/* 8 · Wake Up: teacher and student, father and son, owner and owned all pop up in a dream. Pop them; ring the bell; in the last seconds, wake the dreamer. */
ARCADE[8]={name:'Wake Up',how:'Tap the dream figures as they pop up. Golden bell = bonus. Dark moon = don’t tap. Last 6 seconds: tap the dreamer awake!',sky:['#26164a','#08050f'],
 setup:function(c){var T=c.T,s=this.s={holes:[],ups:[],next:.4,combo:0,wakeTaps:0,woke:false};
  var cols=3,rows=3,w=2.9,h=2.5,y0=c.HH*.35;for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){var x=(k-1)*w,y=y0-r*h;var cl=c.model('cloud',[[0,0,0,5,1.2,2,'#3a2a6a'],[-1.2,.6,0,2,1,2,'#4a3a7e'],[1,.7,0,2.4,1,2,'#4a3a7e']],.26);cl.position.set(x,y-.9,1);c.add(cl);s.holes.push({x:x,y:y,busy:false});}
  s.bubble=c.add(c.glow('rgba(150,110,255,.25)',13));s.bubble.position.set(0,y0-h,-2);
  s.dreamer=c.add(c.model('dreamer',[[0,0,0,3,3,3,'#e0a878'],[4,-.5,0,6,2.4,3,'#7a5ab5'],[8.2,-.8,0,2.4,1.8,2.6,'#3d4f7a'],[-.2,1.8,0,3.4,.8,3.4,'#3a2a1a']],.24));s.dreamer.rotation.set(-.3,.3,0);s.dreamer.position.set(-1.4,-c.HH+1.8,0);
  s.zz=c.add(c.glow('rgba(190,170,255,.8)',1));
  this.figs=[['teacher',function(L){return L.person('#c98a5b','#e8a24a','#6b4423',.7);}],['student',function(L){return L.person('#e0a878','#3d7fb5','#2a2a3a',.55);}],['father',function(L){return L.person('#b5774a','#2f8a5e','#333',.75);}],['son',function(L){return L.person('#e0a878','#ff8fb1','#3d7fb5',.5);}],['owner',function(L){return L.person('#d9a070','#7a3b22','#222',.7);}],['house',function(L){return L.house('#c0573a');}],['pot',function(L){return L.pot('#b5653a');}]];
  c.help('Tap the figures as they pop up');},
 tap:function(x,y,c){var s=this.s;
  if(c.left<=6){var d=s.dreamer.position;if(Math.hypot(x-(d.x+1),y-d.y)<2.4){s.wakeTaps++;c.score(3,x,y+.6);c.SFX.pop();s.dreamer.position.y=-c.HH+1.8+.15;if(s.wakeTaps===12&&!s.woke){s.woke=true;c.score(50,d.x+1,d.y+2,'awake!');c.SFX.big();c.burst(d.x+1,d.y+1,'#ffd27a',20);}}}
  var best=null,bd=1.3;s.ups.forEach(function(u){var dd=Math.hypot(x-u.m.position.x,y-(u.m.position.y+.7));if(dd<bd&&!u.hit){bd=dd;best=u;}});if(!best)return;best.hit=true;best.t=Math.max(best.t,best.life-.15);
  var p=best.m.position;if(best.kind==='moon'){s.combo=0;c.combo(0);c.score(-15,p.x,p.y+1.5,'deeper dream');c.SFX.bad();c.shake();}
  else if(best.kind==='bell'){c.score(30,p.x,p.y+1.5,'awaken!');c.SFX.big();c.burst(p.x,p.y+.8,'#ffd27a',16);s.combo++;c.combo(s.combo);}
  else{s.combo++;c.combo(s.combo);c.score(10*Math.min(4,1+Math.floor(s.combo/4)),p.x,p.y+1.5,best.kind);c.SFX.good(s.combo);c.burst(p.x,p.y+.8,'#cfd8ff',8);}},
 update:function(dt,t,c){var s=this.s,self=this;s.zz.position.set(s.dreamer.position.x+.2,s.dreamer.position.y+1.5+Math.sin(t*2)*.2,1);s.zz.visible=!s.woke;
  if(c.left<=6&&!s.toldWake){s.toldWake=true;c.help('Wake the dreamer! Tap them fast');}else if(t>3&&c.left>6)c.help('');
  s.dreamer.position.y+=(-c.HH+1.8-s.dreamer.position.y)*Math.min(1,dt*8);if(s.woke){s.dreamer.rotation.z+=(1.2-s.dreamer.rotation.z)*dt*3;}
  s.next-=dt;if(s.next<=0&&c.left>6){s.next=Math.max(.32,(.9-t*.01)/(.8+.2*c.level));var free=s.holes.filter(function(h){return!h.busy;});if(free.length){var h=free[Math.floor(c.rnd()*free.length)],r=c.rnd(),kind,m;
    if(r<.08){kind='bell';m=c.model('bell',[[0,0,0,2.4,2.4,2.4,'#ffd23f'],[0,1.6,0,.8,.8,.8,'#ffb627'],[0,-1.5,0,.8,.6,.8,'#b5651d']],.24);}
    else if(r<.22){kind='moon';m=c.model('moon',[[0,0,0,3,3,1.4,'#2a2050'],[1,.8,0,1.6,1.6,1.6,'#08050f'],[-.4,-.2,.8,.6,.6,.2,'#ff3b5c']],.25);}
    else{var f=self.figs[Math.floor(c.rnd()*self.figs.length)];kind=f[0];m=c.model('w'+f[0],f[1](c.LIB),.2);}
    m.position.set(h.x,h.y-1.4,0);c.add(m);h.busy=true;s.ups.push({m:m,h:h,kind:kind,t:0,life:Math.max(.75,1.5-t*.012),hit:false});}}
  for(var i=s.ups.length-1;i>=0;i--){var u=s.ups[i];u.t+=dt;var up=Math.min(1,u.t/.18),down=Math.max(0,(u.t-u.life)/.18);u.m.position.y=u.h.y-1.4+1.3*(up-down);u.m.visible=up-down>.02;
   if(u.t>u.life+.2){c.remove(u.m);u.h.busy=false;s.ups.splice(i,1);if(!u.hit&&u.kind!=='moon'&&u.kind!=='bell'&&s.combo){s.combo=0;c.combo(0);}}}}
};
