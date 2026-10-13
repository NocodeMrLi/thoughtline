import {useEffect,useRef,useState} from 'react';
import {useLocale} from '../LocaleContext';
import type {Reminder} from '../../shared/contracts';
import type {NotificationAccess} from '../../shared/bridge';
import {localReminderInput,parseReminderInput,reminderLabel,reminderPreset} from '../../shared/reminderTime';
import {ActionIcon,IconButton} from './ActionIcon';
import {CompactPopover} from './CompactPopover';
export function ReminderControl({at,state,disabled=false,open,onOpenChange,onChange,compact=false}:{at?:string;state?:Reminder['state'];disabled?:boolean;compact?:boolean;open:boolean;onOpenChange:(open:boolean)=>void;onChange:(at:string|null)=>Promise<boolean>}){
 const {t,m,locale}=useLocale(),anchor=useRef<HTMLSpanElement>(null),[custom,setCustom]=useState(false),[value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[access,setAccess]=useState<NotificationAccess['status']|null>(null),live=useRef(true);
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 useEffect(()=>{if(open){setCustom(false);setValue(localReminderInput(at??reminderPreset('hour')));setError('');void window.thoughtline.notificationAccess(false).then(r=>{if(live.current&&r.ok)setAccess(r.value.status);});}},[open]);
 const commit=async(next:string|null)=>{
  if(busy)return;if(next&&Date.parse(next)<=Date.now()){setError(t('请选择未来的提醒时间。'));return;}setBusy(true);setError('');
  try{if(next){const r=await window.thoughtline.notificationAccess(true);if(!live.current)return;if(r.ok)setAccess(r.value.status);else setError(r.message);}if(await onChange(next)&&live.current)onOpenChange(false);}catch{if(live.current)setError(t('提醒未能保存，请重试。'));}finally{if(live.current)setBusy(false);}
 };
 const warning=access==='denied'?t('系统通知已关闭'):access==='unsupported'?t('系统通知不可用'):access==='unknown'?t('暂时无法确认通知权限'):null;
 return <span className={"reminder-control"+(compact?" reminder-control-compact":"")} ref={anchor}>
  {compact?<IconButton icon="bell" label={at?t('提醒：')+reminderLabel(at,locale)+(state==='failed'?' · '+t('通知未确认'):state==='cancelled'?' · '+t('已取消'):'')+(warning?' · '+warning:''):t('设置提醒')} data-reminder-time={at} data-reminder-state={state} aria-pressed={!!at} aria-expanded={open} disabled={disabled||busy} onClick={()=>onOpenChange(!open)}/>:at?<button className="reminder-chip" data-reminder-time={at} data-reminder-state={state??'scheduled'} aria-label={t('提醒：')+reminderLabel(at,locale)} aria-expanded={open} disabled={disabled||busy} onClick={()=>onOpenChange(!open)}><ActionIcon name="bell"/><time dateTime={at}>{reminderLabel(at,locale)}</time>{state==='failed'&&<span>{t('通知未确认')}</span>}{state==='cancelled'&&<span>{t('已取消')}</span>}</button>:<IconButton icon="bell" label={t('设置提醒')} aria-expanded={open} disabled={disabled||busy} onClick={()=>onOpenChange(!open)}/>}
  {warning&&!open&&at&&!compact&&<span className="reminder-warning">{warning}</span>}
  {open&&<CompactPopover anchor={anchor} label={t('提醒')} className="reminder-popover" busy={busy} onClose={()=>onOpenChange(false)}>
   <div className="popover-heading"><strong>{t('提醒')}</strong><button disabled={busy} onClick={()=>onOpenChange(false)} aria-label={t('关闭提醒面板')}>×</button></div>
   {compact&&at&&<p className="reminder-current-time">{t('提醒：')+reminderLabel(at,locale)}{state==='failed'?' · '+t('通知未确认'):state==='cancelled'?' · '+t('已取消'):''}</p>}
   {!custom?<div className="reminder-options"><button disabled={busy} onClick={()=>void commit(reminderPreset('quarter'))}>{t('15分钟后')}</button><button disabled={busy} onClick={()=>void commit(reminderPreset('hour'))}>{t('1小时后')}</button><button disabled={busy} onClick={()=>void commit(reminderPreset('tomorrow'))}>{t('明天上午09:00')}</button><button disabled={busy} onClick={()=>setCustom(true)}>{t('自选时间')}</button></div>:<form onSubmit={e=>{e.preventDefault();const next=parseReminderInput(value);if(!next||Date.parse(next)<=Date.now())setError(t('请选择未来的提醒时间。'));else void commit(next);}}><label>{t('提醒时间')}<input type="datetime-local" autoFocus aria-label={t('提醒时间')} disabled={busy} value={value} onChange={e=>{setValue(e.target.value);setError('');}}/></label><div className="popover-form-actions"><button type="button" disabled={busy} onClick={()=>setCustom(false)}>{t('返回')}</button><button className="primary" disabled={busy}>{t('设置提醒')}</button></div></form>}
   {at&&<button className="reminder-cancel" disabled={busy} onClick={()=>void commit(null)}>{t('取消提醒')}</button>}
   {warning&&<p className="reminder-warning">{warning} · {t('将使用顶部轻提醒')} <button disabled={busy} onClick={()=>void window.thoughtline.openNotificationSettings()}>{t('通知设置')}</button></p>}
   {error&&<p className="error" role="alert">{m(error)}</p>}
  </CompactPopover>}
 </span>;
}
