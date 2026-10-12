import {useLocale} from '../LocaleContext';
import {useEffect,useRef,useState,type ChangeEvent,type CompositionEvent,type CSSProperties,type FocusEvent} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Draft,Idea,Result,Snapshot} from '../../shared/contracts';
import {DraftAutosaver} from '../../shared/draftAutosaver';
import {CompositionSession} from '../../shared/compositionSession';
import {registerLeaveGuard} from '../hooks/leaveGuards';
import {agentInkColors} from './agentInk';
import {paperAppearance,paperPalettes} from '../../shared/appearance';
import {ClassificationPicker,FolderIcon} from './ClassificationPicker';
export const ideaDraft=(idea:Idea):Draft=>({text:idea.text,title:idea.title,project:idea.project,agentId:idea.agentId});
export function InlineIdeaEditor({idea,info,onDone,onDraftAgentChange}:{idea:Idea;info:PilotInfo;onDone:()=>void;onDraftAgentChange?:(id:string)=>void}){
 const {t,m,agentName}=useLocale();
 const bridge=window.thoughtline;
 const [draft,setDraft]=useState(()=>info.restoredEditor?.session===info.manageSession&&info.restoredEditor.ideaId===idea.id?info.restoredEditor.draft:ideaDraft(idea)),[status,setStatus]=useState(t("已保存")),[error,setError]=useState(''),[classificationOpen,setClassificationOpen]=useState<'project'|'tag'|null>(null),[confirmAgent,setConfirmAgent]=useState(false);
 const latest=useRef(draft),base=useRef(ideaDraft(idea)),live=useRef(true),saver=useRef<DraftAutosaver<Draft>|null>(null),text=useRef<HTMLTextAreaElement>(null),composition=useRef(new CompositionSession<'text'|'title'|'project'>());
 const grouped=info.snapshot.clips.find(c=>c.ideaIds.includes(idea.id));const needsSplit=!!grouped&&grouped.ideaIds.length>1&&draft.agentId!==grouped.agentId;
 const remembering=useRef<Promise<void>|null>(null);
 const rememberProject=()=>{if(remembering.current)return remembering.current;const task=(async()=>{const current=await bridge.info(),record=current.snapshot.ideas.find(i=>i.id===idea.id);if(!record?.project||current.snapshot.projects?.includes(record.project))return;const result=await bridge.classificationChange({kind:'rememberProject',ideaId:idea.id,session:info.manageSession},current.snapshot.revision);if(!result.ok)throw Error(result.message);})().finally(()=>{if(remembering.current===task)remembering.current=null;});remembering.current=task;return task;};
 const splitAllowed=useRef(false);splitAllowed.current=confirmAgent||!needsSplit;
 useEffect(()=>{
  live.current=true;void bridge.setEditing(true,info.manageSession,idea.id).catch(()=>{});
  const worker=new DraftAutosaver(base.current,async value=>{
   if(!splitAllowed.current)throw Error(t("更改归属会将这张纸移至独立夹子，请先确认。"));
   if(live.current)setStatus(t("保存中"));const result=await bridge.updateIdea(idea.id,value,base.current,info.manageSession);if(!result.ok)throw Error(result.message);
   const saved=result.value.ideas.find(i=>i.id===idea.id);if(!saved)throw Error(t("保存后找不到原记录，请保留正文。"));base.current=ideaDraft(saved);
   // Saved records may normalize an optional name (e.g. body-derived fallback).
   // A checkpoint must never replace the live input, even when it is empty.
   if(live.current){setError('');setStatus(t(latest.current===value?"已保存":"保存中"));}
  },e=>{if(live.current){setError(e instanceof Error?e.message:'保存未成功，文字已保留。');setStatus(t("尚未保存"));}},350,1500);
  saver.current=worker;
  const off=registerLeaveGuard(async()=>{
   if(composition.current.composing){setError('请先完成中文输入法选字，当前内容已保留。');return false;}
   try{await worker.flush();await rememberProject();return true;}catch(e){if(live.current)setError(e instanceof Error?e.message:'保存未成功，文字已保留。');return false;}
  });
  return()=>{live.current=false;off();worker.dispose();saver.current=null;void bridge.setEditing(false,info.manageSession,idea.id).catch(()=>{});};
 },[idea.id,info.manageSession]);
 const update=(value:Draft)=>{latest.current=value;setDraft(value);setStatus(t("保存中"));saver.current?.update(value);};
 const events=(field:'text'|'title'|'project')=>({
  onFocus:(e:FocusEvent<HTMLInputElement|HTMLTextAreaElement>)=>composition.current.focus(e.currentTarget),
  onChange:(e:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{if((e.nativeEvent as InputEvent).isComposing&&!composition.current.owns(e.currentTarget))return;if(composition.current.accepts(e.currentTarget))update({...latest.current,[field]:e.currentTarget.value});},
  onCompositionStart:(e:CompositionEvent<HTMLInputElement|HTMLTextAreaElement>)=>{saver.current?.pause();const old=composition.current.start(field,e.currentTarget,latest.current[field],e.timeStamp);if(old)update({...latest.current,[old.field]:old.before});},
  onCompositionEnd:(e:CompositionEvent<HTMLInputElement|HTMLTextAreaElement>)=>{const completed=composition.current.end(e.currentTarget,e.timeStamp);if(completed){update({...latest.current,[completed.field]:e.currentTarget.value});saver.current?.resume();}},
  onBlur:(e:FocusEvent<HTMLInputElement|HTMLTextAreaElement>)=>{const abandoned=composition.current.blur(e.currentTarget);if(abandoned){update({...latest.current,[abandoned.field]:abandoned.before});saver.current?.resume();}}
 });
 const flush=async()=>{if(composition.current.composing){setError('请先完成输入法选字。');return false;}try{await saver.current?.flush();await rememberProject();return true;}catch(e){if(live.current)setError(e instanceof Error?e.message:'保存未成功，文字已保留。');return false;}};
 const projectButton=useRef<HTMLButtonElement>(null),tagButton=useRef<HTMLButtonElement>(null);
 const changeSeen=useRef(info.classificationChange?.sequence??0);
 useEffect(()=>{const c=info.classificationChange;if(!c||c.sequence<=changeSeen.current)return;changeSeen.current=c.sequence;if(base.current[c.field]===c.from)base.current={...base.current,[c.field]:c.to};if(latest.current[c.field]===c.from){update({...latest.current,[c.field]:c.to});if(c.field==='agentId')onDraftAgentChange?.(c.to);}},[info.classificationChange?.sequence]);
 const agent=info.snapshot.agents.find(a=>a.id===draft.agentId);
 const ink=agentInkColors(info.snapshot.agents.find(a=>a.id===draft.agentId)?.color??'#A0A3AA',paperPalettes[paperAppearance(info.snapshot.settings.paper).color]);
 return <section style={{'--editor-focus-light':ink.light,'--editor-focus-dark':ink.dark} as CSSProperties} data-inline-editor className="inline-editor" aria-label={t("原地编辑念头")} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();if(!e.nativeEvent.isComposing&&!composition.current.composing){e.preventDefault();void flush().then(ok=>{if(ok&&live.current)onDone();});}}}}>
  <input aria-label={t("编辑标题")} placeholder={t("名称（可选）")} maxLength={50} value={draft.title} {...events('title')}/>
  <textarea ref={text} aria-label={t("编辑正文")} value={draft.text} spellCheck={false} {...events('text')}/>
  <div className="inline-properties"><button ref={projectButton} className="classification-trigger" aria-label={t('分组：')+(draft.project||t('未分组'))} aria-expanded={classificationOpen==='project'} title={draft.project||t('未分组')} onClick={()=>setClassificationOpen(classificationOpen==='project'?null:'project')}><FolderIcon/><span>{draft.project||t('未分组')}</span><span aria-hidden="true">⌄</span></button><button ref={tagButton} className="classification-trigger" aria-label={t('标签：')+agentName(agent)} aria-expanded={classificationOpen==='tag'} title={agentName(agent)} onClick={()=>setClassificationOpen(classificationOpen==='tag'?null:'tag')}><span className="classification-dot" style={{background:agent?.color}}/><span>{agentName(agent)}</span><span aria-hidden="true">⌄</span></button></div>
  {classificationOpen&&<ClassificationPicker key={classificationOpen} kind={classificationOpen} anchor={classificationOpen==='project'?projectButton:tagButton} info={info} value={classificationOpen==='project'?draft.project:draft.agentId} prepare={flush} returnDraft={()=>({session:info.manageSession,ideaId:idea.id,draft:latest.current})} onClose={()=>setClassificationOpen(null)} onChoose={value=>{if(classificationOpen==='tag'){setConfirmAgent(false);onDraftAgentChange?.(value);}update({...latest.current,[classificationOpen==='project'?'project':'agentId']:value});setClassificationOpen(null);(classificationOpen==='project'?projectButton:tagButton).current?.focus();}}/>}
  {needsSplit&&<label className="inline-split-confirm"><input type="checkbox" checked={confirmAgent} onChange={e=>{setConfirmAgent(e.target.checked);if(e.target.checked){splitAllowed.current=true;void flush();}}}/>{t("更改归属会将当前纸张移至独立夹子")}</label>}
  <div className="inline-save-status"><span role="status">{m(status)}</span><button onClick={()=>void flush().then(ok=>{if(ok&&live.current)onDone();})}>{t("完成编辑")}</button>{error&&<button onClick={()=>void flush()}>{t("重试保存")}</button>}</div>
  {error&&<div className="inline-save-error"><p role="alert">{m(error)}</p></div>}
 </section>;
}
