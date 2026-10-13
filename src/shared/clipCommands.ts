import {shelfCapacity} from './ropeGeometry';
import type {Result,Snapshot} from './contracts';
import {filteredClips} from './ideaVisibility';
import {canMergeClips,canMergeIdea} from './clipModel';
import {validateSnapshot} from './ideaCommands';
import {layoutClips,clipTravelBounds,normalizedPosition,clipMetrics,availableClipPosition} from './clipLayout';
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'INVALID',message});
export function mergeClips(s:Snapshot,sourceId:string,targetId:string,currentId?:string):Result<Snapshot>{
 const source=s.clips.find(c=>c.id===sourceId),target=s.clips.find(c=>c.id===targetId);
 if(!source||!target||source===target)return invalid('请选择两个不同夹子。');
 if(!canMergeClips(s,source,target))return invalid('不同分组的夹子不能合并，未分组仅支持同标签合并。');
 if(currentId!==undefined&&!source.ideaIds.includes(currentId))return invalid('当前纸张已变化，请重新拖动。');
 return validateSnapshot({...s,clips:s.clips.filter(c=>c.id!==sourceId).map(c=>c.id===targetId?{...c,ideaIds:[...c.ideaIds,...source.ideaIds],currentId:currentId??source.currentId}:c)});
}
export function selectClipIdea(s:Snapshot,id:string,ideaId:string):Result<Snapshot>{
 if(![...s.clips,...s.archivedClips??[],...s.capacityOverflow??[]].some(c=>c.id===id&&c.ideaIds.includes(ideaId)))return invalid('这张便签不在当前夹子中。');
 return validateSnapshot({...s,clips:s.clips.map(c=>c.id===id?{...c,currentId:ideaId}:c),...(s.archivedClips?{archivedClips:s.archivedClips.map(c=>c.id===id?{...c,currentId:ideaId}:c)}:{}),...(s.capacityOverflow?{capacityOverflow:s.capacityOverflow.map(c=>c.id===id?{...c,currentId:ideaId}:c)}:{})});
}
export function splitClip(s:Snapshot,id:string,ideaId:string,newId:string,width?:number):Result<Snapshot>{
 const spacing=clipMetrics(width??1440,shelfCapacity(s.settings.shelfCapacity)).spacing;
 const clip=s.clips.find(c=>c.id===id);if(!clip||clip.ideaIds.length<2||!clip.ideaIds.includes(ideaId)||!newId||s.clips.some(c=>c.id===newId))return invalid('无法拆出这张便签。');
 const ideaIds=clip.ideaIds.filter(x=>x!==ideaId);const currentId=ideaIds.includes(clip.currentId)?clip.currentId:ideaIds[Math.min(clip.ideaIds.indexOf(ideaId),ideaIds.length-1)];
 const shown=width===undefined?null:layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)),sourceX=shown?.visible.find(p=>p.clip.id===id)?.x;
 const free=width===undefined?null:availableClipPosition(shown!.visible.map(p=>p.x),width,(sourceX??width/2)+spacing,shelfCapacity(s.settings.shelfCapacity));
 const fresh={id:newId,agentId:s.ideas.find(i=>i.id===ideaId)!.agentId,ideaIds:[ideaId],currentId:ideaId,position:free!==null&&width!==undefined?normalizedPosition(free,width,shelfCapacity(s.settings.shelfCapacity)):null};
 const clips=width!==undefined&&free===null?[...s.clips.map(c=>c.id===id?{...c,ideaIds,currentId}:c),fresh]:s.clips.flatMap(c=>c.id===id?[{...c,ideaIds,currentId},fresh]:[c]);
 const result=validateSnapshot({...s,clips});
 // A menu split may reclaim fragmented spacing, but never moves hand-placed clips
 // when an existing gap is available. Genuine capacity overflow stays explicit.
 if(result.ok&&width!==undefined&&free===null){
  const arranged=arrangeClips(result.value,width);
  if(arranged.ok&&layoutClips(arranged.value.clips,width,shelfCapacity(s.settings.shelfCapacity)).overflow.length===0)return arranged;
 }
 return result;
}
export function moveClip(s:Snapshot,id:string,position:number,beforeId:string|null,width?:number,agentId='all',project:string|null=null):Result<Snapshot>{
 const spacing=clipMetrics(width??1440,shelfCapacity(s.settings.shelfCapacity)).spacing;
 const clip=s.clips.find(c=>c.id===id);if(!clip||!Number.isFinite(position)||position<0||position>1||beforeId===id||beforeId!==null&&!s.clips.some(c=>c.id===beforeId))return invalid('夹子位置无效。');
 const clips=s.clips.filter(c=>c.id!==id);const index=beforeId===null?clips.length:clips.findIndex(c=>c.id===beforeId);clips.splice(index,0,{...clip,position});
 // Making room is a deliberate move mutation, never a renderer projection.
 // Persist the affected visible ratios so capture/restart cannot silently
 // admit a hidden clip and move unrelated cards on the next operation.
 if(width!==undefined&&Number.isFinite(width)){
  const visible=new Map(layoutClips(filteredClips(s,{agentId,project}),width,shelfCapacity(s.settings.shelfCapacity)).visible.map(p=>[p.clip.id,p.x]));
  if(visible.has(id)){
   const ordered=[...visible.keys()].filter(key=>key!==id).map(key=>clips.find(c=>c.id===key)!);const at=beforeId===null?ordered.length:ordered.findIndex(c=>c.id===beforeId);ordered.splice(at<0?ordered.length:at,0,clips.find(c=>c.id===id)!);const {min,max}=clipTravelBounds(width,shelfCapacity(s.settings.shelfCapacity));
   if((ordered.length-1)*spacing<=max-min){
    const x=ordered.map(c=>c.id===id?min+position*(max-min):visible.get(c.id)!);
    for(let i=1;i<x.length;i++)x[i]=Math.max(x[i],x[i-1]+spacing);
    x[x.length-1]=Math.min(x[x.length-1],max);
    for(let i=x.length-2;i>=0;i--)x[i]=Math.min(x[i],x[i+1]-spacing);
    const moved=new Map(ordered.map((c,i)=>[c.id,normalizedPosition(x[i],width,shelfCapacity(s.settings.shelfCapacity))]));
    for(let i=0;i<clips.length;i++)if(moved.has(clips[i].id))clips[i]={...clips[i],position:moved.get(clips[i].id)!};
    // beforeId=null means the end of the visible lane, not behind overflow.
    // Keep the visible selected lane ahead of its hidden tail; otherwise a
    // default-position hidden clip can take the moved clip's place.
    const selectedIds=new Set(filteredClips(s,{agentId,project}).map(c=>c.id)),selected=clips.filter(c=>selectedIds.has(c.id));
    const lane=[...ordered.map(c=>clips.find(p=>p.id===c.id)!),...selected.filter(c=>!visible.has(c.id))];
    let slot=0;for(let i=0;i<clips.length;i++)if(selectedIds.has(clips[i].id))clips[i]=lane[slot++];
   }
  }
 }
 return validateSnapshot({...s,clips});
}


