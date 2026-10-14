import {useLocale} from '../LocaleContext';
import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import type {PointerEvent,CSSProperties} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Clip} from '../../shared/contracts';
import {layoutClips,normalizedPosition,clipTravelBounds,availableClipPosition,clipMetrics} from '../../shared/clipLayout';
import {fixedRope,fixedRopeY,shelfCapacity} from '../../shared/ropeGeometry';
import {flushPageSelections} from '../hooks/useClipPage';
import {ClipCard} from './ClipCard';
import {filteredClips,matchingClipIds} from '../../shared/ideaVisibility';
import {canMergeClips,canMergeIdea} from '../../shared/clipModel';
import {useTransientNotice} from '../hooks/useTransientNotice';
import {RopeArtwork,ropeStyle} from './RopeArtwork';
import {useShelfMotion} from '../hooks/useShelfMotion';
type Drag={mode:'clip'|'paper';ideaId:string;valid:boolean;clip:Clip;pointer:number;startX:number;startY:number;origin:number;x:number;active:boolean;target:string|null;ready:boolean;revision:number};
export function Shelf({info}:{info:PilotInfo}){
 const {t,m}=useLocale();
 const ropeId=useId().replace(/:/g,'');
 const root=useRef<HTMLDivElement>(null),layoutRevision=useRef(0);const agentId=info.shelfAgentId,project=info.shelfProject??null,filter={agentId,project},filterKey=project!==null||agentId!=='all'?JSON.stringify(filter):undefined;const [error,setError]=useState(''),[dragView,setDragView]=useState<Drag|null>(null);
 const {notice,setNotice,noticeProps}=useTransientNotice();
 const {notice:placement,setNotice:setPlacement,noticeProps:placementProps}=useTransientNotice(4000);
 const consumedPlacement=useRef<number|string|null>(null);
 useEffect(()=>{const id=info.placementNoticeId??info.placementNotice;if(info.shelfVisible&&id!==consumedPlacement.current){consumedPlacement.current=id;setPlacement(info.placementNotice??'',info.placementNoticeKind==='error'?Infinity:4000);}if(!info.shelfVisible&&info.placementNoticeKind!=='error')setPlacement('');},[info.shelfVisible,info.placementNoticeId,info.placementNotice]);
 const drag=useRef<Drag|null>(null),mergeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);const infoRef=useRef(info);infoRef.current=info;
 const capacity=shelfCapacity(info.snapshot.settings.shelfCapacity),metrics=clipMetrics(info.width,capacity);
 const filtered=filteredClips(info.snapshot,filter);const rope=fixedRope(info.width,capacity);const layout=layoutClips(filtered,info.width,capacity);
 const held=useRef({displayId:info.displayId,width:info.width,layout});
 if(!info.layoutLocked||held.current.displayId!==info.displayId||held.current.width!==info.width)held.current={displayId:info.displayId,width:info.width,layout};
 const visible=held.current.layout.visible;const visibleRef=useRef(visible);visibleRef.current=visible;const {sag,progress,reduced}=useShelfMotion(info);
 const arrangement=useRef<Animation[]>([]),lastPositions=useRef(new Map<string,string>()),motionSession=useRef(info.arrangeSession??0);
 const stopArrangement=()=>{for(const animation of arrangement.current)animation.cancel();arrangement.current=[];};
 useEffect(()=>{window.addEventListener('pointerdown',stopArrangement,true);return()=>{window.removeEventListener('pointerdown',stopArrangement,true);stopArrangement();};},[]);
 const reset=()=>{if(mergeTimer.current)clearTimeout(mergeTimer.current);mergeTimer.current=null;const wasActive=drag.current?.active;drag.current=null;setDragView(null);if(wasActive)void window.thoughtline.dragLock(false);};
 useEffect(()=>{reset();},[info.displayId,info.width,info.dragCancelSession]);
 useEffect(()=>()=>{if(mergeTimer.current)clearTimeout(mergeTimer.current);void window.thoughtline.dragLock(false);},[]);
 const change=async(c:ClipMutation,revision?:number)=>{
  try{await flushPageSelections();if(revision===undefined)revision=(await window.thoughtline.info()).snapshot.revision;
  const r=await window.thoughtline.clipChange(c,revision);if(!r.ok){setError(r.message);return false;}setError('');return true;}catch{setError('页码尚未保存，整理已暂停，请重试。');return false;}
 };
 const browse=async(id?:string)=>{const r=await window.thoughtline.openManage(id);if(!r.ok)setError(r.message);};
 const grab=(e:PointerEvent<HTMLButtonElement>,clip:Clip,mode:'clip'|'paper'='clip')=>{
  if(e.button!==0||drag.current)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  const x=visible.find(p=>p.clip.id===clip.id)?.x??e.clientX;
  drag.current={mode,ideaId:clip.currentId,valid:true,clip,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,origin:x,x,active:false,target:null,ready:false,revision:info.snapshot.revision};setError('');setNotice('');
 };
 useEffect(()=>{
  const move=async(e:globalThis.PointerEvent)=>{
   const d=drag.current;if(!d||e.pointerId!==d.pointer)return;
   if(!d.active){if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<5)return;d.active=true;
    const r=await window.thoughtline.dragLock(true);if(drag.current!==d){void window.thoughtline.dragLock(false);return;}if(!r.ok){setError(r.message);reset();return;}
   }
   const bounds=clipTravelBounds(infoRef.current.width,shelfCapacity(infoRef.current.snapshot.settings.shelfCapacity));d.x=Math.max(bounds.min,Math.min(bounds.max,d.origin+e.clientX-d.startX));
   const target=visibleRef.current.find(p=>p.clip.id!==d.clip.id&&Math.abs(p.x-d.x)<=30&&Math.abs(e.clientY-d.startY)<90);
   const id=target?.clip.id??null;
   if(d.target!==id){if(mergeTimer.current)clearTimeout(mergeTimer.current);d.target=id;d.ready=false;
    if(target&&(d.mode==='paper'?canMergeIdea(infoRef.current.snapshot,d.ideaId,target.clip):canMergeClips(infoRef.current.snapshot,d.clip,target.clip)))mergeTimer.current=setTimeout(()=>{if(drag.current===d&&d.target===id){d.ready=true;setDragView({...d});}},600);
   }
   d.valid=true;
   if(d.mode==='paper'&&!d.target){const occupied=visibleRef.current.filter(p=>d.clip.ideaIds.length>1||p.clip.id!==d.clip.id).map(p=>p.x),free=availableClipPosition(occupied,infoRef.current.width,d.x,shelfCapacity(infoRef.current.snapshot.settings.shelfCapacity));d.valid=free!==null;if(free!==null)d.x=free;}
   setDragView({...d});
  };
  const up=async(e:globalThis.PointerEvent)=>{
   const d=drag.current;if(!d||e.pointerId!==d.pointer)return;
   if(!d.active){reset();if(d.mode==='clip')void browse(d.ideaId);return;}
   try{await flushPageSelections();}catch{setError('页码尚未保存，拖动已取消。');reset();return;}const current=await window.thoughtline.info();if(drag.current!==d)return;
   const currentSource=current.snapshot.clips.find(c=>c.id===d.clip.id);if(!currentSource||JSON.stringify(currentSource.ideaIds)!==JSON.stringify(d.clip.ideaIds)||currentSource.position!==d.clip.position){setNotice('布局已变化，拖动已取消');reset();return;}d.revision=current.snapshot.revision;
   const target=visibleRef.current.find(p=>p.clip.id===d.target);let message='';
   const outside=e.clientY<0||e.clientY>300||e.clientX<0||e.clientX>infoRef.current.width;
   if(!outside){
    if(d.ready&&target&&(d.mode==='paper'?canMergeIdea(current.snapshot,d.ideaId,target.clip):canMergeClips(current.snapshot,currentSource,target.clip))){await change(d.mode==='paper'?{kind:'paperDrop',id:d.clip.id,ideaId:d.ideaId,targetId:target.clip.id,position:null}:{kind:'merge',sourceId:d.clip.id,targetId:target.clip.id,currentIdeaId:d.ideaId},d.revision);}
    else if(d.target){message=target&&!(d.mode==='paper'?canMergeIdea(current.snapshot,d.ideaId,target.clip):canMergeClips(current.snapshot,currentSource,target.clip))?"不同分组的夹子不能合并，未分组仅支持同标签合并。":"未达到合夹停留时间，位置保持。";}
    else if(d.mode==='paper'){if(d.valid)await change({kind:'paperDrop',id:d.clip.id,ideaId:d.ideaId,targetId:null,position:normalizedPosition(d.x,infoRef.current.width,shelfCapacity(infoRef.current.snapshot.settings.shelfCapacity))},d.revision);else message="无合法空位，纸张保持原位";}
    else{
     const before=visibleRef.current.find(p=>p.clip.id!==d.clip.id&&p.x>d.x)?.clip.id??null;
     await change({kind:'move',id:d.clip.id,position:normalizedPosition(d.x,infoRef.current.width,shelfCapacity(infoRef.current.snapshot.settings.shelfCapacity)),beforeId:before},d.revision);
    }
   }
   setNotice(outside?'':message);reset();
  };
  const cancel=()=>reset();window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);};
 },[]);
 useLayoutEffect(()=>{
  stopArrangement();
  const nodes=[...root.current?.querySelectorAll<HTMLElement>('.hanging[data-clip-id]')??[]],next=new Map(nodes.map(node=>[node.dataset.clipId!,node.style.transform]));
  if(!info.layoutLocked){
   if(!reduced&&(info.arrangeSession??0)!==motionSession.current){for(const node of nodes){const from=lastPositions.current.get(node.dataset.clipId!);if(from&&from!==node.style.transform)arrangement.current.push(node.animate([{transform:from},{transform:node.style.transform}],{duration:180,easing:'cubic-bezier(.22,1,.36,1)'}));}}
   motionSession.current=info.arrangeSession??0;
  }
  lastPositions.current=next;
  return stopArrangement;
 },[info.arrangeSession,info.snapshot.revision,info.interactionLocked,info.width,info.displayId,agentId,project,reduced]);
 useLayoutEffect(()=>{
  const publish=()=>{
   const rects=Array.from(document.querySelectorAll<HTMLElement>('[data-hit]')).filter(el=>info.shelfVisible||!el.closest('.shelf-root')).map(el=>{const r=el.getBoundingClientRect();const x=Math.max(0,r.x),y=Math.max(0,r.y);return {x,y,width:Math.max(0,Math.min(info.width,r.right)-x),height:Math.max(0,Math.min(innerHeight,r.bottom)-y)};}).filter(r=>r.width>0&&r.height>0);
   window.thoughtline.hitRects({displayId:info.displayId,layoutRevision:++layoutRevision.current,rects});
  };
  publish();let frame=0;const duringMotion=()=>{publish();if(arrangement.current.some(a=>a.playState==='running'))frame=requestAnimationFrame(duringMotion);};if(arrangement.current.length)frame=requestAnimationFrame(duringMotion);const observer=new ResizeObserver(publish);document.querySelectorAll('[data-hit]').forEach(el=>observer.observe(el));window.addEventListener('thoughtline:hit-layout-refresh',publish);return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('thoughtline:hit-layout-refresh',publish);};
 },[info.width,info.displayId,info.snapshot.revision,info.interactionLocked,info.arrangeSession,agentId,sag,progress,dragView,placement,error,notice,info.lightReminder,info.shelfVisible,info.shelfFilterPicker,info.shelfMergePicker,project]);
 return <div ref={root} className="shelf-stage" data-reduced-motion={info.snapshot.settings.reducedMotion} style={ropeStyle(info.snapshot.settings.rope)}><div data-view="shelf" data-visible={info.shelfVisible} data-locked={info.interactionLocked} data-progress={progress} data-reduced={reduced} className="shelf-root" style={{transform:reduced?'none':`translate3d(0,${(progress-1)*250}px,0)`,opacity:progress,willChange:!reduced&&progress>0&&progress<1?'transform, opacity':undefined}}>
  <svg className="rope" data-sag={sag} data-left={rope.left} data-length={rope.length} data-layout-width={info.width} data-end-fade=".08" width="100%" height="140" aria-hidden="true">
   <defs><linearGradient id={`${ropeId}-ends`} gradientUnits="userSpaceOnUse" x1={rope.left} x2={rope.left+rope.length} y1="0" y2="0"><stop stopColor="white" stopOpacity="0"/><stop offset=".08" stopColor="white"/><stop offset=".92" stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><mask id={`${ropeId}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={info.width} height="140"><rect width={info.width} height="140" fill={`url(#${ropeId}-ends)`}/></mask></defs>
   <g mask={`url(#${ropeId}-mask)`}><RopeArtwork rope={{...rope,sag}} anchors={visible.map(p=>dragView?.mode==='clip'&&dragView.clip.id===p.clip.id?dragView.x:p.x)} appearance={info.snapshot.settings.rope}/></g></svg>
  {visible.map(({clip:heldClip,x:origin})=>{
   const clip=info.snapshot.clips.find(c=>c.id===heldClip.id);if(!clip)return null;const ids=matchingClipIds(info.snapshot,clip,filter);if(!ids.length)return null;const mergeable=dragView&&(dragView.mode==='paper'?canMergeIdea(info.snapshot,dragView.ideaId,clip):canMergeClips(info.snapshot,dragView.clip,clip));const active=dragView?.clip.id===clip.id&&dragView.mode==='clip';const x=active?dragView.x:origin,y=fixedRopeY(x,rope);const agent=info.snapshot.agents.find(a=>a.id===clip.agentId);
   const slope=4*rope.sag/rope.length*(1-2*(x-rope.left)/rope.length),bend=-4*rope.sag/(rope.length*rope.length);
   const ropeContact=`M 0 ${27+(81*bend*metrics.scale*metrics.scale-9*slope*metrics.scale)/metrics.scale} Q 9 ${27-81*bend*metrics.scale} 18 ${27+(81*bend*metrics.scale*metrics.scale+9*slope*metrics.scale)/metrics.scale}`;
   return <div className={`hanging ${active?'dragging':''} ${dragView?.target===clip.id&&mergeable?'merge-pending':''} ${dragView?.ready&&dragView.target===clip.id?'merge-target':''}`} data-idea-id={clip.currentId} data-clip-id={clip.id} key={clip.id} style={{width:metrics.cardWidth,transform:`translate3d(${x}px,${y}px,0) translateX(-50%)`}}>{dragView?.target===clip.id&&mergeable&&<svg className="merge-ring" key={`${dragView.clip.id}:${clip.id}`} width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle className="ring-track" cx="24" cy="24" r="20"/><circle className="ring-progress" cx="24" cy="24" r="20"/></svg>}<div className="scaled-paper" style={{transform:`scale(${metrics.scale})`,'--paper-scale':metrics.scale} as CSSProperties}><ClipCard appearance={info.snapshot.settings.paper} clip={clip} ideas={info.snapshot.ideas} agent={agent} agents={info.snapshot.agents} view={filterKey?{ids,key:clip.id+filterKey}:undefined} onChange={change} onGrab={grab} onError={setError} reduced={reduced} textDragActive={info.textDragActive} ropeContact={ropeContact}/></div></div>;
  })}
  {dragView?.mode==='paper'&&dragView.active&&<div className="paper-drag-preview" data-valid={dragView.valid} aria-hidden="true" style={{left:dragView.x,top:fixedRopeY(dragView.x,rope),width:metrics.cardWidth}}><div className="scaled-paper" style={{transform:`scale(${metrics.scale})`,'--paper-scale':metrics.scale} as CSSProperties}><ClipCard appearance={info.snapshot.settings.paper} clip={{...dragView.clip,ideaIds:[dragView.ideaId],currentId:dragView.ideaId}} ideas={info.snapshot.ideas} agent={info.snapshot.agents.find(a=>a.id===info.snapshot.ideas.find(i=>i.id===dragView.ideaId)?.agentId)} onChange={change} onGrab={()=>{}} onError={()=>{}} reduced={true} textDragActive={false} ropeContact="M0 27H18"/></div></div>}
  {dragView&&<><div className="source-ghost" style={{left:dragView.origin,top:fixedRopeY(dragView.origin,rope)+6*metrics.scale,width:metrics.cardWidth,height:metrics.cardHeight}}/><span className="drag-message" role="status">{dragView.ready?t("松开合并"):dragView.target?((()=>{const target=info.snapshot.clips.find(c=>c.id===dragView.target);return target&&(dragView.mode==='paper'?canMergeIdea(info.snapshot,dragView.ideaId,target):canMergeClips(info.snapshot,dragView.clip,target));})()?t("停留后合夹"):t("不同分组的夹子不能合并，未分组仅支持同标签合并。")):dragView.mode==='paper'?(dragView.valid?t("松开将当前纸张挂到空位 · Esc取消"):t("绳上暂时放不下 · Esc取消")):t("拖动调整位置 · Esc取消")}</span></>}
  {(error||notice)&&<button data-hit className="shelf-error" {...noticeProps} role={error?'alert':'status'} onClick={()=>{setError('');setNotice('');}}>{m(error||notice)}</button>}
  {!error&&!notice&&placement&&<button data-hit className="shelf-error" style={info.placementPoint?{left:info.placementPoint.x,top:info.placementPoint.y,bottom:'auto',transform:'translateX(-50%)'}:undefined} {...placementProps} role={info.placementNoticeKind==='error'?'alert':'status'} onClick={()=>{setPlacement('');if(info.placementTargetId)void window.thoughtline.locateIdea(info.placementTargetId).then(r=>{if(!r.ok)setError(r.message);});else if(layout.overflow.length)void browse();}}>{m(placement)}{info.placementTargetId&&<> · {t('查看')}</>}</button>}
 {!visible.length&&filterKey&&<button data-hit className="shelf-filter-clear" onClick={()=>void window.thoughtline.setShelfFilter({project:null,agentId:'all'})}>{t('没有匹配念头')} · {t('显示全部')}</button>}
 </div>
 {info.lightReminder&&<aside className="light-reminder" data-hit data-reminder-key={info.lightReminder.key} role="status" aria-live="polite">
  <button className="light-reminder-open" onClick={()=>{void window.thoughtline.reminderAction(info.lightReminder!.key,true).then(r=>{if(!r.ok)setError(r.message);});}}><span className="light-reminder-brand">Thoughtline · {t('轻提醒')}{info.lightReminder.count>1?' ('+info.lightReminder.count+')':''}</span><strong>{info.lightReminder.title}</strong><span className="light-reminder-hint">{error?m(error):t('点击查看')}</span></button>
  <button className="light-reminder-close" aria-label={t('关闭提醒')} onClick={()=>{void window.thoughtline.reminderAction(info.lightReminder!.key,false);}}>×</button>
 </aside>}
 </div>;
}
