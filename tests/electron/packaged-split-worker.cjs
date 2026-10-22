// SPDX-License-Identifier: GPL-3.0-only
const {_electron}=require('playwright'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs'),{waitForInfo}=require('./window-fixture.cjs');
const {sanitizedPackagedEnv,observeLaunch}=require('./packaged-launch.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 assert(process.env.THOUGHTLINE_EXECUTABLE,'Actual package executable required');
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2');await fs.mkdir(root,{recursive:true});
 const evidence=root,dir=process.env.THOUGHTLINE_OWNED_PROFILE;assert(dir,'Supervisor-owned profile required');const executable=path.resolve(process.env.THOUGHTLINE_EXECUTABLE);
 const receipt={executable,packaged:true,platform:process.platform,version:require('../../package.json').version,scope:'actual packaged executable, synthetic isolated data, native menu callback interception; no physical click',pids:[],checks:[]};let app,launchFailed=false;
 try{
  const now='2026-10-09T00:00:00.000Z';
  await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale:'en',theme:'dark'}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas:['a','b','c'].map(id=>({id,title:id,text:' '+id+'\n中文😀\n ',project:'Project',agentId:'general',status:'hanging',createdAt:now,updatedAt:now})),clips:[{id:'stack',ideaIds:['a','b','c'],currentId:'b',agentId:'general',position:.5}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:true}}));
  const restore=observeLaunch(executable,evidence);try{app=await _electron.launch({executablePath:executable,args:[],env:sanitizedPackagedEnv(process.env,dir),timeout:30000});}catch(e){launchFailed=true;throw e;}finally{restore();}
  assert.equal(await app.evaluate(({app})=>app.getVersion()),receipt.version);
  const shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  assert.equal(await app.evaluate(({app})=>app.getPath('userData')),dir);
  await app.evaluate(({Menu})=>{Menu.prototype.popup=function(options){globalThis.packagedSplitMenu={menu:this,options};};});
  await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.setStatus('a','hanging',i.snapshot.revision);});await waitForInfo(shelf,i=>i.shelfVisible);
  const before=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;const action=menu.items.find(i=>i.label==='Organize')?.submenu.items.find(i=>i.label==='Split stack');if(!action)throw Error('Packaged split action missing');action.click();options.callback();});
  const after=await waitForInfo(shelf,i=>i.snapshot.clips.length===2);assert.deepEqual(after.snapshot.ideas,before.ideas);assert.deepEqual(after.snapshot.clips.find(c=>c.id==='stack').ideaIds,['a','c']);
  await shelf.waitForSelector('[data-idea-id="b"]');assert.equal((await app.windows()).length,1);receipt.checks.push('packaged-English-menu-splits-current-thought-without-opening-window');
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;const undo=menu.items.find(i=>i.label==='Organize')?.submenu.items.find(i=>i.label==='Undo split');if(!undo)throw Error('Packaged undo missing');undo.click();options.callback();});
  const undone=await waitForInfo(shelf,i=>i.snapshot.clips.length===1);assert.deepEqual(undone.snapshot.clips,before.clips);assert.deepEqual(undone.snapshot.ideas,before.ideas);receipt.checks.push('packaged-right-click-undo-preserves-original-stack-and-text');
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;menu.items.find(i=>i.label==='Organize')?.submenu.items.find(i=>i.label==='Split stack').click();options.callback();});
  const split=await waitForInfo(shelf,i=>i.snapshot.clips.length===2);
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;const merge=menu.items.find(i=>i.label==='Organize')?.submenu.items.find(i=>i.label==='Merge…');if(!merge?.enabled||merge.submenu)throw Error('Packaged merge must open a panel without a third native menu');merge.click();options.callback();});
  let pickerPage;const pickerUntil=Date.now()+5000;while(!pickerPage&&Date.now()<pickerUntil){pickerPage=app.windows().find(p=>p.url().includes('view=picker'));if(!pickerPage)await new Promise(r=>setTimeout(r,25));}assert(pickerPage,'standalone picker');const picker=pickerPage.locator('.shelf-merge-picker');await picker.waitFor();assert.equal(await picker.locator('.merge-target').count(),1);assert.equal(await picker.locator('.merge-count').textContent(),'2');await picker.locator('.merge-target').click();
  const merged=await waitForInfo(shelf,i=>i.snapshot.clips.length===1);assert.deepEqual(merged.snapshot.ideas,before.ideas);assert.deepEqual(merged.snapshot.clips[0].ideaIds,['a','c','b']);assert.equal(merged.snapshot.clips[0].currentId,'b');receipt.checks.push('packaged-Merge-targets-current-paper-and-keeps-content');
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('b'))).ok);
  await app.evaluate(()=>{const {menu,options}=globalThis.packagedSplitMenu;menu.items.find(i=>i.label==='Organize')?.submenu.items.find(i=>i.label==='Undo merge').click();options.callback();});
  const restored=await waitForInfo(shelf,i=>i.snapshot.clips.length===2);assert.deepEqual(restored.snapshot.clips,split.snapshot.clips);receipt.checks.push('packaged-merge-undo-restores-both-groups');
 }catch(e){receipt.failure=e.stack;}
 finally{receipt.cleanup={normalQuit:false,profile:dir,profileRemoved:false,ownedPids:[],allExited:false};try{if(app){receipt.pids=[...new Set([app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))])];await app.close();receipt.cleanup.normalQuit=true;}if(!launchFailed&&receipt.pids.length){await cleanupIdleFixture(dir,receipt.pids);receipt.dataRemoved=true;receipt.cleanup.profileRemoved=true;receipt.cleanup.allExited=true;}else{receipt.cleanup.reason='No complete owned lifecycle; retain profile until process ownership and exit verified';}}catch(e){receipt.cleanupFailure=e.stack;}
  receipt.cleanup.ownedPids=receipt.pids;receipt.passed=!receipt.failure&&!receipt.cleanupFailure&&receipt.dataRemoved;await fs.writeFile(path.join(evidence,'packaged-split-worker.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));if(!receipt.passed)process.exitCode=1;}
})();
