from pathlib import Path
import json,shutil,subprocess,hashlib,os
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.31';d=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r517/delivery/v0.0.31');a=d.parents[1]/'archive';m=json.loads((r/'dist/mac-build-manifest.json').read_text());old=json.loads((a/'first-mac-candidate/mac-build-manifest.json').read_text());assert m['appAsarSha256']==old['appAsarSha256'] and m['hashes']==old['hashes']
assert m['actualMacBuildSource']==subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
mount='/tmp/thoughtline-r517-dmg-mount';subprocess.run(['/usr/bin/hdiutil','attach',str(r/'dist/Thoughtline-0.0.31-mac-arm64.dmg'),'-readonly','-nobrowse','-mountpoint',mount],check=True)
try:
 subprocess.run(['node',str(e/'verification-scripts/bind-mac.cjs')],check=True)
 env=dict(os.environ,THOUGHTLINE_EXECUTABLE=mount+'/Thoughtline.app/Contents/MacOS/Thoughtline',THOUGHTLINE_EVIDENCE_DIR=str(e/'final-export-recheck2'))
 with (e/'final-logs/packaged-final-export2.log').open('w') as log:subprocess.run(['node','tests/electron/round5-export-workflow.cjs'],env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
finally:subprocess.run(['/usr/bin/hdiutil','detach',mount],check=True)
checks=list((e/'final-export-recheck2').glob('*/receipt.json'));assert len(checks)==1 and json.loads(checks[0].read_text())['passed']
for n in ['Thoughtline-0.0.31-mac-arm64.dmg','mac-build-manifest.json','mac-signature-verification.json']:shutil.copy2(r/'dist'/n,d/n)
p=d/'Start-Thoughtline-Isolated-Mac.command';dest=a/('launcher-'+hashlib.sha256(p.read_bytes()).hexdigest()+'.command');assert not dest.exists();shutil.move(p,dest)
subprocess.run(['node','scripts/generate-mac-isolated-launcher.cjs'],env=dict(os.environ,THOUGHTLINE_DELIVERY_DIR=str(d)),check=True)
with (e/'final-logs/mac-launcher-check.log').open('w') as log:subprocess.run(['/bin/zsh',str(p),'--check-only'],stdout=log,stderr=subprocess.STDOUT,check=True)
for n in ['user-data','mount']:(d/'isolated-experience'/n).rmdir()
(d/'isolated-experience').rmdir()
p=e/'mac-final-verification.json';s=json.loads(p.read_text());s.update(source=m['actualMacBuildSource'],actualDmgBinding=json.loads((e/'mac-package-binding.json').read_text()),currentExportRecheck=str(checks[0]),isolatedLauncherCheckOnlyPassed=True);p.write_text(json.dumps(s,indent=2));print('Final Mac provenance/identical payload/export/launcher passed',m['actualMacBuildSource'])
