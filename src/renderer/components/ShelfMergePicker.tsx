import {useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {mergeTargets} from '../../shared/stackCommands';
import {ideaDay} from '../../shared/ideaHistory';
import {useLocale} from '../LocaleContext';
import {CompactPopover} from './CompactPopover';
import {SearchIcon} from './ClassificationPicker';
export function ShelfMergePicker({info,onError}:{info:PilotInfo;onError:(message:string)=>void}){
 const {t,m,agentName,locale}=useLocale(),context=info.shelfMergePicker!,anchor=useRef<HTMLSpanElement>(null),composing=useRef(false),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[cursor,setCursor]=useState(0),[error,setError]=useState('');
 const source=info.snapshot.ideas.find(i=>i.id===context.sourceId),names=new Map(info.snapshot.agents.map(a=>[a.id,agentName(a)])),targets=mergeTargets(info.snapshot,context.sourceId,query,names,info.width,{project:info.shelfProject??null,agentId:info.shelfAgentId}),project=source?.project||t('未分组');
 const close=()=>{if(!busy)void window.thoughtline.closeShelfMergePicker();};
 const choose=async(targetId:string)=>{if(busy||composing.current)return;setBusy(true);setError('');try{const r=await window.thoughtline.mergeTarget(targetId,info.snapshot.revision,context.session);if(!r.ok)setError(m(r.message));}catch{setError(t('操作未成功，请重试。'));}finally{setBusy(false);}};
 useLayoutEffect(()=>{window.dispatchEvent(new Event('thoughtline:hit-layout-refresh'));},[query,targets.length,error]);
 const date=(id:string)=>{const day=ideaDay(info.snapshot.ideas.find(i=>i.id===id)!),sameYear=day.slice(0,4)===String(new Date().getFullYear());if(!sameYear)return day;return new Intl.DateTimeFormat(locale==='zh-CN'?'zh-CN':'en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));};
 return <><span ref={anchor} style={{position:'fixed',left:context.x,top:context.y,width:1,height:1}}/>
 <CompactPopover anchor={anchor} label={t('合并')} className="classification-picker shelf-merge-picker shelf-picker" busy={busy} onClose={close} initialFocusSelector="input" hit standalone>
  <div className="shelf-picker-drag" aria-label={t('拖动面板')}><span/></div>
  <label className="classification-search"><SearchIcon/><input aria-label={t('搜索分组合并目标',{name:project})} placeholder={t('搜索分组合并目标',{name:project})} value={query} disabled={busy} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onChange={e=>{setQuery(e.target.value);setCursor(0);}} onKeyDown={e=>{if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=targets.length?(cursor+(e.key==='ArrowDown'?1:targets.length-1))%targets.length:0;setCursor(next);e.currentTarget.closest('.compact-popover')?.querySelectorAll('.merge-target')[next]?.scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();if(targets[cursor])void choose(targets[cursor].idea.id);}}}/></label>
  <div className="merge-target-list" role="listbox" aria-label={t('合并')}>{targets.map((target,n)=>{const tag=names.get(target.idea.agentId)??'',location=target.location==='hanging'?t('挂绳'):date(target.idea.id);return <button className="merge-target" role="option" aria-selected={cursor===n} data-target-idea-id={target.idea.id} data-target-location={target.location} disabled={busy} key={target.key} title={tag+' · '+target.idea.title+' · '+target.clip.ideaIds.length+' · '+(target.location==='archived'?ideaDay(target.idea):location)} onClick={()=>void choose(target.idea.id)}><i className="classification-dot" style={{background:info.snapshot.agents.find(a=>a.id===target.idea.agentId)?.color}}/><span className="merge-name"><span className="merge-tag">{tag}</span><span className="merge-separator">·</span><span className="merge-title">{target.idea.title}</span></span><span className="merge-count">{target.clip.ideaIds.length}</span><span className="merge-location">{location}</span></button>;})}{!targets.length&&<p className="shelf-filter-empty">{t('没有匹配念头')}</p>}</div>
  <div className="merge-picker-hint"><span>{t('合并数量说明',{name:project})}</span><span>{t('Esc关闭')}</span></div>{error&&<p className="error" role="alert">{error}</p>}
 </CompactPopover></>;
}
