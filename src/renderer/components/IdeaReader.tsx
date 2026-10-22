// SPDX-License-Identifier: GPL-3.0-only
import {storedClipFor} from '../../shared/clipModel';
import {matchesShelfFilter} from '../../shared/ideaVisibility';
import {useTransientNotice} from '../hooks/useTransientNotice';
import {countThoughts} from '../../shared/i18n';
import {useLocale} from '../LocaleContext';
import {useCallback,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {paperStyle} from './PaperAppearance';
import {agentInkColors} from './agentInk';
import {paperAppearance,paperPalettes} from '../../shared/appearance';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Idea,Result,Snapshot} from '../../shared/contracts';
import {prepareLeave} from '../hooks/leaveGuards';
import {flushPageSelections} from '../hooks/useClipPage';
import {InlineIdeaEditor} from './InlineIdeaEditor';
import {ActionFeedback,type ActionFeedbackEntry} from './ActionFeedback';
import {IconButton,ActionIcon} from './ActionIcon';
import {placementPlan} from '../../shared/ideaPlacement';
import {onLineIdeaIds} from '../../shared/ideaVisibility';
import {PlacementPicker} from './PlacementPicker';
import {ReaderMoreMenu} from './ReaderMoreMenu';
import {ReminderControl} from './ReminderControl';
export function IdeaReader({idea,info,initialEdit=false,heading,navigation,onSplit}:{idea:Idea;info:PilotInfo;initialEdit?:boolean;heading?:ReactNode;navigation?:ReactNode;onSplit?:(ids:string[],snapshot:Snapshot)=>void}){
 const {t,m,locale}=useLocale();
 const {notice,setNotice,noticeProps}=useTransientNotice();
 const [feedback,setFeedback]=useState<ActionFeedbackEntry|null>(null);const feedbackSequence=useRef(0);
 const anchorFor=(button:HTMLButtonElement,duration:number)=>{const r=button.getBoundingClientRect();return {left:r.x+r.width/2,top:r.top>42?r.top-30:Math.min(innerHeight-30,r.bottom+6),duration};};
 const [draftAgent,setDraftAgent]=useState<string|null>(null);
 const [editing,setEditing]=useState(initialEdit),[menu,setMenu]=useState(false),[permanent,setPermanent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [picker,setPicker]=useState(false),[reveal,setReveal]=useState(false),[reminderOpen,setReminderOpen]=useState(false),moreAnchor=useRef<HTMLSpanElement>(null),swapAnchor=useRef<HTMLSpanElement>(null);
 const closeMenu=useCallback(()=>{setMenu(false);setPermanent(false);},[]);
 const plan=placementPlan(info.snapshot,info.width,idea.id),filteredOut=!matchesShelfFilter(idea,{agentId:info.shelfAgentId,project:info.shelfProject??null});
 const onLine=idea.status==='hanging'&&onLineIdeaIds(info.snapshot,info.width,info.shelfAgentId,info.shelfProject??null).has(idea.id);
 useEffect(()=>{setMenu(false);setPermanent(false);setReminderOpen(false);setPicker(false);setError('');setNotice('');setFeedback(null);},[idea.id,info.manageSession]);
 useEffect(()=>{if(initialEdit)setEditing(true);},[initialEdit]);
 const live=useRef(true),operation=useRef(0),pending=useRef(false),owner=useRef({session:info.manageSession,id:idea.id});
 owner.current={session:info.manageSession,id:idea.id};
 useEffect(()=>{live.current=true;return()=>{live.current=false;operation.current++;};},[]);
 const checkpoint=()=>{const token=++operation.current,session=info.manageSession,id=idea.id;return ()=>live.current&&operation.current===token&&owner.current.session===session&&owner.current.id===id;};
 const finishEdit=async()=>{const current=checkpoint();if(await prepareLeave()&&current())setEditing(false);};
 const clip=storedClipFor(info.snapshot,idea.id),deleted=(idea.status as string)==='deleted';
 const run=async(task:(current:PilotInfo)=>Promise<Result<unknown>>,message:string|(()=>string)='',anchor?:{left:number;top:number;duration:number},onSuccess?:(value:unknown)=>void)=>{
  if(pending.current)return;const currentOwner=checkpoint();pending.current=true;setBusy(true);setError('');setNotice('');
  try{
   if(!await prepareLeave()||!currentOwner())return;
   await flushPageSelections();if(!currentOwner())return;
   const current=await window.thoughtline.info();if(!currentOwner()||current.manageSession!==info.manageSession)return;
   const result=await task(current);if(!currentOwner())return;
   if(!result.ok){setError(result.message);return;}const text=typeof message==='function'?message():message;if(anchor)setFeedback({...anchor,text,id:++feedbackSequence.current});else setNotice(text);setMenu(false);setPermanent(false);setPicker(false);onSuccess?.(result.value);
  }catch{if(currentOwner())setError('操作未成功，原文已保留，请重试。');}
  finally{if(currentOwner()){pending.current=false;setBusy(false);}}
 };
 const change=(c:ClipMutation,message:string)=>run(current=>window.thoughtline.clipChange(c,current.snapshot.revision),message,undefined,['split','splitAll'].includes(c.kind)?value=>onSplit?.(clip?.ideaIds??[idea.id],value as Snapshot):undefined);
 const history=(kind:'delete'|'restore'|'permanent',anchor?:{left:number;top:number;duration:number})=>{let message=kind==='delete'?t('已移到最近删除，可恢复。'):kind==='restore'?t('已恢复'):t('已永久删除。');return run(async current=>{
  const result=await window.thoughtline.ideaHistory(idea.id,kind,current.snapshot.revision);
  if(result.ok&&kind==='restore'){const restored=result.value.ideas.find(i=>i.id===idea.id);if(idea.deletedFrom==='hanging'&&restored?.status==='archived')message=t('已恢复 · 留在日历');else if(restored?.status==='hanging'&&!matchesShelfFilter(restored,{agentId:current.shelfAgentId,project:current.shelfProject??null}))message=t('已恢复 · 当前筛选未显示');}
  return result;
 },()=>{if(anchor&&message!==t('已恢复'))anchor.duration=4000;return message;},anchor);};
 const changeReminder=async(at:string|null)=>{
  if(pending.current)return false;const currentOwner=checkpoint();pending.current=true;setBusy(true);setError('');
  try{if(!await prepareLeave()||!currentOwner())return false;const current=await window.thoughtline.info();if(!currentOwner()||current.manageSession!==info.manageSession)return false;const record=current.snapshot.ideas.find(i=>i.id===idea.id);if(!record)return false;const r=await window.thoughtline.setReminder(idea.id,at,record.reminder??null,current.manageSession);if(!r.ok&&currentOwner())setError(r.message);return r.ok;}catch{if(currentOwner())setError(t('提醒未能保存，请重试。'));return false;}finally{if(currentOwner()){pending.current=false;setBusy(false);}}
 };
 const paper=paperAppearance(info.snapshot.settings.paper),agent=info.snapshot.agents.find(a=>a.id===(editing&&draftAgent||idea.agentId)),ink=agentInkColors(agent?.color??'#A0A3AA',paperPalettes[paper.color]);
 return <section className="idea-reader" data-reader-id={idea.id}>
  <div className="reader-paper" data-reader-paper-color={paper.color} data-reader-agent-color={agent?.color??'#A0A3AA'} style={{...paperStyle(paper),'--reader-accent-light':ink.light,'--reader-accent-dark':ink.dark} as CSSProperties}>
  {!editing&&<div className="reader-paper-heading">{heading??<strong>{idea.title}</strong>}</div>}
  {editing&&!deleted?<InlineIdeaEditor key={idea.id+':'+info.manageSession} idea={idea} info={info} onDraftAgentChange={setDraftAgent} onDone={()=>{setEditing(false);setDraftAgent(null);}}/>:<textarea data-full-text readOnly aria-label={t("完整正文，可手动选中复制")} value={idea.text}/>}
  </div>

  {navigation&&<div className="reader-pager-row">{navigation}</div>}
  <div className="reader-toolbar" aria-label={t("念头操作")}>
  {!deleted&&<span className="reader-toolbar-reminder"><ReminderControl compact at={idea.reminder?.at} state={idea.reminder?.state} disabled={busy} open={reminderOpen} onOpenChange={open=>{setReminderOpen(open);if(open){setPicker(false);closeMenu();}}} onChange={changeReminder}/></span>}
   <IconButton suppressTooltip={!!feedback} icon="copy" label={t("复制正文")} disabled={busy} onClick={e=>void run(()=>window.thoughtline.copy(idea.id),t("已复制"),anchorFor(e.currentTarget,1600))}/>
   {!deleted&&<><IconButton suppressTooltip={!!feedback} icon="edit" label={editing?t("完成编辑"):t("编辑")} disabled={busy} aria-pressed={editing} onClick={()=>{if(editing)void finishEdit();else setEditing(true);}}/><span ref={swapAnchor}><IconButton suppressTooltip={!!feedback} icon={onLine&&!filteredOut?'archive':plan==='full'?'swap':'restore'} label={onLine&&!filteredOut?t("收起当前念头"):plan==='full'?t('换上'):plan==='arrange'?t('整理挂上'):t("重新挂上")} disabled={busy||filteredOut&&plan!=='full'&&!reveal} onClick={()=>{if(onLine&&!filteredOut)void run(current=>window.thoughtline.setStatus(idea.id,'archived',current.snapshot.revision));else if(plan==='full'){setReminderOpen(false);closeMenu();setPicker(true);}else void run(current=>window.thoughtline.placeIdea(idea.id,{kind:plan==='arrange'?'arrange':'hang'},current.snapshot.revision,reveal,current.manageSession));}}/></span>{clip&&clip.ideaIds.length>1&&<IconButton suppressTooltip={!!feedback} icon="split" label={t("拆分")} disabled={busy} onClick={()=>void change({kind:'split',id:clip.id,ideaId:idea.id},t("已拆出当前纸张。"))}/>}</>}
   {deleted&&<IconButton suppressTooltip={!!feedback} icon="restore" label={t("恢复念头")} disabled={busy} onClick={e=>void history('restore',anchorFor(e.currentTarget,2500))}/>}
   <span ref={moreAnchor}><IconButton suppressTooltip={!!feedback} icon="more" label={t("更多操作")} disabled={busy} aria-expanded={menu} onClick={()=>{setMenu(!menu);setPermanent(false);}}/></span>
  </div>
  {menu&&<ReaderMoreMenu anchor={moreAnchor} onClose={closeMenu} label={t("更多念头操作")}>
   {!deleted&&clip&&clip.ideaIds.length>1&&<><button disabled={busy} onClick={()=>void change({kind:'splitAll',id:clip.id},t("已全部拆开，可撤销。"))}><ActionIcon name="split"/>{t('splitAll',{count:countThoughts(locale,clip.ideaIds.length)})}</button>{idea.status==='hanging'&&<button disabled={busy} onClick={()=>void change({kind:'archiveAll',id:clip.id},t("已收起整个夹子，可撤销。"))}><ActionIcon name="archive"/>{t('archiveClip',{count:countThoughts(locale,clip.ideaIds.length)})}</button>}</>}
   {!deleted?<button disabled={busy} onClick={()=>void history('delete')}><ActionIcon name="delete"/>{t("删除当前念头（1张，可恢复）")}</button>:<><button disabled={busy} onClick={()=>setPermanent(true)}><ActionIcon name="delete"/>{t("永久删除当前念头")}</button>{permanent&&<div className="permanent-confirm"><p>{t("永久删除这1张纸，无法恢复。")}</p><button disabled={busy} onClick={()=>void history('permanent')}>{t("确认永久删除这条念头")}</button><button onClick={()=>setPermanent(false)}>{t("取消")}</button></div>}</>}
  </ReaderMoreMenu>}
  {!deleted&&filteredOut&&plan!=='full'&&<label className="placement-filter"><input type="checkbox" checked={reveal} onChange={e=>setReveal(e.target.checked)}/>{t('显示全部Agent后挂上')}</label>}
  {picker&&<PlacementPicker anchor={swapAnchor} info={info} sourceId={idea.id} agentId={idea.agentId} project={idea.project} busy={busy} error={error} onCancel={()=>setPicker(false)} onConfirm={(intent,reveal)=>void run(current=>window.thoughtline.placeIdea(idea.id,intent,current.snapshot.revision,reveal,current.manageSession),t('已换上，旧念头已收起。'))}/>}
  <ActionFeedback entry={feedback} onDone={()=>setFeedback(null)}/><p className="reader-notice" role="status" {...noticeProps}>{m(notice)}</p>{error&&!picker&&<p className="error" role="alert">{m(error)}</p>}
 </section>;
}
