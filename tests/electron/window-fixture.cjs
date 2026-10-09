const fs=require('node:fs/promises'),path=require('node:path');
// Protocol fixtures emulate the shortcut registry by default; only smoke/lifecycle opt into real OS registration.
// Production has no new IPC entry or test-only startup behavior.
async function launchOptions(dir,{realShortcuts=false}={}){
 if(process.env.THOUGHTLINE_EXECUTABLE)throw Error('These protocol fixtures require the source runtime. Use the packaged acceptance fixture for a frozen App.');
 const entry=path.join(dir,'protocol-entry.cjs');
 await fs.writeFile(entry,`const {globalShortcut,Menu}=require('electron');globalThis.thoughtlineTestPopup=null;Menu.prototype.popup=function(options){globalThis.thoughtlineTestPopup={menu:this,options};};const callbacks=new Map();const register=globalShortcut.register.bind(globalShortcut),unregister=globalShortcut.unregister.bind(globalShortcut);if(${JSON.stringify(realShortcuts)}){globalShortcut.register=(key,callback)=>{const ok=register(key,callback);if(ok)callbacks.set(key,callback);return ok;};globalShortcut.unregister=key=>{callbacks.delete(key);return unregister(key);};}else{globalShortcut.register=(key,callback)=>{if(callbacks.has(key))return false;callbacks.set(key,callback);return true;};globalShortcut.unregister=key=>callbacks.delete(key);globalShortcut.isRegistered=key=>callbacks.has(key);globalShortcut.unregisterAll=()=>callbacks.clear();}globalThis.thoughtlineTestHotkeys=callbacks;require(${JSON.stringify(path.resolve('out/main/index.js'))});`);
 if(process.env.THOUGHTLINE_FAKE_CLIPBOARD==='1')await fs.writeFile(entry,`const clipboard=require('electron').clipboard;let fixtureText='';clipboard.readText=()=>fixtureText;clipboard.writeText=text=>{fixtureText=text;};`+await fs.readFile(entry,'utf8'));
 return {executablePath:require('electron'),args:[entry],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:15000};
}
async function openComposer(app,shelf){
 await app.evaluate(async({BrowserWindow})=>{const shelf=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf');const key=await shelf.webContents.executeJavaScript('window.thoughtline.info().then(i=>i.snapshot.settings.writeHotkey)');const callback=globalThis.thoughtlineTestHotkeys?.get(key);if(!callback)throw Error('Expected registered write shortcut callback');callback();});
 let page;const until=Date.now()+10000;
 while(!page&&Date.now()<until){page=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!page)await new Promise(r=>setTimeout(r,25));}
 if(!page)throw Error('Composer did not open');while(!(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Composer'&&w.isVisible())))&&Date.now()<until)await new Promise(r=>setTimeout(r,25));await page.waitForSelector('#idea-text');await page.waitForFunction(()=>document.activeElement?.id==='idea-text');return page;
}
async function warmViews(app){
 const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
 const opened=await shelf.evaluate(()=>window.thoughtline.openSettings());if(!opened.ok)throw Error(opened.message);
 const manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=settings]');await manage.evaluate(()=>window.thoughtline.closeManage());
 const composer=await openComposer(app,shelf);
 await composer.evaluate(async()=>{const i=await window.thoughtline.info();const r=await window.thoughtline.close(i.composerContext.draft);if(!r.ok)throw Error(r.message);});
 return {shelf,composer,manage};
}
async function waitForInfo(page,predicate,timeout=10000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const info=await page.evaluate(()=>window.thoughtline.info());if(predicate(info))return info;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out waiting for acknowledged main-process state');}
module.exports={launchOptions,openComposer,warmViews,waitForInfo};
