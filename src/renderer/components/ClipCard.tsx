import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import type {Clip,Idea,AgentTag} from '../../shared/contracts';
import type {ClipMutation} from '../../shared/bridge';
import {Clothespin} from './Clothespin';
export function ClipCard({clip,ideas,agent,onChange,onGrab,onError,reduced,textDragActive}:{clip:Clip;ideas:Idea[];agent:AgentTag|undefined;onChange:(c:ClipMutation)=>Promise<boolean>;onGrab:(e:PointerEvent<HTMLButtonElement>,clip:Clip)=>void;onError:(text:string)=>void;reduced:boolean;textDragActive:boolean}){
 const [copied,setCopied]=useState(false),[busy,setBusy]=useState(false),[direction,setDirection]=useState('');
 const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null),current=useRef(clip.currentId),ignoreCopyUntil=useRef(0),exportId=useRef<string|null>(null);const [exporting,setExporting]=useState(false);current.current=clip.currentId;
 useEffect(()=>{setCopied(false);if(copyTimer.current)clearTimeout(copyTimer.current);return()=>{if(copyTimer.current)clearTimeout(copyTimer.current);if(exportId.current)window.thoughtline.textDrag(false,exportId.current);exportId.current=null;};},[clip.currentId]);
 useEffect(()=>{if(!textDragActive&&exportId.current){exportId.current=null;ignoreCopyUntil.current=performance.now()+160;setExporting(false);}},[textDragActive]);
 const idea=ideas.find(i=>i.id===clip.currentId);if(!idea)return null;
 const index=clip.ideaIds.indexOf(idea.id),grouped=clip.ideaIds.length>1;
 const open=async(titles=false)=>{const r=await window.thoughtline.openManage(idea.id,titles);if(!r.ok)onError(r.message);};
 const flip=async(step:number)=>{if(busy)return;const id=clip.ideaIds[index+step];if(!id)return;setBusy(true);setCopied(false);setDirection(step>0?'next':'previous');try{await onChange({kind:'select',id:clip.id,ideaId:id});}finally{setBusy(false);}};
 return <>
  <button data-hit className="peg-button" aria-label={`移动夹子或查看：${idea.title}`} onPointerDown={e=>onGrab(e,clip)}><Clothespin color={agent?.color} reduced={reduced}/></button>
  <article data-hit data-copied={copied} className={`idea-card ${grouped?'grouped':''}`} onContextMenu={e=>{e.preventDefault();void window.thoughtline.shelfMenu(idea.id).then(r=>{if(!r.ok)onError(r.message);});}}>
   <button className="card-copy" draggable data-exporting={exporting} title="点击复制；拖动正文到支持文字拖放的输入框" onDragStart={e=>{
    e.dataTransfer.clearData();e.dataTransfer.setData('text/plain',idea.text);e.dataTransfer.effectAllowed='copy';ignoreCopyUntil.current=Infinity;setExporting(true);exportId.current=idea.id;window.thoughtline.textDrag(true,idea.id);
   }} onDragEnd={()=>{ignoreCopyUntil.current=performance.now()+160;setExporting(false);if(exportId.current)window.thoughtline.textDrag(false,exportId.current);exportId.current=null;}} aria-label={`${agent?.name??'通用'}：${idea.title}，点击复制正文`} onClick={async()=>{
    if(performance.now()<ignoreCopyUntil.current)return;const id=idea.id,r=await window.thoughtline.copy(id);if(!r.ok){onError(r.message);return;}if(current.current!==id)return;
    if(copyTimer.current)clearTimeout(copyTimer.current);setCopied(true);copyTimer.current=setTimeout(()=>setCopied(false),1500);
   }}><span className="agent-name">{agent?.name??'通用'}{idea.project?` · ${idea.project}`:''}</span><strong key={idea.id} data-direction={reduced?undefined:direction}>{idea.title}</strong></button>
   <footer className={grouped?'group-footer':'single-footer'}>
    {grouped?<><button className="page-arrow" aria-label="上一张便签" disabled={busy||index===0} onClick={()=>void flip(-1)}>‹</button><button className="page-number" aria-label={`第${index+1}张，共${clip.ideaIds.length}张，打开标题列表`} onClick={()=>void open(true)}>{copied?'✓':`${index+1}/${clip.ideaIds.length}`}</button><button className="page-arrow" aria-label="下一张便签" disabled={busy||index===clip.ideaIds.length-1} onClick={()=>void flip(1)}>›</button></>:<span className="copy-status" aria-live="polite">{copied?'已复制':''}</span>}
    <button aria-label={`展开全文：${idea.title}`} onClick={()=>void open()}><ExpandIcon/></button>
   </footer>
   <span className="sr-only" role="status">{copied?`已复制第${index+1}张完整正文`:''}</span>
  </article>
 </>;
}
export function ExpandIcon(){return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 2h5v5M14 2L8 8M7 14H2V9M2 14l6-6"/></svg>;}
