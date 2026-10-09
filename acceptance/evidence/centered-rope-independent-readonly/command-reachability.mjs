import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {layoutClips,captureClipPositions} from './execution-modules/clipLayout.ts';
import {initialSnapshot} from './execution-modules/ideaCommands.ts';import {moveClip,mergeClips,splitClip} from './execution-modules/clipCommands.ts';
let seed=11;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};const w=1440;let found=null;
for(let trial=0;trial<300&&!found;trial++){let s={...initialSnapshot(),clips:Array.from({length:8},(_,i)=>({id:''+i,agentId:'codex',ideaIds:['i'+i],currentId:'i'+i,position:null})),ideas:Array.from({length:8},(_,i)=>({id:'i'+i,text:'完整正文'+i,title:'t'+i,project:'',agentId:'codex',status:'hanging',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z'}))};const chain=[];
 for(let step=0;step<60&&!found;step++){const before=layoutClips(s.clips,w),captured=captureClipPositions(s.clips,w),after=layoutClips(captured,w);if(before.visible.length!==after.visible.length||before.visible.some((p,i)=>p.clip.id!==after.visible[i].clip.id||Math.abs(p.x-after.visible[i].x)>1e-7)){found={trial,step,width:w,chain,clips:s.clips,before:before.visible.map(p=>[p.clip.id,p.x]),afterCapture:after.visible.map(p=>[p.clip.id,p.x]),ideas:s.ideas};break;}
  const p={...s,clips:captured},action=rnd();let result,op;
  if(action<.45&&before.visible.length){const chosen=before.visible[Math.floor(rnd()*before.visible.length)].clip,position=rnd()<.5?0:1,beforeId=position===0?s.clips.find(c=>c.id!==chosen.id)?.id??null:null;op={kind:'move',id:chosen.id,position,beforeId};result=moveClip(p,chosen.id,position,beforeId);}
  else if(action<.75&&before.visible.length>=2){const a=before.visible[0].clip,b=before.visible[1].clip;op={kind:'merge',sourceId:a.id,targetId:b.id};result=mergeClips(p,a.id,b.id);}
  else{const grouped=s.clips.find(c=>c.ideaIds.length>1);if(!grouped)continue;const newId='split'+trial+'-'+step;op={kind:'split',id:grouped.id,ideaId:grouped.ideaIds[0],newId};result=splitClip(p,grouped.id,op.ideaId,newId);}
  assert(result.ok);const view=layoutClips(result.value.clips,w);chain.push({...op,before:before.visible.map(p=>[p.clip.id,p.x]),after:view.visible.map(p=>[p.clip.id,p.x])});s=result.value;
 }
}
assert(found,'expected a reachable counterexample');await fs.writeFile(new URL('command-reachability.json',import.meta.url),JSON.stringify({sourceCommit:'81b7783e330b0de85c26df0202ab260e5bfe637a',scope:'actual shared commands from8 null-position clips with same main capture-before-mutation, pure only',...found},null,2)+'\n');console.log(JSON.stringify(found));
