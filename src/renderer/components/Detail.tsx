import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {useClipPage} from '../hooks/useClipPage';
import {prepareLeave} from '../hooks/leaveGuards';
import {IdeaReader} from './IdeaReader';
import {IconButton} from './ActionIcon';

export function Detail({info}:{info:PilotInfo}){
 const [error,setError]=useState(''),[titles,setTitles]=useState(info.manageTitles),[selected,setSelected]=useState<string|null>(null);
 const [editRequest,setEditRequest]=useState<{session:number;ideaId:string}|null>(null);
 const trackedId=selected??info.manageSelection;
 const clip=info.snapshot.clips.find(c=>c.ideaIds.includes(trackedId??''));
 const page=useClipPage(clip,setError);
 const visibleId=selected??(info.snapshot.ideas.some(i=>i.id===info.manageSelection&&i.status!=='deleted')?info.manageSelection:null)??(clip?.ideaIds.includes(page.id)?page.id:null)??clip?.ideaIds[0]??info.manageSelection;
 const idea=info.snapshot.ideas.find(i=>i.id===visibleId&&i.status!=='deleted');
 const index=clip?.ideaIds.indexOf(idea?.id??'')??-1;
 useEffect(()=>{setTitles(info.manageTitles);setSelected(null);setEditRequest(null);setError('');},[info.manageSession]);
 useEffect(()=>{if(info.manageEditingRequested&&info.manageSelection)setEditRequest({session:info.manageSession,ideaId:info.manageSelection});},[info.manageEditingRequested,info.manageSession,info.manageSelection]);
 const selectionQueue=useRef(Promise.resolve());
 const choose=(id:string)=>{selectionQueue.current=selectionQueue.current.then(async()=>{if(!await prepareLeave())return;if(!clip?.ideaIds.includes(id))return;page.choose(id);setSelected(id);setTitles(false);setEditRequest(null);}).catch(()=>setError('最后修改尚未保存，请重试。'));};
 const flip=(step:number)=>{selectionQueue.current=selectionQueue.current.then(async()=>{if(!await prepareLeave())return;const at=clip?.ideaIds.indexOf(page.current()||visibleId||'')??-1;const next=clip?.ideaIds[at+step];if(next){page.choose(next);setSelected(next);setTitles(false);setEditRequest(null);}}).catch(()=>setError('最后修改尚未保存，请重试。'));};
 const removed=()=>{const ids=clip?.ideaIds??[];const at=ids.indexOf(idea?.id??'');const next=ids[at+1]??ids[at-1]??null;setSelected(next);};
 return <main data-view="manage" data-mode="detail" data-material={info.manageMaterial} data-platform={info.platform} className="manage compact-detail" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();if(titles)setTitles(false);else void window.thoughtline.closeManage();}
  if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement)return;
  if(e.key==='ArrowLeft'){e.preventDefault();flip(-1);}if(e.key==='ArrowRight'){e.preventDefault();flip(1);}
 }}>
  <header><span>{info.snapshot.agents.find(a=>a.id===idea?.agentId)?.name}{idea?.project?` · ${idea.project}`:''}</span><div className="detail-header-actions"><IconButton icon="calendar" label="念头日历" onClick={()=>void window.thoughtline.openManage()}/><button className="close" aria-label="关闭详情" onClick={()=>void window.thoughtline.closeManage()}>×</button></div></header>
  {idea?<><div className="detail-heading"><strong>{idea.title}</strong>{clip&&clip.ideaIds.length>1&&<nav className="detail-pager" aria-label="便签切换"><button aria-label="上一张便签" disabled={index<=0} onClick={()=>flip(-1)}>‹</button><button aria-label="打开本夹标题列表" onMouseDown={e=>e.preventDefault()} onClick={()=>{void prepareLeave().then(ok=>{if(ok)setTitles(value=>!value);});}}>{index+1}/{clip.ideaIds.length}</button><button aria-label="下一张便签" disabled={index>=clip.ideaIds.length-1} onClick={()=>flip(1)}>›</button></nav>}</div>
   {titles&&clip?<div className="clip-titles" aria-label="本夹便签标题">{clip.ideaIds.map(id=>{const row=info.snapshot.ideas.find(i=>i.id===id);return row&&<button key={id} aria-pressed={id===idea.id} onClick={()=>choose(id)}>{row.title}</button>;})}</div>:<IdeaReader key={idea.id+':'+info.manageSession} idea={idea} info={info} initialEdit={editRequest?.session===info.manageSession&&editRequest.ideaId===idea.id} onRemoved={removed}/>}
  </>:<p className="empty-list">这张纸已移到最近删除，或当前夹子为空。可在念头日历查看。</p>}
  <footer className="detail-bottom">{info.canUndoClips&&<IconButton icon="undo" label="撤销整理" onClick={async()=>{if(!await prepareLeave())return;const current=await window.thoughtline.info();const r=await window.thoughtline.clipChange({kind:'undo'},current.snapshot.revision);if(!r.ok)setError(r.message);}}/>}<span role="status">{info.placementNotice}</span></footer>{error&&<p role="alert" className="error">{error}</p>}
 </main>;
}
