// Disposable GitHub Windows runner only. Never run this against a person's profile.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');
const {spawn}=require('node:child_process');
const {createHash}=require('node:crypto');
const pkg=require('../package.json');
const data=path.join(process.env.APPDATA||'', 'Thoughtline');
const marker='thoughtline-disposable-windows-preflight';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture={schemaVersion:2,revision:7,ideas:[{id:'win-preflight',text:'合成预检正文\n第二行 🙂',title:'合成名称',project:'安装器保留',agentId:'general',status:'hanging',createdAt:'2026-10-09T00:00:00.000Z',updatedAt:'2026-10-09T00:00:00.000Z'}],clips:[{id:'clip:win-preflight',agentId:'general',ideaIds:['win-preflight'],currentId:'win-preflight',position:0.4}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:{text:'合成未完成草稿',title:'草稿名称',project:'草稿项目',agentId:'general'},settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}};
const expected={...fixture,schemaVersion:4,ideas:fixture.ideas.map(idea=>({...idea,createdDay:'2026-10-09',creationTimeZone:'legacy-offset'}))};
const seedBytes=Buffer.from(JSON.stringify(fixture));
const locationBytes=Buffer.from(JSON.stringify({schemaVersion:1,path:data}));
async function main(){
 assert.equal(process.platform,'win32');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_OS,'Windows');assert(process.env.RUNNER_TEMP&&process.env.APPDATA);
 const mode=process.argv[2];
 if(mode==='seed'){
  try{await fs.access(data);throw Error('Refusing to touch an existing Thoughtline profile');}catch(error){if(error.code!=='ENOENT')throw error;}
  await fs.mkdir(data);await fs.writeFile(path.join(data,'preflight-marker.txt'),marker);
  await fs.writeFile(path.join(data,'snapshot.json'),JSON.stringify(fixture));
  await fs.writeFile(path.join(data,'snapshot.bak.json'),JSON.stringify(fixture));await fs.writeFile(path.join(data,'data-location.json'),locationBytes);return;
 }
 assert.equal(await fs.readFile(path.join(data,'preflight-marker.txt'),'utf8'),marker);
 const executable=path.resolve(process.argv[3]);
 assert(executable.startsWith(path.resolve(process.env.RUNNER_TEMP)+path.sep));
 const { _electron }=require('playwright');let app;
 const result={scope:'Hosted Windows runner packaged app; synthetic fixture, no physical IME/mouse/desktop acceptance',version:pkg.version,headSha:process.env.GITHUB_SHA,checks:{}};
 try{
  const env={...process.env};delete env.THOUGHTLINE_DATA_DIR;delete env.ELECTRON_RUN_AS_NODE;delete env.ELECTRON_RENDERER_URL;
  app=await _electron.launch({executablePath:executable,args:[],env,timeout:30000});
  const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  const runtime=await app.evaluate(({app,BrowserWindow})=>({version:app.getVersion(),dataDir:app.getPath('userData'),arch:process.arch,platform:process.platform,electron:process.versions.electron,shelf:BrowserWindow.getAllWindows().map(w=>({title:w.getTitle(),visible:w.isVisible(),focusable:w.isFocusable()}))}));
  assert.equal(runtime.version,pkg.version);assert.equal(runtime.dataDir,data);assert.equal(runtime.arch,'x64');assert.equal(runtime.platform,'win32');
  assert(runtime.shelf.some(w=>w.title==='Thoughtline Shelf'&&!w.visible&&!w.focusable));result.runtime=runtime;
  const initial=await shelf.evaluate(()=>window.thoughtline.info());assert.deepEqual(initial.snapshot,expected);assert.deepEqual(await fs.readFile(path.join(data,'snapshot.json')),seedBytes);assert.deepEqual(await fs.readFile(path.join(data,'data-location.json')),locationBytes);result.checks.existingSchema2Read=true;
  // Real second process against the same default profile must exit, while this process stays alive.
  const second=spawn(executable,[],{env,stdio:'ignore'});
  const exitCode=await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{second.kill();reject(Error('Second process failed to exit'));},10000);
   second.once('error',error=>{clearTimeout(timeout);reject(error);});second.once('exit',code=>{clearTimeout(timeout);resolve(code);});
  });assert.equal(exitCode,0);assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,expected);assert.deepEqual(await fs.readFile(path.join(data,'snapshot.json')),seedBytes);result.checks.singleInstance=true;
  const opened=await shelf.evaluate(()=>window.thoughtline.openSettings());assert(opened.ok);
  let manage;for(let i=0;i<100&&!manage;i++){manage=(await app.windows()).find(p=>p.url().includes('view=manage'));if(!manage)await new Promise(r=>setTimeout(r,50));}
  assert(manage);await manage.waitForSelector('[data-mode=settings]');
  const saved=await manage.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.saveSettings({...i.snapshot.settings,reducedMotion:true},i.snapshot.revision);});assert(saved.ok);
  assert.equal(saved.value.revision,fixture.revision+1);assert.deepEqual(saved.value.ideas,expected.ideas);assert.deepEqual(saved.value.clips,fixture.clips);assert.deepEqual(saved.value.draft,fixture.draft);
  await manage.evaluate(()=>window.thoughtline.closeManage());await app.close();app=null;
  const persisted=JSON.parse(await fs.readFile(path.join(data,'snapshot.json'),'utf8'));assert.deepEqual(persisted,saved.value);result.checks.packagedCommitAndNormalQuit=true;
  assert.deepEqual(await fs.readFile(path.join(data,'snapshot.schema2.backup.json')),seedBytes);
  app=await _electron.launch({executablePath:executable,args:[],env,timeout:30000});
  const restarted=await app.firstWindow();await restarted.waitForURL(/view=shelf/);await restarted.waitForSelector('[data-view=shelf]',{state:'attached'});assert.deepEqual((await restarted.evaluate(()=>window.thoughtline.info())).snapshot,saved.value);
  await app.close();app=null;assert.deepEqual(await fs.readFile(path.join(data,'snapshot.schema2.backup.json')),seedBytes);assert.deepEqual(await fs.readFile(path.join(data,'data-location.json')),locationBytes);result.checks.exactSchema2BackupRestart=true;result.checks.locationConfigPreserved=true;
  const asar=require('@electron/asar');const packed=path.join(path.dirname(executable),'resources','app.asar');
  const bundledPackage=JSON.parse(asar.extractFile(packed,'package.json'));assert.equal(bundledPackage.version,pkg.version);
  result.packagedHashes={};
  const manifest=JSON.parse(await fs.readFile('dist/build-manifest.json','utf8'));
  const files=[...Object.keys(manifest.hashes).filter(file=>file.startsWith('out/')),'assets/app-icon.png','assets/app-icon.ico','assets/tray-win.ico'];
  for(const file of files){
   // asar v3 resolves archive members with path.sep; POSIX member paths fail on Windows.
   const bytes=asar.extractFile(packed,path.join(...file.split('/')));assert.equal(hash(bytes),hash(await fs.readFile(file)));result.packagedHashes[file]=hash(bytes);
  }result.checks.packagedOutputsMatchBuild=true;
  assert((await fs.readFile('out/main/index.js','utf8')).includes('tray-win.ico'));result.checks.compiledWindowsTrayUsesApprovedIco=true;
  result.passed=true;
 }finally{
  if(app)await app.close();await fs.writeFile('dist/windows-installed-preflight.json',JSON.stringify(result,null,2)+'\n');
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
