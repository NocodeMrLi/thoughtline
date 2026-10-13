from pathlib import Path
import json,hashlib,shutil
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.30';d=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r513-r516/delivery/v0.0.30');m=json.loads((d/'mac-build-manifest.json').read_text());assert json.loads((e/'release-verification.json').read_text())['passed'];assert json.loads((e/'mac-package-binding.json').read_text())['passed']
assert hashlib.sha256((d/'Thoughtline-0.0.30-mac-arm64.dmg').read_bytes()).hexdigest()==m['dmgSha256']
app=r/'dist/mac-arm64/Thoughtline.app';assert hashlib.sha256((app/'Contents/Resources/app.asar').read_bytes()).hexdigest()==m['appAsarSha256']
archive=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r513-r516/archive/final-mac-staging-metadata');archive.mkdir(exist_ok=True);removed=[]
for name in ['Thoughtline-0.0.30-mac-arm64.dmg.blockmap','mac-build-manifest.json','mac-signature-verification.json','builder-debug.yml','latest-mac.yml']:
 p=r/'dist'/name
 if p.exists():shutil.copy2(p,archive/name);assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256((archive/name).read_bytes()).digest();p.unlink();removed.append(str(p.relative_to(r)))
p=r/'dist/Thoughtline-0.0.30-mac-arm64.dmg';assert hashlib.sha256(p.read_bytes()).hexdigest()==m['dmgSha256'];p.unlink();removed.append(str(p.relative_to(r)));shutil.rmtree(r/'dist/mac-arm64');removed.append('dist/mac-arm64')
mount=Path('/tmp/thoughtline-r513-r516-dmg-mount');mount.rmdir()
for row in json.loads((e/'local-historical-dist-before.json').read_text()):assert hashlib.sha256((r/row['file']).read_bytes()).hexdigest()==row['sha256'],row['file']
(e/'mac-staging-cleanup.json').write_text(json.dumps({'passed':True,'removedOwnedStaging':removed,'deliveryDmgVerifiedBeforeRetirement':True,'historicalLocalPackagesUnchanged':True,'mountRemoved':True},indent=2));print('Owned Mac staging retired; final delivery and unrelated history retained')
