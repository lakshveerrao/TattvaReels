var GLR=(function(){
 var W=360,H=560,S=Math.min(2,window.devicePixelRatio||1),MAXN=13000,data=new Float32Array(MAXN*7);
 var c=null,gl=null,ok=null,P1=null,P2=null,ibuf=null,vao=null,fvao=null,resLoc=null;
 function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 function prog(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(p,0,'q');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
 function init(){
  if(ok!==null)return ok;
  try{
   c=document.createElement('canvas');c.width=Math.round(W*S);c.height=Math.round(H*S);
   gl=c.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:true});
   if(!gl){ok=false;return false;}
   P1=prog('#version 300 es\nin vec2 q;in vec2 ip;in vec2 isz;in float irot;in float ih;in float ia;uniform vec2 res;out vec2 vq;out float vh;out float va;void main(){float cs=cos(irot),sn=sin(irot);vec2 p=vec2(q.x*isz.x,q.y*isz.y);p=vec2(p.x*cs-p.y*sn,p.x*sn+p.y*cs)+ip;gl_Position=vec4(p.x/res.x*2.-1.,1.-p.y/res.y*2.,0.,1.);vq=q;vh=ih;va=ia;}',
    '#version 300 es\nprecision mediump float;in vec2 vq;in float vh;in float va;out vec4 o;void main(){float d=dot(vq,vq);if(d>1.)discard;float g=exp(-d*4.);vec3 c0=vec3(.42,.14,.03),c1=vec3(1.,.70,.20),c2=vec3(1.,.93,.70);vec3 col=vh<.6?mix(c0,c1,vh/.6):mix(c1,c2,min(1.,(vh-.6)/.4));o=vec4(col*g*va,1.);}');
   P2=prog('#version 300 es\nin vec2 q;uniform float dummy;void main(){gl_Position=vec4(q,0.,1.);}',
    '#version 300 es\nprecision mediump float;uniform float fade;out vec4 o;void main(){o=vec4(.043,.055,.133,fade);}');
   var qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   vao=gl.createVertexArray();gl.bindVertexArray(vao);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   ibuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ibuf);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);
   [['ip',2,0],['isz',2,8],['irot',1,16],['ih',1,20],['ia',1,24]].forEach(function(a){var l=gl.getAttribLocation(P1,a[0]);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,a[1],gl.FLOAT,false,28,a[2]);gl.vertexAttribDivisor(l,1);});
   resLoc=gl.getUniformLocation(P1,'res');
   fvao=gl.createVertexArray();gl.bindVertexArray(fvao);gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   ok=true;
  }catch(e){ok=false;}
  return ok;
 }
 function clear(){gl.viewport(0,0,c.width,c.height);gl.clearColor(.043,.055,.133,1);gl.clear(gl.COLOR_BUFFER_BIT);}
 function draw(n,trail){
  gl.viewport(0,0,c.width,c.height);
  if(trail>0){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(P2);gl.uniform1f(gl.getUniformLocation(P2,'fade'),trail);gl.bindVertexArray(fvao);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
  else clear();
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.useProgram(P1);gl.uniform2f(resLoc,W,H);gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,ibuf);gl.bufferSubData(gl.ARRAY_BUFFER,0,data,0,n*7);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,n);
 }
 function put(i,x,y,sx,sy,rot,h,a){var o=i*7;data[o]=x;data[o+1]=y;data[o+2]=sx;data[o+3]=sy;data[o+4]=rot;data[o+5]=h;data[o+6]=a;}
 return{init:init,draw:draw,clear:clear,put:put,get canvas(){return c;}};
})();

function rnd(seed){return mulberry32(seed);}
function clamp01(v){return v<0?0:v>1?1:v;}
var ENG={};

