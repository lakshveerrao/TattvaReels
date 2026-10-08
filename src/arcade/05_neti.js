/* 5 · Neti Neti: not the body, not the breath, not the mind. Swipe through everything that is "not I"; never cut the light, that is you. */
ARCADE[5]={name:'Neti Neti',how:'Swipe to cut body, breath, senses and mind. Never cut the golden light: that’s you.',sky:['#2a0f22','#0a0510'],
 setup:function(c){var T=c.T,s=this.s={items:[],next:.5,trail:[],combo:0,halves:[]};
  var pts=new Float32Array(16*3),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pts,3));
  s.line=new T.Line(g,new T.LineBasicMaterial({color:0xfff1c8,transparent:true,opacity:.9}));s.line.frustumCulled=false;c.add(s.line);s.lineG=g;
  c.help('Swipe across to cut');},
 kinds:[['body','body',function(c){return c.LIB.person('#e0a878','#c0573a','#3d4f7a',.75);}],['breath','breath',function(){return[[0,0,0,3,1.4,1.4,'#cfeaff'],[1.4,.8,0,2,1.4,1.4,'#e8f6ff'],[-1.2,.7,0,1.6,1.2,1.2,'#bfe2ff']];}],
  ['eye','senses',function(){return[[0,0,0,3,2,1,'#ffffff'],[0,0,.6,1.2,1.2,.4,'#3d7fb5'],[0,0,.9,.6,.6,.2,'#111']];}],['mind','mind',function(){return[[0,0,0,3,2.4,2.4,'#f29bb8'],[-.8,1,0,1.4,.8,1.8,'#e57fa3'],[.8,1,0,1.4,.8,1.8,'#e57fa3'],[0,-1.5,0,.8,1,.8,'#d86d93']];}],
  ['void','emptiness',function(){return[[0,0,0,3,3,3,'#120c1c'],[0,0,1.6,1.6,1.6,.2,'#3a2552']];}]],
 drag:function(x,y,dx,dy,c,trail){this.s.trail=trail.slice(-12);this.cut(c);},
 up:function(){this.s.trail=[];},
 cut:function(c){var s=this.s,tr=s.trail;if(tr.length<2)return;var a=tr[tr.length-2],b=tr[tr.length-1],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<.08)return;var cutN=0;
  for(var i=s.items.length-1;i>=0;i--){var m=s.items[i],p=m.position,t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(len*len))),qx=a.x+(b.x-a.x)*t,qy=a.y+(b.y-a.y)*t;
   if(Math.hypot(p.x-qx,p.y-qy)<.75){c.remove(m);s.items.splice(i,1);
    if(m.userData.self){s.combo=0;c.combo(0);c.score(-25,p.x,p.y+1,'that’s you!');c.SFX.bad();c.shake();c.burst(p.x,p.y,'#ffd27a',16);}
    else{cutN++;s.combo++;c.combo(s.combo);c.score(10+(cutN>1?10:0),p.x,p.y+1,'not '+m.userData.label);c.SFX.good(s.combo);c.burst(p.x,p.y,m.userData.col,10);
     for(var h=0;h<2;h++){var hm=c.model(m.userData.k+'h',[[0,0,0,1.4,2.8,1.4,m.userData.col]],.25);hm.position.copy(p);hm.userData={vx:(h?1:-1)*2.5,vy:3,r:(h?1:-1)*4};c.add(hm);s.halves.push(hm);}}}}},
 update:function(dt,t,c){var s=this.s,self=this;if(t>3)c.help('');
  s.next-=dt;if(s.next<=0){var many=t>20&&c.rnd()<.35?2:1;s.next=Math.max(.38,(1.1-t*.012)/(.8+.2*c.level));
   for(var q=0;q<many;q++){var isSelf=c.rnd()<.16,m,col;
    if(isSelf){m=c.add(c.glow('rgba(255,215,130,.95)',1.7));var core=c.model('selfcore',[[0,0,0,1.6,1.6,1.6,'#fff1c8']],.25);m.add(core);col='#ffd27a';m.userData={self:true};}
    else{var k=self.kinds[Math.floor(c.rnd()*self.kinds.length)];m=c.model('n'+k[0],k[2](c),.24);col={body:'#c0573a',breath:'#cfeaff',eye:'#ffffff',mind:'#f29bb8',void:'#3a2552'}[k[0]];m.userData={k:k[0],label:k[1],col:col};c.add(m);}
    var x0=(c.rnd()*2-1)*(c.HW-1.2);m.position.set(x0,-c.HH-.5,0);m.userData.vx=(-x0*.25)+(c.rnd()-.5)*1.5;m.userData.vy=Math.sqrt(2*9*(c.HH*(1.15+c.rnd()*.4)));m.userData.spin=(c.rnd()-.5)*4;s.items.push(m);}}
  for(var i=s.items.length-1;i>=0;i--){var m=s.items[i],u=m.userData;u.vy-=9*dt;m.position.x+=u.vx*dt;m.position.y+=u.vy*dt;m.rotation.z+=(u.spin||0)*dt;
   if(m.position.y<-c.HH-1.5&&u.vy<0){c.remove(m);s.items.splice(i,1);if(u.self){c.score(15,m.position.x,-c.HH+1.5,'witness');c.SFX.pop();}}}
  for(i=s.halves.length-1;i>=0;i--){var h=s.halves[i];h.userData.vy-=12*dt;h.position.x+=h.userData.vx*dt;h.position.y+=h.userData.vy*dt;h.rotation.z+=h.userData.r*dt;if(h.position.y<-c.HH-2){c.remove(h);s.halves.splice(i,1);}}
  var pos=s.lineG.attributes.position,tr=s.trail;for(var j=0;j<16;j++){var p=tr[Math.max(0,tr.length-16+j)]||tr[tr.length-1]||{x:0,y:-99};pos.setXYZ(j,p.x,p.y,2);}pos.needsUpdate=true;s.line.visible=tr.length>1;}
};
