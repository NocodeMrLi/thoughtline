import {legacySnapshot} from '../helpers/legacySnapshot';
import {expect,test} from 'vitest';
import {arrangeClips} from '../../src/shared/clipCommands';
import {initialSnapshot,newIdea} from '../../src/shared/ideaCommands';
import {availableClipPosition,clipTravelBounds,layoutClips,MIN_SPACING,clipMetrics} from '../../src/shared/clipLayout';
import type {Result,Snapshot} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{if(!r.ok)throw Error(r.message);return r.value;};
const fixture=(count:number)=>{let s=legacySnapshot();for(let i=0;i<count;i++)s=value(newIdea(s,{text:'正文 中文😀\n'+i,title:'念头'+i,project:'保留',agentId:i%2?'claude':'codex'},'i'+i,'2026-10-10T00:00:00Z'));return s;};
test('碎片间距压紧后能容纳下一夹子，保留左右顺序与全部念头',()=>{
 const width=1400,s=fixture(5),{min,max}=clipTravelBounds(width);s.clips.forEach((c,i)=>c.position=i/4);const before=layoutClips(s.clips,width).visible;
 expect(availableClipPosition(before.map(p=>p.x),width,width/2)).toBe(null);
 const arranged=value(arrangeClips(s,width)),after=layoutClips(arranged.clips,width).visible;
 expect(after.map(p=>p.clip.id)).toEqual(before.map(p=>p.clip.id));expect(after[1].x-after[0].x).toBeCloseTo(clipMetrics(width).spacing);expect(after[2].x-after[1].x).toBeCloseTo(clipMetrics(width).spacing);
 expect(availableClipPosition(after.map(p=>p.x),width,width/2)).not.toBe(null);expect(after.every(p=>p.x>=min&&p.x<=max)).toBe(true);expect(arranged.ideas).toEqual(s.ideas);expect(s.clips.map(c=>c.position)).toEqual([0,.25,.5,.75,1]);
});
test('混合Agent和满容量：不漏ID、不拆合、不重排组内、不误改当前页',()=>{
 const s=fixture(8);s.clips[0].ideaIds.push(s.clips[1].ideaIds[0]);s.clips[0].currentId=s.clips[1].currentId;s.ideas[1].agentId=s.clips[0].agentId;s.clips.splice(1,1);
 const next=value(arrangeClips(s,740)),layout=layoutClips(next.clips,740),old=layoutClips(s.clips,740);
 expect(layout.visible.map(p=>p.clip.id)).toEqual(old.visible.map(p=>p.clip.id).concat(old.overflow.map(c=>c.id)).slice(0,layout.visible.length));expect(layout.overflow.length).toBeGreaterThan(0);
 expect(next.clips.map(c=>({id:c.id,ideaIds:c.ideaIds,currentId:c.currentId,agentId:c.agentId}))).toEqual(next.clips.map(c=>{const old=s.clips.find(o=>o.id===c.id)!;return {id:old.id,ideaIds:old.ideaIds,currentId:old.currentId,agentId:old.agentId};}));expect(next.ideas).toEqual(s.ideas);expect(new Set(next.clips.map(c=>c.id)).size).toBe(s.clips.length);
 expect(value(arrangeClips(next,740))).toEqual(next);
});
test('空绳与无效宽度不造数据，极窄窗口不重挂历史',()=>{
 expect(value(arrangeClips(legacySnapshot(),740)).clips).toHaveLength(0);expect(arrangeClips(fixture(1),NaN).ok).toBe(false);expect(arrangeClips(fixture(1),-1).ok).toBe(false);
 const s=fixture(2),next=value(arrangeClips(s,10));expect(next.ideas).toEqual(s.ideas);expect(next.clips.map(c=>c.id)).toEqual(s.clips.map(c=>c.id));
});

test('窗口宽度变化使用同一间距，足够容量时集中完整空位',()=>{
 for(const width of [740,1000,1400,1920]){const s=fixture(2),next=value(arrangeClips(s,width)),shown=layoutClips(next.clips,width),{min,max}=clipTravelBounds(width);expect(shown.visible).toHaveLength(2);expect(shown.visible[1].x-shown.visible[0].x).toBeCloseTo(clipMetrics(width).spacing);expect(next.ideas).toEqual(s.ideas);if(max-min>=2*MIN_SPACING)expect(availableClipPosition(shown.visible.map(p=>p.x),width,width/2)).not.toBe(null);}
});
