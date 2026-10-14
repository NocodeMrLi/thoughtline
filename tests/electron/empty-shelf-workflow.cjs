const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {_electron}=require('playwright'),{launchOptions,waitForInfo,openComposer,bounded}=require('./window-fixture.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-empty-shelf-')),out=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round6/r609/empty');await fs.mkdir(out,{recursive:true});let app,proc;const receipt={profile:dir,pids:[],checks:[],normalQuit:false,cleaned:false};
 try{
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:4,revision:0,clips:[],ideas:[],agents:[{id:'general',name:'通用',color:'#A0A3AA'},{id:'codex',name:'Codex',color:'#4C90D9'},{id:'claude',name:'Claude',color:'#D79551'}],draft:null,settings:{writeHotkey:'Control+Alt+K',reducedMotion:true}}));
  app=await _electron.launch(await launchOptions(dir,{stationaryTopCursor:true}));proc=app.process();receipt.pids.push(proc.pid);const shelf=await app.firstWindow();await shelf.locator('[data-view=shelf]').waitFor({state:'attached'});
  assert.equal(await shelf.locator('.idea-card').count(),0);assert.equal(await shelf.locator('[data-hit]').count(),0);
  const composer=await openComposer(app,shelf);await composer.locator('#idea-text').fill('Empty shelf shortcut original body 😀');await composer.getByRole('button',{name:'挂上',exact:true}).click();const submitted=await waitForInfo(shelf,i=>i.snapshot.ideas.length===1&&!i.interactionLocked);assert.equal(submitted.snapshot.ideas[0].text,'Empty shelf shortcut original body 😀');
  assert((await shelf.evaluate(()=>window.thoughtline.setShelfFilter({agentId:'claude',project:null}))).ok);await shelf.waitForFunction(()=>!document.querySelector('.idea-card'));assert.equal(await shelf.locator('.shelf-filter-clear').count(),1,'empty filter retains inline Show all recovery');
  await shelf.evaluate(()=>document.querySelector('.shelf-filter-clear').click());await waitForInfo(shelf,i=>i.shelfAgentId==='all');await shelf.waitForSelector('.idea-card');assert((await shelf.evaluate(()=>window.thoughtline.setShelfFilter({agentId:'claude',project:null}))).ok);await shelf.waitForFunction(()=>!document.querySelector('.idea-card'));
  const reopened=await openComposer(app,shelf);await reopened.locator('#idea-text').fill('Filtered empty shelf still allows shortcut');receipt.checks.push('empty rope stays unobtrusive; real registered shortcut opens Composer, hangs original body; filtered empty rope retains real inline Show all recovery and remains shortcut accessible');
  receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));const exited=new Promise(r=>proc.once('exit',r));await app.evaluate(({app})=>app.quit());await bounded(exited,'normal quit from empty shelf fixture',15000);receipt.normalQuit=true;
  assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).draft.text,'Filtered empty shelf still allows shortcut');receipt.checks.push('normal quit persists filtered empty shelf live draft');
 }catch(e){receipt.failure=e.stack;throw e;}finally{
  if(app&&proc.exitCode===null){receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)).catch(()=>[]));const exited=new Promise(r=>proc.once('exit',r));await app.evaluate(({app})=>app.quit()).catch(()=>{});await bounded(exited,'cleanup normal quit',15000).then(()=>receipt.normalQuit=true).catch(()=>{});}
  if(receipt.normalQuit){await cleanupIdleFixture(dir,receipt.pids);receipt.cleaned=true;}await fs.writeFile(path.join(out,'empty-shelf.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({passed:!receipt.failure,...receipt}));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
