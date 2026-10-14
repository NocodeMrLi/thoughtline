import type {Snapshot,Result} from './contracts';
import {validateSnapshot} from './ideaCommands';
import {projectNames} from './projectCatalog';
import {pruneClips,pruneStoredClips} from './clipModel';
export type ClassificationField='tag'|'project';
export function classificationDeletionPreview(s:Snapshot,field:ClassificationField,id:string){
 const exists=field==='tag'?s.agents.some(a=>a.id===id):!!id&&projectNames(s).includes(id);
 const matches=(i:{agentId:string;project:string})=>(field==='tag'?i.agentId:i.project)===id;
 const ideas=s.ideas.filter(matches),draft=s.draft&&matches(s.draft)?s.draft:null;
 const counts={hanging:0,archived:0,deleted:0};for(const i of ideas)counts[i.status]++;
 const classification=field==='tag'?s.agents.find(a=>a.id===id)??null:exists?id:null;
 const ids=new Set(ideas.map(i=>i.id)),order=(a:{id:string},b:{id:string})=>a.id<b.id?-1:a.id>b.id?1:0;
 const membership=[s.clips,s.archivedClips??[],s.capacityOverflow??[]].map(rows=>rows.filter(c=>c.ideaIds.some(id=>ids.has(id))).map(c=>({id:c.id,ideaIds:c.ideaIds})).sort(order));
 // Exact contents, not a lossy hash. Unrelated window/preferences revisions do
 // not disarm a confirmation; the IPC still checks its fresh full revision.
 const fingerprint=JSON.stringify({field,id,classification,ideas:[...ideas].sort(order),draft,membership});
 return {exists,ideas,draft,counts,fingerprint};
}
function cleaned(s:Snapshot,field:ClassificationField,id:string,ids:string[],current?:Snapshot):Result<Snapshot>{
 const removed=new Set(ids),key=field==='tag'?'agentId':'project';
 let ideas=s.ideas.filter(i=>!removed.has(i.id)).map(i=>{
  if(current&&i[key]===id){const now=current.ideas.find(n=>n.id===i.id);if(now)return {...i,[key]:now[key]};}
  return i;
 });
 const byId=new Map(ideas.map(i=>[i.id,i]));
 ideas=ideas.map(i=>{const clip=i.deletedClip;if(!clip?.members)return i;
  const members=clip.members.filter(m=>!removed.has(m.id)&&!(m[key]===id&&!byId.has(m.id))).map(m=>{const row=byId.get(m.id);return m[key]===id&&row?{...m,[key]:row[key]}:m;});
  if(JSON.stringify(members)===JSON.stringify(clip.members))return i;
  const {members:_old,...rest}=clip;
  return {...i,deletedClip:{...rest,index:Math.max(0,members.findIndex(m=>m.id===i.id)),...(members.length?{members}:{})}};
 });
 const draft=current?current.draft:s.draft?.[key]===id?null:s.draft;
 const projects=current?current.projects:field==='project'?projectNames(s).filter(p=>p!==id):s.projects;
 return validateSnapshot({...s,ideas,draft,clips:pruneClips(s.clips,ideas),...pruneStoredClips(s,ideas),
  ...(projects?{projects}:{}),agents:current?current.agents:field==='tag'?s.agents.filter(a=>a.id!==id):s.agents,
  ...(s.inactiveProjects||current?.inactiveProjects?{inactiveProjects:current?.inactiveProjects??(field==='project'?s.inactiveProjects!.filter(p=>p!==id):s.inactiveProjects!)}:{}),
  ...(s.inactiveAgents||current?.inactiveAgents?{inactiveAgents:current?.inactiveAgents??(field==='tag'?s.inactiveAgents!.filter(p=>p!==id):s.inactiveAgents!)}:{})});
}
export function deleteClassificationContents(s:Snapshot,field:ClassificationField,id:string,expectedFingerprint:string):Result<Snapshot>{
 if(!id||field==='tag'&&id==='general'||!['tag','project'].includes(field))return {ok:false,code:'INVALID',message:'默认分类不能删除。'};
 const valid=validateSnapshot(s);if(!valid.ok)return valid;const preview=classificationDeletionPreview(valid.value,field,id);
 if(!preview.exists)return {ok:false,code:'INVALID',message:'找不到这个分类。'};
 if(preview.fingerprint!==expectedFingerprint)return {ok:false,code:'CONFLICT',message:'删除范围已更新，请重新确认。'};
 return cleaned(valid.value,field,id,preview.ideas.map(i=>i.id));
}
export function sanitizeClassificationDeletionSnapshot(s:Snapshot,field:ClassificationField,id:string,ids:string[],current:Snapshot):Result<Snapshot>{return cleaned(s,field,id,ids,current);}
