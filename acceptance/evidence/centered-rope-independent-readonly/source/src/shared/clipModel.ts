import type {Clip,Idea,Snapshot} from './contracts';
export function independentClip(s:Pick<Snapshot,'clips'>,ideaId:string,agentId:string):Clip{
 let id='clip:'+ideaId;let index=1;while(s.clips.some(c=>c.id===id))id='clip:'+ideaId+':'+index++;
 return {id,agentId,ideaIds:[ideaId],currentId:ideaId,position:null};
}
export function pruneClips(clips:Clip[],ideas:Idea[]):Clip[]{
 const byId=new Map(ideas.map(i=>[i.id,i]));
 return clips.flatMap(c=>{
  const ideaIds=c.ideaIds.filter(id=>{const i=byId.get(id);return i?.status==='hanging'&&i.agentId===c.agentId;});
  if(!ideaIds.length)return [];
  const oldIndex=c.ideaIds.indexOf(c.currentId);const currentId=ideaIds.includes(c.currentId)?c.currentId:ideaIds[Math.min(Math.max(0,oldIndex),ideaIds.length-1)];
  return [{...c,ideaIds,currentId}];
 });
}
