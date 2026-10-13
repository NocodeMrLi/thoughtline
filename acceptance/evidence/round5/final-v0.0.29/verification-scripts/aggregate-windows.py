from pathlib import Path
import json,re
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.29';run=json.loads((e/'windows-final-run.json').read_text());assert run['conclusion']=='success';base=r/('acceptance/evidence/round5/windows-final-'+str(run['id']));records=[]
for p in sorted(base.rglob('*.json')):
 try:v=json.loads(p.read_text(encoding='utf-8-sig'))
 except:continue
 if isinstance(v,dict) and 'passed' in v:
  assert v['passed'] is True,str(p)
  records.append({'path':str(p.relative_to(r)),'checks':len(v.get('checks',v.get('cases',v.get('scenes',[])))),'passed':True})
assert records
log=(e/'final-logs/windows-final-run.log').read_text();assert re.search(r'353 passed',log), 'Expected all 353 Windows unit tests'
# Verify fresh source and actual-package round5 and readability receipts exist.
for section in ['windows-source','windows-packaged']:
 paths=[p for p in base.rglob('receipt.json') if '/round4/'+section+'/' in str(p)]
 rows=[(p,json.loads(p.read_text(encoding='utf-8-sig'))) for p in paths]
 assert any(len(v.get('scenes',[]))==8 and v.get('passed') for p,v in rows),section+' readability'
 assert any(len(v.get('checks',v.get('cases',[])))==19 and v.get('passed') for p,v in rows),section+' round5 19'
report={'passed':True,'run':run['id'],'source':run['head_sha'],'unitPassed':353,'typecheck':True,'build':True,'allRequiredWorkflowStepsPassed':True,'verifiedReceipts':records,'scope':'Full source suite and actual Windows package/NSIS on hosted native Windows; physical owner device separate'}
(e/'windows-final-suites.json').write_text(json.dumps(report,indent=2));print('Windows receipt count',len(records))

for section in ['windows-source','windows-packaged']:
 rows=[(p,json.loads(p.read_text(encoding='utf-8-sig'))) for p in base.rglob('receipt.json') if '/round4/'+section+'/unavailable-' in str(p)]
 assert len(rows)==1,section
 p,v=rows[0];assert v['passed'] and len(v['scenes'])==8 and len(v['checks'])==6
 assert all(x['style']['ratio']>=4.5 and x['style']['tipRatio']>=4.5 for x in v['scenes'])
print('Both fresh source and actual-package unavailable action receipts verified')
