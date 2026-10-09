const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');const {_electron}=require('playwright');
const {launchOptions,warmViews,openComposer,waitForInfo}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-agent-default-'));let app,pids=[];
 const close=async()=>{if(!app)return;const owned=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));owned.push(app.process().pid);pids.push(...owned);await app.close();app=null;};
 const body='用户主动选择的草稿\n保留中文 😀  ';
 try{
  app=await _electron.launch(await launchOptions(dir));let {shelf}=await warmViews(app),composer=await openComposer(app,shelf);
  assert.equal((await composer.evaluate(()=>window.thoughtline.info())).composerContext.draft.agentId,'general');
  assert.equal(await composer.getByRole('button',{name:'通用',exact:true}).getAttribute('aria-pressed'),'true');
  await composer.getByRole('button',{name:'Claude',exact:true}).click();await composer.locator('#idea-text').fill(body);await composer.locator('.close').click();await waitForInfo(shelf,i=>!i.interactionLocked&&i.snapshot.draft?.agentId==='claude');
  await close();app=await _electron.launch(await launchOptions(dir));({shelf}=await warmViews(app));composer=await openComposer(app,shelf);
  assert.equal(await composer.locator('#idea-text').inputValue(),body);assert.equal(await composer.getByRole('button',{name:'Claude',exact:true}).getAttribute('aria-pressed'),'true');
  await composer.getByRole('button',{name:'挂上',exact:true}).click();await waitForInfo(shelf,i=>!i.interactionLocked&&i.snapshot.ideas.length===1);
  assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas[0].agentId,'claude');
  composer=await openComposer(app,shelf);assert.equal(await composer.getByRole('button',{name:'通用',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await composer.locator('#idea-text').inputValue(),'');
  await composer.locator('#idea-text').fill('未主动选择归属的新念头');await composer.getByRole('button',{name:'挂上',exact:true}).click();await waitForInfo(shelf,i=>!i.interactionLocked&&i.snapshot.ideas.length===2);
  const snapshot=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;assert.equal(snapshot.ideas[1].agentId,'general');await shelf.waitForSelector('[data-idea-id="'+snapshot.ideas[1].id+'"] .agent-name');assert.equal(await shelf.locator('[data-idea-id="'+snapshot.ideas[1].id+'"] .agent-name').textContent(),'通用');
 }finally{await close();await cleanupIdleFixture(dir,pids);}
 const report={scope:'actual isolated source Mac composer buttons/DOM/IPC, fake shortcut registry; no physical hotkey, IME or Windows acceptance',freshDefaultsToGeneral:true,restoredDraftKeepsChosenClaudeAndFullText:true,successfulSubmitDoesNotInheritPreviousAgent:true,unselectedNewNoteShowsGeneral:true,allOwnedPidsExited:true,fakeDataRemoved:true};await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/upright-paper-review','agent-default.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
