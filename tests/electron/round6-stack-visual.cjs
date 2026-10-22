// SPDX-License-Identifier: GPL-3.0-only
const {_electron}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {launchOptions,bounded}=require('./window-fixture.cjs');
const {managerPage}=require('./classification-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round6/r607/visual'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-r607-'));
 await fs.mkdir(root,{recursive:true});
 await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale:'zh-CN',theme:'light'}));
 const ideas=[],archivedClips=[];
 for(const count of [1,2,5,9]){
  const ids=[];for(let n=0;n<count;n++){const id=`n${count}-${n}`,day=count>1&&n===count-1?'2026-10-14':'2026-10-13';ids.push(id);ideas.push({id,title:`${count}张的念头 ${n+1}`,text:`完整正文 ${id}`,project:'工作',agentId:'general',status:'archived',createdAt:day+'T00:00:00.000Z',updatedAt:day+'T00:00:00.000Z',createdDay:day,creationTimeZone:'UTC'});}
  archivedClips.push({id:'stack'+count,agentId:'general',ideaIds:ids,currentId:ids[0],position:null});
 }
 const seed={schemaVersion:4,revision:0,ideas,clips:[],archivedClips,agents:[{id:'general',name:'通用',color:'#A0A3AA'}],projects:['工作'],draft:null,settings:{writeHotkey:'Control+Alt+Shift+F19',reducedMotion:true}};
 await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(seed));
 let app;const receipt={profile:dir,platform:process.platform,packaged:!!process.env.THOUGHTLINE_EXECUTABLE,pids:[],checks:[],matrices:[]};
 try{
  app=process.env.THOUGHTLINE_EXECUTABLE?await _electron.launch({executablePath:path.resolve(process.env.THOUGHTLINE_EXECUTABLE),args:[],env:require('./packaged-launch.cjs').sanitizedPackagedEnv(process.env,dir)}):await _electron.launch(await launchOptions(dir,{stationaryTopCursor:true}));
  receipt.pids.push(app.process().pid);const shelf=await app.firstWindow();await shelf.locator('[data-view=shelf]').waitFor({state:'attached'});
  assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);const page=await managerPage(app);
  assert.equal((await page.locator('[data-day="2026-10-13"] .day-count').textContent()).trim(),'14');assert.equal((await page.locator('[data-day="2026-10-14"] .day-count').textContent()).trim(),'3');
  await page.locator('[data-day="2026-10-13"]').click();assert.equal(await page.locator('.calendar-paper').count(),4);
  let sequence=100;
  for(const locale of ['zh-CN','en'])for(const theme of ['light','dark'])for(const width of [740,350]){
   assert((await page.evaluate(({locale,theme,sequence})=>window.thoughtline.setPreferences({locale,theme},sequence),{locale,theme,sequence:sequence++})).ok);
   await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').setSize(width,540),width);
   await page.waitForFunction(({locale,theme,width})=>document.documentElement.lang===locale&&document.documentElement.dataset.theme===theme&&innerWidth===width,{locale,theme,width});
   const facts=await page.locator('.calendar-paper').evaluateAll(rows=>rows.map(e=>{
    const shadow=getComputedStyle(e).boxShadow,parts=[];let level=0,start=0;for(let i=0;i<shadow.length;i++){if(shadow[i]==='(')level++;if(shadow[i]===')')level--;if(shadow[i]===','&&!level){parts.push(shadow.slice(start,i));start=i+1;}}parts.push(shadow.slice(start));
    const offsets=parts.map(p=>(p.match(/-?[\d.]+px/g)||[]).map(parseFloat)).filter(v=>v[0]>0&&v[1]>0&&v[2]===0).map(v=>[v[0],v[1]]);
    return {id:e.dataset.ideaId,stack:e.classList.contains('calendar-stack'),count:e.querySelector('.calendar-stack-count')?.textContent??null,title:e.querySelector('.calendar-stack-count')?.title??null,backingOffsets:[...new Set(offsets.map(v=>v.join('/')))],shadow};
   }));
   const single=facts.find(f=>f.id==='n1-0');assert(!single.stack&&single.count===null&&single.backingOffsets.length===0,'Single paper must have no backing card');
   for(const count of [2,5,9]){const f=facts.find(f=>f.id===`n${count}-0`);assert(f.stack);assert.equal(f.count,locale==='zh-CN'?`${count}张`:`${count} papers`);assert.equal(f.backingOffsets.length,1,'Every multi-paper card must expose one common backing plane');const offset=f.backingOffsets[0].split('/').map(Number);assert(offset.every(n=>n>0&&n<=4),'Backing edge must stay thin');assert.equal(f.title,locale==='zh-CN'?`当日${count-1}张/共${count}张`:`This day ${count-1}/total ${count}`);}
   assert.equal(new Set(facts.filter(f=>f.stack).map(f=>f.shadow)).size,1,'Backing decoration must not grow with real count');
   receipt.matrices.push({locale,theme,width,facts});
   if(locale==='zh-CN'&&(width===740||theme==='dark'))await page.screenshot({path:path.join(root,`stack-${process.platform}-${theme}-${width}.png`)});
  }
  assert((await page.evaluate(()=>window.thoughtline.setPreferences({locale:'zh-CN',theme:'light'},300))).ok);await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');
  await page.locator('[data-idea-id="n5-0"]').click();assert.equal(await page.locator('[data-reader-id="n5-0"]').count(),1);assert.equal((await page.locator('.reader-pager-row').textContent()).includes('1/5'),true);
  await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.calendar-paper-groups').waitFor();assert.equal(await page.locator('.calendar-paper').count(),4);
  const final=(await shelf.evaluate(()=>window.thoughtline.info())).snapshot;assert.deepEqual(final.ideas,seed.ideas);assert.deepEqual(final.archivedClips,seed.archivedClips);
  receipt.checks.push('single/2/5/9 share one thin backing plane; eight locale/theme/width renderings','real count and cross-day tooltip preserved; month counts14/3','detail1/5 and return to4cards; all idea data and archived stack membership unchanged');
 }catch(e){receipt.failure=e.stack;throw e;}finally{
  if(app){receipt.pids.push(...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)).catch(()=>[]));await bounded(app.close(),'R607 normal quit',10000).then(()=>receipt.normalQuit=true).catch(e=>receipt.quitFailure=String(e));}
  await cleanupIdleFixture(dir,receipt.pids);receipt.cleaned=true;
  await fs.writeFile(path.join(root,`stack-${process.platform}-${receipt.packaged?'package':'source'}.json`),JSON.stringify(receipt,null,2)+'\n');if(receipt.quitFailure)throw Error(receipt.quitFailure);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
