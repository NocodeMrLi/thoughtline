// SPDX-License-Identifier: GPL-3.0-only
import {app,Notification} from 'electron';
import storeIdentity from '../shared/storeIdentity.json';
import {execFile} from 'node:child_process';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {NotificationAccess} from '../shared/bridge';
import type {Snapshot} from '../shared/contracts';
import {showNotification} from '../shared/notificationDelivery';
const notificationAppId=()=>process.windowsStore?`${storeIdentity.packageFamilyName}!${storeIdentity.applicationId}`:'com.nocodemrli.thoughtline';
export async function notificationAccess(request=false):Promise<NotificationAccess>{
 if(!Notification.isSupported())return {status:'unsupported'};
 if(process.platform==='darwin')return new Promise(resolve=>{
  let finished=false;const finish=(status:unknown)=>{if(finished)return;finished=true;clearTimeout(timer);resolve({status:['granted','denied','not-determined'].includes(String(status))?status as NotificationAccess['status']:'unknown'});},timer=setTimeout(()=>finish('unknown'),request?20000:4000);
  try{const native=createRequire(__filename)(join(__dirname,'notification-permission.node')) as {getStatus:(request:boolean,callback:(status:string)=>void)=>void};native.getStatus(request,finish);}catch{finish('unknown');}
 });
 if(process.platform==='win32')return new Promise(resolve=>{
  execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',`[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] > $null; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${notificationAppId()}').Setting.ToString()`],{timeout:4000,windowsHide:true},(error,out)=>resolve({status:error?'unknown':out.trim()==='Enabled'?'granted':out.trim().startsWith('Disabled')?'denied':'unknown'}));
 });
 return {status:'unknown'};
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const short=(s:string,max=180)=>{let result='';for(const c of s.replace(/\s+/g,' ')){if(Buffer.byteLength(result+c)>max-3)return result+'…';result+=c;}return result;};
export class ReminderNotifications{
 private active=new Map<string,{notice:Notification;id:string;at:string}>();
 constructor(private snapshot:()=>Snapshot,private locale:()=>string,private open:(id:string)=>Promise<void>){
  if(process.platform==='win32'){app.setAppUserModelId(notificationAppId());if(process.windowsStore)app.setToastActivatorCLSID(storeIdentity.toastClsid);Notification.handleActivation(activation=>{const params=new URLSearchParams(activation.arguments),id=params.get('idea'),at=params.get('at');if(id&&at)this.click(id,at);});}
 }
 private click(id:string,at:string){const idea=this.snapshot().ideas.find(i=>i.id===id&&i.status!=='deleted'&&i.reminder?.at===at&&['notified','missed'].includes(i.reminder.state));if(idea)void this.open(id).catch(()=>{});}
 sync(){for(const [key,item] of this.active){const idea=this.snapshot().ideas.find(i=>i.id===item.id);if(!idea||idea.status==='deleted'||idea.reminder?.at!==item.at||!['notified','missed'].includes(idea.reminder.state)){item.notice.close();this.active.delete(key);}}}
 async restore(){if(process.platform!=='darwin'||!this.snapshot().ideas.some(i=>i.status!=='deleted'&&i.reminder&&['notified','missed'].includes(i.reminder.state)))return;try{for(const notice of await Notification.getHistory()){const idea=this.snapshot().ideas.find(i=>i.reminder&&this.key(i.id,i.reminder.at)===notice.id&&i.status!=='deleted'&&['notified','missed'].includes(i.reminder.state));if(idea){notice.once('click',()=>this.click(idea.id,idea.reminder!.at));this.active.set(notice.id,{notice,id:idea.id,at:idea.reminder!.at});}}}catch{/* History unavailable never blocks startup. */}}
 private key(id:string,at:string){return createHash('sha256').update(id+'\0'+at).digest('hex').slice(0,16);}
 async show(ids:string[],missed:boolean){
  const access=await notificationAccess();if(['denied','unsupported','not-determined'].includes(access.status))return false;
  const idea=this.snapshot().ideas.find(i=>ids.includes(i.id)&&i.status!=='deleted'&&i.reminder&&['notified','missed'].includes(i.reminder.state));if(!idea?.reminder)return true;
  const en=this.locale()==='en',at=idea.reminder.at,id=this.key(idea.id,at),title=short(ids.length>1?(en?`${ids.length} missed reminders`:`${ids.length} 条错过的提醒`):(missed?(en?'Missed reminder: ':'错过的提醒：'):'')+idea.title,120),body=short(idea.text||idea.title,220),launch=new URLSearchParams({idea:idea.id,at}).toString();
  const notice=new Notification({title,body,silent:true,id,groupId:'ThoughtlineReminders',...(process.platform==='win32'?{toastXml:`<toast launch="${escape(launch)}"><visual><binding template="ToastGeneric"><text>${escape(title)}</text><text>${escape(body)}</text></binding></visual></toast>`}:{})});
  this.active.set(id,{notice,id:idea.id,at});notice.once('close',()=>{if(this.active.get(id)?.notice===notice)this.active.delete(id);});
  return showNotification(notice,()=>{if(process.platform!=='win32')this.click(idea.id,at);});
 }
}
