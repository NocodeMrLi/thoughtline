import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Draft} from '../../shared/contracts';
import {shouldSubmit} from '../../shared/composerKeys';
export function Composer({info}:{info:PilotInfo}){
 const [draft,setDraft]=useState<Draft>(info.composerContext.draft);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const text=useRef<HTMLTextAreaElement>(null);
 const latest=useRef({draft,busy});latest.current={draft,busy};
 useEffect(()=>{
  const offPrepare=window.thoughtline.onPrepareQuit(()=>{if(latest.current.busy)return null;setBusy(true);return latest.current.draft;});
  const offError=window.thoughtline.onQuitError(message=>{setBusy(false);setError(message);text.current?.focus();});
  return()=>{offPrepare();offError();};
 },[]);
 const editing=info.composerContext.mode==='edit';
 const grouped=info.snapshot.clips.find(c=>c.ideaIds.includes(info.composerContext.ideaId??''));const changesAgent=editing&&grouped&&grouped.ideaIds.length>1&&draft.agentId!==grouped.agentId;const [splitConfirmed,setSplitConfirmed]=useState(false);
 useEffect(()=>{setDraft(info.composerContext.draft);setError('');setSplitConfirmed(false);text.current?.focus();},[info.composerSession]);
 const submit=async()=>{if(busy)return;if(changesAgent&&!splitConfirmed){setError('保存后会移至新Agent的独立夹子，请先确认。');return;}setBusy(true);setError('');try{const r=await window.thoughtline.submit(draft,info.snapshot.revision);if(!r.ok)setError(r.message);}catch{setError('保存未成功，文字已保留，请重试。');}finally{setBusy(false);}};
 const close=async(browse=false)=>{if(busy)return;setBusy(true);setError('');try{const r=await window.thoughtline.close(draft);if(!r.ok)setError(r.message);else if(browse){const opened=await window.thoughtline.openManage();if(!opened.ok)setError(opened.message);}}catch{setError('草稿保存未成功，文字已保留。');}finally{setBusy(false);}};
 return <main data-view="composer" className="composer" onKeyDown={e=>{
  if(shouldSubmit({platform:info.platform,key:e.key,metaKey:e.metaKey,ctrlKey:e.ctrlKey,isComposing:e.nativeEvent.isComposing,keyCode:e.nativeEvent.keyCode})){e.preventDefault();void submit();}
  else if(e.key==='Escape'&&!e.nativeEvent.isComposing&&e.nativeEvent.keyCode!==229){e.preventDefault();void close();}
 }}>
  <header><label htmlFor="idea-text">{editing?'编辑念头':'写下念头'}</label><button className="close" aria-label={editing?'取消编辑并关闭':'保存草稿并关闭'} onClick={()=>void close()} disabled={busy}>×</button></header>
  <textarea id="idea-text" ref={text} value={draft.text} placeholder="写下来，稍后交给 Agent。" onChange={e=>setDraft({...draft,text:e.target.value})} spellCheck={false} disabled={busy}/>
  <div className="agents" role="group" aria-label="给哪个Agent">{info.snapshot.agents.map(a=><button key={a.id} aria-pressed={draft.agentId===a.id} disabled={busy} onClick={()=>setDraft({...draft,agentId:a.id})}><i style={{backgroundColor:a.color}}/>{a.name}</button>)}</div>
  <label className="title-input">名称 / 找回标签（可选）<input maxLength={50} disabled={busy} value={draft.title} placeholder="不填时使用正文首个非空行" onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
  <details><summary>项目（可选）</summary><div className="optional"><label>项目<input maxLength={40} disabled={busy} value={draft.project} onChange={e=>setDraft({...draft,project:e.target.value})}/></label></div></details>
  <p className="error" role="alert">{error}</p>{changesAgent&&<label className="split-confirm"><input type="checkbox" checked={splitConfirmed} onChange={e=>setSplitConfirmed(e.target.checked)}/>保存后移至新Agent的独立夹子</label>}
  <footer><div><span>{info.platform==='mac'?'⌘ Enter':'Ctrl Enter'} {editing?'保存':'挂上'} · Enter换行</span><button className="text-button" disabled={busy} onClick={()=>void close(true)}>查找 / 已收起</button></div><button className="primary" disabled={busy||!draft.text.trim()} onClick={()=>void submit()}>{busy?'正在保存…':editing?'保存修改':'挂上'}</button></footer>
 </main>;
}