export function dropClipIdea(s:Snapshot,id:string,ideaId:string,targetId:string|null,position:number|null,newId:string,width:number):Result<Snapshot>{
 const spacing=clipMetrics(width??1440,shelfCapacity(s.settings.shelfCapacity)).spacing;
 const source=s.clips.find(c=>c.id===id);if(!source?.ideaIds.includes(ideaId))return invalid('当前纸张已变化，请重新拖动。');
 if(targetId===id)return invalid('已在这个夹子中。');
 const target=targetId?s.clips.find(c=>c.id===targetId):null;
 if(targetId&&(!target||!canMergeIdea(s,ideaId,target)))return invalid('不同分组的夹子不能合并，未分组仅支持同标签合并。');
 let free:number|null=null;
 if(!targetId){
  if(position===null||!Number.isFinite(position)||position<0||position>1)return invalid('落点无效。');
  const shown=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible.filter(p=>source.ideaIds.length>1||p.clip.id!==id),{min,max}=clipTravelBounds(width,shelfCapacity(s.settings.shelfCapacity));
  free=availableClipPosition(shown.map(p=>p.x),width,min+position*(max-min),shelfCapacity(s.settings.shelfCapacity));
  if(free===null)return invalid('绳上暂时放不下，纸张保持原位。');
 }
 const next=source.ideaIds.length>1?splitClip(s,id,ideaId,newId,targetId?undefined:width):{ok:true as const,value:s};if(!next.ok)return next;
 const moving=source.ideaIds.length>1?newId:id;
 if(targetId)return mergeClips(next.value,moving,targetId);
 return validateSnapshot({...next.value,clips:next.value.clips.map(c=>c.id===moving?{...c,position:normalizedPosition(free!,width,shelfCapacity(s.settings.shelfCapacity))}:c)});
}

// Explicit arrangement compacts fragmented space, independently of the active Agent filter.
export function arrangeClips(s:Snapshot,width:number):Result<Snapshot>{
 const spacing=clipMetrics(width??1440,shelfCapacity(s.settings.shelfCapacity)).spacing;
 if(!Number.isFinite(width)||width<0)return invalid('夹子位置无效。');
 const {min,max}=clipTravelBounds(width,shelfCapacity(s.settings.shelfCapacity));if(max<min||!s.clips.length)return validateSnapshot(s);
 const shown=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)),ordered=[...shown.visible.map(p=>p.clip),...shown.overflow];
 const capacity=shelfCapacity(s.settings.shelfCapacity),count=Math.min(capacity,ordered.length);
 const reserve=count<capacity?1:0,start=(min+max-(count-1+reserve)*spacing)/2;
 return validateSnapshot({...s,clips:ordered.map((clip,index)=>({...clip,position:index<count?normalizedPosition(start+index*spacing,width,shelfCapacity(s.settings.shelfCapacity)):null}))});
}
