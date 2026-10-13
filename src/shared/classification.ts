import type {Snapshot,Result} from './contracts';
import {validateSnapshot} from './ideaCommands';
import {migrateDeletedMembers} from './clipModel';
import {projectNames} from './projectCatalog';
export {projectNames};
const invalid=(message:string):Result<Snapshot>=>({ok:false,code:'INVALID',message});
const validName=(name:unknown):name is string=>typeof name==='string'&&!!name.trim()&&Array.from(name.trim()).length<=40;
const sameName=(a:string,b:string)=>a.trim().toLowerCase()===b.trim().toLowerCase();
export function addProject(s:Snapshot,name:unknown):Result<Snapshot>{
 if(!validName(name))return invalid('分组名称须为1～40个字。');
 const value=name.trim(),names=projectNames(s);if(names.some(n=>sameName(n,value)))return invalid('已有同名分组，请选择已有分组。');
 return validateSnapshot({...s,projects:[...names,value]});
}
export function renameProject(s:Snapshot,from:string,name:unknown,now:string):Result<Snapshot>{
 const names=projectNames(s);if(!from||!names.includes(from))return invalid('找不到这个分组。');
 if(!validName(name)||!Number.isFinite(Date.parse(now)))return invalid('分组名称须为1～40个字。');
 const to=name.trim();if(names.some(n=>n!==from&&sameName(n,to)))return invalid('已有同名分组，请使用其他名称。');
 return validateSnapshot({...s,projects:names.map(n=>n===from?to:n),...(s.inactiveProjects?{inactiveProjects:s.inactiveProjects.map(n=>n===from?to:n)}:{}),ideas:s.ideas.map(i=>migrateDeletedMembers(i.project===from?{...i,project:to,updatedAt:now}:i,'project',from,to)),draft:s.draft?.project===from?{...s.draft,project:to}:s.draft});
}
export function classificationCount(s:Snapshot,kind:'tag'|'project',id:string):number{return s.ideas.filter(i=>(kind==='tag'?i.agentId:i.project)===id).length;}

export function activeProjects(s:Snapshot):string[]{return projectNames(s).filter(p=>!s.inactiveProjects?.includes(p));}
export function activeTags(s:Snapshot){return s.agents.filter(a=>!s.inactiveAgents?.includes(a.id));}
export function setClassificationActive(s:Snapshot,kind:'tag'|'project',id:string,active:boolean):Result<Snapshot>{
 if(!id||kind==='tag'&&id==='general'||!(kind==='tag'?s.agents.some(a=>a.id===id):projectNames(s).includes(id)))return invalid('系统分类或不存在的分类不能移除。');
 const key=kind==='tag'?'inactiveAgents':'inactiveProjects',values=(s[key]??[]).filter(v=>v!==id);
 if(!active)values.push(id);
 return validateSnapshot({...s,...(kind==='project'?{projects:projectNames(s)}:{}),[key]:values});
}

// Autosave keeps the record current; only an explicit editing checkpoint adds
// its final group to the independent directory. Paused prefixes are not groups.
export function rememberIdeaProject(s:Snapshot,id:string):Result<Snapshot>{
 if(!s.ideas.some(i=>i.id===id&&i.status!=='deleted'))return invalid('找不到这条念头。');
 return validateSnapshot({...s,projects:projectNames(s)});
}

// User-visible metadata follows context (group), then category (tag).
export function classificationLabel(project:string|undefined,tag:string|undefined):string{return [project,tag].filter(Boolean).join(' · ');}
