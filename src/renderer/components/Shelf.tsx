import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Clip} from '../../shared/contracts';
import {layoutClips,normalizedPosition,CARD_WIDTH} from '../../shared/clipLayout';
import {fixedRope,fixedRopeY} from '../../shared/ropeGeometry';
import {ClipCard} from './ClipCard';
import {useShelfMotion} from '../hooks/useShelfMotion';
type Drag={clip:Clip;pointer:number;startX:number;startY:number;origin:number;x:number;active:boolean;target:string|null;ready:boolean;revision:number};
export function Shelf({info}:{info:PilotInfo}){
 const root=useRef<HTMLDivElement>(null),layoutRevision=useRef(0);const agentId=info.shelfAgentId;const [error,setError]=useState(''),[notice,setNotice]=useState(''),[dragView,setDragView]=useState<Drag|null>(null);
 const drag=useRef<Drag|null>(null),mergeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const infoRef=useRef(info);infoRef.current=info;
 const filtered=info.snapshot.clips.filter(c=>agentId==='all'||c.agentId===agentId);const rope=fixedRope(info.width);const layout=layoutClips(filtered,info.width);
 const held=useRef({displayId:info.displayId,width:info.width,layout});
 if(!info.interactionLocked||held.current.displayId!==info.displayId||held.current.width!==info.width)held.current={displayId:info.displayId,width:info.width,layout};
 const visible=held.current.layout.visible;const visibleRef=useRef(visible);visibleRef.current=visible;const {sag,progress,reduced}=useShelfMotion(info);
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
 return <div ref={root} data-view="shelf" data-visible={info.shelfVisible} data-progress={progress} data-reduced={reduced} className="shelf-root" style={{transform:reduced?'none':`translate3d(0,${(progress-1)*250}px,0)`,opacity:progress,willChange:!reduced&&progress>0&&progress<1?'transform, opacity':undefined}}>
  <svg className="rope" data-sag={sag} data-left={rope.left} data-length={rope.length} data-layout-width={info.width} width="100%" height="140" aria-hidden="true">{['rope-shadow','rope-core','rope-light'].map(c=><path key={c} className={c} d={`M ${rope.left} ${rope.top} Q ${info.width/2} ${rope.top+2*sag} ${rope.left+rope.length} ${rope.top}`}/>)}</svg>
  {visible.map(({clip:heldClip,x:origin})=>{
   const clip=info.snapshot.clips.find(c=>c.id===heldClip.id);if(!clip)return null;const active=dragView?.clip.id===clip.id;const x=active?dragView.x:origin,y=fixedRopeY(x,rope);const agent=info.snapshot.agents.find(a=>a.id===clip.agentId);
   const slope=4*rope.sag/rope.length*(1-2*(x-rope.left)/rope.length),bend=-4*rope.sag/(rope.length*rope.length);
   const ropeContact=`M 0 ${27+81*bend-9*slope} Q 9 ${27-81*bend} 18 ${27+81*bend+9*slope}`;
   return <div className={`hanging ${active?'dragging':''} ${dragView?.target===clip.id&&dragView.clip.agentId===clip.agentId?'merge-pending':''} ${dragView?.ready&&dragView.target===clip.id?'merge-target':''}`} data-idea-id={clip.currentId} data-clip-id={clip.id} key={clip.id} style={{transform:`translate3d(${x}px,${y}px,0) translateX(-50%)`}}>{dragView?.target===clip.id&&dragView.clip.agentId===clip.agentId&&<svg className="merge-ring" key={`${dragView.clip.id}:${clip.id}`} width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle className="ring-track" cx="24" cy="24" r="20"/><circle className="ring-progress" cx="24" cy="24" r="20"/></svg>}<ClipCard clip={clip} ideas={info.snapshot.ideas} agent={agent} onChange={change} onGrab={grab} onError={setError} reduced={reduced} textDragActive={info.textDragActive} ropeContact={ropeContact}/></div>;
  })}
  {dragView&&<><div className="source-ghost" style={{left:dragView.origin,top:fixedRopeY(dragView.origin,rope)+2}}/><span className="drag-message" role="status">{dragView.ready?'松开合并':dragView.target?(info.snapshot.clips.find(c=>c.id===dragView.target)?.agentId===dragView.clip.agentId?'停留后合夹':'不同 Agent 不能合夹'):'拖动调整位置 · Esc取消'}</span></>}
  {(error||notice)&&<button data-hit className="shelf-error" role={error?'alert':'status'} onClick={()=>{setError('');setNotice('');}}>{error||notice}</button>}
 </div>;
}
