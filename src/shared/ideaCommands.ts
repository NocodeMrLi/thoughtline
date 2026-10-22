// SPDX-License-Identifier: GPL-3.0-only
import type {Snapshot,Draft,Result,AgentTag,Idea,Clip} from './contracts';
import {captureClipPositions,layoutClips} from './clipLayout';
import {arrangeClips} from './clipCommands';
import {onLineIdeaIds} from './ideaVisibility';
import {visibleSlots,shelfCapacity} from './ropeGeometry';
import {independentClip,pruneClips,canMergeIdea,pruneArchivedClips,pruneStoredClips,migrateDeletedMembers,storedClipFor,clipGroup} from './clipModel';
import {ideaDay} from './ideaHistory';
import {validReminder,validReminderTime} from './reminderTime';
import {DEFAULT_TAGS} from './tagPresets';
import {hasIdeaContent} from './ideaContent';
import {projectNames} from './projectCatalog';
import {validPaper,validRope} from './appearance';
const invalid=<T>(message:string):Result<T>=>({ok:false,code:'INVALID',message});
const plain=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const textOK=(s:unknown,max:number)=>typeof s==='string'&&Array.from(s).length<=max;
const bodyOK=(s:unknown,empty=false)=>typeof s==='string'&&(empty||!!s.trim())&&new TextEncoder().encode(s).length<=1048576;
const dayOK=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const localDay=(createdAt:string)=>{const d=new Date(createdAt);return `${String(d.getFullYear()).padStart(4,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function initialSnapshot():Snapshot{return {schemaVersion:4,revision:0,clips:[],ideas:[],agents:DEFAULT_TAGS.map(tag=>({...tag})),draft:null,settings:{writeHotkey:'Control+Alt+N',reducedMotion:false}};}
export function validateSnapshot(input:unknown):Result<Snapshot>{
  if(!plain(input)||typeof input.schemaVersion!=='number'||![1,2,3,4].includes(input.schemaVersion))return invalid('无法读取这个数据版本，原文件已保留。');
  const schemaVersion=input.schemaVersion;
  if(!Number.isSafeInteger(input.revision)||Number(input.revision)<0||!Array.isArray(input.agents)||!Array.isArray(input.ideas)||!plain(input.settings))return invalid('数据结构不完整。');
  const agents=new Set<string>();
  for(const a of input.agents){
    if(!plain(a)||typeof a.id!=='string'||!a.id||agents.has(a.id)||!textOK(a.name,40)||!(a.name as string).trim()||typeof a.color!=='string'||!/^#[0-9a-f]{6}$/i.test(a.color))return invalid('标签无效。');
    agents.add(a.id);
  }
  if(!agents.size||!agents.has('general'))return invalid('缺少通用标签。');
  if(input.projects!==undefined&&(!Array.isArray(input.projects)||input.projects.some(p=>!textOK(p,40)||!(p as string).trim())||new Set(input.projects).size!==input.projects.length))return invalid('分组目录无效。');
  for(const key of ['inactiveAgents','inactiveProjects'] as const){
   const values=input[key];if(values===undefined)continue;
   const names=key==='inactiveAgents'?agents:new Set([...(input.projects as string[]??[]),...(input.ideas as Record<string,unknown>[]).map(i=>i?.project),plain(input.draft)?input.draft.project:'']);
   if(!Array.isArray(values)||values.some(v=>typeof v!=='string'||!v||key==='inactiveAgents'&&v==='general'||!names.has(v))||new Set(values).size!==values.length)return invalid('移除记录无效。');
  }
  const draftOK=(d:Record<string,unknown>)=>bodyOK(d.text,true)&&textOK(d.title,50)&&textOK(d.project,40)&&typeof d.agentId==='string'&&agents.has(d.agentId)&&(d.reminderAt===undefined||validReminderTime(d.reminderAt));
  const ids=new Set<string>();
  for(const idea of input.ideas){
    if(!plain(idea)||typeof idea.id!=='string'||!idea.id||ids.has(idea.id)||!draftOK(idea)||!hasIdeaContent(idea as unknown as Draft)||!['hanging','archived',...(schemaVersion>=3?['deleted']:[])].includes(String(idea.status))||typeof idea.createdAt!=='string'||!Number.isFinite(Date.parse(idea.createdAt))||typeof idea.updatedAt!=='string'||!Number.isFinite(Date.parse(idea.updatedAt)))return invalid('念头正文或归属无效。');
    if((idea.createdDay!==undefined||idea.creationTimeZone!==undefined)&&(!dayOK(idea.createdDay)||typeof idea.creationTimeZone!=='string'||!idea.creationTimeZone.trim()))return invalid('念头创建日或时区无效。');
    if(idea.deletedAt!==undefined&&(typeof idea.deletedAt!=='string'||!Number.isFinite(Date.parse(idea.deletedAt)))||idea.deletedFrom!==undefined&&!['hanging','archived'].includes(String(idea.deletedFrom))||idea.status==='deleted'&&(idea.deletedAt===undefined||idea.deletedFrom===undefined))return invalid('最近删除恢复信息无效。');
    if(idea.deletedClip!==undefined){const c=idea.deletedClip;if(idea.status!=='deleted'||!plain(c)||typeof c.id!=='string'||!c.id||!Number.isSafeInteger(c.index)||Number(c.index)<0||!(c.position===null||typeof c.position==='number'&&Number.isFinite(c.position)&&c.position>=0&&c.position<=1)||(c.location!==undefined&&!['archived','capacity'].includes(String(c.location)))||!Object.keys(c).every(k=>['id','index','position','location','members'].includes(k)))return invalid('最近删除恢复信息无效。');if(c.members!==undefined&&(!Array.isArray(c.members)||!c.members.length||new Set(c.members.map(m=>plain(m)?m.id:null)).size!==c.members.length||c.members.some(m=>!plain(m)||typeof m.id!=='string'||!m.id||!textOK(m.project,40)||typeof m.agentId!=='string'||!m.agentId||!Object.keys(m).every(k=>['id','project','agentId'].includes(k)))))return invalid('最近删除恢复信息无效。');}
    if(idea.reminder!==undefined&&!validReminder(idea.reminder))return invalid('提醒数据无效。');
    if(idea.offRopeReason!==undefined&&!['waiting','capacity','manual','replaced'].includes(String(idea.offRopeReason)))return invalid('数据结构不完整。');
    ids.add(idea.id);
  }
  if(input.draft!==null&&(!plain(input.draft)||!draftOK(input.draft)))return invalid('草稿无效。');
  if(!textOK(input.settings.writeHotkey,100)||!(input.settings.writeHotkey as string).trim()||typeof input.settings.reducedMotion!=='boolean')return invalid('设置无效。');
  if(input.settings.shelfCapacity!==undefined&&(typeof input.settings.shelfCapacity!=='number'||![4,6,8].includes(input.settings.shelfCapacity)))return invalid('设置无效。');
  if(input.settings.rope!==undefined&&!validRope(input.settings.rope)||input.settings.paper!==undefined&&!validPaper(input.settings.paper))return invalid('设置无效。');
  const bounds=input.settings.calendarBounds;
  if(bounds!==undefined&&(!plain(bounds)||!['x','y','width','height'].every(k=>typeof bounds[k]==='number'&&Number.isFinite(bounds[k]))||Number(bounds.width)<=0||Number(bounds.height)<=0||Number(bounds.width)>16384||Number(bounds.height)>16384))return invalid('日历窗口位置无效。');
  const ideas:Idea[]=(input.ideas as Idea[]).map(i=>{
   const {offRopeReason,...fields}=i;
   const clean=offRopeReason===undefined?fields:i;
   return schemaVersion<3||i.createdDay===undefined?{...clean,createdDay:ideaDay({...i,createdDay:undefined}),creationTimeZone:'legacy-offset'}:{...clean};
  });
  if(ideas.some(i=>!dayOK(i.createdDay)))return invalid('念头创建日无法迁移，原文件已保留。');
  const normalized={...input,schemaVersion:4,ideas,clips:schemaVersion===1?ideas.filter(i=>i.status==='hanging').sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||a.id.localeCompare(b.id)).map(i=>({id:'clip:'+i.id,agentId:i.agentId,ideaIds:[i.id],currentId:i.id,position:null})):Array.isArray(input.clips)?input.clips.map(c=>plain(c)?{...c}:c):input.clips};
  if(!Array.isArray(normalized.clips))return invalid('夹子数据缺失。');
  const clipIds=new Set<string>(),members=new Set<string>();const byId=new Map(ideas.map(i=>[i.id,i]));
  for(const c of normalized.clips){
   if(!plain(c)||typeof c.id!=='string'||!c.id||clipIds.has(c.id)||typeof c.agentId!=='string'||!agents.has(c.agentId)||!Array.isArray(c.ideaIds)||!c.ideaIds.length||typeof c.currentId!=='string'||!c.ideaIds.includes(c.currentId)||!(c.position===null||typeof c.position==='number'&&Number.isFinite(c.position)&&c.position>=0&&c.position<=1))return invalid('夹子结构或位置无效。');
   clipIds.add(c.id);
   for(const id of c.ideaIds){const i=byId.get(id);if(typeof id!=='string'||members.has(id)||!i||i.status!=='hanging'||schemaVersion<4&&i.agentId!==c.agentId)return invalid('夹子成员重复、缺失或标签不一致。');members.add(id);}
   if(schemaVersion>=4)c.agentId=byId.get(c.currentId)!.agentId;
  }
  if(ideas.some(i=>i.status==='hanging'&&!members.has(i.id)))return invalid('挂着的念头没有夹子。');
  if(input.capacityOverflow!==undefined){
   if(!Array.isArray(input.capacityOverflow))return invalid('夹子数据缺失。');
   const parkedIds=new Set<string>(),parkedMembers=new Set<string>();
   for(const c of input.capacityOverflow){
    if(!plain(c)||typeof c.id!=='string'||!c.id||clipIds.has(c.id)||parkedIds.has(c.id)||typeof c.agentId!=='string'||!agents.has(c.agentId)||!Array.isArray(c.ideaIds)||!c.ideaIds.length||!c.ideaIds.includes(c.currentId)||!(c.position===null||typeof c.position==='number'&&Number.isFinite(c.position)&&c.position>=0&&c.position<=1))return invalid('夹子结构或位置无效。');
    parkedIds.add(c.id);for(const id of c.ideaIds){if(typeof id!=='string'||!byId.has(id)||byId.get(id)?.status!=='archived'||byId.get(id)?.offRopeReason!=='capacity'||parkedMembers.has(id))return invalid('夹子成员重复、缺失或标签不一致。');parkedMembers.add(id);}
   }
   Object.assign(normalized,{capacityOverflow:input.capacityOverflow.flatMap(c=>{
    const keep=c.ideaIds.filter((id:string)=>{const i=byId.get(id);return i?.status==='archived'&&i.offRopeReason==='capacity'&&(schemaVersion>=4||i.agentId===c.agentId);});
    const currentId=keep.includes(c.currentId)?c.currentId:keep[0];return keep.length?[{...c,ideaIds:keep,currentId,agentId:byId.get(currentId)!.agentId}]:[];
   })});
  }
  if(input.archivedClips!==undefined){
   if(schemaVersion<4||!Array.isArray(input.archivedClips))return invalid('日历叠放数据版本或结构无效。');
   const parkedIds=new Set<string>(),parkedMembers=new Set<string>();
   for(const c of input.archivedClips){
    if(!plain(c)||typeof c.id!=='string'||!c.id||clipIds.has(c.id)||(normalized as unknown as Snapshot).capacityOverflow?.some(p=>p.id===c.id)||parkedIds.has(c.id)||typeof c.agentId!=='string'||!agents.has(c.agentId)||!Array.isArray(c.ideaIds)||!c.ideaIds.length||!c.ideaIds.includes(c.currentId)||!(c.position===null||typeof c.position==='number'&&Number.isFinite(c.position)&&c.position>=0&&c.position<=1))return invalid('日历叠放结构或位置无效。');
    parkedIds.add(c.id);for(const id of c.ideaIds){if(typeof id!=='string'||!byId.has(id)||byId.get(id)?.status!=='archived'||parkedMembers.has(id))return invalid('日历叠放成员重复或缺失。');parkedMembers.add(id);}
   }
   const archived=pruneArchivedClips(input.archivedClips as Clip[],ideas);
   if(archived.some(c=>c.ideaIds.some(id=>(normalized as unknown as Snapshot).capacityOverflow?.some(p=>p.ideaIds.includes(id)))))return invalid('日历与等待叠放成员重复。');
   Object.assign(normalized,{archivedClips:archived});
  }
  return {ok:true,value:structuredClone(normalized) as Snapshot};
}
export function newIdea(s:Snapshot,draft:Draft,id:string,now:string):Result<Snapshot>{
  if(!bodyOK(draft.text,true)||!Number.isFinite(Date.parse(now)))return invalid('请输入念头，正文不超过1MiB。');
  if(!hasIdeaContent(draft))return invalid('请填写标题或正文。');
  if(draft.reminderAt!==undefined&&(!validReminderTime(draft.reminderAt)||Date.parse(draft.reminderAt)<=Date.parse(now)))return invalid('请选择未来的提醒时间。');
  const checked=validateSnapshot(s);if(!checked.ok)return checked;const base=checked.value;
  const {reminderAt,...fields}=draft;
  const title=draft.title.trim()||Array.from((draft.text.split('\n').find(x=>x.trim())??'').trim()).slice(0,50).join('');
  return validateSnapshot({...base,projects:[...new Set([...projectNames(base),draft.project].filter(Boolean))],clips:[...base.clips,independentClip(base,id,draft.agentId)],draft:null,ideas:[...base.ideas,{...fields,...(reminderAt?{reminder:{at:reminderAt,state:'scheduled'}}:{}),title,id,status:'hanging',createdAt:now,updatedAt:now,createdDay:localDay(now),creationTimeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}]});
}
export function changeStatus(s:Snapshot,id:string,status:'hanging'|'archived',now:string):Result<Snapshot>{
  if(!s.ideas.some(x=>x.id===id&&x.status!=='deleted'))return invalid('找不到可操作的念头。');
  const parked=[...s.archivedClips??[],...s.capacityOverflow??[]].find(c=>c.ideaIds.includes(id));
  const affected=new Set(status==='hanging'&&parked?parked.ideaIds:[id]);
  const ideas=s.ideas.map(x=>affected.has(x.id)?{...x,status,offRopeReason:status==='archived'?'manual' as const:undefined,updatedAt:now}:x);
  let clips=pruneClips(s.clips,ideas);if(status==='hanging'&&!clips.some(c=>c.ideaIds.includes(id))){if(parked){let key=parked.id;while(clips.some(c=>c.id===key))key+=':hang';clips=[...clips,{...parked,id:key,currentId:id,position:null}];}else clips=[...clips,independentClip({...s,clips},id,ideas.find(i=>i.id===id)!.agentId)];}
  return validateSnapshot({...s,clips,ideas,...pruneStoredClips(s,ideas)});
}
export function renameAgent(s:Snapshot,id:string,name:string):Result<Snapshot>{
  if(!s.agents.some(x=>x.id===id))return invalid('找不到这个标签。');
  return validateSnapshot({...s,agents:s.agents.map(x=>x.id===id?{...x,name}:x)});
}
export function removeAgent(s:Snapshot,id:string,replacement:string):Result<Snapshot>{
  if(id==='general'||id===replacement||!s.agents.some(x=>x.id===id)||!s.agents.some(x=>x.id===replacement))return invalid('请选择存在的替代标签，通用标签不能移除。');
  if(s.inactiveAgents?.includes(replacement))return invalid('请选择使用中的替代标签。');
  return validateSnapshot({...s,...(s.inactiveAgents?{inactiveAgents:s.inactiveAgents.filter(a=>a!==id)}:{}),clips:s.clips.map(c=>c.agentId===id?{...c,agentId:replacement}:c),...(s.capacityOverflow?{capacityOverflow:s.capacityOverflow.map(c=>c.agentId===id?{...c,agentId:replacement}:c)}:{}),...(s.archivedClips?{archivedClips:s.archivedClips.map(c=>c.agentId===id?{...c,agentId:replacement}:c)}:{}),agents:s.agents.filter(x=>x.id!==id),ideas:s.ideas.map(x=>migrateDeletedMembers(x.agentId===id?{...x,agentId:replacement}:x,'agentId',id,replacement)),draft:s.draft?.agentId===id?{...s.draft,agentId:replacement}:s.draft});
}
export function editIdea(s:Snapshot,id:string,draft:Draft,now:string):Result<Snapshot>{
  if(!s.ideas.some(x=>x.id===id&&x.status!=='deleted')||!draft||!bodyOK(draft.text,true)||!textOK(draft.title,50)||!textOK(draft.project,40))return invalid('正文、标题或项目无效，请保留文字后重试。');
  if(!hasIdeaContent(draft))return invalid('请填写标题或正文。');
  const title=draft.title.trim()||Array.from(draft.text.split('\n').find(x=>x.trim())?.trim()??'').slice(0,50).join('');
  const ideas=s.ideas.map(x=>x.id===id?{...x,text:draft.text,title,project:draft.project,agentId:draft.agentId,updatedAt:now}:x);
  const original=s.ideas.find(i=>i.id===id)!;const owner=s.clips.find(c=>c.ideaIds.includes(id));
  const separates=!!owner&&owner.ideaIds.length>1&&(original.project!==draft.project||original.agentId!==draft.agentId&&!clipGroup(s,owner));
  let clips=pruneClips(separates?s.clips.map(c=>c.id===owner!.id?{...c,ideaIds:c.ideaIds.filter(x=>x!==id)}:c):s.clips,ideas);const updated=ideas.find(i=>i.id===id)!;if(updated.status==='hanging'&&!clips.some(c=>c.ideaIds.includes(id)))clips=[...clips,independentClip({...s,clips},id,updated.agentId)];
  const location=s.archivedClips?.some(c=>c.ideaIds.includes(id))?'archivedClips':'capacityOverflow',parked=s[location]?.find(c=>c.ideaIds.includes(id));let parkedClips=s[location];
  if(parked&&parked.ideaIds.length>1&&(original.project!==draft.project||original.agentId!==draft.agentId&&!clipGroup(s,parked))){let key='calendar:'+id;while([...s.clips,...s.archivedClips??[],...s.capacityOverflow??[]].some(c=>c.id===key))key+=':';parkedClips=[...pruneArchivedClips(s[location]!.map(c=>c.id===parked.id?{...c,ideaIds:c.ideaIds.filter(x=>x!==id)}:c),ideas),{id:key,agentId:updated.agentId,ideaIds:[id],currentId:id,position:null}];}
  return validateSnapshot({...s,clips,ideas,...(parkedClips?{[location]:parkedClips}: {})});
}
export function editIdeaIfUnchanged(s:Snapshot,id:string,draft:Draft,expectedDraft:Draft,now:string,width?:number):Result<Snapshot>{
  const idea=s.ideas.find(i=>i.id===id);
  if(!idea||idea.status==='deleted'||!plain(expectedDraft)||!(['text','title','project','agentId'] as const).every(k=>typeof expectedDraft[k]==='string'))return invalid('找不到可编辑的念头或原内容无效。');
  if(idea.text!==expectedDraft.text||idea.title!==expectedDraft.title||idea.project!==expectedDraft.project||idea.agentId!==expectedDraft.agentId)return {ok:false,code:'CONFLICT',message:'这条念头已更新，请保留当前文字并重新读取。'};
  const owner=s.clips.find(c=>c.ideaIds.includes(id));
  const separates=owner&&owner.ideaIds.length>1&&(idea.project!==draft.project||idea.agentId!==draft.agentId&&!clipGroup(s,owner));
  return editIdea(separates&&width!==undefined?{...s,clips:captureClipPositions(s.clips,width,'all',shelfCapacity(s.settings.shelfCapacity))}:s,id,draft,now);
}
export function deleteIdea(s:Snapshot,id:string,now:string,width?:number):Result<Snapshot>{
  const idea=s.ideas.find(i=>i.id===id);
  if(!idea||idea.status==='deleted'||!Number.isFinite(Date.parse(now)))return invalid('找不到可删除的念头或删除时间无效。');
  const deletedFrom: 'hanging'|'archived'=idea.status==='hanging'&&(width===undefined||onLineIdeaIds(s,width,'all').has(id))?'hanging':'archived';
  const captured=width===undefined?s.clips:captureClipPositions(s.clips,width,'all',shelfCapacity(s.settings.shelfCapacity)),owner=captured.find(c=>c.ideaIds.includes(id));
  const parked=[...s.archivedClips??[],...s.capacityOverflow??[]].find(c=>c.ideaIds.includes(id)),originalOwner=owner??parked;
  const previousMembers=originalOwner?s.ideas.find(i=>i.status==='deleted'&&i.deletedClip?.id===originalOwner.id)?.deletedClip?.members:undefined;
  const rows=originalOwner?.ideaIds.map(id=>{const i=s.ideas.find(i=>i.id===id)!;return {id,project:i.project,agentId:i.agentId};})??[],currentRows=new Map(rows.map(r=>[r.id,r]));
  const members=previousMembers?[...previousMembers.map(r=>currentRows.get(r.id)??r),...rows.filter(r=>!previousMembers.some(m=>m.id===r.id))]:rows;
  const deletedClip=originalOwner?{id:originalOwner.id,index:members.findIndex(r=>r.id===id),position:originalOwner.position,members,...(parked?{location:s.archivedClips?.some(c=>c.id===parked.id)?'archived' as const:'capacity' as const}:{})}:undefined;
  const ideas=s.ideas.map(i=>i.id===id?{...i,...(i.reminder?{reminder:{...i.reminder,state:'cancelled' as const}}:{}),...(deletedClip?{deletedClip}:{}),status:'deleted' as const,deletedFrom,deletedAt:now,updatedAt:now}:i);
  return validateSnapshot({...s,ideas,clips:pruneClips(captured,ideas),...pruneStoredClips(s,ideas)});
}
export function restoreIdea(s:Snapshot,id:string,now:string,width=1440):Result<Snapshot>{
  const idea=s.ideas.find(i=>i.id===id);
  if(!idea||idea.status!=='deleted'||!['hanging','archived'].includes(idea.deletedFrom??'')||!Number.isFinite(Date.parse(now))||!Number.isFinite(width)||width<0)return invalid('找不到可恢复的念头或恢复时间无效。');
  const capacity=shelfCapacity(s.settings.shelfCapacity),original=idea.deletedClip;
  const restoresOriginal=(c:Clip)=>original?.members?JSON.stringify(c.ideaIds)===JSON.stringify(original.members.filter(m=>m.id!==id&&s.ideas.some(i=>i.id===m.id&&i.status!=='deleted')).map(m=>m.id))&&c.ideaIds.every(member=>{const expected=original.members!.find(m=>m.id===member),current=s.ideas.find(i=>i.id===member);return expected&&current?.project===expected.project&&current.agentId===expected.agentId;}):canMergeIdea(s,id,c);
  const owner=original?s.clips.find(c=>c.id===original.id&&restoresOriginal(c)&&layoutClips(s.clips,width,capacity).visible.some(p=>p.clip.id===c.id)):undefined;
  const hanging=idea.deletedFrom==='hanging'&&(!!owner||s.clips.length<capacity&&width>=320);
  const ideas=s.ideas.map(i=>{if(i.id!==id)return i;const {deletedAt:_at,deletedFrom:_from,deletedClip:_clip,offRopeReason,...rest}=i;return {...rest,status:hanging?'hanging' as const:'archived' as const,...(!hanging?{offRopeReason:original?.location==='capacity'?'capacity' as const:'manual' as const}:{}),updatedAt:now};});
  let clips=pruneClips(s.clips,ideas);
  if(hanging){
   if(owner)clips=clips.map(c=>{if(c.id!==owner.id)return c;const ids=[...c.ideaIds];ids.splice(Math.min(original!.index,ids.length),0,id);return {...c,ideaIds:ids,currentId:id};});
   else{const fresh=independentClip({...s,clips},id,idea.agentId);clips=[...clips,{...fresh,...(original&&!clips.some(c=>c.id===original.id)?{id:original.id,position:original.position}:{})}];}
  }
  const location=original?.location==='capacity'?'capacityOverflow':'archivedClips';let parkedClips=s[location];
  if(original?.location){
   const parked=s[location]?.find(c=>c.id===original.id&&restoresOriginal(c));
   if(parked)parkedClips=s[location]!.map(c=>{if(c.id!==parked.id)return c;const ids=[...c.ideaIds];const order=original.members?.map(m=>m.id);const index=order?ids.filter(member=>order.indexOf(member)<order.indexOf(id)).length:Math.min(original.index,ids.length);ids.splice(index,0,id);return {...c,ideaIds:ids,currentId:id};});
   else if(![...s.clips,...s.archivedClips??[],...s.capacityOverflow??[]].some(c=>c.id===original.id))parkedClips=[...s[location]??[],{id:original.id,agentId:idea.agentId,ideaIds:[id],currentId:id,position:null}];
  }
  const result=validateSnapshot({...s,ideas,clips,...(parkedClips?{[location]:parkedClips}: {})});
  if(result.ok&&hanging&&layoutClips(clips,width,capacity).overflow.some(c=>c.ideaIds.includes(id)))return arrangeClips(result.value,width);
  return result;
}
export function permanentlyDeleteIdea(s:Snapshot,id:string):Result<Snapshot>{
  if(!s.ideas.some(i=>i.id===id&&i.status==='deleted'))return invalid('只能永久删除最近删除中的念头。');
  const ideas=s.ideas.filter(i=>i.id!==id),projects=projectNames(s);return validateSnapshot({...s,...(projects.length?{projects}:{}),ideas,clips:pruneClips(s.clips,ideas)});
}
export function addAgent(s:Snapshot,a:AgentTag):Result<Snapshot>{
  if(typeof a?.name!=='string'||s.agents.some(x=>x.name.trim().toLowerCase()===a.name.trim().toLowerCase()))return invalid('已有同名标签，请选择已有标签。');
  return validateSnapshot({...s,agents:[...s.agents,{id:a?.id,name:a?.name,color:a?.color}]});
}
export function updateAgent(s:Snapshot,id:string,patch:Pick<AgentTag,'name'|'color'>):Result<Snapshot>{
  const old=s.agents.find(a=>a.id===id);if(!old)return invalid('找不到这个标签。');
  if(id==='general'&&patch?.name!==old.name)return invalid('通用标签只能修改颜色。');
  if(typeof patch?.name!=='string'||s.agents.some(a=>a.id!==id&&a.name.trim().toLowerCase()===patch.name.trim().toLowerCase()))return invalid('已有同名标签，请使用其他名称。');
  return validateSnapshot({...s,agents:s.agents.map(a=>a.id===id?{...a,name:patch?.name,color:patch?.color}:a)});
}
export type IdeaQuery={status:'all'|'hanging'|'archived';query?:string;agentId?:string};
export function findIdeas(s:Snapshot,q:IdeaQuery):Idea[]{
  const text=(q.query??'').trim().toLowerCase();
  const names=new Map(s.agents.map(a=>[a.id,a.name]));
  return s.ideas.filter(i=>i.status!=='deleted'&&(q.status==='all'||i.status===q.status)&&(!q.agentId||q.agentId==='all'||i.agentId===q.agentId)&&(!text||[i.text,i.title,i.project,names.get(i.agentId)??''].join('\n').toLowerCase().includes(text)))
    .sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt)||(a.id<b.id?-1:a.id>b.id?1:0));
}
export function shelfSelection(s:Snapshot,agentId:string,width:number,project:string|null=null){
  const totalHanging=s.ideas.filter(i=>i.status==='hanging').length;
  const filtered=findIdeas(s,{status:'hanging',agentId}).filter(i=>project===null||i.project===project);
  const visible=filtered.slice(0,visibleSlots(width,shelfCapacity(s.settings.shelfCapacity)));
  return {totalHanging,visible,filteredCount:filtered.length,overflow:filtered.length-visible.length};
}

// Project membership is independent of physical clips. Clearing every reference
// (including archived ideas and drafts) makes deletion survive reconstruction.
export function removeProject(s:Snapshot,project:string,now:string,replacement=''):Result<Snapshot>{
 if(!project||!textOK(project,40)||!Number.isFinite(Date.parse(now)))return invalid('未分组不能删除。');
 if(typeof replacement!=='string'||replacement===project||replacement&&(!projectNames(s).includes(replacement)||s.inactiveProjects?.includes(replacement)))return invalid('请选择有效的接收分组。');
 return validateSnapshot({...s,projects:projectNames(s).filter(p=>p!==project),...(s.inactiveProjects?{inactiveProjects:s.inactiveProjects.filter(p=>p!==project)}:{}),ideas:s.ideas.map(i=>migrateDeletedMembers(i.project===project?{...i,project:replacement,updatedAt:now}:i,'project',project,replacement)),draft:s.draft?.project===project?{...s.draft,project:replacement}:s.draft});
}