ENG['Splat bloom']=function(sc){
 var N=Math.round(9000*sc),r=rnd(11),x=new Float32Array(N),y=new Float32Array(N),vx=new Float32Array(N),vy=new Float32Array(N),SH=[[],[],[]],i,k;
 for(k=0;k<3;k++){SH[k]=[new Float32Array(N),new Float32Array(N)];}
 var radii=[35,70,105,140];
 for(i=0;i<N;i++){
  var th=r()*6.2832,rad=(40+110*Math.pow(r(),.55))*(.35+.65*Math.abs(Math.cos(4*th)));
  SH[0][0][i]=180+Math.cos(th)*rad;SH[0][1][i]=300+Math.sin(th)*rad*.9;
  if(r()<.2){var yy=480-r()*150;SH[1][0][i]=180+(r()-.5)*(12+(480-yy)*.05);SH[1][1][i]=yy;}
  else{var a2=r()*6.2832,r2=Math.sqrt(r())*130;SH[1][0][i]=180+Math.cos(a2)*r2*1.05;SH[1][1][i]=250+Math.sin(a2)*r2*.7;}
  var th3,rd3;if(r()<.3){th3=Math.floor(r()*12)*Math.PI/6+(r()-.5)*.03;rd3=r()*140;}else{th3=r()*6.2832;rd3=radii[Math.floor(r()*4)]+(r()-.5)*6;}
  SH[2][0][i]=180+Math.cos(th3)*rd3;SH[2][1][i]=300+Math.sin(th3)*rd3;
  x[i]=r()*360;y[i]=60+r()*460;
 }
 return{n:N,trail:0,step:function(dt,A){
  var s=Math.floor(Math.max(0,A.idx)/4)%3,T=SH[s],br=1+A.env*.1+A.semi/12*.06,damp=Math.max(0,1-3.2*dt);
  for(i=0;i<N;i++){
   var tx=180+(T[0][i]-180)*br,ty=300+(T[1][i]-300)*br;
   vx[i]+=((tx-x[i])*5+(Math.random()-.5)*60*(.3+A.env))*dt-(y[i]-300)*.12*A.env*dt;
   vy[i]+=((ty-y[i])*5+(Math.random()-.5)*60*(.3+A.env))*dt+(x[i]-180)*.12*A.env*dt;
   vx[i]*=damp;vy[i]*=damp;x[i]+=vx[i]*dt;y[i]+=vy[i]*dt;
   var sp=Math.sqrt(vx[i]*vx[i]+vy[i]*vy[i]),d=Math.sqrt((x[i]-180)*(x[i]-180)+(y[i]-300)*(y[i]-300));
   GLR.put(i,x[i],y[i],5.5*(1+sp*.012),5.5/(1+sp*.006),Math.atan2(vy[i],vx[i]),clamp01(.3+.4*A.env+.3*(1-d/150)),.1+.06*A.env);
  }}};
};

ENG['Sound sand']=function(sc){
 var N=Math.round(11000*sc),X=new Float32Array(N),Y=new Float32Array(N),i,M=[[1,2],[2,3],[1,3],[3,4],[2,5],[3,5],[4,5],[1,4]],PI=Math.PI;
 for(i=0;i<N;i++){X[i]=Math.random();Y[i]=Math.random();}
 return{n:N,trail:0,step:function(dt,A){
  var m=M[Math.min(7,Math.floor(A.semi/12*7.99))],n1=m[0],m1=m[1],kick=A.env*.9*dt;
  for(i=0;i<N;i++){
   var x=X[i],y=Y[i],a=Math.cos(n1*PI*x),b=Math.cos(m1*PI*y),c=Math.cos(m1*PI*x),d=Math.cos(n1*PI*y),f=a*b-c*d;
   var fx=-n1*PI*Math.sin(n1*PI*x)*b+m1*PI*Math.sin(m1*PI*x)*d,fy=-m1*PI*a*Math.sin(m1*PI*y)+n1*PI*c*Math.sin(n1*PI*y);
   var g2=fx*fx+fy*fy+.05,rt=Math.min(1,6*dt);x+=-f*fx/g2*rt+(Math.random()-.5)*kick;y+=-f*fy/g2*rt+(Math.random()-.5)*kick;
   if(x<0)x=-x;if(x>1)x=2-x;if(y<0)y=-y;if(y>1)y=2-y;
   X[i]=x;Y[i]=y;
   GLR.put(i,30+x*300,130+y*300,3.4,3.4,0,clamp01(.9-Math.min(1,Math.abs(f)*3)*.65),.3);
  }}};
};

