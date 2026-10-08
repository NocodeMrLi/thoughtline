const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),{execFileSync}=require('node:child_process');const {_electron}=require('playwright');
const time=s=>{const parts=s.split(':').map(Number);return parts.reduce((total,n)=>total*60+n,0);};
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-idle-'));let app;
 try{
  app=await _electron.launch({executablePath:process.env.THOUGHTLINE_EXECUTABLE||require('electron'),args:process.env.THOUGHTLINE_EXECUTABLE?[]:[path.resolve('out/main/index.js')],env:{...process.env,THOUGHTLINE_DATA_DIR:dir},timeout:15000});await app.firstWindow();while((await app.windows()).length<3)await app.waitForEvent('window');
  const root=app.process().pid;
  const sample=()=>{const all=execFileSync('ps',['-axo','pid=,ppid=,rss=,time='],{encoding:'utf8'}).trim().split('\n').map(l=>{const [pid,ppid,rss,cpu]=l.trim().split(/\s+/);return {pid:Number(pid),ppid:Number(ppid),rssKiB:Number(rss),cpuSeconds:time(cpu)};});const ids=new Set([root]);for(let i=0;i<all.length;i++)for(const p of all)if(ids.has(p.ppid))ids.add(p.pid);const tree=all.filter(p=>ids.has(p.pid));return {at:Date.now(),tree,rssMiB:tree.reduce((n,p)=>n+p.rssKiB,0)/1024,cpuSeconds:tree.reduce((n,p)=>n+p.cpuSeconds,0)};};
  await new Promise(r=>setTimeout(r,5000));const initial=sample();const samples=[initial];console.log(JSON.stringify({phase:'idle-measurement-started',rssMiB:initial.rssMiB,processes:initial.tree.length}));
  for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,30000));samples.push(sample());console.log(JSON.stringify({elapsedSeconds:(samples.at(-1).at-initial.at)/1000,rssMiB:samples.at(-1).rssMiB}));}
  const final=samples.at(-1),stable=JSON.stringify(initial.tree.map(p=>p.pid).sort())===JSON.stringify(final.tree.map(p=>p.pid).sort());assert(stable,'process membership changed; CPU subtraction would not be reliable');
  const cpuPercent=(final.cpuSeconds-initial.cpuSeconds)/((final.at-initial.at)/1000)*100,maxRss=Math.max(...samples.map(s=>s.rssMiB));
  const hidden=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().every(w=>!w.isVisible()));
  const report={scope:'Mac actual Electron process tree, isolated empty data, all windows hidden; development executable, not Windows or user active workflow',durationSeconds:(final.at-initial.at)/1000,stableMembership:stable,hidden,cpuPercentSingleCore:cpuPercent,maximumSampledRssMiB:maxRss,cpuGate:cpuPercent<=2,rssGate:maxRss<=350,samples};await fs.writeFile('acceptance/evidence/idle-performance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cpuPercentSingleCore:cpuPercent,maximumSampledRssMiB:maxRss,hidden}));assert(hidden);assert(cpuPercent<=2,'idle CPU above 2%');assert(maxRss<=350,'idle RSS above 350 MiB');
 }finally{try{if(app)await app.close();}finally{await fs.rm(dir,{recursive:true,force:true});}}
})().catch(e=>{console.error(e);process.exitCode=1;});
