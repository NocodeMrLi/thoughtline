from pathlib import Path
import json,subprocess,hashlib
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.31';d=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r517/delivery/v0.0.31');api='repos/NocodeMrLi/thoughtline/'
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
release=get('releases/tags/v0.0.31');source=json.loads((d/'mac-build-manifest.json').read_text())['actualMacBuildSource'];assert not release['draft'] and not release['prerelease'];assert get('releases/latest')['id']==release['id'];assert get('commits/v0.0.31')['sha']==source;assert get('')['private'] is True
expected=json.loads((e/'release-upload-manifest.json').read_text());remote={a['name']:a for a in release['assets']};assert set(remote)=={x['name'] for x in expected}
for row in expected:
 a=remote[row['name']];assert a['size']==row['bytes'];assert a['digest']=='sha256:'+row['sha256'];assert sha(d/row['name'])==row['sha256']
historical={x['id']:x for x in get('releases?per_page=100')}
for old in json.loads((e/'historical-releases-before.json').read_text()):
 current=historical[old['id']];assert current['tag_name']==old['tag'];assert current['draft']==old['draft'];assert current['prerelease']==old['prerelease'];items=[{'id':a['id'],'name':a['name'],'size':a['size'],'digest':a.get('digest')} for a in current['assets']];assert items==old['assets'],old['tag']
proof={'passed':True,'release':{'id':release['id'],'url':release['html_url'],'draft':release['draft'],'prerelease':release['prerelease']},'source':source,'run':json.loads((e/'windows-final-run.json').read_text())['id'],'assets':expected,'historicalReleasesUnchanged':True,'privateRepository':True};(e/'release-verification.json').write_text(json.dumps(proof,indent=2));print('Private release assets read back:',len(expected),'and historical releases unchanged')
