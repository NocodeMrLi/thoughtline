import type {Snapshot,Draft,Result,AgentTag,Idea} from './contracts';
import {visibleSlots} from './ropeGeometry';
import {independentClip,pruneClips} from './clipModel';
const invalid=<T>(message:string):Result<T>=>({ok:false,code:'INVALID',message});
const plain=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const textOK=(s:unknown,max:number)=>typeof s==='string'&&Array.from(s).length<=max;
const bodyOK=(s:unknown,empty=false)=>typeof s==='string'&&(empty||!!s.trim())&&new TextEncoder().encode(s).length<=1048576;
export function initialSnapshot():Snapshot{return {schemaVersion:2,revision:0,clips:[],ideas:[],agents:[{id:'codex',name:'Codex',color:'#4C90D9'},{id:'claude',name:'Claude',color:'#D79551'},{id:'cursor',name:'Cursor',color:'#9574CE'},{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}};}
export function validateSnapshot(input:unknown):Result<Snapshot>{
  if(!plain(input)||![1,2].includes(Number(input.schemaVersion)))return invalid('无法读取这个数据版本，原文件已保留。');
  if(!Number.isSafeInteger(input.revision)||Number(input.revision)<0||!Array.isArray(input.agents)||!Array.isArray(input.ideas)||!plain(input.settings))return invalid('数据结构不完整。');
  const agents=new Set<string>();
  for(const a of input.agents){
    if(!plain(a)||typeof a.id!=='string'||!a.id||agents.has(a.id)||!textOK(a.name,40)||!(a.name as string).trim()||typeof a.color!=='string'||!/^#[0-9a-f]{6}$/i.test(a.color))return invalid('Agent标签无效。');
    agents.add(a.id);
  }
  if(!agents.size||!agents.has('general'))return invalid('缺少通用标签。');
  const draftOK=(d:Record<string,unknown>)=>bodyOK(d.text,true)&&textOK(d.title,50)&&textOK(d.project,40)&&typeof d.agentId==='string'&&agents.has(d.agentId);
  const ids=new Set<string>();
  for(const idea of input.ideas){
    if(!plain(idea)||typeof idea.id!=='string'||!idea.id||ids.has(idea.id)||!draftOK(idea)||!bodyOK(idea.text)||!['hanging','archived'].includes(String(idea.status))||typeof idea.createdAt!=='string'||!Number.isFinite(Date.parse(idea.createdAt))||typeof idea.updatedAt!=='string'||!Number.isFinite(Date.parse(idea.updatedAt)))return invalid('念头正文或归属无效。');
    ids.add(idea.id);
  }
  if(input.draft!==null&&(!plain(input.draft)||!draftOK(input.draft)))return invalid('草稿无效。');
  if(!textOK(input.settings.writeHotkey,100)||!(input.settings.writeHotkey as string).trim()||typeof input.settings.reducedMotion!=='boolean')return invalid('设置无效。');
  const ideas=input.ideas as Idea[];
  const normalized={...input,schemaVersion:2,clips:input.schemaVersion===1?ideas.filter(i=>i.status==='hanging').sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id)).map(i=>({id:'clip:'+i.id,agentId:i.agentId,ideaIds:[i.id],currentId:i.id,position:null})):input.clips};
  if(!Array.isArray(normalized.clips))return invalid('夹子数据缺失。');
  const clipIds=new Set<string>(),members=new Set<string>();const byId=new Map(ideas.map(i=>[i.id,i]));
  for(const c of normalized.clips){
   if(!plain(c)||typeof c.id!=='string'||!c.id||clipIds.has(c.id)||typeof c.agentId!=='string'||!agents.has(c.agentId)||!Array.isArray(c.ideaIds)||!c.ideaIds.length||typeof c.currentId!=='string'||!c.ideaIds.includes(c.currentId)||!(c.position===null||typeof c.position==='number'&&Number.isFinite(c.position)&&c.position>=0&&c.position<=1))return invalid('夹子结构或位置无效。');
   clipIds.add(c.id);
   for(const id of c.ideaIds){const i=byId.get(id);if(typeof id!=='string'||members.has(id)||!i||i.status!=='hanging'||i.agentId!==c.agentId)return invalid('夹子成员重复、缺失或Agent不一致。');members.add(id);}
  }
  if(ideas.some(i=>i.status==='hanging'&&!members.has(i.id)))return invalid('挂着的念头没有夹子。');
  return {ok:true,value:structuredClone(normalized) as Snapshot};
}
export function newIdea(s:Snapshot,draft:Draft,id:string,now:string):Result<Snapshot>{
  if(!bodyOK(draft.text))return invalid('请输入念头，正文不超过1MiB。');
  const title=draft.title.trim()||Array.from((draft.text.split('\n').find(x=>x.trim())??'').trim()).slice(0,50).join('');
  return validateSnapshot({...s,clips:[...s.clips,independentClip(s,id,draft.agentId)],draft:null,ideas:[...s.ideas,{...draft,title,id,status:'hanging',createdAt:now,updatedAt:now}]});
}
export function changeStatus(s:Snapshot,id:string,status:'hanging'|'archived',now:string):Result<Snapshot>{
  if(!s.ideas.some(x=>x.id===id))return invalid('找不到这条念头。');
  const ideas=s.ideas.map(x=>x.id===id?{...x,status,updatedAt:now}:x);
  let clips=pruneClips(s.clips,ideas);if(status==='hanging'&&!clips.some(c=>c.ideaIds.includes(id)))clips=[...clips,independentClip({...s,clips},id,ideas.find(i=>i.id===id)!.agentId)];
  return validateSnapshot({...s,clips,ideas});
}
export function renameAgent(s:Snapshot,id:string,name:string):Result<Snapshot>{
  if(!s.agents.some(x=>x.id===id))return invalid('找不到这个Agent。');
  return validateSnapshot({...s,agents:s.agents.map(x=>x.id===id?{...x,name}:x)});
}
export function removeAgent(s:Snapshot,id:string,replacement:string):Result<Snapshot>{
  if(id==='general'||id===replacement||!s.agents.some(x=>x.id===id)||!s.agents.some(x=>x.id===replacement))return invalid('请选择存在的替代Agent，通用标签不能移除。');
  return validateSnapshot({...s,clips:s.clips.map(c=>c.agentId===id?{...c,agentId:replacement}:c),agents:s.agents.filter(x=>x.id!==id),ideas:s.ideas.map(x=>x.agentId===id?{...x,agentId:replacement}:x),draft:s.draft?.agentId===id?{...s.draft,agentId:replacement}:s.draft});
}
export function editIdea(s:Snapshot,id:string,draft:Draft,now:string):Result<Snapshot>{
  if(!s.ideas.some(x=>x.id===id)||!draft||!bodyOK(draft.text)||!textOK(draft.title,50)||!textOK(draft.project,40))return invalid('正文、标题或项目无效，请保留文字后重试。');
  const title=draft.title.trim()||Array.from(draft.text.split('\n').find(x=>x.trim())?.trim()??'').slice(0,50).join('');
  const ideas=s.ideas.map(x=>x.id===id?{...x,text:draft.text,title,project:draft.project,agentId:draft.agentId,updatedAt:now}:x);
  let clips=pruneClips(s.clips,ideas);const updated=ideas.find(i=>i.id===id)!;if(updated.status==='hanging'&&!clips.some(c=>c.ideaIds.includes(id)))clips=[...clips,independentClip({...s,clips},id,updated.agentId)];
  return validateSnapshot({...s,clips,ideas});
}
export function addAgent(s:Snapshot,a:AgentTag):Result<Snapshot>{
  return validateSnapshot({...s,agents:[...s.agents,{id:a?.id,name:a?.name,color:a?.color}]});
}
export function updateAgent(s:Snapshot,id:string,patch:Pick<AgentTag,'name'|'color'>):Result<Snapshot>{
  if(!s.agents.some(a=>a.id===id))return invalid('找不到这个Agent。');
  return validateSnapshot({...s,agents:s.agents.map(a=>a.id===id?{...a,name:patch?.name,color:patch?.color}:a)});
}
export type IdeaQuery={status:'all'|'hanging'|'archived';query?:string;agentId?:string};
export function findIdeas(s:Snapshot,q:IdeaQuery):Idea[]{
  const text=(q.query??'').trim().toLowerCase();
  const names=new Map(s.agents.map(a=>[a.id,a.name]));
  return s.ideas.filter(i=>(q.status==='all'||i.status===q.status)&&(!q.agentId||q.agentId==='all'||i.agentId===q.agentId)&&(!text||[i.text,i.title,i.project,names.get(i.agentId)??''].join('\n').toLowerCase().includes(text)))
    .sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||(a.id<b.id?-1:a.id>b.id?1:0));
}
export function shelfSelection(s:Snapshot,agentId:string,width:number){
  const totalHanging=s.ideas.filter(i=>i.status==='hanging').length;
  const filtered=findIdeas(s,{status:'hanging',agentId});
  const visible=filtered.slice(0,visibleSlots(width));
  return {totalHanging,visible,filteredCount:filtered.length,overflow:filtered.length-visible.length};
}
