from pathlib import Path
import json,subprocess,zipfile,hashlib,datetime
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.29';archive=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r512/archive');api='repos/NocodeMrLi/thoughtline/'
def get(p):return json.loads(subprocess.check_output(['gh','api',api+p]))
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
proof=json.loads((e/'release-verification.json').read_text());assert proof['passed'];release=get('releases/tags/v0.0.29');assert not release['draft'] and release['id']==proof['release']['id'];assets={a['name']:a for a in release['assets']}
for a in proof['assets']:assert assets[a['name']]['digest']=='sha256:'+a['sha256'] and assets[a['name']]['size']==a['bytes']
items=json.loads((e/'windows-artifact-download.json').read_text());installer=[x for x in items if '-x64-' in x['artifact']['name']];assert len(installer)==1;row=installer[0];a=get('actions/artifacts/'+str(row['artifact']['id']));assert a['workflow_run']['id']==proof['run'];p=Path(row['archive']);assert a['digest']=='sha256:'+sha(p)
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None;names=[n for n in z.namelist() if n.endswith('.exe')];assert len(names)==1;exe=hashlib.sha256(z.read(names[0])).hexdigest();assert assets['Thoughtline-0.0.29-win-x64.exe']['digest']=='sha256:'+exe
subprocess.run(['gh','api','--method','DELETE',api+'actions/artifacts/'+str(a['id'])],check=True)
retired=[]
for aid,run,source in [(11781849887,38328971403,'0e1dafe786022727c77d1224b519e820dd9693fc'),(11782486753,38329887260,'03902520b72eb780d7f1ec1c5219c436a5a4c76c'),(11783016951,38331092906,'1ad69e26602e7a3173b7fdad1ad1d935aba1bbbe'),(11783801250,38332410356,'400bc092d561d92a9af137df8efaa50cf4253c89')]:
 item=get('actions/artifacts/'+str(aid));assert item['workflow_run']['id']==run and source in item['name'] and '-source-ui-' in item['name'];assert item['workflow_run']['head_sha']==source
 zpath=archive/(str(aid)+'.zip');assert item['digest']=='sha256:'+sha(zpath)
 with zipfile.ZipFile(zpath) as z:assert z.testzip() is None
 subprocess.run(['gh','api','--method','DELETE',api+'actions/artifacts/'+str(aid)],check=True)
 retired.append({'artifact':item,'archive':str(zpath),'sha256':sha(zpath),'zipCrcPassed':True,'reason':'Owned superseded R5-12 run; original evidence archived, final successful evidence kept online'})
rows=[x for page in json.loads(subprocess.check_output(['gh','api','--paginate','--slurp',api+'actions/artifacts?per_page=100'])) for x in page['artifacts'] if not x['expired']];assert not any(x['id'] in [a['id']]+[v['artifact']['id'] for v in retired] for x in rows);assert any(x['workflow_run']['id']==proof['run'] and '-source-ui-' in x['name'] for x in rows)
(e/'actions-storage-cleanup.json').write_text(json.dumps({'passed':True,'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'removedCurrentInstallerArtifact':a['id'],'retiredOwnedDiagnostics':retired,'removedBytes':a['size_in_bytes'],'archive':str(p),'archiveDigestAndCrcVerified':True,'installerRetainedInVerifiedPrivateRelease':release['id'],'remainingCount':len(rows),'remainingBytes':sum(x['size_in_bytes'] for x in rows),'unrelatedArtifactsPreserved':True},indent=2));print('Current installer duplicate archived and removed; remaining',len(rows),sum(x['size_in_bytes'] for x in rows))
