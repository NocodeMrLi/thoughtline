# coding: utf-8
from pathlib import Path
import json,hashlib,shutil,re
repo=Path('/Users/lihongwei/Desktop/晾念头 : Thoughtline/app');final=repo/'acceptance/evidence/round4/final-v0.0.27';raw=Path('/tmp/thoughtline-classification-win-final-installer');evidence=repo/'acceptance/evidence/round4/classification-windows-final-38239196630';delivery=Path('/Users/lihongwei/Documents/Codex/2026-10-12/thoughtline-round4-repair/delivery/v0.0.27');source='787a770328ceef4b6013f56f5f9eea9dbdf8ecf6';run='38239196630'
def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,d): (final/name).write_text(json.dumps(d,ensure_ascii=False,indent=2))
ci=load(final/'windows-final-run.json');assert ci['status']=='completed' and ci['conclusion']=='success' and ci['headSha']==source and str(ci['databaseId'])==run
log=(final/'windows-full.log').read_text();plain=re.sub(r'(?:\x1b|\^\[)\[[0-9;]*m','',log);assert re.search(r'Tests\s+345 passed',plain)
m=load(raw/'build-manifest.json');assert m['headSha']==m['actualWinBuildSource']==source;assert m['version']=='0.0.27' and m['runId']==run
mac=load(final/'mac-build-manifest.json');assert mac['actualMacBuildSource']==source;mv,wv=mac['inputVector'],m['inputVector'];assert mv['count']==wv['count']==317;assert mv['vectorSha256']==wv['vectorSha256'];assert mv['files'].keys()==wv['files'].keys();different=[]
for name,a in mv['files'].items():
 b=wv['files'][name];assert a['mode']==b['mode'] and a['blob']==b['blob'];assert sha(repo/name)==a['sha256']
 if a['sha256']!=b['sha256']:
  assert hashlib.sha256((repo/name).read_bytes().replace(b'\r\n',b'\n').replace(b'\n',b'\r\n')).hexdigest()==b['sha256'],name;different.append(name)
write('source-pair-proof.json',{'passed':True,'source':source,'windowsRun':run,'count':317,'canonicalVectorSha256':mv['vectorSha256'],'canonicalMatch':True,'rawDifferencesAreVerifiedCRLFOnly':True,'sourceCRLFDifferences':different,'crlfDifferenceCount':len(different)})
installed=load(raw/'windows-installed-preflight.json');pre=load(raw/'windows-installer-preflight.json');icons=load(raw/'windows-pe-icons.json')
for d in [installed,pre,icons]:assert d['passed'] and d['headSha']==source
assert installed['version']=='0.0.27';assert all(m['hashes'][name]==value for name,value in installed['packagedHashes'].items());assert len(installed['packagedHashes'])==9
assert pre['installPreservesExistingData'] and pre['sameVersionReinstallPreservesData'] and pre['ordinaryUninstallPreservesData'] and pre['isolationLauncherCheckOnly'];assert pre['appFileVersion']=='0.0.27'
installer=raw/'Thoughtline-0.0.27-win-x64.exe';digest=sha(installer);iconInstallers=[x for x in icons['executables'] if x['file'].replace('\\','/').endswith('/'+installer.name)];assert len(iconInstallers)==1 and iconInstallers[0]['executableSha256']==digest;assert all(x['passed'] for x in icons['executables']);assert sha(raw/'Start-Thoughtline-Isolated.ps1')==m['hashes']['docs/delivery/Start-Thoughtline-Isolated.ps1']
write('windows-package-binding.json',{'passed':True,'source':source,'run':run,'installerSha256':digest,'installedPayloadHashes':installed['packagedHashes'],'installedOutputCount':9,'installReinstallUninstallRetainsData':True,'deliveredInstallerMatchesInstallTimePeReceipt':True,'launcherRawCRLFMatchesWindowsManifest':True,'scope':'actual NSIS and compiled payload in native hosted Windows; physical acceptance separate'})
for sourceName,target in [('build-manifest.json','windows-build-manifest.json'),('windows-installed-preflight.json','windows-installed-preflight.json'),('windows-installer-preflight.json','windows-installer-preflight.json'),('windows-pe-icons.json','windows-pe-icons.json')]:shutil.copy2(raw/sourceName,final/target);shutil.copy2(raw/sourceName,delivery/target)
for name in [installer.name,'Start-Thoughtline-Isolated.ps1']:shutil.copy2(raw/name,delivery/name);assert sha(delivery/name)==sha(raw/name)
suites={}
for kind in ['source','packaged']:
 for name,prefix,count in [('workflow','run-',11),('ui','ui-',18),('visual','visual-',71),('vine','vine-',13)]:
  base=evidence/'round4'/('windows-'+kind);paths=list(base.glob(prefix+'*/receipt.json'));assert len(paths)==1,paths;d=load(paths[0]);assert d['passed'] and d['normalQuit'] and d['profileRemoved'];n=len(d['checks']) if isinstance(d['checks'],list) else d['checks'];assert n==count;target='windows-'+kind+'-'+name+'.json';shutil.copy2(paths[0],final/target);suites[kind+'-'+name]={'checks':n,'receipt':str(paths[0].relative_to(repo))}
 for name,prefix,count in [('appearance','appearance-',14),('reader','reader-',10)]:
  base=evidence/'round3'/('windows-'+kind);paths=list(base.glob(prefix+'*/receipt.json'));assert len(paths)==1,paths;d=load(paths[0]);assert d['passed'] and d['normalQuit'] and d['profileRemoved'];assert len(d['checks'])==count;target='windows-'+kind+'-'+name+'.json';shutil.copy2(paths[0],final/target);suites[kind+'-'+name]={'checks':count,'receipt':str(paths[0].relative_to(repo))}
write('windows-final-suites.json',{'passed':True,'run':run,'source':source,'unitPassed':345,'typecheck':True,'build':True,'suites':suites,'allSourceAndPackagedSteps':'windows-final-run.json','scope':'Native hosted source and actual package; physical/user acceptance separate'})
print(json.dumps({'installer':digest,'crlf':len(different),'suites':suites},ensure_ascii=False,indent=2))
