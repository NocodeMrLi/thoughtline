# SPDX-License-Identifier: GPL-3.0-only
#!/usr/bin/env python3
"""Offline resource verification and actual decoded inspection sheets. No Electron launch."""
from pathlib import Path
import hashlib, json, struct, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'acceptance/evidence/icon-final';E.mkdir(parents=True,exist_ok=True)
A=ROOT/'assets'
font=ImageFont.truetype('/System/Library/Fonts/SFNS.ttf',18)
source=Image.open(A/'source/thoughtline-tl-v11-transparent-1254.png').convert('RGBA')
original=Image.open(A/'source/approved-TL-brand-logo.jpg').convert('RGB')
rgba=np.asarray(source);alpha=source.getchannel('A')
assert np.array_equal(rgba[:,:,:3],np.asarray(original))
assert alpha.getbbox()==(52,57,1202,1193)
assert alpha.getpixel((627,600))==255
assert np.all(rgba[:24,:,3]==0) and np.all(rgba[-24:,:,3]==0)
assert np.all(rgba[:,:24,3]==0) and np.all(rgba[:,-24:,3]==0)
binary=alpha.point(lambda a:255 if a else 0)
ImageDraw.floodfill(binary,(627,600),128)
assert binary.histogram()[255]==0,'Detached alpha islands'
holes=alpha.point(lambda a:255 if a else 0)
ImageDraw.floodfill(holes,(0,0),128)
assert holes.histogram()[0]==0,'Transparent holes inside tile'

def equality(actual,expected):
    actual=actual.convert('RGBA');expected=expected.convert('RGBA')
    assert actual.size==expected.size
    # RGB in fully transparent container pixels is immaterial; compare every visible pixel.
    a,b=np.asarray(actual),np.asarray(expected)
    assert np.array_equal(a[:,:,3],b[:,:,3]),'Alpha changed in container'
    assert np.array_equal(a[:,:,:3][a[:,:,3]>0],b[:,:,:3][b[:,:,3]>0]),'Visible RGB changed in container'

expectedIco=[16,24,32,48,64,128,256]
container={}
decoded={}
for filename,prefix in [('app-icon.ico','app'),('tray-win.ico','tray-win')]:
    im=Image.open(A/filename)
    assert sorted(w for w,h in im.info['sizes'])==expectedIco
    frames={}
    for size in expectedIco:
        frame=im.ico.getimage((size,size)).convert('RGBA')
        equality(frame,Image.open(A/f'icons/{prefix}-{size}.png'))
        frames[str(size)]={'dimensions':list(frame.size),'visibleRGBAndAlphaMatchPNG':True}
        decoded[(prefix,size)]=frame.copy()
    container[filename]=frames

with tempfile.TemporaryDirectory(prefix='thoughtline-icns-decode-') as temp:
    iconset=Path(temp)/'decoded.iconset'
    subprocess.run(['/usr/bin/iconutil','-c','iconset',str(A/'app-icon.icns'),'-o',str(iconset)],check=True)
    frames={}
    for path in sorted(iconset.glob('*.png')):
        im=Image.open(path).convert('RGBA');size=im.width
        assert im.width==im.height and size in [16,32,64,128,256,512,1024]
        equality(im,Image.open(A/f'icons/app-{size}.png'))
        frames[path.name]={'dimensions':list(im.size),'visibleRGBAndAlphaMatchPNG':True}
        decoded[('icns',size)]=im.copy()
    assert {v['dimensions'][0] for v in frames.values()}=={16,32,64,128,256,512,1024}
    container['app-icon.icns']=frames

for size,dpi,path in [(16,72,'trayTemplate.png'),(32,144,'trayTemplate@2x.png')]:
    im=Image.open(A/path);assert im.size==(size,size)
    a=np.asarray(im.convert('RGBA'));assert np.all(a[:,:,:3][a[:,:,3]>0]==0)
    assert all(abs(x-dpi)<.1 for x in im.info['dpi'])
pkg=json.loads((ROOT/'package.json').read_text())
assert pkg['build']['mac']['icon']=='assets/app-icon.icns'
assert pkg['build']['win']['icon']=='assets/app-icon.ico'
for key in ['installerIcon','uninstallerIcon','installerHeaderIcon']:
    assert pkg['build']['nsis'][key]=='assets/app-icon.ico'
assert 'assets/**/*' in pkg['build']['files']
assert pkg['build']['nsis']['deleteAppDataOnUninstall'] is False
assert pkg['build']['win']['signExecutable'] is False
compiled=(ROOT/'out/main/index.js').read_text() if (ROOT/'out/main/index.js').exists() else ''
assert 'tray-win.ico' in compiled and 'trayTemplate.png' in compiled,'Compile before resource validation'

# Actual PNGs and decoded container images, all at native pixels plus explicitly labeled enlargement.
def composite(sheet,image,xy): sheet.paste(image,xy,image)
sheet=Image.new('RGB',(1600,820),'#fbfbfb');draw=ImageDraw.Draw(sheet)
for row,bg in enumerate(['#fbfbfb','#20242c']):
    y=row*410;draw.rectangle((0,y,1600,y+410),fill=bg)
    for col,size in enumerate([16,24,32,48,64,128,256]):
        x=18+col*220;im=Image.open(A/f'icons/app-{size}.png').convert('RGBA')
        draw.text((x,y+14),f'{size}px / PNG',font=font,fill='#758599')
        composite(sheet,im,(x,y+55))
        if size<=64:
            draw.text((x,y+90),'4x nearest',font=font,fill='#758599')
            composite(sheet,im.resize((size*4,size*4),Image.Resampling.NEAREST),(x,y+122))
