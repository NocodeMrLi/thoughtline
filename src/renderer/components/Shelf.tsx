import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {shelfSelection} from '../../shared/ideaCommands';
import {sagForCount} from '../../shared/ropeGeometry';
import {currentWeight,retargetWeight,type WeightMotion} from '../../shared/motionTokens';
function useSag(count:number,info:PilotInfo){
 const initial=sagForCount(count);const [value,setValue]=useState(initial);
 const model=useRef<WeightMotion>({from:initial,to:initial,startedAt:0,duration:0});
 useEffect(()=>{
  let frame=0;const reduced=info.snapshot.settings.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  model.current=retargetWeight(model.current,sagForCount(count),performance.now(),{visible:info.shelfVisible,locked:info.interactionLocked,reduced});
  const tick=()=>{setValue(currentWeight(model.current,performance.now()));if(model.current.duration>0&&performance.now()<model.current.startedAt+model.current.duration)frame=requestAnimationFrame(tick);};
  tick();return()=>cancelAnimationFrame(frame);
 },[count,info.shelfVisible,info.interactionLocked,info.snapshot.settings.reducedMotion]);
 return value;
}
export function Shelf({info}:{info:PilotInfo}){
 const root=useRef<HTMLDivElement>(null);const layoutRevision=useRef(0);const [agentId,setAgentId]=useState('all');const [copied,setCopied]=useState<string|null>(null);const [error,setError]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(agentId!=='all'&&!info.snapshot.agents.some(a=>a.id===agentId))setAgentId('all');},[info.snapshot.revision,agentId]);
 const selection=shelfSelection(info.snapshot,agentId,info.width);
 const held=useRef({displayId:info.displayId,width:info.width,selection});
 if(!info.interactionLocked||held.current.displayId!==info.displayId||held.current.width!==info.width)held.current={displayId:info.displayId,width:info.width,selection};
 const visible=held.current.selection.visible;
 const sag=useSag(selection.totalHanging,info);
 useLayoutEffect(()=>{
  const publish=()=>{
   const rects=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-hit]')??[]).map(el=>{const r=el.getBoundingClientRect();const x=Math.max(0,r.x),y=Math.max(0,r.y);return {x,y,width:Math.max(0,Math.min(info.width,r.right)-x),height:Math.max(0,Math.min(innerHeight,r.bottom)-y)};}).filter(r=>r.width>0&&r.height>0);
   window.thoughtline.hitRects({displayId:info.displayId,layoutRevision:++layoutRevision.current,rects});
  };
  publish();const observer=new ResizeObserver(publish);root.current?.querySelectorAll('[data-hit]').forEach(el=>observer.observe(el));
  return()=>observer.disconnect();
 },[info.width,info.displayId,info.snapshot.revision,agentId,sag]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const browse=async(id?:string)=>{const r=await window.thoughtline.openManage(id);if(!r.ok)setError(r.message);};
 const countFor=(id:string)=>info.snapshot.ideas.filter(i=>i.status==='hanging'&&(id==='all'||i.agentId===id)).length;
 return <div ref={root} data-view="shelf" data-visible={info.shelfVisible} className="shelf-root">
  <svg className="rope" data-sag={sag} width="100%" height="140" aria-hidden="true"><path d={`M 0 10 Q ${info.width/2} ${10+2*sag} ${info.width} 10`} /></svg>
  {info.snapshot.ideas.length>0&&<nav className="shelf-tools" aria-label="Agent筛选">
   <button data-hit aria-pressed={agentId==='all'} onClick={()=>setAgentId('all')}>全部 {countFor('all')}</button>
   {info.snapshot.agents.slice(0,4).map(a=><button className="agent-filter" key={a.id} data-hit aria-pressed={agentId===a.id} onClick={()=>setAgentId(a.id)}><i style={{backgroundColor:a.color}}/>{a.name} {countFor(a.id)}</button>)}
   <select data-hit aria-label="Agent筛选列表" value={agentId} onChange={e=>setAgentId(e.target.value)}><option value="all">筛选 Agent</option>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name} {countFor(a.id)}</option>)}</select>
   <button data-hit onClick={()=>void browse()}>{selection.overflow?`还有 ${selection.overflow} 条`:'查找 / 已收起'}</button>
  </nav>}
  {!visible.length&&<div className="empty-rope">{selection.totalHanging?<>这个 Agent 还没有挂着的念头 <button data-hit onClick={()=>setAgentId('all')}>显示全部</button></>:<>还没有念头 · 按 {info.platform==='mac'?'⌃⌥N':'Ctrl+Alt+N'} 写一条</>}</div>}
  {visible.map((idea,index)=>{
   const x=info.width*(index+1)/(visible.length+1),t=x/info.width,y=10+4*sag*t*(1-t);const agent=info.snapshot.agents.find(a=>a.id===idea.agentId);
   return <div className="hanging" data-idea-id={idea.id} key={idea.id} style={{left:x,top:y}}>
    <button data-hit className="peg-button" aria-label={`查看${idea.title}`} onClick={()=>void browse(idea.id)}><span className="peg" style={{backgroundColor:agent?.color}}/></button>
    <article data-hit className="idea-card" onContextMenu={e=>{e.preventDefault();void browse(idea.id);}}>
     <button className="card-copy" aria-label={`${agent?.name??'通用'}：${idea.title}，点击复制正文`} onClick={async()=>{
      const r=await window.thoughtline.copy(idea.id);setCopied(r.ok?idea.id:null);setError(r.ok?'':r.message);
      if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(null),1500);
     }}><span className="agent-name">{agent?.name??'通用'}{idea.project?` · ${idea.project}`:''}</span><strong>{idea.title}</strong><span className="preview">{idea.text}</span></button>
     <footer><span className="copy-status" aria-live="polite">{copied===idea.id?'已复制':'点击复制全文'}</span><button aria-label={`详情与整理：${idea.title}`} onClick={()=>void browse(idea.id)}>···</button></footer>
    </article>
   </div>;
  })}
  {error&&<button data-hit className="shelf-error" role="alert" onClick={()=>void browse()}>{error}</button>}
 </div>;
}
