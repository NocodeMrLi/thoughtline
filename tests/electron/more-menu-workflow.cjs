// SPDX-License-Identifier: GPL-3.0-only
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {launchOptions,warmViews}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs'),{fixture,checks,labels}=require('./more-menu-checks.cjs');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round2/more-menus');await fs.mkdir(root,{recursive:true});const evidence=await fs.mkdtemp(path.join(root,'source-'+process.platform+'-')),dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-more-menus-'));
 const receipt={platform:process.platform,version:require('../../package.json').version,profile:dir,evidence,scope:'Source Electron shared renderer; controlled pointer/document-leave/blur events. Not physical desktop outside-click acceptance.',cases:[]};let app;
 try{
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify(fixture()));app=await _electron.launch(await launchOptions(dir));assert.equal(await app.evaluate(({app})=>app.getPath('userData')),dir);const {shelf,manage}=await warmViews(app);
  let sequence=0;for(const language of ['zh','en'])for(const theme of ['light','dark']){const themeEvidence=path.join(evidence,language+'-'+theme);await fs.mkdir(themeEvidence);
   const locale=language==='zh'?'zh-CN':'en';const r=await manage.evaluate(({locale,theme,sequence})=>window.thoughtline.setPreferences({locale,theme},sequence),{locale,theme,sequence:++sequence});assert(r.ok,r.message);
   const openCalendar=async()=>{assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);await require('./window-fixture.cjs').returnToCalendarMonth(manage,language);};
   assert((await shelf.evaluate(()=>window.thoughtline.openManage('menu-live'))).ok);await manage.waitForSelector('[data-reader-id="menu-live"]');receipt.cases.push(await checks(manage,{kind:'expanded-bottom',language,evidence:themeEvidence}));
   await openCalendar();receipt.cases.push(await checks(manage,{kind:'calendar-top',language,evidence:themeEvidence}));
   await manage.locator('[data-day="'+fixture().ideas[0].createdDay+'"]').click();await manage.locator('[data-idea-id="menu-live"]').click();await manage.waitForSelector('[data-reader-id="menu-live"]');receipt.cases.push(await checks(manage,{kind:'calendar-bottom',language,evidence:themeEvidence}));
   await openCalendar();await manage.getByRole('button',{name:labels[language].top,exact:true}).click();await manage.getByRole('button',{name:labels[language].trash,exact:true}).click();await manage.locator('[data-idea-id="menu-trash"]').click();await manage.waitForSelector('[data-reader-id="menu-trash"]');receipt.cases.push(await checks(manage,{kind:'trash-bottom',language,evidence:themeEvidence}));
  }
 }catch(e){receipt.failure=e.stack;}finally{
  try{if(app){receipt.pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();receipt.normalQuit=true;await cleanupIdleFixture(dir,receipt.pids);receipt.profileRemoved=true;}}catch(e){receipt.cleanupFailure=e.stack;}
  receipt.passed=!receipt.failure&&!receipt.cleanupFailure&&receipt.profileRemoved&&receipt.cases.length===16&&receipt.cases.every(c=>c.passed);await fs.writeFile(path.join(evidence,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({evidence,passed:receipt.passed,failure:receipt.failure,cases:receipt.cases.map(c=>({kind:c.kind,language:c.language,failed:c.checks.filter(t=>!t.passed).map(t=>({name:t.name,error:t.error}))}))}));if(!receipt.passed)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
