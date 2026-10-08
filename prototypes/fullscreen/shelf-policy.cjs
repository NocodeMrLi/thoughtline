// Proposed policy only; never imported by src or package output.
class ShelfPolicy {
 constructor({initial,step}){this.step=step;this.state=initial();this.reasons=new Set();}
 environment(reason,active,now){if(active)this.reasons.add(reason);else this.reasons.delete(reason);this.sync(now);}
 sample(result,now){this.environment('fullscreen',result.state==='blocked',now);}
 sync(now){
  const dragging=this.state.locks.some(name=>name==='drag'||name==='text-drag');
  const paused=[...this.reasons].some(reason=>reason!=='fullscreen'||!dragging);
  if(paused!==this.state.suspended)this.state=this.step(this.state,{type:paused?'suspend':'resume',now});
 }
 event(event){
  // Environmental suspension must not discard operation-lock releases.
  if(this.state.suspended&&event.type==='lock'){
   this.state={...this.state,locks:event.active?[...new Set([...this.state.locks,event.name])]:this.state.locks.filter(name=>name!==event.name)};
  }else this.state=this.step(this.state,event);
  this.sync(event.now);return this.state;
 }
}
module.exports={ShelfPolicy};
