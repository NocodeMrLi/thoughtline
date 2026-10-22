// SPDX-License-Identifier: GPL-3.0-only
import {storedClipFor} from '../../shared/clipModel';
import {classificationLabel} from '../../shared/classification';
import {PreferencesControl} from './PreferencesControl';
import {useLocale} from '../LocaleContext';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {matchingClipIds} from '../../shared/ideaVisibility';
import {flushPageSelections,useClipPage} from '../hooks/useClipPage';
import {prepareLeave} from '../hooks/leaveGuards';
import {IdeaReader} from './IdeaReader';
import {IconButton} from './ActionIcon';

export function Detail({info}:{info:PilotInfo}){
 const {t,m,agentName}=useLocale();
 const [error,setError]=useState(''),[titles,setTitles]=useState(info.manageTitles),[selected,setSelected]=useState<string|null|undefined>(undefined);
 const [editRequest,setEditRequest]=useState<{session:number;ideaId:string}|null>(null);
 const trackedId=selected===undefined?info.manageSelection:selected;
 const clip=storedClipFor(info.snapshot,trackedId??'');
 const filter={project:info.shelfProject??null,agentId:info.shelfAgentId},filtered=!!clip&&info.snapshot.clips.includes(clip)&&(filter.project!==null||filter.agentId!=='all');
 const matching=clip?matchingClipIds(info.snapshot,clip,filter):[],ids=filtered&&matching.length?matching:clip?.ideaIds??[];
 const page=useClipPage(clip,setError,filtered&&clip?{ids,key:clip.id+JSON.stringify(filter)}:undefined);
 const visibleId=selected!==undefined?selected:(info.snapshot.ideas.some(i=>i.id===info.manageSelection&&i.status!=='deleted')?info.manageSelection:null)??(clip?.ideaIds.includes(page.id)?page.id:null)??clip?.ideaIds[0]??info.manageSelection;
 const idea=info.snapshot.ideas.find(i=>i.id===visibleId&&i.status!=='deleted');
 const index=ids.indexOf(idea?.id??'')??-1;
 useEffect(()=>{setTitles(info.manageTitles);setSelected(undefined);setEditRequest(null);setError('');},[info.manageSession]);
 useEffect(()=>{if(info.manageEditingRequested&&info.manageSelection)setEditRequest({session:info.manageSession,ideaId:info.manageSelection});},[info.manageEditingRequested,info.manageSession,info.manageSelection]);
 const live=useRef(true),session=useRef(info.manageSession),intent=useRef(0);
 session.current=info.manageSession;
 useEffect(()=>{live.current=true;return()=>{live.current=false;intent.current++;};},[]);
 const owned=(at:number)=>live.current&&session.current===at;
 const latest=useRef({clip,page,visibleId,ids});latest.current={clip,page,visibleId,ids};
 const priorReader=useRef<{session:number;intent:number;id:string|null|undefined;ids:string[]}|null>(null);
 useLayoutEffect(()=>{
  const prior=priorReader.current;
  if(prior&&prior.session===info.manageSession&&prior.intent===intent.current&&prior.id===visibleId&&visibleId&&!idea){
   const at=prior.ids.indexOf(visibleId),available=new Set(info.snapshot.ideas.filter(i=>i.status!=='deleted').map(i=>i.id));
   setSelected([...prior.ids.slice(at+1),...prior.ids.slice(0,at).reverse()].find(id=>available.has(id))??null);
  }
  priorReader.current={session:info.manageSession,intent:intent.current,id:visibleId,ids:clip?.ideaIds??[]};
 },[info.snapshot,info.manageSession,visibleId]);
 const selectionQueue=useRef(Promise.resolve());
 // Queued flips share session ownership so fast sequential clicks are all kept.
 const choose=(id:string)=>{const at=info.manageSession;selectionQueue.current=selectionQueue.current.then(async()=>{if(!owned(at)||!await prepareLeave()||!owned(at))return;const current=latest.current;if(!current.ids.includes(id))return;intent.current++;current.page.choose(id);current.visibleId=id;setSelected(id);setTitles(false);setEditRequest(null);}).catch(()=>{if(owned(at))setError('最后修改尚未保存，请重试。');});};
 const flip=(step:number)=>{const at=info.manageSession;selectionQueue.current=selectionQueue.current.then(async()=>{if(!owned(at)||!await prepareLeave()||!owned(at))return;const current=latest.current,index=current.ids.indexOf(current.visibleId||current.page.current()||'')??-1;const next=current.ids[index+step];if(next){intent.current++;current.page.choose(next);current.visibleId=next;setSelected(next);setTitles(false);setEditRequest(null);}}).catch(()=>{if(owned(at))setError('最后修改尚未保存，请重试。');});};
 const toggleTitles=async()=>{const at=info.manageSession,token=++intent.current;if(await prepareLeave()&&owned(at)&&intent.current===token)setTitles(value=>!value);};
 const undo=()=>{const at=info.manageSession;selectionQueue.current=selectionQueue.current.then(async()=>{if(!owned(at))return;const token=++intent.current,valid=()=>owned(at)&&intent.current===token;try{if(!await prepareLeave()||!valid())return;await flushPageSelections();if(!valid())return;const current=await window.thoughtline.info();if(!valid()||current.manageSession!==at)return;const r=await window.thoughtline.clipChange({kind:'undo'},current.snapshot.revision);if(valid()&&!r.ok)setError(r.message);}catch{if(valid())setError('操作未成功，请重试。');}});};
 const navigation=clip&&clip.ideaIds.length>1&&<nav className="detail-pager" aria-label={t("便签切换")}><button aria-label={t("上一张便签")} disabled={index<=0} onClick={()=>flip(-1)}>‹</button><button aria-label={t("打开本夹标题列表")} onMouseDown={e=>e.preventDefault()} onClick={()=>void toggleTitles()}>{index+1}/{ids.length}</button><button aria-label={t("下一张便签")} disabled={index>=ids.length-1} onClick={()=>flip(1)}>›</button></nav>;
 return <main data-view="manage" data-mode="detail" data-material={info.manageMaterial} data-platform={info.platform} className="manage compact-detail" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();if(titles)setTitles(false);else void window.thoughtline.closeManage();}
  if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement)return;
  if(e.key==='ArrowLeft'){e.preventDefault();flip(-1);}if(e.key==='ArrowRight'){e.preventDefault();flip(1);}
 }}>
  <header><span>{classificationLabel(idea?.project,agentName(info.snapshot.agents.find(a=>a.id===idea?.agentId)))}</span><div className="detail-header-actions"><IconButton icon="calendar" label={t("念头日历")} onClick={()=>void window.thoughtline.openManage()}/><PreferencesControl info={info}/><button className="close" aria-label={t("关闭详情")} onClick={()=>void window.thoughtline.closeManage()}>×</button></div></header>
  {idea?<>
   {filtered&&clip&&<p className="clip-filter-count">{t('筛选数量',{visible:ids.length,total:clip.ideaIds.length})}</p>}
   {titles&&clip?<><div className="detail-heading"><strong>{idea.title}</strong></div><div className="clip-titles" aria-label={t("本夹便签标题")}>{ids.map(id=>{const row=info.snapshot.ideas.find(i=>i.id===id);return row&&<button key={id} aria-pressed={id===idea.id} onClick={()=>choose(id)}><i className="classification-dot" style={{background:info.snapshot.agents.find(a=>a.id===row.agentId)?.color}}/><span className="clip-title-tag">{agentName(info.snapshot.agents.find(a=>a.id===row.agentId))}</span><span className="clip-title-name">{row.title}</span></button>;})}</div><div className="reader-pager-row">{navigation}</div></>:<IdeaReader heading={<strong>{idea.title}</strong>} navigation={navigation} key={idea.id+':'+info.manageSession} idea={idea} info={info} initialEdit={editRequest?.session===info.manageSession&&editRequest.ideaId===idea.id}/>}
  </>:<p className="empty-list">{t("这张纸已移到最近删除，或当前夹子为空。可在念头日历查看。")}</p>}
  <footer className="detail-bottom">{info.canUndoClips&&<IconButton icon="undo" label={t(info.undoActionLabel??(info.undoPlacementKind==='swap'?'撤销换上':info.undoPlacementKind==='hang'?'撤销挂上':'撤销整理'))} onClick={()=>void undo()}/>}</footer>{error&&<p role="alert" className="error">{m(error)}</p>}
 </main>;
}
