const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');const {_electron}=require('playwright');
const {ProbeSession}=require('./probe-session.cjs');const {cleanupIdleFixture}=require('../../tests/electron/idle-fixture-cleanup.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-g7-matrix-'));let app,session;let pids=[];const result={scope:'own actual Mac windows and public geometry helper; not production integration or Windows/physical multi-monitor acceptance',cases:[],permissionRequestMade:false};
 try{
  app=await _electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'fixture.cjs'),'--user-data-dir='+dir],timeout:20000});
  await (await app.firstWindow()).waitForLoadState();
  const root=app.process().pid,display=await app.evaluate(({screen})=>screen.getPrimaryDisplay());
  session=new ProbeSession({spawn:()=>spawn(path.join(__dirname,'build/fullscreen-probe'),[],{stdio:['pipe','pipe','pipe']}),expectedPid:root,timeoutMs:2000,ttlMs:2500});
  const sample=async(label,state)=>{
   let last;const deadline=Date.now()+12000;
   do{last=await session.sample(String(display.id));if(last.expectedFrontMatch&&last.state===state)break;await delay(150);}while(Date.now()<deadline);
   assert.equal(last.state,state,label+': '+JSON.stringify(last));assert.equal(last.expectedFrontMatch,true);
   const actual=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({visible:w.isVisible(),nativeFullscreen:w.isFullScreen(),simpleFullscreen:w.isSimpleFullScreen(),maximized:w.isMaximized(),bounds:w.getBounds()})));
   result.cases.push({label,expected:state,probe:last,actual});return last;
  };
  result.actualDisplayCount=await app.evaluate(({screen})=>screen.getAllDisplays().length);
  result.preexistingScreenCaptureGrant=(await sample('ordinary owned window','clear')).screenCapturePreflightGranted;
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].maximize());
  await sample('ordinary maximize uses available work area','clear');
  await app.evaluate(async({BrowserWindow,screen})=>{const w=BrowserWindow.getAllWindows()[0];w.unmaximize();const b=screen.getPrimaryDisplay().workArea;w.setBounds({x:b.x+30,y:b.y+40,width:500,height:330});const extra=new BrowserWindow({x:b.x+600,y:b.y+80,width:360,height:280,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});await extra.loadURL('data:text/html,<body>Only synthetic second target</body>');extra.show();extra.focus();});
  await sample('two ordinary front-app windows are ambiguous','unknown');
  await app.evaluate(async({BrowserWindow,screen})=>{for(const w of BrowserWindow.getAllWindows())w.hide();const b=screen.getPrimaryDisplay().bounds;const cover=new BrowserWindow({...b,frame:false,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});await cover.loadURL('data:text/html,<body>Geometry coverage without native fullscreen</body>');cover.show();cover.focus();});
  await sample('normal borderless display-size request is constrained below menu bar','clear');
  assert.equal(result.cases.at(-1).actual.some(w=>w.nativeFullscreen),false);
  const cover=result.cases.at(-1).actual.find(w=>w.visible);assert(cover.bounds.y>display.bounds.y,'observed native top constraint explains clear');
  result.demonstratedSemanticFalsePositive=false;result.falsePositiveRisk='pure coverage cannot establish fullscreen semantics; current normal fixture was constrained by OS, not an actual false positive';
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.isVisible()).setSimpleFullScreen(true));
  await sample('owned pre-Lion simple fullscreen','blocked');assert.equal(result.cases.at(-1).actual.find(w=>w.visible).simpleFullscreen,true);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.isVisible()).setSimpleFullScreen(false));
  await sample('simple fullscreen exit restores ordinary coverage','clear');
  const invalid=await session.sample('4294967295');assert.equal(invalid.state,'unknown');result.invalidDisplay=invalid;
  const targetMismatch=session.current(String(display.id));assert.equal(targetMismatch.state,'unknown');result.switchInvalidated=targetMismatch;
  pids=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));if(!pids.includes(root))pids.push(root);
  result.defaultProductionChanged=false;
 }finally{
  if(app){try{pids=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));}catch{}if(!pids.includes(app.process().pid))pids.push(app.process().pid);}
  if(session)await session.close();if(app)await app.close();await cleanupIdleFixture(dir,pids);
  result.ownedPids=pids;result.allOwnedPidsExited=true;result.fakeDataRemoved=true;
  await fs.writeFile(path.join(__dirname,'evidence/mac-matrix.json'),JSON.stringify(result,null,2)+'\n');
 }
 console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
