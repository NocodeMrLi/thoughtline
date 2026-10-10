import type {Result,Snapshot} from './contracts';
import {validateSnapshot} from './ideaCommands';
import {layoutClips,clipTravelBounds,normalizedPosition,MIN_SPACING,availableClipPosition} from './clipLayout';
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'INVALID',message});
export function mergeClips(s:Snapshot,sourceId:string,targetId:string):Result<Snapshot>{
 const source=s.clips.find(c=>c.id===sourceId),target=s.clips.find(c=>c.id===targetId);
 if(!source||!target||source===target)return invalid('请选择两个不同夹子。');
 if(source.agentId!==target.agentId)return invalid('不同Agent的夹子不能合并。');
 return validateSnapshot({...s,clips:s.clips.filter(c=>c.id!==sourceId).map(c=>c.id===targetId?{...c,ideaIds:[...c.ideaIds,...source.ideaIds],currentId:source.ideaIds[0]}:c)});
}
export function selectClipIdea(s:Snapshot,id:string,ideaId:string):Result<Snapshot>{
 if(!s.clips.some(c=>c.id===id&&c.ideaIds.includes(ideaId)))return invalid('这张便签不在当前夹子中。');
 return validateSnapshot({...s,clips:s.clips.map(c=>c.id===id?{...c,currentId:ideaId}:c)});
}
export function splitClip(s:Snapshot,id:string,ideaId:string,newId:string,width?:number):Result<Snapshot>{
 const clip=s.clips.find(c=>c.id===id);if(!clip||clip.ideaIds.length<2||!clip.ideaIds.includes(ideaId)||!newId||s.clips.some(c=>c.id===newId))return invalid('无法拆出这张便签。');
 const ideaIds=clip.ideaIds.filter(x=>x!==ideaId);const currentId=ideaIds.includes(clip.currentId)?clip.currentId:ideaIds[Math.min(clip.ideaIds.indexOf(ideaId),ideaIds.length-1)];
 const shown=width===undefined?null:layoutClips(s.clips,width),sourceX=shown?.visible.find(p=>p.clip.id===id)?.x;
 const free=width===undefined?null:availableClipPosition(shown!.visible.map(p=>p.x),width,(sourceX??width/2)+MIN_SPACING);
 const fresh={id:newId,agentId:clip.agentId,ideaIds:[ideaId],currentId:ideaId,position:free!==null&&width!==undefined?normalizedPosition(free,width):null};
 const clips=width!==undefined&&free===null?[...s.clips.map(c=>c.id===id?{...c,ideaIds,currentId}:c),fresh]:s.clips.flatMap(c=>c.id===id?[{...c,ideaIds,currentId},fresh]:[c]);
 return validateSnapshot({...s,clips});
}
export function moveClip(s:Snapshot,id:string,position:number,beforeId:string|null,width?:number,agentId='all'):Result<Snapshot>{
 const clip=s.clips.find(c=>c.id===id);if(!clip||!Number.isFinite(position)||position<0||position>1||beforeId===id||beforeId!==null&&!s.clips.some(c=>c.id===beforeId))return invalid('夹子位置无效。');
 const clips=s.clips.filter(c=>c.id!==id);const index=beforeId===null?clips.length:clips.findIndex(c=>c.id===beforeId);clips.splice(index,0,{...clip,position});
 // Making room is a deliberate move mutation, never a renderer projection.
 // Persist the affected visible ratios so capture/restart cannot silently
 // admit a hidden clip and move unrelated cards on the next operation.
 if(width!==undefined&&Number.isFinite(width)){
  const visible=new Map(layoutClips(s.clips.filter(c=>agentId==='all'||c.agentId===agentId),width).visible.map(p=>[p.clip.id,p.x]));
  if(visible.has(id)){
   const ordered=clips.filter(c=>visible.has(c.id)),{min,max}=clipTravelBounds(width);
   if((ordered.length-1)*MIN_SPACING<=max-min){
    const x=ordered.map(c=>c.id===id?min+position*(max-min):visible.get(c.id)!);
    for(let i=1;i<x.length;i++)x[i]=Math.max(x[i],x[i-1]+MIN_SPACING);
    x[x.length-1]=Math.min(x[x.length-1],max);
    for(let i=x.length-2;i>=0;i--)x[i]=Math.min(x[i],x[i+1]-MIN_SPACING);
    const moved=new Map(ordered.map((c,i)=>[c.id,normalizedPosition(x[i],width)]));
    for(let i=0;i<clips.length;i++)if(moved.has(clips[i].id))clips[i]={...clips[i],position:moved.get(clips[i].id)!};
    // beforeId=null means the end of the visible lane, not behind overflow.
    // Keep the visible selected lane ahead of its hidden tail; otherwise a
    // default-position hidden clip can take the moved clip's place.
    const selected=clips.filter(c=>agentId==='all'||c.agentId===agentId);
    const lane=[...selected.filter(c=>visible.has(c.id)),...selected.filter(c=>!visible.has(c.id))];
    let slot=0;for(let i=0;i<clips.length;i++)if(agentId==='all'||clips[i].agentId===agentId)clips[i]=lane[slot++];
   }
  }
 }
 return validateSnapshot({...s,clips});
}


export function dropClipIdea(s:Snapshot,id:string,ideaId:string,targetId:string|null,position:number|null,newId:string,width:number):Result<Snapshot>{
 const source=s.clips.find(c=>c.id===id);if(!source?.ideaIds.includes(ideaId))return invalid('当前纸张已变化，请重新拖动。');
 if(targetId===id)return invalid('已在这个夹子中。');
 const target=targetId?s.clips.find(c=>c.id===targetId):null;
 if(targetId&&(!target||target.agentId!==source.agentId))return invalid('不同Agent的夹子不能合并。');
 let free:number|null=null;
 if(!targetId){
  if(position===null||!Number.isFinite(position)||position<0||position>1)return invalid('落点无效。');
  const shown=layoutClips(s.clips,width).visible.filter(p=>source.ideaIds.length>1||p.clip.id!==id),{min,max}=clipTravelBounds(width);
  free=availableClipPosition(shown.map(p=>p.x),width,min+position*(max-min));
  if(free===null)return invalid('绳上暂时放不下，纸张保持原位。');
 }
 const next=source.ideaIds.length>1?splitClip(s,id,ideaId,newId,width):{ok:true as const,value:s};if(!next.ok)return next;
 const moving=source.ideaIds.length>1?newId:id;
 if(targetId)return mergeClips(next.value,moving,targetId);
 return validateSnapshot({...next.value,clips:next.value.clips.map(c=>c.id===moving?{...c,position:normalizedPosition(free!,width)}:c)});
}

// Explicit arrangement compacts fragmented space, independently of the active Agent filter.
export function arrangeClips(s:Snapshot,width:number):Result<Snapshot>{
 if(!Number.isFinite(width)||width<0)return invalid('夹子位置无效。');
 const {min,max}=clipTravelBounds(width);if(max<min||!s.clips.length)return validateSnapshot(s);
 const shown=layoutClips(s.clips,width),ordered=[...shown.visible.map(p=>p.clip),...shown.overflow];
 const capacity=Math.max(0,1+Math.floor((max-min+1e-8)/MIN_SPACING)),count=Math.min(capacity,ordered.length);
 const reserve=count<capacity?1:0,start=(min+max-(count-1+reserve)*MIN_SPACING)/2;
 return validateSnapshot({...s,clips:ordered.map((clip,index)=>({...clip,position:index<count?normalizedPosition(start+index*MIN_SPACING,width):null}))});
}
