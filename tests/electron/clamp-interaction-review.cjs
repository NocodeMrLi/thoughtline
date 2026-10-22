// SPDX-License-Identifier: GPL-3.0-only
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');const {_electron}=require('playwright');
const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-clamp-interaction-'));let app,pids=[];const report={scope:'source Mac Electron renderer mouse/touch protocol with native app IPC; no physical touchscreen/OS mouse or Windows acceptance',realShortcutRegistration:false};
 try{
  app=await _electron.launch(await launchOptions(dir));const {shelf,composer}=await warmViews(app);
  for(let n=0;n<3;n++){const r=await composer.evaluate(async n=>{const i=await window.thoughtline.info();return window.thoughtline.submit({text:'夹持交互假正文 '+n,title:'保留文字空间 '+n,agentId:'codex',project:''},i.snapshot.revision);},n);assert(r.ok,r.message);}
  await shelf.waitForFunction(()=>document.querySelectorAll('.hanging').length===3);await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  const shape=await shelf.locator('.rope > .rope-core').getAttribute('d'),before=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
  const peg=shelf.locator('.peg-button').first(),box=await peg.boundingBox();
  await shelf.mouse.move(box.x+12,box.y+15);await shelf.mouse.down();await shelf.mouse.move(box.x+47,box.y+15,{steps:5});await waitForInfo(shelf,i=>i.interactionLocked);
  assert.notEqual(await peg.locator('.pin-front').evaluate(el=>getComputedStyle(el).transform),'none');
  await shelf.emulateMedia({reducedMotion:'reduce'});await shelf.waitForFunction(()=>document.querySelector('.clothespin').dataset.reduced==='true');assert.equal(await peg.locator('.pin-front').evaluate(el=>getComputedStyle(el).transform),'none');
  await shelf.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel')));await shelf.mouse.up();await waitForInfo(shelf,i=>!i.interactionLocked);assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,before);report.cancelKeepsSnapshot=true;report.liveReducedMotionStopsArms=true;
  await shelf.emulateMedia({reducedMotion:'no-preference'});
  const next=await peg.boundingBox(),cdp=await app.context().newCDPSession(shelf);const point={x:next.x+12,y:next.y+15,id:1,radiusX:1,radiusY:1,force:1};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:point.x+40}]});await waitForInfo(shelf,i=>i.interactionLocked);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const after=await waitForInfo(shelf,i=>!i.interactionLocked&&i.snapshot.revision>before.revision);await cdp.detach();
  assert(after.snapshot.clips.some(c=>c.position!==null));assert.equal(await shelf.locator('.rope > .rope-core').getAttribute('d'),shape);report.touchProtocolMovesAndPersists=true;report.fixedRopeAcrossDrag=true;
  const geometry=await shelf.locator('.hanging').evaluateAll(items=>items.map(el=>{const pin=el.querySelector('.clothespin').getBoundingClientRect(),agent=el.querySelector('.agent-name').getBoundingClientRect(),title=el.querySelector('strong').getBoundingClientRect(),hit=el.querySelector('.peg-button').getBoundingClientRect();return {pinBottom:pin.bottom,agentTop:agent.top,titleTop:title.top,hitWidth:hit.width,hitHeight:hit.height};}));
  for(const g of geometry){assert(g.agentTop>=g.pinBottom-.1);assert(g.titleTop>g.pinBottom);assert(Math.abs(g.hitWidth-24)<.01&&Math.abs(g.hitHeight-44)<.01);}report.textUncovered=geometry;
 }finally{if(app){pids=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));if(!pids.includes(app.process().pid))pids.push(app.process().pid);await app.close();}await cleanupIdleFixture(dir,pids);}
 report.ownedPids=pids;report.allOwnedPidsExited=true;report.fakeDataRemoved=true;await fs.writeFile(path.join(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/upright-paper-review','interaction.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
