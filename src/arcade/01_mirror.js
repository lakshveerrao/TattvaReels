/* 1 · Mirror Catch: the world is a city seen in a mirror. Swing the mirror to catch the falling city; dodge the dark doubts. */
ARCADE[1]={name:'Mirror Catch',how:'Drag to move the mirror. Catch the city, dodge the dark cubes.',sky:['#3a1c3f','#120a1c'],
 setup:function(c){var T=c.T,s=this.s={items:[],next:.6,combo:0,city:[]};
  var ring=[];for(var i=0;i<28;i++){var a=i/28*Math.PI*2;ring.push([Math.cos(a)*5,Math.sin(a)*2.2,0,1.2,1.2,1.2,i%2?'#e9b44c':'#f6d58e']);}
  ring.push([0,0,-.6,9,3.6,.4,'#5a3a6e']);
  s.mirror=c.add(c.model('mirror',ring,.26));s.mirror.rotation.set(-.5,0,0);s.mirror.position.set(0,-c.HH+2.4,0);s.mx=0;
  s.halo=c.add(c.glow('rgba(255,210,120,.6)',3.2));s.halo.position.set(0,s.mirror.position.y,-.5);
  s.ground=c.add(c.model('mground',[[0,0,0,44,2,6,'#2b1a10'],[0,1,0,44,.4,6,'#5c3b1f']],.25));s.ground.rotation.set(-.2,0,0);s.ground.position.set(0,-c.HH+.6,-2);
  this.kinds=[['temple',function(){return c.LIB.temple('#e8a24a');},1],['house',function(){return c.LIB.house('#c0573a');},1],['house2',function(){return c.LIB.house('#3d7fb5',3);},1],['tree',function(){return c.LIB.tree('#6b4423','#3f9a4f');},1]];
  c.help('Drag the mirror left and right');},
 drag:function(x){this.s.tx=x;},down:function(x){this.s.tx=x;},hover:function(x){this.s.tx=x;},
 key:function(k){if(k==='ArrowLeft')this.s.tx=(this.s.tx||0)-1.4;if(k==='ArrowRight')this.s.tx=(this.s.tx||0)+1.4;},
 update:function(dt,t,c){var s=this.s,lv=c.level;if(t>2.5)c.help('');
  if(s.tx!=null){s.mx+=(Math.max(-c.HW+1.4,Math.min(c.HW-1.4,s.tx))-s.mx)*Math.min(1,dt*14);}s.mirror.position.x=s.mx;s.halo.position.x=s.mx;s.halo.material.opacity=.6+.25*Math.sin(t*3);
  s.next-=dt;if(s.next<=0){s.next=Math.max(.32,(.95-t*.011)/(.8+.2*lv));var dark=c.rnd()<.18+.04*lv,k=this.kinds[Math.floor(c.rnd()*this.kinds.length)];
   var m=dark?c.model('doubt',[[0,0,0,3,3,3,'#2a1838'],[0,0,1.6,1.2,1.2,.4,'#b25cff'],[1.6,0,0,.4,1.2,1.2,'#b25cff'],[0,1.6,0,1.2,.4,1.2,'#b25cff']],.25):c.model(k[0],k[1](),.2);if(dark){var dg=c.glow('rgba(170,80,255,.55)',1.6);m.add(dg);}
   m.position.set((c.rnd()*2-1)*(c.HW-1),c.HH+1,0);m.userData={dark:dark,vy:-(3.2+t*.07)*(.85+.15*lv),spin:(c.rnd()-.5)*2};c.add(m);s.items.push(m);}
  var my=s.mirror.position.y;
  for(var i=s.items.length-1;i>=0;i--){var m=s.items[i];m.position.y+=m.userData.vy*dt;m.rotation.y+=m.userData.spin*dt;
   if(m.position.y<my+.9&&m.position.y>my-.3&&Math.abs(m.position.x-s.mx)<1.4){c.remove(m);s.items.splice(i,1);
    if(m.userData.dark){s.combo=0;c.combo(0);c.score(-15,s.mx,my+1.5);c.SFX.bad();c.shake();}
    else{s.combo++;c.combo(s.combo);c.score(10*Math.min(5,1+Math.floor(s.combo/3)),s.mx,my+1.5);c.SFX.good(s.combo);c.burst(s.mx,my+.6,'#ffd27a',8);
     var b=c.model('cb'+(s.city.length%3),[[0,0,0,1,1+(s.city.length%3),1,['#ffd27a','#f4a259','#e9b44c'][s.city.length%3]]],.18);b.position.set(s.mx+((s.city.length%9)-4)*.24,my-.1,.3);b.userData.off=((s.city.length%9)-4)*.24;c.add(b);s.city.push(b);if(s.city.length>18){c.remove(s.city.shift());}}
    continue;}
   if(m.position.y<-c.HH-1){c.remove(m);s.items.splice(i,1);if(!m.userData.dark&&s.combo){s.combo=0;c.combo(0);}}}
  s.city.forEach(function(b){b.position.x=s.mx+b.userData.off;});}
};
