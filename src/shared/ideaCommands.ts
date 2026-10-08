import type {Snapshot,Draft,Result} from './contracts';
const invalid=<T>(message:string):Result<T>=>({ok:false,code:'INVALID',message});
const plain=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const textOK=(s:unknown,max:number)=>typeof s==='string'&&Array.from(s).length<=max;
const bodyOK=(s:unknown,empty=false)=>typeof s==='string'&&(empty||!!s.trim())&&new TextEncoder().encode(s).length<=1048576;
export function initialSnapshot():Snapshot{return {schemaVersion:1,revision:0,ideas:[],agents:[{id:'codex',name:'Codex',color:'#7EAC65'},{id:'claude',name:'Claude',color:'#D59569'},{id:'cursor',name:'Cursor',color:'#8AADD4'},{id:'general',name:'通用',color:'#A4A5B0'}],draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}};}
export function validateSnapshot(input:unknown):Result<Snapshot>{
  if(!plain(input)||input.schemaVersion!==1)return invalid('无法读取这个数据版本，原文件已保留。');
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
  return {ok:true,value:structuredClone(input) as Snapshot};
}
export function newIdea(s:Snapshot,draft:Draft,id:string,now:string):Result<Snapshot>{
  if(!bodyOK(draft.text))return invalid('请输入念头，正文不超过1MiB。');
  const title=draft.title.trim()||Array.from(draft.text.split('\n')[0].trim()).slice(0,50).join('');
  return validateSnapshot({...s,draft:null,ideas:[...s.ideas,{...draft,title,id,status:'hanging',createdAt:now,updatedAt:now}]});
}
export function changeStatus(s:Snapshot,id:string,status:'hanging'|'archived',now:string):Result<Snapshot>{
  if(!s.ideas.some(x=>x.id===id))return invalid('找不到这条念头。');
  return validateSnapshot({...s,ideas:s.ideas.map(x=>x.id===id?{...x,status,updatedAt:now}:x)});
}
export function renameAgent(s:Snapshot,id:string,name:string):Result<Snapshot>{
  if(!s.agents.some(x=>x.id===id))return invalid('找不到这个Agent。');
  return validateSnapshot({...s,agents:s.agents.map(x=>x.id===id?{...x,name}:x)});
}
export function removeAgent(s:Snapshot,id:string,replacement:string):Result<Snapshot>{
  if(id==='general'||id===replacement||!s.agents.some(x=>x.id===id)||!s.agents.some(x=>x.id===replacement))return invalid('请选择存在的替代Agent，通用标签不能移除。');
  return validateSnapshot({...s,agents:s.agents.filter(x=>x.id!==id),ideas:s.ideas.map(x=>x.agentId===id?{...x,agentId:replacement}:x),draft:s.draft?.agentId===id?{...s.draft,agentId:replacement}:s.draft});
}
