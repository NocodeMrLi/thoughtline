from pathlib import Path
import json, re, math
out=Path(__file__).resolve().parent
definitions=re.findall(r"outline:'([^']+)',back:'([^']+)'",(out/'paperShape.ts').read_text())
assert len(definitions)==3
def sample(shape):
    tokens=re.findall(r'[MQCZ]|[-+]?(?:\d*\.\d+|\d+)',shape); points=[]; i=0; current=(0.,0.); start=None
    while i<len(tokens):
        command=tokens[i]; i+=1
        if command=='Z': points.append(start); current=start; continue
        size={'M':2,'Q':4,'C':6}[command]; args=list(map(float,tokens[i:i+size])); i+=size
        if command=='M': current=tuple(args); start=current; points.append(current); continue
        p0=current
        for n in range(1,10001):
            t=n/10000; u=1-t
            if command=='Q': p=tuple(u*u*p0[k]+2*u*t*args[k]+t*t*args[k+2] for k in range(2))
            else: p=tuple(u**3*p0[k]+3*u*u*t*args[k]+3*u*t*t*args[k+2]+t**3*args[k+4] for k in range(2))
            points.append(p)
        current=tuple(args[-2:])
    return points
polygons=[sample(shape) for shape,back in definitions]
def inside(point,points):
    x,y=point; yes=False
    for a,b in zip(points,points[1:]+points[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: yes=not yes
    return yes
def variant(id):
    h=2166136261
    for ch in id: h=((h^ord(ch))*16777619)&0xffffffff
    return h%3
def contains(r,b):return b['x']>=r['x']-.05 and b['y']>=r['y']-.05 and b['right']<=r['x']+r['width']+.05 and b['bottom']<=r['y']+r['height']+.05
result=json.loads((out/'after/result.json').read_text()); checks=[]; max_bottom=0
for i,(shape,back) in enumerate(definitions):
    bottom=max(max(y for x,y in polygons[i])+.2,max(y for x,y in sample(back))+.15); assert bottom<=226
    checks.append({'variant':i,'decorativeBottomWithStroke':bottom,'inside226Height':True}); max_bottom=max(max_bottom,bottom)
buttons=0
for scene in result['scenes']:
    for g in scene['geometry']:
        i=int(g['variant']); assert i==variant(g['id']) and g['outline']==definitions[i][0]
        assert g['contact']; paper=g['paper']
        for b in g['buttons']:
            assert b['width']==32 and b['height']==32 and contains(paper,b)
            assert any(contains(r,b) for r in scene['published']['rects'])
            corners=[(b[x]-paper['x'],b[y]-paper['y']) for x,y in [('x','y'),('right','y'),('right','bottom'),('x','bottom')]]
            assert all(inside(c,polygons[i]) for c in corners); buttons+=1
def rgb(h):return [int(h[i:i+2],16) for i in (1,3,5)]
def luminance(v):
    vals=[x/255 for x in v]; linear=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in vals]
    return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
colors=json.loads((out/'ink-contrast.json').read_text()); contrast=[]
for case in colors['cases']:
    bg=rgb('#F2F0E9' if case['theme']=='light' else '#B3AFA2')
    ratio=(luminance(bg)+.05)/(luminance(case['ink'])+.05); assert abs(ratio-case['ratio'])<1e-8
    contrast.append(ratio)
report={'sourceCommit':'54494df7cfecd26f109016861c3551f119e11613','scope':'Independent read-only dense parameter sampling of actual SVG paths and arithmetic on immutable renderer results; no app/browser/native run','variants':checks,'maximumDecorativeBottomWithStroke':max_bottom,'rendererButtonsChecked':buttons,'allFourCornersWithinSampledDrawnOutline':True,'allFull32pxButtonsInsideArticleAndPublishedHit':True,'fixedIdsMatchSourceHashFunction':True,'contrastTokenMin':min(contrast),'contrastScope':'Solid shipped --paper color vs computed ink, sRGB arithmetic; excludes paper gradients/composited pixel backgrounds and monitor measurement','beforeAfterIdentityScope':'Bodies/agents correspond; before counter IDs not identical to after fixed IDs, not a per-ID visual identity test'}
(out/'static-shape-check.json').write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report,indent=2))
