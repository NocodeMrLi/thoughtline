const {spawn,execFileSync}=require('node:child_process'),fs=require('node:fs/promises'),path=require('node:path'),net=require('node:net'),os=require('node:os'),assert=require('node:assert/strict');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const base=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-launcher-qa-')),data=path.join(base,'user-data'),mount=path.join(base,'mount');let mounted=false,openProcess,ws,owned=[];const pending=new Map();let sequence=0;
 await fs.mkdir(data);await fs.mkdir(mount);
 try{
  execFileSync('/usr/bin/hdiutil',['attach','-readonly','-nobrowse','-noautoopen','-mountpoint',mount,'/Users/lihongwei/Documents/Codex/2026-10-09/task/thoughtline/dist/Thoughtline-0.0.13-mac-arm64.dmg'],{stdio:'pipe'});mounted=true;
  const appPath=path.join(mount,'Thoughtline.app');
  const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
  openProcess=spawn('/usr/bin/open',['-n','-W',appPath,'--env','THOUGHTLINE_DATA_DIR='+data,'--env','ELECTRON_RENDERER_URL=','--env','ELECTRON_RUN_AS_NODE=','--env','NODE_OPTIONS=','--args','--inspect-brk=127.0.0.1:'+port],{stdio:['ignore','pipe','pipe']});
  let target;const deadline=Date.now()+15000;
  while(Date.now()<deadline){try{const list=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();target=list[0];if(target?.webSocketDebuggerUrl)break;}catch{}await delay(100);}
  assert(target?.webSocketDebuggerUrl,'System open did not expose our paused QA process; do not bypass Gatekeeper');
  const realExec=await fs.realpath(path.join(appPath,'Contents/MacOS/Thoughtline'));
  const processes=execFileSync('ps',['ax','-o','pid=,command='],{encoding:'utf8'}).split('\n');
  const row=processes.find(line=>line.trim().replace(/^\d+\s+/,'').startsWith(realExec+' --inspect-brk=127.0.0.1:'+port));
  assert(row,'Own paused executable PID not found');owned.push(Number(row.trim().split(/\s+/)[0]));
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  ws.addEventListener('message',event=>{const v=JSON.parse(String(event.data));if(v.id&&pending.has(v.id)){const x=pending.get(v.id);pending.delete(v.id);clearTimeout(x.timer);v.error?x.reject(new Error(JSON.stringify(v.error))):x.resolve(v.result);}});
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject,timer:setTimeout(()=>{pending.delete(id);reject(new Error('Inspector timeout '+method));},3000)});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:false});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
  await command('Runtime.enable');
  const pre=await evaluate('({pid:process.pid,execPath:process.execPath,data:process.env.THOUGHTLINE_DATA_DIR,runAsNode:process.env.ELECTRON_RUN_AS_NODE})');
  assert.equal(pre.data,data);
  // Do not run any main application code until the passed data path is proved.
  await command('Runtime.runIfWaitingForDebugger');
  let actual;const readyDeadline=Date.now()+10000;
  for(let n=0;n<60&&Date.now()<readyDeadline;n++){try{actual=await evaluate('(()=>{const {app,BrowserWindow}=process.mainModule.require("electron");return app&&app.isReady()&&BrowserWindow.getAllWindows().some(w=>w.webContents.getURL().includes("view=shelf")&&!w.webContents.isLoading())?{data:app.getPath("userData"),version:app.getVersion(),pids:app.getAppMetrics().map(x=>x.pid)}:null})()');if(actual)break;}catch{}await delay(100);}
  assert(actual,'Candidate did not become a native Electron App');assert.equal(await fs.realpath(actual.data),await fs.realpath(data));assert.equal(actual.version,'0.0.13');owned=[...new Set([...owned,...actual.pids])];
  console.log(JSON.stringify({stage:'fullyInitializedFakeApp',actualUserData:actual.data,version:actual.version,ownedPids:owned}));
  await command('Runtime.evaluate',{expression:'process.mainModule.require("electron").app.quit()'}).catch(()=>{});
  if(ws){const connection=ws;ws=null;const disconnected=new Promise(r=>connection.addEventListener('close',r,{once:true}));connection.close();await Promise.race([disconnected,delay(1000)]);}
  for(let n=0;n<60;n++){let alive=[];for(const pid of owned){try{process.kill(pid,0);alive.push(pid);}catch(e){if(e.code!=='ESRCH')throw e;}}if(!alive.length)break;if(n===59)throw new Error('Owned QA processes remained: '+alive.join(','));await delay(100);}
  const files=await fs.readdir(data);const result={scope:'actual LaunchServices open --env + isolated read-only frozen candidate; temporary loopback inspector used only to assert env before main runs; no default user-experience launch, no real data read, no physical shortcut/IME acceptance',version:actual.version,environmentProvedBeforeMain:true,actualUserDataMatched:true,temporaryFakeData:data,ownedPids:owned,ownedPidsExited:true,runAsNodeEmptyStillNativeApp:true,filesWrittenOnlyInObservedFakeDir:files,gatekeeperBypass:false,commandExitCode:0};
  await fs.writeFile(path.join(__dirname,'launchservices-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{
  if(ws){ws.close();ws=null;await delay(250);}
  for(const pid of owned.slice(0,1)){try{process.kill(pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}}
  for(let n=0;n<60;n++){let live=false;for(const pid of owned){try{process.kill(pid,0);live=true;}catch(e){if(e.code!=='ESRCH')throw e;}}if(!live)break;if(n===59)throw new Error('Own processes still present; keep fixture and mount');await delay(100);}
  if(ws)ws.close();
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('QA cleanup'));}pending.clear();
  if(mounted)execFileSync('/usr/bin/hdiutil',['detach',mount],{stdio:'pipe'});
  await fs.rm(base,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
