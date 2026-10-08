const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),crypto=require('node:crypto'),{spawn,execFileSync}=require('node:child_process');
const time=s=>s.split(':').map(Number).reduce((a,n)=>a*60+n,0);
(async()=>{
 if(!process.env.THOUGHTLINE_EXECUTABLE)throw Error('Set THOUGHTLINE_EXECUTABLE to the frozen test App executable.');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-package-idle-'));let child;
 try{
  // Reserve a fixture-specific hotkey so other apps' interaction tests cannot wake this idle instance.
  await fs.writeFile(path.join(dir,'snapshot.json'),JSON.stringify({schemaVersion:2,revision:0,clips:[],ideas:[],agents:[{id:'general',name:'通用',color:'#A4A5B0'}],draft:null,settings:{writeHotkey:'Control+Alt+Shift+F20',reducedMotion:false}}));
  child=spawn(process.env.THOUGHTLINE_EXECUTABLE,[],{env:{...process.env,THOUGHTLINE_DATA_DIR:dir},stdio:'ignore'});
  const deadline=Date.now()+20000;while(Date.now()<deadline){try{await fs.access(path.join(dir,'snapshot.json'));break;}catch{await new Promise(r=>setTimeout(r,100));}}
  await fs.access(path.join(dir,'snapshot.json'));await new Promise(r=>setTimeout(r,10000));
  const sample=()=>{const all=execFileSync('ps',['-axo','pid=,ppid=,rss=,time='],{encoding:'utf8'}).trim().split('\n').map(l=>{const [pid,ppid,rss,cpu]=l.trim().split(/\s+/);return {pid:Number(pid),ppid:Number(ppid),rssKiB:Number(rss),cpuSeconds:time(cpu)};});const ids=new Set([child.pid]);for(let i=0;i<all.length;i++)for(const p of all)if(ids.has(p.ppid))ids.add(p.pid);const tree=all.filter(p=>ids.has(p.pid));assert(tree.length);return {at:Date.now(),tree,rssMiB:tree.reduce((n,p)=>n+p.rssKiB,0)/1024,cpuSeconds:tree.reduce((n,p)=>n+p.cpuSeconds,0)};};
  const first=sample(),samples=[first];for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,30000));samples.push(sample());console.log(JSON.stringify({seconds:(samples.at(-1).at-first.at)/1000,rssMiB:samples.at(-1).rssMiB}));}
  const stable=samples.every(s=>JSON.stringify(s.tree.map(p=>p.pid).sort())===JSON.stringify(first.tree.map(p=>p.pid).sort()));assert(stable,'process membership changed, idle acceptance invalid');
  const last=samples.at(-1),cpu=(last.cpuSeconds-first.cpuSeconds)/((last.at-first.at)/1000)*100,rss=Math.max(...samples.slice(-3).map(s=>s.rssMiB));
  const report={scope:'Mac frozen ad-hoc App executable, isolated empty data, direct spawn with no debugger; no native interaction tests running concurrently; hidden startup established separately by packaged workflow',durationSeconds:(last.at-first.at)/1000,stableMembership:stable,cpuPercentSingleCore:cpu,stableRssMiB:rss,cpuGate:cpu<=2,rssGate:rss<=350,asarSha256:crypto.createHash('sha256').update(await fs.readFile(path.resolve(process.env.THOUGHTLINE_EXECUTABLE,'../../Resources/app.asar'))).digest('hex'),samples};await fs.writeFile('acceptance/evidence/overnight-package-idle.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cpu,rss,cpuGate:report.cpuGate,rssGate:report.rssGate}));assert(report.cpuGate);assert(report.rssGate);
 }finally{if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
