const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {_electron}=require('../qa-candidate-0.0.13/node_modules/playwright');
const {cleanupIdleFixture}=require('../qa-candidate-0.0.13/tests/electron/idle-fixture-cleanup.cjs');
const executable=path.resolve(__dirname,'../frozen-0.0.13/mount/Thoughtline.app/Contents/MacOS/Thoughtline');
const reportPath=path.join(__dirname,'incremental-result.json');
const wait=async(page,predicate,timeout=10000)=>{const end=Date.now()+timeout;while(Date.now()<end){const info=await page.evaluate(()=>window.thoughtline.info());if(predicate(info))return info;await new Promise(r=>setTimeout(r,25));}throw Error('acknowledged main state timeout');};

(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-qa-0.0.13-'));
 const owned=new Set(),checks={},nativeMenus=[],screenshots=[];let app,error,cleanup;
 const body='  独立0.0.13冻结包中文正文\n第二行😀\n末行  ';
 const draftBody='  独立0.0.13未提交草稿\n换行与空格😀  ';
 const seed={schemaVersion:2,revision:0,clips:[],ideas:[],agents:[{id:'general',name:'通用',color:'#A4A5B0'},{id:'codex',name:'Codex',color:'#4C90D9'},{id:'claude',name:'Claude',color:'#D79551'}],draft:null,settings:{writeHotkey:'Control+Alt+Shift+F18',reducedMotion:false}};
 const remember=()=>{if(!app)return;const pid=app.process().pid;owned.add(pid);const rows=execFileSync('ps',['-axo','pid=,ppid='],{encoding:'utf8'}).trim().split('\n').map(l=>l.trim().split(/\s+/).map(Number));const tree=new Set([pid]);for(let n=0;n<rows.length;n++)for(const [child,parent]of rows)if(tree.has(parent))tree.add(child);for(const child of tree)owned.add(child);};
 const launch=async()=>{
  const env={...process.env,THOUGHTLINE_DATA_DIR:dir};delete env.ELECTRON_RENDERER_URL;delete env.ELECTRON_RUN_AS_NODE;
  app=await _electron.launch({executablePath:executable,args:[],env,timeout:20000});remember();
  assert.equal(await app.evaluate(({app})=>app.getVersion()),'0.0.13');
  assert.equal(await app.evaluate(({app})=>app.getPath('userData')),dir);
  await app.evaluate(({Tray,screen,nativeTheme})=>{
   const original=Tray.prototype.setContextMenu;
   Tray.prototype.setContextMenu=function(menu){globalThis.qaNativeMenu=menu;return original.call(this,menu);};
   const display=screen.getPrimaryDisplay();globalThis.qaPointer={x:display.bounds.x+Math.round(display.bounds.width/2),y:display.bounds.y+Math.round(display.bounds.height/2)};
   screen.getCursorScreenPoint=()=>globalThis.qaPointer;nativeTheme.themeSource='light';
  });
  const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});return shelf;
 };
 const nativeVisible=title=>app.evaluate(({BrowserWindow},title)=>BrowserWindow.getAllWindows().find(w=>w.getTitle()===title)?.isVisible()??false,title);
 const writeEnabled=()=>app.evaluate(()=>globalThis.qaNativeMenu.items.find(i=>i.label.startsWith('写念头：')).enabled);
 const menuClick=label=>app.evaluate((_electron,label)=>{const item=globalThis.qaNativeMenu.items.find(i=>i.label.startsWith(label));if(!item?.enabled)throw Error('native Menu item unavailable: '+label);item.click();},label);
 const menuDetails=()=>app.evaluate(({Menu,MenuItem})=>{const item=globalThis.qaNativeMenu.items.find(i=>i.label.startsWith('写念头：'));return {nativeMenu:globalThis.qaNativeMenu instanceof Menu,nativeItem:item instanceof MenuItem,label:item.label,enabled:item.enabled};});
 const primeMenu=async shelf=>{assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);const manage=(await app.windows()).find(p=>p.url().includes('view=manage'));assert(manage);await manage.waitForSelector('[data-mode=settings]');assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);await wait(shelf,i=>!i.interactionLocked);assert.equal(await nativeVisible('Thoughtline Manage'),false);assert.equal(await writeEnabled(),true);return manage;};
 const showComposer=async shelf=>{await menuClick('写念头：');await wait(shelf,i=>i.interactionLocked);let page;const end=Date.now()+10000;while(!page&&Date.now()<end){page=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!page)await new Promise(r=>setTimeout(r,25));}assert(page);await page.waitForSelector('#idea-text');await page.waitForFunction(()=>document.activeElement?.id==='idea-text');assert.equal(await nativeVisible('Thoughtline Composer'),true);return page;};
 const captureEmpty=async(shelf,name)=>{
  assert.equal((await shelf.locator('[data-view=shelf]').textContent()).trim(),'');assert.equal(await shelf.locator('[data-hit]').count(),0);assert.equal(await shelf.locator('.clothespin').count(),0);
  await app.evaluate(({screen})=>{const d=screen.getPrimaryDisplay();globalThis.qaPointer={x:d.bounds.x+Math.round(d.bounds.width/2),y:d.bounds.y};});await wait(shelf,i=>i.shelfVisible);
  assert((await shelf.evaluate(()=>window.thoughtline.dragLock(true))).ok);await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  await shelf.evaluate(()=>{document.body.style.background='#EAE8E0';});const file=path.join(__dirname,name+'.png');await shelf.screenshot({path:file});screenshots.push({path:file,visibleClips:0,emptyText:'',hitTargets:0,ropePath:await shelf.locator('.rope-core').getAttribute('d')});
  assert((await shelf.evaluate(()=>window.thoughtline.dragLock(false))).ok);
 };
 const closeCurrent=async()=>{remember();await app.close();app=null;};
 try{
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(seed));let shelf=await launch();
  assert.equal((await app.windows()).length,1);assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas.length,0);checks.startupOneShelf=true;
  await captureEmpty(shelf,'empty-rope');checks.emptyRopeOnly=true;
  let manage=await primeMenu(shelf);nativeMenus.push(await menuDetails());
  await menuClick('设置');await wait(shelf,i=>i.interactionLocked&&i.manageMode==='settings');await manage.waitForSelector('[data-mode=settings]');assert.equal(await writeEnabled(),false);
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await manage.waitForSelector('#idea-search');assert.equal(await writeEnabled(),true);
  await menuClick('设置');await manage.waitForSelector('[data-mode=settings]');assert.equal(await writeEnabled(),false);
  const beforeSettings=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot.revision;await manage.getByLabel('减少动态效果',{exact:true}).check();await manage.getByRole('button',{name:'保存设置',exact:true}).click();await wait(shelf,i=>i.snapshot.revision===beforeSettings+1&&i.snapshot.settings.reducedMotion);await manage.getByRole('status').filter({hasText:'已保存。'}).waitFor();assert.equal(await writeEnabled(),false);
  await manage.getByRole('button',{name:'关闭设置',exact:true}).click();await wait(shelf,i=>!i.interactionLocked);assert.equal(await nativeVisible('Thoughtline Manage'),false);assert.equal(await writeEnabled(),true);nativeMenus.push(await menuDetails());
  let composer=await showComposer(shelf);checks.traySettingsShowSaveCloseNew=true;checks.visibleManageModeRefresh=true;
  await composer.locator('#idea-text').fill(body);await composer.getByRole('button',{name:'Codex',exact:true}).click();await composer.locator('.title-input input').fill('独立保存重启');if(await composer.locator('details').getAttribute('open')===null)await composer.locator('details summary').click();await composer.locator('.optional input').fill('QA本地假项目');await composer.getByRole('button',{name:'挂上',exact:true}).click();
  let info=await wait(shelf,i=>!i.interactionLocked&&i.snapshot.ideas.some(n=>n.text===body));assert.equal(await nativeVisible('Thoughtline Composer'),false);assert.equal(info.snapshot.ideas.length,1);const id=info.snapshot.ideas[0].id;assert.equal(info.snapshot.ideas[0].agentId,'codex');checks.noteSavedExact=true;
  await app.evaluate(()=>{const submenu=globalThis.qaNativeMenu.items.find(i=>i.label==='筛选 Agent').submenu;const item=submenu.items.find(i=>i.label.includes('Claude'));if(!item.enabled)throw Error('filter disabled');item.click();});await wait(shelf,i=>i.shelfAgentId==='claude');await shelf.waitForFunction(()=>!document.querySelector('.clothespin'));await captureEmpty(shelf,'filtered-empty-rope');assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas.length,1);assert.equal(await writeEnabled(),true);checks.filteredEmptyRopeOnlyAndNewAccessible=true;
  composer=await showComposer(shelf);await composer.locator('#idea-text').fill(draftBody);await composer.getByRole('button',{name:'Claude',exact:true}).click();await composer.locator('.title-input input').fill('独立重启草稿');if(await composer.locator('details').getAttribute('open')===null)await composer.locator('details summary').click();await composer.locator('.optional input').fill('QA草稿假项目');await composer.getByRole('button',{name:'保存草稿并关闭',exact:true}).click();await wait(shelf,i=>!i.interactionLocked&&i.snapshot.draft?.text===draftBody);assert.equal(await nativeVisible('Thoughtline Composer'),false);checks.draftSavedExact=true;
  await closeCurrent();const disk=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));assert.equal(disk.ideas[0].text,body);assert.equal(disk.draft.text,draftBody);
  shelf=await launch();info=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas.length,1);assert.equal(info.snapshot.ideas[0].text,body);assert.equal(info.snapshot.ideas[0].title,'独立保存重启');assert.equal(info.snapshot.ideas[0].project,'QA本地假项目');assert.equal(info.snapshot.draft.text,draftBody);assert.equal(info.snapshot.settings.reducedMotion,true);assert.equal(info.snapshot.settings.writeHotkey,seed.settings.writeHotkey);
  manage=await primeMenu(shelf);composer=await showComposer(shelf);await composer.waitForFunction(text=>document.querySelector('#idea-text').value===text,draftBody);assert.equal(await composer.locator('.title-input input').inputValue(),'独立重启草稿');assert.equal(await composer.locator('.optional input').inputValue(),'QA草稿假项目');assert.equal(await composer.getByRole('button',{name:'Claude',exact:true}).getAttribute('aria-pressed'),'true');await composer.getByRole('button',{name:'保存草稿并关闭',exact:true}).click();await wait(shelf,i=>!i.interactionLocked&&i.snapshot.draft?.text===draftBody);
  assert((await shelf.evaluate(id=>window.thoughtline.openManage(id),id)).ok);await manage.waitForSelector('[data-full-text]');assert.equal(await manage.locator('[data-full-text]').inputValue(),body);assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);await wait(shelf,i=>!i.interactionLocked);checks.restartRestoresNoteDraftSettingsAndFields=true;
 }catch(e){error={name:e.name,message:e.message,stack:e.stack};console.error(e);}
 finally{
  try{if(app)await closeCurrent();await cleanupIdleFixture(dir,owned);let exists=true;try{await fs.access(dir);}catch(e){if(e.code==='ENOENT')exists=false;else throw e;}assert.equal(exists,false);cleanup={passed:true,removed:true,ownedPids:[...owned],helper:'exact dee1f2c tests/electron/idle-fixture-cleanup.cjs',boundedExitWaitAndRmRetries:true};}catch(e){cleanup={passed:false,message:e.message,retainedFakeData:dir,ownedPids:[...owned]};console.error(e);error??={name:e.name,message:e.message};}
  const result={sourceCommit:'dee1f2c9046b284e2dd430632d9bdb913128c868',reportCommit:'6ae06a2e8dc55c11cc37d1d99128c374eeb7e74d',version:'0.0.13',executable,scope:'actual copied read-only frozen Mac App, own fake data; actual Tray Menu/MenuItem captured after launch without changing callback or setContextMenu implementation; actual Menu callback/renderer DOM/awaited IPC and native window objects; simulated own-app pointer and neutral renderer background; no physical OS menu selection/IME/global key/Windows/G7 acceptance',hotkeyScope:'fixture-specific Control+Alt+Shift+F18 registered by unmodified App startup; never physically pressed, no callback invoked by keyboard',dataDir:dir,checks,nativeMenus,screenshots,cleanup,error,passed:!error&&cleanup?.passed};await fs.writeFile(reportPath,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
