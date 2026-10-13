import {useTransientNotice} from '../hooks/useTransientNotice';
import {shelfCapacity,type ShelfCapacity} from '../../shared/ropeGeometry';
import {registerLeaveGuard} from '../hooks/leaveGuards';
import {IconButton} from './ActionIcon';
import {PreferencesControl} from './PreferencesControl';
import {useLocale} from '../LocaleContext';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo,StorageInfo} from '../../shared/bridge';
import {recordWriteHotkey} from '../../shared/composerKeys';
import {AppearanceSettings,type CustomizerKind,type AppearancePatch} from './AppearanceSettings';
import {SettingsContact} from './SettingsContact';

type SettingsTab='appearance'|'controls'|'data';
export type SettingsDraft={hotkey:string;reduced:boolean;tab?:SettingsTab};
export function Settings({info,restore,onRemember}:{info:PilotInfo;restore?:SettingsDraft;onRemember?:(draft:SettingsDraft)=>void}){
 const {t,m}=useLocale();
 const {notice,setNotice,noticeProps}=useTransientNotice();
 const [tab,setTab]=useState<SettingsTab>(restore?.tab??'appearance');
 const [customizer,setCustomizer]=useState<CustomizerKind|null>(null);
 const content=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{if(customizer&&content.current)content.current.scrollTop=0;},[customizer]);
 const tabs=[['appearance','appearanceTab'],['controls','controlsTab'],['data','dataTab']] as const;
 const selectedTab=useRef(tab);selectedTab.current=tab;
 const [hotkey,setHotkey]=useState(restore?.hotkey??info.snapshot.settings.writeHotkey);
 const [reduced,setReduced]=useState(restore?.reduced??info.snapshot.settings.reducedMotion);
 const [recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [leavePrompt,setLeavePrompt]=useState(false);const allowLeave=useRef(false),returning=useRef(false);
 const baseline=useRef({hotkey:info.snapshot.settings.writeHotkey,reduced:info.snapshot.settings.reducedMotion});
 const prompt=useRef<HTMLDivElement>(null);
 const state=useRef({hotkey,reduced,busy,recording,dirty:false});state.current={hotkey,reduced,busy,recording,dirty:hotkey!==info.snapshot.settings.writeHotkey||reduced!==info.snapshot.settings.reducedMotion};
 useLayoutEffect(()=>()=>{onRemember?.({hotkey:state.current.hotkey,reduced:state.current.reduced,tab:selectedTab.current});},[]);
 useEffect(()=>registerLeaveGuard(async()=>{if(state.current.busy||state.current.recording)return false;if(allowLeave.current||returning.current||!state.current.dirty)return true;setLeavePrompt(true);return false;}),[]);
 const back=async()=>{if(busy||recording)return;if(customizer){setCustomizer(null);return;}returning.current=true;try{const r=await window.thoughtline.returnCalendar();if(!r.ok)setError(r.message);}catch{setError('返回失败，请重试。');}finally{returning.current=false;}};
 const [storage,setStorage]=useState<StorageInfo|null>(null);
 useEffect(()=>{void window.thoughtline.storageInfo().then(r=>{if(r.ok)setStorage(r.value);else setError(r.message);}).catch(()=>setError('无法读取念头数据位置。'));},[info]);
 const storageAction=async(kind:'open'|'migrate'|'backup')=>{if(busy)return;setBusy(true);setError('');setNotice('');try{
  if(kind==='open'){const r=await window.thoughtline.openStorageDirectory();if(!r.ok)setError(r.message);}
  else{const r=await (kind==='migrate'?window.thoughtline.changeStorage():window.thoughtline.exportBackup());if(!r.ok)setError(r.message);else if(!r.value.canceled){if(kind==='migrate')setStorage(r.value);setNotice(kind==='migrate'?t("changedLocation",{p0:r.value.directory}):t("savedBackup",{p0:r.value.directory}),4000);}}
 }catch{setError('操作未完成，仍使用原位置。');}finally{setBusy(false);}};
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setHotkey(restore?.hotkey??info.snapshot.settings.writeHotkey);setReduced(restore?.reduced??info.snapshot.settings.reducedMotion);setRecording(false);setError('');setNotice('');},[info.manageSession]);
 useEffect(()=>{const next={hotkey:info.snapshot.settings.writeHotkey,reduced:info.snapshot.settings.reducedMotion},prior=baseline.current;setHotkey(current=>current===prior.hotkey?next.hotkey:current);setReduced(current=>current===prior.reduced?next.reduced:current);baseline.current=next;},[info.snapshot.settings.writeHotkey,info.snapshot.settings.reducedMotion]);
 useEffect(()=>{if(!leavePrompt)return;const previous=document.activeElement;prompt.current?.querySelector<HTMLButtonElement>('button:last-child')?.focus();return()=>{if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[leavePrompt]);
 useEffect(()=>{if(recording)input.current?.focus();},[recording]);
 const changeCapacity=async(capacity:ShelfCapacity)=>{if(busy||recording)return;setBusy(true);setError('');try{const r=await window.thoughtline.saveSettings({...info.snapshot.settings,shelfCapacity:capacity},info.snapshot.revision);if(!r.ok)setError(r.message);}catch{setError('保存未成功，原快捷键保持可用。');}finally{setBusy(false);}};
 const applyAppearance=async(patch:AppearancePatch)=>{if(busy||recording)return false;setBusy(true);setError('');setNotice('');try{const r=await window.thoughtline.saveSettings({...info.snapshot.settings,...patch},info.snapshot.revision);if(!r.ok)setError(r.message);else setNotice('已保存。');return r.ok;}catch{setError('保存未成功，请重试。');return false;}finally{setBusy(false);}};
 const save=async()=>{if(busy||recording)return false;setBusy(true);setError('');setNotice('');try{const r=await window.thoughtline.saveSettings({...info.snapshot.settings,writeHotkey:hotkey,reducedMotion:reduced},info.snapshot.revision);if(r.ok)setNotice('已保存。');else setError(r.message);return r.ok;}catch{setError('保存未成功，原快捷键保持可用。');return false;}finally{setBusy(false);}};
 return <main data-view="manage" data-mode="settings" data-customizer={customizer??undefined} data-material={info.manageMaterial} data-platform={info.platform} className="manage app-settings" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();if(leavePrompt)setLeavePrompt(false);else if(recording)setRecording(false);else if(customizer&&!busy)setCustomizer(null);else if(!busy)void window.thoughtline.closeManage();}
  if(leavePrompt&&e.key==='Tab'){const buttons=[...prompt.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]],at=buttons.indexOf(document.activeElement as HTMLButtonElement);if(buttons.length){e.preventDefault();buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}
 }}>
  <header><IconButton icon="back" label={t(customizer?'返回外观设置':'返回Thoughtline日历')} disabled={busy||recording} onClick={()=>void back()}/><strong>{t(customizer==='rope'?'定制挂绳':customizer==='paper'?'定制纸张':"存储与设置")}</strong><PreferencesControl info={info}/><button className="close" aria-label={t("关闭设置")} disabled={busy} onClick={()=>void window.thoughtline.closeManage()}>×</button></header>
  <nav className="settings-tabs" role="tablist" aria-label={t('settingsSections')} onKeyDown={e=>{
   const index=tabs.findIndex(([value])=>value===tab);const next=e.key==='ArrowRight'?(index+1)%3:e.key==='ArrowLeft'?(index+2)%3:e.key==='Home'?0:e.key==='End'?2:null;
   if(next!==null&&!busy&&!recording){e.preventDefault();setCustomizer(null);setTab(tabs[next][0]);e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();}
  }}>{tabs.map(([value,label])=><button key={value} id={`settings-tab-${value}`} role="tab" aria-selected={tab===value} aria-controls={`settings-panel-${value}`} tabIndex={tab===value?0:-1} disabled={busy||recording} onClick={()=>{setCustomizer(null);setTab(value);}}>{t(label)}</button>)}</nav>
  <div ref={content} className={`settings-content ${customizer?'is-customizing':''}`}>
  <section id="settings-panel-appearance" role="tabpanel" aria-labelledby="settings-tab-appearance" hidden={tab!=='appearance'}>
  <section className="preference-settings" hidden={!!customizer}><h2>{t('appearanceTab')}</h2><PreferencesControl info={info} settings/><div className="capacity-preference"><span>{t("绳上夹子数量")}</span><div role="group" aria-label={t("绳上夹子数量")}>{([4,6,8] as const).map(n=><button key={n} disabled={busy||recording} aria-pressed={shelfCapacity(info.snapshot.settings.shelfCapacity)===n} onClick={()=>void changeCapacity(n)}>{n}</button>)}</div><small>{t("默认6个；便签按屏幕空间等比例适配，减少数量仍保留全部内容。")}</small></div></section>
  <AppearanceSettings info={info} busy={busy||recording} kind={customizer} onCustomize={setCustomizer} onApply={applyAppearance}/>
  </section>
  <section id="settings-panel-controls" role="tabpanel" aria-labelledby="settings-tab-controls" hidden={tab!=='controls'}>
  <section className="settings-module hotkey-setting">
  <label htmlFor="write-hotkey">{t("写念头快捷键")}</label>
  <div className="hotkey-record"><input id="write-hotkey" ref={input} aria-label={t("写念头快捷键")} readOnly value={recording?t("请按组合键…"):hotkey} onKeyDown={e=>{
   if(!recording||e.key==='Escape')return;e.preventDefault();
   const key=recordWriteHotkey({code:e.code,metaKey:e.metaKey,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,isComposing:e.nativeEvent.isComposing||e.nativeEvent.keyCode===229},info.platform);
   if(key){setHotkey(key);setRecording(false);setError('');}
  }}/><button disabled={busy} aria-pressed={recording} onClick={()=>setRecording(!recording)}>{recording?t("取消录制"):t("录制快捷键")}</button></div>
  <p className="setting-hint">{t("使用 ⌃ / Ctrl、⌥ / Alt 或 ⌘ / Win 配合字母、数字、F键或空格。")}</p>
  {!info.hotkeyRegistered&&<p className="error" role="alert">{t("当前快捷键未注册成功，请录制其他组合后保存。")}</p>}
  <button className="text-button default-hotkey" disabled={busy} onClick={()=>{setHotkey('Control+Alt+N');setRecording(false);}}>{t("恢复默认键位")}</button>
  </section><section className="settings-module">
  <label className="motion-setting"><input type="checkbox" checked={reduced} disabled={busy} onChange={e=>setReduced(e.target.checked)}/>{t("减少动态效果")}</label>
  <p className="setting-hint">{t("关闭位移和内容渐变，固定挂绳形状保持不变。")}</p>
  </section></section>
  <section id="settings-panel-data" role="tabpanel" aria-labelledby="settings-tab-data" hidden={tab!=='data'}>
  <section className="storage-settings" role="group" aria-labelledby="storage-heading"><h2 id="storage-heading">{t("念头数据位置")}</h2>
   <p data-storage-path>{storage?.directory??t("正在读取…")}</p>
   <div className="storage-actions"><button disabled={busy} title={t("打开当前念头数据文件夹")} onClick={()=>void storageAction('open')}>{t("打开文件夹")}</button><button disabled={busy} title={t("复制到新空文件夹并切换，保留旧副本")} onClick={()=>void storageAction('migrate')}>{t("更改位置")}</button><button disabled={busy} title={t("保存独立备份，不更改当前数据位置")} onClick={()=>void storageAction('backup')}>{t("导出备份")}</button></div>
   <p className="setting-hint">{t("更改位置会保留旧副本；备份会新建独立文件夹，不更改当前位置。")}</p>
   <p className="setting-hint">{t("缓存和应用配置仍在：")}{storage?.profileDirectory??t("正在读取…")}</p>
  </section></section></div>
  <p className="error" role="alert">{m(error)}</p>
  <div className="settings-footer"><footer><span role="status" {...noticeProps}>{m(notice)||(state.current.dirty?t("设置尚未保存"):"")}</span>{tab==='controls'&&<button className="primary" disabled={busy||recording} onClick={()=>void save()}>{busy?t("正在处理…"):t("保存设置")}</button>}</footer><SettingsContact info={info} disabled={busy||recording} section={tab+':'+(customizer??'')}/></div>
  {leavePrompt&&<div ref={prompt} className="settings-leave-prompt" role="dialog" aria-modal="true" aria-label={t("设置尚未保存")}><p>{t("设置尚未保存，要保存后关闭吗？")}</p><button disabled={busy} onClick={async()=>{if(await save()){allowLeave.current=true;try{await window.thoughtline.closeManage();}finally{allowLeave.current=false;}}}}>{t("保存并关闭")}</button><button disabled={busy} onClick={async()=>{setHotkey(info.snapshot.settings.writeHotkey);setReduced(info.snapshot.settings.reducedMotion);setLeavePrompt(false);allowLeave.current=true;try{await window.thoughtline.closeManage();}finally{allowLeave.current=false;}}}>{t("放弃修改")}</button><button disabled={busy} onClick={()=>setLeavePrompt(false)}>{t("继续编辑")}</button></div>}
 </main>;
}
