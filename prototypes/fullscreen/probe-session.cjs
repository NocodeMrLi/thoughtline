// Isolated experimental adapter. Not imported by the application.
const readline=require('node:readline');
const {performance}=require('node:perf_hooks');
class ProbeSession {
 constructor({spawn,now=()=>performance.now(),ttlMs=750,timeoutMs=500,expectedPid=0}){
  this.spawn=spawn;this.now=now;this.ttlMs=ttlMs;this.timeoutMs=timeoutMs;this.expectedPid=expectedPid;
  this.child=null;this.flight=null;this.cache=null;this.key=null;this.generation=0;this.closed=false;
 }
 target(key){key=String(key);if(this.key!==key){this.key=key;this.generation++;this.cache=null;}}
 unknown(reason){return {state:'unknown',reason,target:this.key};}
 current(key){
  this.target(key);const age=this.cache?this.now()-this.cache.sampledAt:Infinity;
  return this.cache&&age>=0&&age<this.ttlMs?{...this.cache,ageMs:age}:this.unknown('no-fresh-sample');
 }
 sample(key){
  this.target(key);
  if(this.closed)return Promise.resolve(this.unknown('closed'));
  if(!/^\d+$/.test(this.key)||Number(this.key)>4294967295)return Promise.resolve(this.unknown('invalid-target'));
  if(this.flight)return this.flight.key===this.key?this.flight.promise:Promise.resolve(this.unknown('target-query-pending'));
  const sampledAt=this.now(),generation=this.generation,target=this.key;
  let finish;
  const promise=new Promise(resolve=>{finish=resolve;});this.flight={key:target,promise};
  let settled=false,timer,rl,child;
  const done=async(result,broken=false)=>{
   if(settled)return;settled=true;clearTimeout(timer);if(rl)rl.close();
   if(child){child.removeListener('exit',onExit);child.removeListener('error',onError);}
   if(broken&&child)await this.dispose(child);
   if(generation!==this.generation)result=this.unknown('target-changed');
   else if(this.now()-sampledAt>=this.ttlMs)result=this.unknown('response-expired');
   else if(this.closed)result=this.unknown('closed');
   this.cache=result.state==='unknown'?null:{...result,target,sampledAt};this.flight=null;finish(result);
  };
  const onExit=()=>void done(this.unknown('helper-exited'),true);
  const onError=()=>void done(this.unknown('helper-error'),true);
  try{
   child=this.child||(this.child=this.spawn());
   child.once('exit',onExit);child.once('error',onError);
   rl=readline.createInterface({input:child.stdout});
   rl.once('line',line=>{
    try{
     const value=JSON.parse(line);
     if(!['clear','blocked','unknown'].includes(value.state)||typeof value.reason!=='string'||(value.displayId!==undefined&&String(value.displayId)!==target&&target!=='0'))throw Error('invalid response');
     void done(value);
    }catch{void done(this.unknown('invalid-response'),true);}
   });
   timer=setTimeout(()=>void done(this.unknown('helper-timeout'),true),this.timeoutMs);
   child.stdin.write(`sample ${target} ${Number.isSafeInteger(this.expectedPid)?this.expectedPid:0}\n`,error=>{if(error)onError();});
  }catch{void done(this.unknown('spawn-failed'),true);}
  return promise;
 }
 async dispose(child){
  if(this.child===child)this.child=null;
  if(child.exitCode!==null||child.signalCode!==null)return;
  const ended=new Promise(resolve=>child.once('exit',resolve));
  child.kill('SIGTERM');let timer;
  await Promise.race([ended,new Promise(resolve=>{timer=setTimeout(resolve,1000);})]);clearTimeout(timer);
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await ended;}
 }
 async close(){this.closed=true;this.cache=null;if(this.child)await this.dispose(this.child);if(this.flight)await this.flight.promise;}
}
module.exports={ProbeSession};
