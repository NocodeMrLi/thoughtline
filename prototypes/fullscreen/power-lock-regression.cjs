const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');const {_electron}=require('playwright');
const {launchOptions,openComposer,waitForInfo}=require('../../tests/electron/window-fixture.cjs');
const {cleanupIdleFixture}=require('../../tests/electron/idle-fixture-cleanup.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-pause-regression-'));let app;let pids=[];const report={scope:'isolated actual source application, emitted powerMonitor events only; no actual sleep, system setting or physical IME',registeredPhysicalShortcuts:false};
 try{
  app=await _electron.launch(await launchOptions(dir));const shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  const composer=await openComposer(app,shelf);const draft={text:' 阶段独立草稿\n中文与😀  ',title:'只是假数据',project:'隔离复验',agentId:'claude'};
  await composer.locator('#idea-text').fill(draft.text);
  report.before=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(report.before.interactionLocked,true);
  await app.evaluate(({powerMonitor})=>powerMonitor.emit('suspend'));
  const closed=await composer.evaluate(draft=>window.thoughtline.close(draft),draft);assert.equal(closed.ok,true);
  await app.evaluate(({powerMonitor})=>powerMonitor.emit('resume'));
  report.after=await shelf.evaluate(()=>window.thoughtline.info());report.draftPreserved=report.after.snapshot.draft.text===draft.text;assert.equal(report.draftPreserved,true);
  report.lockReleased=report.after.interactionLocked===false;
  await fs.writeFile(path.join(__dirname,'evidence/power-lock-regression.json'),JSON.stringify(report,null,2)+'\n');
  assert.equal(report.lockReleased,true,'composer close during suspension must release its operation lock before resume');
 }finally{
  if(app){try{pids=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));}catch{}if(!pids.includes(app.process().pid))pids.push(app.process().pid);await app.close();}
  await cleanupIdleFixture(dir,pids);
 }
 console.log('Power event / close / resume lock regression passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
