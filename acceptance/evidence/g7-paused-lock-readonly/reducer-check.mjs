import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {initialShelf,shelfTransition} from '../../../src/shared/shelfState.ts';
const source=new URL('../../../src/shared/shelfState.ts',import.meta.url);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),'b7ac4c2eb5512208773f794c7602083c849714e6fb68422768bea14c05e7b5bf','source binding changed; do not reuse fixed-source conclusions');
const step=(s,e)=>shelfTransition(s,e);
const traces=[];
for(const name of ['composer','manage','menu','text-drag']){
 let s=initialShelf();const states=[];
 const apply=e=>{s=step(s,e);states.push({event:e,state:structuredClone(s)});};
 apply({type:'lock',name,active:true,now:0});
 apply({type:'suspend',now:1});
 apply({type:'lock',name,active:false,now:2});
 assert(s.suspended);assert.deepEqual(s.locks,[name]);
 apply({type:'resume',now:3});
 apply({type:'pointer',zone:'edge',now:10});
 apply({type:'tick',now:1000});
 assert.deepEqual(s.locks,[name]);assert.equal(s.phase,'hidden');
 traces.push({name,releaseWhileSuspendedIgnored:true,staleLockAfterResume:true,normalEdgeDwellCannotReveal:true,states});
}
let normal=initialShelf();for(const e of [{type:'lock',name:'composer',active:true,now:0},{type:'lock',name:'composer',active:false,now:2},{type:'pointer',zone:'edge',now:10},{type:'tick',now:1000}])normal=step(normal,e);
assert.equal(normal.phase,'revealed');assert.deepEqual(normal.locks,[]);
const result={scope:'exact current shared TypeScript reducer under Node type stripping; no Electron, native windows, power events, system permission, notes or real shortcuts',sourceCommit:'d9a9cd013fb879a9f11065db8dabec73882c41df',sourcePath:source.pathname,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),normalControl:normal,traces,productNativeReproduction:false,productionModified:false};
fs.writeFileSync(new URL('./replay-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({traces:traces.length,controlledReducerGapConfirmed:true,nativeReproduction:false,productionModified:false}));
