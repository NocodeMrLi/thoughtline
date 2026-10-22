// SPDX-License-Identifier: GPL-3.0-only
const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');

const evidenceRoot=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round1/calendar-motion');
const attempt=process.env.THOUGHTLINE_ATTEMPT||`attempt-${Date.now()}-${process.pid}`;
const evidence=path.join(evidenceRoot,attempt);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const closeEnough=(a,b)=>Math.abs(a-b)<3;

(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-calendar-motion-'));
 await fs.mkdir(evidenceRoot,{recursive:true});await fs.mkdir(evidence);
 let app,manage,pids=[],normalClose=false,assertionsComplete=false,dataRemoved=false,compositionStarted=false,stage='launch',failure=null,cleanupError=null,recoveryError=null,outcome=null;
 try{
  const date=new Date(),pad=n=>String(n).padStart(2,'0'),day=`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`,month=day.slice(0,7);
  const ideas=Array.from({length:30},(_,n)=>({id:`motion-${n}`,text:`运动测试正文${n}`,title:`运动测试${n}`,project:'',agentId:'general',status:'hanging',createdAt:`${day}T12:00:00Z`,updatedAt:`${day}T12:00:00Z`}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas,clips:ideas.map(i=>({id:`clip-${i.id}`,agentId:'general',ideaIds:[i.id],currentId:i.id,position:null})),agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}}));
  app=await _electron.launch(await launchOptions(dir));
  const views=await warmViews(app),shelf=views.shelf;manage=views.manage;
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);
  await manage.waitForSelector('[data-mode=calendar]');
  stage='saved-reduced-motion';await manage.locator(`[data-day="${day}"]`).click();
  assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'saved reduced-motion setting skips spatial zoom');
  await manage.getByRole('button',{name:'返回',exact:true}).click();
  assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'saved reduced-motion setting skips reverse zoom');
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);
  assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);await manage.waitForSelector('[data-mode=settings]');
  const settingsSaved=await manage.evaluate(async()=>{const current=await window.thoughtline.info();return window.thoughtline.saveSettings({...current.snapshot.settings,reducedMotion:false},current.snapshot.revision);});
  assert(settingsSaved.ok,settingsSaved.message);await waitForInfo(manage,i=>i.snapshot.settings.reducedMotion===false);
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('[data-mode=calendar]');
  // Pause at creation, before locator/layout/screenshot round trips consume 210ms.
  const sampledClick=async click=>{await manage.evaluate(()=>{const before=document.querySelector('[data-calendar-motion]');window.__motionSampleSeen=false;const observer=new MutationObserver(()=>{const layer=document.querySelector('[data-calendar-motion]');if(!layer||layer===before)return;for(const a of document.getAnimations()){a.pause();a.currentTime=0;}window.__motionSampleSeen=true;observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});});await click();await manage.waitForFunction(()=>window.__motionSampleSeen);if(process.env.THOUGHTLINE_MOTION_SAMPLE_DELAY)await pause(Number(process.env.THOUGHTLINE_MOTION_SAMPLE_DELAY));};
  const box=selector=>manage.locator(selector).boundingBox();
  const sample=async(target,ms,file)=>{await manage.locator('[data-calendar-motion]').evaluate((el,{target,ms})=>{for(const animation of [...el.getAnimations(),...document.querySelector(target).getAnimations()]){animation.pause();animation.currentTime=ms;}},{target,ms});await manage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));const measured=await manage.locator('[data-calendar-motion]').evaluate((el,{target,ms})=>{const a=el.getBoundingClientRect(),b=document.querySelector(target).getBoundingClientRect();return {sampledTimeMs:ms,sourceVisual:{left:a.left,top:a.top,width:a.width,height:a.height},targetVisual:{left:b.left,top:b.top,width:b.width,height:b.height}};},{target,ms});await manage.screenshot({path:path.join(evidence,file),animations:'allow'});return measured;};
  const resume=async target=>manage.locator('[data-calendar-motion]').evaluate((el,target)=>{for(const animation of [...el.getAnimations(),...document.querySelector(target).getAnimations()])animation.play();},target);
  const motion=()=>manage.locator('[data-calendar-motion]').evaluate(el=>({from:JSON.parse(el.dataset.from),to:JSON.parse(el.dataset.to),kind:el.dataset.calendarMotion,duration:el.getAnimations()[0]?.effect?.getTiming().duration,pointer:getComputedStyle(el).pointerEvents,aria:el.getAttribute('aria-hidden'),inert:el.inert,sourceClass:el.firstElementChild?.className,sourceText:el.textContent,visibleCards:el.querySelectorAll('.calendar-paper').length,duplicateSelectors:el.querySelectorAll('[id],[data-idea-id],[data-day],[data-month],[aria-label]').length}));
  const check=async(from,to,kind)=>{
   const item=await motion(),dest=await box(to);
   assert.equal(item.kind,kind);assert(item.duration>=200&&item.duration<=260);
   assert.equal(item.pointer,'none');assert.equal(item.aria,'true');assert.equal(item.inert,true);assert.equal(item.duplicateSelectors,0);
   assert(closeEnough(item.from.left,from.x)&&closeEnough(item.from.top,from.y),'source must be clicked geometry');
   if(kind!=='year-to-month'&&kind!=='month-to-day')assert(closeEnough(item.to.left,dest.x)&&closeEnough(item.to.top,dest.y),'destination must be rendered geometry');
   else assert(item.to.width>0&&item.to.height>0,'expanding destination has measured geometry');
   return item;
  };
  stage='month-to-year';const monthGrid=await box('.month-grid');
  await sampledClick(()=>manage.locator('.calendar-title').click());
  const collapsed=await check({x:monthGrid.x,y:monthGrid.y},`[data-month="${month}"]`,'month-to-year');
  assert.equal(collapsed.sourceClass,'month-grid');assert(collapsed.sourceText.includes('1'));
  const yearFrames=[await sample(`[data-month="${month}"]`,25,'month-to-year-frame-1.png'),await sample(`[data-month="${month}"]`,105,'month-to-year-frame-2.png'),await sample(`[data-month="${month}"]`,185,'month-to-year-frame-3.png')];
  assert(yearFrames[0].sourceVisual.width>yearFrames[1].sourceVisual.width&&yearFrames[1].sourceVisual.width>yearFrames[2].sourceVisual.width,'visible month grid shrinks toward matching year tile');
  await resume(`[data-month="${month}"]`);
  await pause(270);assert.equal(await manage.locator('[data-calendar-motion]').count(),0);
  stage='year-to-month';const tile=await box(`[data-month="${month}"]`);
  await sampledClick(()=>manage.locator(`[data-month="${month}"]`).click());
  await check({x:tile.x,y:tile.y},'.month-grid','year-to-month');
  assert(await manage.locator('.month-grid').evaluate(el=>el.getAnimations().some(a=>a.effect.getKeyframes().some(k=>String(k.transform).includes('scale')))),'month content itself expands');
  await resume('.month-grid');await pause(270);
  stage='month-to-day';const cell=await box(`[data-day="${day}"]`);
  await sampledClick(()=>manage.locator(`[data-day="${day}"]`).click());
  const expanded=await check({x:cell.x,y:cell.y},'.calendar-paper-groups','month-to-day');
  assert.equal(expanded.sourceClass,'date-cell');
  assert(await manage.locator('.calendar-paper-groups').evaluate(el=>el.getAnimations().some(a=>a.effect.getKeyframes().some(k=>String(k.transform).includes('scale')))),'day papers themselves expand');
  const dayFrames=[await sample('.calendar-paper-groups',25,'month-to-day-frame-1.png'),await sample('.calendar-paper-groups',115,'month-to-day-frame-2.png'),await sample('.calendar-paper-groups',205,'month-to-day-frame-3.png')];
  assert(dayFrames[0].targetVisual.width<dayFrames[1].targetVisual.width&&dayFrames[1].targetVisual.width<dayFrames[2].targetVisual.width,'real day papers expand from clicked date');
  await resume('.calendar-paper-groups');
  assert.equal(await manage.locator('.calendar-content .calendar-paper').count(),9);
  stage='day-to-month';const papers=await box('.calendar-paper-groups');await sampledClick(()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  const reverse=await motion();assert.equal(reverse.kind,'day-to-month');
  assert(closeEnough(reverse.from.left,papers.x),'reverse source must be the visible day papers');
  assert.equal(reverse.sourceClass,'calendar-paper-groups');assert(reverse.visibleCards>0&&reverse.visibleCards<=9);
  assert(closeEnough(reverse.to.left,(await box(`[data-day="${day}"]`)).x));
  await manage.screenshot({path:path.join(evidence,'day-to-month-frame.png')});
  stage='interruption';await sampledClick(()=>manage.locator('.calendar-title').click());
  assert.equal((await motion()).kind,'month-to-year','new navigation interrupts reverse transition');
  assert.equal(await manage.locator('[data-calendar-motion]').count(),1);
  await resume(`[data-month="${month}"]`);await pause(270);assert.equal(await manage.locator('[data-calendar-motion]').count(),0);
  await manage.locator(`[data-month="${month}"]`).click();await pause(270);
  await manage.locator(`[data-day="${day}"]`).click();await pause(270);
  stage='reader-scroll';await manage.locator('[data-calendar-scroll]').evaluate(el=>{el.scrollTop=200;el.addEventListener('click',()=>{window.__motionClickScroll=el.scrollTop;},{capture:true,once:true});});
  await manage.locator('[data-idea-id="motion-0"]').click();
  const before=await manage.evaluate(()=>window.__motionClickScroll);
  await manage.getByRole('button',{name:'返回',exact:true}).click();
  assert.equal(await manage.locator('[data-calendar-scroll]').evaluate(el=>el.scrollTop),before);
  stage='day-to-month-return-samples';await sampledClick(()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  const returnFrames=[await sample(`[data-day="${day}"]`,25,'day-to-month-frame-1.png'),await sample(`[data-day="${day}"]`,185,'day-to-month-frame-2.png')];
  assert(returnFrames[0].sourceVisual.width>returnFrames[1].sourceVisual.width,'visible day papers shrink into their date cell');
  await fs.writeFile(path.join(evidence,'sampled-frames.json'),JSON.stringify({method:'paused source WAAPI at controlled times; not wall-clock duration measurement',yearFrames,dayFrames,returnFrames},null,2));
  await resume(`[data-day="${day}"]`);await pause(270);
  await sampledClick(()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  assert.equal((await motion()).kind,'month-to-year');
  await resume(`[data-month="${month}"]`);await pause(270);
  stage='system-reduced-motion';await manage.emulateMedia({reducedMotion:'reduce'});
  await manage.locator(`[data-month="${month}"]`).click();
  assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'reduced motion must skip spatial overlay');
  assert.equal(await manage.locator(`[data-day="${day}"]`).count(),1);
  await manage.emulateMedia({reducedMotion:'no-preference'});
  stage='narrow-window';await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').setSize(500,620));
  await manage.locator(`[data-day="${day}"]`).click();
  assert.equal((await manage.locator('.paper-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns)).split(' ').length,2);
  await manage.getByRole('button',{name:'显示更多',exact:false}).click();
  assert.equal(await manage.locator('.calendar-content .calendar-paper').count(),27);
  await pause(270);assert.equal(await manage.locator('[data-calendar-motion]').count(),0);
  assert.equal(await manage.locator('.calendar-paper-groups').evaluate(el=>getComputedStyle(el).willChange),'auto');
  stage='bounded-visible-copy';await sampledClick(()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  const bounded=await motion();assert.equal(bounded.kind,'day-to-month');assert(bounded.visibleCards>0&&bounded.visibleCards<27,'offscreen loaded papers must not be cloned');assert.equal(bounded.duplicateSelectors,0);
  await resume(`[data-day="${day}"]`);await pause(270);assert.equal(await manage.locator('[data-calendar-motion]').count(),0);
  stage='composition-leave-guard';await manage.locator(`[data-day="${day}"]`).click();await pause(270);
  await manage.locator('.calendar-content [data-idea-id="motion-0"]').click();await pause(270);
  await manage.getByRole('button',{name:'编辑',exact:true}).click();
  const editor=manage.getByRole('textbox',{name:'编辑正文',exact:true});await editor.fill('守卫保存后的最后修改\n');
  await editor.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'中'})));compositionStarted=true;
  await manage.getByRole('button',{name:'返回',exact:true}).evaluate(el=>el.click());await pause(60);
  assert.equal(await manage.locator('[data-reader-id="motion-0"]').count(),1,'unconfirmed composition blocks navigation');
  assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'blocked leave must not start zoom');
  await editor.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'中'})));compositionStarted=false;
  await manage.getByRole('button',{name:'返回',exact:true}).click();
  await waitForInfo(manage,i=>i.snapshot.ideas.find(x=>x.id==='motion-0')?.text==='守卫保存后的最后修改\n');
  assert.equal(await manage.locator('.calendar-content [data-idea-id="motion-0"]').count(),1);await pause(270);
  assertionsComplete=true;
  outcome={scope:'source Electron real pixels, synthetic dates; not physical iPhone or Windows acceptance',host:{platform:process.platform,arch:process.arch,release:os.release()},day,month,entered:['month-to-year','year-to-month','month-to-day','day-to-month'],interruption:true,reduced:true,scroll:true,twoColumns:true,boundedCards:true,compositionGuard:true,evidence};
 }catch(error){failure=String(error);throw error;
 }finally{
  try{
   if(manage&&compositionStarted){try{await manage.getByRole('textbox',{name:'编辑正文',exact:true}).evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:''})));compositionStarted=false;const done=manage.getByRole('button',{name:'完成编辑',exact:true});if(await done.count())await done.first().click();}catch(error){recoveryError=String(error);}}
   if(app){pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();normalClose=true;}
   if(normalClose&&!recoveryError){await cleanupIdleFixture(dir,pids);dataRemoved=await fs.stat(dir).then(()=>false,e=>{if(e.code==='ENOENT')return true;throw e;});assert(dataRemoved);}
  }catch(error){cleanupError=String(error);}
  const passed=assertionsComplete&&normalClose&&dataRemoved&&!cleanupError&&!recoveryError;
  await fs.writeFile(path.join(evidence,'cleanup.json'),JSON.stringify({stage,directory:dir,pids,normalClose,dataRemoved,allExited:dataRemoved,assertionsComplete,passed,failure,recoveryError,cleanupError},null,2));
  if(cleanupError||recoveryError)throw Error(cleanupError||recoveryError);
 }
 console.log(JSON.stringify(outcome));
})().catch(error=>{console.error(error);process.exitCode=1;});
