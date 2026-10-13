const {chooseInlineTag}=require('./classification-fixture.cjs');
// Catches missing natural-rope motifs and fused title/body fields in actual Electron pages.
const {launchOptions,waitForInfo}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round4/visual');await fs.mkdir(root,{recursive:true});
 const out=await fs.mkdtemp(path.join(root,(process.env.THOUGHTLINE_ATTEMPT||'visual')+'-')),profile=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-round4-visual-'));
 let app,shelf,page,sequence=1000;const receipt={version:require('../../package.json').version,platform:process.platform,packaged:!!process.env.THOUGHTLINE_EXECUTABLE,checks:[],failures:[],measurements:[],pids:[],profile,scope:'Owned actual Electron windows; controlled geometry, no physical DPI/IME or user acceptance'};
 const check=(label,action)=>{try{action();receipt.checks.push(label);}catch(e){receipt.failures.push({label,error:e.message});}};
 const info=()=>shelf.evaluate(()=>window.thoughtline.info());
 const button=name=>page.getByRole('button',{name,exact:true});
 const settings=async()=>{assert((await shelf.evaluate(()=>window.thoughtline.openSettings())).ok);page=(await app.windows()).find(p=>p.url().includes('view=manage'));await page.waitForSelector('[data-mode=settings]');};
 const appearance=async(color,theme)=>{await settings();const i=await info();assert((await page.evaluate(([settings,revision])=>window.thoughtline.saveSettings(settings,revision),[{...i.snapshot.settings,paper:{color,pattern:'ruled'}},i.snapshot.revision])).ok);assert((await page.evaluate(([theme,request])=>window.thoughtline.setPreferences({locale:'zh-CN',theme},request),[theme,sequence++])).ok);};
 const open=async(entry)=>{assert((await shelf.evaluate(()=>window.thoughtline.openManage('one'))).ok);await page.locator('[data-reader-id=one]').waitFor();if(entry==='calendar'){await button('Thoughtline 日历').click();await page.locator('.date-cell[data-day="2026-10-12"]').click();await page.locator('.calendar-paper[data-idea-id=one]').click();await page.locator('[data-reader-id=one]').waitFor();}};
 const geometry=async(editing)=>page.evaluate(editing=>{
  const host=document.querySelector('.reader-paper'),title=host.querySelector(editing?'.inline-editor>input':'.reader-paper-heading'),body=host.querySelector(editing?'.inline-editor>textarea':'[data-full-text]');
  const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,border:parseFloat(s.borderTopWidth),borderColor:s.borderTopColor,background:s.backgroundColor,shadow:s.boxShadow,outline:s.outlineWidth};};
  return {title:box(title),body:box(body),gap:body.getBoundingClientRect().top-title.getBoundingClientRect().bottom,host:box(host),viewport:{width:innerWidth,height:innerHeight}};
 },editing);
 const rgb=hex=>'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')';
 const colors={warm:['#F5EFDF','#383831'],ivory:['#F3F1E8','#363837'],apricot:['#F2E8DB','#3C3531'],sage:['#E8ECE1','#333B34'],blue:['#E7EBEF','#333940']};
 try{
  const at='2026-10-12T00:00:00.000Z';await fs.writeFile(path.join(profile,'snapshot.json'),JSON.stringify({schemaVersion:3,revision:0,ideas:['one','two'].map(id=>({id,title:'安全区 '+id,text:'完整正文 '+id+'\n第二行中文 gyp',project:'',agentId:'claude',status:'hanging',createdAt:at,updatedAt:at})),clips:[{id:'stack',agentId:'claude',ideaIds:['one','two'],currentId:'one',position:null}],agents:[{id:'general',name:'通用',color:'#A0A3AA'},{id:'claude',name:'Claude',color:'#B76432'},{id:'codex',name:'Codex',color:'#3F79D4'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true,shelfCapacity:6,paper:{color:'blue',pattern:'ruled'}}}));
  if(process.env.THOUGHTLINE_EXECUTABLE){const {sanitizedPackagedEnv,observeLaunch}=require('./packaged-launch.cjs'),exe=path.resolve(process.env.THOUGHTLINE_EXECUTABLE),restore=observeLaunch(exe,out);try{app=await _electron.launch({executablePath:exe,env:sanitizedPackagedEnv(process.env,profile),timeout:30000});}finally{restore();}}else app=await _electron.launch(await launchOptions(profile,{stationaryTopCursor:true}));
  assert.equal(await app.evaluate(({app})=>app.getPath('userData')),profile);if(receipt.packaged)assert.equal(await app.evaluate(({app})=>app.getVersion()),receipt.version);shelf=await app.firstWindow();await shelf.waitForSelector('[data-view=shelf]',{state:'attached'});
  await appearance('blue','light');await button('更换挂绳').click();await button('挂绳样式').click();await page.screenshot({path:path.join(out,'rope-options.png')});
  const samples=await page.locator('.rope-sample').evaluateAll(es=>es.map(e=>({paths:[...e.querySelectorAll('path')].map(p=>({d:p.getAttribute('d'),class:p.getAttribute('class'),fill:getComputedStyle(p).fill,stroke:getComputedStyle(p).stroke,width:parseFloat(getComputedStyle(p).strokeWidth)})),box:e.getBoundingClientRect().toJSON()})));
  receipt.ropeSamples=samples;assert.equal(samples.length,3);check('vine-sample-shows-filled-leaves-and-natural-stem',()=>{assert(samples[2].paths.some(p=>p.fill!=='none'),'vine option must include real filled leaves');assert(samples[2].paths.some(p=>p.class==='vine-branch'&&p.stroke!=='none'),'vine branches must be visibly styled');});
  check('cotton-sample-shows-two-visible-braid-tones',()=>{const dark=samples[1].paths.find(p=>p.class==='cotton-dark'),light=samples[1].paths.find(p=>p.class==='cotton-light');assert(dark&&light);assert.notEqual(dark.stroke,'none');assert.notEqual(light.stroke,'none');assert.notEqual(dark.stroke,light.stroke);assert(dark.width<1&&light.width<1,'braid strokes must use their real fine texture');});
  await page.keyboard.press('Escape');await button('取消').click();
  for(const theme of ['light','dark'])for(const color of Object.keys(colors))for(const entry of ['detail','calendar']){
   await appearance(color,theme);await open(entry);
   for(const editing of [false,true]){
    if(editing){await button('编辑').click();await page.locator('[data-inline-editor]').waitFor();}
    const label=`${entry}-${theme}-${color}-${editing?'edit':'read'}`,g=await geometry(editing);receipt.measurements.push({label,...g});
    check(label+'-separate-bordered-paper-fields-and-safe-gap',()=>{assert(g.gap>=11.9,'title/body must have at least 12 DIP clear separation');assert(g.title.border>=1&&g.body.border>=1,'both title and body must have independent visible borders');assert.equal(g.title.borderColor,g.body.borderColor);assert.equal(g.title.background,rgb(colors[color][theme==='dark'?1:0]));assert.equal(g.body.background,g.title.background);assert.equal(g.host.background,'rgba(0, 0, 0, 0)','safe gap must reveal surrounding material');assert(g.body.width>0&&g.body.height>0);});
    if(color==='blue')await page.screenshot({path:path.join(out,label+'.png')});
    if(editing){await page.locator('[data-inline-editor]>textarea').focus();const focus=await geometry(true);check(label+'-focus-keeps-clip-color-with-visible-ring',()=>{assert.equal(focus.body.borderColor,g.body.borderColor);assert(focus.body.shadow!=='none'||parseFloat(focus.body.outline)>0,'focused body needs a visible same-color ring');});await button('完成编辑').first().click();await page.locator('[data-inline-editor]').waitFor({state:'detached'});}
   }
  }
  for(const theme of ['light','dark'])for(const entry of ['detail','calendar']){
   await appearance('blue',theme);await open(entry);await button('编辑').click();await page.locator('[data-inline-editor]').waitFor();const before=await geometry(true);
   await chooseInlineTag(page,'codex');
   await page.waitForFunction(()=>document.querySelector('.reader-paper').getAttribute('data-reader-agent-color')==='#3F79D4');const changed=await geometry(true);
   assert.notEqual(changed.title.borderColor,before.title.borderColor,'draft tag change updates the visible title border');assert.equal(changed.title.borderColor,changed.body.borderColor);assert.equal(changed.title.background,before.title.background);
   await chooseInlineTag(page,'claude');await button('完成编辑').first().click();await page.locator('[data-inline-editor]').waitFor({state:'detached'});
   assert.equal((await geometry(false)).title.borderColor,before.title.borderColor);receipt.checks.push(entry+'-'+theme+'-draft-tag-updates-both-borders-with-paper-retained');
  }
  for(const [entry,w,h] of [['detail',380,360],['calendar',350,360],['calendar',420,500],['calendar',740,540]]){
   await appearance('blue','light');await open(entry);await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage').setContentSize(w,h),[w,h]);
   await button('编辑').click();await page.locator('[data-inline-editor]').waitFor();
   const g=await geometry(true),label=`${entry}-${w}-${h}`;receipt.measurements.push({label,...g});
   assert(g.gap>=11.9);assert(g.title.right<=g.viewport.width&&g.body.right<=g.viewport.width,'fields fit narrow window');
   assert.equal(await page.getByRole('button',{name:'打开本夹标题列表',exact:true}).count(),1);
   await page.getByRole('textbox',{name:'编辑标题',exact:true}).fill('只有标题的安全区');await page.getByRole('textbox',{name:'编辑正文',exact:true}).fill('');
   await button('完成编辑').first().click();await page.locator('[data-inline-editor]').waitFor({state:'detached'});await waitForInfo(shelf,i=>i.snapshot.ideas.find(x=>x.id==='one').text==='');
   const after=await geometry(false);assert(after.gap>=11.9);assert(after.body.border>=1);assert.equal(await page.locator('[data-full-text]').inputValue(),'');
   await page.screenshot({path:path.join(out,label+'-title-only.png')});
   await button('编辑').click();await page.getByRole('textbox',{name:'编辑标题',exact:true}).fill('安全区 one');await page.getByRole('textbox',{name:'编辑正文',exact:true}).fill('完整正文 one\n第二行中文 gyp');
   await button('完成编辑').first().click();await page.locator('[data-inline-editor]').waitFor({state:'detached'});receipt.checks.push(label+'-safe-gap-narrow-fields-group-navigation-and-title-only-save');
  }
  const original=(await info()).snapshot;assert.equal(original.ideas.find(i=>i.id==='one').text,'完整正文 one\n第二行中文 gyp');
  assert.equal(original.clips.find(c=>c.id==='stack').ideaIds.length,2);receipt.checks.push('content-and-group-navigation-retained');
  receipt.passed=receipt.failures.length===0;
 }catch(e){receipt.passed=false;receipt.error=e.stack;}finally{try{if(app){receipt.pids.push(app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid)));await app.close();app=null;}await cleanupIdleFixture(profile,[...new Set(receipt.pids)]);receipt.normalQuit=true;receipt.profileRemoved=true;}catch(e){receipt.passed=false;receipt.cleanupError=e.stack;}await fs.writeFile(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({out,passed:receipt.passed,checks:receipt.checks.length,failures:receipt.failures.length,error:receipt.error,cleanupError:receipt.cleanupError,normalQuit:receipt.normalQuit,profileRemoved:receipt.profileRemoved}));if(!receipt.passed)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
