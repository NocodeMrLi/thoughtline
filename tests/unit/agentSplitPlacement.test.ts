import {expect,test} from 'vitest';
import {initialSnapshot,editIdeaIfUnchanged,validateSnapshot} from '../../src/shared/ideaCommands';
import {layoutClips} from '../../src/shared/clipLayout';
import type {Snapshot,Result,Draft} from '../../src/shared/contracts';
const value=<T>(r:Result<T>)=>{if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-09T00:00:00Z',base:Draft={text:'完整正文 中文😀\n ',title:'标题',project:'项目',agentId:'general'};
function seed(positions:(number|null)[]):Snapshot {const ids=['a','b',...positions.slice(1).map((_,n)=>'other'+n)];return value(validateSnapshot({...initialSnapshot(),ideas:ids.map(id=>({...base,id,status:'hanging',createdAt:now,updatedAt:now})),clips:positions.map((position,n)=>({id:'clip'+n,ideaIds:n===0?['a','b']:['other'+(n-1)],currentId:n===0?'b':'other'+(n-1),agentId:'general',position}))}));}
for(const [label,width,positions,overflow] of [ ['automatic',1440,[null,null],false],['left',1440,[1],false],['middle',1440,[0,1],false],['right',1440,[0],false],['full',900,[null,null,null,null,null,null],true] ] as const)test('Group split preserves old centers and identity: '+label,()=>{
 const s=seed([...positions]),before=layoutClips(s.clips,width),draft={...base,project:'另一项目'};
 const next=value(editIdeaIfUnchanged(s,'b',draft,base,now,width)),after=layoutClips(next.clips,width);
 for(const p of before.visible)expect(after.visible.find(q=>q.clip.id===p.clip.id)?.x).toBeCloseTo(p.x,8);
 expect(after.overflow.some(c=>c.ideaIds.includes('b'))).toBe(overflow);expect(next.ideas.map(i=>i.id)).toEqual(s.ideas.map(i=>i.id));expect(next.ideas.find(i=>i.id==='b')).toMatchObject({...draft,id:'b',createdAt:now});expect(next.clips[0]).toMatchObject({id:'clip0',ideaIds:['a'],currentId:'a'});expect(next.clips.find(c=>c.ideaIds.includes('b'))).toMatchObject({ideaIds:['b'],currentId:'b'});
 const continued=value(editIdeaIfUnchanged(next,'b',{...draft,text:'继续编辑'},draft,now,width));expect(continued.clips).toEqual(next.clips);expect(continued.ideas.find(i=>i.id==='b')?.text).toBe('继续编辑');
});
test('ordinary edit with existing unrelated overflow leaves clip layout metadata alone',()=>{const s=seed([null,null,null,null,null]);const next=value(editIdeaIfUnchanged(s,'b',{...base,text:'只改文'},base,now,900));expect(next.clips).toEqual(s.clips);});
