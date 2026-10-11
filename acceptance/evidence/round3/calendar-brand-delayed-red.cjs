const {_electron}=require('playwright');
const {launchOptions}=require(process.cwd()+'/tests/electron/window-fixture.cjs');
const {cleanupIdleFixture}=require(process.cwd()+'/tests/electron/idle-fixture-cleanup.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');

const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round1/calendar-brand-clip');
const attempt=path.join(root,`${(process.env.THOUGHTLINE_ATTEMPT||'attempt').replace(/[^a-zA-Z0-9_-]/g,'-')}-${Date.now()}-${process.pid}`);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}};

(async()=>{
 await fs.mkdir(attempt,{recursive:true});
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-calendar-brand-clip-'));
 const receipt={attempt,fixtureDataDir:dir,originalAppPid30628AliveBefore:process.platform==='darwin'?alive(30628):'not-applicable',stage:'seed',screenshots:[],checks:{},pids:[]};
 let app,manage,shelf,normalClose=false;
 try{
  const now=new Date(),pad=n=>String(n).padStart(2,'0'),day=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const month=day.slice(0,7),manyDay=`${month}-${day.endsWith('-15')?'16':'15'}`,previous=new Date(now.getFullYear(),now.getMonth()-1,15),otherDay=`${previous.getFullYear()}-${pad(previous.getMonth()+1)}-15`;
  const dates=[day,day,day,otherDay,...Array(123).fill(manyDay)];
  const ideas=dates.map((d,n)=>({id:`brand-${n}`,text:`夹子原图展示测试正文 ${n}`,title:`念头 ${n+1}`,project:'',agentId:'general',status:'hanging',createdAt:`${d}T12:00:00Z`,updatedAt:`${d}T12:00:00Z`}));
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,ideas,clips:ideas.map(i=>({id:`clip-${i.id}`,agentId:'general',ideaIds:[i.id],currentId:i.id,position:null})),agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}}));
  receipt.stage='launch';app=await _electron.launch(await launchOptions(dir));receipt.pids.push(app.process().pid);
  shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);
  manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=calendar]');
  const storage=await manage.evaluate(()=>window.thoughtline.storageInfo());assert(storage.ok,storage.message);assert.equal(storage.value.directory,dir);receipt.checks.isolatedDataDir=true;
  const shot=async(name)=>{const file=path.join(attempt,name);await manage.screenshot({path:file,animations:'allow'});receipt.screenshots.push(file);};
  const imageCheck=async(selector)=>manage.locator(selector).first().evaluate(async el=>{const svg=el.querySelector('svg'),image=svg?.querySelector('image'),href=image?.href.baseVal;const loaded=await new Promise(resolve=>{const probe=new Image();probe.onload=()=>resolve({ok:true,width:probe.naturalWidth,height:probe.naturalHeight});probe.onerror=()=>resolve({ok:false});probe.src=href;});return {href,viewBox:svg?.getAttribute('viewBox'),clip:getComputedStyle(svg).clipPath,aria:el.getAttribute('aria-hidden'),bounds:(()=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};})(),loaded};});
  receipt.stage='month';assert.equal(await manage.locator(`[data-day="${day}"] .mini-clip`).count(),1);assert.equal(await manage.locator('.date-cell .mini-clip').count(),2);
  assert.equal(await manage.locator(`[data-day="${day}"]`).getAttribute('aria-label'),`${new Intl.DateTimeFormat('zh-CN',{timeZone:'UTC',year:'numeric',month:'long',day:'numeric'}).format(new Date(day+'T12:00:00Z'))}，3条念头`);
  const monthMarker=await imageCheck(`[data-day="${day}"] .mini-clip`);assert(monthMarker.loaded.ok&&monthMarker.loaded.width===1254&&monthMarker.loaded.height===1254);assert(monthMarker.clip.startsWith('polygon('));assert.equal(monthMarker.aria,'true');receipt.checks.monthMarker=monthMarker;
  await shot('month.png');
  await manage.locator(`[data-day="${day}"] .mini-clip`).evaluate(el=>{el.style.transform='scale(8)';el.style.transformOrigin='top left';el.style.zIndex='20';});
  await shot('marker-closeup.png');
  await manage.locator(`[data-day="${day}"] .mini-clip`).evaluate(el=>{el.style.transform='';el.style.transformOrigin='';el.style.zIndex='';});
  receipt.stage='year';await manage.locator('.calendar-title').click();await manage.waitForSelector('.year-grid');await pause(260);
  assert.equal(await manage.locator('.year-grid .mini-clip').count(),2);assert.equal(await manage.locator(`[data-month="${month}"] .mini-clip`).count(),1);
  receipt.checks.yearMarker=await imageCheck(`[data-month="${month}"] .mini-clip`);await shot('year.png');
  receipt.stage='paper';await manage.locator(`[data-month="${month}"]`).click();await manage.waitForSelector('.month-grid');await pause(260);
  await manage.locator(`[data-day="${day}"]`).click();await manage.waitForSelector('.calendar-paper');await pause(260);
  assert.equal(await manage.locator('.calendar-content .calendar-paper .mini-clip').count(),3);receipt.checks.paperMarker=await imageCheck('.calendar-content .calendar-paper .mini-clip');await shot('day-paper.png');
  receipt.stage='motion';await manage.getByRole('button',{name:'返回',exact:true}).click();await pause(350);await manage.waitForSelector('[data-calendar-motion]',{timeout:2000});
  await manage.locator('[data-calendar-motion]').evaluate(el=>{for(const animation of el.getAnimations()) {animation.pause();animation.currentTime=55;}});
  const clone=await imageCheck('[data-calendar-motion] .mini-clip');assert(clone.loaded.ok&&clone.clip.startsWith('polygon('));assert.equal(await manage.locator('[data-calendar-motion] [id],[data-calendar-motion] [aria-hidden]').count(),0);receipt.checks.motionClone=clone;await shot('day-to-month-motion.png');
  await manage.locator('[data-calendar-motion]').evaluate(el=>{for(const animation of el.getAnimations())animation.play();});await pause(260);
  receipt.stage='count-widths';receipt.checks.countWidths={};
  for(const width of [350,421,500,740]){
   await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').setSize(width,620),width);
   const measured=await manage.evaluate(days=>{const measure=day=>{const cell=document.querySelector(`[data-day="${day}"]`),row=cell.querySelector('.day-count'),clip=row.querySelector('.mini-clip'),text=[...row.childNodes].find(n=>n.nodeType===Node.TEXT_NODE),range=document.createRange();range.selectNodeContents(text);const box=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height});return {day,dateText:cell.firstElementChild.textContent,countText:text.textContent.trim(),cell:box(cell.getBoundingClientRect()),row:box(row.getBoundingClientRect()),clip:box(clip.getBoundingClientRect()),number:box(range.getBoundingClientRect())};};return {windowWidth:innerWidth,one:measure(days.one),three:measure(days.three)};},{one:day,three:manyDay});
   receipt.checks.countWidths[width]=measured;await manage.mouse.move(width-10,590);await shot(`month-${width}-one-three-digit.png`);
   assert.equal(measured.windowWidth,width);assert.equal(measured.one.countText,'3');assert.equal(measured.three.countText,'123');
   for(const item of [measured.one,measured.three]){assert(item.number.width>0&&item.clip.width>0);assert(Math.abs(item.clip.width/item.clip.height-22/17)<.02,'brand marker aspect ratio changed');assert(item.number.left>=item.cell.left+1&&item.number.right<=item.cell.right-1,`${width}px ${item.countText} count escapes date cell horizontally`);assert(item.number.bottom<=item.cell.bottom-1,`${width}px ${item.countText} count escapes date cell vertically`);assert(item.clip.right<=item.cell.right-1&&item.clip.bottom<=item.cell.bottom-1,'brand marker escapes date cell');}
  }
  receipt.stage='close';assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;normalClose=true;
  receipt.checks.originalSourceSha256=crypto.createHash('sha256').update(await fs.readFile('assets/source/approved-TL-brand-logo.jpg')).digest('hex');
  assert.equal(receipt.checks.originalSourceSha256,'313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778');
  receipt.stage='complete';
 }catch(error){receipt.failure={stage:receipt.stage,message:error.stack||String(error)};process.exitCode=1;}
 finally{
  if(app){try{if(manage)await manage.evaluate(()=>window.thoughtline.closeManage());receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();normalClose=true;}catch(error){receipt.closeFailure=String(error);process.exitCode=1;}}
  receipt.normalClose=normalClose;try{if(normalClose){await cleanupIdleFixture(dir,receipt.pids);receipt.fixtureRemoved=true;}else receipt.fixtureRemoved=false;}catch(error){receipt.cleanupFailure=String(error);process.exitCode=1;}
  receipt.originalAppPid30628AliveAfter=process.platform==='darwin'?alive(30628):'not-applicable';
  await fs.writeFile(path.join(attempt,'receipt.json'),JSON.stringify(receipt,null,2));
  console.log(JSON.stringify({attempt,stage:receipt.stage,checks:receipt.checks,screenshots:receipt.screenshots,normalClose:receipt.normalClose,fixtureRemoved:receipt.fixtureRemoved,failure:receipt.failure,closeFailure:receipt.closeFailure,cleanupFailure:receipt.cleanupFailure,originalAppPid30628AliveAfter:receipt.originalAppPid30628AliveAfter},null,2));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
