/* 2 · Grow the Banyan: the whole tree waits in the seed. Tap to drop each sliding block onto the tree; line it up to grow tall. */
ARCADE[2]={name:'Grow the Banyan',how:'Tap to drop the sliding block. Line it up to grow the tree.',sky:['#16334a','#0a0f1a'],
 setup:function(c){var T=c.T,s=this.s={layers:[],w:2.4,x:0,dir:1,y:0,combo:0,scroll:0,orbs:[],next:1.5};
  s.world=new T.Group();c.add(s.world);s.base=-c.HH+1.6;
  var seed=c.model('seed',[[0,0,0,3,2,2,'#a0622d'],[0,1.2,0,1,1,1,'#7cc46a']],.25);seed.position.set(0,s.base-.6,0);s.world.add(seed);
  var gr=c.model('bground',[[0,0,0,44,3,6,'#2a3b1c'],[0,1.6,0,44,.4,6,'#4b7a2a']],.25);gr.rotation.set(-.15,0,0);gr.position.set(0,s.base-1.2,-2);s.world.add(gr);
  s.top={x:0,w:2.4,y:s.base};this.spawnSlider(c);c.help('Tap to drop the block');},
 color:function(n){return n<6?['#7a4a24','#8a5a2b'][n%2]:n<14?['#5c8a3a','#4f7d31','#6b9a40'][n%3]:['#3f9a4f','#58b45f','#2f8a45'][n%3];},
 spawnSlider:function(c){var s=this.s,T=c.T,n=s.layers.length;s.y=s.top.y+.5;s.w=s.top.w;s.x=-c.HW+s.w/2;s.dir=1;
  s.slide=c.model('blk'+Math.round(s.w*10)+this.color(n),[[0,0,0,s.w*4,2,3,this.color(n)]],.25);s.slide.rotation.set(-.25,0,0);s.slide.position.set(s.x,s.y,0);s.world.add(s.slide);},
 tap:function(x,y,c){this.drop(c);},key:function(k,c){if(k===' '||k==='ArrowUp')this.drop(c);},
 drop:function(c){var s=this.s;if(!s.slide||s.falling)return;var T=c.T,top=s.top,l=Math.max(s.x-s.w/2,top.x-top.w/2),r=Math.min(s.x+s.w/2,top.x+top.w/2),ov=r-l,n=s.layers.length;
  s.world.remove(s.slide);s.slide=null;
  if(ov<=.15){c.score(-20,s.x,s.y-s.scroll+.8);c.SFX.bad();c.shake();s.combo=0;c.combo(0);var fall=c.model('blk'+Math.round(s.w*10)+this.color(n),[[0,0,0,s.w*4,2,3,this.color(n)]],.25);fall.rotation.set(-.25,0,0);fall.position.set(s.x,s.y,0);fall.userData.vy=0;s.world.add(fall);s.drops=(s.drops||[]).concat([fall]);
   s.top={x:top.x,w:Math.max(1.2,top.w),y:top.y};this.spawnSlider(c);return;}
  var perfect=Math.abs(s.x-top.x)<.12,nw=perfect?Math.min(2.4,top.w+.1):ov,nx=perfect?top.x:(l+r)/2;
  var blk=c.model('blk'+Math.round(nw*10)+this.color(n),[[0,0,0,nw*4,2,3,this.color(n)]],.25);blk.rotation.set(-.25,0,0);blk.position.set(nx,s.y,0);s.world.add(blk);s.layers.push(blk);
  if(!perfect&&s.w-ov>.02){var cw=s.w-ov,cx=s.x>top.x?r+cw/2:l-cw/2,cut=c.model('blk'+Math.round(cw*10)+this.color(n),[[0,0,0,cw*4,2,3,this.color(n)]],.25);cut.rotation.set(-.25,0,0);cut.position.set(cx,s.y,0);cut.userData.vy=0;s.world.add(cut);s.drops=(s.drops||[]).concat([cut]);}
  if(perfect){s.combo++;c.combo(s.combo);c.SFX.good(s.combo);c.burst(nx,s.y-s.scroll,'#9be27a',8);}else{s.combo=0;c.combo(0);c.SFX.pop();}
  c.score((perfect?15:8)*Math.max(1,Math.min(4,s.combo)),nx,s.y-s.scroll+.8,perfect?'perfect':'');
  if(n%4===3){var leaf=c.model('leaf',[[0,0,0,2,1.4,2,'#58b45f'],[0,1,0,1,1,1,'#7cc46a']],.22);leaf.position.set(nx+(n%8<4?-1:1)*(nw/2+.25),s.y,.3);s.world.add(leaf);}
  for(var i=s.orbs.length-1;i>=0;i--){var o=s.orbs[i];if(Math.abs(o.position.y-s.y)<.6&&o.position.x>nx-nw/2-.3&&o.position.x<nx+nw/2+.3){s.world.remove(o);s.orbs.splice(i,1);c.score(25,o.position.x,o.position.y-s.scroll,o.userData.k);c.SFX.big();}}
  s.top={x:nx,w:nw,y:s.y};this.spawnSlider(c);},
 update:function(dt,t,c){var s=this.s;if(t>3)c.help('');
  if(s.slide){var sp=(2.6+t*.05)*(.85+.15*c.level);s.x+=s.dir*sp*dt;var lim=c.HW-s.w/2;if(s.x>lim){s.x=lim;s.dir=-1;}if(s.x<-lim){s.x=-lim;s.dir=1;}s.slide.position.x=s.x;}
  var want=Math.max(0,s.top.y-(-c.HH+5.5));s.scroll+=(want-s.scroll)*Math.min(1,dt*4);s.world.position.y=-s.scroll;
  (s.drops||[]).forEach(function(d){d.userData.vy-=20*dt;d.position.y+=d.userData.vy*dt;d.rotation.z+=dt*2;});s.drops=(s.drops||[]).filter(function(d){if(d.position.y-s.scroll<-c.HH-3){s.world.remove(d);return false;}return true;});
  s.next-=dt;if(s.next<=0){s.next=3+c.rnd()*2;var sunny=c.rnd()<.5,o=sunny?c.model('sunorb',[[0,0,0,2,2,2,'#ffd23f'],[0,0,0,2.8,.6,.6,'#ffb627'],[0,0,0,.6,2.8,.6,'#ffb627']],.2):c.model('rain',[[0,0,0,1,2,1,'#6fc3ff'],[0,-1.2,0,.6,.6,.6,'#a8dcff']],.2);
   o.userData={k:sunny?'sun':'rain',vx:(c.rnd()<.5?-1:1)*1.2};o.position.set(o.userData.vx>0?-c.HW-.5:c.HW+.5,s.top.y+1.5+c.rnd()*2.5,.4);s.world.add(o);s.orbs.push(o);}
  for(var i=s.orbs.length-1;i>=0;i--){var o=s.orbs[i];o.position.x+=o.userData.vx*dt;o.rotation.y+=dt*2;if(Math.abs(o.position.x)>c.HW+1){s.world.remove(o);s.orbs.splice(i,1);}}}
};