ENG['Flow rivers']=function(sc){
 var N=Math.round(12000*sc),x=new Float32Array(N),y=new Float32Array(N),life=new Float32Array(N),i;
 for(i=0;i<N;i++){x[i]=Math.random()*360;y[i]=Math.random()*560;life[i]=Math.random()*5;}
 var a=.013,b=.017,cc=.031,dd=.022;
 return{n:N,trail:.16,step:function(dt,A){
  var t=A.t,ang=(A.semi/12)*Math.PI*.6-Math.PI*.3,bs=40+A.env*90,bx=Math.cos(ang)*bs,by=Math.sin(ang)*bs;
  for(i=0;i<N;i++){
   var px=x[i],py=y[i],s1=Math.sin(a*px+t*.3),c1=Math.cos(a*px+t*.3),s2=Math.sin(b*py-t*.21),c2=Math.cos(b*py-t*.21),c3=Math.cos(cc*px-dd*py+t*.4);
   var dpx=a*c1*c2+.5*cc*c3,dpy=-b*s1*s2-.5*dd*c3,u=dpy*5000+bx,v=-dpx*5000+by;
   x[i]=px+u*dt;y[i]=py+v*dt;life[i]-=dt;
   if(life[i]<0||x[i]<-10||x[i]>370||y[i]<-10||y[i]>570){x[i]=Math.random()*360;y[i]=Math.random()*560;life[i]=3+Math.random()*4;}
   var sp=Math.sqrt(u*u+v*v);
   GLR.put(i,x[i],y[i],2.5+sp*.04,2,Math.atan2(v,u),clamp01(.25+sp/420+.2*A.env),.12);
  }}};
};

ENG['Embers']=function(sc){
 var N=Math.round(9000*sc),x=new Float32Array(N),y=new Float32Array(N),vx=new Float32Array(N),vy=new Float32Array(N),life=new Float32Array(N),ml=new Float32Array(N),ptr=0,carry=0,i;
 function spawn(n,spread,up){for(var k=0;k<n;k++){var j=ptr;ptr=(ptr+1)%N;x[j]=180+(Math.random()+Math.random()-1)*spread;y[j]=470+Math.random()*10;vx[j]=(Math.random()-.5)*40;vy[j]=-(30+Math.random()*60)*up;ml[j]=life[j]=1.2+Math.random()*2.2;}}
 for(i=0;i<N;i++){life[i]=0;ml[i]=1;y[i]=-50;}
 return{n:N,trail:.22,step:function(dt,A){
  var spread=25+A.semi/12*45,rate=N/2.6*(.3+A.env*1.5)+N*.04;carry+=rate*dt;var c=Math.floor(carry);carry-=c;spawn(c,spread,1);
  if(A.ons)spawn(Math.round(N*.05),spread*1.6,2.2);
  for(i=0;i<N;i++){
   if(life[i]<=0){GLR.put(i,-50,-50,.1,.1,0,0,0);continue;}
   var h=life[i]/ml[i];
   vy[i]-=(50+90*h)*dt;vx[i]+=Math.sin(y[i]*.03+A.t*3+i)*70*dt;vx[i]*=Math.max(0,1-1.2*dt);vy[i]*=Math.max(0,1-.5*dt);
   x[i]+=vx[i]*dt;y[i]+=vy[i]*dt;life[i]-=dt;
   var sz=1.8+6*Math.sqrt(h);
   GLR.put(i,x[i],y[i],sz,sz*1.2,0,h*.9,.03+.15*h);
  }}};
};

