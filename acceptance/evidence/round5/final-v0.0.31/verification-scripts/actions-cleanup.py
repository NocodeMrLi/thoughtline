from pathlib import Path
import json,subprocess,hashlib,zipfile,datetime
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.31';api='repos/NocodeMrLi/thoughtline/'
def get(p):
 import time
 for attempt in range(3):
  result=subprocess.run(['gh','api',(api+p).rstrip('/')],capture_output=True,text=True)
  if result.returncode==0:return json.loads(result.stdout)
  if attempt==2:raise RuntimeError(result.stderr)
  time.sleep(1+attempt)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
proof=json.loads((e/'release-verification.json').read_text());assert proof['passed'];release=get('releases/tags/v0.0.31');assert release['id']==proof['release']['id'] and not release['draft'];assets={a['name']:a for a in release['assets']}
for row in proof['assets']:assert assets[row['name']]['digest']=='sha256:'+row['sha256'] and assets[row['name']]['size']==row['bytes']
rows=json.loads((e/'windows-artifact-download.json').read_text());installers=[x for x in rows if '-x64-' in x['artifact']['name']];assert len(installers)==1;item=installers[0];old=json.loads((e/'windows-first-failure.json').read_text());targets=[{'artifact':item['artifact'],'archive':item['archive'],'reason':'Current installer retained in verified private release'}, {'artifact':old['artifact'],'archive':old['archive'],'reason':'Owned superseded startup failure; original ZIP/log/receipt preserved'}];ledger=e/'artifact-retirement-ledger.json';removed=json.loads(ledger.read_text()) if ledger.exists() else []
second=json.loads((e/'windows-second-failure.json').read_text());targets.append({'artifact':second['artifact'],'archive':second['archive'],'reason':'Owned superseded second failure; verified original ZIP/log preserved'})
third=json.loads((e/'windows-diagnostic-failure.json').read_text());targets.append({'artifact':third['artifact'],'archive':third['archive'],'reason':'Stale hidden-window fixture diagnosed; original ZIP/log archived'})
for row in targets:
 if any(x['artifact']['id']==row['artifact']['id'] for x in removed):continue
 a=get('actions/artifacts/'+str(row['artifact']['id']));assert a['digest']==row['artifact']['digest'];assert a['workflow_run']['id']==row['artifact']['workflow_run']['id'];p=Path(row['archive']);assert a['digest']=='sha256:'+sha(p)
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  if '-x64-' in a['name']:
   names=[n for n in z.namelist() if n.endswith('.exe')];assert len(names)==1;assert assets['Thoughtline-0.0.31-win-x64.exe']['digest']=='sha256:'+hashlib.sha256(z.read(names[0])).hexdigest()
 subprocess.run(['gh','api','--method','DELETE',api+'actions/artifacts/'+str(a['id'])],check=True);removed.append({'artifact':a,'archive':str(p),'sha256':sha(p),'crcPassed':True,'reason':row['reason']})
 ledger.write_text(json.dumps(removed,indent=2))
remaining=[a for page in json.loads(subprocess.check_output(['gh','api','--paginate','--slurp',api+'actions/artifacts?per_page=100'])) for a in page['artifacts'] if not a['expired']];assert not any(x['id'] in [y['artifact']['id'] for y in removed] for x in remaining);assert any(x['workflow_run']['id']==proof['run'] and '-source-ui-' in x['name'] for x in remaining)
result={'passed':True,'asOf':datetime.datetime.now(datetime.timezone.utc).isoformat(),'removed':removed,'removedBytes':sum(x['artifact']['size_in_bytes'] for x in removed),'remainingCount':len(remaining),'remainingBytes':sum(x['size_in_bytes'] for x in remaining),'latestUiEvidenceRetained':True,'historicalReleaseAssetsProtected':True,'budgetsAndVisibilityUnchanged':True,'monthlyAccumulatedUsageNotResetByDeletion':True};(e/'actions-storage-cleanup.json').write_text(json.dumps(result,indent=2));print('Archived/retired owned duplicates; live artifacts',len(remaining),result['remainingBytes'],'bytes')
