import {useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {filterTagOptions,matchingClipIds} from '../../shared/ideaVisibility';
import {useLocale} from '../LocaleContext';
import {CompactPopover} from './CompactPopover';
import {SearchIcon} from './ClassificationPicker';
export function ShelfFilterPicker({info,onError}:{info:PilotInfo;onError:(message:string)=>void}){
 const {t,agentName}=useLocale(),anchor=useRef<HTMLSpanElement>(null),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[cursor,setCursor]=useState(0);
 const project=info.shelfProject??null,options=filterTagOptions(info.snapshot,project).filter(a=>agentName(a).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),ids=['all',...options.map(a=>a.id)];
 const close=()=>{if(!busy)void window.thoughtline.closeShelfFilterPicker();};
 const choose=async(agentId:string)=>{if(busy)return;setBusy(true);try{const r=await window.thoughtline.setShelfFilter({project,agentId});if(!r.ok)onError(r.message);}catch{onError(t('筛选未成功，请重试。'));}finally{setBusy(false);}};
 useLayoutEffect(()=>{window.dispatchEvent(new Event('thoughtline:hit-layout-refresh'));},[query,options.length]);
 return <><span ref={anchor} style={{position:'fixed',left:info.shelfFilterPicker!.x,top:info.shelfFilterPicker!.y,width:1,height:1}}/>
 <CompactPopover anchor={anchor} label={t('筛选 Agent')} className="classification-picker shelf-filter-picker shelf-picker" busy={busy} onClose={close} initialFocusSelector="input" hit>
  <label className="classification-search"><SearchIcon/><input aria-label={project===null?t('搜索全部标签'):t('搜索分组标签',{name:project||t('未分组')})} placeholder={project===null?t('搜索全部标签'):t('搜索分组标签',{name:project||t('未分组')})} value={query} onChange={e=>{setQuery(e.target.value);setCursor(0);}} onKeyDown={e=>{if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=(cursor+(e.key==='ArrowDown'?1:ids.length-1))%ids.length;setCursor(next);const rows=e.currentTarget.closest('.compact-popover')?.querySelectorAll('.shelf-filter-row');if(next>0)rows?.[next-1]?.scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();void choose(ids[cursor]??'all');}}}/></label>
  <button className="shelf-filter-all" disabled={busy} aria-pressed={info.shelfAgentId==='all'} onClick={()=>void choose('all')}>{t('全部 Agent')}<span>{info.shelfAgentId==='all'?'✓':''}</span></button>
  <div className="classification-choices" role="listbox" aria-label={t('筛选 Agent')}>{options.map((a,n)=><button role="option" aria-selected={info.shelfAgentId===a.id} className="shelf-filter-row" data-cursor={cursor===n+1} disabled={busy} key={a.id} onClick={()=>void choose(a.id)}><i className="classification-dot" style={{background:a.color}}/><span>{agentName(a)}</span><small>{info.snapshot.clips.reduce((sum,c)=>sum+matchingClipIds(info.snapshot,c,{project,agentId:a.id}).length,0)}</small><b>{info.shelfAgentId===a.id?'✓':''}</b></button>)}{!options.length&&<p className="shelf-filter-empty">{t('没有匹配标签')}</p>}</div>

 </CompactPopover></>;
}
