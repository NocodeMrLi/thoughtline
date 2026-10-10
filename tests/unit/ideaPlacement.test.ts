import {test,expect} from 'vitest';
import {initialSnapshot,newIdea,changeStatus,removeProject,editIdea} from '../../src/shared/ideaCommands';
import {mergeClips} from '../../src/shared/clipCommands';
import {layoutClips} from '../../src/shared/clipLayout';
import {placementPlan,placeIdea,undoPlacement,type PlacementIntent} from '../../src/shared/ideaPlacement';
import type {Snapshot,Result} from '../../src/shared/contracts';
const now='2026-10-10T00:00:00Z',draft={text:' 完整中文😀\n第二行 ',title:'新念头',project:'项目',agentId:'general'};
const value=<T>(r:Result<T>)=>{if(!r.ok)throw Error(r.message);return r.value;};
const fixture=(n=3)=>{let s=initialSnapshot();for(let i=0;i<n;i++)s=value(newIdea(s,{...draft,title:'旧'+i},'a'+i,now));return s;};
const target=(s:Snapshot,id='a0'):Extract<PlacementIntent,{kind:'swap'}>=>{const clip=s.clips.find(c=>c.ideaIds.includes(id))!;return {kind:'swap',targetClipId:clip.id,targetIdeaId:id,expectedIds:clip.ideaIds,wholeClip:false};};
test('capacity distinguishes a real free slot, fragmented gaps, and true full without moving notes',()=>{
 const s=fixture();s.clips.forEach((c,i)=>c.position=i/2);const original=structuredClone(s);
 expect(placementPlan(s,1280)).toBe('arrange');expect(placementPlan(s,2000)).toBe('hang');expect(placementPlan(fixture(5),1280)).toBe('full');expect(s).toEqual(original);
});
test('save-only creates one archived record with exact text and no additional clip',()=>{
 const s=fixture();const next=value(placeIdea(s,{draft,id:'new'}, {kind:'save'},1280,now));
 expect(next.ideas.at(-1)).toMatchObject({...draft,id:'new',status:'archived'});expect(next.clips).toEqual(s.clips);expect(next.draft).toBeNull();
});
test('hang refuses capacity changes rather than saving an invisible hanging record',()=>{
 const s=fixture(5),original=structuredClone(s);expect(placeIdea(s,{draft,id:'new'},{kind:'hang'},1280,now).ok).toBe(false);expect(s).toEqual(original);
});
test('explicit arrangement displays the new note and preserves all records',()=>{
 const s=fixture();s.clips.forEach((c,i)=>c.position=i/2);const next=value(placeIdea(s,{draft,id:'new'},{kind:'arrange'},1280,now));
 expect(layoutClips(next.clips,1280).visible.map(x=>x.clip.currentId)).toContain('new');expect(layoutClips(next.clips,1280).overflow).toHaveLength(0);expect(next.ideas.slice(0,3)).toEqual(s.ideas);
});
test('single swap retains slot, old content and creation day; undo retains the new record',()=>{
 const s=fixture();s.clips[0].position=.2;const next=value(placeIdea(s,{draft,id:'new'},target(s),2000,now));
 expect(next.clips[0]).toMatchObject({id:'clip:a0',position:.2,ideaIds:['new'],currentId:'new'});expect(next.ideas[0]).toMatchObject({id:'a0',text:s.ideas[0].text,status:'archived',createdAt:s.ideas[0].createdAt});
 const undone=value(undoPlacement(next,{before:s,after:next,incomingId:'new'}));expect(undone.clips).toEqual(s.clips);expect(undone.ideas.find(i=>i.id==='new')?.status).toBe('archived');
});
test('same-Agent stack replaces only one page at its index and makes incoming page current',()=>{
 const s=value(mergeClips(fixture(),'clip:a1','clip:a0'));const next=value(placeIdea(s,{draft,id:'new'},target(s,'a1'),2000,now));
 expect(next.clips[0]).toMatchObject({ideaIds:['a0','new'],currentId:'new'});expect(next.ideas.find(i=>i.id==='a0')).toEqual(s.ideas[0]);
});
test('cross-Agent stack requires explicit whole-clip scope and stale member lists are rejected',()=>{
 const s=value(mergeClips(fixture(),'clip:a1','clip:a0'));const other={...draft,agentId:'codex'},intent=target(s);
 expect(placeIdea(s,{draft:other,id:'new'},intent,2000,now).ok).toBe(false);
 const next=value(placeIdea(s,{draft:other,id:'new'},{...intent,wholeClip:true},2000,now));expect(next.ideas.filter(i=>i.status==='archived').map(i=>i.id)).toEqual(['a0','a1']);expect(next.clips[0]).toMatchObject({agentId:'codex',ideaIds:['new']});
 expect(placeIdea(s,{draft,id:'new'},{...intent,expectedIds:['a0']},2000,now).ok).toBe(false);
});
test('hidden overflow is not a replacement target, but an overflow incoming can be placed without duplication',()=>{
 const s=fixture(8);expect(placeIdea(s,{draft,id:'new'},target(s,'a7'),1280,now).ok).toBe(false);
 const next=value(placeIdea(s,{id:'a7'},target(s),1280,now));expect(next.ideas).toHaveLength(8);expect(layoutClips(next.clips,1280).visible.map(p=>p.clip.currentId)).toContain('a7');
});
test('swap undo preserves later text edits and never revives a deleted project',()=>{
 const s=fixture(),placed=value(placeIdea(s,{draft,id:'new'},target(s),2000,now));let current=value(editIdea(placed,'new',{...draft,text:'后来的修改'},now));current=value(removeProject(current,'项目',now));
 const undone=value(undoPlacement(current,{before:s,after:placed,incomingId:'new'}));expect(undone.ideas.find(i=>i.id==='new')?.text).toBe('后来的修改');expect(undone.ideas.every(i=>i.project==='')).toBe(true);
});
test('restoring archived history preserves its ID/date and does not create a duplicate',()=>{
 const s=value(changeStatus(fixture(),'a1','archived',now));const next=value(placeIdea(s,{id:'a1'},{kind:'hang'},2000,now));expect(next.ideas).toHaveLength(3);expect(next.ideas[1].createdAt).toBe(s.ideas[1].createdAt);expect(next.ideas[1].status).toBe('hanging');
});

test('a persisted ID resembling a capacity probe does not hide a full rope',()=>{
 const s=fixture(5);s.ideas[0].id='capacity:'+s.revision;s.clips[0].ideaIds=[s.ideas[0].id];s.clips[0].currentId=s.ideas[0].id;expect(placementPlan(s,1280)).toBe('full');
});
