from pathlib import Path
import json, io
from PIL import Image, ImageCms
p=Path(__file__).resolve().parent
out=[]
def load(name):
 im=Image.open(p/name)
 profile=im.info.get("icc_profile")
 if profile:
  im=ImageCms.profileToProfile(im.convert("RGB"),ImageCms.ImageCmsProfile(io.BytesIO(profile)),ImageCms.createProfile("sRGB"),outputMode="RGB")
 else: im=im.convert("RGB")
 return im
for name in ["glass-light-stripe-background","glass-light-alternate-background"]:
 front=load(name+".png");back=load(name+"-backdrop-reference.png")
 # Own backdrop is 16 DIP beyond own compositor crop on each side, both DPR 2.
 foreground=[front.getpixel((x,390)) for x in range(40,500)]
 reference=[back.getpixel((x+32,422)) for x in range(40,500)]
 def changes(row):return sum(sum(abs(a-b) for a,b in zip(row[i],row[i-1]))/3 for i in range(1,len(row)))/(len(row)-1)
 f,b=changes(foreground),changes(reference)
 assert b>1 and f<b*.2,(f,b)
 out.append({"scene":name,"roiDIP":{"x":[20,250],"y":195},"referenceOffsetDIP":[16,16],"meanAdjacentRGBStepSrgb":f,"ownSharpBackdropMeanAdjacentRGBStepSrgb":b,"ratio":f/b})
a=load("glass-light-stripe-background.png");b=load("glass-light-alternate-background.png")
 delta=sum(sum(abs(x-y) for x,y in zip(a.getpixel((i,390)),b.getpixel((i,390))))/3 for i in range(40,500))/460
assert delta>5,delta
result={"scope":"ICC-normalized own compositor crop vs own sharp backdrop reference in one fixed empty horizontal band; evidence of background response and suppression of sharp stripes, not a universal blur or contrast guarantee","srgbBackgroundChangeMeanAbsoluteRGB":delta,"samples":out}
(p/"background-response-check.json").write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result,indent=2))
