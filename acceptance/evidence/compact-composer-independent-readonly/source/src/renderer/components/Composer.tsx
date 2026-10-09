import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Draft} from '../../shared/contracts';
import {shouldSubmit} from '../../shared/composerKeys';
import {DraftAutosaver} from '../../shared/draftAutosaver';
import {agentInkColors} from './agentInk';
export function Composer({info}:{info:PilotInfo}){
 const [draft,setDraft]=useState<Draft>(info.composerContext.draft),[busy,setBusy]=useState(false),[error,setError]=useState(''),[autosaveError,setAutosaveError]=useState('');
 const text=useRef<HTMLTextAreaElement>(null),inFlight=useRef(false),composing=useRef(false);
 const autosaver=useRef<DraftAutosaver<Draft>|null>(null);
 const latest=useRef({draft,busy});latest.current={draft,busy};
 useEffect(()=>{if(error&&!busy)text.current?.focus();},[error,busy]);
 useEffect(()=>{
  const offPrepare=window.thoughtline.onPrepareQuit(()=>{if(latest.current.busy||inFlight.current)return null;inFlight.current=true;autosaver.current?.pause();setBusy(true);return latest.current.draft;});
  const offError=window.thoughtline.onQuitError(message=>{inFlight.current=false;setBusy(false);setError(message);autosaver.current?.resume();});
  return()=>{offPrepare();offError();};
 },[]);
 const editing=info.composerContext.mode==='edit';
 useEffect(()=>{
  let active=true,sequence=info.composerDraftSequence;setAutosaveError('');
  if(editing){autosaver.current=null;return;}
  const saver=new DraftAutosaver(info.composerContext.draft,async value=>{const r=await window.thoughtline.saveDraft(value,info.composerSession,++sequence);if(!r.ok)throw Error(r.message);if(active)setAutosaveError('');},()=>{if(active)setAutosaveError('草稿自动保存未成功，文字仍在窗口中；请重试保存或关闭。');});
  autosaver.current=saver;return()=>{active=false;saver.dispose();if(autosaver.current===saver)autosaver.current=null;};
 },[info.composerSession,editing]);
 const updateDraft=(next:Draft)=>{setDraft(next);autosaver.current?.update(next);};
 const grouped=info.snapshot.clips.find(c=>c.ideaIds.includes(info.composerContext.ideaId??'')),changesAgent=editing&&grouped&&grouped.ideaIds.length>1&&draft.agentId!==grouped.agentId;
 const [splitConfirmed,setSplitConfirmed]=useState(false);
 useEffect(()=>{setDraft(info.composerContext.draft);setError('');setSplitConfirmed(false);composing.current=false;text.current?.focus();},[info.composerSession]);
 const submit=async()=>{
  if(busy||inFlight.current)return;if(changesAgent&&!splitConfirmed){setError('保存后会移至新Agent的独立夹子，请先确认。');return;}
  inFlight.current=true;setBusy(true);setError('');try{await autosaver.current?.flush();const revision=editing?info.snapshot.revision:(await window.thoughtline.info()).snapshot.revision;const r=await window.thoughtline.submit(draft,revision);if(!r.ok){setError(r.message);}}catch{setError('保存未成功，文字已保留，请重试。');}finally{inFlight.current=false;setBusy(false);}
 };
 const close=async()=>{
  if(busy||inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{await autosaver.current?.flush();const r=await window.thoughtline.close(draft);if(!r.ok){setError(r.message);}}catch{setError('草稿保存未成功，文字已保留。');}finally{inFlight.current=false;setBusy(false);}
 };
 const agent=info.snapshot.agents.find(a=>a.id===draft.agentId),ink=agentInkColors(agent?.color??'#A0A3AA');
 const outline={ '--composer-agent-light':agent?.id==='general'?'#8A8E98':ink.light,'--composer-agent-dark':agent?.id==='general'?'#7B828E':agent?.color??'#7B828E' } as CSSProperties;
 return <main style={outline} data-view="composer" data-material={info.composerMaterial} data-platform={info.platform} className="composer" aria-labelledby="composer-heading" aria-busy={busy} onKeyDown={e=>{
  const isComposing=e.nativeEvent.isComposing||composing.current;
  if(shouldSubmit({platform:info.platform,key:e.key,metaKey:e.metaKey,ctrlKey:e.ctrlKey,isComposing,keyCode:e.nativeEvent.keyCode})){e.preventDefault();if(!e.repeat)void submit();}
  else if(e.key==='Escape'&&!isComposing&&e.nativeEvent.keyCode!==229&&!(e.target instanceof HTMLSelectElement)){e.preventDefault();void close();}
 }}>
  <header><label id="composer-heading" htmlFor="idea-text">{editing?'编辑念头':'写下念头'}</label><button className="close" aria-label={editing?'取消编辑并关闭':'保存草稿并关闭'} onClick={()=>void close()} disabled={busy}>×</button></header>
  <textarea id="idea-text" ref={text} value={draft.text} placeholder="先写下来，稍后交给 Agent。" aria-describedby="composer-status composer-shortcut composer-help" aria-invalid={!!(error||autosaveError)} onCompositionStart={()=>{composing.current=true;autosaver.current?.pause();}} onCompositionEnd={()=>{composing.current=false;autosaver.current?.resume();}} onChange={e=>updateDraft({...draft,text:e.target.value})} spellCheck={false} disabled={busy}/>
  <div className="composer-optional"><label><span className="sr-only">名称（可选）</span><input aria-label="名称" maxLength={50} disabled={busy} value={draft.title} placeholder="名称（可选）" title="留空时使用正文首行" onChange={e=>updateDraft({...draft,title:e.target.value})}/></label><label><span className="sr-only">项目（可选）</span><input aria-label="项目" maxLength={40} disabled={busy} value={draft.project} placeholder="项目（可选）" onChange={e=>updateDraft({...draft,project:e.target.value})}/></label></div>
  <div id="composer-status" className="composer-status"><p className="error" role="alert">{error||autosaveError}</p>{changesAgent&&<label className="split-confirm"><input type="checkbox" disabled={busy} checked={splitConfirmed} onChange={e=>setSplitConfirmed(e.target.checked)}/>保存后移至新Agent的独立夹子</label>}</div>
  <footer><label className="composer-agent"><span className="sr-only">念头归属 Agent</span><span className="composer-select"><i aria-hidden="true" style={{backgroundColor:agent?.color}}/><select aria-label="念头归属 Agent" disabled={busy} value={draft.agentId} onChange={e=>updateDraft({...draft,agentId:e.target.value})}>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></span></label><div className="composer-submit"><span id="composer-shortcut">{info.platform==='mac'?'⌘ Enter':'Ctrl Enter'}</span><button className="primary" disabled={busy||!draft.text.trim()} onClick={()=>void submit()}>{busy?'保存中…':editing?'保存修改':'挂上'}</button></div></footer>
  <span id="composer-help" className="sr-only">Enter 换行。{editing?'Esc 取消编辑，保留原记录。':'Esc 保存草稿并关闭。'}查找和已收起可从系统Thoughtline图标菜单打开。</span>
 </main>;
}
