import type {Reminder} from './contracts';
export const validReminderTime=(at:unknown):at is string=>typeof at==='string'&&Number.isFinite(Date.parse(at))&&new Date(at).toISOString()===at;
export const validReminder=(r:unknown):r is Reminder=>!!r&&typeof r==='object'&&!Array.isArray(r)&&validReminderTime((r as Reminder).at)&&['scheduled','notified','missed','failed','cancelled'].includes((r as Reminder).state)&&((r as Reminder).attemptedAt===undefined||validReminderTime((r as Reminder).attemptedAt));
export function reminderPreset(kind:'quarter'|'hour'|'tomorrow',now=new Date()):string{
 const d=new Date(now);if(kind==='tomorrow'){d.setDate(d.getDate()+1);d.setHours(9,0,0,0);}else d.setTime(d.getTime()+(kind==='quarter'?15:60)*60000);return d.toISOString();
}
export function localReminderInput(at:string):string{const d=new Date(at),pad=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
export function parseReminderInput(value:string):string|null{const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;const at=d.toISOString();return localReminderInput(at)===value?at:null;}
export function reminderLabel(at:string,locale:string,now=new Date()):string{
 const d=new Date(at),same=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(),tomorrow=new Date(now);tomorrow.setDate(tomorrow.getDate()+1);
 const prefix=same(d,now)?(locale==='en'?'Today':'今天'):same(d,tomorrow)?(locale==='en'?'Tomorrow':'明天'):new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',...(d.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})}).format(d);
 return prefix+' '+new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
}
