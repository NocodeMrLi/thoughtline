import type {Snapshot,Reminder,Result} from './contracts';
import {validateSnapshot} from './ideaCommands';
import {validReminderTime} from './reminderTime';
export type ReminderClaim={id:string;at:string};
export function setIdeaReminder(s:Snapshot,id:string,at:string|null,expected:Reminder|null,now:string):Result<Snapshot>{
 const idea=s.ideas.find(i=>i.id===id&&i.status!=='deleted');
 if(!idea)return {ok:false,code:'INVALID',message:'找不到可提醒的念头。'};
 if(JSON.stringify(idea.reminder??null)!==JSON.stringify(expected))return {ok:false,code:'CONFLICT',message:'提醒已变化，请重新查看。'};
 if(at!==null&&(!validReminderTime(at)||Date.parse(at)<=Date.parse(now)))return {ok:false,code:'INVALID',message:'请选择未来的提醒时间。'};
 return validateSnapshot({...s,ideas:s.ideas.map(i=>{if(i.id!==id)return i;const {reminder:_old,...rest}=i;return {...rest,updatedAt:now,...(at?{reminder:{at,state:'scheduled' as const}}:{})};})});
}
export function dueReminders(s:Snapshot,now:number):ReminderClaim[]{return s.ideas.filter(i=>i.status!=='deleted'&&i.reminder?.state==='scheduled'&&Date.parse(i.reminder.at)<=now).map(i=>({id:i.id,at:i.reminder!.at}));}
export function markReminders(s:Snapshot,claims:ReminderClaim[],state:'notified'|'missed'|'failed',now:string):Snapshot{
 const selected=new Map(claims.map(c=>[c.id,c.at]));return {...s,ideas:s.ideas.map(i=>i.status!=='deleted'&&i.reminder&&selected.get(i.id)===i.reminder.at&&(state==='failed'?['notified','missed'].includes(i.reminder.state):i.reminder.state==='scheduled')?{...i,reminder:{...i.reminder,state,attemptedAt:now}}:i)};
}
type Ports={snapshot:()=>Snapshot;consume:(claims:ReminderClaim[],state:'notified'|'missed',now:string)=>Promise<boolean>;failed:(claims:ReminderClaim[],now:string)=>Promise<void>;notify:(ids:string[],missed:boolean)=>Promise<boolean>;now?:()=>number;onError?:(error:unknown)=>void};
export class ReminderScheduler{
 private busy=false;private timer:ReturnType<typeof setTimeout>|null=null;private stopped=false;private retry=false;
 constructor(private ports:Ports){}
 private now(){return this.ports.now?.()??Date.now();}
 start(){this.stopped=false;void this.tick(true);}
 refresh(){if(this.timer)clearTimeout(this.timer);this.timer=null;if(this.stopped||this.busy)return;const next=this.ports.snapshot().ideas.reduce((next,i)=>i.status!=='deleted'&&i.reminder?.state==='scheduled'?Math.min(next,Date.parse(i.reminder.at)):next,Infinity);if(!Number.isFinite(next))return;const delay=this.retry?15000:Math.max(50,Math.min(30000,next-this.now()));this.timer=setTimeout(()=>{this.timer=null;void this.tick();},delay);this.timer.unref?.();}
 async tick(startup=false){if(this.busy||this.stopped)return;this.busy=true;this.retry=false;
  try{const now=this.now(),claims=dueReminders(this.ports.snapshot(),now);if(!claims.length)return;const time=new Date(now).toISOString(),missed=startup||claims.some(c=>now-Date.parse(c.at)>60000);if(!await this.ports.consume(claims,missed?'missed':'notified',time)){this.retry=true;return;}
   const available=claims.filter(c=>this.ports.snapshot().ideas.some(i=>i.id===c.id&&i.status!=='deleted'&&i.reminder?.at===c.at&&['notified','missed'].includes(i.reminder.state)));
   if(available.length&&!await this.ports.notify(available.map(c=>c.id),missed))await this.ports.failed(available,time);
  }catch(e){this.retry=true;this.ports.onError?.(e);}finally{this.busy=false;this.refresh();}
 }
 stop(){this.stopped=true;if(this.timer)clearTimeout(this.timer);this.timer=null;}
}
