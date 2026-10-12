const {launchOptions,openComposer,warmViews}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const { _electron }=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-round1-project-')),evidence=process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round1';
 let app,pids=[],shelf,composer;
 const close=async()=>{if(!app)return;pids.push(app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;};
 const launch=async()=>{app=await _electron.launch(await launchOptions(dir));({shelf}=await warmViews(app));composer=await openComposer(app,shelf);};
 const call=async(page,name,...args)=>{const r=await page.evaluate(({name,args})=>window.thoughtline[name](...args),{name,args});assert(r.ok,r.message);return r.value;};
 const clickMoving=async(name)=>{const box=await composer.getByRole('button',{name,exact:true}).boundingBox();assert(box);await composer.mouse.click(box.x+box.width/2,box.y+box.height/2);};
 const snap=async()=> (await shelf.evaluate(()=>window.thoughtline.info())).snapshot;
 const openPicker=async()=>{await composer.getByRole('button',{name:/^分组：/}).click();await composer.getByRole('button',{name:'项目甲',exact:true}).waitFor();};
 const longPress=async(p)=>{const button=composer.getByRole('button',{name:p,exact:true});await button.hover();await composer.mouse.down();await composer.waitForTimeout(620);await composer.mouse.up();await composer.getByRole('button',{name:p,exact:true}).waitFor({state:'detached'});};
 try{
  await launch();const text=[' a中文\n🧷\n ','b多行\n保留','c收起内容'];
  for(let i=0;i<3;i++){const s=await snap();await call(composer,'submit',{text:text[i],title:'念头'+i,project:i===2?'项目乙':'项目甲',agentId:'general'},s.revision);if(i<2)composer=await openComposer(app,shelf);}
  let s=await snap();const ids=s.ideas.map(i=>i.id),clipIds=s.clips.map(c=>c.id);await call(shelf,'clipChange',{kind:'merge',sourceId:clipIds[0],targetId:clipIds[1]},s.revision);s=await snap();await call(shelf,'setStatus',ids[2],'archived',s.revision);s=await snap();
  // Start a reversible split before deletion: undo must remain useful without reviving projects.
  await call(shelf,'clipChange',{kind:'split',id:clipIds[1],ideaId:ids[0]},s.revision);
  composer=await openComposer(app,shelf);await openPicker();await longPress('项目甲');await composer.screenshot({path:path.join(evidence,'project-editing.png')});
  assert.equal(await composer.getByRole('button',{name:'删除分组：未分组',exact:true}).count(),0);
  assert((await snap()).ideas.filter(i=>i.id!==ids[2]).every(i=>i.project==='项目甲'));assert.deepEqual((await snap()).ideas.map(i=>i.text),text);
  await composer.getByRole('textbox',{name:'搜索分组',exact:true}).press('Escape');await composer.getByRole('button',{name:/^分组：/}).click();assert.equal(await composer.getByRole('button',{name:'项目甲',exact:true}).count(),0);
  await longPress('项目乙');await composer.getByRole('textbox',{name:'搜索分组',exact:true}).press('Escape');s=await snap();assert.equal(s.ideas[2].project,'项目乙');
  await call(shelf,'clipChange',{kind:'undo'},s.revision);s=await snap();assert(s.ideas.filter(i=>i.id!==ids[2]).every(i=>i.project==='项目甲'));assert.equal(s.clips.length,1);assert.equal(s.clips[0].ideaIds.length,2);assert.deepEqual(new Set(s.inactiveProjects),new Set(['项目甲','项目乙']));
  await composer.screenshot({path:path.join(evidence,'project-after.png')});
  await call(composer,'close',{text:'',title:'',project:'',agentId:'general'});await close();await launch();s=await snap();assert(s.ideas.filter(i=>i.id!==ids[2]).every(i=>i.project==='项目甲'));assert.deepEqual(s.ideas.map(i=>i.text),text);assert.deepEqual(new Set(s.inactiveProjects),new Set(['项目甲','项目乙']));
  const report={platform:process.platform,scope:'isolated Electron pointer/IPC and restart; physical acceptance separate',dataIsolated:true,longPress:true,removedChoicesRetainHistory:true,systemProjectProtected:true,layoutUndoKeepsRemoval:true,contentAndIdsPreserved:true,restartKeepsRemovedChoices:true};
  await fs.writeFile(path.join(evidence,'project-native.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await close();await cleanupIdleFixture(dir,pids);await fs.writeFile(path.join(evidence,'project-cleanup.json'),JSON.stringify({pids:[...new Set(pids)],dataRemoved:true},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
