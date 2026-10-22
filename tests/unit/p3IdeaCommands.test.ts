// SPDX-License-Identifier: GPL-3.0-only
import {legacySnapshot} from '../helpers/legacySnapshot';
import {expect,test} from 'vitest';
import * as commands from '../../src/shared/ideaCommands';
import {mergeClips} from '../../src/shared/clipCommands';
import type {Draft,Result,Snapshot} from '../../src/shared/contracts';

const api=<K extends 'deleteIdea'|'restoreIdea'|'permanentlyDeleteIdea'|'editIdeaIfUnchanged'>(name:K)=>commands[name];
const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-01-01T18:30:00Z',later='2026-10-09T12:00:00Z';
const original:Draft={text:'  原文 🧵\n结尾 😄\n ',title:'旧标题',project:'旧项目',agentId:'general'};
const fixture=()=>value(commands.newIdea(legacySnapshot(),original,'one',now));

test('软删除保全全文/ID/创建日/归属并从物理组移出，恢复挂着记录回原组并保留排序',()=>{
 const del=api('deleteIdea'),restore=api('restoreIdea');let s=fixture();
 s=value(commands.newIdea(s,{...original,text:'同夹剩余正文'},'two',now));s=value(mergeClips(s,'clip:one','clip:two'));
 s={...s,clips:s.clips.map(c=>({...c,position:0.31}))};const originalIdea={...s.ideas[0]};
 const deleted=value(del(s,'one',later));expect(deleted.ideas[0]).toMatchObject({...originalIdea,status:'deleted',deletedFrom:'hanging',deletedAt:later,updatedAt:later});
 expect(deleted.clips).toEqual([{id:'clip:two',agentId:'general',ideaIds:['two'],currentId:'two',position:0.31}]);
 expect(s.ideas[0].status).toBe('hanging');
 const restored=value(restore(deleted,'one','2026-10-10T12:00:00Z'));expect(restored.ideas[0]).toMatchObject({...originalIdea,status:'hanging',updatedAt:'2026-10-10T12:00:00Z'});
 expect(restored.ideas[0]).not.toHaveProperty('deletedAt');expect(restored.ideas[0]).not.toHaveProperty('deletedFrom');
 expect(restored.clips).toEqual([{...deleted.clips[0],ideaIds:['two','one'],currentId:'one'}]);expect(restored.ideas[0]).not.toHaveProperty('deletedClip');
});

test('已收起记录软删除后恢复仍收起，永久删除只允许trash而不自动清空其他条目',()=>{
 const del=api('deleteIdea'),restore=api('restoreIdea'),permanent=api('permanentlyDeleteIdea');let s=fixture();
 expect(permanent(s,'one')).toMatchObject({ok:false,code:'INVALID'});expect(restore(s,'one',later)).toMatchObject({ok:false,code:'INVALID'});
 s=value(commands.changeStatus(s,'one','archived',later));s=value(del(s,'one',later));
 expect(s.ideas[0]).toMatchObject({deletedFrom:'archived',status:'deleted'});expect(del(s,'one','2026-10-10T12:00:00Z')).toMatchObject({ok:false,code:'INVALID'});
 const restored=value(restore(s,'one',later));expect(restored.ideas[0].status).toBe('archived');expect(restored.clips).toEqual([]);
 expect(permanent(restored,'one')).toMatchObject({ok:false,code:'INVALID'});
 const withOther=value(commands.newIdea(s,original,'two',now));const removed=value(permanent(withOther,'one'));
 expect(removed.ideas.map(i=>i.id)).toEqual(['two']);expect(removed.ideas[0].text).toBe(original.text);expect(s.ideas[0].text).toBe(original.text);
 expect(permanent(removed,'missing')).toMatchObject({ok:false,code:'INVALID'});
});

test('删除时间与ID验证失败不动数据，deleted不能经edit或changeStatus绕过恢复',()=>{
 const del=api('deleteIdea'),restore=api('restoreIdea');const s=fixture();
 expect(del(s,'missing',later)).toMatchObject({ok:false,code:'INVALID'});expect(del(s,'one','invalid')).toMatchObject({ok:false,code:'INVALID'});
 const deleted=value(del(s,'one',later));
 expect(commands.editIdea(deleted,'one',{...original,text:'覆盖trash'},later)).toMatchObject({ok:false,code:'INVALID'});
 expect(commands.changeStatus(deleted,'one','hanging',later)).toMatchObject({ok:false,code:'INVALID'});
 expect(commands.changeStatus(deleted,'one','archived',later)).toMatchObject({ok:false,code:'INVALID'});
 expect(restore(deleted,'one','invalid')).toMatchObject({ok:false,code:'INVALID'});
 expect(deleted.ideas[0].text).toBe(original.text);
});

test('项目删除清除trash和草稿归属，恢复后不会复活已移除项目',()=>{
 const del=api('deleteIdea'),restore=api('restoreIdea');let s=value(del(fixture(),'one',later));s.draft={...original,text:'新草稿'};
 const removed=value(commands.removeProject(s,'旧项目',later));expect(removed.ideas[0].project).toBe('');expect(removed.draft?.project).toBe('');
 const restored=value(restore(removed,'one',later));expect(restored.ideas[0].project).toBe('');expect(restored.ideas[0].text).toBe(original.text);
});

