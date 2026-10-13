import {shelfCapacity} from './ropeGeometry';
import type {Snapshot,Clip,AgentTag} from './contracts';
import {layoutClips} from './clipLayout';
export type ShelfFilter={project:string|null;agentId:string};
export function matchesShelfFilter(idea:Pick<Snapshot['ideas'][number],'project'|'agentId'>,filter:ShelfFilter):boolean{
 return (filter.project===null||idea.project===filter.project)&&(filter.agentId==='all'||idea.agentId===filter.agentId);
}
/** Return view IDs separately; mutations must always retain the original clip. */
export function matchingClipIds(s:Snapshot,clip:Clip,filter:ShelfFilter):string[]{
 const members=new Map(s.ideas.map(i=>[i.id,i]));
 return clip.ideaIds.filter(id=>{const i=members.get(id);return i?.status==='hanging'&&matchesShelfFilter(i,filter);});
}
export function filteredClips(s:Snapshot,filter:ShelfFilter):Clip[]{return s.clips.filter(c=>matchingClipIds(s,c,filter).length>0);}
export function filterTagOptions(s:Snapshot,project:string|null):AgentTag[]{
 const used=new Set(s.clips.flatMap(c=>matchingClipIds(s,c,{project,agentId:'all'})).map(id=>s.ideas.find(i=>i.id===id)!.agentId));
 return s.agents.filter(a=>used.has(a.id)).sort((a,b)=>Number(b.id==='general')-Number(a.id==='general'));
}

/** Capacity is a view fact: reading/filtering/resizing must not rewrite notes. */
export function onLineIdeaIds(s:Snapshot,width:number,shelfAgentId='all',project:string|null=null):Set<string>{
 const shown=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible;
 // A label filter does not put away otherwise allocated clips. Old overflowing
 // clips can nevertheless fit when that label is shown by itself.
 const filtered=shelfAgentId==='all'&&project===null?[]:layoutClips(filteredClips(s,{agentId:shelfAgentId,project}),width,shelfCapacity(s.settings.shelfCapacity)).visible;
 return new Set([...shown,...filtered].flatMap(p=>p.clip.ideaIds));
}
