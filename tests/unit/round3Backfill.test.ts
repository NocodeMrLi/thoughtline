import {it,expect} from 'vitest';
import * as queue from '../../src/shared/ideaPlacement';
import {initialSnapshot,newIdea,changeStatus,validateSnapshot} from '../../src/shared/ideaCommands';
import {mergeClips} from '../../src/shared/clipCommands';
import type {Snapshot,Result} from '../../src/shared/contracts';
const v=(r:Result<Snapshot>)=>{if(!r.ok)throw Error(r.message);return r.value;};
const seed=()=>{let s=initialSnapshot();for(let n=0;n<6;n++)s=v(newIdea(s,{title:'原始'+n,text:'正文',project:'工作',agentId:'general'},'n'+n,'2026-10-11T00:00:00Z'));return s;};
const save=(s:Snapshot,id:string,now:string)=>v(queue.placeIdea(s,{id,draft:{title:id,text:'正文',project:'工作',agentId:'general'}},{kind:'save'},1440,now));
const fill=(s:Snapshot,filter='all'):Snapshot=>{expect(typeof (queue as any).backfillIdeas).toBe('function');return v((queue as any).backfillIdeas(s,1440,'2026-10-11T03:00:00Z',filter));};
it('merge frees one slot, newest waiting idea wins; undo keeps old origin',()=>{
 const s=save(save(seed(),'older','2026-10-11T01:00:00Z'),'newer','2026-10-11T02:00:00Z'),merged=v(mergeClips(s,'clip:n1','clip:n0')),filled=fill(merged);
 expect(filled.clips).toHaveLength(6);expect(filled.ideas.find(i=>i.id==='newer')?.status).toBe('hanging');expect(filled.ideas.find(i=>i.id==='older')?.status).toBe('archived');expect(filled.ideas.map(i=>[i.id,i.title,i.text,i.project])).toEqual(s.ideas.map(i=>[i.id,i.title,i.text,i.project]));
});
it('manual stash, replaced and legacy archived never reappear on reload',()=>{
 let s=seed();s=v(changeStatus(s,'n0','archived','2026-10-11T01:00:00Z'));s.ideas.push({...s.ideas[0],id:'legacy',offRopeReason:undefined});s.ideas.push({...s.ideas[0],id:'replaced',offRopeReason:'replaced'});const result=fill(v(validateSnapshot(JSON.parse(JSON.stringify(s)))));
 expect(result.clips).toHaveLength(5);expect(result.ideas.filter(i=>i.status==='archived')).toHaveLength(3);
});
it('active label filtering does not admit unrelated queued tags',()=>{
 const s=save(seed(),'queued','2026-10-11T01:00:00Z'),merged=v(mergeClips(s,'clip:n1','clip:n0'));
 expect(fill(merged,'codex').ideas.find(i=>i.id==='queued')?.status).toBe('archived');
});
it('reduce then increase capacity preserves grouped notes and queued eligibility',()=>{
 const s=seed();expect(typeof (queue as any).setShelfCapacity).toBe('function');
 const lower=v((queue as any).setShelfCapacity(s,4,1440,'2026-10-11T03:00:00Z'));expect(lower.clips).toHaveLength(4);expect(lower.ideas.filter(i=>i.offRopeReason==='capacity')).toHaveLength(2);
 const upper=v((queue as any).setShelfCapacity(lower,8,1440,'2026-10-11T04:00:00Z'));expect(upper.clips).toHaveLength(6);expect(upper.ideas.map(i=>[i.id,i.title,i.text])).toEqual(s.ideas.map(i=>[i.id,i.title,i.text]));
});
it('capacity overflow keeps a stacked clip together when capacity returns',()=>{
 let s=seed();s=v(newIdea(s,{title:'叠纸',text:'内容',project:'工作',agentId:'general'},'stack','2026-10-11T00:00:00Z'));s=v(mergeClips(s,'clip:stack','clip:n5'));
 const original=s.clips.find(c=>c.id==='clip:n5')!;const lower=v((queue as any).setShelfCapacity(s,4,1440,'2026-10-11T03:00:00Z')),upper=v((queue as any).setShelfCapacity(lower,8,1440,'2026-10-11T04:00:00Z'));
 expect(upper.clips.find(c=>c.id===original.id)).toMatchObject({ideaIds:original.ideaIds,currentId:original.currentId});
});

it('manually re-hanging part of a parked group does not collide on restoring its remainder',()=>{
 let s=seed();s=v(newIdea(s,{title:'stack',text:'body',project:'工作',agentId:'general'},'stack','2026-10-11T00:00:00Z'));s=v(mergeClips(s,'clip:stack','clip:n5'));
 s=v(queue.setShelfCapacity(s,4,1440,'2026-10-11T03:00:00Z'));
 s=v(changeStatus(s,'n0','archived','2026-10-11T03:01:00Z'));
 s=v(queue.placeIdea(s,{id:'n5'},{kind:'hang'},1440,'2026-10-11T03:02:00Z'));
 const upper=v(queue.setShelfCapacity(s,8,1440,'2026-10-11T04:00:00Z'));
 expect(new Set(upper.clips.map(c=>c.id)).size).toBe(upper.clips.length);
 expect(upper.clips.filter(c=>c.ideaIds.includes('n5'))).toHaveLength(1);
 expect(upper.clips.filter(c=>c.ideaIds.includes('stack'))).toHaveLength(1);
 expect(upper.ideas.find(i=>i.id==='n0')?.status).toBe('archived');
});


it('two successive merged slots receive newest then second newest eligible records, not edited legacy',()=>{
 let s=save(save(seed(),'older','2026-10-11T01:00:00Z'),'newer','2026-10-11T02:00:00Z');
 s.ideas.push({...s.ideas[0],id:'legacy-newer',createdAt:'2026-10-11T02:59:00Z',updatedAt:'2026-10-11T04:00:00Z',status:'archived'});
 s.ideas.find(i=>i.id==='older')!.updatedAt='2026-10-11T05:00:00Z';
 s=fill(v(mergeClips(s,'clip:n1','clip:n0')));
 expect(s.ideas.find(i=>i.id==='newer')?.status).toBe('hanging');expect(s.ideas.find(i=>i.id==='older')?.status).toBe('archived');
 s=fill(v(mergeClips(s,'clip:n2','clip:n0')));
 expect(s.clips).toHaveLength(6);expect(s.ideas.find(i=>i.id==='older')?.status).toBe('hanging');expect(s.ideas.find(i=>i.id==='legacy-newer')?.status).toBe('archived');
 expect(s.clips.find(c=>c.id==='clip:n0')?.ideaIds).toEqual(['n0','n1','n2']);
});
it('equal creation times resolve deterministically despite reverse save order',()=>{
 const s=save(save(seed(),'z-last','2026-10-11T01:00:00Z'),'a-first','2026-10-11T01:00:00Z');
 const next=fill(v(mergeClips(s,'clip:n1','clip:n0')));
 expect(next.ideas.find(i=>i.id==='a-first')?.status).toBe('hanging');expect(next.ideas.find(i=>i.id==='z-last')?.status).toBe('archived');
});
