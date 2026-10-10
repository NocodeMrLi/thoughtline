import type {Draft,Snapshot,Result,Clip} from './contracts';
import {newIdea,changeStatus,validateSnapshot} from './ideaCommands';
import {arrangeClips} from './clipCommands';
import {captureClipPositions,layoutClips,clipTravelBounds,MIN_SPACING} from './clipLayout';
export type PlacementIntent={kind:'save'}|{kind:'hang'}|{kind:'arrange'}|{kind:'swap';targetClipId:string;targetIdeaId:string;expectedIds:string[];wholeClip:boolean};
export type PlacementSource={id:string;draft?:Draft};
export type PlacementUndo={before:Snapshot;after:Snapshot;incomingId:string};
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'CONFLICT',message});
export function placementPlan(s:Snapshot,width:number,ideaId?:string):'hang'|'arrange'|'full'|'already'{
 const shown=layoutClips(s.clips,width);if(ideaId&&shown.visible.some(p=>p.clip.ideaIds.includes(ideaId)))return 'already';
 if(!Number.isFinite(width)||width<=0||ideaId&&!s.ideas.some(i=>i.id===ideaId&&i.status!=='deleted'))return 'full';
 // Capacity depends on clip geometry; never clone/serialize all note bodies on a keystroke.
 let id=ideaId??'capacity:'+s.revision;if(!ideaId)while(s.ideas.some(i=>i.id===id))id+=':';
 const existing=s.clips.some(c=>c.ideaIds.includes(id));
 const candidate=existing?s.clips:[...s.clips,{id:'capacity-probe',agentId:'general',ideaIds:[id],currentId:id,position:null}];
 if(layoutClips(candidate,width).visible.some(p=>p.clip.ideaIds.includes(id)))return 'hang';
 const {min,max}=clipTravelBounds(width),capacity=max<min?0:1+Math.floor((max-min+1e-8)/MIN_SPACING);
 return candidate.length<=capacity?'arrange':'full';
}
export function placeIdea(s:Snapshot,source:PlacementSource,intent:PlacementIntent,width:number,now:string):Result<Snapshot>{
 const checked=validateSnapshot(s);if(!checked.ok)return checked;
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(Date.parse(now))||!intent||!['save','hang','arrange','swap'].includes(intent.kind))return invalid('挂绳状态已变化，请重新选择。');
 const existing=s.ideas.find(i=>i.id===source.id);if(source.draft&&existing||!source.draft&&(!existing||existing.status==='deleted'))return invalid('找不到可操作的念头。');
 const before=intent.kind==='save'?s:{...s,clips:captureClipPositions(s.clips,width)};
 let created=source.draft?newIdea(before,source.draft,source.id,now):changeStatus(before,source.id,'hanging',now);if(!created.ok)return created;
 if(intent.kind==='save')return changeStatus(created.value,source.id,'archived',now);
 if(intent.kind==='hang'){
  const clip=created.value.clips.find(c=>c.ideaIds.includes(source.id));
  if(!clip||!layoutClips(created.value.clips,width).visible.some(p=>p.clip.id===clip.id))return invalid('挂绳空间已变化，请选择保存、整理挂上或换上。');
  return validateSnapshot({...created.value,clips:created.value.clips.map(c=>c.id===clip.id?{...c,currentId:source.id}:c)});
 }
 if(intent.kind==='arrange'){
  const arranged=arrangeClips(created.value,width);if(!arranged.ok)return arranged;
  if(layoutClips(arranged.value.clips,width).overflow.length)return invalid('绳上已满，请选择保存或换上。');return arranged;
 }
 if(typeof intent.wholeClip!=='boolean')return invalid('目标夹子已变化，请重新选择。');
 const target=before.clips.find(c=>c.id===intent.targetClipId),incoming=created.value.ideas.find(i=>i.id===source.id)!;
 if(!target||!target.ideaIds.includes(intent.targetIdeaId)||target.ideaIds.includes(source.id)||!Array.isArray(intent.expectedIds)||JSON.stringify(target.ideaIds)!==JSON.stringify(intent.expectedIds)||!layoutClips(before.clips,width).visible.some(p=>p.clip.id===target.id))return invalid('目标夹子已变化，请重新选择。');
 if(target.ideaIds.length>1&&target.agentId!==incoming.agentId&&!intent.wholeClip)return invalid('不同Agent的叠纸需明确收起整夹后换上。');
 const outgoing=intent.wholeClip?target.ideaIds:[intent.targetIdeaId],outIds=new Set(outgoing);
 const ideas=created.value.ideas.map(i=>outIds.has(i.id)?{...i,status:'archived' as const,updatedAt:now}:i);
 const clips=created.value.clips.flatMap(c=>{
  if(c.id===target.id){const ids=intent.wholeClip?[source.id]:c.ideaIds.map(id=>id===intent.targetIdeaId?source.id:id);return [{...c,agentId:incoming.agentId,ideaIds:ids,currentId:source.id}];}
  const ids=c.ideaIds.filter(id=>id!==source.id);return ids.length?[{...c,ideaIds:ids,currentId:ids.includes(c.currentId)?c.currentId:ids[Math.min(Math.max(0,c.ideaIds.indexOf(c.currentId)),ids.length-1)]}]:[];
 });
 const result=validateSnapshot({...created.value,ideas,clips});if(!result.ok)return result;
 if(!layoutClips(result.value.clips,width).visible.some(p=>p.clip.ideaIds.includes(source.id)))return invalid('挂绳空间已变化，请重新选择。');return result;
}
const structure=(c:Clip|undefined)=>c?JSON.stringify([c.id,c.agentId,c.ideaIds,c.position]):'';
export function undoPlacement(current:Snapshot,undo:PlacementUndo):Result<Snapshot>{
 const beforeIds=new Map(undo.before.ideas.map(i=>[i.id,i]));
 const changes=undo.after.ideas.filter(i=>i.status!==(beforeIds.get(i.id)?.status??'archived'));
 if(changes.some(i=>current.ideas.find(x=>x.id===i.id)?.status!==i.status))return invalid('换上记录已变化，不能撤销。');
 const oldClips=new Map(undo.before.clips.map(c=>[c.id,c])),afterClips=new Map(undo.after.clips.map(c=>[c.id,c]));
 const affected=new Set([...oldClips.keys(),...afterClips.keys()].filter(id=>structure(oldClips.get(id))!==structure(afterClips.get(id))));
 if([...affected].some(id=>structure(current.clips.find(c=>c.id===id))!==structure(afterClips.get(id))))return invalid('夹子已变化，不能撤销换上。');
 const statuses=new Map(changes.map(i=>[i.id,beforeIds.get(i.id)?.status??'archived']));
 const ideas=current.ideas.map(i=>statuses.has(i.id)?{...i,status:statuses.get(i.id)!}:i);
 const clips=current.clips.filter(c=>!affected.has(c.id));
 for(let i=0;i<undo.before.clips.length;i++){const old=undo.before.clips[i];if(affected.has(old.id))clips.splice(Math.min(i,clips.length),0,old);}
 return validateSnapshot({...current,ideas,clips});
}
