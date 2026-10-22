// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,changeStatus,validateSnapshot,deleteIdea,restoreIdea,editIdea,removeAgent} from '../../src/shared/ideaCommands';
import {mergeTargets,mergeInto,splitArchived} from '../../src/shared/stackCommands';
import {mergeClips,selectClipIdea} from '../../src/shared/clipCommands';
import {backfillIdeas,placeIdea} from '../../src/shared/ideaPlacement';
import type {Result,Snapshot} from '../../src/shared/contracts';
const at='2026-10-13T01:00:00Z';const value=<T,>(r:Result<T>)=>{if(!r.ok)throw Error(r.message);return r.value;};
function fixture(){let s=initialSnapshot();for(const [id,tag,project] of [['a','general','工作'],['b','codex','工作'],['c','preset:colleague','工作'],['other','codex','生活']])s=value(newIdea(s,{title:'名称'+id,text:'全文😀 '+id,project,agentId:tag},id,at));return value(changeStatus(s,'c','archived',at));}
test('目标涵盖同分组挂绳/日历，不含自身或其他分组，全文搜索无写入',()=>{const s=fixture(),before=structuredClone(s);expect(mergeTargets(s,'a').map(t=>[t.idea.id,t.location])).toEqual([['b','hanging'],['c','archived']]);expect(mergeTargets(s,'a','全文😀 c').map(t=>t.idea.id)).toEqual(['c']);expect(s).toEqual(before)});
test('合并到日历留日历，当前源张移出，全文/时间/标签保留且结构重读',()=>{const s=fixture(),next=value(mergeInto(s,'a','c',1440,at));expect(next.ideas.find(i=>i.id==='a')).toMatchObject({status:'archived',offRopeReason:'manual',text:s.ideas[0].text,createdAt:s.ideas[0].createdAt});expect((next as any).archivedClips[0]).toMatchObject({ideaIds:['c','a'],currentId:'a',agentId:'general'});expect(value(validateSnapshot(JSON.parse(JSON.stringify(next))))).toEqual(next);expect(value(backfillIdeas(next,1440,at)).ideas.find(i=>i.id==='a')?.status).toBe('archived')});
test('源已经叠放时只移当前纸张，其余成员/位置保留',()=>{let s=fixture();s=value(mergeClips(s,s.clips.find(c=>c.ideaIds.includes('b'))!.id,s.clips.find(c=>c.ideaIds.includes('a'))!.id));const next=value(mergeInto(s,'a','c',1440,at));expect(next.clips.find(c=>c.ideaIds.includes('b'))?.ideaIds).toEqual(['b']);expect(next.ideas.find(i=>i.id==='b')?.status).toBe('hanging')});
test('日历叠放全文搜索隐藏成员仍去重，计数用完整成员',()=>{let s=value(mergeInto(fixture(),'a','c',1440,at));s=value(selectClipIdea(s,(s as any).archivedClips[0].id,'c'));const rows=mergeTargets(s,'b','全文😀 a');expect(rows).toHaveLength(1);expect(rows[0].idea.id).toBe('a');expect(rows[0].clip.ideaIds).toEqual(['c','a'])});
test('日历叠放拆分留日历，主动挂上整叠并保留原全文',()=>{const s=value(mergeInto(fixture(),'a','c',1440,at)),owner=(s as any).archivedClips[0];const split=value(splitArchived(s,owner.id,'a','split-calendar'));expect((split as any).archivedClips.map((c:any)=>c.ideaIds)).toEqual([['c'],['a']]);expect(split.ideas.find(i=>i.id==='a')?.status).toBe('archived');const hung=value(placeIdea(s,{id:'a'},{kind:'hang'},1440,at));expect(hung.clips.find(c=>c.ideaIds.includes('a'))?.ideaIds).toEqual(['c','a']);expect(hung.ideas.find(i=>i.id==='c')?.status).toBe('hanging');expect((hung as any).archivedClips??[]).toHaveLength(0)});
test('归档叠放删除恢复回到原叠放原次序，提醒不遗失',()=>{let s=fixture();s.ideas[0].reminder={at:'2030-01-01T00:00:00.000Z',state:'scheduled'};s=value(mergeInto(s,'a','c',1440,at));const removed=value(deleteIdea(s,'a',at,1440)),restored=value(restoreIdea(removed,'a',at,1440));expect((restored as any).archivedClips[0].ideaIds).toEqual(['c','a']);expect(restored.ideas[0].reminder).toEqual({...s.ideas[0].reminder,state:'cancelled'})});
test('归档叠放改单标签保留，改分组仅分离当前纸张',()=>{const s=value(mergeInto(fixture(),'a','c',1440,at)),idea=s.ideas.find(i=>i.id==='a')!;const tagged=value(editIdea(s,'a',{...idea,agentId:'codex'},at));expect((tagged as any).archivedClips[0].ideaIds).toEqual(['c','a']);const moved=value(editIdea(tagged,'a',{...idea,project:'生活'},at));expect((moved as any).archivedClips.map((c:any)=>c.ideaIds)).toEqual([['c'],['a']])});
test('归档标签目录整体迁移更新镜像且不拆成员，缺失重复数据拒绝',()=>{const s=value(mergeInto(fixture(),'a','c',1440,at));const moved=value(removeAgent(s,'preset:colleague','general'));expect((moved as any).archivedClips[0].ideaIds).toEqual(['c','a']);const c=(s as any).archivedClips[0];expect(validateSnapshot({...s,archivedClips:[{...c,ideaIds:['c','a','a']}]}).ok).toBe(false);expect(validateSnapshot({...s,archivedClips:[{...c,ideaIds:['c','missing']}]}).ok).toBe(false)});
test('超出挂绳实际容量的旧挂着夹是日历目标，合并后完整留日历',()=>{
 let s=fixture();for(let n=0;n<20;n++)s=value(newIdea(s,{title:'占位'+n,text:'占位全文',project:'工作',agentId:'codex'},'extra'+n,at));
 const target=s.clips.find(c=>c.ideaIds.includes('b'))!;s={...s,settings:{...s.settings,shelfCapacity:4},clips:[...s.clips.filter(c=>c.id!==target.id),{...target,position:1}]};
 const rows=mergeTargets(s,'a');expect(rows.find(t=>t.idea.id==='b')?.location).toBe('archived');
 const next=value(mergeInto(s,'a','b',1440,at));expect(next.archivedClips?.find(c=>c.ideaIds.includes('b'))?.ideaIds).toEqual(['b','a']);expect(next.ideas.find(i=>i.id==='b')?.status).toBe('archived');expect(value(backfillIdeas(next,1440,at)).ideas.find(i=>i.id==='a')?.status).toBe('archived');
});
test('容量候选叠放在日历拆分不丢成员且保持容量候选语义',()=>{
 let s=value(mergeInto(fixture(),'a','c',1440,at));const parked=s.archivedClips![0];s={...s,archivedClips:[],capacityOverflow:[parked],ideas:s.ideas.map(i=>parked.ideaIds.includes(i.id)?{...i,offRopeReason:'capacity'}:i)};
 const split=value(splitArchived(s,parked.id,'a','capacity-split'));expect(split.capacityOverflow?.map(c=>c.ideaIds)).toEqual([['c'],['a']]);expect(split.ideas.find(i=>i.id==='a')).toMatchObject({status:'archived',offRopeReason:'capacity'});
});
test('容量日历叠放主动挂上必须整体恢复',()=>{
 let s=value(mergeInto(fixture(),'a','c',1440,at));const parked=s.archivedClips![0];s={...s,archivedClips:[],capacityOverflow:[parked],ideas:s.ideas.map(i=>parked.ideaIds.includes(i.id)?{...i,offRopeReason:'capacity'}:i)};
 const hung=value(placeIdea(s,{id:'a'},{kind:'hang'},1440,at));expect(hung.clips.find(c=>c.ideaIds.includes('a'))?.ideaIds).toEqual(['c','a']);expect(hung.capacityOverflow).toHaveLength(0);
});
test('容量日历叠放改组仅分离当前纸张',()=>{
 let s=value(mergeInto(fixture(),'a','c',1440,at));const parked=s.archivedClips![0];s={...s,archivedClips:[],capacityOverflow:[parked],ideas:s.ideas.map(i=>parked.ideaIds.includes(i.id)?{...i,offRopeReason:'capacity'}:i)};
 const moved=value(editIdea(s,'a',{...s.ideas.find(i=>i.id==='a')!,project:'生活'},at));expect(moved.capacityOverflow?.map(c=>c.ideaIds)).toEqual([['c'],['a']]);
});
test('分组筛选显露的旧溢出夹应列为挂绳目标并合并后仍挂绳',()=>{
 let s=initialSnapshot();for(const [id,project] of [['a','work'],['b','other'],['c','other'],['d','other'],['e','work']])s=value(newIdea(s,{text:'原文'+id,title:id,agentId:'general',project},id,at));s.settings.shelfCapacity=4;
 const filter={project:'work',agentId:'all'};expect(mergeTargets(s,'a','',undefined,1440,filter).find(t=>t.idea.id==='e')?.location).toBe('hanging');const merged=value(mergeInto(s,'a','e',1440,at,filter));expect(merged.ideas.find(i=>i.id==='a')?.status).toBe('hanging');expect(merged.clips.find(c=>c.ideaIds.includes('e'))?.ideaIds).toEqual(['e','a']);
});
test('三个owner集合不能复用身份，也不能让归档结构引用挂着成员',()=>{
 let s=value(mergeInto(fixture(),'a','c',1440,at));s=value(changeStatus(s,'b','archived',at));s.ideas.find(i=>i.id==='b')!.offRopeReason='capacity';s.capacityOverflow=[{id:s.archivedClips![0].id,ideaIds:['b'],currentId:'b',agentId:'codex',position:null}];expect(validateSnapshot(s).ok).toBe(false);
 const valid=fixture();expect(validateSnapshot({...valid,archivedClips:[{id:'bad-parked',ideaIds:['a'],currentId:'a',agentId:'general',position:null}]}).ok).toBe(false);
});
test('容量owner不能与实际挂绳owner复用ID',()=>{let s=fixture();s.ideas.find(i=>i.id==='c')!.offRopeReason='capacity';s.capacityOverflow=[{id:s.clips[0].id,ideaIds:['c'],currentId:'c',agentId:'preset:colleague',position:null}];expect(validateSnapshot(s).ok).toBe(false)});
test('日历整叠连续删除并恢复仍按原顺序归位',()=>{const s=value(mergeInto(fixture(),'a','c',1440,at)),removed=value(deleteIdea(value(deleteIdea(s,'c',at,1440)),'a',at,1440)),first=value(restoreIdea(removed,'a',at,1440)),restored=value(restoreIdea(first,'c',at,1440));expect(restored.archivedClips![0].ideaIds).toEqual(['c','a'])});
test('容量候选删除恢复保留原owner和补位原因',()=>{let s=value(mergeInto(fixture(),'a','c',1440,at));const parked=s.archivedClips![0];s={...s,archivedClips:[],capacityOverflow:[parked],ideas:s.ideas.map(i=>parked.ideaIds.includes(i.id)?{...i,offRopeReason:'capacity'}:i)};const restored=value(restoreIdea(value(deleteIdea(s,'a',at,1440)),'a',at,1440));expect(restored.capacityOverflow![0].ideaIds).toEqual(['c','a']);expect(restored.ideas.find(i=>i.id==='a')?.offRopeReason).toBe('capacity')});
