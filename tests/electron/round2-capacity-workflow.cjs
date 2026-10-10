const {launchOptions,warmViews,openComposer,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
// Real renderer/main/persistence checks. Each case owns a synthetic profile and exits normally.
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2/capacity');await fs.mkdir(root,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(root,(process.env.THOUGHTLINE_ATTEMPT||'capacity')+'-'));const receipt={platform:process.platform,arch:process.arch,evidence,cases:[]};
 const run=async(name,count,action)=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-capacity-'));let app;const result={name,dir,passed:false};
  try{const now=new Date().toISOString(),ideas=Array.from({length:count},(_,n)=>({id:'c'+n,title:'合成目标 '+n,text:'合成正文 中文😀\n'+n,project:'保留项目',agentId:'general',status:'hanging',createdAt:now,updatedAt:now}));
   ideas.push({id:'history',title:'待挂历史',text:'完整历史\n中文😀',project:'保留项目',agentId:'general',status:'archived',createdAt:now,updatedAt:now});
   await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:3,revision:0,ideas,clips:ideas.filter(i=>i.status==='hanging').map(i=>({id:'clip:'+i.id,agentId:i.agentId,ideaIds:[i.id],currentId:i.id,position:null})),agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}}));
   app=await _electron.launch(await launchOptions(dir));const views=await warmViews(app);assert.equal((await views.manage.evaluate(()=>window.thoughtline.storageInfo())).value.directory,dir);
   result.detail=await action(app,views,dir);
   // Capture the view the case actually leaves visible. The warmed Manage window
   // is hidden after Composer cases; capturing it stalls on Windows until teardown.
   result.windows=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({title:w.getTitle(),url:w.webContents.getURL(),visible:w.isVisible()})));
   const expected={
    'calendar-open-immediate-hang':'Thoughtline Manage','more-menu-content-width':'Thoughtline Manage',
    'new-swap-cancel-confirm-undo':'Thoughtline Shelf','calendar-swap-open-focus-retained':'Thoughtline Manage',
    'stale-target-retains-draft':'Thoughtline Composer','write-failure-in-picker-keeps-old-and-new-content':'Thoughtline Manage',
    'composer-write-failure-keeps-focus-and-draft':'Thoughtline Shelf','native-show-all-Agent-label-and-selection':'Thoughtline Manage',
   }[name];
   if(expected)assert(result.windows.some(w=>w.title===expected&&w.visible),`${name} must leave ${expected} visible`);
   if(name==='full-composer-save-stays-out-of-reader'){
    assert(!result.windows.some(w=>w.visible&&['Thoughtline Manage','Thoughtline Composer'].includes(w.title)),'save must close Composer without opening a reader');
    result.intentionalAbsence='Saved-only flow closes Composer and leaves Manage hidden; see the pre-submit screenshot.';
   }
   result.screenshots=[];
   for(const w of result.windows.filter(w=>w.visible)){
    const page=(await app.windows()).find(p=>p.url()===w.url);assert(page,`visible ${w.title} must have a capture target`);
    const file=name+'-'+w.title.replaceAll(' ','-')+'.png';await page.screenshot({path:path.join(evidence,file)});result.screenshots.push(file);
   }
   result.passed=true;
  }catch(e){result.error=e.stack;}finally{if(app){try{result.pids=[...new Set([app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))])];await app.close();result.normalClose=true;await cleanupIdleFixture(dir,result.pids);result.dataRemoved=true;}catch(e){result.cleanupError=e.stack;}}else{await fs.rm(dir,{recursive:true,force:true});result.dataRemoved=true;}receipt.cases.push(result);}
 };
 await run('calendar-open-immediate-hang',1,async(app,{shelf,manage})=>{
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('history'))).ok);await manage.waitForSelector('[data-reader-id=history]');
  await manage.getByRole('button',{name:'重新挂上',exact:true}).click();await waitForInfo(manage,i=>i.snapshot.ideas.find(x=>x.id==='history').status==='hanging');
  await shelf.waitForSelector('.hanging[data-clip-id="clip:history"]',{state:'attached',timeout:2500});
  assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Manage'&&w.isVisible())));return {calendarKeptOpen:true,shelfUpdated:true};
 });
 await run('more-menu-content-width',1,async(app,{shelf,manage})=>{
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('c0'))).ok);await manage.waitForSelector('.idea-reader');await manage.getByRole('button',{name:'更多操作',exact:true}).click();
  const g=await manage.locator('.reader-more').evaluate(el=>{const range=document.createRange();const button=el.querySelector('button');range.selectNodeContents(button);return {menu:el.getBoundingClientRect().width,content:range.getBoundingClientRect().width,button:getComputedStyle(button).backgroundColor};});
  await manage.screenshot({path:path.join(evidence,'compact-menu-open.png')});
  assert(g.menu-g.content<48,'menu must fit content rather than impose a 290px blank strip');
  await manage.locator('.reader-more').hover();await manage.waitForTimeout(250);assert.equal(await manage.locator('.reader-more').count(),1,'moving into the menu must not dismiss it');
  await manage.mouse.move(8,100);await manage.waitForTimeout(350);assert.equal(await manage.locator('.reader-more').count(),0,'leaving the combined anchor/menu area dismisses it');
  await manage.getByRole('button',{name:'更多操作',exact:true}).click();await manage.keyboard.press('Home');await manage.waitForTimeout(300);assert.equal(await manage.locator('.reader-more').count(),1,'keyboard use must not require pointer hovering');assert.equal(await manage.locator('.reader-more').evaluate(el=>getComputedStyle(el).animationName),'none','app reduced motion applies to portal menu');await manage.keyboard.press('Escape');assert.equal(await manage.locator('.reader-more').count(),0);assert.equal(await manage.locator('.idea-reader').count(),1,'Esc closes menu, not the reader');
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.locator('.calendar-tools').hover();await manage.waitForTimeout(250);assert.equal(await manage.locator('.calendar-tools').count(),1);await manage.mouse.move(8,400);await manage.waitForTimeout(350);assert.equal(await manage.locator('.calendar-tools').count(),0);
  await manage.getByRole('textbox',{name:'搜索念头',exact:true}).fill('合成目标 0');await manage.locator('.calendar-paper').click();await manage.getByRole('button',{name:'更多操作',exact:true}).click();await manage.locator('.reader-more').hover();await manage.mouse.move(8,100);await manage.waitForTimeout(350);assert.equal(await manage.locator('.reader-more').count(),0);
  return {...g,detailAndCalendarReaderAndHeaderLeaveClose:true,bridgeSafe:true};
 });
 await run('new-swap-cancel-confirm-undo',40,async(app,{shelf,manage})=>{
  const composer=await openComposer(app,shelf),body=' 新换上的中文😀\n第二行 ';await composer.locator('#idea-text').fill(body);
  await composer.getByRole('button',{name:'换上',exact:true}).click();await composer.locator('.placement-target>button').first().click();await composer.getByRole('button',{name:'返回',exact:true}).click();assert.equal(await composer.locator('#idea-text').inputValue(),body);
  await composer.getByRole('button',{name:'换上',exact:true}).click();await composer.locator('.placement-target>button').first().click();await composer.screenshot({path:path.join(evidence,'composer-swap-picker.png')});await composer.locator('.placement-confirm>.primary').click();
  const info=await waitForInfo(shelf,i=>i.snapshot.ideas.some(x=>x.text===body));const fresh=info.snapshot.ideas.find(x=>x.text===body);assert.equal(fresh.status,'hanging');const clip=info.snapshot.clips.find(c=>c.ideaIds.includes(fresh.id));await shelf.waitForSelector(`.hanging[data-idea-id="${fresh.id}"]`,{state:'attached'});
  assert.equal(info.snapshot.ideas.filter(x=>x.status==='archived'&&x.id!=='history').length,1);assert.equal(info.snapshot.ideas.length,42);
  const undone=await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.clipChange({kind:'undo'},i.snapshot.revision);});assert(undone.ok,undone.message);assert.equal(undone.value.ideas.find(x=>x.id===fresh.id).status,'archived');assert.equal(undone.value.ideas.filter(x=>x.id.startsWith('c')&&x.status==='hanging').length,40);
  return {incomingId:fresh.id,slot:clip.id,cancelKeptText:true,undoKeepsNewRecord:true};
 });
 await run('calendar-swap-open-focus-retained',40,async(app,{shelf,manage})=>{
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('history'))).ok);await manage.getByRole('button',{name:'换上',exact:true}).click();await manage.locator('.placement-target>button').first().click();await manage.locator('.placement-confirm>.primary').click();
  await waitForInfo(manage,i=>i.snapshot.clips.some(c=>c.currentId==='history'));await shelf.waitForSelector('.hanging[data-idea-id="history"]',{state:'attached'});
  assert.equal(await manage.locator('[data-reader-id=history]').count(),1);assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Manage'&&w.isFocused()&&w.isVisible())),'swap must retain reader focus');
  assert.equal(await manage.getByRole('button',{name:'撤销换上',exact:true}).count(),1,'placement undo must describe the action accurately');assert.equal(await manage.locator('.reader-notice').innerText(),'已换上，旧念头已收起。');await manage.waitForTimeout(1750);assert.equal(await manage.locator('.reader-notice').innerText(),'');return {readerKeptOpen:true,focusRetained:true,successExpires:true};
 });
 await run('stale-target-retains-draft',40,async(app,{shelf,manage})=>{
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('不丢失的草稿😀');await composer.getByRole('button',{name:'换上',exact:true}).click();await composer.locator('.placement-target>button').first().click();
  const changed=await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.setStatus('c0','archived',i.snapshot.revision);});assert(changed.ok,changed.message);
  await composer.waitForFunction(()=>document.querySelector('.placement-confirm>.primary').disabled);assert.equal(await composer.locator('#idea-text').inputValue(),'不丢失的草稿😀');await composer.getByRole('button',{name:'返回',exact:true}).click();assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas.length,41);return {staleChoiceDisabled:true,noDuplicate:true};
 });
 await run('write-failure-in-picker-keeps-old-and-new-content',40,async(app,{shelf,manage},dir)=>{
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('history'))).ok);await manage.getByRole('button',{name:'换上',exact:true}).click();await manage.locator('.placement-target>button').first().click();
  const before=(await manage.evaluate(()=>window.thoughtline.info())).snapshot;const file=path.join(dir,'snapshot.json'),kept=path.join(dir,'snapshot.kept.json');await fs.rename(file,kept);await fs.mkdir(file);
  try{await manage.locator('.placement-confirm>.primary').click();await manage.locator('.placement-picker .error').waitFor();assert((await manage.locator('.placement-picker .error').innerText()).includes('本地保存未成功'));assert.equal(await manage.locator('.placement-picker').count(),1);assert.deepEqual((await manage.evaluate(()=>window.thoughtline.info())).snapshot,before);}
  finally{await fs.rm(file,{recursive:true,force:true});await fs.rename(kept,file);}
  await manage.locator('.placement-confirm>.primary').click();await waitForInfo(manage,i=>i.snapshot.clips.some(c=>c.currentId==='history'));return {failedWriteAtomic:true,pickerRetained:true,retrySucceeded:true};
 });
 await run('composer-write-failure-keeps-focus-and-draft',40,async(app,{shelf},dir)=>{
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('保留失败草稿😀');await composer.getByRole('button',{name:'换上',exact:true}).click();await composer.locator('.placement-target>button').first().click();
  await composer.waitForTimeout(350);const file=path.join(dir,'snapshot.json'),kept=path.join(dir,'snapshot.kept.json');await fs.rename(file,kept);await fs.mkdir(file);
  try{await composer.locator('.placement-confirm>.primary').click();await composer.waitForFunction(()=>!!document.querySelector('.placement-picker .error')&&!document.querySelector('.placement-confirm>.primary').disabled);assert(await composer.locator('.placement-picker').evaluate(el=>el.contains(document.activeElement)),'save failure must not steal focus into the covered textarea');assert.equal(await composer.locator('#idea-text').inputValue(),'保留失败草稿😀');assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas.length,41);}
  finally{await fs.rm(file,{recursive:true,force:true});await fs.rename(kept,file);}
  await composer.locator('.placement-confirm>.primary').click();await waitForInfo(shelf,i=>i.snapshot.ideas.length===42);return {failedDraftKept:true,pickerFocusRetained:true,retrySucceeded:true};
 });
 await run('native-show-all-Agent-label-and-selection',1,async(app,{shelf,manage})=>{
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('c0'))).ok);assert((await shelf.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.setStatus('c0','hanging',i.snapshot.revision);})).ok);await waitForInfo(shelf,i=>i.shelfVisible);assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('c0'))).ok);
  const initial=await app.evaluate(()=>{const item=globalThis.thoughtlineTestPopup.menu.items.find(x=>x.label==='显示全部标签');return {checked:item.checked,type:item.type};});assert.deepEqual(initial,{checked:true,type:'checkbox'});
  await app.evaluate(()=>{const {menu,options}=globalThis.thoughtlineTestPopup;menu.items.find(x=>x.label==='只看 通用').click();options.callback();});await waitForInfo(shelf,i=>i.shelfAgentId==='general');assert((await shelf.evaluate(()=>window.thoughtline.shelfMenu('c0'))).ok);assert.equal(await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.find(x=>x.label==='显示全部标签').checked),false);
  await app.evaluate(()=>{const {menu,options}=globalThis.thoughtlineTestPopup;menu.items.find(x=>x.label==='显示全部标签').click();options.callback();});await waitForInfo(shelf,i=>i.shelfAgentId==='all');assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas.find(x=>x.id==='history').status,'archived');return {filterOnly:true,checkmarkTracksFilter:true};
 });
 await run('full-composer-save-stays-out-of-reader',40,async(app,{shelf,manage})=>{
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('新建原文 中文😀\n首尾保留 ');
  const button=composer.locator('.composer-submit .primary');assert.equal(await button.innerText(),'保存','full capacity must be known before submission');await composer.screenshot({path:path.join(evidence,'full-composer-before-save.png')});await button.click();
  const info=await waitForInfo(shelf,i=>i.snapshot.ideas.some(x=>x.text.startsWith('新建原文')));assert.equal(info.snapshot.ideas.at(-1).status,'archived');assert.equal(info.placementNotice,null);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Manage'&&w.isVisible())),false);return {archived:true,noReaderJump:true};
 });
 receipt.passed=receipt.cases.every(c=>c.passed&&c.normalClose&&c.dataRemoved&&!c.cleanupError);await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));if(!receipt.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
