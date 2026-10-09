const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const packageInfo=require('../../package.json');
const {_electron}=require('playwright'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs'),{waitForInfo}=require('./window-fixture.cjs');
(async()=>{
 if(!process.env.THOUGHTLINE_EXECUTABLE)throw Error('Set THOUGHTLINE_EXECUTABLE to the frozen test App executable.');
 const executable=path.resolve(process.env.THOUGHTLINE_EXECUTABLE),evidenceRoot=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence');
 await fs.mkdir(evidenceRoot,{recursive:true});
 const evidence=await fs.mkdtemp(path.join(evidenceRoot,'package-attempt-'));
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-package-acceptance-')),profile=path.join(root,'profile'),backupParent=path.join(root,'backup-parent'),restored=path.join(root,'restored');
 await Promise.all([fs.mkdir(profile),fs.mkdir(backupParent),fs.mkdir(restored)]);
 const body='  原始中文正文\n第二行😀\n末行  ',edited=body+'\n打包后原地编辑  ',id='package-test-idea',timestamp='2026-10-09T00:00:00.000Z';
 const seed={schemaVersion:2,revision:0,clips:[{id:'package-test-clip',agentId:'general',ideaIds:[id],currentId:id,position:null}],ideas:[{id,text:body,title:'独立包验收',project:'来源保护',agentId:'general',status:'hanging',createdAt:timestamp,updatedAt:timestamp}],agents:[{id:'general',name:'通用',color:'#A4A5B0'}],draft:{text:'重启草稿',title:'草稿名称',project:'',agentId:'general'},settings:{writeHotkey:'Control+Alt+F18',reducedMotion:false}};
 let app,normalClose=false,completedChecks=false;const pids=[],result={passed:false,evidenceDirectory:evidence,attempt:process.env.THOUGHTLINE_ATTEMPT||null,scope:'Actual frozen Mac App with isolated synthetic data; DOM/IPC and packaged asar, not physical input or Windows acceptance',host:{platform:process.platform,arch:process.arch,release:os.release()},checks:{}};
 const launch=async data=>{app=await _electron.launch({executablePath:executable,args:[],env:{...process.env,THOUGHTLINE_DATA_DIR:data,ELECTRON_RENDERER_URL:'',ELECTRON_RUN_AS_NODE:'',NODE_OPTIONS:''},timeout:30000});pids.push(app.process().pid);const shelf=await app.firstWindow();await shelf.waitForURL(/view=shelf/);await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});return shelf;};
 const close=async()=>{if(app){pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;normalClose=true;}};
 try{
  await fs.writeFile(path.join(profile,'snapshot.json'),JSON.stringify(seed));
  let shelf=await launch(profile),initial=await shelf.evaluate(()=>window.thoughtline.info());
  assert.equal((await app.windows()).length,1);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),false);
  assert.equal(initial.snapshot.schemaVersion,3);assert.equal(initial.snapshot.ideas[0].text,body);assert.equal(initial.snapshot.ideas[0].id,id);assert.equal(initial.snapshot.ideas[0].createdAt,timestamp);assert.deepEqual(initial.snapshot.draft,seed.draft);result.checks.schema2ReadAs3WithIdentityAndDraft=true;
  assert((await shelf.evaluate(ideaId=>window.thoughtline.openManage(ideaId),id)).ok);let manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=detail]');assert.equal(await manage.locator('[data-full-text]').inputValue(),body);
  await manage.getByRole('button',{name:'编辑',exact:true}).click();await manage.waitForSelector('[data-inline-editor]');assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.getTitle()==='Thoughtline Composer'&&w.isVisible())),false);
  await manage.getByRole('textbox',{name:'编辑正文',exact:true}).fill(edited);await manage.getByRole('textbox',{name:'编辑标题',exact:true}).fill('打包后新标题');await waitForInfo(manage,i=>i.snapshot.ideas[0].text===edited&&i.snapshot.ideas[0].title==='打包后新标题');
  await manage.screenshot({path:path.join(evidence,'package-detail-inline.png')});const finalInput=edited+'\nclose flush';await manage.getByRole('textbox',{name:'编辑正文',exact:true}).fill(finalInput);
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);assert.equal(JSON.parse(await fs.readFile(path.join(profile,'snapshot.json'),'utf8')).ideas[0].text,finalInput);result.checks.detailInlineAutosaveAndCloseFlush=true;await close();
  shelf=await launch(profile);initial=await shelf.evaluate(()=>window.thoughtline.info());const persisted=initial.snapshot.ideas[0];assert.equal(persisted.id,id);assert.equal(persisted.text,finalInput);assert.equal(persisted.createdAt,timestamp);assert.equal(persisted.title,'打包后新标题');assert.equal(persisted.project,'来源保护');assert.deepEqual(initial.snapshot.draft,seed.draft);result.checks.restartPreservesTextIdMetadataAndNewDraft=true;
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);manage=(await app.windows()).find(p=>p.url().includes('view=manage'));await manage.waitForSelector('[data-mode=calendar]');await manage.getByRole('textbox',{name:'搜索念头'}).fill('close flush');assert.equal(await manage.locator('[data-idea-id="'+id+'"]').count(),1);await manage.locator('[data-idea-id="'+id+'"]').click();assert.equal(await manage.locator('[data-full-text]').inputValue(),finalInput);
  await manage.getByRole('button',{name:'更多操作',exact:true}).click();await manage.getByRole('button',{name:'删除当前念头',exact:false}).click();await waitForInfo(manage,i=>i.snapshot.ideas[0].status==='deleted');await manage.getByRole('textbox',{name:'搜索念头'}).fill('');await manage.getByRole('button',{name:'日历更多选项',exact:true}).click();await manage.getByRole('button',{name:'最近删除',exact:true}).click();assert.equal(await manage.locator('[data-idea-id="'+id+'"]').count(),1);await manage.locator('[data-idea-id="'+id+'"]').click();await manage.getByRole('button',{name:'恢复念头',exact:true}).click();await waitForInfo(manage,i=>i.snapshot.ideas[0].status==='hanging');result.checks.calendarSearchSoftDeleteRestore=true;
  await manage.screenshot({path:path.join(evidence,'package-calendar.png')});assert((await manage.evaluate(()=>window.thoughtline.openSettings())).ok);await manage.waitForSelector('[data-mode=settings]');await app.evaluate(({dialog},target)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[target]});},backupParent);
  const exported=await manage.evaluate(()=>window.thoughtline.exportBackup());assert(exported.ok,exported.message);const expected=(await manage.evaluate(()=>window.thoughtline.info())).snapshot,manifest=JSON.parse(await fs.readFile(path.join(exported.value.directory,'manifest.json'),'utf8'));assert.equal(manifest.appVersion,packageInfo.version);assert.equal(manifest.revision,expected.revision);
  for(const item of manifest.files){assert(/^(snapshot(?:\.bak|\.schema[12]\.backup)?\.json|snapshot\.corrupt-[a-f0-9-]+\.json)$/.test(item.name));const bytes=await fs.readFile(path.join(exported.value.directory,item.name));assert.equal(bytes.length,item.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);await fs.copyFile(path.join(exported.value.directory,item.name),path.join(restored,item.name),require('node:fs').constants.COPYFILE_EXCL);}result.checks.independentBackupManifestAndBytes=true;
  assert((await manage.evaluate(()=>window.thoughtline.closeManage())).ok);await close();for(let n=0;n<2;n++){shelf=await launch(restored);assert.deepEqual((await shelf.evaluate(()=>window.thoughtline.info())).snapshot,expected);await close();}result.checks.actualBackupRestoreTwoRestarts=true;
  result.version=packageInfo.version;result.asarSha256=crypto.createHash('sha256').update(await fs.readFile(path.resolve(executable,'../../Resources/app.asar'))).digest('hex');completedChecks=true;
 }catch(error){result.error=String(error?.stack||error);throw error;}finally{
  try{
   await close();await cleanupIdleFixture(root,pids);const absent=await fs.stat(root).then(()=>false,e=>{if(e.code==='ENOENT')return true;throw e;});assert(absent);
   result.cleanup={directory:root,ownedPids:[...new Set(pids)],normalClose,allExited:true,fakeDataRemoved:absent};result.passed=completedChecks&&normalClose;
  }catch(error){result.cleanup={directory:root,ownedPids:[...new Set(pids)],allExited:false,fakeDataRemoved:false,error:String(error?.stack||error)};throw error;}
  finally{
   await fs.writeFile(path.join(evidence,'package-acceptance.json'),JSON.stringify(result,null,2)+'\n');
   await fs.writeFile(path.join(evidence,'package-acceptance-cleanup.json'),JSON.stringify(result.cleanup,null,2)+'\n');
  }
 }
 assert(result.passed);console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
