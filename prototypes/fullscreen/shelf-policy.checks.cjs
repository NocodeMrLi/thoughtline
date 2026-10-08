const {test}=require('node:test');const assert=require('node:assert/strict');
const {initialShelf,shelfTransition}=require('./load-shelf-state.cjs');const {ShelfPolicy}=require('./shelf-policy.cjs');
const fresh=()=>new ShelfPolicy({initial:initialShelf,step:shelfTransition});
test('blocked interrupts display and discards prior dwell; clear needs a new full dwell',()=>{
 const p=fresh();p.event({type:'pointer',zone:'edge',now:0});p.event({type:'tick',now:250});assert.equal(p.state.phase,'revealed');
 p.environment('fullscreen',true,260);assert.equal(p.state.phase,'hidden');
 p.event({type:'peek',now:300});assert.equal(p.state.phase,'hidden');
 p.environment('fullscreen',false,1000);p.event({type:'tick',now:1001});assert.equal(p.state.phase,'hidden');
 p.event({type:'pointer',zone:'edge',now:1010});p.event({type:'tick',now:1259});assert.equal(p.state.phase,'hidden');
 p.event({type:'tick',now:1260});assert.equal(p.state.phase,'revealed');
});
test('sleep, screen-lock, manual and fullscreen release independently',()=>{
 const p=fresh();for(const reason of ['manual','sleep','lock','fullscreen'])p.environment(reason,true,0);
 for(const [n,reason] of ['sleep','fullscreen','lock'].entries()){p.environment(reason,false,n+1);p.event({type:'peek',now:10+n});assert.equal(p.state.phase,'hidden');}
 p.environment('manual',false,20);p.event({type:'peek',now:21});assert.equal(p.state.phase,'peek');
});
test('fullscreen suppression waits for text-drag end then hides',()=>{
 const p=fresh();
 p.event({type:'peek',now:0});p.event({type:'lock',name:'text-drag',active:true,now:10});
 p.environment('fullscreen',true,20);assert.equal(p.state.phase,'peek');
 p.event({type:'lock',name:'text-drag',active:false,now:30});assert.equal(p.state.phase,'hidden');
 assert.deepEqual(p.state.locks,[]);
});
test('sleep cancels presentation immediately; lock release while suspended must not leave a stale drag lock',()=>{
 const p=fresh();p.event({type:'peek',now:0});p.event({type:'lock',name:'drag',active:true,now:10});
 p.environment('sleep',true,20);assert.equal(p.state.phase,'hidden');
 p.event({type:'lock',name:'drag',active:false,now:21});assert.deepEqual(p.state.locks,[]);
 p.environment('sleep',false,100);p.event({type:'pointer',zone:'edge',now:101});p.event({type:'tick',now:351});assert.equal(p.state.phase,'revealed');
});
test('unknown policy proposal releases only automatic reason',()=>{
 const p=fresh();p.environment('manual',true,0);p.environment('fullscreen',true,1);
 p.sample({state:'unknown'},2);assert.equal(p.state.suspended,true);
 p.environment('manual',false,3);assert.equal(p.state.suspended,false);
});
