import {PreferencesControl} from './PreferencesControl';
import {useLocale} from '../LocaleContext';
import {useEffect,useRef,useState,type CSSProperties,type ChangeEvent,type CompositionEvent,type FocusEvent} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Draft} from '../../shared/contracts';
import {shouldSubmit} from '../../shared/composerKeys';
import {DraftAutosaver} from '../../shared/draftAutosaver';
import {CompositionSession} from '../../shared/compositionSession';
import {ProjectOptions} from './ProjectOptions';
import {agentInkColors} from './agentInk';
import {placementPlan,type PlacementIntent} from '../../shared/ideaPlacement';
import {PlacementPicker} from './PlacementPicker';
import {ActionIcon} from './ActionIcon';
import {hasIdeaContent} from '../../shared/ideaContent';
import {ReminderControl} from './ReminderControl';
export function Composer({info}:{info:PilotInfo}){
 const {t,m,agentName}=useLocale();
 const [draft,setDraft]=useState<Draft>(info.composerContext.draft),[busy,setBusy]=useState(false),[error,setError]=useState(''),[autosaveError,setAutosaveError]=useState('');
 const text=useRef<HTMLTextAreaElement>(null),title=useRef<HTMLInputElement>(null),inFlight=useRef(false),live=useRef(true);
 const composition=useRef(new CompositionSession<'text'|'title'|'project'>());
 const [projectOpen,setProjectOpen]=useState(false);
 const [picker,setPicker]=useState(false),[reveal,setReveal]=useState(false),[reminderOpen,setReminderOpen]=useState(false),swapAnchor=useRef<HTMLSpanElement>(null);
 const plan=placementPlan(info.snapshot,info.width),filteredOut=info.shelfAgentId!=='all'&&info.shelfAgentId!==draft.agentId;
 const projectButton=useRef<HTMLButtonElement>(null),projectInput=useRef<HTMLInputElement>(null);
 const projects=[...new Set(info.snapshot.ideas.map(i=>i.project).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 useEffect(()=>{if(projectOpen)projectInput.current?.focus();},[projectOpen]);
 const autosaver=useRef<DraftAutosaver<Draft>|null>(null);
 const latest=useRef({draft,busy});latest.current={draft,busy};
 useEffect(()=>{if(error&&!busy&&!picker&&!composition.current.composing)text.current?.focus();},[error,busy,picker]);
 useEffect(()=>{
  live.current=true;
  const offPrepare=window.thoughtline.onPrepareQuit(()=>{if(!live.current||latest.current.busy||inFlight.current||composition.current.composing)return null;inFlight.current=true;autosaver.current?.pause();setBusy(true);return latest.current.draft;});
  const offError=window.thoughtline.onQuitError(message=>{inFlight.current=false;setBusy(false);setError(message);if(!composition.current.composing)autosaver.current?.resume();});
  return()=>{live.current=false;offPrepare();offError();};
 },[]);
 const editing=info.composerContext.mode==='edit';
 useEffect(()=>{
  let active=true,sequence=info.composerDraftSequence;setAutosaveError('');
  if(editing){autosaver.current=null;return;}
  const saver=new DraftAutosaver(info.composerContext.draft,async value=>{const r=await window.thoughtline.saveDraft(value,info.composerSession,++sequence);if(!r.ok)throw Error(r.message);if(active)setAutosaveError('');},()=>{if(active)setAutosaveError('草稿自动保存未成功，文字仍在窗口中；请重试保存或关闭。');});
  autosaver.current=saver;return()=>{active=false;saver.dispose();if(autosaver.current===saver)autosaver.current=null;};
 },[info.composerSession,editing]);
 const updateDraft=(next:Draft)=>{if(!live.current)return;latest.current.draft=next;setDraft(next);autosaver.current?.update(next);};
 const fieldEvents=(field:'text'|'title'|'project')=>({
  onFocus:(e:FocusEvent<HTMLInputElement|HTMLTextAreaElement>)=>{composition.current.focus(e.currentTarget);if(field==='text')closeProject();},
  onCompositionStart:(e:CompositionEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
   if(!live.current||inFlight.current)return;autosaver.current?.pause();
   const abandoned=composition.current.start(field,e.currentTarget,latest.current.draft[field],e.timeStamp);
   if(abandoned)updateDraft({...latest.current.draft,[abandoned.field]:abandoned.before});
  },
  onChange:(e:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{if((e.nativeEvent as InputEvent).isComposing&&!composition.current.owns(e.currentTarget))return;if(composition.current.accepts(e.currentTarget)&&live.current&&!inFlight.current)updateDraft({...latest.current.draft,[field]:e.currentTarget.value});},
  onCompositionEnd:(e:CompositionEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
   if(!live.current||inFlight.current)return;const completed=composition.current.end(e.currentTarget,e.timeStamp);if(!completed)return;
   updateDraft({...latest.current.draft,[completed.field]:e.currentTarget.value});autosaver.current?.resume();
  },
  onBlur:(e:FocusEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
   if(!live.current)return;const abandoned=composition.current.blur(e.currentTarget);if(!abandoned)return;
   updateDraft({...latest.current.draft,[abandoned.field]:abandoned.before});autosaver.current?.resume();
  }
 });
 const closeProject=()=>{if(projectInput.current){const abandoned=composition.current.blur(projectInput.current);if(abandoned){updateDraft({...latest.current.draft,[abandoned.field]:abandoned.before});autosaver.current?.resume();}}setProjectOpen(false);};
 const grouped=info.snapshot.clips.find(c=>c.ideaIds.includes(info.composerContext.ideaId??'')),changesAgent=editing&&grouped&&grouped.ideaIds.length>1&&draft.agentId!==grouped.agentId;
 const [splitConfirmed,setSplitConfirmed]=useState(false);
 useEffect(()=>{setDraft(info.composerContext.draft);setError('');setSplitConfirmed(false);setProjectOpen(false);setPicker(false);setReminderOpen(false);setReveal(false);text.current?.focus();},[info.composerSession]);
 const submit=async(intent:PlacementIntent={kind:plan==='full'?'save':plan==='arrange'?'arrange':'hang'},revealChoice=reveal)=>{
  if(!live.current||busy||inFlight.current||composition.current.composing)return;if(changesAgent&&!splitConfirmed){setError('保存后会移至新Agent的独立夹子，请先确认。');return;}
  inFlight.current=true;setBusy(true);setError('');try{
   await autosaver.current?.flush();if(!live.current||composition.current.composing)return;
   let revision=info.snapshot.revision;
   if(!editing){const current=await window.thoughtline.info();if(!live.current||composition.current.composing||current.composerSession!==info.composerSession)return;revision=current.snapshot.revision;}
   const r=await window.thoughtline.submit(latest.current.draft,revision,intent,revealChoice);if(!r.ok){setError(r.message);}
  }catch{setError('保存未成功，文字已保留，请重试。');}finally{inFlight.current=false;setBusy(false);}
 };
 const close=async()=>{
  if(!live.current||busy||inFlight.current||composition.current.composing)return;inFlight.current=true;setBusy(true);setError('');try{await autosaver.current?.flush();if(!live.current||composition.current.composing)return;const r=await window.thoughtline.close(latest.current.draft);if(!r.ok){setError(r.message);}}catch{setError('草稿保存未成功，文字已保留。');}finally{inFlight.current=false;setBusy(false);}
 };
 const agent=info.snapshot.agents.find(a=>a.id===draft.agentId),ink=agentInkColors(agent?.color??'#A0A3AA');
 const outline={ '--composer-agent-light':agent?.id==='general'?'#8A8E98':ink.light,'--composer-agent-dark':agent?.id==='general'?'#7B828E':agent?.color??'#7B828E' } as CSSProperties;
 return <main style={outline} data-view="composer" data-material={info.composerMaterial} data-platform={info.platform} className="composer" aria-labelledby="composer-heading" aria-busy={busy} onKeyDown={e=>{
  const isComposing=e.nativeEvent.isComposing||composition.current.composing;
  if(picker||reminderOpen)return;
  if(shouldSubmit({platform:info.platform,key:e.key,metaKey:e.metaKey,ctrlKey:e.ctrlKey,isComposing,keyCode:e.nativeEvent.keyCode})){e.preventDefault();if(!e.repeat)void submit();}
  else if(e.key==='Escape'&&!isComposing&&e.nativeEvent.keyCode!==229&&!(e.target instanceof HTMLSelectElement)){e.preventDefault();void close();}
 }}>
  <header><label id="composer-heading" className="sr-only" htmlFor="idea-text">{editing?t("编辑念头"):t("写下念头")}</label><div className="composer-name"><input ref={title} className="composer-title" aria-label={t("名称")} aria-describedby="composer-name-help" maxLength={50} disabled={busy} value={draft.title} placeholder={t("名称（可选）")} title={t("点击修改名称")} {...fieldEvents('title')}/><button type="button" className="composer-name-edit" aria-label={t("修改名称")} title={t("点击修改名称")} disabled={busy} onClick={()=>title.current?.focus()}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m10.5 2.5 3 3M3 10l7.5-7.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L6 13l-3.5.5L3 10Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div><span id="composer-name-help" className="sr-only">{t("名称可选，可点击直接编辑；留空时使用正文首行。")}</span><PreferencesControl info={info}/><button className="close" aria-label={editing?t("取消编辑并关闭"):t("保存草稿并关闭")} onClick={()=>void close()} disabled={busy}>×</button></header>
  <textarea id="idea-text" ref={text} value={draft.text} placeholder={t("先写下来，稍后交给 Agent。")} aria-describedby="composer-status composer-shortcut composer-help" aria-invalid={!!(error||autosaveError)} {...fieldEvents('text')} spellCheck={false} disabled={busy}/>
  <div id="composer-status" className="composer-status"><p className="error" role="alert">{!picker&&m(error||autosaveError)}</p>{!editing&&plan==='full'&&<span className="capacity-help">{t('绳上已满，可保存或换上一张。')}</span>}{!editing&&filteredOut&&plan!=='full'&&<label className="placement-filter"><input type="checkbox" checked={reveal} onChange={e=>setReveal(e.target.checked)}/>{t('显示全部Agent后挂上')}</label>}{changesAgent&&<label className="split-confirm"><input type="checkbox" disabled={busy} checked={splitConfirmed} onChange={e=>setSplitConfirmed(e.target.checked)}/>{t("保存后移至新Agent的独立夹子")}</label>}</div>
  <footer><div className="composer-properties"><button ref={projectButton} className="composer-project" aria-label={t("projectValue",{p0:draft.project||t("未分组")})} aria-expanded={projectOpen} aria-controls="composer-project-picker" disabled={busy} title={t("projectValue",{p0:draft.project||t("未分组")})} onClick={()=>{if(projectOpen)closeProject();else setProjectOpen(true);}}><span>{t("项目：")}</span><b>{draft.project||t("未分组")}</b><span aria-hidden="true">⌄</span></button><label className="composer-agent"><span>{t("给谁：")}</span><span className="composer-select"><select aria-label={t("念头归属 Agent")} disabled={busy} value={draft.agentId} title={agentName(agent)} onChange={e=>updateDraft({...draft,agentId:e.target.value})}>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{agentName(a)}</option>)}</select><span aria-hidden="true">⌄</span></span></label></div><div className="composer-submit"><ReminderControl at={draft.reminderAt} disabled={busy} open={reminderOpen} onOpenChange={open=>{setReminderOpen(open);if(open){closeProject();setPicker(false);}}} onChange={async at=>{updateDraft({...latest.current.draft,reminderAt:at??undefined});try{await autosaver.current?.flush();return true;}catch{return false;}}}/><span id="composer-shortcut">{info.platform==='mac'?'⌘ Enter':'Ctrl Enter'}</span>{!editing&&plan==='full'&&<span ref={swapAnchor}><button className="composer-swap" disabled={busy||!hasIdeaContent(draft)} onClick={()=>{if(!composition.current.composing){closeProject();setReminderOpen(false);setPicker(true);}}}><ActionIcon name="swap"/>{t('换上')}</button></span>}<button className="primary" disabled={busy||!hasIdeaContent(draft)||!editing&&filteredOut&&plan!=='full'&&!reveal} onClick={()=>void submit()}>{busy?t("保存中…"):editing?t("保存修改"):plan==='full'?t('保存'):plan==='arrange'?t('整理挂上'):t("挂上")}</button></div></footer>
  {picker&&<PlacementPicker anchor={swapAnchor} info={info} agentId={draft.agentId} busy={busy} error={error} onCancel={()=>setPicker(false)} onConfirm={(intent,reveal)=>void submit(intent,reveal)}/>}
  {projectOpen&&<div id="composer-project-picker" className="composer-project-picker" role="group" aria-label={t("选择或填写项目")} onKeyDown={e=>{if((e.key==='Escape'||(e.key==='Enter'&&e.target instanceof HTMLInputElement&&!e.metaKey&&!e.ctrlKey))&&!composition.current.composing&&!e.nativeEvent.isComposing&&e.nativeEvent.keyCode!==229){e.preventDefault();e.stopPropagation();closeProject();projectButton.current?.focus();}}}><ProjectOptions projects={projects} reduced={info.snapshot.settings.reducedMotion} disabled={busy} composing={()=>composition.current.composing} onChoose={p=>{closeProject();updateDraft({...latest.current.draft,project:p});projectButton.current?.focus();}} onDone={()=>{closeProject();projectButton.current?.focus();}} onDelete={async p=>{
   // Finish older draft checkpoints before deleting; the following checkpoint
   // then carries the cleared project, so autosave cannot resurrect the group.
   await autosaver.current?.flush();const current=await window.thoughtline.info();const r=await window.thoughtline.projectDelete(p,current.snapshot.revision);if(!r.ok)throw Error(r.message);
   if(latest.current.draft.project===p)updateDraft({...latest.current.draft,project:''});
  }}><label>{t("项目")}<input ref={projectInput} aria-label={t("项目")} maxLength={40} disabled={busy} value={draft.project} placeholder={t("选择已有项目，或填写新项目")} {...fieldEvents('project')}/></label></ProjectOptions></div>}
  <span id="composer-help" className="sr-only">{t("Enter 换行。")}{editing?t("Esc 取消编辑，保留原记录。"):t("Esc 保存草稿并关闭。")}{t("查找和已收起可从系统Thoughtline图标菜单打开。")}</span>
 </main>;
}
