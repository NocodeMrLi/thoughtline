import {PreferencesControl} from './PreferencesControl';
import {useLocale} from '../LocaleContext';
import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,StorageInfo} from '../../shared/bridge';
import {recordWriteHotkey} from '../../shared/composerKeys';

export function Settings({info}:{info:PilotInfo}){
 const {t,m}=useLocale();
 const [hotkey,setHotkey]=useState(info.snapshot.settings.writeHotkey);
 const [reduced,setReduced]=useState(info.snapshot.settings.reducedMotion);
 const [recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [storage,setStorage]=useState<StorageInfo|null>(null);
 useEffect(()=>{void window.thoughtline.storageInfo().then(r=>{if(r.ok)setStorage(r.value);else setError(r.message);}).catch(()=>setError('无法读取念头数据位置。'));},[info]);
 const storageAction=async(kind:'open'|'migrate'|'backup')=>{if(busy)return;setBusy(true);setError('');setNotice('');try{
  if(kind==='open'){const r=await window.thoughtline.openStorageDirectory();if(!r.ok)setError(r.message);}
  else{const r=await (kind==='migrate'?window.thoughtline.changeStorage():window.thoughtline.exportBackup());if(!r.ok)setError(r.message);else if(!r.value.canceled){if(kind==='migrate')setStorage(r.value);setNotice(kind==='migrate'?t("changedLocation",{p0:r.value.directory}):t("savedBackup",{p0:r.value.directory}));}}
 }catch{setError('操作未完成，仍使用原位置。');}finally{setBusy(false);}};
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setHotkey(info.snapshot.settings.writeHotkey);setReduced(info.snapshot.settings.reducedMotion);setRecording(false);setError('');setNotice('');},[info.manageSession]);
 useEffect(()=>{if(recording)input.current?.focus();},[recording]);
 const save=async()=>{if(busy||recording)return;setBusy(true);setError('');setNotice('');try{const r=await window.thoughtline.saveSettings({...info.snapshot.settings,writeHotkey:hotkey,reducedMotion:reduced},info.snapshot.revision);if(r.ok)setNotice('已保存。');else setError(r.message);}catch{setError('保存未成功，原快捷键保持可用。');}finally{setBusy(false);}};
 return <main data-view="manage" data-mode="settings" data-material={info.manageMaterial} data-platform={info.platform} className="manage app-settings" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();if(recording)setRecording(false);else if(!busy)void window.thoughtline.closeManage();}
 }}>
  <header><strong>{t("设置")}</strong><PreferencesControl info={info}/><button className="close" aria-label={t("关闭设置")} disabled={busy} onClick={()=>void window.thoughtline.closeManage()}>×</button></header>
  <section className="preference-settings"><h2>{t('preferences')}</h2><PreferencesControl info={info} settings/></section>
  <label htmlFor="write-hotkey">{t("写念头快捷键")}</label>
  <div className="hotkey-record"><input id="write-hotkey" ref={input} aria-label={t("写念头快捷键")} readOnly value={recording?t("请按组合键…"):hotkey} onKeyDown={e=>{
   if(!recording||e.key==='Escape')return;e.preventDefault();
   const key=recordWriteHotkey({code:e.code,metaKey:e.metaKey,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,isComposing:e.nativeEvent.isComposing||e.nativeEvent.keyCode===229},info.platform);
   if(key){setHotkey(key);setRecording(false);setError('');}
  }}/><button disabled={busy} aria-pressed={recording} onClick={()=>setRecording(!recording)}>{recording?t("取消录制"):t("录制快捷键")}</button></div>
  <p className="setting-hint">{t("使用 ⌃ / Ctrl、⌥ / Alt 或 ⌘ / Win 配合字母、数字、F键或空格。")}</p>
  {!info.hotkeyRegistered&&<p className="error" role="alert">{t("当前快捷键未注册成功，请录制其他组合后保存。")}</p>}
  <button className="text-button default-hotkey" disabled={busy} onClick={()=>{setHotkey('Control+Alt+N');setRecording(false);}}>{t("恢复默认键位")}</button>
  <label className="motion-setting"><input type="checkbox" checked={reduced} disabled={busy} onChange={e=>setReduced(e.target.checked)}/>{t("减少动态效果")}</label>
  <p className="setting-hint">{t("关闭位移和内容渐变，固定挂绳形状保持不变。")}</p>
  <fieldset className="storage-settings" disabled={busy}><legend>{t("念头数据位置")}</legend>
   <p data-storage-path>{storage?.directory??t("正在读取…")}</p>
   <div className="storage-actions"><button title={t("打开当前念头数据文件夹")} onClick={()=>void storageAction('open')}>{t("打开文件夹")}</button><button title={t("复制到新空文件夹并切换，保留旧副本")} onClick={()=>void storageAction('migrate')}>{t("更改位置")}</button><button title={t("保存独立备份，不更改当前数据位置")} onClick={()=>void storageAction('backup')}>{t("导出备份")}</button></div>
   <p className="setting-hint">{t("更改位置会保留旧副本；备份会新建独立文件夹，不更改当前位置。")}</p>
   <p className="setting-hint">{t("缓存和应用配置仍在：")}{storage?.profileDirectory??t("正在读取…")}</p>
  </fieldset>
  <p className="error" role="alert">{m(error)}</p>
  <footer><span role="status">{m(notice)}</span><button className="primary" disabled={busy||recording} onClick={()=>void save()}>{busy?t("正在处理…"):t("保存设置")}</button></footer>
 </main>;
}
