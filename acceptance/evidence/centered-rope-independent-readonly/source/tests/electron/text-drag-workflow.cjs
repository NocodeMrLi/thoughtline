const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-text-drag-'));let app;
 try{
  app=await _electron.launch(await launchOptions(dir));await warmViews(app);while((await app.windows()).length<3)await app.waitForEvent('window');const pages=await app.windows(),shelf=pages.find(p=>p.url().includes('view=shelf')),composer=pages.find(p=>p.url().includes('view=composer'));
  const body='  第一行完整正文\n\n不要混入标题 @codex\n😀 末行保留空格  ';
  await composer.evaluate(async text=>{const i=await window.thoughtline.info();const r=await window.thoughtline.submit({text,title:'仅短标题',agentId:'codex',project:'仅标签'},i.snapshot.revision);if(!r.ok)throw Error(r.message);},body);
  await shelf.waitForSelector('.card-copy');await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);assert(await shelf.locator('.card-copy').evaluate(el=>el.draggable),'card body must offer standard plaintext drag separately from peg rearrangement');
  const before=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
  const clipboard=await app.evaluate(({clipboard})=>clipboard.readText());
  const payload=await shelf.evaluate(()=>{const el=document.querySelector('.card-copy'),dt=new DataTransfer();window.dragTransfer=dt;el.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt}));return {text:dt.getData('text/plain'),types:[...dt.types],files:dt.files.length,effect:dt.effectAllowed};});
  assert.equal(payload.text,body);assert.deepEqual(payload.types,['text/plain']);assert.equal(payload.files,0);// Synthetic DataTransfer cannot set effectAllowed; verify it through a browser-owned drag below.
  assert((await shelf.evaluate(()=>window.thoughtline.info())).interactionLocked);
  await shelf.evaluate(id=>window.thoughtline.textDrag(false,id),before.ideas[0].id);
  await waitForInfo(shelf,i=>!i.interactionLocked);
  assert.equal(await shelf.locator('.card-copy').getAttribute('data-exporting'),'false','forced main cancellation must reset source feedback even if dragend is lost');
  await shelf.evaluate(()=>document.querySelector('.card-copy').dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:window.dragTransfer})));
  await waitForInfo(shelf,i=>!i.interactionLocked);
  await shelf.locator('.card-copy').evaluate(el=>el.click());assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),clipboard);
  assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,before);
  await shelf.evaluate(()=>{const target=document.createElement('textarea');target.id='test-text-receiver';target.setAttribute('aria-label','仅测试文本接收');Object.assign(target.style,{position:'absolute',left:'30px',top:'250px',width:'300px',height:'50px',pointerEvents:'auto'});target.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});target.addEventListener('drop',e=>{e.preventDefault();window.receivedDrag={text:e.dataTransfer.getData('text/plain'),types:[...e.dataTransfer.types],files:e.dataTransfer.files.length,effect:e.dataTransfer.effectAllowed};});document.body.appendChild(target);});
  await shelf.locator('.card-copy').dragTo(shelf.locator('#test-text-receiver'),{force:true});
  await shelf.waitForFunction(()=>!!window.receivedDrag);const received=await shelf.evaluate(()=>window.receivedDrag);assert.equal(received.text,body);assert.equal(received.effect,'copy');assert.equal(received.files,0);assert.deepEqual(received.types,['text/plain']);
  assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),clipboard);assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,before);
  await shelf.locator('#test-text-receiver').evaluate(el=>el.remove());
  const report={scope:'actual Electron renderer DragEvent/DataTransfer protocol plus main operation lock; synthetic cancellation and browser-owned drag into a test-only textarea; not OS cross-app receiving acceptance',completePlaintext:true,noTitleOrAgentAdded:true,noFiles:true,copyEffect:true,cancelDoesNotCopyOrChangeData:true,independentPegInteraction:true,realTargets:{Codex:'not tested',Claude:'not tested',Cursor:'not tested'}};await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','text-drag-native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{let pids=[];if(app){pids=[...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)),app.process().pid];await app.close();}await cleanupIdleFixture(dir,pids);await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence','text-drag-cleanup.json'),JSON.stringify({pids,allPidsExited:true,fakeDataRemoved:true},null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
