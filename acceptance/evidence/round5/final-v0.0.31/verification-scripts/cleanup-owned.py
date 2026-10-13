from pathlib import Path
import json,subprocess,tempfile,os,zipfile,hashlib,shutil
repo=Path.cwd();base=repo/'acceptance/evidence/round5';archive=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r517/archive');temp=Path(tempfile.gettempdir()).resolve();candidates=set();origins={}
roots=['export','final-source-0.0.31','final-packaged-0.0.31','final-v0.0.31/diagnostics-mac','final-v0.0.31/arrange-idle-red','final-v0.0.31/arrange-idle-green','final-v0.0.31/final-export-recheck','final-v0.0.31/final-export-recheck2']
def visit(value,origin):
 if isinstance(value,dict):
  for v in value.values():visit(v,origin)
 elif isinstance(value,list):
  for v in value:visit(v,origin)
 elif isinstance(value,str) and value.startswith(('/var/folders/','/private/var/folders/','/tmp/','/private/tmp/')):
  p=Path(value)
  for a in [p,*p.parents]:
   if a.name.startswith('thoughtline-') and a.parent.resolve()==temp:
    candidates.add(a);origins.setdefault(str(a),set()).add(origin);break
for root in roots:
 for p in (base/root).rglob('*.json'):
  try:visit(json.loads(p.read_text()),str(p.relative_to(repo)))
  except (UnicodeError,json.JSONDecodeError):pass
processes=subprocess.check_output(['/bin/ps','-axo','pid=,command='],text=True);live=[]
for line in processes.splitlines():
 if any(str(p) in line or str(p.resolve()) in line for p in candidates):
  if 'protocol-entry.cjs' in line or 'Thoughtline.app/Contents/MacOS/Thoughtline' in line or 'Electron.app/Contents/MacOS/Electron' in line:live.append(line.split(None,1)[0])
assert not live, 'Owned native process still running: '+','.join(live)
remaining=[p for p in sorted(candidates) if p.exists()];zpath=archive/('owned-residual-profiles-'+str(len(list(archive.glob('owned-residual-profiles-*.zip'))))+'.zip');records=[]
if remaining:
 with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
  for root in remaining:
   assert root.is_dir() and not root.is_symlink() and root.parent.resolve()==temp
   for file in root.rglob('*'):
    if file.is_symlink():
     assert file.name in ['SingletonCookie','SingletonLock','SingletonSocket'],'Unexpected symlink: '+str(file)
     name=root.name+'/'+str(file.relative_to(root));data=os.readlink(file).encode();item=zipfile.ZipInfo(name);item.create_system=3;item.external_attr=0o120777<<16;z.writestr(item,data);records.append({'path':str(file),'name':name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'type':'electron-singleton-symlink','targetNotFollowed':True});continue
    if file.is_file():
     name=root.name+'/'+str(file.relative_to(root));data=file.read_bytes();records.append({'path':str(file),'name':name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)});z.writestr(name,data)
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None
  for row in records:assert hashlib.sha256(z.read(row['name'])).hexdigest()==row['sha256']
 backup={'archive':str(zpath),'sha256':hashlib.sha256(zpath.read_bytes()).hexdigest(),'zipCrcPassed':True,'files':records};(archive/(zpath.stem+'.json')).write_text(json.dumps(backup,indent=2))
 for p in remaining:shutil.rmtree(p)
proof={'passed':all(not p.exists() for p in candidates),'candidatePaths':[{'path':str(p),'origins':sorted(origins[str(p)]),'existsAfter':p.exists()} for p in sorted(candidates)],'removedResidualPaths':[str(p) for p in remaining],'archivedFailureProfiles':[{'archive':str(p),'manifest':str(p.with_suffix('.json'))} for p in archive.glob('owned-residual-profiles-*.zip')],'archive':str(zpath) if remaining else None,'archiveVerifiedBeforeRetirement':True,'ownedNativeProcessesRemaining':live,'realApplicationUntouched':True,'scope':'Exact current task receipt paths under actual host temp directory only; no name-based killing or unrelated deletion'}
(base/'final-v0.0.31/mac-owned-cleanup.json').write_text(json.dumps(proof,indent=2));assert proof['passed'];print('Verified current task temporary paths absent:',len(candidates),'archived residual paths:',len(remaining))
