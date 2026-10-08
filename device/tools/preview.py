import json,sys
from PIL import Image
M=json.load(open('out/manifest.json'));by={m['id']:m for m in M['man']}
C={'gold':(244,183,58),'ink':(247,235,211),'muted':(180,171,207),'w':(247,235,211)}
def comp(id):
  bg=Image.new('RGB',(368,448),(21,18,58))
  for L in by[id]['layers']:
    im=Image.open('out/'+L['file']).convert('RGBA');a=im.split()[3];col=Image.new('RGB',im.size,C[L['color']]);bg.paste(col,(0,0),a)
  return bg
ids=sys.argv[2:];W=368;m=Image.new('RGB',(W*len(ids),448))
for i,id in enumerate(ids):m.paste(comp(id),(i*W,0))
m.save(sys.argv[1])
