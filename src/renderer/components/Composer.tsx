import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Draft} from '../../shared/contracts';
import {shouldSubmit} from '../../shared/composerKeys';
export function Composer({info}:{info:PilotInfo}){
 const [draft,setDraft]=useState<Draft>(info.composerContext.draft),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const text=useRef<HTMLTextAreaElement>(null),inFlight=useRef(false),composing=useRef(false);
 const latest=useRef({draft,busy});latest.current={draft,busy};
 useEffect(()=>{if(error&&!busy)text.current?.focus();},[error,busy]);
 useEffect(()=>{
  const offPrepare=window.thoughtline.onPrepareQuit(()=>{if(latest.current.busy||inFlight.current)return null;inFlight.current=true;setBusy(true);return latest.current.draft;});
  const offError=window.thoughtline.onQuitError(message=>{inFlight.current=false;setBusy(false);setError(message);});
  return()=>{offPrepare();offError();};
 },[]);
 const editing=info.composerContext.mode==='edit';
 const grouped=info.snapshot.clips.find(c=>c.ideaIds.includes(info.composerContext.ideaId??'')),changesAgent=editing&&grouped&&grouped.ideaIds.length>1&&draft.agentId!==grouped.agentId;
 const [splitConfirmed,setSplitConfirmed]=useState(false);
 useEffect(()=>{setDraft(info.composerContext.draft);setError('');setSplitConfirmed(false);composing.current=false;text.current?.focus();},[info.composerSession]);
 const submit=async()=>{
  if(busy||inFlight.current)return;if(changesAgent&&!splitConfirmed){setError('保存后会移至新Agent的独立夹子，请先确认。');return;}
  inFlight.current=true;setBusy(true);setError('');try{const r=await window.thoughtline.submit(draft,info.snapshot.revision);if(!r.ok){setError(r.message);}}catch{setError('保存未成功，文字已保留，请重试。');}finally{inFlight.current=false;setBusy(false);}
 };
 const close=async(browse=false)=>{
  if(busy||inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{const r=await window.thoughtline.close(draft);if(!r.ok){setError(r.message);}else if(browse){const opened=await window.thoughtline.openManage();if(!opened.ok)setError(opened.message);}}catch{setError('草稿保存未成功，文字已保留。');}finally{inFlight.current=false;setBusy(false);}
 };
 return <main data-view="composer" data-platform={info.platform} className="composer" aria-labelledby="composer-heading" aria-busy={busy} onKeyDown={e=>{
  const isComposing=e.nativeEvent.isComposing||composing.current;
  if(shouldSubmit({platform:info.platform,key:e.key,metaKey:e.metaKey,ctrlKey:e.ctrlKey,isComposing,keyCode:e.nativeEvent.keyCode})){e.preventDefault();if(!e.repeat)void submit();}
  else if(e.key==='Escape'&&!isComposing&&e.nativeEvent.keyCode!==229&&!(e.target instanceof HTMLSelectElement)){e.preventDefault();void close();}
 }}>
  <header><label id="composer-heading" htmlFor="idea-text">{editing?'编辑念头':'写下念头'}</label><button className="close" aria-label={editing?'取消编辑并关闭':'保存草稿并关闭'} onClick={()=>void close()} disabled={busy}>×</button></header>
  <textarea id="idea-text" ref={text} value={draft.text} placeholder="先写下来，稍后交给 Agent。" aria-describedby="composer-status composer-shortcut" aria-invalid={!!error} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onChange={e=>setDraft({...draft,text:e.target.value})} spellCheck={false} disabled={busy}/>
  <div className="composer-tools"><label className="composer-agent"><span>给谁</span><span className="composer-select"><i aria-hidden="true" style={{backgroundColor:info.snapshot.agents.find(a=>a.id===draft.agentId)?.color}}/><select aria-label="念头归属 Agent" disabled={busy} value={draft.agentId} onChange={e=>setDraft({...draft,agentId:e.target.value})}>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></span></label><button className="text-button" disabled={busy} onClick={()=>void close(true)}>查找 / 已收起</button></div>
  <details className="composer-details"><summary>名称与项目 <span>可选</span></summary><div className="composer-optional"><label>名称<input maxLength={50} disabled={busy} value={draft.title} placeholder="留空时取正文首行" onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>项目<input maxLength={40} disabled={busy} value={draft.project} placeholder="便于之后找回" onChange={e=>setDraft({...draft,project:e.target.value})}/></label></div></details>
  <div id="composer-status" className="composer-status"><p className="error" role="alert">{error}</p>{changesAgent&&<label className="split-confirm"><input type="checkbox" disabled={busy} checked={splitConfirmed} onChange={e=>setSplitConfirmed(e.target.checked)}/>保存后移至新Agent的独立夹子</label>}</div>
  <footer><span id="composer-shortcut">{info.platform==='mac'?'⌘ Enter':'Ctrl Enter'} {editing?'保存':'挂上'}<small>Enter 换行 · Esc {editing?'取消编辑':'保存草稿'}</small></span><button className="primary" disabled={busy||!draft.text.trim()} onClick={()=>void submit()}>{busy?'正在保存…':editing?'保存修改':'挂上'}</button></footer>
 </main>;
}
