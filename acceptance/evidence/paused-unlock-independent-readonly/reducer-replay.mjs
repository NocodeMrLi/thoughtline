import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as before from './shelfState-before.ts';
import * as after from './shelfState.ts';
const event=(type,now,extra={})=>({type,now,...extra});
const scenarios=[];
for(const name of ['composer','manage','menu','drag','text-drag'])scenarios.push({name:`release paused ${name}`,check(api){
 let s=api.shelfTransition(api.initialShelf(),event('lock',0,{name,active:true}));
 s=api.shelfTransition(s,event('suspend',1));const presentation={...s,locks:[]};
 s=api.shelfTransition(s,event('lock',2,{name,active:false}));assert.deepEqual(s,presentation);
 s=api.shelfTransition(s,event('resume',3));s=api.shelfTransition(s,event('pointer',10,{zone:'edge'}));
 assert.equal(api.shelfTransition(s,event('tick',259)).phase,'hidden');assert.equal(api.shelfTransition(s,event('tick',260)).phase,'revealed');
}});
scenarios.push({name:'new lock remains active until release',check(api){
 let s=api.shelfTransition(api.initialShelf(),event('suspend',0));
 s=api.shelfTransition(s,event('lock',1,{name:'composer',active:true}));assert.deepEqual(s.locks,['composer']);
 const paused=structuredClone(s);for(const e of [event('peek',2),event('pointer',3,{zone:'edge'}),event('tick',1000)])s=api.shelfTransition(s,e);assert.deepEqual(s,paused);
 s=api.shelfTransition(s,event('resume',1001));s=api.shelfTransition(s,event('pointer',1002,{zone:'edge'}));assert.equal(api.shelfTransition(s,event('tick',2000)).phase,'hidden');
 s=api.shelfTransition(s,event('lock',2001,{name:'composer',active:false}));assert.equal(api.shelfTransition(s,event('tick',2002)).phase,'revealed');
}});
scenarios.push({name:'release one lock without clearing remaining operation',check(api){
 let s=api.shelfTransition(api.initialShelf(),event('lock',0,{name:'manage',active:true}));
 s=api.shelfTransition(s,event('lock',1,{name:'menu',active:true}));s=api.shelfTransition(s,event('suspend',2));s=api.shelfTransition(s,event('lock',3,{name:'menu',active:false}));assert.deepEqual(s.locks,['manage']);
 s=api.shelfTransition(s,event('resume',4));s=api.shelfTransition(s,event('pointer',5,{zone:'edge'}));assert.equal(api.shelfTransition(s,event('tick',1000)).phase,'hidden');
 s=api.shelfTransition(s,event('lock',1001,{name:'manage',active:false}));assert.equal(api.shelfTransition(s,event('tick',1002)).phase,'revealed');
}});
const results=[];
for(const s of scenarios){let failedBefore=false;try{s.check(before);}catch(e){assert.equal(e.name,'AssertionError');failedBefore=true;}assert(failedBefore,`${s.name} must fail on real old reducer`);s.check(after);results.push({name:s.name,before:'expected assertion failure',after:'pass'});}
// Extra targeted invariants: no source state mutation, duplicate/unknown releases,
// and independent manual/sleep/lock causes through the actual pause aggregator.
let s=after.shelfTransition(after.initialShelf(),event('suspend',0));const pausedInput=s,original=structuredClone(s);
s=after.shelfTransition(s,event('lock',1,{name:'composer',active:true}));assert.deepEqual(pausedInput,original);
const lockedInput=s,input=structuredClone(s);s=after.shelfTransition(s,event('lock',2,{name:'composer',active:true}));assert.deepEqual(s,input);assert.deepEqual(lockedInput,input);
s=after.shelfTransition(s,event('lock',3,{name:'unknown',active:false}));assert.deepEqual(s,input);
const reasons=['manual','sleep','lock'];const pauseCases=[];
for(const last of reasons){
 let p={manual:false,sleep:false,lock:false,paused:false},state=after.initialShelf();
 const apply=(reason,active)=>{const old=p.paused;p=after.pauseTransition(p,reason,active);if(old!==p.paused)state=after.shelfTransition(state,event(p.paused?'suspend':'resume',10));};
 state=after.shelfTransition(state,event('lock',0,{name:'manage',active:true}));for(const r of reasons)apply(r,true);
 state=after.shelfTransition(state,event('lock',1,{name:'manage',active:false}));assert.deepEqual(state.locks,[]);
 for(const r of reasons.filter(r=>r!==last)){apply(r,false);assert(p.paused&&state.suspended);}
 apply(last,false);assert(!p.paused&&!state.suspended);assert.deepEqual(state.locks,[]);pauseCases.push(last);
}
let oldState=before.initialShelf(),newState=after.initialShelf();
const unpausedTrace=[event('peek',0),event('lock',1,{name:'composer',active:true}),event('pointer',2,{zone:'corridor'}),event('tick',3000),event('lock',3001,{name:'composer',active:false}),event('tick',3500),event('tick',3501),event('pointer',4000,{zone:'edge'}),event('tick',4250)];
for(const e of unpausedTrace){oldState=before.shelfTransition(oldState,e);newState=after.shelfTransition(newState,e);assert.deepEqual(newState,oldState);}
const report={beforeCommit:'54494df7cfecd26f109016861c3551f119e11613',sourceCommit:'3e5645481da49b169cadbfc2a2cac843d3235a6c',scope:'Independent pure Node25 TypeScript reducer replay; no Electron/browser/native/window/physical power events',sevenRedGreenScenarios:results,pausedPresentationTimersAndPointerIgnored:true,activeLocksPreserved:true,duplicateAndUnknownReleaseIdempotent:true,inputImmutabilityReviewed:true,independentPauseReasonLastRelease:pauseCases,unpausedPresentationTraceUnchanged:unpausedTrace.length,result:'pass'};
await fs.writeFile(new URL('reducer-replay.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
