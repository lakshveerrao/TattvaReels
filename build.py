import os,re
# Builds index.html from src/. Run from anywhere: python3 build.py
ROOT=os.path.dirname(os.path.abspath(__file__));SRC=os.path.join(ROOT,'src');OUT=ROOT
css=open(f'{SRC}/style.css').read();body=open(f'{SRC}/body.html').read()
mul='function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}'
an=open(f'{SRC}/analysis.js').read().split('if(typeof module')[0]
e=open(f'{SRC}/engines.js').read();f=open(f'{SRC}/film.js').read()+'\nvar FILMS={1:FILM};\n'+''.join(open(os.path.join(SRC,'films',x)).read()+'\n' for x in sorted(os.listdir(os.path.join(SRC,'films'))) if x.endswith('.js'));tn=open(f'{SRC}/tunes.js').read()+'\n'+open(f'{SRC}/tattvas.js').read()+'\n'+open(f'{SRC}/i18n.js').read()+'\n'+open(f'{SRC}/vedic.js').read()
app=open(f'{SRC}/app.js').read().replace('/* ---------- boot ---------- */',open(f'{SRC}/sing.js').read()+'\n'+open(f'{SRC}/games.js').read()+'\n'+open(f'{SRC}/trailer.js').read()+'\n'+open(f'{SRC}/intro.js').read()+'\n'+open(f'{SRC}/rock.js').read()+'\n/* ---------- boot ---------- */')
icon="data:image/svg+xml,"+"%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2307050F'/%3E%3Cg fill='none' stroke='%23E9B44C' stroke-width='3' stroke-linejoin='round'%3E%3Cpath d='M32 52c-6-5-9-11-9-19 0-7 3-14 9-19 6 5 9 12 9 19 0 8-3 14-9 19Z'/%3E%3Cpath d='M32 52c-11 0-20-6-23-16 6-1 12 1 16 5'/%3E%3Cpath d='M32 52c11 0 20-6 23-16-6-1-12 1-16 5'/%3E%3C/g%3E%3C/svg%3E"
head=f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Hey Tattva</title>
<meta name="description" content="Short reels that teach the eight tattvas of the Dakṣiṇāmūrti Aṣṭakam. Watch, sing the verse, and share what you learnt.">
<meta name="theme-color" content="#15123A">
<meta property="og:title" content="Hey Tattva"><meta property="og:description" content="The world, like a city in a mirror. Watch, sing and share the eight tattvas.">
<link rel="icon" href="{icon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Eczar:wght@500;600;700&family=Tiro+Devanagari+Sanskrit:ital@0;1&family=Mukta:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Serif+Telugu:wght@500;600&family=Noto+Sans+Kannada:wght@400;600&family=Noto+Serif+Kannada:wght@500;600&display=swap">
<style>
{css}
</style>
</head><body>
'''
arc=''.join(open(os.path.join(SRC,'arcade',x)).read()+'\n' for x in sorted(os.listdir(os.path.join(SRC,'arcade'))) if x.endswith('.js'))
js=tn+'\n'+mul+'\n'+e+'\n'+f+'\n'+arc+'\n'+app
html=head+body+'\n<script src="/vendor/three.min.js"></script>\n<script>\n'+js+'\n</script>\n</body></html>\n'
open(f'{OUT}/index.html','w').write(html)
print(len(html),'bytes written to index.html')
