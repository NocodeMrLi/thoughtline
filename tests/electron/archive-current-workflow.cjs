const {launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');

(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-p3-archive-current-'));
 const evidence='acceptance/evidence/round1/p3-ui',attempt=process.env.THOUGHTLINE_ATTEMPT||'current';let app,pids=[];
 try{
  const ids=['i','j','k'],ideas=ids.map(id=>({id,text:`正文 ${id} 中文\n🧷`,title:`纸 ${id}`,project:'',agentId:'general',status:'hanging',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z'}));
  const initial={schemaVersion:2,revision:0,ideas,clips:[{id:'c',agentId:'general',ideaIds:ids,currentId:'i',position:.5}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}};
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(initial));
  app=await _electron.launch(await launchOptions(dir));const {shelf,manage}=await warmViews(app);
  assert.equal((await shelf.evaluate(()=>window.thoughtline.openManage('i'))).ok,true);await manage.waitForSelector('[data-reader-id=i]');
  assert.equal(await manage.getByRole('button',{name:'打开本夹标题列表'}).textContent(),'1/3');
  await manage.getByRole('button',{name:'收起当前念头'}).click();
  const archived=await waitForInfo(manage,info=>info.snapshot.ideas.find(i=>i.id==='i')?.status==='archived');
  assert.deepEqual(archived.snapshot.clips.find(c=>c.id==='c').ideaIds,['j','k']);
  assert.equal(await manage.locator('[data-reader-id]').getAttribute('data-reader-id'),'i');
  assert.equal(await manage.locator('[data-full-text]').inputValue(),ideas[0].text);
  assert.equal(await manage.getByRole('button',{name:'打开本夹标题列表'}).count(),0,'archived current paper cannot show old clip pager');
  assert.equal(await manage.getByRole('button',{name:'下一张便签'}).count(),0);
  await manage.keyboard.press('ArrowRight');
  assert.equal(await manage.locator('[data-reader-id]').getAttribute('data-reader-id'),'i','keyboard arrow cannot jump into old clip');
  await manage.getByRole('button',{name:'重新挂上'}).click();
  const restored=await waitForInfo(manage,info=>info.snapshot.ideas.find(i=>i.id==='i')?.status==='hanging');
  const owner=restored.snapshot.clips.find(c=>c.ideaIds.includes('i'));assert(owner,'restored paper has a real clip');
  assert.equal(await manage.locator('[data-reader-id]').getAttribute('data-reader-id'),'i');
  assert.equal(await manage.locator('[data-full-text]').inputValue(),ideas[0].text);
  const pager=manage.getByRole('button',{name:'打开本夹标题列表'});
  if(owner.ideaIds.length>1)assert.equal(await pager.textContent(),`${owner.ideaIds.indexOf('i')+1}/${owner.ideaIds.length}`);
  else assert.equal(await pager.count(),0);
  assert.equal((await manage.evaluate(()=>window.thoughtline.closeManage())).ok,true);
  assert.equal((await shelf.evaluate(()=>window.thoughtline.openManage('j'))).ok,true);await manage.waitForSelector('[data-reader-id=j]');
  await manage.getByRole('button',{name:'更多操作'}).click();await manage.getByRole('button',{name:/删除当前念头/}).click();
  await waitForInfo(manage,info=>info.snapshot.ideas.find(i=>i.id==='j')?.status==='deleted');
  assert.equal(await manage.locator('[data-reader-id]').getAttribute('data-reader-id'),'k','deleting current paper chooses the old clip neighbor');
  assert.equal(await manage.locator('[data-full-text]').inputValue(),ideas[2].text);
  const stored=JSON.parse(await fs.readFile(path.join(dir,'snapshot.json'),'utf8'));
  assert.deepEqual(stored.ideas.map(i=>({id:i.id,text:i.text,title:i.title,status:i.status})),ideas.map(i=>({id:i.id,text:i.text,title:i.title,status:i.id==='j'?'deleted':'hanging'})));
  console.log(JSON.stringify({scope:'isolated source Electron DOM/IPC, synthetic fixture',archiveKeepsCurrentIdentity:true,archiveHasNoStalePager:true,keyboardNoOldClipJump:true,rehangOwnerAndPager:true,deleteChoosesStableNeighbor:true,fullBodiesPreserved:true}));
 }finally{
  if(app){pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();}
  await cleanupIdleFixture(dir,pids);await fs.mkdir(evidence,{recursive:true});
  await fs.writeFile(path.join(evidence,`archive-current-cleanup-${attempt}.json`),JSON.stringify({dir,pids,allExited:pids.every(pid=>{try{process.kill(pid,0);return false}catch(e){return e.code==='ESRCH'}}),dataRemoved:!await fs.stat(dir).then(()=>true,()=>false)},null,2));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
