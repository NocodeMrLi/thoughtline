const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');const {_electron}=require('playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-groups-'));let app;
 const launch=async()=>_electron.launch({executablePath:process.env.THOUGHTLINE_EXECUTABLE||require('electron'),args:process.env.THOUGHTLINE_EXECUTABLE?[]:[path.resolve('out/main/index.js')],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:15000});
 const ready=async()=>{await app.firstWindow();while((await app.windows()).length<3)await app.waitForEvent('window',{timeout:5000});const pages=await app.windows();for(const p of pages)await p.waitForURL(/view=(shelf|composer|manage)/,{waitUntil:'domcontentloaded'});const by=name=>pages.find(p=>p.url().includes('view='+name));const shelf=by('shelf');await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});return {shelf,composer:by('composer'),manage:by('manage')};};
 const info=p=>p.evaluate(()=>window.thoughtline.info());
 const result=async(p,method,...args)=>{const r=await p.evaluate(({method,args})=>window.thoughtline[method](...args),{method,args});assert(r.ok,r.message);return r.value;};
 try{
  app=await launch();let {shelf,composer,manage}=await ready();const texts=[' a\nCodex 第一张原文\n',' b\nCodex 第二张原文\n',' c\nClaude 原文\n'];
  for(let i=0;i<3;i++){const s=(await info(composer)).snapshot;await result(composer,'submit',{text:texts[i],title:'标签'+i,project:'项目',agentId:i<2?'codex':'claude'},s.revision);}
  await shelf.waitForFunction(()=>!document.querySelector('[data-view=shelf]').hasAttribute('data-progress')||Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
  let s=(await info(shelf)).snapshot;const ids=s.ideas.map(i=>i.id),[a,b,c]=s.clips.map(c=>c.id);const weight=s.ideas.length;
  await result(shelf,'dragLock',true);
  const cross=await shelf.evaluate(async({a,c,revision})=>window.thoughtline.clipChange({kind:'merge',sourceId:a,targetId:c},revision),{a,c,revision:s.revision});assert(!cross.ok);
  await result(shelf,'dragLock',false);
  const pegA=await shelf.locator('[data-clip-id="'+a+'"] .peg-button').boundingBox(),pegB=await shelf.locator('[data-clip-id="'+b+'"] .peg-button').boundingBox();assert(pegA&&pegB);
  await shelf.mouse.move(pegA.x+12,pegA.y+20);await shelf.mouse.down();await shelf.mouse.move(pegB.x+12,pegB.y+20,{steps:4});await shelf.mouse.up();
  await shelf.getByText('未达到合夹停留时间，位置保持。',{exact:true}).waitFor();assert.equal((await info(shelf)).snapshot.clips.length,3);
  await shelf.mouse.move(pegA.x+12,pegA.y+20);await shelf.mouse.down();await shelf.mouse.move(pegB.x+12,pegB.y+20,{steps:8});
  await shelf.getByText('松开合并',{exact:true}).waitFor({timeout:4000});await shelf.mouse.up();await shelf.locator('[data-clip-id="'+a+'"]').waitFor({state:'detached',timeout:5000}).catch(async e=>{console.error(JSON.stringify({info:await info(shelf),message:await shelf.locator('.shelf-error').allTextContents()}));throw e;});
  s=(await info(shelf)).snapshot;assert.equal(s.clips.length,2);assert.equal(s.ideas.length,weight);assert.deepEqual(s.clips[0].ideaIds,[ids[1],ids[0]]);
  await result(shelf,'dragLock',false);await shelf.waitForSelector('[data-clip-id="'+b+'"] .page-number');
  const card=shelf.locator('[data-clip-id="'+b+'"]');assert.equal(await card.locator('.idea-card').evaluate(el=>el.getBoundingClientRect().width),160);assert.equal(await card.locator('.idea-card').evaluate(el=>el.getBoundingClientRect().height),112);
  // Keep the shelf present via the application's explicit operation lock. UI protocol events are not physical device acceptance.
  await result(shelf,'dragLock',true);await shelf.mouse.move(1200,310);assert.equal(await card.locator('.page-arrow').first().evaluate(el=>getComputedStyle(el).visibility),'hidden');
  await card.locator('.idea-card').hover({force:true});assert.equal(await card.locator('.page-arrow').first().evaluate(el=>getComputedStyle(el).visibility),'visible');
  await card.getByRole('button',{name:'上一张便签',exact:true}).click({force:true});await shelf.waitForFunction(id=>document.querySelector('[data-clip-id="'+id+'"] .page-number')?.textContent==='1/2',b);
  await card.locator('.card-copy').click({force:true});assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),texts[1]);
  await card.getByRole('button',{name:'下一张便签',exact:true}).click({force:true});await shelf.waitForFunction(id=>document.querySelector('[data-clip-id="'+id+'"] .page-number')?.textContent==='2/2',b);
  // Arrow operation does not overwrite our known clipboard value.
  assert.equal(await app.evaluate(({clipboard})=>clipboard.readText()),texts[1]);
  await result(shelf,'dragLock',false);await result(shelf,'openManage',ids[0],true);await manage.waitForSelector('[data-mode=detail]');
  const bounds=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').getBounds());assert.equal(bounds.width,380);assert.equal(bounds.height,360);
  await manage.getByRole('button',{name:'标签1',exact:true}).click();assert.equal(await manage.locator('[data-full-text]').inputValue(),texts[1]);
  s=(await info(manage)).snapshot;await result(manage,'clipChange',{kind:'split',id:b,ideaId:ids[1]},s.revision);s=(await info(manage)).snapshot;assert.equal(s.clips.length,3);assert.equal(s.ideas[1].text,texts[1]);
  await result(manage,'clipChange',{kind:'undo'},s.revision);s=(await info(manage)).snapshot;assert.equal(s.clips.length,2);assert.deepEqual(s.clips[0].ideaIds,[ids[1],ids[0]]);
  await app.close();app=null;app=await launch();({shelf}=await ready());s=(await info(shelf)).snapshot;assert.equal(s.schemaVersion,2);assert.deepEqual(s.clips[0].ideaIds,[ids[1],ids[0]]);assert.equal(s.ideas[0].text,texts[0]);
  const report={platform:process.platform,scope:'Electron应用IPC/DOM/协议鼠标循环；不是系统物理拖动、穿透或Windows实机验收',compactSize:[160,112],detailSize:[380,360],crossAgentRejected:true,mergePreservesNotes:true,dragHoldMergeProtocol:true,earlyDropNoMerge:true,hoverArrows:true,pageSwitchNoCopy:true,copyCurrentFullText:true,titleJump:true,splitUndo:true,restartPreserved:true};
  await fs.writeFile('acceptance/evidence/group-native.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{try{if(app)await app.close();}finally{await fs.rm(dir,{recursive:true,force:true});}}
})().catch(e=>{console.error(e);process.exitCode=1;});
