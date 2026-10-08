const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {_electron}=require('playwright');const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-clean-shelf-'));let app;
 try{
  app=await _electron.launch(await launchOptions(dir));const {shelf,composer,manage}=await warmViews(app);
  for(let n=1;n<=3;n++){const r=await composer.evaluate(async n=>{const i=await window.thoughtline.info();return window.thoughtline.submit({text:'原样正文\n动效测试 '+n,title:'动效测试 '+n,agentId:'codex',project:''},i.snapshot.revision);},n);assert(r.ok);}
  await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);assert((await shelf.evaluate(()=>window.thoughtline.dragLock(true))).ok);
  await shelf.screenshot({path:process.env.THOUGHTLINE_BEFORE_UI?'acceptance/evidence/overnight-ui-before.png':'acceptance/evidence/overnight-ui-after.png',omitBackground:true});
  assert.equal(await shelf.locator('.shelf-tools').count(),0,'steady shelf must not contain the category/filter/search toolbar');
  assert.equal(await shelf.locator('nav').count(),0,'do not replace pills with another persistent icon row');assert.equal(await shelf.locator('.idea-card').count(),3);
  const count=await shelf.locator('[data-hit]').count();assert(count<=6,'only cards and pegs should be steady hit targets');
  await shelf.evaluate(()=>window.thoughtline.dragLock(false));
  const id=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas[0].id;
  assert((await shelf.evaluate(id=>window.thoughtline.shelfMenu(id),id)).ok);
  const menu=await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.map(i=>i.label));assert(menu.includes('筛选 Agent')&&menu.includes('查找 / 已收起'));
  await app.evaluate(()=>{const p=globalThis.thoughtlineTestPopup;p.menu.items.find(i=>i.label.startsWith('只看 ')).click();p.options.callback();});
  await waitForInfo(shelf,i=>i.shelfAgentId==='codex');assert.equal(await shelf.locator('nav').count(),0);
  assert((await shelf.evaluate(id=>window.thoughtline.shelfMenu(id),id)).ok);await app.evaluate(()=>{const p=globalThis.thoughtlineTestPopup;p.menu.items.find(i=>i.label==='显示全部').click();p.options.callback();});
  await waitForInfo(shelf,i=>i.shelfAgentId==='all');
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('#idea-search');await manage.locator('#idea-search').fill('动效测试 2');await manage.waitForFunction(()=>document.querySelectorAll('.idea-list button').length===1);await manage.getByRole('button',{name:'已收起',exact:true}).click();assert.equal(await manage.locator('.idea-list button').count(),0);await manage.getByRole('button',{name:'关闭浏览'}).click();
  const report={scope:'Mac actual Electron renderer screenshot and steady DOM/hit layout, not Windows physical click-through',toolbarAbsent:true,noReplacementIconRow:true,threeCompactCards:true,steadyHitTargets:count,nativeMenuObjectFilters:true,clearFilter:true,temporarySearchAndHistory:true,menuScope:'native Menu callbacks via test adapter, not physical menu selection'};await fs.writeFile('acceptance/evidence/clean-shelf.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
