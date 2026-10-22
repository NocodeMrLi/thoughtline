// SPDX-License-Identifier: GPL-3.0-only
const {launchOptions,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round4/vine');await fs.mkdir(root,{recursive:true});
 const out=await fs.mkdtemp(path.join(root,'vine-')),profile=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-r4-vine-'));
 let app,shelf;const receipt={platform:process.platform,packaged:!!process.env.THOUGHTLINE_EXECUTABLE,profile,scope:'isolated Electron pointer input and actual package; physical owner acceptance separate',checks:[],measurements:[],pids:[]};
 const close=async()=>{if(!app)return;receipt.pids.push(app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;};
 const launch=async()=>{
  if(process.env.THOUGHTLINE_EXECUTABLE){const {sanitizedPackagedEnv,observeLaunch}=require('./packaged-launch.cjs');const exe=path.resolve(process.env.THOUGHTLINE_EXECUTABLE),restore=observeLaunch(exe,out);try{app=await _electron.launch({executablePath:exe,args:[],env:sanitizedPackagedEnv(process.env,profile)});}finally{restore();}assert.equal(await app.evaluate(({app})=>app.getVersion()),require('../../package.json').version);}
  else app=await _electron.launch(await launchOptions(profile,{stationaryTopCursor:true}));
  assert.equal(await app.evaluate(({app})=>app.getPath('userData')),profile);
  await app.evaluate(({screen})=>{screen.getCursorScreenPoint=()=>{const d=screen.getPrimaryDisplay();return {x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+1};};});
  shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});await waitForInfo(shelf,i=>i.shelfVisible);await shelf.waitForFunction(()=>Number(document.querySelector('.shelf-root').dataset.progress)===1);
 };
 const info=()=>shelf.evaluate(()=>window.thoughtline.info());
 const foliage=()=>shelf.locator('.rope > g > g').evaluateAll(nodes=>nodes.map(e=>({root:e.getAttribute('transform'),tendril:e.querySelector('.vine-tendril')?.getAttribute('d')??null,leaves:[...e.querySelectorAll('g')].map(g=>({transform:g.getAttribute('transform'),paths:[...g.querySelectorAll('path')].map(p=>p.getAttribute('d'))}))})));
 const grip=()=>shelf.locator('.hanging.dragging').evaluate(e=>{const line=e.querySelector('.clamp-rope .rope-core').getBoundingClientRect(),pin=e.querySelector('.peg-button .clothespin').getBoundingClientRect();return {dx:Math.abs((line.left+line.right-pin.left-pin.right)/2),overlap:line.top<=pin.bottom&&line.bottom>=pin.top};});
 try{
  const now='2026-10-12T00:00:00Z',ideas=Array.from({length:4},(_,n)=>({id:'v'+n,title:'藤蔓验证 '+n,text:'固定枝叶；只移动夹子与便签。',project:'',agentId:'general',status:'hanging',createdAt:now,updatedAt:now}));
  await fs.writeFile(path.join(profile,'snapshot.json'),JSON.stringify({schemaVersion:3,revision:0,ideas,clips:[{id:'group',agentId:'general',ideaIds:['v0','v1'],currentId:'v0',position:null},...ideas.slice(2).map(i=>({id:'clip:'+i.id,agentId:'general',ideaIds:[i.id],currentId:i.id,position:null}))],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F20',reducedMotion:true,shelfCapacity:6,rope:{style:'vine'}}}));
  await launch();
  let preferenceSequence=100;for(const capacity of [4,6,8])for(const theme of ['light','dark']){
   assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);const manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.locator('[data-mode=settings]').waitFor();
   const settingResult=await manage.evaluate(async({capacity,theme,sequence})=>{const i=await window.thoughtline.info();const preference=await window.thoughtline.setPreferences({theme},sequence);if(!preference.ok)throw Error(JSON.stringify(preference));return window.thoughtline.saveSettings({...i.snapshot.settings,shelfCapacity:capacity},i.snapshot.revision);},{capacity,theme,sequence:++preferenceSequence});assert(settingResult.ok,JSON.stringify(settingResult));await manage.evaluate(()=>window.thoughtline.closeManage());await waitForInfo(shelf,i=>i.shelfVisible);await shelf.waitForFunction(()=>Number(document.querySelector('.shelf-root').dataset.progress)===1);
   await waitForInfo(shelf,i=>i.snapshot.settings.shelfCapacity===capacity&&i.dark===(theme==='dark'));await shelf.waitForTimeout(100);
   const before=await info(),original=await foliage();assert(original.length>0&&original.every(x=>x.leaves.length===3));
   const peg=await shelf.locator('.hanging[data-clip-id=group] .peg-button').boundingBox();assert(peg);const x=peg.x+peg.width/2,y=peg.y+peg.height/2;
   await shelf.screenshot({path:path.join(out,`${capacity}-${theme}-before.png`)});
   await shelf.mouse.move(x,y);await shelf.mouse.down();
   const branchX=original.map(b=>Number(/translate\(([^ ]+)/.exec(b.root)[1])).sort((a,b)=>Math.abs(a-x)-Math.abs(b-x))[0];
   for(const dx of [50,-35,branchX-x,65]){
    await shelf.mouse.move(x+dx,y,{steps:4});await shelf.locator('.hanging.dragging').waitFor();
    const current=await foliage();receipt.measurements.push({capacity,theme,dx,before:original,during:current});
    assert.deepEqual(current,original,`foliage must remain fixed during ${capacity}/${theme}/${dx} drag`);
    const attachment=await shelf.locator('.rope > g > g').evaluateAll(nodes=>nodes.map(g=>{const a=g.querySelector('.vine-branch').getAttribute('d').match(/^M([^ ]+) ([^C]+)/),m=g.transform.baseVal.consolidate().matrix,ax=m.a*Number(a[1])+m.c*Number(a[2])+m.e,ay=m.b*Number(a[1])+m.d*Number(a[2])+m.f,points=[...document.querySelector('.rope > g .rope-core').getAttribute('d').matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(p=>[+p[1],+p[2]]);let j=points.findIndex(p=>p[0]>=ax);j=Math.max(1,j);const [x0,y0]=points[j-1],[x1,y1]=points[j];return Math.abs(ay-(y0+(y1-y0)*(ax-x0)/(x1-x0)));}));assert(attachment.every(d=>d<.06),JSON.stringify(attachment));
    const contact=await grip();assert(contact.dx<=1&&contact.overlap,JSON.stringify(contact));
   }
   await shelf.screenshot({path:path.join(out,`${capacity}-${theme}-drag.png`)});
   await shelf.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel')));await shelf.mouse.up();await shelf.locator('.hanging.dragging').waitFor({state:'detached'});
   assert.deepEqual((await info()).snapshot,before.snapshot);assert.deepEqual(await foliage(),original);receipt.checks.push(`${capacity}/${theme}: forward/back drag preserves leaves and jaw; cancel preserves data`);
   await shelf.mouse.move(x,y);await shelf.mouse.down();await shelf.mouse.move(x+55,y,{steps:4});await shelf.locator('.hanging.dragging').waitFor();await shelf.mouse.up();
   await shelf.locator('.hanging.dragging').waitFor({state:'detached'});await waitForInfo(shelf,i=>i.snapshot.revision>before.snapshot.revision);assert.deepEqual(await foliage(),original,'drop must not redistribute foliage');
   const after=(await info()).snapshot;assert.deepEqual(after.ideas,before.snapshot.ideas);assert.deepEqual(after.agents,before.snapshot.agents);assert.deepEqual(after.clips.find(c=>c.id==='group').ideaIds,['v0','v1']);assert.notEqual(after.clips.find(c=>c.id==='group').position,before.snapshot.clips.find(c=>c.id==='group').position);
   await shelf.screenshot({path:path.join(out,`${capacity}-${theme}-drop.png`)});receipt.checks.push(`${capacity}/${theme}: saved drop keeps foliage and grouped content`);
  }
  const saved=(await info()).snapshot,leaves=await foliage();await close();await launch();assert.deepEqual((await info()).snapshot,saved);assert.deepEqual(await foliage(),leaves);receipt.checks.push('restart preserves placement, grouped content and fixed foliage');receipt.passed=true;
 }catch(error){receipt.passed=false;receipt.failure=error.stack;}
 finally{try{await close();await cleanupIdleFixture(profile,[...new Set(receipt.pids)]);receipt.normalQuit=true;receipt.profileRemoved=true;}catch(error){receipt.cleanupFailure=error.stack;receipt.passed=false;}await fs.writeFile(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({out,platform:receipt.platform,packaged:receipt.packaged,passed:receipt.passed,checks:receipt.checks,normalQuit:receipt.normalQuit,profileRemoved:receipt.profileRemoved,failure:receipt.failure,cleanupFailure:receipt.cleanupFailure}));if(!receipt.passed)process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});
