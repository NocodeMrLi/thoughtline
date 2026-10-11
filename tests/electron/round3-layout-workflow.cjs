const {launchOptions,warmViews,openComposer,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round3/layout');await fs.mkdir(root,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(root,(process.env.THOUGHTLINE_ATTEMPT||'layout')+'-')),receipt={platform:process.platform,cases:[]};
 async function run(name,action){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-round3-layout-'));let app;const result={name,passed:false};
  try{
   const now='2026-10-11T00:00:00.000Z',ideas=Array.from({length:40},(_,n)=>({id:'c'+n,title:'布局目标 '+n,text:'中文测试正文 '+n,project:'工作',agentId:'general',status:'hanging',createdAt:now,updatedAt:now}));
   await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:3,revision:0,ideas,clips:ideas.map(i=>({id:'clip:'+i.id,agentId:i.agentId,ideaIds:[i.id],currentId:i.id,position:null})),agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}}));
   app=await _electron.launch(await launchOptions(dir,{fakeNotifications:true,stationaryTopCursor:true}));const views=await warmViews(app);
   result.observation=await action(app,views,evidence);result.passed=true;
  }catch(e){result.failure=e.stack;}finally{
   if(app){result.pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();await cleanupIdleFixture(dir,result.pids);}else await fs.rm(dir,{recursive:true,force:true});
   result.normalQuit=true;result.profileRemoved=true;receipt.cases.push(result);
  }
 }
 await run('swap-rows-date-and-impact-not-clipped',async(app,{shelf},evidence)=>{
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('选择完整可读的换上目标');await composer.getByRole('button',{name:'换上',exact:true}).click();
  await composer.locator('.placement-target>button').first().waitFor();
  const rows=await composer.locator('.placement-target').evaluateAll(nodes=>nodes.map(row=>{const r=row.getBoundingClientRect();return {height:r.height,children:[...row.querySelectorAll('strong,small,.placement-target-text>span')].map(el=>{const b=el.getBoundingClientRect();return {text:el.textContent,inside:b.top>=r.top&&b.bottom<=r.bottom};})};}));
  await composer.screenshot({path:path.join(evidence,'swap-rows.png')});
  assert(rows.length>=4,'fixture must exercise a full list');assert(rows.every(r=>r.children.every(c=>c.inside)),JSON.stringify(rows));return rows;
 });
 await run('reminder-footer-retains-bottom-spacing',async(app,{shelf},evidence)=>{
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('提醒后仍然保留底部空间');await composer.getByRole('button',{name:'设置提醒',exact:true}).click();await composer.getByRole('button',{name:'1小时后',exact:true}).click();
  await waitForInfo(shelf,i=>!!i.snapshot.draft?.reminderAt);const rows=[];
  for(const width of [350,380,420,480]){
   await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').setBounds({width,height:260}),width);await composer.waitForTimeout(200);
   const row=await composer.evaluate(()=>({width:innerWidth,height:innerHeight,bottom:innerHeight-document.querySelector('.composer-submit>.primary').getBoundingClientRect().bottom,controls:[...document.querySelectorAll('.composer footer button,.composer footer select')].map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,bottom:e.getBoundingClientRect().bottom})),capacity:document.querySelector('.capacity-help').getBoundingClientRect().toJSON()}));
   rows.push(row);await composer.screenshot({path:path.join(evidence,'reminder-'+width+'.png')});
  }
  assert(rows.every(r=>r.bottom>=12&&r.controls.every(c=>c.left>=0&&c.right<=r.width&&c.bottom<=r.height-12)),JSON.stringify(rows));return rows;
 });
 await run('arrange-menu-is-one-stateful-action',async(app,{shelf})=>{
  assert((await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.clipChange({kind:'arrange'},i.snapshot.revision);})).ok);
  await waitForInfo(shelf,i=>i.canUndoClips);assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('c0'))).ok);
  const labels=await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.map(x=>x.label));assert.equal(labels.filter(l=>['自动整理','撤销整理'].includes(l)).length,1,JSON.stringify(labels));assert(labels.includes('撤销整理'));
  await app.evaluate(()=>{const {menu,options}=globalThis.thoughtlineTestPopup;menu.items.find(x=>x.label==='撤销整理').click();options.callback();});await waitForInfo(shelf,i=>!i.canUndoClips);assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('c0'))).ok);
  const after=await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.map(x=>x.label));assert(after.includes('自动整理')&&!after.includes('撤销整理'));return {labels,after};
 });
 receipt.passed=receipt.cases.every(r=>r.passed&&r.normalQuit&&r.profileRemoved);await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({evidence,...receipt}));if(!receipt.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
