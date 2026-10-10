const {_electron}=require('playwright'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs'),{waitForInfo}=require('./window-fixture.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 assert(process.env.THOUGHTLINE_EXECUTABLE,'Actual package executable required');
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2');await fs.mkdir(root,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(root,'packaged-split-')),dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-packaged-split-'));
 const receipt={platform:process.platform,version:require('../../package.json').version,scope:'actual packaged executable, synthetic isolated data, native menu callback interception; no physical click',pids:[],checks:[]};let app;
 try{
  const now='2026-10-09T00:00:00.000Z';
  await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale:'en',theme:'dark'}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas:['a','b','c'].map(id=>({id,title:id,text:' '+id+'\n中文😀\n ',project:'Project',agentId:'general',status:'hanging',createdAt:now,updatedAt:now})),clips:[{id:'stack',ideaIds:['a','b','c'],currentId:'b',agentId:'general',position:.5}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:true}}));
  app=await _electron.launch({executablePath:path.resolve(process.env.THOUGHTLINE_EXECUTABLE),args:[],env:{...process.env,THOUGHTLINE_DATA_DIR:dir,ELECTRON_RENDERER_URL:'',ELECTRON_RUN_AS_NODE:'',NODE_OPTIONS:''},timeout:30000});
  assert.equal(await app.evaluate(({app})=>app.getVersion()),receipt.version);
  const shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  assert.equal((await shelf.evaluate(()=>window.thoughtline.storageInfo())).value.directory,dir);
  await app.evaluate(({Menu})=>{Menu.prototype.popup=function(options){globalThis.packagedSplitMenu={menu:this,options};};});
  await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.setStatus('a','hanging',i.snapshot.revision);});await waitForInfo(shelf,i=>i.shelfVisible);
  const before=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;const action=menu.items.find(i=>i.label==='Separate current thought');if(!action)throw Error('Packaged split action missing');action.click();options.callback();});
  const after=await waitForInfo(shelf,i=>i.snapshot.clips.length===2);assert.deepEqual(after.snapshot.ideas,before.ideas);assert.deepEqual(after.snapshot.clips.find(c=>c.id==='stack').ideaIds,['a','c']);
  await shelf.waitForSelector('[data-idea-id="b"]');assert.equal((await app.windows()).length,1);receipt.checks.push('packaged-English-menu-splits-current-thought-without-opening-window');
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;const undo=menu.items.find(i=>i.label==='Undo arrangement');if(!undo)throw Error('Packaged undo missing');undo.click();options.callback();});
  const undone=await waitForInfo(shelf,i=>i.snapshot.clips.length===1);assert.deepEqual(undone.snapshot.clips,before.clips);assert.deepEqual(undone.snapshot.ideas,before.ideas);receipt.checks.push('packaged-right-click-undo-preserves-original-stack-and-text');
 }catch(e){receipt.failure=e.stack;}
 finally{try{if(app){receipt.pids=[...new Set([app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))])];await app.close();}await cleanupIdleFixture(dir,receipt.pids);receipt.dataRemoved=true;}catch(e){receipt.cleanupFailure=e.stack;}
  receipt.passed=!receipt.failure&&!receipt.cleanupFailure&&receipt.dataRemoved;await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));if(!receipt.passed)process.exitCode=1;}
})();
