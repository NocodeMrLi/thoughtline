import {shelfCapacity} from './ropeGeometry';
import type {Draft,Snapshot,Result,Clip} from './contracts';
import {newIdea,changeStatus,validateSnapshot} from './ideaCommands';
import {arrangeClips} from './clipCommands';
import {captureClipPositions,layoutClips,clipTravelBounds,clipMetrics} from './clipLayout';
export type PlacementIntent={kind:'save'}|{kind:'hang'}|{kind:'arrange'}|{kind:'swap';targetClipId:string;targetIdeaId:string;expectedIds:string[];wholeClip:boolean};
export type PlacementSource={id:string;draft?:Draft};
export type PlacementUndo={before:Snapshot;after:Snapshot;incomingId:string};
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'CONFLICT',message});
export function placementPlan(s:Snapshot,width:number,ideaId?:string):'hang'|'arrange'|'full'|'already'{
 const spacing=clipMetrics(width??1440,shelfCapacity(s.settings.shelfCapacity)).spacing;
 const shown=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity));if(ideaId&&shown.visible.some(p=>p.clip.ideaIds.includes(ideaId)))return 'already';
 if(!Number.isFinite(width)||width<=0||ideaId&&!s.ideas.some(i=>i.id===ideaId&&i.status!=='deleted'))return 'full';
 // Capacity depends on clip geometry; never clone/serialize all note bodies on a keystroke.
 let id=ideaId??'capacity:'+s.revision;if(!ideaId)while(s.ideas.some(i=>i.id===id))id+=':';
 const existing=s.clips.some(c=>c.ideaIds.includes(id));
 const positioned=captureClipPositions(s.clips,width,'all',shelfCapacity(s.settings.shelfCapacity));
 const candidate=existing?positioned:[...positioned,{id:'capacity-probe',agentId:'general',ideaIds:[id],currentId:id,position:null}];
 if(layoutClips(candidate,width,shelfCapacity(s.settings.shelfCapacity)).visible.some(p=>p.clip.ideaIds.includes(id)))return 'hang';
 const {min,max}=clipTravelBounds(width,shelfCapacity(s.settings.shelfCapacity)),capacity=shelfCapacity(s.settings.shelfCapacity);
 return candidate.length<=capacity?'arrange':'full';
}
export function placeIdea(s:Snapshot,source:PlacementSource,intent:PlacementIntent,width:number,now:string):Result<Snapshot>{
 const checked=validateSnapshot(s);if(!checked.ok)return checked;
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(Date.parse(now))||!intent||!['save','hang','arrange','swap'].includes(intent.kind))return invalid('挂绳状态已变化，请重新选择。');
 const existing=s.ideas.find(i=>i.id===source.id);if(source.draft&&existing||!source.draft&&(!existing||existing.status==='deleted'))return invalid('找不到可操作的念头。');
 const before=intent.kind==='save'?s:{...s,clips:captureClipPositions(s.clips,width,'all',shelfCapacity(s.settings.shelfCapacity))};
 let created=source.draft?newIdea(before,source.draft,source.id,now):changeStatus(before,source.id,'hanging',now);if(!created.ok)return created;
 if(intent.kind==='save'){const r=changeStatus(created.value,source.id,'archived',now);return r.ok?validateSnapshot({...r.value,ideas:r.value.ideas.map(i=>i.id===source.id?{...i,offRopeReason:placementPlan(s,width)==='full'?'waiting':'manual'}:i)}):r;}
 if(intent.kind==='hang'){
  const clip=created.value.clips.find(c=>c.ideaIds.includes(source.id));
  if(!clip||!layoutClips(created.value.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible.some(p=>p.clip.id===clip.id))return invalid('挂绳空间已变化，请选择保存、整理挂上或换上。');
  return validateSnapshot({...created.value,clips:created.value.clips.map(c=>c.id===clip.id?{...c,currentId:source.id}:c)});
 }
 if(intent.kind==='arrange'){
  const arranged=arrangeClips(created.value,width);if(!arranged.ok)return arranged;
  if(layoutClips(arranged.value.clips,width,shelfCapacity(s.settings.shelfCapacity)).overflow.length)return invalid('绳上已满，请选择保存或换上。');return arranged;
 }
 if(typeof intent.wholeClip!=='boolean')return invalid('目标夹子已变化，请重新选择。');
 const target=before.clips.find(c=>c.id===intent.targetClipId),incoming=created.value.ideas.find(i=>i.id===source.id)!;
 if(!target||!target.ideaIds.includes(intent.targetIdeaId)||target.ideaIds.includes(source.id)||!Array.isArray(intent.expectedIds)||JSON.stringify(target.ideaIds)!==JSON.stringify(intent.expectedIds)||!layoutClips(before.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible.some(p=>p.clip.id===target.id))return invalid('目标夹子已变化，请重新选择。');
 if(target.ideaIds.length>1&&target.agentId!==incoming.agentId&&!intent.wholeClip)return invalid('不同标签的叠纸需明确收起整夹后换上。');
 const outgoing=intent.wholeClip?target.ideaIds:[intent.targetIdeaId],outIds=new Set(outgoing);
 const ideas=created.value.ideas.map(i=>outIds.has(i.id)?{...i,status:'archived' as const,offRopeReason:'replaced' as const,updatedAt:now}:i);
 const clips=created.value.clips.flatMap(c=>{
  if(c.id===target.id){const ids=intent.wholeClip?[source.id]:c.ideaIds.map(id=>id===intent.targetIdeaId?source.id:id);return [{...c,agentId:incoming.agentId,ideaIds:ids,currentId:source.id}];}
  const ids=c.ideaIds.filter(id=>id!==source.id);return ids.length?[{...c,ideaIds:ids,currentId:ids.includes(c.currentId)?c.currentId:ids[Math.min(Math.max(0,c.ideaIds.indexOf(c.currentId)),ids.length-1)]}]:[];
 });
 const result=validateSnapshot({...created.value,ideas,clips});if(!result.ok)return result;
 if(!layoutClips(result.value.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible.some(p=>p.clip.ideaIds.includes(source.id)))return invalid('挂绳空间已变化，请重新选择。');return result;
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
 const ideas=current.ideas.map(i=>statuses.has(i.id)?{...i,status:statuses.get(i.id)!,offRopeReason:beforeIds.get(i.id)?.offRopeReason}:i);
 const clips=current.clips.filter(c=>!affected.has(c.id));
 for(let i=0;i<undo.before.clips.length;i++){const old=undo.before.clips[i];if(affected.has(old.id))clips.splice(Math.min(i,clips.length),0,old);}
 return validateSnapshot({...current,ideas,clips,...(undo.before.capacityOverflow?{capacityOverflow:undo.before.capacityOverflow}:{})});
}

// Only explicit new waiting records are eligible; legacy archived records stay put.
export function backfillIdeas(s:Snapshot,width:number,now:string,agentId='all'):Result<Snapshot>{
 let next=s;const capacity=shelfCapacity(s.settings.shelfCapacity);
 const candidates=s.ideas.filter(i=>i.status==='archived'&&(i.offRopeReason==='waiting'||i.offRopeReason==='capacity')&&(agentId==='all'||i.agentId===agentId))
  .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||(a.id<b.id?-1:a.id>b.id?1:0));
 for(const idea of candidates){
  if(next.ideas.find(i=>i.id===idea.id)?.status!=='archived')continue;
  if(next.clips.length>=capacity)break;
  const group=next.capacityOverflow?.find(c=>c.ideaIds.includes(idea.id));
  if(group){
   let groupId=group.id;for(let suffix=1;next.clips.some(c=>c.id===groupId);suffix++)groupId=group.id+':capacity:'+suffix;
   const ids=new Set(group.ideaIds),restored={...next,clips:[...captureClipPositions(next.clips,width,'all',capacity),{...group,id:groupId,position:null}],capacityOverflow:next.capacityOverflow!.filter(c=>c.id!==group.id),ideas:next.ideas.map(i=>ids.has(i.id)?{...i,status:'hanging' as const,offRopeReason:undefined,updatedAt:now}:i)};
   const placed=layoutClips(restored.clips,width,capacity).overflow.length?arrangeClips(restored,width):validateSnapshot(restored);if(!placed.ok)return placed;next=placed.value;continue;
  }
  const plan=placementPlan(next,width,idea.id);if(plan==='full')break;
  const placed=placeIdea(next,{id:idea.id},{kind:plan==='arrange'?'arrange':'hang'},width,now);if(!placed.ok)return placed;
  next=placed.value;
 }
 return validateSnapshot(next);
}
export function setShelfCapacity(s:Snapshot,capacity:4|6|8,width:number,now:string,agentId='all'):Result<Snapshot>{
 if(![4,6,8].includes(capacity))return {ok:false,code:'INVALID',message:'设置无效。'};
 if(capacity===shelfCapacity(s.settings.shelfCapacity))return validateSnapshot({...s,settings:{...s.settings,shelfCapacity:capacity}});
 const old=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)),ordered=[...old.visible.map(p=>p.clip),...old.overflow],overflow=new Set(ordered.slice(capacity).flatMap(c=>c.ideaIds));
 const base={...s,settings:{...s.settings,shelfCapacity:capacity},clips:ordered.slice(0,capacity).map(c=>({...c,position:null})),capacityOverflow:[...s.capacityOverflow??[],...ordered.slice(capacity)],ideas:s.ideas.map(i=>overflow.has(i.id)?{...i,status:'archived' as const,offRopeReason:'capacity' as const,updatedAt:now}:i)};
 return backfillIdeas(base,width,now,agentId);
}
