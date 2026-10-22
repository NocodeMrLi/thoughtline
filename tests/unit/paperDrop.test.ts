// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import * as clips from '../../src/shared/clipCommands';
import {initialSnapshot,newIdea} from '../../src/shared/ideaCommands';
import {captureClipPositions,layoutClips} from '../../src/shared/clipLayout';
import type {Result,Snapshot} from '../../src/shared/contracts';
const v=(r:Result<Snapshot>)=>{if(!r.ok)throw Error(r.message);return r.value;};
function fixture(){let s=initialSnapshot();for(const [id,agentId] of [['a','general'],['b','general'],['c','general'],['x','codex']])s=v(newIdea(s,{text:' '+id+'中文\n🧷 ',title:id,project:id==='x'?'另一分组':'原项目',agentId},id,'2026-10-09T00:00:00Z'));s=v(clips.mergeClips(s,'clip:b','clip:a'));return {...s,clips:captureClipPositions(s.clips,1920)};}
test('上缘拖出当前纸到空位，只迁当前ID且不移动其他手动夹',()=>{
 const s=fixture(),old=layoutClips(s.clips,1920),next=v(clips.dropClipIdea(s,'clip:a','b',null,.1,'new',1920));
 expect(next.ideas).toEqual(s.ideas);expect(next.clips.find(c=>c.id==='clip:a')!.ideaIds).toEqual(['a']);expect(next.clips.find(c=>c.id==='new')!.ideaIds).toEqual(['b']);
 for(const p of old.visible)expect(layoutClips(next.clips,1920).visible.find(x=>x.clip.id===p.clip.id)!.x).toBeCloseTo(p.x,8);
});
test('单张合入兼容夹：反复拆合ID/顺序/内容完整，目标直接显示新张',()=>{
 let s=fixture();const ideas=structuredClone(s.ideas);
 for(let i=0;i<30;i++){s=v(clips.dropClipIdea(s,'clip:a','b','clip:c',null,'new'+i,1920));expect(s.clips.find(c=>c.id==='clip:c')!.ideaIds).toEqual(['c','b']);expect(s.clips.find(c=>c.id==='clip:c')!.currentId).toBe('b');s=v(clips.dropClipIdea(s,'clip:c','b','clip:a',null,'back'+i,1920));expect(s.clips.find(c=>c.id==='clip:a')!.ideaIds).toEqual(['a','b']);expect(s.ideas).toEqual(ideas);}
});
test('跨分组、同源、无效位置与缺失正文拒收，快照原样',()=>{
 const s=fixture(),before=structuredClone(s);for(const args of [['clip:x',null],['clip:a',null],[null,NaN]] as const)expect(clips.dropClipIdea(s,'clip:a','b',args[0],args[1],'new',1920).ok).toBe(false);expect(s).toEqual(before);
});
