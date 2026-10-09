const {launchOptions,warmViews}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');

const evidenceRoot=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round1/calendar-motion');
const attempt=process.env.THOUGHTLINE_ATTEMPT||`fix1-attempt-${Date.now()}-${process.pid}`;
const evidence=path.join(evidenceRoot,attempt);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-calendar-motion-fix1-'));
 await fs.mkdir(evidenceRoot,{recursive:true});await fs.mkdir(evidence);
 let app,manage,pids=[],normalClose=false,dataRemoved=false,assertionsComplete=false,stage='launch',cleanupError=null,recoveryError=null,heldSave=false;
 const cases=[];
 const run=async(name,task)=>{stage=name;try{const detail=await task();cases.push({name,passed:true,...detail});}catch(error){cases.push({name,passed:false,error:String(error)});}};
 try{
  const now=new Date(),pad=n=>String(n).padStart(2,'0'),day=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,emptyDay=`${day.slice(0,8)}${day.endsWith('-01')?'02':'01'}`;
  const ideas=Array.from({length:30},(_,n)=>({id:`fix1-${n}`,text:`修复轮正文 ${n}`,title:`修复轮纸卡 ${n}`,project:'',agentId:'general',status:'hanging',createdAt:`${day}T12:00:00Z`,updatedAt:`${day}T12:00:00Z`}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas,clips:ideas.map(i=>({id:`clip-${i.id}`,agentId:'general',ideaIds:[i.id],currentId:i.id,position:null})),agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}}));
  app=await _electron.launch(await launchOptions(dir));
  const views=await warmViews(app),shelf=views.shelf;manage=views.manage;
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);
  await manage.waitForSelector('[data-mode=calendar]');
  const back=()=>manage.getByRole('button',{name:'返回',exact:true}).click();
  const month=()=>manage.locator('.month-grid').waitFor();
  const settle=()=>pause(300);

  await run('empty-day-visible-return',async()=>{
   await manage.locator(`[data-day="${emptyDay}"]`).click();
   await manage.locator('.calendar-paper-groups .empty-list').waitFor();await settle();
   await back();
   const visual=await manage.locator('[data-calendar-motion]').evaluate(el=>({kind:el.dataset.calendarMotion,text:el.textContent,emptyCount:el.querySelectorAll('.empty-list').length}));
   await manage.locator('[data-calendar-motion]').evaluate((el,day)=>{for(const animation of [...el.getAnimations(),...document.querySelector(`[data-day="${day}"]`).getAnimations()]){animation.pause();animation.currentTime=25;}},emptyDay);
   await manage.screenshot({path:path.join(evidence,'empty-day-return-controlled-early.png'),animations:'allow'});
   await manage.locator('[data-calendar-motion]').evaluate((el,day)=>{for(const animation of [...el.getAnimations(),...document.querySelector(`[data-day="${day}"]`).getAnimations()])animation.currentTime=100;},emptyDay);
   await manage.screenshot({path:path.join(evidence,'empty-day-return-controlled-mid.png'),animations:'allow'});
   await manage.locator('[data-calendar-motion]').evaluate((el,day)=>{for(const animation of [...el.getAnimations(),...document.querySelector(`[data-day="${day}"]`).getAnimations()])animation.play();},emptyDay);
   assert.equal(visual.kind,'day-to-month');
   assert.equal(visual.emptyCount,1,'empty-day return must shrink visible empty-state content');
   assert(visual.text.includes('这里还没有念头。'));
   return {emptyDay,visual};
  });
  await settle();await month();

  await run('scroll-interrupts-active-motion',async()=>{
   await manage.locator(`[data-day="${day}"]`).click();
   assert.equal(await manage.locator('[data-calendar-motion]').count(),1);
   const scrolled=await manage.locator('[data-calendar-scroll]').evaluate(async el=>{el.scrollTop=180;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return el.scrollTop;});
   assert(scrolled>0,'fixture must actually scroll the day papers');
   assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'user scroll cancels fixed-geometry overlay');
   return {scrollTop:scrolled};
  });
  await settle();
  await run('restored-scroll-keeps-return-motion',async()=>{
   await back();
   await manage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await manage.locator('[data-calendar-motion]').count(),1,'restoring previous month scroll must not count as user interruption');
   return {kind:await manage.locator('[data-calendar-motion]').getAttribute('data-calendar-motion')};
  });
  await settle();await month();

  await run('resize-interrupts-active-motion',async()=>{
   await manage.locator(`[data-day="${day}"]`).click();
   assert.equal(await manage.locator('[data-calendar-motion]').count(),1);
   const size=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage'),s=w.getSize();w.setSize(s[0]+40,s[1]);return s;});
   await manage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await manage.locator('[data-calendar-motion]').count(),0,'resize cancels stale source and target geometry');
   return {previousSize:size};
  });
  await settle();await back();await settle();await month();

  await run('old-save-cannot-navigate-new-session',async()=>{
   await manage.locator(`[data-day="${day}"]`).click();await settle();
   await manage.locator('[data-idea-id="fix1-0"]').click();await settle();
   await manage.getByRole('button',{name:'编辑',exact:true}).click();
   await manage.getByRole('textbox',{name:'编辑正文',exact:true}).fill('跨会话保存必须先完成\n');
   const hook=await app.evaluate(({ipcMain})=>{const key='thoughtline:update-idea',original=ipcMain._invokeHandlers?.get(key);if(typeof original!=='function')return {installed:false,kind:typeof original};ipcMain.removeHandler(key);globalThis.__calendarFix1Held=false;globalThis.__calendarFix1Release=null;ipcMain.handle(key,async(...args)=>{const result=await original(...args);globalThis.__calendarFix1Held=true;await new Promise(resolve=>{globalThis.__calendarFix1Release=resolve;});return result;});return {installed:true};});
   assert(hook.installed,`controlled IPC hold unavailable: ${JSON.stringify(hook)}`);heldSave=true;
   await manage.getByRole('button',{name:'日历更多选项'}).click();
   await manage.getByRole('button',{name:'最近删除'}).click();
   await app.evaluate(async()=>{const until=Date.now()+5000;while(!globalThis.__calendarFix1Held&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,20));if(!globalThis.__calendarFix1Held)throw Error('save response did not reach controlled hold');});
   const oldSession=(await manage.evaluate(()=>window.thoughtline.info())).manageSession;
   await app.evaluate(async({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage');const info=await w.webContents.executeJavaScript('window.thoughtline.info()');w.webContents.send('thoughtline:info-update',{...info,manageSession:info.manageSession+1});});
   await manage.locator('.month-grid').waitFor();
   assert.equal(await manage.locator('[data-inline-editor]').count(),0,'synthetic session publication reset old reader');
   await app.evaluate(()=>{globalThis.__calendarFix1Release?.();globalThis.__calendarFix1Release=null;});heldSave=false;
   await pause(100);
   assert.equal(await manage.locator('.month-grid').count(),1,'old pending navigation must not replace new session month');
   assert.equal(await manage.locator('.calendar-title').textContent(),`${day.slice(0,4)}年${Number(day.slice(5,7))}月`);
   const stored=await manage.evaluate(()=>window.thoughtline.info());
   assert.equal(stored.snapshot.ideas.find(i=>i.id==='fix1-0')?.text,'跨会话保存必须先完成\n','old draft was saved before session switched');
   return {oldSession,publishedSession:oldSession+1,storedTextSaved:true};
  });
  assertionsComplete=true;
  if(cases.some(item=>!item.passed))throw Error(`Controlled cases failed: ${cases.filter(item=>!item.passed).map(item=>item.name).join(', ')}`);
 }catch(error){if(!cases.some(item=>!item.passed))cases.push({name:stage,passed:false,error:String(error)});throw error;
 }finally{
  try{
   if(app&&heldSave){try{await app.evaluate(()=>{globalThis.__calendarFix1Release?.();globalThis.__calendarFix1Release=null;});heldSave=false;}catch(error){recoveryError=String(error);}}
   if(app){pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();normalClose=true;}
   if(normalClose&&!recoveryError){await cleanupIdleFixture(dir,pids);dataRemoved=await fs.stat(dir).then(()=>false,error=>{if(error.code==='ENOENT')return true;throw error;});assert(dataRemoved);}
  }catch(error){cleanupError=String(error);}
  const passed=assertionsComplete&&cases.every(item=>item.passed)&&normalClose&&dataRemoved&&!cleanupError&&!recoveryError;
  await fs.writeFile(path.join(evidence,'cleanup.json'),JSON.stringify({stage,host:{platform:process.platform,arch:process.arch,release:os.release()},directory:dir,pids,normalClose,dataRemoved,allExited:dataRemoved,assertionsComplete,passed,cases,recoveryError,cleanupError},null,2));
  if(cleanupError||recoveryError)throw Error(cleanupError||recoveryError);
 }
 console.log(JSON.stringify({cases,evidence}));
})().catch(error=>{console.error(error);process.exitCode=1;});
