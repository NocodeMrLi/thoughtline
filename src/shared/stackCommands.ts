import type {Clip,Idea,Result,Snapshot} from './contracts';
import {canMergeIdea,pruneClips,storedClipFor} from './clipModel';
import {validateSnapshot} from './ideaCommands';
import {onLineIdeaIds,type ShelfFilter} from './ideaVisibility';
import {dropClipIdea} from './clipCommands';
export type MergeTarget={key:string;clip:Clip;idea:Idea;location:'hanging'|'archived'};
export function mergeTargets(s:Snapshot,sourceId:string,query='',displayNames?:ReadonlyMap<string,string>,width=1440,filter:ShelfFilter={project:null,agentId:'all'}):MergeTarget[]{
 const source=s.ideas.find(i=>i.id===sourceId&&i.status==='hanging');if(!source)return [];
 const onLine=onLineIdeaIds(s,width,filter.agentId,filter.project),sourceClip=storedClipFor(s,sourceId),needle=query.trim().toLocaleLowerCase(),names=displayNames??new Map(s.agents.map(a=>[a.id,a.name])),seen=new Set<string>(),targets:MergeTarget[]=[];
 for(const idea of s.ideas){
  if(idea.status==='deleted'||idea.id===sourceId)continue;
  const owner=storedClipFor(s,idea.id),clip=owner??{id:'calendar:'+idea.id,agentId:idea.agentId,ideaIds:[idea.id],currentId:idea.id,position:null};
  if(owner?.id===sourceClip?.id||!canMergeIdea(s,sourceId,clip))continue;
  const location=idea.status==='hanging'&&onLine.has(idea.id)?'hanging':'archived', key=location+':'+clip.id;if(seen.has(key))continue;
  const members=clip.ideaIds.map(id=>s.ideas.find(i=>i.id===id)!).filter(i=>i?.status===idea.status),match=needle?members.find(i=>[names.get(i.agentId),i.title,i.text].join('\n').toLocaleLowerCase().includes(needle)):members.find(i=>i.id===clip.currentId)??members[0];
  if(!match)continue;seen.add(key);targets.push({key,clip,idea:match,location});
 }
 return targets.sort((a,b)=>Number(a.location==='archived')-Number(b.location==='archived'));
}
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'INVALID',message});
export function mergeInto(s:Snapshot,sourceId:string,targetId:string,width:number,now:string,filter:ShelfFilter={project:null,agentId:'all'}):Result<Snapshot>{
 const source=s.clips.find(c=>c.ideaIds.includes(sourceId)),target=mergeTargets(s,sourceId,'',undefined,width,filter).find(t=>t.clip.ideaIds.includes(targetId));
 if(!source||!target||!Number.isFinite(Date.parse(now)))return invalid('合并目标已变化，请重新选择。');
 if(target.location==='hanging')return dropClipIdea(s,source.id,sourceId,target.clip.id,null,'unused',width);
 const memberIds=new Set([...target.clip.ideaIds,sourceId]),ideas=s.ideas.map(i=>memberIds.has(i.id)?{...i,status:'archived' as const,offRopeReason:'manual' as const,updatedAt:now}:i);
 const clips=pruneClips(s.clips,ideas),archivedClips=[...s.archivedClips??[]].filter(c=>c.id!==target.clip.id);
 let key=target.clip.id;while([...clips,...archivedClips].some(c=>c.id===key))key+=':calendar';
 archivedClips.push({...target.clip,id:key,position:null,ideaIds:[...target.clip.ideaIds,sourceId],currentId:sourceId,agentId:ideas.find(i=>i.id===sourceId)!.agentId});
 return validateSnapshot({...s,ideas,clips,archivedClips,...(s.capacityOverflow?{capacityOverflow:s.capacityOverflow.filter(c=>c.id!==target.clip.id)}:{})});
}
export function splitArchived(s:Snapshot,clipId:string,ideaId:string,newId:string):Result<Snapshot>{
 const location=s.archivedClips?.some(c=>c.id===clipId)?'archivedClips':'capacityOverflow',owner=s[location]?.find(c=>c.id===clipId&&c.ideaIds.includes(ideaId));
 if(!owner||owner.ideaIds.length<2||[...s.clips,...s.archivedClips??[],...s.capacityOverflow??[]].some(c=>c.id===newId))return invalid('没有可拆分的日历叠放。');
 const ids=owner.ideaIds.filter(id=>id!==ideaId),currentId=ids.includes(owner.currentId)?owner.currentId:ids[0];
 return validateSnapshot({...s,[location]:s[location]!.flatMap(c=>c.id!==owner.id?[c]:[{...c,ideaIds:ids,currentId},{id:newId,agentId:s.ideas.find(i=>i.id===ideaId)!.agentId,ideaIds:[ideaId],currentId:ideaId,position:null}])});
}
