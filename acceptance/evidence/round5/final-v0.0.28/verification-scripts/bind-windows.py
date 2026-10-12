import json,pathlib,hashlib,subprocess
repo=pathlib.Path.cwd();root=pathlib.Path('acceptance/evidence/round5/final-v0.0.28');delivery=pathlib.Path('/Users/lihongwei/Documents/Codex/2026-10-12/thoughtline-round5/delivery/v0.0.28')
mac=json.loads((delivery/'mac-build-manifest.json').read_text());win=json.loads((delivery/'build-manifest.json').read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest()
m=mac['inputVector'];w=win['inputVector'];assert m['headSha']==w['headSha'];assert m['count']==w['count'];assert m['vectorSha256']==w['vectorSha256'];assert m['files'].keys()==w['files'].keys();differences=[]
for name,mf in m['files'].items():
 wf=w['files'][name];assert (mf['mode'],mf['blob'])==(wf['mode'],wf['blob']);data=subprocess.check_output(['git','cat-file','blob',mf['blob']]);assert sha(data)==mf['sha256'],name
 if wf['sha256']!=mf['sha256']:
  assert b'\0' not in data and b'\r\n' not in data;assert sha(data.replace(b'\n',b'\r\n'))==wf['sha256'],name;differences.append(name)
proof={'passed':True,'source':m['headSha'],'windowsRun':'38287260286','count':m['count'],'canonicalVectorSha256':m['vectorSha256'],'canonicalMatch':True,'rawDifferencesAreVerifiedCRLFOnly':True,'sourceCRLFDifferences':differences}
(root/'source-pair-proof.json').write_text(json.dumps(proof,indent=2));print('Source pair',m['count'],'CRLF',len(differences));print('Windows manifest keys',list(win))
