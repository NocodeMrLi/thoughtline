from pathlib import Path
import json,subprocess,hashlib,zipfile,datetime
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.29';arc=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r512/archive');api='repos/NocodeMrLi/thoughtline/'
def get(p):return json.loads(subprocess.check_output(['gh','api',api+p]))
def inventory():return [x for page in json.loads(subprocess.check_output(['gh','api','--paginate','--slurp',api+'actions/artifacts?per_page=100'])) for x in page['artifacts'] if not x['expired']]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
pub=json.loads((e/'release-verification.json').read_text());assert pub['passed'];rel=get('releases/tags/v0.0.29');assert rel['id']==pub['release']['id'] and not rel['draft'];assets={x['name']:x for x in rel['assets']}
for a in pub['assets']:assert assets[a['name']]['digest']=='sha256:'+a['sha256'] and assets[a['name']]['size']==a['bytes']
rows=json.loads((e/'windows-artifact-download.json').read_text());installer=[x for x in rows if '-x64-' in x['artifact']['name']];assert len(installer)==1;ia=installer[0]['artifact'];assert ia['workflow_run']['id']==pub['run'];candidates=[{'artifact':ia,'archive':str(arc/(str(ia['id'])+'.zip')),'kind':'installer'}]
for aid in [11781849887,11782486753,11783016951,11783801250]:
 row=json.loads((arc/(str(aid)+'.json')).read_text());assert row['conclusion'] in ['cancelled','failure'] and row['artifact']['workflow_run']['id']==row['run'];candidates.append({'artifact':row['artifact'],'archive':str(arc/(str(aid)+'.zip')),'kind':'superseded-diagnostic'})
for row in candidates:
 a=row['artifact'];p=Path(row['archive']);assert a['digest']=='sha256:'+sha(p)
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  if row['kind']=='installer':
   names=[n for n in z.namelist() if n.endswith('.exe')];assert len(names)==1;assert 'sha256:'+hashlib.sha256(z.read(names[0])).hexdigest()==assets['Thoughtline-0.0.29-win-x64.exe']['digest']
before=inventory();byid={a['id']:a for a in before};selected={x['artifact']['id'] for x in candidates};journal={'phase':'verified-before-deletion','source':pub['source'],'releaseId':rel['id'],'candidates':candidates,'beforeIds':list(byid),'completedIds':[]};jpath=e/'actions-retirement-transaction.json';jpath.write_text(json.dumps(journal,indent=2))
for row in candidates:
 a=row['artifact'];aid=a['id']
 if aid in byid:
  live=byid[aid];assert live['name']==a['name'] and live['digest']==a['digest'] and live['workflow_run']['id']==a['workflow_run']['id'];subprocess.run(['gh','api','--method','DELETE',api+'actions/artifacts/'+str(aid)],check=True);row['deletedThisResume']=True
 else:row['alreadyAbsentOnResume']=True
 journal['completedIds'].append(aid);jpath.write_text(json.dumps(journal,indent=2))
after=inventory();afterIds={a['id']:a for a in after};assert not (set(afterIds)&selected)
for a in before:
 if a['id'] not in selected:assert a['id'] in afterIds and afterIds[a['id']]['digest']==a['digest'] and afterIds[a['id']]['name']==a['name']
assert any(a['workflow_run']['id']==pub['run'] and '-source-ui-' in a['name'] for a in after)
journal['phase']='completed-and-readback-verified';journal['remainingIds']=list(afterIds);jpath.write_text(json.dumps(journal,indent=2))
proof={'passed':True,'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'removedCurrentInstallerArtifact':ia['id'],'retiredOwnedDiagnostics':candidates[1:],'removedBytes':sum(x['artifact']['size_in_bytes'] for x in candidates),'archive':candidates[0]['archive'],'archiveDigestAndCrcVerified':True,'installerRetainedInVerifiedPrivateRelease':rel['id'],'remainingCount':len(after),'remainingBytes':sum(a['size_in_bytes'] for a in after),'unrelatedArtifactsPreserved':True,'resumeReason':'Original current installer deletion succeeded; following diagnostic GET hit TLS timeout. Fresh inventory used; no unrelated retries or deletion.'};(e/'actions-storage-cleanup.json').write_text(json.dumps(proof,indent=2));print('Guarded cleanup readback passed',len(after),proof['remainingBytes'])
