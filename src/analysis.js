function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var SCALE=[0,2,3,5,7,8,10,12];
function makeMelody(seed){
  var r=mulberry32(seed),deg=[0,4,2][Math.floor(r()*3)],notes=[],durs=[1,1,0.5,0.5,1.5];
  for(var k=0;k<10;k++){
    var step=(r()<0.5?-1:1)*(1+(r()<0.4?1:0));
    deg=Math.max(0,Math.min(7,deg+step));
    notes.push({semi:SCALE[deg],dur:durs[Math.floor(r()*durs.length)]});
  }
  notes.push({semi:0,dur:2});
  return notes;
}
function refSequence(notes){
  var s=[];
  notes.forEach(function(n){var c=Math.max(2,Math.round(n.dur*6));for(var i=0;i<c;i++)s.push(n.semi);});
  return s;
}
function pitchTrack(x,sr){
  var f=Math.max(1,Math.round(sr/11025)),s2=sr/f,n=Math.floor(x.length/f),d=new Float32Array(n);
  for(var i=0;i<n;i++){var a=0;for(var k=0;k<f;k++)a+=x[i*f+k];d[i]=a/f;}
  var W=512,hop=256,minL=Math.floor(s2/800),maxL=Math.floor(s2/80),out=[];
  for(var st=0;st+W+maxL<=n;st+=hop){
    var e=0;for(var i2=0;i2<W;i2++)e+=d[st+i2]*d[st+i2];
    if(Math.sqrt(e/W)<0.01){out.push(0);continue;}
    var best=0,bl=0,r=new Float32Array(maxL+2);
    for(var l=minL;l<=maxL;l++){
      var c=0,e2=0;
      for(var j=0;j<W;j++){var b=d[st+j+l];c+=d[st+j]*b;e2+=b*b;}
      r[l]=c/Math.sqrt(e*e2+1e-9);
      if(r[l]>best){best=r[l];bl=l;}
    }
    if(best<0.6){out.push(0);continue;}
    var pick=bl;
    for(var l2=minL+1;l2<maxL;l2++){if(r[l2]>=0.9*best&&r[l2]>=r[l2-1]&&r[l2]>=r[l2+1]){pick=l2;break;}}
    out.push(s2/pick);
  }
  return{hz:out,fps:s2/hop};
}
function medianOf(a){var b=a.slice().sort(function(x,y){return x-y});return b[Math.floor(b.length/2)];}
function smooth(a,w){
  var o=[];
  for(var i=0;i<a.length;i++){var win=[];for(var k=-w;k<=w;k++){if(a[i+k]!==undefined)win.push(a[i+k]);}o.push(medianOf(win));}
  return o;
}
function resample(a,N){
  if(a.length<=N)return a.slice();
  var o=[];
  for(var i=0;i<N;i++){
    var s=Math.floor(i*a.length/N),e=Math.max(s+1,Math.floor((i+1)*a.length/N)),t=0;
    for(var k=s;k<e;k++)t+=a[k];
    o.push(t/(e-s));
  }
  return o;
}
function circ(a,b){var m=(((a-b)%12)+12)%12;return Math.min(m,12-m);}
function dtw(a,b,shift){
  var n=a.length,m=b.length,D=[],i,j;
  for(i=0;i<=n;i++){D.push(new Float32Array(m+1).fill(1e9));}
  D[0][0]=0;
  for(i=1;i<=n;i++)for(j=1;j<=m;j++){
    var c=circ(a[i-1],b[j-1]+shift);
    D[i][j]=c+Math.min(D[i-1][j]+0.6,D[i][j-1]+0.6,D[i-1][j-1]);
  }
  return D[n][m]/(n+m);
}
var PASS_COST=0.5;
function scoreTake(x,sr,notes){
  var pt=pitchTrack(x,sr),semis=[];
  pt.hz.forEach(function(h){if(h>0)semis.push(69+12*Math.log2(h/440));});
  var voicedSec=semis.length/pt.fps;
  if(voicedSec<1)return{pass:false,reason:'short',voicedSec:voicedSec,pct:0,cost:99,userSeq:[],refSeq:[]};
  semis=smooth(semis,2);
  var u=resample(semis,90),rf=resample(refSequence(notes),90),best=1e9,bs=0;
  for(var s=0;s<12;s++){var c=dtw(u,rf,s);if(c<best){best=c;bs=s;}}
  var pct=Math.round(100*Math.max(0,Math.min(1,1-best/2.5)));
  var um=medianOf(u),rm=medianOf(rf);
  return{pass:best<=PASS_COST,reason:best<=PASS_COST?'ok':'mismatch',voicedSec:voicedSec,pct:pct,cost:best,
    userSeq:u.map(function(v){return v-um}),refSeq:rf.map(function(v){return v-rm}),shift:bs};
}
function synthTake(notes,o){
  o=o||{};
  var sr=o.sr||22050,shift=o.shift||0,tempo=o.tempo||0.5,vib=o.vib===undefined?0.3:o.vib,base=196*Math.pow(2,shift/12);
  var total=0;notes.forEach(function(n){total+=n.dur*tempo});
  var out=new Float32Array(Math.ceil((total+0.6)*sr)),ph=0,pos=0;
  notes.forEach(function(n){
    var len=Math.floor(n.dur*tempo*sr),f=base*Math.pow(2,n.semi/12);
    for(var i=0;i<len;i++){
      var tt=i/sr,env=Math.min(1,i/(0.03*sr))*Math.min(1,(len-i)/(0.05*sr)),fv=f*(1+vib*0.01*Math.sin(2*Math.PI*5.5*(pos+i)/sr));
      ph+=2*Math.PI*fv/sr;
      out[pos+i]=0.3*env*(Math.sin(ph)+0.3*Math.sin(2*ph));
    }
    pos+=len;
  });
  if(o.noise){for(var k=0;k<out.length;k++)out[k]+=(Math.random()-0.5)*o.noise;}
  return out;
}
if(typeof module!=='undefined')module.exports={makeMelody:makeMelody,refSequence:refSequence,scoreTake:scoreTake,synthTake:synthTake,dtw:dtw,resample:resample,medianOf:medianOf,PASS_COST:PASS_COST};
