import json,pathlib,subprocess
p=pathlib.Path('acceptance/evidence/round5/final-v0.0.28');before=json.loads((p/'historical-releases-before.jsonl').read_text());pages=json.loads(subprocess.check_output(['gh','api','--paginate','--slurp','repos/NocodeMrLi/thoughtline/releases?per_page=100']));after={a['id']:a for page in pages for a in page}
def identity(r):return {'id':r['id'],'tag_name':r['tag_name'],'draft':r['draft'],'prerelease':r['prerelease'],'assets':sorted([{'id':a['id'],'name':a['name'],'size':a['size'],'digest':a.get('digest')} for a in r['assets']],key=lambda a:a['id'])}
for r in before:assert r['id'] in after and identity(r)==identity(after[r['id']]),r['tag_name']
r={'passed':True,'historicalReleasesUnchanged':len(before),'identities':[identity(r) for r in before]};(p/'historical-releases-preserved.json').write_text(json.dumps(r,indent=2));print('Preserved historical Releases',len(before))
