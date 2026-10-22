// SPDX-License-Identifier: GPL-3.0-only
const {launchOptions,openComposer,waitForInfo}=require('./window-fixture.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-lazy-'));let app;
 try{
  app=await _electron.launch(await launchOptions(dir,{nonActivating:true}));
  const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1,'unused input/manage must not create renderers at startup');

  const began=Date.now();const composer=await openComposer(app,shelf);const firstOpenMs=Date.now()-began;
  const draft='  延迟创建草稿\n第二行中文😀  ';
  await composer.locator('#idea-text').fill(draft);await composer.getByRole('button',{name:'保存草稿并关闭'}).click();await waitForInfo(shelf,i=>!i.interactionLocked);
  const settingsOpened=await shelf.evaluate(()=>window.thoughtline.openSettings());assert(settingsOpened.ok,settingsOpened.message);const manage=(await app.windows()).find(p=>p.url().includes('view=settings'));
  await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('button',{name:'关闭设置',exact:true}).click();
  // Reopen during the grace period must cancel disposal; repeated hotkey must reuse a single window.
  await openComposer(app,shelf);await openComposer(app,shelf);assert.equal(await composer.locator('#idea-text').inputValue(),draft);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().filter(w=>w.getTitle()==='Thoughtline Composer').length),1);
  await composer.getByRole('button',{name:'保存草稿并关闭'}).click();await waitForInfo(shelf,i=>!i.interactionLocked);
  const deadline=Date.now()+40000;while((await app.windows()).length!==1&&Date.now()<deadline)await new Promise(r=>setTimeout(r,250));
  assert.equal((await app.windows()).length,1,'hidden inputs must release renderer memory after grace period');
  const reopened=await openComposer(app,shelf);assert.equal(await reopened.locator('#idea-text').inputValue(),draft);
  await app.close();app=null;
  assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).draft.text,draft,'quit must persist recreated composer draft');
  const report={scope:'Mac Electron source runtime; shortcut callback via test adapter with emulated OS registry, DOM and native window lifecycle; not physical hotkey/IME acceptance',startupWindows:1,firstOpenMs,singleComposer:true,gracePeriodReuse:true,releasedAfter30Seconds:true,recreatedDraftPreserved:true,quitDraftPreserved:true};
  const evidence=process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence';await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,'lazy-window-lifecycle.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