test('findIdeas的all与搜索均不包括trash，保留已收起记录',()=>{
 const del=api('deleteIdea');let s=fixture();s=value(commands.newIdea(s,{...original,text:'已收起正文'},'two',now));s=value(commands.changeStatus(s,'two','archived',later));s=value(del(s,'one',later));
 expect(commands.findIdeas(s,{status:'all'}).map(i=>i.id)).toEqual(['two']);expect(commands.findIdeas(s,{status:'all',query:'原文'})).toEqual([]);
 expect(commands.findIdeas(s,{status:'hanging'})).toEqual([]);expect(commands.findIdeas(s,{status:'archived'}).map(i=>i.id)).toEqual(['two']);
});

test.each(['text','title','project','agentId'] as const)('CAS逐字段检测%s已改变，旧回调冲突不覆写新内容',field=>{
 const cas=api('editIdeaIfUnchanged');const s=fixture();const changed={...original,[field]:field==='agentId'?'claude':'已被其他回调修改'};
 const concurrent=value(commands.editIdea(s,'one',changed,later));const previous=structuredClone(concurrent);
 expect(cas(concurrent,'one',{...original,text:'旧回调覆盖'},original,later)).toMatchObject({ok:false,code:'CONFLICT'});expect(concurrent).toEqual(previous);
});

test('CAS允许无关revision/窗口位置/其他念头/状态变化，不丢当前草稿与创建日',()=>{
 const cas=api('editIdeaIfUnchanged');let s=fixture();const first={...s.ideas[0]};
 s=value(commands.newIdea(s,{...original,text:'另一条'},'two',now));s=value(commands.changeStatus(s,'one','archived',later));
 s={...s,revision:44,draft:{...original,text:'新建未保存'},settings:{...s.settings,calendarBounds:{x:-50,y:2,width:840,height:620}}};
 const edited=value(cas(s,'one',{...original,text:'  新文 😄\n ',agentId:'claude'},original,later));
 expect(edited.ideas[0]).toMatchObject({id:'one',text:'  新文 😄\n ',status:'archived',createdAt:first.createdAt,createdDay:first.createdDay,creationTimeZone:first.creationTimeZone,agentId:'claude'});
 expect(edited.ideas[1].text).toBe('另一条');expect(edited.draft?.text).toBe('新建未保存');expect(edited.revision).toBe(44);expect(edited.settings.calendarBounds).toEqual(s.settings.calendarBounds);
});

test('CAS先成功后旧回调冲突，分组变化拆到独立夹而不动其余组成员',()=>{
 const cas=api('editIdeaIfUnchanged');let s=fixture();s=value(commands.newIdea(s,original,'two',now));s=value(mergeClips(s,'clip:one','clip:two'));
 const next=value(cas(s,'one',{...original,text:'  首次修改 🧵\n ',agentId:'claude',project:'新分组'},original,later));
 expect(next.clips).toMatchObject([{id:'clip:two',ideaIds:['two'],currentId:'two',agentId:'general'},{ideaIds:['one'],agentId:'claude'}]);
 expect(cas(next,'one',{...original,text:'旧回调后到'},original,later)).toMatchObject({ok:false,code:'CONFLICT'});
 expect(next.ideas[0].text).toBe('  首次修改 🧵\n ');expect(next.ideas[0].createdAt).toBe(now);
});

test('CAS拒绝deleted、缺失ID和非法expected字段，无效草稿不覆盖',()=>{
 const cas=api('editIdeaIfUnchanged'),del=api('deleteIdea');const s=fixture();const deleted=value(del(s,'one',later));
 expect(cas(deleted,'one',original,original,later)).toMatchObject({ok:false,code:'INVALID'});
 expect(cas(s,'missing',original,original,later)).toMatchObject({ok:false,code:'INVALID'});
 expect(cas(s,'one',original,{...original,text:undefined} as unknown as Draft,later)).toMatchObject({ok:false,code:'INVALID'});
 expect(cas(s,'one',{...original,text:'  ',title:'  '},original,later)).toMatchObject({ok:false,code:'INVALID'});expect(s.ideas[0].text).toBe(original.text);
});

test('schema3验证trash恢复元数据与夹子归属，旧schema不得引入deleted',()=>{
 const s=fixture(),deleted={...s.ideas[0],status:'deleted',deletedFrom:'hanging',deletedAt:later};
 expect(commands.validateSnapshot({...s,ideas:[deleted],clips:[]}).ok).toBe(true);
 for(const idea of [{...deleted,deletedAt:'bad'},{...deleted,deletedAt:undefined},{...deleted,deletedFrom:'deleted'},{...deleted,deletedFrom:undefined}])expect(commands.validateSnapshot({...s,ideas:[idea],clips:[]})).toMatchObject({ok:false,code:'INVALID'});
 expect(commands.validateSnapshot({...s,ideas:[deleted]})).toMatchObject({ok:false,code:'INVALID'});
 expect(commands.validateSnapshot({...s,schemaVersion:2,ideas:[deleted],clips:[]})).toMatchObject({ok:false,code:'INVALID'});
});
