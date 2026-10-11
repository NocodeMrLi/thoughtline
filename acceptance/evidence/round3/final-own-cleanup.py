"""Remove only named, verified outputs created by this round after proof capture."""
import pathlib, json, hashlib, subprocess, shutil, sys, datetime
repo=pathlib.Path.cwd()
delivery=pathlib.Path('/Users/lihongwei/Documents/Codex/2026-10-11/thoughtline-round3-repair/delivery/v0.0.22')
evidence=repo/'acceptance/evidence/round3'
binding=json.loads((evidence/'mac-package-binding.json').read_text())
source='b932ffc60e8f5ebf20e2bc5355eea513126a3872'
assert binding['passed'] and binding['source']==source
assert hashlib.sha256((delivery/'Thoughtline-0.0.22-mac-arm64.dmg').read_bytes()).hexdigest()==binding['dmgSha256']
assert json.loads((evidence/'windows-final-suites.json').read_text())['passed']
assert json.loads((evidence/'source-pair-proof.json').read_text())['passed']
active=subprocess.run(['ps','-axo','pid=,command='],text=True,capture_output=True,check=True).stdout
assert str(repo/'dist/mac-arm64/Thoughtline.app/Contents/MacOS/Thoughtline') not in active
paths=[repo/'dist/mac-arm64',pathlib.Path('/tmp/thoughtline-r3-window-state.node')]
if len(sys.argv)>1:
 p=pathlib.Path(sys.argv[1]);assert p.parent==delivery.parents[1] and p.name=='windows-ci-38117325731';paths.append(p)
removed=[]
for p in paths:
 if not p.exists():continue
 assert not p.is_symlink()
 kb=int(subprocess.check_output(['du','-sk',str(p)],text=True).split()[0])
 n=sum(1 for _ in p.rglob('*')) if p.is_dir() else 1
 if p.is_dir():shutil.rmtree(p)
 else:p.unlink()
 removed.append({'path':str(p),'allocatedKiB':kb,'entries':n,'absent':not p.exists()})
protected=[]
for identity in ['/Applications/Thoughtline.app/Contents/MacOS/Thoughtline','/Users/lihongwei/Documents/Codex/2026-10-09/task-2/qa-thoughtline/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron']:
 protected.append({'identity':identity,'currentProcesses':[l.strip() for l in active.splitlines() if l.strip().partition(' ')[2].strip()==identity]})
receipt={'passed':True,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':source,'removed':removed,'ownedAllocatedMiB':sum(x['allocatedKiB'] for x in removed)/1024,'netApfsGainClaimed':False,'signalsSent':0,'protected':protected,'userDataDependenciesCachesWorktreesHistoricalPackagesFailedEvidenceAndFinalDeliveryPreserved':True,'scope':'Named owned built App, native test probe and final CI download only; final DMG retained in dist and delivery; all tests quit before deletion'}
(evidence/'cleanup-release.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'removed':len(removed),'allocatedMiB':receipt['ownedAllocatedMiB'],'netGainClaimed':False}))
