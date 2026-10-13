import type {Clip,Idea,Snapshot} from './contracts';
export function independentClip(s:Pick<Snapshot,'clips'>,ideaId:string,agentId:string):Clip{
 let id='clip:'+ideaId;let index=1;while(s.clips.some(c=>c.id===id))id='clip:'+ideaId+':'+index++;
 return {id,agentId,ideaIds:[ideaId],currentId:ideaId,position:null};
}
export function pruneClips(clips:Clip[],ideas:Idea[]):Clip[]{
 const byId=new Map(ideas.map(i=>[i.id,i]));
 return clips.flatMap(c=>{
  const ideaIds=c.ideaIds.filter(id=>{const i=byId.get(id);return i?.status==='hanging';});
  if(!ideaIds.length)return [];
  const oldIndex=c.ideaIds.indexOf(c.currentId);const currentId=ideaIds.includes(c.currentId)?c.currentId:ideaIds[Math.min(Math.max(0,oldIndex),ideaIds.length-1)];
  return [{...c,ideaIds,currentId,agentId:byId.get(currentId)!.agentId}];
 });
}

// The new merge contract applies to actual members, not the front-page tag mirror.
export function clipGroup(s:Pick<Snapshot,'ideas'>,clip:Clip):string|null{
 const members=clip.ideaIds.map(id=>s.ideas.find(i=>i.id===id));
 if(!members.length||members.some(i=>!i))return null;
 const groups=new Set(members.map(i=>i!.project));return groups.size===1?members[0]!.project:null;
}
export function canMergeClips(s:Pick<Snapshot,'ideas'>,source:Clip,target:Clip):boolean{
 const a=clipGroup(s,source),b=clipGroup(s,target);if(a===null||a!==b)return false;
 if(a)return true;
 const members=[...source.ideaIds,...target.ideaIds].map(id=>s.ideas.find(i=>i.id===id));
 return members.every(i=>!!i)&&new Set(members.map(i=>i!.agentId)).size===1;
}
export function canMergeIdea(s:Pick<Snapshot,'ideas'>,ideaId:string,target:Clip):boolean{
 const idea=s.ideas.find(i=>i.id===ideaId);return !!idea&&canMergeClips(s,{id:'probe',agentId:idea.agentId,ideaIds:[ideaId],currentId:ideaId,position:null},target);
}

// Stored day-calendar stacks are distinct from capacity waiting stacks.
export function storedClipFor(s:Pick<Snapshot,'clips'|'archivedClips'|'capacityOverflow'>,ideaId:string):Clip|undefined{return [...s.clips,...s.archivedClips??[],...s.capacityOverflow??[]].find(c=>c.ideaIds.includes(ideaId));}
export function pruneArchivedClips(clips:Clip[],ideas:Idea[]):Clip[]{const byId=new Map(ideas.map(i=>[i.id,i]));return clips.flatMap(c=>{const ids=c.ideaIds.filter(id=>byId.get(id)?.status==='archived');if(!ids.length)return [];const currentId=ids.includes(c.currentId)?c.currentId:ids[0];return [{...c,ideaIds:ids,currentId,agentId:byId.get(currentId)!.agentId}];});}

export function pruneStoredClips(s:Pick<Snapshot,'archivedClips'|'capacityOverflow'>,ideas:Idea[]){return {...(s.archivedClips?{archivedClips:pruneArchivedClips(s.archivedClips,ideas)}:{}),...(s.capacityOverflow?{capacityOverflow:pruneArchivedClips(s.capacityOverflow,ideas.filter(i=>i.offRopeReason==='capacity'))}:{})};}

export function migrateDeletedMembers(idea:Idea,field:'project'|'agentId',from:string,to:string):Idea{return idea.deletedClip?.members?{...idea,deletedClip:{...idea.deletedClip,members:idea.deletedClip.members.map(m=>m[field]===from?{...m,[field]:to}:m)}}:idea;}
