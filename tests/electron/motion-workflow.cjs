const {launchOptions,warmViews}=require('./window-fixture.cjs');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-motion-'));let app;
 try{
  app=await _electron.launch(await launchOptions(dir));
  await warmViews(app);while((await app.windows()).length<3)await app.waitForEvent('window');const pages=await app.windows();const shelf=pages.find(p=>p.url().includes('view=shelf')),composer=pages.find(p=>p.url().includes('view=composer'));
  await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  const submit=async n=>{const r=await composer.evaluate(async n=>{const i=await window.thoughtline.info();return window.thoughtline.submit({text:'完整正文 '+n,title:'动效测试 '+n,agentId:'codex',project:''},i.snapshot.revision);},n);assert(r.ok,r.message);};
  await shelf.evaluate(()=>{const raf=window.requestAnimationFrame;window.motionRequests=0;window.requestAnimationFrame=callback=>{window.motionRequests++;return raf(callback);};});
  await submit(1);
  await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  await shelf.evaluate(()=>window.thoughtline.dragLock(true));
  const dimensions=await shelf.locator('.idea-card').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));assert.deepEqual(dimensions,{width:160,height:112});
  await shelf.evaluate(()=>window.thoughtline.dragLock(false));
  let retained=false,revived=false;
  for(let i=0;i<180;i++){
   const state=await shelf.evaluate(()=>({visible:document.querySelector('[data-view=shelf]').dataset.visible==='true',progress:Number(document.querySelector('[data-view=shelf]').dataset.progress)}));
   const native=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf').isVisible());
   if(!state.visible&&native){retained=true;await submit(2);revived=true;break;}
   await new Promise(r=>setTimeout(r,20));
  }
  assert(retained,'native shelf must remain while exit frames are painted');assert(revived);
  await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf').isVisible()));
  await shelf.waitForFunction(()=>document.querySelector('[data-view=shelf]').dataset.visible==='false');
  await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===0);
  await new Promise(r=>setTimeout(r,80));assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf').isVisible()),false);
  const requests=await shelf.evaluate(()=>window.motionRequests);await new Promise(r=>setTimeout(r,250));assert.equal(await shelf.evaluate(()=>window.motionRequests),requests,'no idle animation frames');
  await shelf.emulateMedia({reducedMotion:'reduce'});await submit(3);
  await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  const reduced=await shelf.evaluate(()=>({animation:getComputedStyle(document.querySelector('.idea-card strong')).animationName,sag:Number(document.querySelector('.rope').dataset.sag)}));assert.equal(reduced.animation,'none');assert.equal(reduced.sag,26);
  await shelf.screenshot({path:'acceptance/evidence/motion-native.png',omitBackground:true});
  const report={scope:'actual Mac Electron app/native window and renderer protocol; not physical hover, click-through or subjective visual acceptance',compactSize:[160,112],exitRetainsNativeUntilPainted:true,rapidReentryStaysVisible:true,eventualNativeHide:true,noIdleAnimationFrames:true,liveSystemReducedMotion:true,sharedSag:26};
  await fs.writeFile('acceptance/evidence/motion-native.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{try{if(app)await app.close();}finally{await fs.rm(dir,{recursive:true,force:true});}}
})().catch(e=>{console.error(e);process.exitCode=1;});
