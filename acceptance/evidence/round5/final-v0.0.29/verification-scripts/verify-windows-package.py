from pathlib import Path
import json,hashlib
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.29';d=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r512/delivery/v0.0.29')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
m=read(d/'build-manifest.json');i=read(d/'windows-installed-preflight.json');n=read(d/'windows-installer-preflight.json');pe=read(d/'windows-pe-icons.json');pair=read(e/'source-pair-proof.json')
assert pair['passed'] and i['passed'] and n['passed']
assert i['headSha']==pair['source']
for f,v in i['packagedHashes'].items():assert v==m['hashes'][f],f
assert len(i['packagedHashes'])==9
for k in ['installPreservesExistingData','sameVersionReinstallPreservesData','ordinaryUninstallPreservesData','isolationLauncherCheckOnly']:assert n[k],k
launcher=sha(d/'Start-Thoughtline-Isolated.ps1');assert launcher==m['inputVector']['files']['docs/delivery/Start-Thoughtline-Isolated.ps1']['sha256']
exe=sha(d/'Thoughtline-0.0.29-win-x64.exe')
assert pe['headSha']==pair['source']
installer=[x for x in pe['executables'] if x['file'].replace('\\','/').endswith('/Thoughtline-0.0.29-win-x64.exe')];assert len(installer)==1;assert installer[0]['executableSha256']==exe
proof={'passed':True,'source':pair['source'],'run':pair['windowsRun'],'installerSha256':exe,'installedPayloadHashes':i['packagedHashes'],'installedOutputCount':len(i['packagedHashes']),'installReinstallUninstallRetainsData':True,'deliveredInstallerMatchesInstallTimePeReceipt':True,'launcherRawCRLFMatchesWindowsManifest':True,'scope':'Actual NSIS and compiled payload in native hosted Windows; physical acceptance separate'}
(e/'windows-package-binding.json').write_text(json.dumps(proof,indent=2));print('Windows installed package binding passed',exe)
