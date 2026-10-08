const {launchOptions,warmViews}=require('./window-fixture.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-lifecycle-'));let app;
 const start=async()=>{
  app=await _electron.launch(await launchOptions(dir));
  await warmViews(app);while((await app.windows()).length<3)await app.waitForEvent('window',{timeout:5000});
  const pages=await app.windows();for(const p of pages)await p.waitForURL(/view=(shelf|composer|manage)/,{waitUntil:'domcontentloaded'});
  const by=name=>pages.find(p=>p.url().includes('view='+name));await by('shelf').waitForSelector('[data-view=shelf]',{state:'attached'});
  return {shelf:by('shelf'),composer:by('composer'),manage:by('manage')};
 };
 const oldKey='Control+Alt+F19',newKey='Control+Alt+Shift+9',busyKey='Control+Alt+Shift+8';
 try{
  const seed={schemaVersion:2,revision:0,clips:[],ideas:[],agents:[{id:'general',name:'通用',color:'#A4A5B0'}],draft:null,settings:{writeHotkey:oldKey,reducedMotion:false}};
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(seed));
  let {shelf,composer,manage}=await start();
  assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);
  await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('button',{name:'录制快捷键',exact:true}).click();
  await manage.locator('#write-hotkey').press('Control+Alt+Shift+9');assert.equal(await manage.locator('#write-hotkey').inputValue(),newKey);
  await manage.getByRole('checkbox',{name:'减少动态效果'}).check();await manage.getByRole('button',{name:'保存设置',exact:true}).click();
  await manage.getByText('已保存。',{exact:true}).waitFor();
  const registered=await app.evaluate(({globalShortcut},{oldKey,newKey})=>({old:globalShortcut.isRegistered(oldKey),next:globalShortcut.isRegistered(newKey)}),{oldKey,newKey});
  assert.deepEqual(registered,{old:false,next:true});
  assert(await app.evaluate(({globalShortcut},key)=>globalShortcut.register(key,()=>{}),busyKey));
  await manage.getByRole('button',{name:'录制快捷键',exact:true}).click();await manage.locator('#write-hotkey').press('Control+Alt+Shift+8');
  await manage.getByRole('button',{name:'保存设置',exact:true}).click();await manage.getByText(/快捷键已被占用/).waitFor();
  assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).settings.writeHotkey,newKey);
  assert(await app.evaluate(({globalShortcut},key)=>globalShortcut.isRegistered(key),newKey));
  if(process.platform!=='win32'){
   await manage.getByRole('button',{name:'录制快捷键',exact:true}).click();await manage.locator('#write-hotkey').press('Control+Alt+Shift+7');
   await fs.chmod(dir,0o500);await manage.getByRole('button',{name:'保存设置',exact:true}).click();await manage.getByText(/本地保存未成功/).waitFor();
   const keys=await app.evaluate(({globalShortcut},old)=>({old:globalShortcut.isRegistered(old),failed:globalShortcut.isRegistered('Control+Alt+Shift+7')}),newKey);assert.deepEqual(keys,{old:true,failed:false});
   assert.equal(JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8')).settings.writeHotkey,newKey);await fs.chmod(dir,0o700);
  }
  await manage.getByRole('button',{name:'关闭设置',exact:true}).click();
  // Explicitly show our own isolated composer; this is a DOM/IPC lifecycle test, not physical hotkey acceptance.
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').show());
  const draft='  退出前尚未挂上的草稿\n第二行中文\n第三行完整保留';
  await composer.locator('#idea-text').fill(draft);await composer.locator('.title-input input').fill('未提交标签');
  if(process.platform!=='win32'){
   await fs.chmod(dir,0o500);await app.evaluate(({app})=>{app.quit();});
   await composer.getByText(/本地保存未成功/).waitFor();assert.equal(await composer.locator('#idea-text').inputValue(),draft);
   assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer').isVisible()));await fs.chmod(dir,0o700);
  }
  await app.close();app=null;
  const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));assert.equal(disk.draft?.text,draft);assert.equal(disk.draft.title,'未提交标签');assert.equal(disk.ideas.length,0);
  ({shelf,composer}=await start());assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.settings.reducedMotion,true);assert.equal(await composer.locator('#idea-text').inputValue(),draft);
  const report={platform:process.platform,scope:'actual Electron global shortcut registry, renderer recording, disk/restart and quit lifecycle; not physical keyboard/IME acceptance',recorded:true,swapRegistered:true,conflictKeepsOld:true,reducedMotionPersisted:true,quitDraftPreserved:true,restartDraftPreserved:true,settingsFailureKeepsOld:process.platform!=='win32',quitFailureKeepsInput:process.platform!=='win32'};
  await fs.writeFile('acceptance/evidence/settings-lifecycle.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await fs.chmod(dir,0o700).catch(()=>{});try{if(app)await app.close();}finally{await fs.rm(dir,{recursive:true,force:true});}}
})().catch(e=>{console.error(e);process.exitCode=1;});