ENG['Gravity orbits']=function(sc){
 var N=Math.round(7000*sc),x=new Float32Array(N),y=new Float32Array(N),vx=new Float32Array(N),vy=new Float32Array(N),i,GM=4e5,AT=[],ai=0;
 for(i=0;i<6;i++)AT.push({x:0,y:0,m:0,l:0});
 for(i=0;i<N;i++){var r=40+Math.sqrt(Math.random())*150,a=Math.random()*6.2832,v=Math.sqrt(GM/r)*(.9+Math.random()*.2);x[i]=180+Math.cos(a)*r;y[i]=300+Math.sin(a)*r;vx[i]=-Math.sin(a)*v;vy[i]=Math.cos(a)*v;}
 return{n:N+7,trail:.14,step:function(dt,A){
  if(A.ons){var at=AT[ai++%6];at.x=40+((Math.max(0,A.idx)%8)/7)*280;at.y=480-A.semi/12*360;at.m=3e5;at.l=3;}
  AT.forEach(function(at){at.l=Math.max(0,at.l-dt);});
  for(i=0;i<N;i++){
   var dx=180-x[i],dy=300-y[i],d2=dx*dx+dy*dy+400,inv=GM/(d2*Math.sqrt(d2)),ax=dx*inv,ay=dy*inv;
   for(var k=0;k<6;k++){var a=AT[k];if(a.l>0){var ex=a.x-x[i],ey=a.y-y[i],e2=ex*ex+ey*ey+900,iv=a.m*(a.l/3)/(e2*Math.sqrt(e2));ax+=ex*iv;ay+=ey*iv;}}
   vx[i]+=ax*dt;vy[i]+=ay*dt;x[i]+=vx[i]*dt;y[i]+=vy[i]*dt;
   if(x[i]<0||x[i]>360||y[i]<0||y[i]>560){var r2=60+Math.random()*120,a2=Math.random()*6.2832,v2=Math.sqrt(GM/r2);x[i]=180+Math.cos(a2)*r2;y[i]=300+Math.sin(a2)*r2;vx[i]=-Math.sin(a2)*v2;vy[i]=Math.cos(a2)*v2;}
   var sp=Math.sqrt(vx[i]*vx[i]+vy[i]*vy[i]);
   GLR.put(i,x[i],y[i],2+sp*.03,2,Math.atan2(vy[i],vx[i]),clamp01(sp/170),.24);
  }
  GLR.put(N,180,300,26+A.env*14,26+A.env*14,0,.7,.2);
  for(var j=0;j<6;j++){var q=AT[j];GLR.put(N+1+j,q.x,q.y,q.l>0?10+q.l*6:.1,q.l>0?10+q.l*6:.1,0,.9,q.l>0?.35*(q.l/3):0);}
 }};
};