sheet.save(E/'app-sizes-light-dark.png')
for size in [512,1024]:
    for name,bg in [('light','#fbfbfb'),('dark','#20242c')]:
        im=Image.open(A/f'icons/app-{size}.png').convert('RGBA')
        bgim=Image.new('RGB',im.size,bg);composite(bgim,im,(0,0));bgim.save(E/f'app-{size}-{name}.png')

edges=Image.new('RGB',(1320,1400),'#20242c');draw=ImageDraw.Draw(edges)
for i,(label,box) in enumerate([('top-left',(30,35,350,355)),('top-right',(905,35,1225,355)),('bottom-left',(30,885,350,1205)),('bottom-right',(905,885,1225,1205))]):
    x=(i%2)*660;y=(i//2)*700
    draw.text((x+12,y+12),label+' / 2x nearest',font=font,fill='#aabbce')
    crop=source.crop(box).resize((640,640),Image.Resampling.NEAREST)
    composite(edges,crop,(x+10,y+50))
edges.save(E/'tile-corners-dark-2x.png')
# Local contour overlay on the unmodified original RGB, for comparison only.
spec=json.loads((A/'source/tile-contour-v11.json').read_text())
overlay=original.copy();draw=ImageDraw.Draw(overlay)
for x,y in spec['anchors']:draw.ellipse((x-4,y-4,x+4,y+4),fill='#ff00cc')
overlay.save(E/'source-contour-anchors.png')

sheet=Image.new('RGB',(960,420),'#fbfbfb');draw=ImageDraw.Draw(sheet)
for row,bg in enumerate(['#fbfbfb','#20242c']):
    y=row*210;draw.rectangle((0,y,960,y+210),fill=bg)
    for col,(label,im) in enumerate([('Mac16',Image.open(A/'trayTemplate.png').convert('RGBA')),('Mac32@2x',Image.open(A/'trayTemplate@2x.png').convert('RGBA')),('Win16 ICO',decoded[('tray-win',16)].copy()),('Win32 ICO',decoded[('tray-win',32)].copy())]):
        if row and label.startswith('Mac'):
            values=np.array(im);values[:,:,:3]=255;im=Image.fromarray(values)
        x=col*240+10;draw.text((x,y+12),label,font=font,fill='#758599')
        composite(sheet,im,(x,y+48));draw.text((x,y+90),'4x nearest',font=font,fill='#758599')
        composite(sheet,im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST),(x+70,y+50))
sheet.save(E/'tray-sizes-light-dark-simulation.png')
sheet=Image.new('RGB',(960,260),'#20242c');draw=ImageDraw.Draw(sheet)
for col,(kind,size) in enumerate([('app',16),('app',32),('icns',16),('icns',32)]):
    im=decoded[(kind,size)];x=col*240+10;draw.text((x,10),f'{kind} decoded {size}px',font=font,fill='#aabbce')
    composite(sheet,im,(x,45));composite(sheet,im.resize((size*4,size*4),Image.Resampling.NEAREST),(x+65,55))
sheet.save(E/'decoded-container-16-32.png')

assets={}
for p in sorted(A.rglob('*')):
    if p.is_file():assets[str(p.relative_to(ROOT))]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
report={'originalSHA256':hashlib.sha256((A/'source/approved-TL-brand-logo.jpg').read_bytes()).hexdigest(),'sourceSize':list(source.size),'sourceRGBExactMatch':True,'sourceAlphaBounds':list(alpha.getbbox()),'sourceOpaquePixels':alpha.histogram()[255],'sourcePartialPixels':sum(alpha.histogram()[1:255]),'sourceTransparentPixels':alpha.histogram()[0],'alphaSingleConnectedTile':True,'alphaNoInteriorHoles':True,'tileMarginAt1024':list(Image.open(A/'app-icon.png').getchannel('A').getbbox()),'PNGDimensions':[16,24,32,48,64,128,256,512,1024],'containers':container,'MacTemplate':{'logical16':[16,16],'retina2x':[32,32],'DPI':[72,144],'monochromeRGB':True},'platformPackagingPathsVerified':True,'compiledTrayPathsVerified':True,'assets':assets,'nativeDesktopLaunched':False,'realMacMenuBarTest':False,'realWindowsTaskbarTest':False,'installationOrPublication':False,'scope':'Offline original RGB/alpha topology, every ICO and ICNS frame decoded and compared, asset sheets. Actual visual sheet review recorded separately.'}
(E/'resource-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sourceRGBExactMatch':True,'sourcePartialPixels':report['sourcePartialPixels'],'ICOFrames':len(container['app-icon.ico']),'WindowsTrayFrames':len(container['tray-win.ico']),'ICNSRepresentations':len(container['app-icon.icns']),'alphaSingleConnectedTile':True,'alphaNoInteriorHoles':True,'compiledPaths':True}))
