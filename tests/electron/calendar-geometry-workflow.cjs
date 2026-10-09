const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-p3-calendar-geometry-')),evidence='acceptance/evidence/round1/p3-ui';let app,pids=[];
 try{
  const now='2026-10-09T12:00:00Z',idea={id:'i',text:'几何合成正文',title:'几何合成',project:'',agentId:'general',status:'hanging',createdAt:now,updatedAt:now};
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas:[idea],clips:[{id:'c',agentId:'general',ideaIds:['i'],currentId:'i',position:.5}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}}));
  app=await _electron.launch(await launchOptions(dir));const {shelf,manage}=await warmViews(app);
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('[data-mode=calendar]');
  await new Promise(r=>setTimeout(r,650));
  const expected=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage'),old=w.getBounds(),next={x:old.x+24,y:old.y+18,width:700,height:580};w.setBounds(next);return w.getBounds();});
  await waitForInfo(manage,i=>JSON.stringify(i.snapshot.settings.calendarBounds)===JSON.stringify(expected));
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);
  assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);await manage.waitForSelector('[data-mode=settings]');
  const saved=await manage.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.saveSettings({...i.snapshot.settings,reducedMotion:false},i.snapshot.revision);});assert(saved.ok,saved.message);
  assert.deepEqual((await manage.evaluate(()=>window.thoughtline.info())).snapshot.settings.calendarBounds,expected);
  assert((await shelf.evaluate(()=>window.thoughtline.openManage('i'))).ok);await manage.waitForSelector('[data-mode=detail]');await new Promise(r=>setTimeout(r,700));
  assert.deepEqual((await manage.evaluate(()=>window.thoughtline.info())).snapshot.settings.calendarBounds,expected,'Detail geometry cannot overwrite calendar bounds');
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('[data-mode=calendar]');
  const restored=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').getBounds());assert.deepEqual(restored,expected);
  const day=(await manage.evaluate(()=>window.thoughtline.info())).snapshot.ideas[0].createdDay;
  const clicked=await manage.locator(`[data-day="${day}"]`).evaluate(el=>{const cell=el.getBoundingClientRect(),area=document.querySelector('[data-calendar-scroll]').getBoundingClientRect();return {x:cell.left+cell.width/2-area.left,y:cell.top+cell.height/2-area.top};});
  await manage.locator(`[data-day="${day}"]`).click();
  const motion=await manage.locator('.calendar-paper-groups').evaluate(el=>({origin:el.style.transformOrigin,duration:getComputedStyle(el).animationDuration}));const [x,y]=motion.origin.split(' ').map(parseFloat);assert(Math.abs(x-clicked.x)<2&&Math.abs(y-clicked.y)<2,'date cards expand from clicked cell');assert.equal(motion.duration,'0.12s');
  await manage.getByRole('button',{name:'返回',exact:true}).click();await manage.locator('.calendar-title').click();assert.equal(await manage.locator('.year-grid').evaluate(el=>getComputedStyle(el).animationDuration),'0.12s');
  const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));assert.deepEqual(disk.settings.calendarBounds,expected);assert.equal(disk.settings.reducedMotion,false);assert.equal(disk.ideas[0].text,idea.text);
  console.log(JSON.stringify({scope:'isolated Electron simulated window bounds and real repository; no physical multi-display/DPI',saved:expected,restored,settingsPreserved:true,detailDidNotPollute:true,dateOrigin:motion.origin,yearLevelDuration:'0.12s'}));
 }finally{
  if(app){pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();}
  await cleanupIdleFixture(dir,pids);await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,'calendar-geometry-cleanup.json'),JSON.stringify({dir,pids,dataRemoved:!await fs.stat(dir).then(()=>true,()=>false)}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
