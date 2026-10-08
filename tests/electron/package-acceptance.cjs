const {waitForInfo}=require('./window-fixture.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {_electron}=require('playwright');
(async()=>{
 if(!process.env.THOUGHTLINE_EXECUTABLE)throw Error('Set THOUGHTLINE_EXECUTABLE to the frozen test App executable.');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-package-acceptance-'));let app;
 const body='  原始中文正文\n第二行😀\n末行  ',id='package-test-idea';
 const seed={schemaVersion:2,revision:0,clips:[{id:'package-test-clip',agentId:'general',ideaIds:[id],currentId:id,position:null}],ideas:[{id,text:body,title:'独立包验收',project:'',agentId:'general',status:'hanging',createdAt:'2026-10-09T00:00:00.000Z',updatedAt:'2026-10-09T00:00:00.000Z'}],agents:[{id:'general',name:'通用',color:'#A4A5B0'}],draft:{text:'重启草稿',title:'',project:'',agentId:'general'},settings:{writeHotkey:'Control+Alt+F18',reducedMotion:false}};
 const launch=async()=>{app=await _electron.launch({executablePath:process.env.THOUGHTLINE_EXECUTABLE,args:[],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:20000});const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});return shelf;};
 try{
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(seed));let shelf=await launch();
  assert.equal((await app.windows()).length,1);assert((await shelf.evaluate(id=>window.thoughtline.openManage(id),id)).ok);
  let manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-full-text]');assert.equal(await manage.locator('[data-full-text]').inputValue(),body);
  assert((await manage.evaluate(id=>window.thoughtline.openEdit(id),id)).ok);
  const composer=(await app.windows()).find(p=>p.url().includes('view=composer'));await composer.waitForSelector('#idea-text');await composer.locator('#idea-text').fill('取消编辑必须保全');await composer.getByRole('button',{name:'取消编辑并关闭'}).click();
  assert.equal((await shelf.evaluate(()=>window.thoughtline.info())).snapshot.ideas[0].text,body);
  assert((await shelf.evaluate(id=>window.thoughtline.openEdit(id),id)).ok);await composer.waitForFunction(body=>document.querySelector('#idea-text')?.value===body,body);await composer.locator('#idea-text').fill(body+'\n打包后编辑');await composer.getByRole('button',{name:'保存修改',exact:true}).click();
  await waitForInfo(shelf,i=>!i.interactionLocked);
  await app.close();app=null;shelf=await launch();const info=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas[0].text,body+'\n打包后编辑');assert.equal(info.snapshot.draft.text,'重启草稿');
  assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=settings]');await manage.getByRole('button',{name:'关闭设置',exact:true}).click();
  const report={scope:'actual frozen Mac App, isolated seeded data; Electron DOM/IPC and native window objects; not physical IME/focus/hotkey or Windows acceptance',version:await app.evaluate(({app})=>app.getVersion()),startupWindows:1,fullText:true,editCancelPreserved:true,editPersistedAcrossRestart:true,newDraftNotOverwrittenByEdit:true,lazySettings:true,asarSha256:crypto.createHash('sha256').update(await fs.readFile(path.resolve(process.env.THOUGHTLINE_EXECUTABLE,'../../Resources/app.asar'))).digest('hex')};
  await fs.writeFile('acceptance/evidence/overnight-package-acceptance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
