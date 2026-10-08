/* 3 · Find That: one light shines in every form. Watch it hide, follow the shuffle, tap where the light is. */
ARCADE[3]={name:'Find That',how:'Watch the light hide. Follow the shuffle, then tap where it is.',sky:['#2a1a40','#0b0614'],
 setup:function(c){var s=this.s={objs:[],round:0,phase:'show',tm:0,combo:0};s.light=c.add(c.glow('rgba(255,215,130,.9)',1.8));
  var gr=c.model('fground',[[0,0,0,44,2,6,'#2b1d3a'],[0,1,0,44,.4,6,'#4a3466']],.25);gr.rotation.set(-.3,0,0);gr.position.set(0,-2.2,-2);c.add(gr);
  s.tat=document.createElement('div');this.newRound(c);c.help('Watch where the light goes');},
 forms:['pot','tree','mountain','temple','house'],
 make:function(c,k){var L=c.LIB;return k==='pot'?c.model('fpot',L.pot('#b5653a'),.26):k==='tree'?c.model('ftree',L.tree('#6b4423','#3f9a4f'),.2):k==='mountain'?c.model('fmnt',L.mountain(),.22):k==='temple'?c.model('ftemple',L.temple('#e8a24a'),.2):c.model('fhouse',L.house('#c0573a'),.26);},
 newRound:function(c){var s=this.s;s.objs.forEach(function(o){c.remove(o.m);});s.objs=[];s.round++;
  var n=Math.min(5,3+Math.floor((s.round-1)/3)+(c.level>1?1:0)),gap=Math.min(2.6,8.6/n);
  for(var i=0;i<n;i++){var k=this.forms[(i+s.round)%this.forms.length],m=this.make(c,k);m.position.set((i-(n-1)/2)*gap,-1.5,0);c.add(m);s.objs.push({m:m,slot:i,k:k});}
  s.gap=gap;s.n=n;s.hide=Math.floor(c.rnd()*n);s.phase='show';s.tm=0;s.swaps=[];var sw=3+s.round*2+(c.level-1)*2;
  for(i=0;i<sw;i++){var a=Math.floor(c.rnd()*n),b=(a+1+Math.floor(c.rnd()*(n-1)))%n;s.swaps.push([a,b]);}
  s.swapDur=Math.max(.16,.45-s.round*.03-(c.level-1)*.05);s.si=0;s.light.visible=true;},
 slotX:function(i){var s=this.s;return(i-(s.n-1)/2)*s.gap;},
 tap:function(x,y,c){var s=this.s;if(s.phase!=='pick')return;var best=null,bd=9;s.objs.forEach(function(o){var d=Math.hypot(x-o.m.position.x,y-(o.m.position.y+.9));if(d<bd){bd=d;best=o;}});if(!best||bd>1.8)return;
  var right=s.objs.indexOf(best)===s.hide;s.phase='reveal';s.tm=0;s.picked=best;
  if(right){s.combo++;c.combo(s.combo);var bonus=Math.max(0,Math.round(20-s.pickT*6));c.score(20+bonus+5*Math.min(4,s.combo),best.m.position.x,best.m.position.y+2.4,'That!');c.SFX.good(s.combo);c.burst(best.m.position.x,best.m.position.y+1,'#ffd27a',14);}
  else{s.combo=0;c.combo(0);c.score(-5,best.m.position.x,best.m.position.y+2.4);c.SFX.bad();c.shake();}},
 update:function(dt,t,c){var s=this.s,self=this;s.tm+=dt;var hid=s.objs[s.hide];
  if(s.phase==='show'){var h=hid.m.position;var f=Math.min(1,s.tm/1.1);s.light.position.set(h.x,h.y+2.6-1.6*Math.max(0,f-.45)/.55*1,1);s.light.scale.setScalar(1.8*(1-.6*Math.max(0,f-.6)/.4));
   if(s.tm>1.2){s.light.visible=false;s.phase='swap';s.tm=0;}}
  else if(s.phase==='swap'){var sw=s.swaps[s.si];if(!sw){s.phase='pick';s.tm=0;s.pickT=0;if(s.round===1)c.help('Tap where the light is');return;}
   var A=s.objs.find(function(o){return o.slot===sw[0];}),B=s.objs.find(function(o){return o.slot===sw[1];}),f=Math.min(1,s.tm/s.swapDur),e=f*f*(3-2*f);
   var xa=self.slotX(sw[0]),xb=self.slotX(sw[1]);A.m.position.x=xa+(xb-xa)*e;B.m.position.x=xb+(xa-xb)*e;A.m.position.y=-1.5+Math.sin(e*Math.PI)*.9;B.m.position.y=-1.5-Math.sin(e*Math.PI)*.5;A.m.position.z=1;B.m.position.z=-1;
   if(f>=1){A.slot=sw[1];B.slot=sw[0];A.m.position.y=B.m.position.y=-1.5;A.m.position.z=B.m.position.z=0;s.si++;s.tm=0;c.SFX.tick();}}
  else if(s.phase==='pick'){s.pickT+=dt;if(t>4)c.help('');}
  else if(s.phase==='reveal'){var p=hid.m.position;s.light.visible=true;s.light.position.set(p.x,p.y+.8+Math.min(1,s.tm)*2,1);s.light.scale.setScalar(1.4+Math.sin(s.tm*6)*.2);hid.m.position.y=-1.5+Math.min(.6,s.tm*2);
   if(s.tm>1.1)self.newRound(c);}
  s.objs.forEach(function(o,i){o.m.rotation.y=.55+Math.sin(t*1.5+i)*.08;});}
};
