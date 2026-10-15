'use strict';
// Run only on a disposable Windows runner. Probe the actual installed binary with its package identity.
const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const {_electron}=require('playwright');
const identity=require('../../src/shared/storeIdentity.json');
async function main(){
 assert.equal(process.platform,'win32');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_OS,'Windows');assert(process.env.RUNNER_TEMP);
 const exe=path.resolve(process.argv[2]),mode=process.argv[3];assert(['write','read'].includes(mode));assert(exe.toLowerCase().includes('windowsapps'+path.sep));
 const env={...process.env};for(const key of ['THOUGHTLINE_DATA_DIR','ELECTRON_RENDERER_URL','ELECTRON_RUN_AS_NODE'])delete env[key];
 let app;const report={mode,passed:false,physicalAcceptance:false};
 try{
  app=await _electron.launch({executablePath:exe,args:[],env,timeout:30000});
  const page=await app.firstWindow();await page.locator('[data-view=shelf]').waitFor({state:'attached'});
  report.runtime=await app.evaluate(({app})=>({store:process.windowsStore===true,version:app.getVersion(),arch:process.arch,userData:app.getPath('userData'),toastActivator:app.toastActivatorCLSID}));
  assert.equal(report.runtime.store,true,'launch must have MSIX package identity, not just a WindowsApps path');assert.equal(report.runtime.arch,'x64');assert.equal(report.runtime.version,require('../../package.json').version);assert.equal(report.runtime.toastActivator.toLowerCase().replace(/[{}]/g,''),identity.toastClsid);
  const initial=await page.evaluate(()=>window.thoughtline.info());
  if(mode==='write'){
   assert.equal(initial.snapshot.ideas.length,0,'refuse existing user content');
   const opened=await page.evaluate(()=>window.thoughtline.openSettings());assert(opened.ok);
   let manage;for(let i=0;i<100&&!manage;i++){manage=(await app.windows()).find(p=>p.url().includes('view=manage'));if(!manage)await new Promise(r=>setTimeout(r,40));}assert(manage);
   const saved=await manage.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.saveSettings({...i.snapshot.settings,reducedMotion:true},i.snapshot.revision);});assert(saved.ok);
   assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);
   assert((await page.evaluate(()=>window.thoughtline.openComposer())).ok);
   let composer;for(let i=0;i<100&&!composer;i++){composer=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!composer)await new Promise(r=>setTimeout(r,40));}assert(composer);
   const created=await composer.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.submit({title:'Store install fixture',text:'Synthetic retained content 中文 🙂',project:'',agentId:'general'},i.snapshot.revision);});assert(created.ok);assert.equal(created.value.ideas.length,1);
   report.snapshot=created.value;
   await fs.writeFile('dist/store/install-expected-snapshot.json',JSON.stringify(created.value));
  }else{assert.deepEqual(initial.snapshot,JSON.parse(await fs.readFile('dist/store/install-expected-snapshot.json','utf8')));report.dataRetainedAfterPackageReinstall=true;}
  report.packageAumid=identity.packageFamilyName+'!'+identity.applicationId;report.passed=true;
 }catch(error){report.error=String(error.stack||error);throw error;}finally{if(app)await app.close().catch(()=>{});await fs.writeFile(`dist/store/installed-${mode}.json`,JSON.stringify(report,null,2)+'\n');}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
