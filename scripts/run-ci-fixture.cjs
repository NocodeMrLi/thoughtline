const {spawn,execFile}=require('node:child_process');
const fs=require('node:fs/promises'),path=require('node:path');
async function runFixture({file,args=[],evidence,timeoutMs=180000,echo=true}){
 await fs.mkdir(evidence,{recursive:true});
 const receipt={file,args,timeoutMs,startedAt:new Date().toISOString(),passed:false,timedOut:false,profileCleanup:'Delegated to fixture; supervisor never deletes data'};
 const child=spawn(process.execPath,[file,...args],{env:process.env,stdio:['ignore','pipe','pipe']});receipt.pid=child.pid;
 let stdout='',stderr='',timer;
 child.stdout.on('data',b=>{stdout=(stdout+b).slice(-65536);if(echo)process.stdout.write(b);});
 child.stderr.on('data',b=>{stderr=(stderr+b).slice(-65536);if(echo)process.stderr.write(b);});
 let spawnError;
 child.once('error',e=>{spawnError=e.message;});
 const closed=new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal,error:spawnError,closeConfirmed:true})));
 const expired=new Promise(resolve=>{timer=setTimeout(async()=>{
  receipt.timedOut=true;receipt.failure='Fixture exceeded its deadline; verification failed and data is retained';
  console.error(receipt.failure+': '+file);
  // Stop only our still-running child. Windows CI owns this entire child tree.
  if(child.exitCode===null&&child.signalCode===null){
   if(process.platform==='win32')await new Promise(done=>execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{timeout:5000},(e)=>{receipt.stopError=e?.message;done();}));
   else child.kill('SIGKILL');
  }
  let confirmTimer;
  const result=await Promise.race([closed,new Promise(done=>{confirmTimer=setTimeout(()=>done({code:null,signal:'deadline',closeConfirmed:false}),5000);})]);
  clearTimeout(confirmTimer);resolve(result);
 },timeoutMs);});
 const result=await Promise.race([closed,expired]);
 clearTimeout(timer);Object.assign(receipt,result,{stdout,stderr,completedAt:new Date().toISOString()});receipt.passed=result.code===0&&result.closeConfirmed&&!receipt.timedOut&&!result.error;
 await fs.writeFile(path.join(evidence,'supervisor.json'),JSON.stringify(receipt,null,2));return receipt;
}
module.exports={runFixture};
if(require.main===module){
 const file=path.resolve(process.argv[2]||'');const allowed=path.resolve('tests/electron')+path.sep;
 if(!file.startsWith(allowed)||path.extname(file)!=='.cjs')throw Error('Expected an existing tests/electron/*.cjs fixture');
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/ci');
 runFixture({file,args:process.argv.slice(3),evidence:path.join(root,'supervisor-'+path.basename(file,'.cjs')+'-'+Date.now())}).then(r=>{console.log('CI FIXTURE',JSON.stringify({file:r.file,pid:r.pid,passed:r.passed,timedOut:r.timedOut,code:r.code}));process.exit(r.passed?0:1);},e=>{console.error(e);process.exit(1);});
}
