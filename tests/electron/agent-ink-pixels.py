"""Read-only screenshot analysis; never edits images or reads user data."""
from pathlib import Path
import json, hashlib
from PIL import Image
root=Path(__file__).resolve().parents[2]/'acceptance/evidence/agent-ink-review'
def lum(rgb):
    c=[v/255 for v in rgb];c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
    return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
for stage in ['before','after']:
    folder=root/stage; report=json.loads((folder/'result.json').read_text()); rows=[]
    for scene in report['scenes']:
        file=folder/scene['normal']['file'];assert hashlib.sha256(file.read_bytes()).hexdigest()==scene['normal']['sha256']
        image=Image.open(file).convert('RGB')
        for card in scene['geometry']['cards']:
            b=card['label'];region=image.crop((int(b['x']),int(b['y']),int(b['x']+b['width']),int(b['y']+b['height'])))
            # Exclude the paper, inspect the darkest text interior sample rather than blending AA edge pixels.
            values=list(region.get_flattened_data());text=[rgb for rgb in values if sum(rgb)<400];ink=min(text,key=lum)
            paper=image.getpixel((int(b['x']+b['width']-3),int(b['y']+b['height']/2)))
            ratio=(lum(paper)+.05)/(lum(ink)+.05)
            rows.append({'theme':scene['theme'],'agent':card['agent'],'computed':card['computedStyle'],'resolvedRgb':card['inkRgb'],'darkestObservedTextInteriorPixel':ink,'nearbyCompositedPaperPixel':paper,'representativePixelContrast':ratio,'observedChannelSpread':max(ink)-min(ink)})
    (folder/'pixel-observation.json').write_text(json.dumps({'scope':'actual PNG representative dark text interior vs nearby composited upper paper pixel; NOT minimum across all antialias pixels or display measurement; source-model bound excludes lower paper curve and pressure shadow because labels sit below pressure and above curve','rows':rows},ensure_ascii=False,indent=2)+'\n')
    print(stage,[(r['theme'],r['agent'],r['darkestObservedTextInteriorPixel'],round(r['representativePixelContrast'],3)) for r in rows])
