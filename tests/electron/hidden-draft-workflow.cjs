// SPDX-License-Identifier: GPL-3.0-only
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {_electron}=require('playwright'),{launchOptions,openComposer}=require('./window-fixture.cjs');
(async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-hidden-draft-'));let app;const ownedPids=[];const close=async()=>{if(app){ownedPids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)),app.process().pid);await app.close();app=null;}};
 try{
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,clips:[],ideas:[],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+Shift+F19',reducedMotion:false}}));
  app=await _electron.launch(await launchOptions(dir));const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  const composer=await openComposer(app,shelf),draft='  未确认隐藏的中文草稿\n候选词完成😀  ';await composer.locator('#idea-text').fill(draft);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').hide());
  await new Promise(r=>setTimeout(r,31500));assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Composer')),'unconfirmed native hide must not dispose live draft');
  const resumed=await openComposer(app,shelf);assert.equal(await resumed.locator('#idea-text').inputValue(),draft,'reopen must resume live hidden draft rather than overwrite from snapshot');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').hide());
  await fs.chmod(dir,0o555);await app.evaluate(({app})=>app.quit());await composer.waitForFunction(()=>document.querySelector('.error')?.textContent.includes('保存未成功'));assert.equal(await composer.locator('#idea-text').inputValue(),draft);assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').isVisible()),'failed hidden-draft save must restore editable window');await fs.chmod(dir,0o755);await close();
  assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).draft.text,draft,'quit must capture unconfirmed hidden draft');
  const report={scope:'actual Mac Electron BrowserWindow.hide event and grace timeout, shortcut callback through emulated registry, hidden renderer quit capture; not physical macOS Hide menu/IME acceptance',unconfirmedHiddenDraftRetainedBeyond30Seconds:true,reopenResumesLiveText:true,hiddenSaveFailureBlocksQuitAndShowsText:true,hiddenQuitPersistsDraft:true};await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','hidden-draft-native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await fs.chmod(dir,0o755);await close();await cleanupIdleFixture(dir,ownedPids);await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','hidden-draft-workflow-cleanup.json'),JSON.stringify({ownedPids,allPidsExited:true,fakeDataRemoved:true},null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
