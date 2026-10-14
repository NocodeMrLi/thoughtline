const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {launchOptions,waitForInfo,bounded}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-r609-tray-')),out=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round6/r609/local');await fs.mkdir(out,{recursive:true});
 const stamp='2026-10-14T08:00:00Z',seed={schemaVersion:4,revision:0,ideas:[{id:'demo',title:'Tray fixture',text:'Original text remains unchanged 😀',project:'',agentId:'general',status:'hanging',createdAt:stamp,updatedAt:stamp,createdDay:'2026-10-14',creationTimeZone:'UTC'}],clips:[{id:'clip-demo',agentId:'general',ideaIds:['demo'],currentId:'demo',position:null}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],projects:[],draft:null,settings:{writeHotkey:'Control+Alt+Shift+F19',reducedMotion:true}};
 await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(seed));await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale:'zh-CN',theme:'light'}));
 let app,proc,sequence=1;const receipt={profile:dir,platform:process.platform,packaged:!!process.env.THOUGHTLINE_EXECUTABLE,checks:[],pids:[],normalQuit:false,cleaned:false};
 try{
  if(receipt.packaged)app=await _electron.launch({executablePath:path.resolve(process.env.THOUGHTLINE_EXECUTABLE),args:[],env:require('./packaged-launch.cjs').sanitizedPackagedEnv(process.env,dir)});
  else app=await _electron.launch(await launchOptions(dir));
  proc=app.process();receipt.pids.push(proc.pid);await fs.writeFile(path.join(out,'ownership.json'),JSON.stringify({profile:dir,pid:proc.pid,fixture:'round6-tray-menu'}));const shelf=await app.firstWindow();await shelf.locator('[data-view=shelf]').waitFor({state:'attached'});
  await app.evaluate(({Tray,Menu,screen,app,BrowserWindow})=>{const protect=w=>{w.setFocusable(false);w.setIgnoreMouseEvents(true,{forward:true});};for(const w of BrowserWindow.getAllWindows())protect(w);app.on('browser-window-created',(_e,w)=>protect(w));const original=Tray.prototype.setContextMenu;Tray.prototype.setContextMenu=function(menu){globalThis.r609Tray=menu;return original.call(this,menu);};Menu.prototype.popup=function(options){globalThis.r609Popup={menu:this,options};};globalThis.r609Cursor={x:screen.getPrimaryDisplay().bounds.x+300,y:screen.getPrimaryDisplay().bounds.y+1};screen.getCursorScreenPoint=()=>globalThis.r609Cursor;});
  const menu=()=>app.evaluate(()=>globalThis.r609Tray.items.map(i=>({label:i.label,type:i.type,enabled:i.enabled,submenu:!!i.submenu})));
  const choose=()=>app.evaluate(()=>globalThis.r609Tray.items[0].click());
  const {managerPage}=require('./classification-fixture.cjs');
  const labels={ 'zh-CN':['暂停悬停','恢复悬停','退出'],en:['Pause hover','Resume hover','Quit']};
  for(const locale of ['zh-CN','en']){
   assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);const manage=await managerPage(app);
   const changed=await manage.evaluate(({locale,seq})=>window.thoughtline.setPreferences({locale,theme:'light'},seq),{locale,seq:sequence++});assert(changed.ok,changed.message);
   assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);await waitForInfo(shelf,i=>!i.interactionLocked);
   let rows=await menu();assert.deepEqual(rows.map(i=>i.label),[labels[locale][0],'',labels[locale][2]],'only pause, separator and quit are offered');assert.equal(rows[1].type,'separator');assert(rows.every(i=>!i.submenu));
   await waitForInfo(shelf,i=>i.shelfVisible);const before=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
   await choose();await waitForInfo(shelf,i=>!i.shelfVisible);assert.equal((await menu())[0].label,labels[locale][1]);
   await app.evaluate(({powerMonitor})=>{powerMonitor.emit('suspend');powerMonitor.emit('lock-screen');});
   await choose();assert.equal((await menu())[0].label,labels[locale][0]);assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).shelfVisible,false,'manual resume must not release sleep/lock');
   await app.evaluate(({powerMonitor})=>powerMonitor.emit('resume'));assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).shelfVisible,false,'lock stays paused after sleep resumes');
   await app.evaluate(({powerMonitor})=>powerMonitor.emit('unlock-screen'));await waitForInfo(shelf,i=>i.shelfVisible);
   assert((await shelf.evaluate(()=>window.thoughtline.dragLock(true))).ok);await choose();await waitForInfo(shelf,i=>!i.shelfVisible&&!i.interactionLocked);await choose();await waitForInfo(shelf,i=>i.shelfVisible);
   await shelf.evaluate(()=>{const element=document.querySelector('.card-copy'),dt=new DataTransfer();globalThis.r609Transfer=dt;element.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt}));});await waitForInfo(shelf,i=>i.textDragActive&&i.interactionLocked);await choose();await waitForInfo(shelf,i=>!i.shelfVisible&&!i.textDragActive&&!i.interactionLocked);await choose();await waitForInfo(shelf,i=>i.shelfVisible);
   await shelf.evaluate(()=>document.querySelector('.card-copy').dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:globalThis.r609Transfer})));
   assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,before,'pause and drag cancellation preserve original data');receipt.checks.push(locale+': two native actions, immediate labels, suspend/lock isolation, peg/text drag cancellation and unchanged data');
  }
  // Shelf native New action still opens Composer after tray shortcuts are removed.
  assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('demo'))).ok);await app.evaluate(()=>{const item=globalThis.r609Popup.menu.items.find(i=>i.label==='New thought');if(!item)throw Error('Shelf New action missing');item.click();});
  let composer;await bounded((async()=>{while(!composer){composer=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!composer)await new Promise(r=>setTimeout(r,25));}})(),'actual Composer ready',10000);await composer.locator('#idea-text').fill('Unsubmitted tray quit draft 😀\nSecond line preserved');
  receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));
  const exited=new Promise(r=>proc.exitCode!==null?r():proc.once('exit',r));await app.evaluate(()=>globalThis.r609Tray.items.at(-1).click());await bounded(exited,'actual tray quit preserves draft',15000);receipt.normalQuit=true;
  const stored=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));assert.equal(stored.draft.text,'Unsubmitted tray quit draft 😀\nSecond line preserved');assert.equal(stored.ideas[0].text,seed.ideas[0].text);receipt.checks.push('actual shelf New callback available; actual tray Quit persisted live unsaved draft and original note');
 }catch(e){receipt.failure=e.stack;throw e;}finally{
  if(app&&proc.exitCode===null){receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)).catch(()=>[]));const exited=new Promise(r=>proc.once('exit',r));await app.evaluate(({app})=>app.quit()).catch(()=>{});await bounded(exited,'owned application normal quit',15000).then(()=>receipt.normalQuit=true).catch(e=>{receipt.quitFailure=String(e);});}
  receipt.pids=[...new Set(receipt.pids)];if(receipt.normalQuit){await cleanupIdleFixture(dir,receipt.pids);receipt.cleaned=true;}
  await fs.writeFile(path.join(out,'tray-'+process.platform+(receipt.packaged?'-packaged':'-source')+'.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({passed:!receipt.failure,checks:receipt.checks.length,normalQuit:receipt.normalQuit,cleaned:receipt.cleaned}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
