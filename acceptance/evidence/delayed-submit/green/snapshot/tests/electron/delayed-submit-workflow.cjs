const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {_electron}=require('playwright'),{launchOptions,openComposer,waitForInfo}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const output=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/delayed-submit/green');
const cases=['same-session-control','switch-current-response','switch-captured-response','same-session-mismatched-response'];
(async()=>{await fs.mkdir(output,{recursive:true});const results=[];let allPassed=true;
 for(const mode of cases){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-delayed-submit-'));let app,composer,shelf;const pids=[];let result;
  const beforeDraft={text:'旧会话完整正文',title:'旧会话名称',project:'旧项目',agentId:'general'},nextDraft={text:'新会话应保留正文',title:'新会话应保留名称',project:'新项目',agentId:'general'};
  try{
   await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas:[],clips:[],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:beforeDraft,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:false}}));
   const options=await launchOptions(dir);
   const hook=`const {ipcMain,BrowserWindow}=require('electron');const originalHandle=ipcMain.handle.bind(ipcMain);globalThis.delayedSubmitFixture={armed:false,pending:null,calls:[],mode:${JSON.stringify(mode)}};ipcMain.handle=(channel,handler)=>originalHandle(channel,async(...args)=>{const fixture=globalThis.delayedSubmitFixture;if(channel==='thoughtline:info'&&fixture.armed&&BrowserWindow.fromWebContents(args[0].sender)?.getTitle()==='Thoughtline Composer'){fixture.armed=false;const captured=await handler(...args);await new Promise(resolve=>{fixture.pending={resolve,captured};});fixture.pending=null;const released=fixture.mode==='switch-captured-response'?captured:await handler(...args);return fixture.mode==='same-session-mismatched-response'?{...released,composerSession:released.composerSession+1}:released;}if(channel==='thoughtline:submit'){const call={draft:args[1],revision:args[2]};fixture.calls.push(call);const r=await handler(...args);call.result=r;return r;}return handler(...args);});`;
   await fs.writeFile(options.args[0],hook+await fs.readFile(options.args[0],'utf8'));
   app=await _electron.launch(options);pids.push(app.process().pid);shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});composer=await openComposer(app,shelf);
   // Mark an actual dirty draft, so info suspension cannot precede the awaited flush.
   beforeDraft.text+=' / flush确认';await composer.locator('#idea-text').fill(beforeDraft.text);
   const oldNode=await composer.locator('#idea-text').elementHandle();const oldInfo=await shelf.evaluate(()=>window.thoughtline.info());
   await app.evaluate(()=>{globalThis.delayedSubmitFixture.armed=true;});await composer.locator('.primary').click();
   const deadline=Date.now()+10000;let pending;
   while(Date.now()<deadline){pending=await app.evaluate(()=>{const f=globalThis.delayedSubmitFixture;return f.pending?{captured:f.pending.captured,submitCalls:f.calls.length}:null;});if(pending)break;await composer.waitForTimeout(25);}assert(pending,'submit info did not suspend');assert.equal(pending.submitCalls,0);assert.deepEqual(pending.captured.snapshot.draft,beforeDraft);
   const flushDisk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));assert.deepEqual(flushDisk.draft,beforeDraft);
   let newInfo=pending.captured;
   if(mode.startsWith('switch-')){
    // Deliberately bypass the disabled busy controls through the isolated IPC harness.
    // This proves a conditional lifecycle boundary, not a normal user gesture sequence.
    const closed=await composer.evaluate(d=>window.thoughtline.close(d),beforeDraft);assert.equal(closed.ok,true);await waitForInfo(shelf,i=>!i.interactionLocked);composer=await openComposer(app,shelf);
    assert.equal(await oldNode.evaluate(e=>e.isConnected),false);
    await composer.locator('#idea-text').fill(nextDraft.text);await composer.getByLabel('名称',{exact:true}).fill(nextDraft.title);await composer.locator('.composer-project').click();await composer.getByLabel('项目',{exact:true}).fill(nextDraft.project);await composer.getByRole('button',{name:'完成',exact:true}).click();
    newInfo=await waitForInfo(shelf,i=>JSON.stringify(i.snapshot.draft)===JSON.stringify(nextDraft));assert.notEqual(newInfo.composerSession,oldInfo.composerSession);
   }
   await app.evaluate(()=>globalThis.delayedSubmitFixture.pending.resolve());
   // IPC has no further delayed handler after release; observe beyond autosave maxWait.
   await composer.waitForTimeout(2400);const observed=await shelf.evaluate(()=>window.thoughtline.info());const hookCalls=await app.evaluate(()=>globalThis.delayedSubmitFixture.calls);const visible=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').isVisible());const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));
   const expectedDraft=mode==='same-session-mismatched-response'?beforeDraft:nextDraft;
   const passed=mode==='same-session-control'?hookCalls.length===1&&observed.snapshot.ideas.length===1&&observed.snapshot.ideas[0].text===beforeDraft.text&&observed.snapshot.draft===null&&!visible:hookCalls.length===0&&observed.composerSession===newInfo.composerSession&&observed.snapshot.revision===newInfo.snapshot.revision&&observed.snapshot.ideas.length===0&&JSON.stringify(observed.snapshot.draft)===JSON.stringify(expectedDraft)&&visible&&observed.interactionLocked&&JSON.stringify(disk.draft)===JSON.stringify(expectedDraft);
   result={mode,passed,waitAfterReleaseMs:2400,boundary:'actual dirty flush completed, submit info suspended; switch cases use controlled close IPC and shortcut harness to remount Composer before releasing info',oldSession:oldInfo.composerSession,capturedResponseSession:pending.captured.composerSession,releasedResponseSession:mode==='switch-captured-response'?pending.captured.composerSession:mode==='same-session-mismatched-response'?newInfo.composerSession+1:newInfo.composerSession,newSession:newInfo.composerSession,flushDisk,newSnapshotBeforeRelease:newInfo.snapshot,submitCalls:hookCalls,observedSnapshot:observed.snapshot,nativeVisible:visible,interactionLocked:observed.interactionLocked,disk};if(!passed)allPassed=false;console.log(JSON.stringify(result));
  }finally{
   if(app){pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.evaluate(()=>{globalThis.delayedSubmitFixture.pending?.resolve();});await app.close();}
   await cleanupIdleFixture(dir,pids);const audit=cp.spawnSync('/bin/ps',['-p',[...new Set(pids)].join(','),'-o','pid=,comm='],{encoding:'utf8'});assert.equal(audit.status,1);assert.equal(audit.stdout.trim(),'');assert.equal(audit.stderr.trim(),'');
   result={...result,cleanup:{ownPids:[...new Set(pids)],fakeDataDirectory:dir,fakeDataRemoved:true,allExited:true,psExit:audit.status,psStdout:audit.stdout,psStderr:audit.stderr}};results.push(result);await fs.writeFile(path.join(output,'result.json'),JSON.stringify({sourceHead:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),allPassed,scope:'isolated Mac actual Electron/source DOM+IPC with test-only controlled info promise delay; emulated shortcuts; no physical IME or ordinary-user exploit claim',physicalImeTested:false,results},null,2)+'\n');
  }
 }
 if(!allPassed)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=1;});
