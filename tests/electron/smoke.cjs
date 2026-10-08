const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs/promises');const os=require('node:os');
const playwright=require(process.env.THOUGHTLINE_PLAYWRIGHT_PACKAGE||'playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-native-'));
 let app;
 try{
  app=await playwright._electron.launch(await launchOptions(dir,{realShortcuts:true}));
  await warmViews(app);
  while((await app.windows()).length<3)await app.waitForEvent('window',{timeout:5000});
  for(const page of await app.windows())await page.waitForURL(/view=(shelf|composer|manage)/,{waitUntil:'domcontentloaded',timeout:5000});
  const shelf=(await app.windows()).find(p=>p.url().includes('view=shelf'));
  assert(shelf);await shelf.waitForSelector('[data-view="shelf"]',{state:'attached'});
  await waitForInfo(shelf,i=>i.hotkeyRegistered,5000);
  const result=await app.evaluate(({BrowserWindow,globalShortcut})=>{
    const shelf=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf');
    return {title:shelf?.getTitle(),hidden:!shelf?.isVisible(),focusable:shelf?.isFocusable(),hotkey:globalShortcut.isRegistered('Control+Alt+N')};
  });
  assert.equal(result.title,'Thoughtline Shelf');assert.equal(result.hidden,true);assert.equal(result.focusable,false);assert.equal(result.hotkey,true);
  console.log(JSON.stringify({platform:process.platform,electron:await app.evaluate(()=>process.versions.electron),basicNative:result,scope:'真实Electron窗口对象与快捷键注册；尚不证明物理鼠标穿透或外部App焦点'},null,2));
 }finally{try{if(app)await app.close();}finally{await fs.rm(dir,{recursive:true,force:true});}}
})().catch(error=>{console.error(error);process.exitCode=1;});
