// SPDX-License-Identifier: GPL-3.0-only
import {useEffect,useRef,useState} from 'react';
import type {Idea,Snapshot} from '../../shared/contracts';
import type {PilotInfo} from '../../shared/bridge';
import {storedClipFor} from '../../shared/clipModel';
import {prepareLeave} from '../hooks/leaveGuards';
import {useClipPage} from '../hooks/useClipPage';
import {useLocale} from '../LocaleContext';
import {IdeaReader} from './IdeaReader';
export function CalendarStackReader({idea,info,onSelect,initialEdit,onSplit}:{idea:Idea;info:PilotInfo;onSelect:(id:string)=>void;initialEdit:boolean;onSplit?:(ids:string[],snapshot:Snapshot)=>void}){
 const {t,agentName}=useLocale(),[titles,setTitles]=useState(false),[error,setError]=useState('');
 const clip=storedClipFor(info.snapshot,idea.id),page=useClipPage(clip,setError),ids=clip?.ideaIds??[idea.id];
 const latest=useRef({id:idea.id,ids,page,session:info.manageSession});latest.current={id:idea.id,ids,page,session:info.manageSession};
 const alive=useRef(true),queue=useRef(Promise.resolve());useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const choose=(id:string)=>{const session=info.manageSession;queue.current=queue.current.then(async()=>{if(!alive.current||latest.current.session!==session||!await prepareLeave()||!alive.current||latest.current.session!==session||!latest.current.ids.includes(id))return;latest.current.page.choose(id);latest.current.id=id;setTitles(false);onSelect(id);}).catch(()=>{if(alive.current)setError(t('最后修改尚未保存，请重试。'));});};
 const flip=(step:number)=>{const session=info.manageSession;queue.current=queue.current.then(async()=>{if(!alive.current||latest.current.session!==session||!await prepareLeave()||!alive.current||latest.current.session!==session)return;const next=latest.current.ids[latest.current.ids.indexOf(latest.current.id)+step];if(next){latest.current.page.choose(next);latest.current.id=next;setTitles(false);onSelect(next);}}).catch(()=>{if(alive.current)setError(t('最后修改尚未保存，请重试。'));});};
 const toggle=async()=>{const session=info.manageSession;if(await prepareLeave()&&alive.current&&latest.current.session===session)setTitles(value=>!value);};
 const index=ids.indexOf(idea.id),navigation=ids.length>1&&<nav className="detail-pager" aria-label={t('便签切换')}><button aria-label={t('上一张便签')} disabled={index<=0} onClick={()=>flip(-1)}>‹</button><button aria-label={t('打开本夹标题列表')} onClick={()=>void toggle()}>{index+1}/{ids.length}</button><button aria-label={t('下一张便签')} disabled={index>=ids.length-1} onClick={()=>flip(1)}>›</button></nav>;
 return <>{titles?<div className="calendar-stack-titles"><div className="clip-titles" aria-label={t('本夹便签标题')}>{ids.map(id=>{const row=info.snapshot.ideas.find(i=>i.id===id)!;return <button key={id} aria-pressed={id===idea.id} onClick={()=>choose(id)}><i className="classification-dot" style={{background:info.snapshot.agents.find(a=>a.id===row.agentId)?.color}}/><span className="clip-title-tag">{agentName(info.snapshot.agents.find(a=>a.id===row.agentId))}</span><span className="clip-title-name">{row.title}</span></button>;})}</div><div className="reader-pager-row">{navigation}</div></div>:<IdeaReader key={idea.id+':'+info.manageSession} idea={idea} info={info} initialEdit={initialEdit} navigation={navigation} onSplit={onSplit}/>} {error&&<p role="alert" className="error">{error}</p>}</>;
}
