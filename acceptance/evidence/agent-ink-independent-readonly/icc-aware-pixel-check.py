"""Read-only PNG analysis: honor ICC in memory, preserve original image bytes."""
from pathlib import Path
import io,json,hashlib,struct,zlib
from PIL import Image,ImageCms
out=Path(__file__).resolve().parent
def luminance(rgb):
    values=[v/255 for v in rgb]
    return sum((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)*weight for v,weight in zip(values,[.2126,.7152,.0722]))
rows=[]; profiles=[]
for scene in json.loads((out/'after/result.json').read_text())['scenes']:
    path=out/'after'/scene['normal']['file']; originalHash=hashlib.sha256(path.read_bytes()).hexdigest()
    assert originalHash==scene['normal']['sha256']
    image=Image.open(path); icc=image.info['icc_profile']; profile=ImageCms.ImageCmsProfile(io.BytesIO(icc))
    converted=ImageCms.profileToProfile(image,profile,ImageCms.createProfile('sRGB'),outputMode='RGB')
    profiles.append({'theme':scene['theme'],'description':ImageCms.getProfileDescription(profile).strip(),'iccSha256':hashlib.sha256(icc).hexdigest()})
    for card in scene['geometry']['cards']:
        b=card['label']; region=converted.crop((int(b['x']),int(b['y']),int(b['x']+b['width']),int(b['y']+b['height'])))
        candidates=[p for p in region.getdata() if sum(p)<400]
        ink=min(candidates,key=luminance); paper=converted.getpixel((int(b['x']+b['width']-3),int(b['y']+b['height']/2)))
        rows.append({'theme':scene['theme'],'agent':card['agent'],'sRGBTextInterior':ink,'sRGBPaper':paper,'representativeContrastAfterICCNormalization':(luminance(paper)+.05)/(luminance(ink)+.05)})
    assert hashlib.sha256(path.read_bytes()).hexdigest()==originalHash
report={'sourceCommit':'796bbeaac9ba3d2f2895dd26b7fab695b620d735','evidenceCommit':'764bec916db7e9e3fb823c56499c046ebf597ba7','scope':'Read-only original PNG with embedded ICC normalized in memory to sRGB before representative contrast; originals unchanged; not AA-edge minimum or monitor measurement','profiles':profiles,'rows':rows}
(out/'icc-aware-pixel-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
