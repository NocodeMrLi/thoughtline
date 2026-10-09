import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fixedRope,fixedRopeY,visibleSlots} from './execution-modules/ropeGeometry.ts';
import {layoutClips,clipTravelBounds,normalizedPosition,captureClipPositions} from './execution-modules/clipLayout.ts';
import {initialSnapshot,validateSnapshot} from './execution-modules/ideaCommands.ts';
import {mergeClips,splitClip,moveClip} from './execution-modules/clipCommands.ts';
const clips=n=>Array.from({length:n},(_,i)=>({id:String(i),agentId:i%3?'codex':'claude',ideaIds:['idea'+i],currentId:'idea'+i,position:null}));
const widths=[0,180,184,260,380,800,1040,1440,1920,2560,3840],counts=[0,1,3,4,5,6,24,100];let checks=0;
const partition=(input,out)=>{assert.equal(out.visible.length+out.overflow.length,input.length);assert.deepEqual([...out.visible.map(p=>p.clip.id),...out.overflow.map(c=>c.id)].sort(),input.map(c=>c.id).sort());checks++;};
const bounds=(out,w)=>{const b=clipTravelBounds(w);for(const p of out.visible){assert(p.x>=b.min-1e-8&&p.x<=b.max+1e-8);assert(p.x-80>=12-1e-8&&p.x+80<=w-12+1e-8);}for(let i=1;i<out.visible.length;i++)assert(out.visible[i].x-out.visible[i-1].x>=172-1e-8);checks++;};
const cases=[];
for(const w of widths){const rope=fixedRope(w);assert(Math.abs(rope.length-.7*w)<1e-8);assert(Math.abs(rope.left-.15*w)<1e-8);assert(Math.abs(fixedRopeY(w/2,rope)-(32+rope.sag))<1e-8);checks++;
 for(const n of counts){const input=clips(n),copy=structuredClone(input),out=layoutClips(input,w);assert.deepEqual(input,copy);partition(input,out);bounds(out,w);assert.equal(out.visible.length,Math.min(n,visibleSlots(w)));checks++;
 const legacy=input.map((c,i)=>({...c,position:n>1?i/(n-1):0})),frozen=structuredClone(legacy),lo=layoutClips(legacy,w);partition(legacy,lo);bounds(lo,w);assert.deepEqual(legacy,frozen);checks++;
 const captured=captureClipPositions(legacy,w),replay=layoutClips(captured,w);partition(captured,replay);bounds(replay,w);
 assert.deepEqual(replay.visible.map(p=>p.clip.id),lo.visible.map(p=>p.clip.id));lo.visible.forEach((p,i)=>assert(Math.abs(p.x-replay.visible[i].x)<1e-8));checks++;
 cases.push({width:w,count:n,defaultVisible:out.visible.length,legacyVisible:lo.visible.length});
 }}
// Separate explicit positions may use minimum-spacing capacity greater than comfortable defaults.
const sample=clips(24).map((c,i)=>({...c,position:i/23}));const filter=[];
for(const w of [1040,1440,1920])for(const agent of ['all','codex','claude']){
 const subset=sample.filter(c=>agent==='all'||c.agentId===agent),before=layoutClips(subset,w),captured=captureClipPositions(sample,w,agent),after=layoutClips(captured.filter(c=>agent==='all'||c.agentId===agent),w);
 assert.deepEqual(after.visible.map(p=>p.clip.id),before.visible.map(p=>p.clip.id));before.visible.forEach((p,i)=>assert(Math.abs(p.x-after.visible[i].x)<1e-8));
 sample.filter(c=>!before.visible.some(p=>p.clip.id===c.id)).forEach(c=>assert.deepEqual(captured.find(x=>x.id===c.id),c));partition(sample,{visible:captured.map(c=>({clip:c})),overflow:[]});filter.push({width:w,agent,visible:before.visible.length});checks++;
}
let s={...initialSnapshot(),clips:clips(3).map(c=>({...c,agentId:'codex'})),ideas:clips(3).map((c,i)=>({id:c.currentId,text:` \n完整原文 ${i} 💡\n `,title:'t'+i,project:'',agentId:'codex',status:'hanging',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z'}))};assert(validateSnapshot(s).ok);const textBefore=s.ideas.map(i=>i.text);const workflows=[];
for(const w of [1040,1440,1920]){const positioned={...s,clips:captureClipPositions(s.clips,w)},before=layoutClips(positioned.clips,w);const merged=mergeClips(positioned,'0','1');assert(merged.ok);assert.deepEqual(merged.value.ideas.map(i=>i.text),textBefore);const ml=layoutClips(merged.value.clips,w);assert(Math.abs(ml.visible.find(p=>p.clip.id==='2').x-before.visible.find(p=>p.clip.id==='2').x)<1e-8);const split=splitClip(merged.value,'1','idea0','split');assert(split.ok);assert.deepEqual(split.value.ideas.map(i=>i.text),textBefore);partition(split.value.clips,layoutClips(split.value.clips,w));const restored=validateSnapshot(JSON.parse(JSON.stringify(split.value)));assert(restored.ok);assert.deepEqual(restored.value.ideas,split.value.ideas);checks+=3;
 for(const side of [0,1]){const positioned={...s,clips:captureClipPositions(s.clips,w)},m=moveClip(positioned,'0',side,side===0?'1':null);assert(m.ok);const out=layoutClips(m.value.clips,w);assert.equal(out.visible.length,3);assert.equal(out.overflow.length,0);const b=clipTravelBounds(w);assert(Math.abs(out.visible.find(p=>p.clip.id==='0').x-(side===0?b.min:b.max))<1e-8);bounds(out,w);assert.deepEqual(m.value.ideas.map(i=>i.text),textBefore);checks++;}
 workflows.push({width:w,moveLeftRight:'pass',mergeUnrelatedCenter:'pass',splitRestartText:'pass'});
}
const before=JSON.parse(await fs.readFile(new URL('before/result.json',import.meta.url))),after=JSON.parse(await fs.readFile(new URL('after/result.json',import.meta.url)));let sameCards=0;
for(const scene of after.scenes){const out=layoutClips(clips(scene.noteCount),scene.width);assert.equal(scene.geometry.cards.length,out.visible.length);scene.geometry.cards.forEach((c,i)=>assert(Math.abs(c.center-out.visible[i].x)<.01));assert.equal(scene.geometry.rope.length,fixedRope(scene.width).length);checks++;
 if(scene.width===1440&&scene.noteCount===3){const old=before.scenes.find(o=>o.width===1440&&o.theme===scene.theme&&o.noteCount===3);scene.geometry.cards.forEach((c,i)=>{for(const f of ['id','variant','outline','agent','ink','titleInk','bodyInk','body'])assert.deepEqual(c[f],old.geometry.cards[i][f]);sameCards++;});}
}
const result={sourceCommit:'81b7783e330b0de85c26df0202ab260e5bfe637a',scope:'independent pure fixed TypeScript function execution; extension-only import adaptation for Node, no Electron/native',checks,cases,filteredCaptureCases:filter,workflowCases:workflows,sameIdentityPaperBodyInkThreeCardRecords:sameCards,recordedScenesMatchedToIndependentLayout:after.scenes.length,formalAcceptance:false};
await fs.writeFile(new URL('layout-replay.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checks,cases:cases.length,filtered:filter.length,workflows:workflows.length,recordedScenes:after.scenes.length,sameCards}));