function ss(a,b,v){var t=clamp01((v-a)/(b-a));return t*t*(3-2*t);}
ENG['Mirror city']=function(sc){
 var NC=Math.round(5600*sc),N=NC*2+2,HZ=318,r=rnd(7),i;
 var BL=[{k:'shik',cx:180,w:66,h:182},{k:'shik',cx:122,w:34,h:106},{k:'shik',cx:238,w:34,h:106},
  {k:'dome',x0:62,x1:98,h:60,r:18},{k:'dome',x0:262,x1:298,h:60,r:18},
  {k:'rect',x0:12,x1:46,h:74},{k:'rect',x0:40,x1:64,h:100},{k:'rect',x0:96,x1:110,h:52},{k:'rect',x0:146,x1:214,h:44},
  {k:'rect',x0:250,x1:264,h:52},{k:'rect',x0:296,x1:322,h:96},{k:'rect',x0:318,x1:348,h:66}];
 function inside(x,y){var best=0;for(var k=0;k<BL.length;k++){var b=BL[k],v=0;
  if(b.k==='rect'){if(x>=b.x0&&x<=b.x1&&y>=HZ-b.h&&y<=HZ){var lx=(x-b.x0)%9,ly=(HZ-y)%11;v=(lx>3&&lx<7&&ly>4&&ly<9&&x-b.x0>3&&b.x1-x>3&&HZ-y>8&&HZ-y<b.h-6)?2:1;}}
  else if(b.k==='dome'){var cx=(b.x0+b.x1)/2,cy=HZ-b.h;if(x>=b.x0&&x<=b.x1&&y>=cy&&y<=HZ)v=1;else if(y<cy&&(x-cx)*(x-cx)+(y-cy)*(y-cy)<=b.r*b.r)v=1;else if(Math.abs(x-cx)<1.6&&y<cy-b.r&&y>=cy-b.r-12)v=2;}
  else{var s2=(HZ-y)/b.h;if(s2>=0&&s2<=1){var half=b.w/2*(1-Math.pow(s2,1.7))*(1+.07*Math.sin(s2*44));if(Math.abs(x-b.cx)<=half)v=(Math.abs(x-b.cx)<1.5&&s2>.15)?2:1;}
   var ky=HZ-b.h-4;if((x-b.cx)*(x-b.cx)+(y-ky)*(y-ky)<=16)v=2;}
  if(v>best)best=v;}return best;}
 var TX=new Float32Array(NC),TY=new Float32Array(NC),BR=new Uint8Array(NC),x=new Float32Array(NC),y=new Float32Array(NC),vx=new Float32Array(NC),vy=new Float32Array(NC),DX=new Float32Array(NC),DY=new Float32Array(NC);
 var n=0,guard=0;while(n<NC&&guard<NC*40){guard++;var px=10+r()*340,py=HZ-196+r()*196,v=inside(px,py);if(v){TX[n]=px;TY[n]=py;BR[n]=v===2?1:0;n++;}}
 for(i=0;i<NC;i++){x[i]=r()*360;y[i]=r()*560;var a=r()*6.2832,rr=Math.sqrt(r());DX[i]=Math.cos(a)*rr;DY[i]=Math.sin(a)*rr;}
 var rip=0;
 return{n:N,trail:0,step:function(dt,A){
  var p=A.total?A.t/A.total:0,k=ss(.6,.8,p),bl=ss(.84,1,p),ang=k*2.4,ca=Math.cos(ang),sa=Math.sin(ang),rr=1-k,damp=Math.max(0,1-3.4*dt);
  if(A.ons)rip=1;rip=Math.max(0,rip-dt*1.6);
  for(i=0;i<NC;i++){
   var tx=TX[i],ty=TY[i]+Math.sin(A.t*1.3+TX[i]*.03)*1.1*(1-k),dx=tx-180,dy=ty-HZ;
   tx=180+(dx*ca-dy*sa)*rr;ty=HZ+(dx*sa+dy*ca)*rr;
   if(bl>0){tx+=DX[i]*bl*150;ty+=DY[i]*bl*150;}
   var j=(.4+A.env)*14;
   vx[i]+=((tx-x[i])*(5+6*k)+(Math.random()-.5)*j)*dt;vy[i]+=((ty-y[i])*(5+6*k)+(Math.random()-.5)*j)*dt;
   vx[i]*=damp;vy[i]*=damp;x[i]+=vx[i]*dt;y[i]+=vy[i]*dt;
   var b=BR[i],hh=b?1:clamp01(.5+.25*A.env+.5*k),sz=b?3.2:2.6,al=(b?.85:.3)*(1-.35*bl)+.25*k;
   GLR.put(i,x[i],y[i],sz,sz,0,hh,al);
   var dyr=y[i]-HZ,ry=HZ-dyr*.92,rx=x[i]+Math.sin(-dyr*.16-A.t*3.2)*(1.2+6*rip)*(1-k);
   GLR.put(NC+i,rx,ry,4.2,1.5,0,hh*.75,al*.42*(1-.5*bl));
  }
  GLR.put(2*NC,180,HZ,175,1.6+1.2*rip,0,.8,.35*(1-k));
  var sun=10+k*26+bl*120;GLR.put(2*NC+1,180,HZ,sun,sun,0,.95,.08+.5*k*(1-bl*.6));
 }};
};
var ENGINES=['Mirror city','Splat bloom','Sound sand','Flow rivers','Embers','Gravity orbits'];
function makeSim(name,sc){return ENG[name](sc);}
