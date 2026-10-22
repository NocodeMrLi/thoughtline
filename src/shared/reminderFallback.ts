// SPDX-License-Identifier: GPL-3.0-only
import type {Snapshot} from './contracts';
import type {ReminderClaim} from './reminders';
export type LightReminder={key:string;id:string;at:string;title:string;count:number};
// Transient presentation; persisted scheduler consumption prevents repeats on restart.
export class ReminderFallback{
 private claims:ReminderClaim[]=[];private sequence=0;private timer:ReturnType<typeof setTimeout>|null=null;
 current:LightReminder|null=null;
 constructor(private snapshot:()=>Snapshot,private changed:()=>void){}
 private valid(c:ReminderClaim){return this.snapshot().ideas.find(i=>i.id===c.id&&i.status!=='deleted'&&i.reminder?.at===c.at&&i.reminder.state==='failed');}
 show(claims:ReminderClaim[]){const valid=claims.filter(c=>this.valid(c));if(!valid.length)return;if(JSON.stringify(valid)===JSON.stringify(this.claims)&&this.current)return;
  this.clearTimer();this.claims=valid;const first=this.valid(valid[0])!;this.current={key:String(++this.sequence),id:first.id,at:valid[0].at,title:first.title,count:valid.length};
  const key=this.current.key;this.timer=setTimeout(()=>this.dismiss(key),8000);this.timer.unref?.();this.changed();
 }
 sync(){if(!this.current)return;const next=this.claims.filter(c=>this.valid(c));if(!next.length){this.dismiss(this.current.key);return;}const first=this.valid(next[0])!;if(next.length!==this.claims.length||first.title!==this.current.title){const changedTarget=first.id!==this.current.id;this.claims=next;this.current={...this.current,key:changedTarget?String(++this.sequence):this.current.key,id:first.id,at:next[0].at,title:first.title,count:next.length};if(changedTarget){this.clearTimer();const key=this.current.key;this.timer=setTimeout(()=>this.dismiss(key),8000);this.timer.unref?.();}this.changed();}}
 target(key:string){this.sync();return this.current?.key===key?this.current.id:null;}
 dismiss(key:string){if(this.current?.key!==key)return;this.clearTimer();this.current=null;this.claims=[];this.changed();}
 private clearTimer(){if(this.timer)clearTimeout(this.timer);this.timer=null;}
 stop(){this.clearTimer();this.current=null;this.claims=[];}
}
