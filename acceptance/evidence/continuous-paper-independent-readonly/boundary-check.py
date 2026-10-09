import json, re, math, hashlib, subprocess
from pathlib import Path

out=Path(__file__).resolve().parent
source=(out/'ClipCard.tsx').read_text()
shape=re.search(r'<path id=\{`\$\{paperId\}-outline`\} d="([^"]+)"',source).group(1)
tokens=re.findall(r'[MQCZ]|[-+]?(?:\d*\.\d+|\d+)',shape)
points=[]; i=0; current=(0.,0.); start=None
while i<len(tokens):
    command=tokens[i]; i+=1
    if command=='Z': points.append(start); current=start; continue
    size={'M':2,'Q':4,'C':6}[command]
    args=list(map(float,tokens[i:i+size])); i+=size
    if command=='M': current=tuple(args); start=current; points.append(current); continue
    p0=current
    for n in range(1,10001):
        t=n/10000; u=1-t
        if command=='Q': point=tuple(u*u*p0[k]+2*u*t*args[k]+t*t*args[k+2] for k in range(2))
        else: point=tuple(u**3*p0[k]+3*u*u*t*args[k]+3*u*t*t*args[k+2]+t**3*args[k+4] for k in range(2))
        points.append(point)
    current=tuple(args[-2:])
def inside(point):
    x,y=point; contained=False
    for a,b in zip(points,points[1:]+points[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: contained=not contained
    return contained
footer=json.loads((out/'footer-result.json').read_text()); p=footer['geometry']['paper']
def rect_contains(r,b): return b['x']>=r['x']-.05 and b['y']>=r['y']-.05 and b['right']<=r['x']+r['width']+.05 and b['bottom']<=r['y']+r['height']+.05
buttons=[]
for b in footer['geometry']['buttons']:
    assert rect_contains(p,b)
    assert any(rect_contains(r,b) for r in footer['published']['rects'])
    corners=[(b[x]-p['x'],b[y]-p['y']) for x,y in [('x','y'),('right','y'),('right','bottom'),('x','bottom')]]
    buttons.append({'label':b['label'],'localCorners':corners,'cornersInsideDrawnOutline':[inside(c) for c in corners],'insideArticleAndPublishedHit':True})
index=json.loads((out/'evidence-sha256.json').read_text()); verified=[]
for name,expected in index.items():
    data=subprocess.check_output(['git','show','427a26e99ab79a53bc9db561d8bacf9ff53419be:acceptance/evidence/curved-paper-review/'+name],cwd=out.parent/'qa-thoughtline')
    actual=hashlib.sha256(data).hexdigest(); assert actual==expected; verified.append(name)
ymax=max(y for x,y in points)
report={'sourceCommit':'d9a9cd013fb879a9f11065db8dabec73882c41df','scope':'Read-only evidence arithmetic and dense sampling of actual SVG path; no app/native run','artifactIndexEntriesVerified':len(verified),'shape':shape,'sampledOutlineBounds':{'minX':min(x for x,y in points),'maxX':max(x for x,y in points),'minY':min(y for x,y in points),'maxY':ymax},'articleHeight':226,'decorativeBottomBeyondArticle':ymax-226,'maximumOutlineBottomIncluding4DIPStack':32+30+6+ymax+4,'shelfViewportHeight':340,'buttons':buttons,'interpretation':'Original 13DIP footer overflow resolved at article/published-IPC rectangle scope. These rectangles do not prove exact drawn-outline containment or physical click-through; minor curved silhouette differences are separately recorded, not classified as data/interaction failure.'}
(out/'boundary-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
