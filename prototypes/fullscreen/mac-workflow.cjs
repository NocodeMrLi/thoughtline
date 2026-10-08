const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn,execFileSync}=require('node:child_process'),readline=require('node:readline');
const {_electron}=require('playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function cpu(value){return value.split(':').reduce((s,x)=>s*60+Number(x),0);}
function usage(pid){const [rss,time]=execFileSync('ps',['-p',String(pid),'-o','rss=,time='],{encoding:'utf8'}).trim().split(/\s+/);return {rssMiB:Number(rss)/1024,cpuSeconds:cpu(time)};}
(async()=>{
 await fs.access(path.join(__dirname,'build/fullscreen-probe'));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-g7-only-'));let app,probe;const pending=[];let timeout;
 try{
  probe=spawn(path.join(__dirname,'build/fullscreen-probe'),[],{stdio:['pipe','pipe','pipe']});
  const rl=readline.createInterface({input:probe.stdout});rl.on('line',line=>{const item=pending.shift();if(item){clearTimeout(item.timeout);try{item.resolve(JSON.parse(line));}catch(e){item.reject(e);}}});
  probe.on('exit',()=>{for(const item of pending.splice(0)){clearTimeout(item.timeout);item.reject(new Error('probe exited'));}});
  const request=command=>new Promise((resolve,reject)=>{const item={resolve,reject,timeout:setTimeout(()=>{const i=pending.indexOf(item);if(i>=0)pending.splice(i,1);reject(new Error('probe response exceeded 2s'));},2000)};pending.push(item);probe.stdin.write(command+'\n');});
  app=await _electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'fixture.cjs'),'--user-data-dir='+dir],timeout:20000});
  const page=await app.firstWindow();await page.waitForLoadState();
  const expected=app.process().pid;
  const display=await app.evaluate(({screen})=>screen.getPrimaryDisplay().id);
  const command=`sample ${display} ${expected}`;
  const until=async state=>{let last;const start=Date.now();while(Date.now()-start<12000){last=await request(command);if(last.state===state&&last.expectedFrontMatch)return last;await delay(250);}throw new Error('expected '+state+' fixture foreground, last='+JSON.stringify(last));};
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.show();w.focus();});
  const normal=await until('clear');
  const transition=flag=>app.evaluate(async({BrowserWindow},flag)=>{
   const w=BrowserWindow.getAllWindows()[0];await new Promise((resolve,reject)=>{const event=flag?'enter-full-screen':'leave-full-screen';const t=setTimeout(()=>reject(new Error('native fullscreen event timeout')),15000);w.once(event,()=>{clearTimeout(t);resolve();});w.setFullScreen(flag);});return {nativeFullScreen:w.isFullScreen(),visible:w.isVisible()};
  },flag);
  const entered=await transition(true);assert.equal(entered.nativeFullScreen,true);
  const full=await until('blocked');
  const left=await transition(false);assert.equal(left.nativeFullScreen,false);
  const restored=await until('clear');
  const invalid=await request('sample 4294967295 '+expected);assert.equal(invalid.state,'unknown');assert.equal(invalid.reason,'target-display-unavailable');
  const base=usage(probe.pid),start=Date.now(),latencies=[],rss=[];
  for(let n=0;n<80;n++){const sample=await request(command);latencies.push(sample.latencyMs);rss.push(usage(probe.pid).rssMiB);await delay(Math.max(0,start+(n+1)*250-Date.now()));}
  const duration=(Date.now()-start)/1000,last=usage(probe.pid);latencies.sort((a,b)=>a-b);
  const report={scope:'public geometry probe against our isolated actual native Mac fullscreen target; not overlay compositor, third-party app matrix, unprivileged machine or Windows acceptance',normal,entered,full,left,restored,invalid,permissionRequestMade:false,preexistingScreenCaptureGrant:normal.screenCapturePreflightGranted,probeSameProcess:true,performance:{samples:80,cadenceHz:4,durationSeconds:duration,cpuPercentSingleCore:(last.cpuSeconds-base.cpuSeconds)/duration*100,maxRssMiB:Math.max(...rss),latencyMedianMs:latencies[40],latencyMaxMs:latencies.at(-1),scope:'helper process only; controlled normal fixture; not whole-app frozen 120-second gate'}};
  await fs.writeFile(path.join(__dirname,'evidence/mac-native.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{
  if(app)await app.close();
  if(probe&&probe.exitCode===null&&probe.signalCode===null){const ended=new Promise(r=>probe.once('exit',r));probe.stdin.end('quit\n');await Promise.race([ended,delay(2000)]);if(probe.exitCode===null&&probe.signalCode===null){probe.kill('SIGTERM');await ended;}}
  await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
