// SPDX-License-Identifier: GPL-3.0-only
// A missing compositionend must not leave autosave paused or turn preedit into a checkpoint.
// Ownership is the actual input node; a delayed end from A cannot release B.
export class CompositionSession<K extends string>{
 private active:{field:K;owner:object;before:string;started:number}|null=null;
 private retired=new WeakSet<object>();
 get composing(){return this.active!==null;}
 owns(owner:object){return this.active?.owner===owner;}
 focus(owner:object){this.retired.delete(owner);}
 accepts(owner:object){return !this.retired.has(owner);}
 start(field:K,owner:object,before:string,started:number){
  if(this.active?.owner===owner)return null;
  const abandoned=this.active;this.retired.delete(owner);this.active={field,owner,before,started};
  if(abandoned&&abandoned.owner!==owner)this.retired.add(abandoned.owner);
  return abandoned&&abandoned.owner!==owner?abandoned:null;
 }
 end(owner:object,ended:number){
  if(!this.active||this.active.owner!==owner||ended<this.active.started)return null;
  const completed=this.active;this.active=null;return completed;
 }
 blur(owner:object){
  if(this.active?.owner!==owner)return null;
  const abandoned=this.active;this.active=null;this.retired.add(owner);return abandoned;
 }
}
