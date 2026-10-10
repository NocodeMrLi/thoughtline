import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,deleteIdea,restoreIdea,validateSnapshot} from '../../src/shared/ideaCommands';
import {mergeClips,splitClip} from '../../src/shared/clipCommands';
import {placeIdea,undoPlacement} from '../../src/shared/ideaPlacement';
import type {Result} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-10T00:00:00.000Z';
test('per-page reminders survive merge/split and swap undo without moving their ownership',()=>{
 let s=initialSnapshot();for(const [id,reminderAt] of [['one','2026-10-11T09:00:00.000Z'],['two','2026-10-12T10:00:00.000Z']])s=value(newIdea(s,{text:'',title:id,agentId:'general',project:'',reminderAt},id,now));const reminders=s.ideas.map(i=>i.reminder);
 const first=s.clips[0].id,second=s.clips[1].id;s=value(mergeClips(s,first,second));expect(s.ideas.map(i=>i.reminder)).toEqual(reminders);s=value(splitClip(s,second,'one','split',1400));expect(s.ideas.map(i=>i.reminder)).toEqual(reminders);
 const before=s,target=s.clips.find(c=>c.ideaIds.includes('two'))!;s=value(placeIdea(s,{id:'one'}, {kind:'swap',targetClipId:target.id,targetIdeaId:'two',expectedIds:[...target.ideaIds],wholeClip:false},1400,now));expect(s.ideas.map(i=>i.reminder)).toEqual(reminders);s=value(undoPlacement(s,{before,after:s,incomingId:'one'}));expect(s.ideas.map(i=>i.reminder)).toEqual(reminders);
});
test('legacy snapshots load without reminders; exports retain scheduled and cancelled times',()=>{
 const old=initialSnapshot();expect(value(validateSnapshot(JSON.parse(JSON.stringify(old))))).toEqual(old);const s=value(newIdea(old,{text:'旧数据仍可用',title:'',agentId:'general',project:'',reminderAt:'2026-10-11T09:00:00.000Z'},'one',now));const restored=value(restoreIdea(value(deleteIdea(s,'one',now)),'one',now));expect(value(validateSnapshot(JSON.parse(JSON.stringify(restored)))).ideas[0].reminder).toMatchObject({at:'2026-10-11T09:00:00.000Z',state:'cancelled'});
});
