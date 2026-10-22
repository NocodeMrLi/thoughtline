// SPDX-License-Identifier: GPL-3.0-only
// One write at a time; coalesce typing without postponing a checkpoint indefinitely.
export class DraftAutosaver<T>{
 private latest:T;private version=0;private savedVersion=0;private since=0;private timer:ReturnType<typeof setTimeout>|null=null;private pending:Promise<void>|null=null;private paused=false;private disposed=false;
 constructor(initial:T,private write:(draft:T)=>Promise<void>,private onError:(error:unknown)=>void,private delay=800,private maxWait=2000){this.latest=initial;}
 update(value:T){if(this.disposed)return;this.latest=value;if(this.version===this.savedVersion)this.since=Date.now();this.version++;this.schedule();}
 pause(){this.paused=true;this.cancel();}
 resume(){if(this.paused)this.since=Date.now();this.paused=false;this.schedule();}
 dispose(){this.disposed=true;this.cancel();}
 private cancel(){if(this.timer!==null)clearTimeout(this.timer);this.timer=null;}
 private schedule(){if(this.disposed||this.paused||this.pending||this.version===this.savedVersion)return;this.cancel();this.timer=setTimeout(()=>{this.timer=null;void this.persist().catch(()=>{});},Math.max(0,Math.min(this.delay,this.maxWait-(Date.now()-this.since))));}
 private persist():Promise<void>{
  if(this.pending)return this.pending;if(this.disposed||this.paused||this.version===this.savedVersion)return Promise.resolve();
  const version=this.version,value=this.latest;
  const task=Promise.resolve().then(()=>this.write(value)).then(()=>{this.savedVersion=version;}).catch(error=>{this.since=Date.now();this.onError(error);throw error;}).finally(()=>{this.pending=null;if(this.version>version){this.since=Date.now();this.schedule();}});
  this.pending=task;return task;
 }
 async flush(){this.cancel();if(this.pending)await this.pending;while(!this.disposed&&this.version!==this.savedVersion){if(this.paused)throw Error('Draft checkpoint is paused');await this.persist();this.cancel();}}
}
