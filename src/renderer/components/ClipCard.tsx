import {useLocale} from '../LocaleContext';
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import type {PointerEvent,CSSProperties} from 'react';
import type {Clip,Idea,AgentTag} from '../../shared/contracts';
import type {ClipMutation} from '../../shared/bridge';
import {useClipPage} from '../hooks/useClipPage';
import {Clothespin} from './Clothespin';
import {paperShapeForClip} from './paperShape';
import {agentInkColors} from './agentInk';
export function ClipCard({clip,ideas,agent,onChange,onGrab,onError,reduced,textDragActive,ropeContact}:{clip:Clip;ideas:Idea[];agent:AgentTag|undefined;onChange:(c:ClipMutation)=>Promise<boolean>;onGrab:(e:PointerEvent<HTMLButtonElement>,clip:Clip,mode?:'clip'|'paper')=>void;onError:(text:string)=>void;reduced:boolean;textDragActive:boolean;ropeContact:string}){
 const {t,agentName}=useLocale();
 const page=useClipPage(clip,onError);
 const [copied,setCopied]=useState(false),[direction,setDirection]=useState('');
 const paperId=useId().replace(/:/g,'');const paper=paperShapeForClip(clip.id);const ink=useMemo(()=>agentInkColors(agent?.color??'#A0A3AA'),[agent?.color]);
 const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null),current=useRef(clip.currentId),ignoreCopyUntil=useRef(0),exportId=useRef<string|null>(null);const [exporting,setExporting]=useState(false);current.current=page.id;
 useEffect(()=>{setCopied(false);if(copyTimer.current)clearTimeout(copyTimer.current);return()=>{if(copyTimer.current)clearTimeout(copyTimer.current);if(exportId.current)window.thoughtline.textDrag(false,exportId.current);exportId.current=null;};},[page.id]);
 useEffect(()=>{if(!textDragActive&&exportId.current){exportId.current=null;ignoreCopyUntil.current=performance.now()+160;setExporting(false);}},[textDragActive]);
 const idea=ideas.find(i=>i.id===page.id);if(!idea)return null;
 const index=clip.ideaIds.indexOf(idea.id),grouped=clip.ideaIds.length>1;
 const open=async(titles=false)=>{const r=await window.thoughtline.openManage(idea.id,titles);if(!r.ok)onError(r.message);};
 const flip=(step:number)=>{const id=clip.ideaIds[clip.ideaIds.indexOf(page.current())+step];if(!id)return;setCopied(false);setDirection(step>0?'next':'previous');page.choose(id);};
 return <>
  <Clothespin color={agent?.color} reduced={reduced} layer="rear"/>
  <svg className="clamp-rope" width="18" height="38" viewBox="0 0 18 38" aria-hidden="true">{['rope-shadow','rope-core','rope-light'].map(c=><path key={c} className={c} d={ropeContact}/>)}</svg>
  <button data-hit className="peg-button" aria-label={t("moveClip",{p0:idea.title})} onPointerDown={e=>onGrab(e,{...clip,currentId:page.id},'clip')}><Clothespin color={agent?.color} reduced={reduced}/></button>
  <article data-hit data-paper-variant={paper.variant} data-agent-neutral={!agent||agent.id==='general'} style={{'--agent-ink-light':ink.light,'--agent-ink-dark':ink.dark} as CSSProperties} data-copied={copied} className={`idea-card ${grouped?'grouped':''}`} onContextMenu={e=>{e.preventDefault();void window.thoughtline.shelfMenu(idea.id).then(r=>{if(!r.ok)onError(r.message);});}}>
   <svg className="paper-sheet" width="160" height="226" viewBox="0 0 160 226" aria-hidden="true">
    <defs>
     <path id={`${paperId}-outline`} d={paper.outline}/>
     <linearGradient id={`${paperId}-across`} x1="0" y1="0" x2="1" y2=".2"><stop stopColor="#FFFFFF" stopOpacity=".045"/><stop offset="1" stopColor="#000000" stopOpacity=".015"/></linearGradient>
     <linearGradient id={`${paperId}-down`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000000" stopOpacity="0"/><stop offset=".55" stopColor="#000000" stopOpacity="0"/><stop offset=".66" stopColor="#000000" stopOpacity=".018"/><stop offset=".79" stopColor="#000000" stopOpacity=".07"/><stop offset=".87" stopColor="#000000" stopOpacity=".055"/><stop offset=".96" stopColor="#FFFFFF" stopOpacity=".07"/><stop offset="1" stopColor="#FFFFFF" stopOpacity=".03"/></linearGradient>
     <radialGradient id={`${paperId}-pressure`}><stop stopColor="#000000" stopOpacity=".12"/><stop offset=".42" stopColor="#000000" stopOpacity=".045"/><stop offset="1" stopColor="#000000" stopOpacity="0"/></radialGradient>
    </defs>
    <path className="paper-back" d={paper.back}/>
    <use className="paper-face" href={`#${paperId}-outline`}/>
    <use className="paper-shading" href={`#${paperId}-outline`} fill={`url(#${paperId}-across)`}/>
    <use className="paper-shading" href={`#${paperId}-outline`} fill={`url(#${paperId}-down)`}/>
    <g data-part="paper-pressure"><ellipse cx="79" cy="5.6" rx="10" ry="3.4" fill={`url(#${paperId}-pressure)`}/><path d="M73.5 5.8Q79 6.4 84.5 5.8" fill="none" stroke="#FFFFFF" strokeOpacity=".15" strokeWidth=".45"/></g>
   </svg>
   <button className="paper-grip" aria-label={t("dragPaper",{p0:idea.title})} title={t("拖动纸张上缘，抽出当前一张；拖正文复制文字")} onPointerDown={e=>onGrab(e,{...clip,currentId:page.id},'paper')}/>
   <button className="card-copy" draggable data-exporting={exporting} title={t("点击复制；拖动正文到支持文字拖放的输入框")} onDragStart={e=>{
    e.dataTransfer.clearData();e.dataTransfer.setData('text/plain',idea.text);e.dataTransfer.effectAllowed='copy';ignoreCopyUntil.current=Infinity;setExporting(true);exportId.current=idea.id;window.thoughtline.textDrag(true,idea.id);
   }} onDragEnd={()=>{ignoreCopyUntil.current=performance.now()+160;setExporting(false);if(exportId.current)window.thoughtline.textDrag(false,exportId.current);exportId.current=null;}} aria-label={t("copyPaper",{p0:agentName(agent)||t('通用'),p1:idea.title})} onClick={async()=>{
    if(performance.now()<ignoreCopyUntil.current)return;const id=idea.id,r=await window.thoughtline.copy(id);if(!r.ok){onError(r.message);return;}if(current.current!==id)return;
    if(copyTimer.current)clearTimeout(copyTimer.current);setCopied(true);copyTimer.current=setTimeout(()=>setCopied(false),1500);
   }}><span className="agent-name">{agentName(agent)||t('通用')}{idea.project?` · ${idea.project}`:''}</span><strong key={idea.id} data-direction={reduced?undefined:direction}>{idea.title}</strong><span className="preview">{idea.text}</span></button>
   <footer className={grouped?'group-footer':'single-footer'}>
    {grouped?<><button className="page-arrow" aria-label={t("上一张便签")} disabled={index===0} onClick={()=>void flip(-1)}>‹</button><button className="page-number" aria-label={t("paperPage",{p0:index+1,p1:clip.ideaIds.length})} onClick={()=>void open(true)}>{copied?'✓':`${index+1}/${clip.ideaIds.length}`}</button><button className="page-arrow" aria-label={t("下一张便签")} disabled={index===clip.ideaIds.length-1} onClick={()=>void flip(1)}>›</button></>:<span className="copy-status" aria-live="polite">{copied?t("已复制"):''}</span>}
    <button aria-label={t("expandPaper",{p0:idea.title})} onClick={()=>void open()}><ExpandIcon/></button>
   </footer>
   <span className="sr-only" role="status">{copied?t("copiedPaper",{p0:index+1}):''}</span>
  </article>
 </>;
}
export function ExpandIcon(){
 const {t,agentName}=useLocale();return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 2h5v5M14 2L8 8M7 14H2V9M2 14l6-6"/></svg>;}
