import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {recordWriteHotkey} from '../../shared/composerKeys';

export function Settings({info}:{info:PilotInfo}){
 const [hotkey,setHotkey]=useState(info.snapshot.settings.writeHotkey);
 const [reduced,setReduced]=useState(info.snapshot.settings.reducedMotion);
 const [recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{setHotkey(info.snapshot.settings.writeHotkey);setReduced(info.snapshot.settings.reducedMotion);setRecording(false);setError('');setNotice('');},[info.manageSession]);
 useEffect(()=>{if(recording)input.current?.focus();},[recording]);
 const save=async()=>{if(busy||recording)return;setBusy(true);setError('');setNotice('');try{const r=await window.thoughtline.saveSettings({writeHotkey:hotkey,reducedMotion:reduced},info.snapshot.revision);if(r.ok)setNotice('已保存。');else setError(r.message);}catch{setError('保存未成功，原快捷键保持可用。');}finally{setBusy(false);}};
 return <main data-view="manage" data-mode="settings" className="manage app-settings" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();if(recording)setRecording(false);else if(!busy)void window.thoughtline.closeManage();}
 }}>
  <header><strong>设置</strong><button className="close" aria-label="关闭设置" disabled={busy} onClick={()=>void window.thoughtline.closeManage()}>×</button></header>
  <label htmlFor="write-hotkey">写念头快捷键</label>
  <div className="hotkey-record"><input id="write-hotkey" ref={input} aria-label="写念头快捷键" readOnly value={recording?'请按组合键…':hotkey} onKeyDown={e=>{
   if(!recording||e.key==='Escape')return;e.preventDefault();
   const key=recordWriteHotkey({code:e.code,metaKey:e.metaKey,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,isComposing:e.nativeEvent.isComposing||e.nativeEvent.keyCode===229},info.platform);
   if(key){setHotkey(key);setRecording(false);setError('');}
  }}/><button disabled={busy} aria-pressed={recording} onClick={()=>setRecording(!recording)}>{recording?'取消录制':'录制快捷键'}</button></div>
  <p className="setting-hint">使用 ⌃ / Ctrl、⌥ / Alt 或 ⌘ / Win 配合字母、数字、F键或空格。</p>
  {!info.hotkeyRegistered&&<p className="error" role="alert">当前快捷键未注册成功，请录制其他组合后保存。</p>}
  <button className="text-button default-hotkey" disabled={busy} onClick={()=>{setHotkey('Control+Alt+N');setRecording(false);}}>恢复默认键位</button>
  <label className="motion-setting"><input type="checkbox" checked={reduced} disabled={busy} onChange={e=>setReduced(e.target.checked)}/>减少动态效果</label>
  <p className="setting-hint">关闭位移和内容渐变，保留挂绳下沉的最终位置。</p>
  <p className="error" role="alert">{error}</p>
  <footer><span role="status">{notice}</span><button className="primary" disabled={busy||recording} onClick={()=>void save()}>{busy?'正在保存…':'保存设置'}</button></footer>
 </main>;
}
