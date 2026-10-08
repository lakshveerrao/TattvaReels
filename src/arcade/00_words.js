/* Word data for the letter games: IAST → Devanagari, splitting into akṣaras, and each tattva's key words with meanings. */
var WORDS=(function(){
 var V={'a':'अ','ā':'आ','i':'इ','ī':'ई','u':'उ','ū':'ऊ','ṛ':'ऋ','ṝ':'ॠ','ḷ':'ऌ','e':'ए','ai':'ऐ','o':'ओ','au':'औ'};
 var M={'a':'','ā':'ा','i':'ि','ī':'ी','u':'ु','ū':'ू','ṛ':'ृ','ṝ':'ॄ','ḷ':'ॢ','e':'े','ai':'ै','o':'ो','au':'ौ'};
 var C={'kh':'ख','gh':'घ','ch':'छ','jh':'झ','ṭh':'ठ','ḍh':'ढ','th':'थ','dh':'ध','ph':'फ','bh':'भ','k':'क','g':'ग','ṅ':'ङ','c':'च','j':'ज','ñ':'ञ','ṭ':'ट','ḍ':'ड','ṇ':'ण','t':'त','d':'द','n':'न','p':'प','b':'ब','m':'म','y':'य','r':'र','l':'ल','v':'व','ś':'श','ṣ':'ष','s':'स','h':'ह'};
 function toDev(s){s=s.normalize('NFC').toLowerCase().replace(/ṃ/g,'ṁ');var out='',i=0,prevC=false;
  while(i<s.length){var two=s.substr(i,2),one=s[i];
   if(C[two]||C[one]){var k=C[two]?two:one;if(prevC)out+='्';out+=C[k];i+=k.length;prevC=true;continue;}
   var vk=(two==='ai'||two==='au')?two:(V[one]!=null?one:null);
   if(vk){out+=prevC?M[vk]:V[vk];i+=vk.length;prevC=false;continue;}
   if(one==='ṁ'){out+='ं';i++;prevC=false;continue;}if(one==='ḥ'){out+='ः';i++;prevC=false;continue;}
   if(one==='’'||one==="'"){out+='ऽ';i++;prevC=false;continue;}
   if(prevC)out+='्';prevC=false;out+=one===' '||one==='-'?' ':'';i++;}
  if(prevC)out+='्';return out;}
 // akṣara: (consonant (virama consonant)*) or independent vowel, then optional vowel sign, then optional anusvāra/visarga/virama
 var AK=/(?:[क-हक़-य़](?:्[क-हक़-य़])*|[ऄ-औॠॡ])[ा-ौॢॣ]?[ऀ-ः]?्?|ऽ|[^\s]/g;
 function aksharas(dev){return(dev.match(AK)||[]).filter(function(x){return x.trim();});}
 function forTattva(n){var T=typeof TL==='function'?TL(n):TATTVAS[n-1],seen={},out=[];
  var VOW=/^[aāiīuūṛeo]/,add=function(iast,mean){var dev=toDev(iast),ak=aksharas(dev);if(ak.length<2||ak.length>6||seen[dev])return;seen[dev]=1;out.push({iast:iast,dev:dev,ak:ak,mean:mean});};
  T.words.forEach(function(w){w[0].split(/\s+/).forEach(function(p){var seg=p.split('-');
    // join compound parts only where no vowel sandhi is needed; t+m/n becomes n (sat-mātraḥ → sanmātraḥ)
    var ok=seg.every(function(x,i){return i===0||!VOW.test(x);});
    if(ok){add(seg.reduce(function(acc,x){return acc&&/t$/.test(acc)&&/^[mn]/.test(x)?acc.slice(0,-1)+'n'+x:acc+x;},''),w[1]);}
    else seg.forEach(function(x){add(x.replace(/ḥ$/,'ḥ'),w[1]+' ('+w[0]+')');});});});
  return out;}
 // one key word per tattva: worth double, glows
 var KEY={1:'darpaṇa',2:'bīja',3:'tat',4:'dīpa',5:'deham',6:'rāhu',7:'aham',8:'svapne'};
 return{toDev:toDev,aksharas:aksharas,forTattva:forTattva,isKey:function(n,w){return w.iast.indexOf(KEY[n].slice(0,4))>=0||w.iast===KEY[n];}};
})();
