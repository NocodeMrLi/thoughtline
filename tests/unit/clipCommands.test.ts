import {legacySnapshot} from '../helpers/legacySnapshot';
import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,validateSnapshot} from '../../src/shared/ideaCommands';
const now='2026-10-08T00:00:00Z';
test('schema1迁移将每条挂着记录变为独立夹子，已收起不占位，原文保全',()=>{
 let s=legacySnapshot();const r=newIdea(s,{text:' 原文\n',title:'',project:'',agentId:'codex'},'one',now);if(!r.ok)throw Error(r.message);s=r.value;
 const legacy={...s,schemaVersion:1,clips:undefined,ideas:[...s.ideas,{...s.ideas[0],id:'history',status:'archived'}]};
 const migrated=validateSnapshot(legacy);expect(migrated.ok).toBe(true);if(!migrated.ok)return;
 expect(migrated.value.schemaVersion).toBe(3);expect((migrated.value as any).clips).toHaveLength(1);
 expect((migrated.value as any).clips[0]).toMatchObject({ideaIds:['one'],currentId:'one'});expect(migrated.value.ideas[0].text).toBe(' 原文\n');
});
import {mergeClips,splitClip,selectClipIdea,moveClip,dropClipIdea} from '../../src/shared/clipCommands';
import type {Result,Snapshot} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{if(!r.ok)throw Error(r.message);return r.value;};
const fixture=()=>{let s=legacySnapshot();for(const id of ['a','b','c'])s=value(newIdea(s,{text:' '+id+'\n正文\n',title:id,project:id,agentId:'codex'},id,now));return s;};
test('同Agent合夹保持独立全文/顺序/目标位置与总重量，源第一张成为当前张',()=>{
 const s=fixture();s.clips[1].position=.4;const next=value(mergeClips(s,s.clips[0].id,s.clips[1].id));
 expect(next.clips[0]).toMatchObject({id:'clip:b',ideaIds:['b','a'],currentId:'a',position:.4});expect(next.ideas).toEqual(s.ideas);expect(next.clips).toHaveLength(2);expect(s.clips).toHaveLength(3);
});
test('跨Agent、自合夹、未知成员被拒绝，不能重复或漏掉挂载',()=>{
 const s=fixture();s.ideas[1].agentId='claude';s.clips[1].agentId='claude';
 expect(mergeClips(s,'clip:a','clip:b').ok).toBe(false);expect(mergeClips(s,'clip:a','clip:a').ok).toBe(false);
 expect(selectClipIdea(s,'clip:a','b').ok).toBe(false);
 expect(validateSnapshot({...s,clips:s.clips.slice(1)}).ok).toBe(false);
 expect(validateSnapshot({...s,clips:[...s.clips,{...s.clips[0],id:'duplicate'}]}).ok).toBe(false);
});
test('拆出当前张回退相邻张、保全全文，收起后恢复独立夹子避免ID冲突',()=>{
 let s=value(mergeClips(fixture(),'clip:b','clip:a'));s=value(selectClipIdea(s,'clip:a','b'));
 const split=value(splitClip(s,'clip:a','b','separate'));expect(split.clips.slice(0,2).map(c=>c.ideaIds)).toEqual([['a'],['b']]);expect(split.ideas).toEqual(s.ideas);
 s=value(changeStatus(s,'a','archived',now));expect(s.clips[0].currentId).toBe('b');s=value(changeStatus(s,'a','hanging',now));expect(s.clips.find(c=>c.ideaIds[0]==='a')?.id).not.toBe('clip:a');expect(validateSnapshot(s).ok).toBe(true);
});
test('移动保存稳定顺序与归一化位置，非法位置原布局不变',()=>{
 const s=fixture();const moved=value(moveClip(s,'clip:c',.1,'clip:a'));expect(moved.clips.map(c=>c.id)).toEqual(['clip:c','clip:a','clip:b']);expect(moved.clips[0].position).toBe(.1);expect(moveClip(s,'clip:c',NaN,null).ok).toBe(false);expect(s.clips[0].id).toBe('clip:a');
});
import {changeStatus} from '../../src/shared/ideaCommands';
import {layoutClips,availableClipPosition,MIN_SPACING} from '../../src/shared/clipLayout';
test('拆分遇零散间距时自动腾位，总容量足够就全部可见且内容不变',()=>{
 let s=value(mergeClips(fixture(),'clip:b','clip:a'));
 s=value(newIdea(s,{text:'第四张 中文😀\n',title:'第四张',project:'独立项目',agentId:'codex'},'d',now));
 for(const id of ['e','f'])s=value(newIdea(s,{text:id,title:id,project:'',agentId:'codex'},id,now));
 s.clips=s.clips.map((c,i)=>({...c,position:i/4}));const width=1280,before=layoutClips(s.clips,width);
 expect(before.visible).toHaveLength(5);expect(availableClipPosition(before.visible.map(p=>p.x),width,width/2)).toBeNull();
 const next=value(splitClip(s,'clip:a','b','separate',width)),shown=layoutClips(next.clips,width);
 expect(shown.overflow).toHaveLength(0);expect(shown.visible).toHaveLength(6);expect(next.ideas).toEqual(s.ideas);
 expect(next.clips.find(c=>c.id==='clip:a')?.ideaIds).toEqual(['a']);
 for(let i=1;i<shown.visible.length;i++)expect(shown.visible[i].x-shown.visible[i-1].x).toBeGreaterThanOrEqual(MIN_SPACING-1e-8);
});
test('合并单张无需暂存空位，不因中间拆出步骤改变其他手动位置',()=>{
 let s=value(mergeClips(fixture(),'clip:b','clip:a'));
 s=value(newIdea(s,{text:'d正文',title:'d',project:'其他项目',agentId:'codex'},'d',now));
 s.clips=s.clips.map((c,i)=>({...c,position:i/2}));
 const next=value(dropClipIdea(s,'clip:a','b','clip:c',null,'temporary',1280));
 expect(next.ideas).toEqual(s.ideas);expect(next.clips.map(c=>({id:c.id,position:c.position}))).toEqual(s.clips.map(c=>({id:c.id,position:c.position})));
 expect(next.clips.find(c=>c.id==='clip:a')?.ideaIds).toEqual(['a']);expect(next.clips.find(c=>c.id==='clip:c')?.ideaIds).toEqual(['c','b']);
});
import {editIdea} from '../../src/shared/ideaCommands';
test('改Agent只拆出当前成员，收起当前成员后展示相邻张',()=>{
 let s=value(mergeClips(fixture(),'clip:b','clip:a'));s=value(selectClipIdea(s,'clip:a','b'));
 const archived=value(changeStatus(s,'b','archived',now));expect(archived.clips[0].currentId).toBe('a');expect(archived.clips[0].ideaIds).toEqual(['a']);
 const edited=value(editIdea(s,'b',{text:s.ideas[1].text,title:'b',project:'b',agentId:'claude'},now));expect(edited.clips[0].ideaIds).toEqual(['a']);expect(edited.clips.find(c=>c.ideaIds.includes('b'))?.agentId).toBe('claude');expect(edited.ideas[1].text).toBe(s.ideas[1].text);
});
