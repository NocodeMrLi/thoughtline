import type {Idea,Snapshot} from './contracts';
import type {IdeaQuery} from './ideaCommands';
import {storedClipFor} from './clipModel';
import {onLineIdeaIds} from './ideaVisibility';
export type CalendarVisibility={width:number;shelfAgentId?:string;shelfProject?:string|null;names?:ReadonlyMap<string,string>};

// Old snapshots retain the date written with their original offset. A missing
// offset is interpreted in UTC, never in the timezone used at migration time.
export function ideaDay(idea:Idea):string{
 if(idea.createdDay!==undefined)return idea.createdDay;
 const writtenDay=idea.createdAt.slice(0,10);
 if(/^\d{4}-\d{2}-\d{2}$/.test(writtenDay)&&new Date(writtenDay+'T00:00:00Z').toISOString().slice(0,10)===writtenDay&&/(?:Z|[+-]\d{2}:?\d{2})$/i.test(idea.createdAt))return writtenDay;
 const utc=Date.parse(/^\d{4}-\d{2}-\d{2}T/i.test(idea.createdAt)?idea.createdAt+'Z':idea.createdAt+' UTC');
 return new Date(Number.isFinite(utc)?utc:Date.parse(idea.createdAt)).toISOString().slice(0,10);
}

export function calendarIndex(s:Snapshot,filters:Partial<IdeaQuery>={},visibility?:CalendarVisibility):Map<string,Idea[]>{
 const query=(filters.query??'').trim().toLowerCase(),names=new Map(s.agents.map(a=>[a.id,a.name]));
 const onLine=visibility?onLineIdeaIds(s,visibility.width,visibility.shelfAgentId,visibility.shelfProject??null):null;
 const ideas=s.ideas.filter(i=>i.status!=='deleted'&&(!filters.status||filters.status==='all'||(onLine?(i.status==='hanging'&&onLine.has(i.id)?'hanging':'archived'):i.status)===filters.status)&&(!filters.agentId||filters.agentId==='all'||i.agentId===filters.agentId)&&(!query||[i.text,i.title,i.project,names.get(i.agentId)??'',visibility?.names?.get(i.agentId)??''].join('\n').toLowerCase().includes(query)))
  .sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||(a.id<b.id?-1:a.id>b.id?1:0));
 const days=new Map<string,Idea[]>();
 for(const idea of ideas){const day=ideaDay(idea),entries=days.get(day);if(entries)entries.push(idea);else days.set(day,[idea]);}
 return new Map([...days.entries()].sort(([a],[b])=>a.localeCompare(b)));
}

export type CalendarStackCard={key:string;idea:Idea;day:string;count:number;dayCount:number;matchingIds:string[]};
/** Projection after query/status, before pagination. Never changes owners or dates. */
export function calendarStackCards(s:Snapshot,members:Idea[]):CalendarStackCard[]{
 const result:CalendarStackCard[]=[],seen=new Map<string,CalendarStackCard>();
 for(const idea of members){
  if(idea.status==='deleted')continue;
  const clip=storedClipFor(s,idea.id),day=ideaDay(idea),key=day+':'+(clip?'clip:'+clip.id:'idea:'+idea.id);
  const row=seen.get(key);
  if(row){row.matchingIds.push(idea.id);if(clip?.currentId===idea.id)row.idea=idea;continue;}
  const all=clip?s.ideas.filter(i=>clip.ideaIds.includes(i.id)&&i.status!=='deleted'):[idea];
  const card={key,idea,day,count:all.length,dayCount:all.filter(i=>ideaDay(i)===day).length,matchingIds:[idea.id]};
  seen.set(key,card);result.push(card);
 }
 return result;
}

export function formatShelfDay(day:string,locale:'zh-CN'|'en',year=new Date().getFullYear()):string{
 if(day.slice(0,4)!==String(year))return day.replace(/-/g,'/');
 if(locale==='zh-CN')return `${Number(day.slice(5,7))}月${Number(day.slice(8))}日`;
 return new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
}
