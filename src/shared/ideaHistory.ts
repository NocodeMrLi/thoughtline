import type {Idea,Snapshot} from './contracts';
import type {IdeaQuery} from './ideaCommands';

// Old snapshots retain the date written with their original offset. A missing
// offset is interpreted in UTC, never in the timezone used at migration time.
export function ideaDay(idea:Idea):string{
 if(idea.createdDay!==undefined)return idea.createdDay;
 const writtenDay=idea.createdAt.slice(0,10);
 if(/^\d{4}-\d{2}-\d{2}$/.test(writtenDay)&&new Date(writtenDay+'T00:00:00Z').toISOString().slice(0,10)===writtenDay&&/(?:Z|[+-]\d{2}:?\d{2})$/i.test(idea.createdAt))return writtenDay;
 const utc=Date.parse(/^\d{4}-\d{2}-\d{2}T/i.test(idea.createdAt)?idea.createdAt+'Z':idea.createdAt+' UTC');
 return new Date(Number.isFinite(utc)?utc:Date.parse(idea.createdAt)).toISOString().slice(0,10);
}

export function calendarIndex(s:Snapshot,filters:Partial<IdeaQuery>={}):Map<string,Idea[]>{
 const query=(filters.query??'').trim().toLowerCase(),names=new Map(s.agents.map(a=>[a.id,a.name]));
 const ideas=s.ideas.filter(i=>i.status!=='deleted'&&(!filters.status||filters.status==='all'||i.status===filters.status)&&(!filters.agentId||filters.agentId==='all'||i.agentId===filters.agentId)&&(!query||[i.text,i.title,i.project,names.get(i.agentId)??''].join('\n').toLowerCase().includes(query)))
  .sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||(a.id<b.id?-1:a.id>b.id?1:0));
 const days=new Map<string,Idea[]>();
 for(const idea of ideas){const day=ideaDay(idea),entries=days.get(day);if(entries)entries.push(idea);else days.set(day,[idea]);}
 return new Map([...days.entries()].sort(([a],[b])=>a.localeCompare(b)));
}
