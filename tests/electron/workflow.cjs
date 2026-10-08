const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs/promises');const os=require('node:os');const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-workflow-'));let app;
 const launch=async()=>_electron.launch({executablePath:process.env.THOUGHTLINE_EXECUTABLE||require('electron'),args:process.env.THOUGHTLINE_EXECUTABLE?[]:[path.resolve('out/main/index.js')],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:15000});
 const windows=async()=>{let shelf,composer,manage;for(const p of await app.windows()){if(p.url().includes('view=shelf'))shelf=p;if(p.url().includes('view=composer'))composer=p;if(p.url().includes('view=manage'))manage=p;}return {shelf,composer,manage};};
 const ready=async()=>{await app.firstWindow();while((await app.windows()).length<3)await app.waitForEvent('window',{timeout:5000});for(const p of await app.windows())await p.waitForURL(/view=(shelf|composer|manage)/,{waitUntil:'domcontentloaded',timeout:5000});const w=await windows();assert(w.shelf&&w.composer&&w.manage);await w.shelf.waitForSelector('[data-view="shelf"]',{state:'attached',timeout:5000});return w;};
 const result=async(p,method,...args)=>{const r=await p.evaluate(({method,args})=>window.thoughtline[method](...args),{method,args});assert(r.ok,r.message);return r.value;};
 try{
  app=await launch();let {shelf,composer,manage}=await ready();
  const full='  原始正文\n中文第二行\n'+('长正文 '.repeat(300));
  let info=await composer.evaluate(()=>window.thoughtline.info());
  const s=await result(composer,'submit',{text:full,title:'循环验收',project:'项目',agentId:'codex'},info.snapshot.revision);const id=s.ideas[0].id;
  await shelf.waitForSelector('[data-idea-id="'+id+'"]');assert.equal(await shelf.locator('.idea-card').evaluate(el=>el.getBoundingClientRect().width),160);assert.equal(await shelf.locator('.idea-card').evaluate(el=>el.getBoundingClientRect().height),112);
  await result(shelf,'openManage',id);assert(manage,'temporary manage view must exist');
  await manage.waitForSelector('[data-view="manage"]',{state:'attached'});
  await manage.waitForSelector('[data-full-text]',{timeout:5000}).catch(async e=>{console.error(await manage.evaluate(async()=>({info:await window.thoughtline.info(),html:document.body.innerHTML.slice(0,3500)})));throw e;});
  assert.equal(await manage.locator('[data-full-text]').inputValue(),full);
  await result(manage,'openEdit',id);info=await composer.evaluate(()=>window.thoughtline.info());assert.equal(info.composerContext.mode,'edit');
  await composer.waitForFunction(()=>document.querySelector('#idea-text')?.value.startsWith('  原始正文'));
  await composer.locator('#idea-text').fill('取消时不能覆盖原文');await composer.locator('.close').click();
  info=await manage.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas[0].text,full);
  await result(manage,'openEdit',id);info=await composer.evaluate(()=>window.thoughtline.info());
  const edited=full+'\n已编辑';await result(composer,'submit',{text:edited,title:'循环验收',project:'项目',agentId:'claude'},info.snapshot.revision);
  info=await manage.evaluate(()=>window.thoughtline.info());await result(manage,'setStatus',id,'archived',info.snapshot.revision);
  await result(shelf,'openManage');await manage.getByRole('button',{name:'已收起',exact:true}).click();await manage.locator('#idea-search').fill('已编辑');
  await manage.waitForSelector('[data-idea-id="'+id+'"]');
  info=await manage.evaluate(()=>window.thoughtline.info());await result(manage,'setStatus',id,'hanging',info.snapshot.revision);
  await result(manage,'copy',id);const clipboard=await app.evaluate(async({clipboard})=>await clipboard.readText());assert.equal(clipboard,edited);
  const before=(await manage.evaluate(()=>window.thoughtline.info())).snapshot;assert.equal(before.ideas[0].status,'hanging');
  await app.close();app=null;app=await launch();({shelf}=await ready());info=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas[0].text,edited);assert.equal(info.snapshot.ideas[0].agentId,'claude');
  const report={platform:process.platform,scope:'真实Electron桥接和DOM循环；不代表物理点击穿透、系统IME或跨App焦点',editCancelPreserved:true,editSavedFullText:true,archiveSearchRestore:true,copyFullText:true,restartPreserved:true};
  await fs.writeFile('acceptance/evidence/workflow-native.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
