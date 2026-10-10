import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {PlacementIntent} from '../../shared/ideaPlacement';
import {layoutClips} from '../../shared/clipLayout';
import {ideaDay} from '../../shared/ideaHistory';
import {useLocale} from '../LocaleContext';
import {ActionIcon} from './ActionIcon';
export function PlacementPicker({info,agentId,sourceId,busy,error='',onCancel,onConfirm}:{info:PilotInfo;agentId:string;sourceId?:string;busy:boolean;error?:string;onCancel:()=>void;onConfirm:(intent:PlacementIntent,reveal:boolean)=>void}){
 const {t,m,agentName}=useLocale(),dialog=useRef<HTMLDivElement>(null);
 const [choice,setChoice]=useState<{clipId:string;ideaId:string;expectedIds:string[];wholeClip:boolean}|null>(null),[older,setOlder]=useState(false),[reveal,setReveal]=useState(false);
 const currentFilter=info.shelfAgentId,hidden=currentFilter!=='all'&&currentFilter!==agentId;
 const targets=layoutClips(info.snapshot.clips,info.width).visible.filter(p=>(currentFilter==='all'||p.clip.agentId===currentFilter)&&!p.clip.ideaIds.includes(sourceId??''));
 const boundary=new Date();boundary.setDate(boundary.getDate()-2);const day=[boundary.getFullYear(),String(boundary.getMonth()+1).padStart(2,'0'),String(boundary.getDate()).padStart(2,'0')].join('-');
 const rows=targets.map(p=>({clip:p.clip,idea:info.snapshot.ideas.find(i=>i.id===p.clip.currentId)!})).sort((a,b)=>ideaDay(b.idea).localeCompare(ideaDay(a.idea)));
 const recent=rows.filter(r=>ideaDay(r.idea)>=day),displayed=older||!recent.length?rows:recent;
 const valid=choice&&targets.some(p=>p.clip.id===choice.clipId&&JSON.stringify(p.clip.ideaIds)===JSON.stringify(choice.expectedIds));
 const picked=choice&&info.snapshot.ideas.find(i=>i.id===choice.ideaId);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
 useEffect(()=>{if(!busy&&error&&!dialog.current?.contains(document.activeElement))dialog.current?.querySelector<HTMLButtonElement>('.placement-confirm .primary:not(:disabled),button:not(:disabled)')?.focus();},[busy,error]);
 return <div ref={dialog} className="placement-picker" role="dialog" aria-modal="true" aria-label={t('换上')} onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!busy)onCancel();}
  if(e.key==='Tab'){const nodes=[...dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled)')??[]],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 }}>
  <div className="placement-heading"><button aria-label={t('返回')} disabled={busy} onClick={onCancel}><ActionIcon name="back"/></button><strong>{t('选择换下的念头')}</strong>{recent.length<rows.length&&recent.length>0&&<button className="text-button" onClick={()=>setOlder(!older)}>{older?t('近3天'):t('更早')}</button>}</div>
  {error&&<p className="error" role="alert">{m(error)}</p>}
  <div className="placement-targets">{displayed.map(({clip,idea})=>{
   const chosen=choice?.clipId===clip.id,cross=clip.ideaIds.length>1&&clip.agentId!==agentId;
   return <div className="placement-target" key={clip.id} data-chosen={chosen}><button disabled={busy} aria-pressed={chosen} onClick={()=>setChoice({clipId:clip.id,ideaId:clip.currentId,expectedIds:[...clip.ideaIds],wholeClip:cross})}>
    <span className="placement-mini-paper" aria-hidden="true">{idea.text.slice(0,60)}</span><span className="placement-target-text"><strong>{idea.title}</strong><small>{agentName(info.snapshot.agents.find(a=>a.id===clip.agentId))} · {ideaDay(idea)}{clip.ideaIds.length>1?` · ${clip.ideaIds.length}`:''}</small><span>{cross?t('swapWhole',{count:clip.ideaIds.length}):t('换下一张')}</span></span>
   </button>{chosen&&clip.ideaIds.length>1&&!cross&&<select aria-label={t('选择夹子中的一张')} disabled={busy} value={choice!.ideaId} onChange={e=>setChoice({...choice!,ideaId:e.target.value})}>{clip.ideaIds.map(id=><option key={id} value={id}>{info.snapshot.ideas.find(i=>i.id===id)?.title}</option>)}</select>}</div>;
  })}{!targets.length&&<p className="empty-list">{t('没有可换下的可见夹子。')}</p>}</div>
  {hidden&&<label className="placement-filter"><input type="checkbox" checked={reveal} onChange={e=>setReveal(e.target.checked)}/>{t('显示全部Agent后挂上')}</label>}
  <div className="placement-confirm"><span role="status">{choice&&!valid?t('目标夹子已变化，请重新选择。'):picked?(choice!.wholeClip?t('swapWholePreview',{count:choice!.expectedIds.length}):t('swapPreview',{title:picked.title})):t('旧念头会收起，内容保留。')}</span><button className="primary" disabled={busy||!valid||hidden&&!reveal} onClick={()=>valid&&choice&&onConfirm({kind:'swap',targetClipId:choice.clipId,targetIdeaId:choice.ideaId,expectedIds:choice.expectedIds,wholeClip:choice.wholeClip},reveal)}>{busy?t('保存中…'):t('换上')}</button></div>
 </div>;
}
