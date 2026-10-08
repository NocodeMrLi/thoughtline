const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {_electron}=require('playwright'),{launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
(async()=>{
 const evidence=[];
 for(const scale of [1,2]){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-clothespin-'));let app;
  try{
   const options=await launchOptions(dir);options.args.push('--force-device-scale-factor='+scale);app=await _electron.launch(options);const {shelf,composer}=await warmViews(app);
   const add=async(n,agentId)=>{const r=await composer.evaluate(async({n,agentId})=>{const i=await window.thoughtline.info();return window.thoughtline.submit({text:'完整中文便签 '+n+'\n第二行😀',title:['梳理产品思路','检查交互细节','整理下一步'][n%3],agentId,project:''},i.snapshot.revision);},{n,agentId});assert(r.ok,r.message);return r.value.ideas.at(-1).id;};
   const ids=[];ids.push(await add(0,'general'));let info=await shelf.evaluate(()=>window.thoughtline.info());assert((await shelf.evaluate(({id,revision})=>window.thoughtline.setStatus(id,'archived',revision),{id:ids[0],revision:info.snapshot.revision})).ok);
   await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);await shelf.evaluate(()=>window.thoughtline.dragLock(true));
   const shape=()=>shelf.locator('.rope-core').getAttribute('d');const fixed=await shape();
   const capture=async(count)=>{for(const theme of ['light','dark']){
    await app.evaluate(({nativeTheme},theme)=>{nativeTheme.themeSource=theme;},theme);await waitForInfo(shelf,i=>i.dark===(theme==='dark'));await shelf.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
    // Renderer-only neutral backdrops make the transparency/proportion review reproducible; no wallpaper ships.
    await shelf.evaluate(theme=>{document.body.style.background=theme==='dark'?'#30343A':'#EAE8E0';},theme);
    const name=`clothespin-${scale}x-${theme}-${count}`;await shelf.screenshot({path:'acceptance/evidence/'+name+'.png'});
    const geometry=await shelf.locator('.hanging').evaluateAll(items=>items.map(el=>{const pin=el.querySelector('.clothespin').getBoundingClientRect(),hit=el.querySelector('.peg-button').getBoundingClientRect(),paper=el.querySelector('.idea-card').getBoundingClientRect();return {pin:{width:pin.width,height:pin.height,top:pin.top,bottom:pin.bottom},hit:{width:hit.width,height:hit.height},paper:{width:paper.width,height:paper.height,top:paper.top},arms:el.querySelectorAll('.pin-arm').length,spring:!!el.querySelector('[data-part=silver-spring]')};}));
    for(const g of geometry){assert.deepEqual(g.hit,{width:24,height:44});assert.equal(g.pin.width,18);assert.equal(g.pin.height,38);assert.equal(g.arms,2);assert(g.spring);assert(g.pin.top<g.paper.top&&g.pin.bottom>g.paper.top,'jaw must overlap paper edge');assert(Math.abs(g.paper.width-160)<.01);assert(Math.abs(g.paper.height-112)<.01);}
    assert.equal(await shape(),fixed);assert.equal(await shelf.locator('nav').count(),0);evidence.push({name,requestedScale:scale,actualDpr:await shelf.evaluate(()=>devicePixelRatio),theme,noteCount:count,visibleClips:geometry.length,jawOverlapsPaper:true,geometry});
   }};
   await capture(0);await shelf.evaluate(()=>window.thoughtline.dragLock(false));
   for(let n=1;n<=3;n++)await add(n,['codex','claude','cursor'][n-1]);await shelf.waitForFunction(()=>document.querySelectorAll('.clothespin').length===3);await shelf.evaluate(()=>window.thoughtline.dragLock(true));await capture(3);await shelf.evaluate(()=>window.thoughtline.dragLock(false));
   // Real protocol press/release, including dynamic accessibility preference while held.
   const pin=shelf.locator('.peg-button').first(),box=await pin.boundingBox();await shelf.mouse.move(box.x+12,box.y+22);await shelf.mouse.down();await new Promise(r=>setTimeout(r,150));assert.notEqual(await pin.locator('.pin-front').evaluate(el=>getComputedStyle(el).transform),'none');
   await shelf.emulateMedia({reducedMotion:'reduce'});await shelf.waitForFunction(()=>document.querySelector('.clothespin').dataset.reduced==='true');assert.equal(await pin.locator('.pin-front').evaluate(el=>getComputedStyle(el).transform),'none');await shelf.mouse.up();await new Promise(r=>setTimeout(r,100));
   // A click intentionally opens detail; close it before more writes.
   await waitForInfo(shelf,i=>i.interactionLocked);await shelf.evaluate(()=>window.thoughtline.closeManage());await shelf.emulateMedia({reducedMotion:'no-preference'});
   for(let n=4;n<=24;n++)await add(n,'codex');await shelf.evaluate(()=>window.thoughtline.dragLock(true));await capture(24);await shelf.evaluate(()=>window.thoughtline.dragLock(false));
  }finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
 }
 const report={scope:'Mac actual Electron rendered vector at forced renderer scale1/2, neutral fixture backdrops; not physical Windows, wallpaper or subjective user acceptance',design:'13',noRasterAsset:true,defaultColorsAndCustomPreservation:'tests/unit/agentPalette.test.ts',runtimeReducedMotionCancelsArms:true,steadyToolbarAbsent:true,fixedRopeAtEveryCount:true,evidence};await fs.writeFile('acceptance/evidence/clothespin-native.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({screenshots:evidence.length,actualDprs:[...new Set(evidence.map(e=>e.actualDpr))],passed:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
