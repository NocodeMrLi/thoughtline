const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {sampleCalendarMotion,resumeCalendarMotion}=require('./calendar-motion-sampler.cjs');
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');

const evidenceRoot=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round1/calendar-motion');
const attempt=process.env.THOUGHTLINE_ATTEMPT||`geometry-attempt-${Date.now()}-${process.pid}`;
const evidence=path.join(evidenceRoot,attempt);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const near=(a,b)=>Math.abs(a-b)<3;

(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-calendar-geometry-'));
 await fs.mkdir(evidenceRoot,{recursive:true});await fs.mkdir(evidence);
 let app,pids=[],normalClose=false,dataRemoved=false,assertionsComplete=false,stage='launch',failure=null,cleanupError=null,result=null;
 try{
  const now='2026-10-09T12:00:00Z',idea={id:'i',text:'几何合成正文',title:'几何合成',project:'',agentId:'general',status:'hanging',createdAt:now,updatedAt:now};
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas:[idea],clips:[{id:'c',agentId:'general',ideaIds:['i'],currentId:'i',position:.5}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}}));
  app=await _electron.launch(await launchOptions(dir));const {shelf,manage}=await warmViews(app);
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('[data-mode=calendar]');
  await delay(650);
  stage='calendar-bounds';
  const expected=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage'),old=w.getBounds(),next={x:old.x+24,y:old.y+18,width:700,height:580};w.setBounds(next);return w.getBounds();});
  await waitForInfo(manage,i=>JSON.stringify(i.snapshot.settings.calendarBounds)===JSON.stringify(expected));
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);
  assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);await manage.waitForSelector('[data-mode=settings]');
  const saved=await manage.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.saveSettings({...i.snapshot.settings,reducedMotion:false},i.snapshot.revision);});assert(saved.ok,saved.message);
  assert.deepEqual((await manage.evaluate(()=>window.thoughtline.info())).snapshot.settings.calendarBounds,expected);
  stage='detail-does-not-pollute-bounds';
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('i'))).ok);await manage.waitForSelector('[data-mode=detail]');await delay(700);
  assert.deepEqual((await manage.evaluate(()=>window.thoughtline.info())).snapshot.settings.calendarBounds,expected,'Detail geometry cannot overwrite calendar bounds');
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('[data-mode=calendar]');
  const restored=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').getBounds());assert.deepEqual(restored,expected);

  const day=(await manage.evaluate(()=>window.thoughtline.info())).snapshot.ideas[0].createdDay,month=day.slice(0,7);
  const box=selector=>manage.locator(selector).boundingBox();
  const layer=()=>manage.locator('[data-calendar-motion]').evaluate(el=>({kind:el.dataset.calendarMotion,from:JSON.parse(el.dataset.from),to:JSON.parse(el.dataset.to),duration:el.getAnimations()[0]?.effect?.getTiming().duration,sourceClass:el.firstElementChild?.className,pointer:getComputedStyle(el).pointerEvents,inert:el.inert}));
  const check=(motion,kind,from,to,duration)=>{assert.equal(motion.kind,kind);assert.equal(motion.duration,duration);assert(near(motion.from.left,from.x)&&near(motion.from.top,from.y),'motion source must match clicked/current content');assert(near(motion.to.left,to.x)&&near(motion.to.top,to.y),'motion destination must match hierarchy anchor');assert.equal(motion.pointer,'none');assert.equal(motion.inert,true);};

  stage='month-to-day';const dateCell=await box(`[data-day="${day}"]`);
  await sampleCalendarMotion(manage,()=>manage.locator(`[data-day="${day}"]`).click());
  const enterDay=await layer();assert.equal(enterDay.sourceClass,'date-cell');
  assert(near(enterDay.from.left,dateCell.x)&&near(enterDay.from.top,dateCell.y));assert.equal(enterDay.kind,'month-to-day');assert.equal(enterDay.duration,230);
  assert(await manage.locator('.calendar-paper-groups').evaluate(el=>el.getAnimations().some(a=>a.effect.getKeyframes().some(k=>String(k.transform).includes('scale')))),'real day content expands');
  await resumeCalendarMotion(manage);await delay(270);const dayPapers=await box('.calendar-paper-groups');assert(near(enterDay.to.left,dayPapers.x)&&near(enterDay.to.top,dayPapers.y));

  stage='day-to-month';await sampleCalendarMotion(manage,()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  const exitDay=await layer(),dateAgain=await box(`[data-day="${day}"]`);
  check(exitDay,'day-to-month',dayPapers,dateAgain,210);assert.equal(exitDay.sourceClass,'calendar-paper-groups');assert.equal(await manage.locator('[data-calendar-motion] .calendar-paper').count(),1,'visible paper content shrinks into its date');
  await resumeCalendarMotion(manage);await delay(250);

  stage='month-to-year';const monthGrid=await box('.month-grid');await sampleCalendarMotion(manage,()=>manage.locator('.calendar-title').click());
  const exitMonth=await layer(),yearTile=await box(`[data-month="${month}"]`);
  check(exitMonth,'month-to-year',monthGrid,yearTile,210);assert.equal(exitMonth.sourceClass,'month-grid');
  await resumeCalendarMotion(manage);await delay(250);

  stage='year-to-month';const tileBefore=await box(`[data-month="${month}"]`);await sampleCalendarMotion(manage,()=>manage.locator(`[data-month="${month}"]`).click());
  const enterMonth=await layer();assert.equal(enterMonth.kind,'year-to-month');assert.equal(enterMonth.duration,230);assert(near(enterMonth.from.left,tileBefore.x)&&near(enterMonth.from.top,tileBefore.y));
  assert(await manage.locator('.month-grid').evaluate(el=>el.getAnimations().some(a=>a.effect.getKeyframes().some(k=>String(k.transform).includes('scale')))),'real month content expands');
  await resumeCalendarMotion(manage);await delay(270);const gridAfter=await box('.month-grid');assert(near(enterMonth.to.left,gridAfter.x)&&near(enterMonth.to.top,gridAfter.y));

  stage='month-back-to-year';await sampleCalendarMotion(manage,()=>manage.getByRole('button',{name:'返回',exact:true}).click());
  const backToYear=await layer(),sameTile=await box(`[data-month="${month}"]`);
  check(backToYear,'month-to-year',gridAfter,sameTile,210);await resumeCalendarMotion(manage);await delay(250);

  stage='persisted-data';const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));
  assert.deepEqual(disk.settings.calendarBounds,expected);assert.equal(disk.settings.reducedMotion,false);assert.equal(disk.ideas[0].text,idea.text);
  assertionsComplete=true;
  result={scope:'isolated source Electron simulated window bounds and real repository; no physical multi-display/DPI',host:{platform:process.platform,arch:process.arch,release:os.release()},savedBounds:expected,restoredBounds:restored,settingsPreserved:true,detailDidNotPollute:true,motions:{monthToDay:230,dayToMonth:210,monthToYear:210,yearToMonth:230,monthBackToYear:210},sourceContent:true,storedTextPreserved:true};
 }catch(error){failure=String(error);throw error;
 }finally{
  try{if(app){pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();normalClose=true;}if(normalClose){await cleanupIdleFixture(dir,pids);dataRemoved=await fs.stat(dir).then(()=>false,error=>{if(error.code==='ENOENT')return true;throw error;});assert(dataRemoved);}}catch(error){cleanupError=String(error);}
  const passed=assertionsComplete&&normalClose&&dataRemoved&&!cleanupError;
  await fs.writeFile(path.join(evidence,'cleanup.json'),JSON.stringify({stage,directory:dir,pids,normalClose,dataRemoved,allExited:dataRemoved,assertionsComplete,passed,failure,cleanupError},null,2));
  if(result)await fs.writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2));
  if(cleanupError)throw Error(cleanupError);
 }
 console.log(JSON.stringify({...result,evidence}));
})().catch(error=>{console.error(error);process.exitCode=1;});
