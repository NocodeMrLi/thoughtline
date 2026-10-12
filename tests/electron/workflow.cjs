const {chooseInlineTag}=require('./classification-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs/promises');const os=require('node:os');const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-workflow-'));let app;const ownedPids=[];const close=async()=>{if(app){ownedPids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)),app.process().pid);await app.close();app=null;}};
 const launch=async()=>_electron.launch(await launchOptions(dir));
 const windows=async()=>{let shelf,composer,manage;for(const p of await app.windows()){if(p.url().includes('view=shelf'))shelf=p;if(p.url().includes('view=composer'))composer=p;if(p.url().includes('view=manage'))manage=p;}return {shelf,composer,manage};};
 const ready=async()=>{await warmViews(app);while((await app.windows()).length<3)await app.waitForEvent('window',{timeout:5000});for(const p of await app.windows())await p.waitForURL(/view=(shelf|composer|manage)/,{waitUntil:'domcontentloaded',timeout:5000});const w=await windows();assert(w.shelf&&w.composer&&w.manage);await w.shelf.waitForSelector('[data-view="shelf"]',{state:'attached',timeout:5000});return w;};
 const result=async(p,method,...args)=>{const r=await p.evaluate(({method,args})=>window.thoughtline[method](...args),{method,args});assert(r.ok,r.message);return r.value;};
 try{
  app=await launch();let {shelf,composer,manage}=await ready();
  const full='  原始正文\n中文第二行\n'+('长正文 '.repeat(300));
  let info=await composer.evaluate(()=>window.thoughtline.info());
  const s=await result(composer,'submit',{text:full,title:'循环验收',project:'项目',agentId:'codex'},info.snapshot.revision);const id=s.ideas[0].id;
  await shelf.waitForSelector('[data-idea-id="'+id+'"]');const paper=await shelf.locator('.idea-card').evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};});assert(Math.abs(paper.width-160)<.01&&Math.abs(paper.height-226)<.01,'paper DOM bounds within floating-point precision');
  await result(shelf,'openManage',id);assert(manage,'temporary manage view must exist');
  await manage.waitForSelector('[data-view="manage"]',{state:'attached'});
  await manage.waitForSelector('[data-full-text]',{timeout:5000}).catch(async e=>{console.error(await manage.evaluate(async()=>({info:await window.thoughtline.info(),html:document.body.innerHTML.slice(0,3500)})));throw e;});
  assert.equal(await manage.locator('[data-full-text]').inputValue(),full);
  await result(manage,'openEdit',id);await manage.waitForSelector('[data-inline-editor]');assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').isVisible()),false);
  const firstEdit='自动保存后关闭\n原文改动';await manage.getByRole('textbox',{name:'编辑正文',exact:true}).fill(firstEdit);assert.equal((await manage.evaluate(()=>window.thoughtline.closeManage())).ok,true);await waitForInfo(shelf,i=>i.snapshot.ideas[0].text===firstEdit);assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).ideas[0].text,firstEdit);
  await result(shelf,'openManage',id);await manage.waitForSelector('[data-mode=detail]');await manage.getByRole('button',{name:'编辑',exact:true}).click();await manage.waitForSelector('[data-inline-editor]');
  const edited=full+'\n已编辑';await manage.getByRole('textbox',{name:'编辑正文',exact:true}).fill(edited);await chooseInlineTag(manage,'claude');await manage.getByRole('button',{name:'完成编辑',exact:true}).first().click();await waitForInfo(manage,i=>i.snapshot.ideas[0].text===edited&&i.snapshot.ideas[0].agentId==='claude');
  info=await manage.evaluate(()=>window.thoughtline.info());await result(manage,'setStatus',id,'archived',info.snapshot.revision);
  await result(shelf,'openManage');await manage.waitForSelector('[data-mode=calendar]');await manage.getByRole('textbox',{name:'搜索念头'}).fill('已编辑');
  await manage.waitForSelector('[data-idea-id="'+id+'"]');
  info=await manage.evaluate(()=>window.thoughtline.info());await result(manage,'setStatus',id,'hanging',info.snapshot.revision);
  await result(manage,'copy',id);const clipboard=await app.evaluate(async({clipboard})=>await clipboard.readText());assert.equal(clipboard,edited);
  const before=(await manage.evaluate(()=>window.thoughtline.info())).snapshot;assert.equal(before.ideas[0].status,'hanging');
  await close();app=await launch();({shelf}=await ready());info=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas[0].text,edited);assert.equal(info.snapshot.ideas[0].agentId,'claude');
  const report={platform:process.platform,scope:'真实Electron桥接和DOM循环；不代表物理点击穿透、系统IME或跨App焦点',inlineAutosaveOnClose:true,editSavedFullText:true,archiveSearchRestore:true,copyFullText:true,restartPreserved:true};
  await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','workflow-native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await close();await cleanupIdleFixture(dir,ownedPids);await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','workflow-cleanup.json'),JSON.stringify({ownedPids,allPidsExited:true,fakeDataRemoved:true},null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
