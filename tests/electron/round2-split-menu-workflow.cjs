const {launchOptions,warmViews,waitForInfo,bounded}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');

// Real renderer/IPC/repository; native menu callbacks are intercepted, not physical mouse evidence.
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2');
 await fs.mkdir(root,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(root,'split-menu-'));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-split-menu-'));
 const receipt={platform:process.platform,scope:'isolated source protocol and repository; native popup stub, no physical click',cases:[],pids:[],dir};
 let app,shelf,manage;
 const seed=(current='b',extra=0)=>{
  const ids=['a','b','c','single',...Array.from({length:extra},(_,i)=>'extra-'+i)];
  const now='2026-10-09T00:00:00.000Z';
  return {schemaVersion:2,revision:0,ideas:ids.map(id=>({id,title:id,text:'  '+id+' 中文😀\n第二行\n  ',project:'可删除分组',agentId:'general',status:'hanging',createdAt:now,updatedAt:now})),
   clips:[{id:'stack',ideaIds:['a','b','c'],currentId:current,agentId:'general',position:0},...ids.slice(3).map((id,i)=>({id:'clip:'+id,ideaIds:[id],currentId:id,agentId:'general',position:i===0?1:null}))],
   agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:true}};
 };
 const close=async()=>{if(app){receipt.pids.push(app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;}};
 const start=async(data)=>{
  await close();if(data)await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(data));
  const options=await launchOptions(dir,{stationaryTopCursor:true});
  await fs.appendFile(options.args[0],"\nglobalThis.thoughtlineTestIO=require('node:fs/promises');\n");
  app=await _electron.launch(options);({shelf,manage}=await warmViews(app));
  assert.equal(await bounded(app.evaluate(({app})=>app.getPath('userData')),'native isolated profile directory',3000),dir);
  await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.setStatus(i.snapshot.ideas[0].id,'hanging',i.snapshot.revision);});
  await waitForInfo(shelf,i=>i.shelfVisible);await shelf.evaluate(()=>window.thoughtline.dragLock(true));
 };
 const info=()=>shelf.evaluate(()=>window.thoughtline.info());
 const menu=async(id)=>{assert((await shelf.evaluate(id=>window.thoughtline.shelfMenu(id),id)).ok);};
 const labels=()=>app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.find(i=>i.label==='整理'||i.label==='Organize').submenu.items.filter(i=>i.enabled).map(i=>i.label));
 const cancel=()=>app.evaluate(()=>globalThis.thoughtlineTestPopup.options.callback());
 const click=async(label)=>{await app.evaluate((_,label)=>{const actions=globalThis.thoughtlineTestPopup.menu.items.find(i=>i.label==='整理'||i.label==='Organize').submenu.items;const item=actions.find(i=>i.label===label);if(!item)throw Error('Missing menu action: '+label);item.click();globalThis.thoughtlineTestPopup.options.callback();},label);};
 const change=async(command)=>{const i=await info();const r=await shelf.evaluate(({command,rev})=>window.thoughtline.clipChange(command,rev),{command,rev:i.snapshot.revision});assert(r.ok,r.message);return r.value;};
 const pass=(name)=>receipt.cases.push({name,passed:true});
 try{
  await start(seed());await menu('single');assert(!(await labels()).includes('拆分叠放'));await cancel();pass('single-clip-has-no-split');
  await menu('b');assert((await labels()).includes('拆分叠放'),'stacked clip must expose current-thought split');
  const cancelled=(await info()).snapshot;await cancel();assert.deepEqual((await info()).snapshot,cancelled);pass('cancelled-menu-does-not-mutate');
  await menu('b');await change({kind:'select',id:'stack',ideaId:'a'});const before=(await info()).snapshot;
  await click('拆分叠放');let i=await waitForInfo(shelf,i=>i.snapshot.clips.some(c=>c.ideaIds.length===1&&c.currentId==='b'));
  assert.deepEqual(i.snapshot.ideas,before.ideas);assert.deepEqual(i.snapshot.clips.find(c=>c.id==='stack').ideaIds,['a','c']);assert.equal(i.snapshot.clips.find(c=>c.id==='stack').currentId,'a');
  assert.equal(i.snapshot.clips.find(c=>c.id==='clip:single').position,1);assert.equal(i.snapshot.clips.find(c=>c.id==='stack').position,0);
  await shelf.evaluate(()=>window.thoughtline.dragLock(false));await shelf.waitForSelector('[data-idea-id="b"]');
  assert(!await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Manage'&&w.isVisible())));
  pass('captured-current-id-survives-background-page-change-without-opening-reader');
  await shelf.evaluate(()=>window.thoughtline.dragLock(true));await menu('b');assert((await labels()).includes('撤销拆分'));await click('撤销拆分');
  i=await waitForInfo(shelf,i=>i.snapshot.clips.some(c=>c.id==='stack'&&c.ideaIds.length===3));assert.deepEqual(i.snapshot.clips,before.clips);assert.deepEqual(i.snapshot.ideas,before.ideas);pass('right-click-split-can-be-undone');
  for(const id of ['a','b','c']){
   await change({kind:'select',id:'stack',ideaId:id});const original=(await info()).snapshot;
   await menu(id);await click('拆分叠放');i=await waitForInfo(shelf,i=>i.snapshot.clips.some(c=>c.ideaIds.length===1&&c.currentId===id));
   assert.deepEqual(i.snapshot.ideas,original.ideas);assert.deepEqual(i.snapshot.clips.find(c=>c.id==='stack').ideaIds,original.clips.find(c=>c.id==='stack').ideaIds.filter(x=>x!==id));
   await change({kind:'undo'});assert.deepEqual((await info()).snapshot.clips,original.clips);
  }pass('first-middle-last-pages-and-repeated-undo-preserve-order-content');
  await menu('c');await change({kind:'merge',sourceId:'stack',targetId:'clip:single'});const stale=(await info()).snapshot;await click('拆分叠放');
  await waitForInfo(shelf,i=>!!i.placementNotice);assert.deepEqual((await info()).snapshot,stale);pass('stale-clip-target-is-rejected');
  await start(seed());const failureBefore=(await info()).snapshot;
  await app.evaluate(()=>{const io=globalThis.thoughtlineTestIO;globalThis.splitOriginalWrite=io.writeFile;io.writeFile=async(p,...args)=>{if(String(p).includes('snapshot'))throw Error('owned-split-write-failure');return globalThis.splitOriginalWrite(p,...args);};});
  await menu('b');await click('拆分叠放');await waitForInfo(shelf,i=>i.placementNotice?.includes('owned-split-write-failure'));assert.deepEqual((await info()).snapshot,failureBefore);
  await shelf.getByRole('alert').filter({hasText:'owned-split-write-failure'}).waitFor();
  await shelf.waitForTimeout(4300);assert.equal(await shelf.getByRole('alert').filter({hasText:'owned-split-write-failure'}).count(),1,'IO failure must remain visible beyond the long notice timeout');
  await app.evaluate(()=>{globalThis.thoughtlineTestIO.writeFile=globalThis.splitOriginalWrite;});pass('write-failure-visible-on-shelf-with-original-data-intact');
  await menu('b');await click('拆分叠放');i=await waitForInfo(shelf,i=>i.snapshot.clips.some(c=>c.ideaIds.length===1&&c.currentId==='b'));
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);manage=app.windows().find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=calendar]');assert((await manage.evaluate(rev=>window.thoughtline.projectDelete('可删除分组',rev),i.snapshot.revision)).ok);await change({kind:'undo'});
  i=await info();assert(i.snapshot.ideas.every(n=>n.project===''));pass('split-undo-cannot-revive-deleted-project');
  await shelf.evaluate(()=>window.thoughtline.openManage('b'));await manage.waitForSelector('[data-reader-id="b"]');
  await manage.getByRole('button',{name:'拆分',exact:true}).click();i=await waitForInfo(shelf,i=>i.snapshot.clips.some(c=>c.ideaIds.length===1&&c.currentId==='b'));pass('expanded-reader-split-remains-available');
  await manage.evaluate(()=>window.thoughtline.closeManage());await close();const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));
  app=await _electron.launch(await launchOptions(dir,{stationaryTopCursor:true}));shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});assert.deepEqual((await info()).snapshot,disk);pass('restart-retains-split-ids-content-order-and-page');
  await start(seed('b',40));const fullBefore=(await info()).snapshot;await menu('b');await click('拆分叠放');i=await waitForInfo(shelf,i=>!!i.placementNotice?.includes('放不下'));
  assert.deepEqual(i.snapshot.ideas,fullBefore.ideas);assert(i.snapshot.clips.some(c=>c.ideaIds.length===1&&c.currentId==='b'));
  await shelf.getByRole('status').filter({hasText:'放不下'}).click();await manage.waitForSelector('[data-mode=calendar]');pass('true-full-rope-has-explicit-calendar-entry-and-preserved-content');
  assert((await manage.evaluate(()=>window.thoughtline.setPreferences({locale:'en',theme:'dark'},100))).ok);
  await waitForInfo(shelf,i=>i.preferences.locale==='en');await manage.evaluate(()=>window.thoughtline.closeManage());
  await shelf.evaluate(()=>window.thoughtline.dragLock(true));await change({kind:'select',id:'stack',ideaId:'c'});
  await menu('c');assert((await labels()).includes('Split stack'));assert(!(await labels()).includes('拆分叠放'));await cancel();pass('English-menu-and-dark-theme-use-translated-current-thought-action');
 }catch(e){receipt.failure=e.stack;}
 finally{
  try{await close();receipt.pids=[...new Set(receipt.pids)];await cleanupIdleFixture(dir,receipt.pids);receipt.dataRemoved=true;}catch(e){receipt.cleanupFailure=e.stack;}
  receipt.passed=!receipt.failure&&!receipt.cleanupFailure&&receipt.dataRemoved;
  await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));if(!receipt.passed)process.exitCode=1;
 }
})();
