const fs=require('node:fs/promises'),path=require('node:path');
// Protocol fixtures emulate the shortcut registry by default; only smoke/lifecycle opt into real OS registration.
// Production has no new IPC entry or test-only startup behavior.
async function launchOptions(dir,{realShortcuts=false,seedLocale='zh-CN',osLocale,stationaryTopCursor=false,fakeNotifications=false}={}){
 if(process.env.THOUGHTLINE_EXECUTABLE)throw Error('These protocol fixtures require the source runtime. Use the packaged acceptance fixture for a frozen App.');
 if(seedLocale)await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale:seedLocale,theme:'system'}),{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
 const buildDir=path.resolve(process.env.THOUGHTLINE_BUILD_DIR||'out');
 await fs.access(path.resolve(buildDir,'../assets',process.platform==='darwin'?'trayTemplate.png':'tray-win.ico'));
 const entry=path.join(dir,'protocol-entry.cjs');
 await fs.writeFile(entry,`const {globalShortcut,Menu}=require('electron');require('electron').dialog.showErrorBox=(title,message)=>{console.error('OWNED FIXTURE STARTUP ERROR:',title,message);};if(${JSON.stringify(osLocale)})require('electron').app.getLocale=()=>${JSON.stringify(osLocale)};globalThis.thoughtlineTestPopup=null;Menu.prototype.popup=function(options){globalThis.thoughtlineTestPopup={menu:this,options};};const callbacks=new Map();const register=globalShortcut.register.bind(globalShortcut),unregister=globalShortcut.unregister.bind(globalShortcut);if(${JSON.stringify(realShortcuts)}){globalShortcut.register=(key,callback)=>{const ok=register(key,callback);if(ok)callbacks.set(key,callback);return ok;};globalShortcut.unregister=key=>{callbacks.delete(key);return unregister(key);};}else{globalShortcut.register=(key,callback)=>{if(callbacks.has(key))return false;callbacks.set(key,callback);return true;};globalShortcut.unregister=key=>callbacks.delete(key);globalShortcut.isRegistered=key=>callbacks.has(key);globalShortcut.unregisterAll=()=>callbacks.clear();}globalThis.thoughtlineTestHotkeys=callbacks;require(${JSON.stringify(path.resolve(process.env.THOUGHTLINE_BUILD_DIR||'out','main/index.js'))});`);
 // Menu/data fixtures can hold an owned synthetic top-edge point, without moving
 // the host OS cursor or borrowing a drag lock that production actions cancel.
 if(stationaryTopCursor)await fs.writeFile(entry,`require('electron').app.once('ready',()=>{const {screen}=require('electron');screen.getCursorScreenPoint=()=>{const d=screen.getPrimaryDisplay();return {x:d.bounds.x+d.bounds.width/2,y:d.bounds.y+1};};});\n`+await fs.readFile(entry,'utf8'));
 if(process.env.THOUGHTLINE_FAKE_CLIPBOARD==='1')await fs.writeFile(entry,`const clipboard=require('electron').clipboard;let fixtureText='';clipboard.readText=()=>fixtureText;clipboard.writeText=text=>{fixtureText=text;};`+await fs.readFile(entry,'utf8'));
 if(fakeNotifications)await fs.writeFile(entry,`const electron=require('electron'),{EventEmitter}=require('node:events');globalThis.thoughtlineTestNotifications=[];globalThis.thoughtlineTestNotificationAccess="granted";class FixtureNotice extends EventEmitter{static isSupported(){return true;}static async getHistory(){return [];}static handleActivation(callback){globalThis.thoughtlineTestNotificationActivation=callback;}constructor(options){super();this.options=options;globalThis.thoughtlineTestNotifications.push(this);}show(){this.emit('show');}close(){this.emit('close');}}const Module=require('node:module'),load=Module._load,proxy=new Proxy(electron,{get:(target,key)=>key==='Notification'?FixtureNotice:Reflect.get(target,key)});Module._load=function(name,...args){return name==='electron'?proxy:load.call(this,name,...args);};const child=require('node:child_process'),exec=child.execFile;child.execFile=function(file,args,options,callback){if(file==='powershell.exe'&&args.join(' ').includes('CreateToastNotifier')){callback(null,globalThis.thoughtlineTestNotificationAccess==='denied'?'DisabledForApplication':'Enabled');return {kill(){}};}return exec.call(this,file,args,options,callback);};const nativePath=${JSON.stringify(path.join(buildDir,'main/notification-permission.node'))};require.cache[nativePath]={id:nativePath,filename:nativePath,loaded:true,exports:{getStatus:(_request,callback)=>callback(globalThis.thoughtlineTestNotificationAccess)}};\n`+await fs.readFile(entry,'utf8'));
 return {executablePath:require('electron'),args:[entry],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:15000};
}
async function openComposer(app,shelf){
 await app.evaluate(async({BrowserWindow})=>{const shelf=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Shelf');const key=await shelf.webContents.executeJavaScript('window.thoughtline.info().then(i=>i.snapshot.settings.writeHotkey)');const callback=globalThis.thoughtlineTestHotkeys?.get(key);if(!callback)throw Error('Expected registered write shortcut callback');callback();});
 let page;const until=Date.now()+10000;
 while(!page&&Date.now()<until){page=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!page)await new Promise(r=>setTimeout(r,25));}
 if(!page)throw Error('Composer did not open');while(!(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Composer'&&w.isVisible())))&&Date.now()<until)await new Promise(r=>setTimeout(r,25));await page.waitForSelector('#idea-text');await page.waitForFunction(()=>document.activeElement?.id==='idea-text');return page;
}
// A hidden renderer may suspend the promise continuation before Playwright reads
// it. Observe the acknowledged native hide from the main process instead of
// holding page.evaluate open until the normal 30-second window recycle.
async function waitHidden(app,title){const deadline=Date.now()+10000;while(await app.evaluate(({BrowserWindow},title)=>BrowserWindow.getAllWindows().some(w=>w.getTitle()===title&&w.isVisible()),title)){if(Date.now()>deadline)throw Error('Fixture close did not hide '+title);await new Promise(r=>setTimeout(r,25));}}
async function warmViews(app){
 const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
 const opened=await shelf.evaluate(()=>window.thoughtline.openSettings());if(!opened.ok)throw Error(opened.message);
 const manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=settings]');await manage.evaluate(()=>{void window.thoughtline.closeManage().then(result=>{window.thoughtlineFixtureClose=result;});});await waitHidden(app,'Thoughtline Manage');
 const composer=await openComposer(app,shelf);
 await composer.evaluate(()=>{void window.thoughtline.info().then(i=>window.thoughtline.close(i.composerContext.draft)).then(result=>{window.thoughtlineFixtureClose=result;});});await waitHidden(app,'Thoughtline Composer');
 return {shelf,composer,manage};
}
async function waitForInfo(page,predicate,timeout=10000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const info=await page.evaluate(()=>window.thoughtline.info());if(predicate(info))return info;await new Promise(r=>setTimeout(r,25));}throw Error('Timed out waiting for acknowledged main-process state');}
module.exports={launchOptions,openComposer,warmViews,waitForInfo};
