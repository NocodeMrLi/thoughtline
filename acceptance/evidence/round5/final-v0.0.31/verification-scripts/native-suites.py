from pathlib import Path
import subprocess,os,json,time,sys
repo=Path.cwd();scope=sys.argv[1];packaged=scope=='packaged';root=repo/('acceptance/evidence/round5/final-'+scope+'-0.0.31');root.mkdir(parents=True,exist_ok=True)
names=['round5-export-workflow','round5-settings-workflow','round5-contact-workflow','hidden-manage-reopen','settings-lifecycle','storage-workflow'] if not packaged else ['round5-export-workflow','round5-settings-workflow','round5-contact-workflow','round5-workflow','round5-unavailable-workflow','round5-readability-workflow','round4-classification-ui','round4-classification-workflow','round3-customizer-workflow']
results=[]
for name in names:
 env=dict(os.environ);env['THOUGHTLINE_EVIDENCE_DIR']=str(root);before=set(root.rglob('*.json'));log=repo/('acceptance/evidence/round5/final-v0.0.31/final-logs/'+scope+'-'+name+'.log')
 with log.open('w') as f:status=subprocess.run(['node','tests/electron/'+name+'.cjs'],env=env,stdout=f,stderr=subprocess.STDOUT).returncode
 receipts=[]
 for file in set(root.rglob('*.json'))-before:
  try:data=json.loads(file.read_text(encoding='utf-8-sig'))
  except:continue
  if isinstance(data,dict) and 'passed' in data:receipts.append({'path':str(file.relative_to(repo)),'passed':data['passed'],'packaged':data.get('packaged'),'checks':len(data.get('checks',data.get('cases',[]))),'scenes':len(data.get('scenes',[]))})
 row={'test':name,'exitCode':status,'receipts':receipts,'log':str(log.relative_to(repo))};results.append(row);print(name,status,flush=True)
 if status:break
passed=len(results)==len(names) and all(x['exitCode']==0 and all(y['passed'] for y in x['receipts']) for x in results)
report={'platform':'darwin','scope':scope,'executable':os.environ.get('THOUGHTLINE_EXECUTABLE'),'suites':results,'passed':passed,'physicalAcceptance':False}
(repo/('acceptance/evidence/round5/final-v0.0.31/mac-'+scope+'-suites.json')).write_text(json.dumps(report,indent=2));sys.exit(0 if passed else 1)
