// Isolated installed-package diagnostic. Does not move the OS cursor or touch real notes.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {_electron}=require('playwright');
const {sanitizedPackagedEnv}=require('./packaged-launch.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {launchOptions,waitForInfo}=require('./window-fixture.cjs');
(async()=>{
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-top-edge-'));
 const out=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/top-edge-20261010');await fs.mkdir(out,{recursive:true});
 const executable=process.env.THOUGHTLINE_EXECUTABLE||require('electron');
 let app;const pids=[],result={executable,profile,platform:process.platform,arch:process.arch,osRelease:os.release(),declaredVersion:require('../../package.json').version,observations:[]};
 const position=process.env.THOUGHTLINE_SEEDED_POSITION?Number(process.env.THOUGHTLINE_SEEDED_POSITION):null;
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 try{
 const time='2026-10-10T00:00:00.000Z';
 await fs.writeFile(path.join(profile,'snapshot.json'),JSON.stringify({schemaVersion:3,revision:0,clips:[{id:'clip',agentId:'general',ideaIds:['idea'],currentId:'idea',position}],ideas:[{id:'idea',title:'Isolated geometry',project:'',text:'Synthetic top edge probe',agentId:'general',status:'hanging',createdAt:time,updatedAt:time,createdDay:'2026-10-10',creationTimeZone:'UTC'}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:false}}));
 const options=process.env.THOUGHTLINE_EXECUTABLE?{executablePath:executable,args:[],env:sanitizedPackagedEnv(process.env,profile),timeout:30000}:await launchOptions(profile);
 app=await _electron.launch(options);pids.push(app.process().pid);
 const page=await app.firstWindow();await page.waitForSelector('[data-view=shelf]',{state:'attached'});
 result.native=await app.evaluate(({app,screen,BrowserWindow},profile)=>{if(app.getPath('userData')!==profile)throw Error('Isolation mismatch');const d=screen.getPrimaryDisplay();globalThis.topEdgePoint={x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+1};screen.getCursorScreenPoint=()=>globalThis.topEdgePoint;return{version:app.getVersion(),display:{bounds:d.bounds,workArea:d.workArea,scaleFactor:d.scaleFactor},shelf:BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf').getBounds()};},profile);
 const sample=async(label)=>{
  result.observations.push({label,native:await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf');return{bounds:w.getBounds(),content:w.getContentBounds(),visible:w.isVisible()};}),renderer:await page.evaluate(async()=>({info:await window.thoughtline.info(),innerWidth,innerHeight,rects:[...document.querySelectorAll('[data-hit]')].map(e=>({hit:e.dataset.hit,rect:e.getBoundingClientRect().toJSON()}))}))});
 };
 await delay(1200);await sample('revealed-at-edge');
 if(process.env.THOUGHTLINE_POSITION_TRIAL){
  result.positionTrial=await app.evaluate(({BrowserWindow},b)=>{const w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf');w.setBounds({x:b.x,y:Math.max(b.y,25),width:b.width,height:340});return w.getBounds();},result.native.display.bounds);
  await delay(100);await sample('bounds-reapplied-after-show');
 }
 const d=result.native.display;
 await app.evaluate(({screen},p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+10});await delay(900);await sample('menu-bar-gap-after-900ms');
 await app.evaluate(({screen},p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+1});await delay(600);
 await app.evaluate(({screen},p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.workArea.y+8});await delay(950);await sample('slow-corridor-after-950ms');
 if(process.env.THOUGHTLINE_VERIFY){
  for(const o of result.observations){assert.equal(o.native.bounds.x,d.bounds.x,'Native shelf must align with display');assert.equal(o.renderer.innerWidth,d.bounds.width);assert.equal(o.renderer.info.shelfVisible,true,`${o.label} must remain visible`);}
  const paper=await page.locator('.idea-card').boundingBox();assert(paper);if(position===null)assert(Math.abs(paper.x+paper.width/2-d.bounds.width/2)<1,'Default paper centered');
  if(process.env.THOUGHTLINE_EXECUTABLE)assert.equal(result.native.version,result.declaredVersion,'Actual packaged version');
  await page.screenshot({path:path.join(out,'centered-operable-shelf.png')});
  await app.evaluate(({clipboard})=>{globalThis.topEdgeCopied='';clipboard.writeText=text=>{globalThis.topEdgeCopied=text;};});
  await app.evaluate((_,p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+paper.x+paper.width/2,y:d.workArea.y+paper.y+80});
  await delay(200);await page.locator('.card-copy').click();assert.equal(await app.evaluate(()=>globalThis.topEdgeCopied),'Synthetic top edge probe');
  await page.locator('.idea-card footer button').last().click();
  let manage;for(let n=0;n<100&&!manage;n++){manage=(await app.windows()).find(p=>p.url().includes('view=manage'));if(!manage)await delay(50);}
  assert(manage,'Paper expand opens auxiliary reader');await manage.waitForSelector('[data-mode=detail]');await manage.evaluate(()=>window.thoughtline.closeManage());
  await app.evaluate((_,p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.workArea.y+600});await waitForInfo(page,i=>!i.shelfVisible);await delay(450);await sample('outside-corridor-hidden');
  assert.equal(result.observations.at(-1).native.visible,false);
  for(let n=0;n<3;n++){
   await app.evaluate((_,p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+1});await waitForInfo(page,i=>i.shelfVisible);await delay(500);await sample(`repeat-${n+1}-revealed`);assert.equal(result.observations.at(-1).native.bounds.x,d.bounds.x);
   await app.evaluate((_,p)=>{globalThis.topEdgePoint=p;},{x:d.bounds.x+d.bounds.width/2,y:d.workArea.y+600});await waitForInfo(page,i=>!i.shelfVisible);await delay(450);
  }
  const stored=JSON.parse(await fs.readFile(path.join(profile,'snapshot.json'),'utf8'));assert.equal(stored.clips[0].position,position);assert.equal(stored.ideas[0].text,'Synthetic top edge probe');assert.deepEqual(stored.clips[0].ideaIds,['idea']);assert.equal(stored.clips[0].currentId,'idea');
  result.passed=true;
 }
 }catch(e){result.error=String(e.stack||e);process.exitCode=1;}
 finally{
  if(app){pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();await cleanupIdleFixture(profile,pids);result.cleanup={normalQuit:true,profileRemoved:true,pids:[...new Set(pids)]};}
  await fs.writeFile(path.join(out,'native-probe.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({version:result.native?.version,display:result.native?.display,observations:result.observations.map(o=>({label:o.label,native:o.native,width:o.renderer.innerWidth,infoWidth:o.renderer.info.width,visible:o.renderer.info.shelfVisible,rects:o.renderer.rects})),cleanup:result.cleanup,error:result.error}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
