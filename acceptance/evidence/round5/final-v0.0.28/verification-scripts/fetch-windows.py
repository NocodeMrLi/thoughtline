from pathlib import Path
import json,subprocess,hashlib,zipfile,shutil
repo=Path.cwd();run='38287260286';source='4c9567fef38dd43ccd0e0c3bc18d557c4b945843';api='repos/NocodeMrLi/thoughtline/'
def get(endpoint):return json.loads(subprocess.check_output(['gh','api',api+endpoint]))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
state=get('actions/runs/'+run);assert state['status']=='completed' and state['conclusion']=='success';assert state['head_sha']==source
e=repo/'acceptance/evidence/round5/final-v0.0.28';e.mkdir(exist_ok=True);(e/'windows-final-run.json').write_text(json.dumps(state,indent=2));jobs=get('actions/runs/'+run+'/jobs');(e/'windows-final-jobs.json').write_text(json.dumps(jobs,indent=2));assert all(j['conclusion']=='success' for j in jobs['jobs'])
a=get('actions/runs/'+run+'/artifacts');assert len(a['artifacts'])==2
archive=Path('/Users/lihongwei/Documents/Codex/2026-10-12/thoughtline-actions-storage-archive/post-release');delivery=Path('/Users/lihongwei/Documents/Codex/2026-10-12/thoughtline-round5/delivery/v0.0.28');evidence=repo/('acceptance/evidence/round5/windows-final-'+run);records=[]
for item in a['artifacts']:
 aid=item['id'];p=archive/(str(aid)+'.zip')
 with p.open('wb') as f:subprocess.run(['gh','api',api+f'actions/artifacts/{aid}/zip'],stdout=f,check=True)
 digest=sha(p);assert item['digest']=='sha256:'+digest
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  names=z.namelist();assert all(not Path(n).is_absolute() and '..' not in Path(n).parts for n in names)
  if '-x64-' in item['name']:
   assert sum(n.endswith('.exe') for n in names)==1
   for n in names:
    if not n.endswith('/'):
     target=delivery/('windows-SHA256SUMS.txt' if Path(n).name=='SHA256SUMS.txt' else Path(n).name);target.write_bytes(z.read(n))
  else:
   assert '-source-ui-' in item['name'];z.extractall(evidence)
 record={'artifact':item,'archive':str(p),'sha256':digest,'entries':names,'zipCrcPassed':True};(archive/(str(aid)+'.json')).write_text(json.dumps(record,indent=2));records.append(record);print('Verified',item['name'],item['size_in_bytes'],flush=True)
(e/'windows-artifact-download.json').write_text(json.dumps(records,indent=2))
with (e/'final-logs/windows-final-run.log').open('wb') as f:subprocess.run(['gh','run','view',run,'--repo','NocodeMrLi/thoughtline','--log'],stdout=f,check=True)
print('Downloaded successful Windows run',run)
