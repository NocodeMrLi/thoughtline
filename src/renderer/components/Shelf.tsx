import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Clip} from '../../shared/contracts';
import {layoutClips,normalizedPosition,CARD_WIDTH} from '../../shared/clipLayout';
import {ClipCard} from './ClipCard';
import {useShelfMotion} from '../hooks/useShelfMotion';
type Drag={clip:Clip;pointer:number;startX:number;startY:number;origin:number;x:number;active:boolean;target:string|null;ready:boolean;revision:number};
export function Shelf({info}:{info:PilotInfo}){
 const root=useRef<HTMLDivElement>(null),layoutRevision=useRef(0);const [agentId,setAgentId]=useState('all'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[dragView,setDragView]=useState<Drag|null>(null);
 const drag=useRef<Drag|null>(null),mergeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const infoRef=useRef(info);infoRef.current=info;
 useEffect(()=>{if(agentId!=='all'&&!info.snapshot.agents.some(a=>a.id===agentId))setAgentId('all');},[info.snapshot.revision,agentId]);
 const countFor=(id:string)=>info.snapshot.ideas.filter(i=>i.status==='hanging'&&(id==='all'||i.agentId===id)).length;
 const total=countFor('all');const filtered=info.snapshot.clips.filter(c=>agentId==='all'||c.agentId===agentId);const layout=layoutClips(filtered,info.width);
 const held=useRef({displayId:info.displayId,width:info.width,layout});
 if(!info.interactionLocked||held.current.displayId!==info.displayId||held.current.width!==info.width)held.current={displayId:info.displayId,width:info.width,layout};
 const visible=held.current.layout.visible;const visibleRef=useRef(visible);visibleRef.current=visible;const {sag,progress,reduced}=useShelfMotion(total,info);
 const reset=()=>{if(mergeTimer.current)clearTimeout(mergeTimer.current);mergeTimer.current=null;const wasActive=drag.current?.active;drag.current=null;setDragView(null);if(wasActive)void window.thoughtline.dragLock(false);};
 useEffect(()=>{reset();},[info.displayId,info.width,info.dragCancelSession]);
 useEffect(()=>()=>{if(mergeTimer.current)clearTimeout(mergeTimer.current);void window.thoughtline.dragLock(false);},[]);
 const change=async(c:ClipMutation,revision=infoRef.current.snapshot.revision)=>{
  const r=await window.thoughtline.clipChange(c,revision);if(!r.ok){setError(r.message);return false;}setError('');return true;
 };
 const browse=async(id?:string)=>{const r=await window.thoughtline.openManage(id);if(!r.ok)setError(r.message);};
 const grab=(e:PointerEvent<HTMLButtonElement>,clip:Clip)=>{
  if(e.button!==0||drag.current)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  const x=visible.find(p=>p.clip.id===clip.id)?.x??e.clientX;
  drag.current={clip,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origin:x,x,active:false,target:null,ready:false,revision:info.snapshot.revision};setError('');setNotice('');
 };
 useEffect(()=>{
  const move=async(e:globalThis.PointerEvent)=>{
   const d=drag.current;if(!d||e.pointerId!==d.pointer)return;
   if(!d.active){if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<5)return;d.active=true;
    const r=await window.thoughtline.dragLock(true);if(drag.current!==d){void window.thoughtline.dragLock(false);return;}if(!r.ok){setError(r.message);reset();return;}
   }
   d.x=Math.max(CARD_WIDTH/2+12,Math.min(infoRef.current.width-CARD_WIDTH/2-12,d.origin+e.clientX-d.startX));
   const target=visibleRef.current.find(p=>p.clip.id!==d.clip.id&&Math.abs(p.x-d.x)<=30&&Math.abs(e.clientY-d.startY)<90);
   const id=target?.clip.id??null;
   if(d.target!==id){if(mergeTimer.current)clearTimeout(mergeTimer.current);d.target=id;d.ready=false;
    if(target&&target.clip.agentId===d.clip.agentId)mergeTimer.current=setTimeout(()=>{if(drag.current===d&&d.target===id){d.ready=true;setDragView({...d});}},600);
   }
   setDragView({...d});
  };
  const up=async(e:globalThis.PointerEvent)=>{
   const d=drag.current;if(!d||e.pointerId!==d.pointer)return;
   if(!d.active){reset();void browse(d.clip.currentId);return;}
   const target=visibleRef.current.find(p=>p.clip.id===d.target);let message='';
   const outside=e.clientY<0||e.clientY>300||e.clientX<0||e.clientX>infoRef.current.width;
   if(!outside){
    if(d.ready&&target?.clip.agentId===d.clip.agentId){if(await change({kind:'merge',sourceId:d.clip.id,targetId:target.clip.id},d.revision))message='已合夹 · 可在详情中拆出或撤销';}
    else if(d.target){message=target?.clip.agentId!==d.clip.agentId?'不同 Agent 无法合夹，位置保持。':'未达到合夹停留时间，位置保持。';}
    else{
     const before=visibleRef.current.find(p=>p.clip.id!==d.clip.id&&p.x>d.x)?.clip.id??null;
     if(await change({kind:'move',id:d.clip.id,position:normalizedPosition(d.x,infoRef.current.width),beforeId:before},d.revision))message='夹子位置已保存';
    }
   }
   setNotice(outside?'拖动已取消':message);reset();
  };
  const cancel=()=>reset();window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);};
 },[]);
 useLayoutEffect(()=>{
  const publish=()=>{
   const rects=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-hit]')??[]).map(el=>{const r=el.getBoundingClientRect();const x=Math.max(0,r.x),y=Math.max(0,r.y);return {x,y,width:Math.max(0,Math.min(info.width,r.right)-x),height:Math.max(0,Math.min(innerHeight,r.bottom)-y)};}).filter(r=>r.width>0&&r.height>0);
   window.thoughtline.hitRects({displayId:info.displayId,layoutRevision:++layoutRevision.current,rects});
  };
  publish();const observer=new ResizeObserver(publish);root.current?.querySelectorAll('[data-hit]').forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[info.width,info.displayId,info.snapshot.revision,agentId,sag,progress,dragView]);
 const filter=(id:string)=>{reset();setAgentId(id);};
 return <div ref={root} data-view="shelf" data-visible={info.shelfVisible} data-progress={progress} className="shelf-root" style={{transform:`translate3d(0,${(progress-1)*250}px,0)`,opacity:progress,willChange:progress>0&&progress<1?'transform, opacity':undefined}}>
  <svg className="rope" data-sag={sag} width="100%" height="140" aria-hidden="true"><defs><linearGradient id="rope-edge"><stop stopColor="white" stopOpacity="0"/><stop offset=".06" stopColor="white"/><stop offset=".94" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><mask id="rope-mask"><rect width="100%" height="140" fill="url(#rope-edge)"/></mask></defs><g mask="url(#rope-mask)">{['rope-shadow','rope-core','rope-light'].map(c=><path key={c} className={c} d={`M 0 10 Q ${info.width/2} ${10+2*sag} ${info.width} 10`}/>)}</g></svg>
  {info.snapshot.ideas.length>0&&<nav className="shelf-tools" aria-label="Agent筛选">
   <button data-hit aria-pressed={agentId==='all'} onClick={()=>filter('all')}>全部 {total}</button>
   {info.snapshot.agents.slice(0,4).map(a=><button className="agent-filter" key={a.id} data-hit aria-pressed={agentId===a.id} onClick={()=>filter(a.id)}><i style={{backgroundColor:a.color}}/>{a.name} {countFor(a.id)}</button>)}
   <select data-hit aria-label="Agent筛选列表" value={agentId} onChange={e=>filter(e.target.value)}><option value="all">筛选 Agent</option>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name} {countFor(a.id)}</option>)}</select>
   <button data-hit onClick={()=>void browse()}>{layout.overflow.length?`还有 ${layout.overflow.reduce((n,c)=>n+c.ideaIds.length,0)} 条`:'查找 / 已收起'}</button>
  </nav>}
  {!visible.length&&<div className="empty-rope">{total?<>这里暂时没有可显示的夹子 <button data-hit onClick={()=>void browse()}>全部念头</button></>:<>还没有念头 · 按 {info.snapshot.settings.writeHotkey} 写一条</>}</div>}
  {visible.map(({clip:heldClip,x:origin})=>{
   const clip=info.snapshot.clips.find(c=>c.id===heldClip.id);if(!clip)return null;const active=dragView?.clip.id===clip.id;const x=active?dragView.x:origin,t=x/info.width,y=10+4*sag*t*(1-t);const agent=info.snapshot.agents.find(a=>a.id===clip.agentId);
   return <div className={`hanging ${active?'dragging':''} ${dragView?.target===clip.id&&dragView.clip.agentId===clip.agentId?'merge-pending':''} ${dragView?.ready&&dragView.target===clip.id?'merge-target':''}`} data-idea-id={clip.currentId} data-clip-id={clip.id} key={clip.id} style={{transform:`translate3d(${x}px,${y}px,0) translateX(-50%)`}}>{dragView?.target===clip.id&&dragView.clip.agentId===clip.agentId&&<svg className="merge-ring" key={`${dragView.clip.id}:${clip.id}`} width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle className="ring-track" cx="24" cy="24" r="20"/><circle className="ring-progress" cx="24" cy="24" r="20"/></svg>}<ClipCard clip={clip} ideas={info.snapshot.ideas} agent={agent} onChange={change} onGrab={grab} onError={setError} reduced={reduced} textDragActive={info.textDragActive}/></div>;
  })}
  {dragView&&<><div className="source-ghost" style={{left:dragView.origin,top:10+4*sag*(dragView.origin/info.width)*(1-dragView.origin/info.width)+26}}/><span className="drag-message" role="status">{dragView.ready?'松开合并':dragView.target?(info.snapshot.clips.find(c=>c.id===dragView.target)?.agentId===dragView.clip.agentId?'停留后合夹':'不同 Agent 不能合夹'):'拖动调整位置 · Esc取消'}</span></>}
  {(error||notice)&&<button data-hit className="shelf-error" role={error?'alert':'status'} onClick={()=>{setError('');setNotice('');}}>{error||notice}</button>}
 </div>;
}
