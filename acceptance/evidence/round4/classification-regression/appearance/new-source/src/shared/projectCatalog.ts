import type {Snapshot} from './contracts';
/** Includes legacy references so opening a newer version never hides old groups. */
export function projectNames(s:Snapshot):string[]{
 return [...new Set([...(s.projects??[]),...s.ideas.map(i=>i.project),s.draft?.project??''].filter(name=>!!name.trim()))].sort((a,b)=>a.localeCompare(b));
}
