import type {Result,Snapshot} from './contracts';
import {validateSnapshot} from './ideaCommands';
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
export function splitClip(s:Snapshot,id:string,ideaId:string,newId:string):Result<Snapshot>{
 const clip=s.clips.find(c=>c.id===id);if(!clip||clip.ideaIds.length<2||!clip.ideaIds.includes(ideaId)||!newId||s.clips.some(c=>c.id===newId))return invalid('无法拆出这张便签。');
 const ideaIds=clip.ideaIds.filter(x=>x!==ideaId);const currentId=ideaIds.includes(clip.currentId)?clip.currentId:ideaIds[Math.min(clip.ideaIds.indexOf(ideaId),ideaIds.length-1)];
 const clips=s.clips.flatMap(c=>c.id===id?[{...c,ideaIds,currentId},{id:newId,agentId:c.agentId,ideaIds:[ideaId],currentId:ideaId,position:null}]:[c]);
 return validateSnapshot({...s,clips});
}
export function moveClip(s:Snapshot,id:string,position:number,beforeId:string|null):Result<Snapshot>{
 const clip=s.clips.find(c=>c.id===id);if(!clip||!Number.isFinite(position)||position<0||position>1||beforeId===id||beforeId!==null&&!s.clips.some(c=>c.id===beforeId))return invalid('夹子位置无效。');
 const clips=s.clips.filter(c=>c.id!==id);const index=beforeId===null?clips.length:clips.findIndex(c=>c.id===beforeId);clips.splice(index,0,{...clip,position});
 return validateSnapshot({...s,clips});
}
