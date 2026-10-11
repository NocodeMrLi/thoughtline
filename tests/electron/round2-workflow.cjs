const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs'),{_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
// Catches obstructing hints, fixed-height calendars, clipped focus, lost settings navigation and wrong-note stash.
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2');await fs.mkdir(root,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(root,(process.env.THOUGHTLINE_ATTEMPT||'workflow')+'-')),dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-round2-'));
 const receipt={platform:process.platform,arch:process.arch,dir,evidence,cases:[],pids:[],nativeOutsideClick:'not exercised by protocol fixture'};let app,manage,shelf;
 const check=async(name,action)=>{try{const detail=await action();receipt.cases.push({name,passed:true,detail});}catch(e){receipt.cases.push({name,passed:false,error:String(e)});}};
 try{
  const now=new Date().toISOString(),ideas=[0,1,2].map(n=>({id:'r2-'+n,text:'正文中文😀\n第二行 '+n,title:'测试 '+n,agentId:'general',project:'保留分组',status:'hanging',createdAt:now,updatedAt:now}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas,clips:[{id:'group',ideaIds:ideas.map(i=>i.id),currentId:'r2-1',agentId:'general',position:.4}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}}));
  app=await _electron.launch(await launchOptions(dir,{stationaryTopCursor:true}));({manage,shelf}=await warmViews(app));assert.equal((await manage.evaluate(()=>window.thoughtline.storageInfo())).value.directory,dir);
  await shelf.evaluate(()=>window.thoughtline.openManage('r2-1'));await manage.waitForSelector('.idea-reader');
  await check('hint-delay-small-dismiss-on-menu',async()=>{
   const b=manage.getByRole('button',{name:'更多操作',exact:true});await b.hover();await manage.waitForTimeout(120);assert.equal(await manage.locator('.icon-tooltip').count(),0,'hover must not show hint immediately');await manage.waitForTimeout(550);
   const tip=manage.locator('.icon-tooltip');await tip.waitFor();const r=await tip.boundingBox();assert(r.width<130,'short hint must fit its text');await b.click();assert.equal(await tip.count(),0,'open menu must dismiss hint');await manage.getByRole('button',{name:'删除当前念头（1张，可恢复）',exact:true}).waitFor();await b.click();return r;
  });
  await check('focus-ring-inside-editor-edges',async()=>{
   await manage.getByRole('button',{name:'编辑',exact:true}).click();const text=manage.getByRole('textbox',{name:'编辑正文',exact:true});await text.focus();
   const geometry=await text.evaluate(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return {outline:c.outlineWidth,offset:c.outlineOffset,shadow:c.boxShadow,border:c.borderColor,x:r.x,right:r.right,parentX:p.x,parentRight:p.right};});
   await manage.screenshot({path:path.join(evidence,'editor.png')});const outward=parseFloat(geometry.outline)+parseFloat(geometry.offset);assert(outward<=0||geometry.x-outward>=geometry.parentX&&geometry.right+outward<=geometry.parentRight,'focus stroke must fit clipping ancestor');await manage.getByRole('button',{name:'完成编辑',exact:true}).first().click();return geometry;
  });
  await shelf.evaluate(()=>window.thoughtline.openManage());await manage.waitForSelector('.month-grid');
  await check('calendar-fills-resized-height-and-arrows',async()=>{
   await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').setSize(950,670));await manage.waitForTimeout(500);
   const sample=await manage.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {height:b.height,bottom:b.bottom,width:b.width};};return {content:r(document.querySelector('.calendar-content')),grid:r(document.querySelector('.month-grid')),cell:r(document.querySelector('.date-cell')),arrow:r(document.querySelector('.calendar-navigation button')),svg:document.querySelector('.calendar-navigation button svg')?.getBoundingClientRect().width??0};});
   await manage.screenshot({path:path.join(evidence,'calendar.png')});assert(sample.content.bottom-sample.grid.bottom<16,'calendar must use available height');assert(sample.cell.height>65,'date rows must grow');assert(sample.arrow.width>=32&&sample.arrow.height>=32&&sample.svg>=18,'navigation must have readable chevron and click target');return sample;
  });
  await check('settings-back-restores-month-and-window',async()=>{
   await manage.getByRole('button',{name:'上个月',exact:true}).click();const title=await manage.locator('.calendar-title').innerText();
   await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'存储与设置',exact:true}).click();await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('tab',{name:'操作',exact:true}).click();
   const back=manage.getByRole('button',{name:'返回Thoughtline日历',exact:true});assert.equal(await back.count(),1,'settings must expose return');await back.click();await manage.waitForSelector('.month-grid');assert.equal(await manage.locator('.calendar-title').innerText(),title,'return must retain selected month');const width=await manage.evaluate(()=>innerWidth);assert.equal(width,950,'return restores calendar geometry');return {title,width};
  });
  await check('settings-dirty-return-retains-draft-and-close-cancels',async()=>{
   await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'存储与设置',exact:true}).click();await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('tab',{name:'操作',exact:true}).click();
   const checkbox=manage.getByRole('checkbox',{name:'减少动态效果',exact:true});await checkbox.check();await manage.getByRole('button',{name:'返回Thoughtline日历',exact:true}).click();await manage.waitForSelector('.month-grid');
   await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'存储与设置',exact:true}).click();await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('tab',{name:'操作',exact:true}).click();assert(await checkbox.isChecked(),'return must retain unsaved settings draft');
   await manage.getByRole('button',{name:'关闭设置',exact:true}).click();await manage.getByRole('dialog',{name:'设置尚未保存',exact:true}).waitFor();assert.equal(await manage.evaluate(()=>document.activeElement?.textContent),'继续编辑');await manage.keyboard.press('Tab');assert.equal(await manage.evaluate(()=>document.activeElement?.textContent),'保存并关闭');await manage.keyboard.press('Escape');assert.equal(await manage.locator('.settings-leave-prompt').count(),0);assert.equal(await manage.locator('[data-mode=settings]').count(),1);await checkbox.uncheck();await manage.getByRole('button',{name:'返回Thoughtline日历',exact:true}).click();await manage.waitForSelector('.month-grid');return {draftRetained:true,closeCanceled:true};
  });
  await check('settings-external-update-does-not-invent-dirty-draft',async()=>{
   await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'存储与设置',exact:true}).click();await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('tab',{name:'操作',exact:true}).click();
   const changed=await manage.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.saveSettings({...i.snapshot.settings,reducedMotion:true},i.snapshot.revision);});assert(changed.ok,changed.message);await manage.getByRole('tab',{name:'操作',exact:true}).click();await manage.getByRole('checkbox',{name:'减少动态效果',exact:true}).waitFor();await manage.waitForFunction(()=>document.querySelector('.motion-setting input').checked);
   const opened=await shelf.evaluate(()=>window.thoughtline.openManage());assert(opened.ok,opened.message);await manage.waitForSelector('.month-grid');assert.equal(await manage.locator('.settings-leave-prompt').count(),0);return {externalChangeRebased:true,navigationAllowed:true};
  });
  await check('settings-discard-clears-hidden-close-guard',async()=>{
   await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'存储与设置',exact:true}).click();await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('tab',{name:'操作',exact:true}).click();
   await manage.getByRole('checkbox',{name:'减少动态效果',exact:true}).uncheck();await manage.getByRole('button',{name:'关闭设置',exact:true}).click();await manage.getByRole('button',{name:'放弃修改',exact:true}).click();
   await waitForInfo(shelf,i=>!i.interactionLocked);const opened=await shelf.evaluate(()=>window.thoughtline.openManage());assert(opened.ok,opened.message);await manage.waitForSelector('.month-grid');return {discardAllowsNextVisit:true};
  });
  await check('menu-stash-current-preserves-other-pages',async()=>{
   await shelf.evaluate(async()=>{const i=await window.thoughtline.info();const r=await window.thoughtline.setStatus('r2-1','hanging',i.snapshot.revision);if(!r.ok)throw Error(r.message);});await waitForInfo(shelf,i=>i.shelfVisible);
   await shelf.evaluate(()=>window.thoughtline.dragLock(true));const opened=await shelf.evaluate(()=>window.thoughtline.shelfMenu('r2-1'));assert(opened.ok,opened.message);
   const labels=await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.map(i=>i.label));assert(labels.includes('Thoughtline日历'),'calendar entry uses unified name');assert(labels.includes('收起当前念头'),'current-note stash available');
   await app.evaluate(()=>globalThis.thoughtlineTestPopup.menu.items.find(i=>i.label==='收起当前念头').click());
   await waitForInfo(shelf,i=>i.snapshot.ideas.find(i=>i.id==='r2-1').status==='archived');
   const s=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;assert.equal(s.ideas.find(i=>i.id==='r2-1').text,ideas[1].text);assert.equal(s.ideas.find(i=>i.id==='r2-1').project,'保留分组');assert.deepEqual(s.clips[0].ideaIds,['r2-0','r2-2']);assert.equal(s.clips[0].currentId,'r2-2');assert.equal(s.clips[0].position,.4);await app.evaluate(()=>globalThis.thoughtlineTestPopup.options.callback());await shelf.evaluate(()=>window.thoughtline.dragLock(false));return {labels,ids:s.clips[0].ideaIds,current:s.clips[0].currentId};
  });
  await check('navigation-performance-baseline',async()=>{
   await shelf.evaluate(()=>window.thoughtline.openManage());await manage.waitForSelector('.month-grid');const times=[];
   for(let n=0;n<10;n++){const start=Date.now();await manage.getByRole('button',{name:n%2?'下个月':'上个月',exact:true}).click();await manage.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));times.push(Date.now()-start);}
   const sorted=[...times].sort((a,b)=>a-b);return {samples:times,p50:sorted[4],p95:sorted[9],scope:'Playwright input plus two actual renderer frames, controlled environment'};
  });
 }catch(e){receipt.failure=e.stack;}finally{
  try{if(app){receipt.pids=[...new Set([app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))])];await app.close();receipt.normalClose=true;await cleanupIdleFixture(dir,receipt.pids);receipt.dataRemoved=true;}}catch(e){receipt.cleanupFailure=e.stack;}
  receipt.passed=!receipt.failure&&!receipt.cleanupFailure&&receipt.dataRemoved&&receipt.cases.every(c=>c.passed);await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));if(!receipt.passed)process.exitCode=1;
 }
})();
