#!/usr/bin/env python3
"""Export approved TL artwork without changing source RGB. Requires Pillow and numpy."""
from pathlib import Path
import hashlib, json, math, struct
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
SPEC = json.loads((ASSETS / 'source/tile-contour-v11.json').read_text())
SOURCE = ASSETS / 'source' / SPEC['source']
EXPECTED = '313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED
original = Image.open(SOURCE).convert('RGB')
assert list(original.size) == SPEC['sourceSize']

def silhouette(anchors):
    """Dense smooth closed curve; only geometry, never source pixel colors."""
    p = np.asarray(anchors, dtype=float)
    result = []
    count = len(p)
    for i in range(count):
        previous, start, end, following = p[(i-1)%count], p[i], p[(i+1)%count], p[(i+2)%count]
        before, chord, after = np.linalg.norm(start-previous), np.linalg.norm(end-start), np.linalg.norm(following-end)
        m0 = (end-previous) * chord / (before+chord)
        m1 = (following-start) * chord / (chord+after)
        steps = max(16, int(chord*2))
        for t in np.linspace(0,1,steps,endpoint=False):
            result.append(tuple((2*t**3-3*t**2+1)*start+(t**3-2*t**2+t)*m0+(-2*t**3+3*t**2)*end+(t**3-t**2)*m1))
    return result

points = silhouette(SPEC['anchors'])
scale = SPEC['rasterScale']
mask = Image.new('L', (original.width*scale, original.height*scale), 0)
ImageDraw.Draw(mask).polygon([(round(x*scale), round(y*scale)) for x,y in points], fill=255)
mask = mask.resize(original.size, Image.Resampling.BOX)
source = original.convert('RGBA')
source.putalpha(mask)
source.save(ASSETS / 'source/thoughtline-tl-v11-transparent-1254.png')
assert np.array_equal(np.asarray(source)[:,:,:3], np.asarray(original)), 'RGB was changed'
assert mask.getpixel((627,600)) == 255
assert mask.getbbox()[0] > 40 and mask.getbbox()[1] > 40
assert mask.getbbox()[2] < 1210 and mask.getbbox()[3] < 1210

# Extra canvas is transparent margin, never an enlargement of source artwork.
canvas = Image.new('RGBA', (SPEC['paddedCanvas'],)*2, (0,0,0,0))
canvas.paste(source, tuple(SPEC['originalOffset']))
canvas.save(ASSETS / 'source/thoughtline-tl-v11-padded-master.png')
icons = ASSETS / 'icons'
icons.mkdir(exist_ok=True)
SIZES = [16,24,32,48,64,128,256,512,1024]
for size in SIZES:
    canvas.resize((size,size), Image.Resampling.LANCZOS).save(icons/f'app-{size}.png')
Image.open(icons/'app-1024.png').save(ASSETS/'app-icon.png')
# PNG-backed multi-resolution Windows icon, each frame from the same padded source.
canvas.save(ASSETS/'app-icon.ico', format='ICO', sizes=[(s,s) for s in [16,24,32,48,64,128,256]], append_images=[Image.open(icons/f'app-{s}.png') for s in [16,24,32,48,64,128,256]])
# Standard ICNS: separate straight RGB/alpha for 16/32; PNG for larger/Retina.
# This avoids the system converter's premultiplied ARGB small-icon representation.
entries = []
for size,rgb_tag,alpha_tag in [(16,b'is32',b's8mk'),(32,b'il32',b'l8mk')]:
    pixels = np.asarray(Image.open(icons/f'app-{size}.png').convert('RGBA'))
    rgb = b''
    for channel in range(3):
        values = pixels[:,:,channel].tobytes()
        for offset in range(0,len(values),128):
            literal = values[offset:offset+128]
            rgb += bytes([len(literal)-1]) + literal
    entries.extend([(rgb_tag,rgb),(alpha_tag,pixels[:,:,3].tobytes())])
for kind,size in [(b'ic07',128),(b'ic08',256),(b'ic09',512),(b'ic10',1024),(b'ic11',32),(b'ic12',64),(b'ic13',256),(b'ic14',512)]:
    entries.append((kind,(icons/f'app-{size}.png').read_bytes()))
body = b''.join(kind+struct.pack('>I',len(payload)+8)+payload for kind,payload in entries)
(ASSETS/'app-icon.icns').write_bytes(b'icns'+struct.pack('>I',len(body)+8)+body)

# Coordinated tray silhouette: trace the same T, L, and angled peg, omit ivory tile
# and tiny material details for menu-bar legibility. Geometry is deliberately monochrome.
def rounded_polygon(bounds, radius, angle=0, center=None):
    x0,y0,x1,y1=bounds
    result=[]
    for cx,cy,start in [(x1-radius,y0+radius,-90),(x1-radius,y1-radius,0),(x0+radius,y1-radius,90),(x0+radius,y0+radius,180)]:
        for a in np.linspace(start,start+90,25):
            result.append((cx+radius*math.cos(math.radians(a)),cy+radius*math.sin(math.radians(a))))
    if angle:
        cx,cy=center;theta=math.radians(angle)
        result=[(cx+(x-cx)*math.cos(theta)-(y-cy)*math.sin(theta),cy+(x-cx)*math.sin(theta)+(y-cy)*math.cos(theta)) for x,y in result]
    return result

def tray(size, color=False):
    ss=8
    image=Image.new('RGBA',(size*ss,size*ss),(0,0,0,0))
    draw=ImageDraw.Draw(image)
    if color:
        # Warm opaque backplate keeps dark ink legible on both light/dark Windows taskbars.
        draw.rounded_rectangle((ss,ss,(size-1)*ss,(size-1)*ss),radius=size*ss*.22,fill=(249,245,236,255))
    # Use uniform 1000x1000 source scale; center the 750px glyph region vertically.
    def transform(points):
        return [((x-100)/1000*(size-2)*ss+ss,(y-210+125)/1000*(size-2)*ss+ss) for x,y in points]
    ink=(0,66,72,255) if color else (0,0,0,255)
    for box in [(327,382,636,498),(359,440,492,880),(680,382,818,880),(680,763,1052,880)]:
        draw.polygon(transform(rounded_polygon(box,38)),fill=ink)
    peg=rounded_polygon((132,321,374,407),14,30,(253,364))
    draw.polygon(transform(peg),fill=(240,72,64,255) if color else ink)
    # The silver band is a negative-space stripe in a monochrome template.
    band=rounded_polygon((243,318,254,410),3,30,(253,364))
    draw.polygon(transform(band),fill=(210,215,211,255) if color else (0,0,0,0))
    return image.resize((size,size),Image.Resampling.LANCZOS)

for size,density in [(16,72),(32,144)]:
    tray(size).save(ASSETS/('trayTemplate.png' if size==16 else 'trayTemplate@2x.png'),dpi=(density,density))
for size in [16,24,32,48,64,128,256]:
    tray(size,color=True).save(icons/f'tray-win-{size}.png')
tray(256,color=True).save(ASSETS/'tray-win.ico',format='ICO',sizes=[(s,s) for s in [16,24,32,48,64,128,256]],append_images=[Image.open(icons/f'tray-win-{s}.png') for s in [16,24,32,48,64,128,256]])
print(json.dumps({'sourceRGBPreserved':True,'sourceAlphaBounds':mask.getbbox(),'appPNG':SIZES,'ICNS':'assets/app-icon.icns','ICO':'assets/app-icon.ico','templateSizes':[16,32],'windowsTrayICO':'assets/tray-win.ico'}))
