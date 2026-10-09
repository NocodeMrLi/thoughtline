const {launchOptions}=require('./window-fixture.cjs'),{cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-p5-r1-startup-')),profile=path.join(root,'profile'),data=path.join(root,'data'),preserved=path.join(root,'offline-preserved'),signal=path.join(root,'recovery.json');let pids=[];
 const evidence='acceptance/evidence/round1/p5-storage';let normalExit=false;
 try{
  await fs.mkdir(profile);await fs.mkdir(data);
  const snapshot={schemaVersion:2,revision:7,ideas:[],clips:[],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:{text:'race preserved body\n🙂',title:'draft',project:'',agentId:'general'},settings:{writeHotkey:'Control+Alt+N',reducedMotion:true}};
  const raw=JSON.stringify(snapshot),config=JSON.stringify({schemaVersion:1,path:data});await fs.writeFile(path.join(data,'snapshot.json'),raw);await fs.writeFile(path.join(data,'snapshot.bak.json'),raw);await fs.writeFile(path.join(profile,'data-location.json'),config);
  const opts=await launchOptions(profile);
  await fs.writeFile(opts.args[0],`const io=require('node:fs/promises'),sync=require('node:fs'),path=require('node:path'),originalRead=io.readFile;let reads=0;io.readFile=async(p,...args)=>{if(path.basename(path.dirname(String(p)))==='data'&&path.basename(String(p))==='snapshot.json'&&++reads===2)sync.renameSync(${JSON.stringify(data)},${JSON.stringify(preserved)});return originalRead(p,...args);};const electron=require('electron');electron.dialog.showMessageBox=async options=>{sync.writeFileSync(${JSON.stringify(signal)},JSON.stringify({options,reads,pids:[process.pid,...electron.app.getAppMetrics().map(m=>m.pid)]}));return {response:2};};`+await fs.readFile(opts.args[0],'utf8'));
  const child=spawn(opts.executablePath,opts.args,{env:opts.env,stdio:['ignore','pipe','pipe']});pids.push(child.pid);let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const exitCode=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup did not naturally quit; preserve fixture for diagnosis')),10000);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);resolve(code)});});assert.equal(exitCode,0,output);normalExit=true;
  const receipt=JSON.parse(await fs.readFile(signal,'utf8'));pids.push(...receipt.pids);assert.equal(receipt.reads,2);assert(receipt.options.detail.includes('未创建空库'));
  await assert.rejects(fs.stat(data),{code:'ENOENT'});assert.equal(await fs.readFile(path.join(profile,'data-location.json'),'utf8'),config);assert.equal(await fs.readFile(path.join(preserved,'snapshot.json'),'utf8'),raw);assert.equal(await fs.readFile(path.join(preserved,'snapshot.bak.json'),'utf8'),raw);
  console.log(JSON.stringify({configuredPrecheckPassed:true,directoryDisconnectedAtActualLoad:true,recoveryDialog:true,emptyDatabaseNotCreated:true,originalBytesAndConfigPreserved:true,normalExit,exitCode}));
 }finally{
  if(normalExit){pids=[...new Set(pids)];await cleanupIdleFixture(root,pids);await assert.rejects(fs.stat(root),{code:'ENOENT'});await fs.writeFile(path.join(evidence,'r1-startup-cleanup.json'),JSON.stringify({dir:root,pids,normalExit,allExited:true,dataRemoved:true},null,2));}
  else console.error(JSON.stringify({fixtureRetained:root,pids,normalExit}));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
