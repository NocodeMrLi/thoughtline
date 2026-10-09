import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {layoutClips,captureClipPositions,clipTravelBounds,normalizedPosition} from './execution-modules/clipLayout.ts';import {moveClip,mergeClips,splitClip} from './execution-modules/clipCommands.ts';import {initialSnapshot} from './execution-modules/ideaCommands.ts';
let seed=20261009;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};const issues=[];let operations=0,moves=0,fixedChecks=0,movedHiddenCount=0;
for(let trial=0;trial<150;trial++){const width=[1040,1440,1920][trial%3];let s={...initialSnapshot(),clips:Array.from({length:8},(_,i)=>({id:''+i,agentId:'codex',ideaIds:['i'+i],currentId:'i'+i,position:null})),ideas:Array.from({length:8},(_,i)=>({id:'i'+i,text:'原文'+i+'\n😀',title:'t'+i,project:'',agentId:'codex',status:'hanging',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z'}))};const original=structuredClone(s.ideas),chain=[];
 for(let step=0;step<40;step++){const before=layoutClips(s.clips,width),captured=captureClipPositions(s.clips,width),recaptured=layoutClips(captured,width);assert.deepEqual(recaptured.visible.map(p=>p.clip.id),before.visible.map(p=>p.clip.id));before.visible.forEach((p,i)=>assert(Math.abs(recaptured.visible[i].x-p.x)<1e-7));fixedChecks++;
  const p={...s,clips:captured},action=rnd();let r,op;
  if(action<.6&&before.visible.length){const chosen=before.visible[Math.floor(rnd()*before.visible.length)].clip,b=clipTravelBounds(width),x=b.min+rnd()*(b.max-b.min);if(before.visible.some(p=>p.clip.id!==chosen.id&&Math.abs(p.x-x)<=30))continue;const position=normalizedPosition(x,width),beforeId=before.visible.find(p=>p.clip.id!==chosen.id&&p.x>x)?.clip.id??null;op={kind:'move',id:chosen.id,position,beforeId};r=moveClip(p,chosen.id,position,beforeId,width,'all');moves++;}
  else if(action<.8&&before.visible.length>=2){op={kind:'merge',sourceId:before.visible[0].clip.id,targetId:before.visible[1].clip.id};r=mergeClips(p,op.sourceId,op.targetId);}
  else{const grouped=s.clips.find(c=>c.ideaIds.length>1);if(!grouped)continue;op={kind:'split',id:grouped.id,ideaId:grouped.ideaIds[0],newId:'split'+trial+'-'+step};r=splitClip(p,op.id,op.ideaId,op.newId);}
  assert(r.ok);assert.deepEqual(r.value.ideas,original);const after=layoutClips(r.value.clips,width);chain.push(op);operations++;
  if(op.kind==='move'&&!after.visible.some(p=>p.clip.id===op.id))movedHiddenCount++;if(op.kind==='move'&&!after.visible.some(p=>p.clip.id===op.id)&&issues.length<5)issues.push({trial,step,width,op,before:before.visible.map(p=>[p.clip.id,p.x]),after:after.visible.map(p=>[p.clip.id,p.x]),inputClips:s.clips,chain:structuredClone(chain)});
  s=r.value;
 }
}
const result={sourceCommit:'d2901894e243038fe9a18da9781c4837fe6cfc87',seed:20261009,trials:150,stepsPerTrial:40,widths:[1040,1440,1920],scope:'pure actual6arg main semantics; move avoids30DIP merge target; no native',operations,moves,fixedChecks,movedHiddenCount,issues};await fs.writeFile(new URL('move-chain-stress.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({operations,moves,fixedChecks,movedHiddenCount,issues}));

assert.equal(movedHiddenCount,0,"moving clip must remain visible");
