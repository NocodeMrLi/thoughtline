'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto'),{_electron}=require('playwright');
const sourceSha='6e798d53c049da88e49ed31872992a1408873b21';
const output=path.resolve('dist/store/screenshots');
const desktopScript=path.resolve('scripts/store/capture-desktop.ps1');
function native(mode,...args){return execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',desktopScript,'-Mode',mode,...args],{windowsHide:true,encoding:'utf8',timeout:25000});}
const delay=n=>new Promise(r=>setTimeout(r,n));
function seed(en){
 const work=en?'Work':'工作',life=en?'Life':'生活',writing=en?'Writing':'写作';
 const rows=en?[
 ['focus','Today’s focus','Prepare the project outline.\nLeave time for the ideas that matter.',work,'notes','hanging',15],
 ['meeting','Meeting notes','Make the next step clear.\nShare a short recap with the team.',work,'notes','hanging',15],
 ['spark','Writing spark','A small observation can become the beginning of a story.\nWrite it down while it is still fresh.',writing,'ideas','hanging',14],
 ['prompt','Reusable prompt','Explain this in plain language.\nThen give one concrete example.',work,'general','hanging',15],
 ['weekend','Weekend plan','Take a walk. Read a few pages.\nMake room for something unexpected.',life,'personal','hanging',15],
 ['reading','Reading notes','Keep a useful thought in your own words.\nReturn to it when you need a new perspective.',writing,'ideas','archived',12],
 ['outline','A clear outline','Start with one question.\nCollect examples, then write the first paragraph.',writing,'ideas','archived',13]
 ]:[
 ['focus','今天的重点','整理项目思路。\n给真正重要的想法留一点时间。',work,'notes','hanging',15],
 ['meeting','会议记录','把下一步说清楚。\n给团队留一份简短的讨论纪要。',work,'notes','hanging',15],
 ['spark','写作灵感','一个小小的观察，也能成为故事的开头。\n趁还记得，先把它写下来。',writing,'ideas','hanging',14],
 ['prompt','常用提示词','请用简单语言解释。\n再给出一个具体的例子。',work,'general','hanging',15],
 ['weekend','周末计划','散散步，读几页书。\n为一点意外的灵感留出空间。',life,'personal','hanging',15],
 ['reading','阅读笔记','用自己的话记下一段有用的思考。\n需要新角度时，再回来看看。',writing,'ideas','archived',12],
 ['outline','写一份提纲','先提出一个问题。\n收集例子，再写下第一段。',writing,'ideas','archived',13]
 ];
 const ideas=rows.map(([id,title,text,project,agentId,status,day])=>({id,title,text,project,agentId,status,createdAt:`2026-10-${day}T08:00:00.000Z`,updatedAt:`2026-10-${day}T08:00:00.000Z`,createdDay:`2026-10-${day}`,creationTimeZone:'UTC'}));
 return {schemaVersion:4,revision:0,ideas,clips:[{id:'clip-focus',agentId:'notes',ideaIds:['focus','meeting'],currentId:'focus',position:.18},{id:'clip-spark',agentId:'ideas',ideaIds:['spark'],currentId:'spark',position:.40},{id:'clip-prompt',agentId:'general',ideaIds:['prompt'],currentId:'prompt',position:.62},{id:'clip-weekend',agentId:'personal',ideaIds:['weekend'],currentId:'weekend',position:.83}],archivedClips:[],projects:[work,life,writing],agents:[{id:'general',name:en?'General':'通用',color:'#A0A3AA'},{id:'notes',name:en?'Notes':'工作记录',color:'#6589A8'},{id:'ideas',name:en?'Ideas':'灵感',color:'#77A276'},{id:'personal',name:en?'Personal':'日常',color:'#C69665'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:true,shelfCapacity:6,rope:{style:'vine'},paper:{color:'warm',pattern:'blank'}}};
}
async function pageFor(app,view){const until=Date.now()+15000;for(;;){const p=(await app.windows()).find(p=>p.url().includes('view='+view));if(p){await p.waitForLoadState('domcontentloaded');return p;}if(Date.now()>until)throw Error('Missing view '+view);await delay(60);}}
async function main(){
 assert.equal(process.platform,'win32');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_OS,'Windows');
 const exe=path.resolve(process.argv[2]);assert(exe.toLowerCase().includes('windowsapps'+path.sep));await fs.mkdir(output,{recursive:true});native('prepare');
 const report={sourceSha,packageSha256:'957ad8564f1c6abf40ef77831d25fa7b39a42b2c541d9824f89feb10a1e9121c',captureScriptSha:process.env.GITHUB_SHA,actualInstalledPackage:true,physicalAcceptance:false,screenshots:[],profiles:[],cleaned:false};
 let app,profile;
 async function capture(locale,name){await delay(500);const dir=path.join(output,locale);await fs.mkdir(dir,{recursive:true});const file=path.join(dir,name+'.png');native('capture','-Output',file,'-X',String(report.captureRegion.x),'-Y',String(report.captureRegion.y),'-Width',String(report.captureRegion.width),'-Height',String(report.captureRegion.height));
  const facts=await app.evaluate(({nativeImage},file)=>{const image=nativeImage.createFromPath(file),size=image.getSize(),b=image.toBitmap();let min=255,max=0;for(let i=0;i<b.length;i+=Math.max(4,Math.floor(b.length/30000/4)*4)){for(let k=0;k<3;k++){min=Math.min(min,b[i+k]);max=Math.max(max,b[i+k]);}}return {...size,range:max-min};},file);
  assert(facts.width>=1366&&facts.height>=768,'Desktop resolution below Store minimum: '+JSON.stringify(facts));assert(facts.range>50,'Native desktop appears blank');
  const bytes=await fs.readFile(file);assert(bytes.length<50*1024*1024);report.screenshots.push({locale,file:path.relative(output,file).replaceAll('\\','/'),...facts,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),capture:'Native Windows desktop GDI region; original pixels, no overlays/compositing'});console.log(JSON.stringify(report.screenshots.at(-1)));
 }
 try{
  for(const locale of ['zh-CN','en']){
   const en=locale==='en';profile=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-store-promo-'));report.profiles.push(profile);
   await fs.writeFile(path.join(profile,'snapshot.json'),JSON.stringify(seed(en)));await fs.writeFile(path.join(profile,'preferences.json'),JSON.stringify({schemaVersion:1,version:0,locale,theme:en?'light':'dark'}));
   const env={...process.env,THOUGHTLINE_DATA_DIR:profile};delete env.ELECTRON_RUN_AS_NODE;delete env.ELECTRON_RENDERER_URL;
   app=await _electron.launch({executablePath:exe,args:[],env,timeout:30000});const shelf=await pageFor(app,'shelf');await shelf.locator('[data-view=shelf]').waitFor({state:'attached'});
   const runtime=await app.evaluate(({app,screen})=>({version:app.getVersion(),store:process.windowsStore===true,platform:process.platform,arch:process.arch,data:app.getPath('userData'),display:screen.getPrimaryDisplay()}));
   assert.equal(runtime.version,'0.0.38');assert.equal(runtime.store,true);assert.equal(runtime.data,profile);assert.equal(runtime.platform,'win32');report.runtime=runtime;
   const bounds=runtime.display.bounds;assert(bounds.width>=1920&&bounds.height>=1080,'Capture layout requires 1920x1080 actual desktop');report.captureRegion={x:bounds.x+192,y:bounds.y,width:1536,height:960};native('cursor','-X',String(bounds.x+Math.floor(bounds.width/2)),'-Y',String(bounds.y+1));
   await shelf.waitForFunction(async()=> (await window.thoughtline.info()).shelfVisible,{timeout:15000});
   const info=await shelf.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas.length,7);assert.equal(info.preferences.locale,locale);assert.equal(info.snapshot.settings.rope.style,'vine');
   assert((await shelf.evaluate(()=>window.thoughtline.openComposer())).ok);const composer=await pageFor(app,'composer');await composer.locator('#idea-text').fill(en?'Capture a thought before it slips away.':'趁还记得，先把这个念头写下来。');
   await app.evaluate(({BrowserWindow,screen})=>{const a=screen.getPrimaryDisplay().workArea,w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Composer');w.setBounds({x:a.x+580,y:a.y+440,width:620,height:330});w.show();w.focus();});await capture(locale,'01-vine-and-capture');
   await composer.evaluate(async()=>{const i=await window.thoughtline.info();return window.thoughtline.close(i.composerContext.draft);});
   assert((await shelf.evaluate(()=>window.thoughtline.openManage())).ok);const manage=await pageFor(app,'manage');await manage.locator('.month-grid').waitFor();
   async function position(){await app.evaluate(({BrowserWindow,screen})=>{const d=screen.getPrimaryDisplay(),w=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Thoughtline Manage');const width=1100,height=640;w.setBounds({x:d.workArea.x+Math.floor((d.workArea.width-width)/2),y:d.workArea.y+310,width,height});w.show();w.focus();});}
   await position();await capture(locale,'02-calendar');
   assert((await manage.evaluate(()=>window.thoughtline.openManage('focus'))).ok);await manage.locator('[data-reader-id=focus]').waitFor();await position();await capture(locale,'03-stack-reader');
   assert((await manage.evaluate(()=>window.thoughtline.openClassification('tags'))).ok);await manage.locator('[data-mode=classification]').waitFor();await position();await capture(locale,'04-groups-and-tags');
   await app.close();app=null;await fs.rm(profile,{recursive:true,force:true});profile=null;
  }
  assert.equal(report.screenshots.length,8);report.cleaned=true;
 }catch(error){report.failure=String(error.stack||error);throw error;}finally{if(app){try{await app.close();app=null;}catch(e){report.cleanupFailure=String(e);}}if(profile&&!app)await fs.rm(profile,{recursive:true,force:true});if(!app&&!report.cleanupFailure)report.profilesCleaned=true;await fs.writeFile(path.join(output,'capture-report.json'),JSON.stringify(report,null,2)+'\n');}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
