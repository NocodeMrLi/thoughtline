const {test,afterEach}=require('node:test');const assert=require('node:assert/strict');
const {ProbeSession}=require('./probe-session.cjs');
const {spawn}=require('node:child_process');
const owned=[];
afterEach(async()=>{for(const child of owned.splice(0)){if(child.exitCode===null&&child.signalCode===null){const ended=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await ended;}}});
function worker(mode='normal'){
 const code=`const readline=require('node:readline');let n=0;readline.createInterface({input:process.stdin}).on('line',line=>{if(line==='quit')return process.exit(0);n++;const display=Number(line.split(' ')[1]);if(${JSON.stringify(mode)}==='exit')return process.exit(3);if(${JSON.stringify(mode)}==='late'&&n===1)return setTimeout(()=>console.log(JSON.stringify({state:'blocked',displayId:display,reason:'fixture'})),150);console.log(${JSON.stringify(mode)}==='malformed'?'bad json':JSON.stringify({state:'blocked',displayId:display,reason:'fixture'}));});`;
 const child=spawn(process.execPath,['-e',code],{stdio:['pipe','pipe','pipe']});owned.push(child);return child;
}
test('fresh blocked belongs only to sampled target; expiry and target change cannot reuse it',async()=>{
 let now=0;const child=worker();const session=new ProbeSession({spawn:()=>child,now:()=>now,ttlMs:500,timeoutMs:2000});
 try{
  assert.equal((await session.sample('1')).state,'blocked');
  now=499;assert.equal(session.current('1').state,'blocked');
  now=500;assert.equal(session.current('1').state,'unknown');
  assert.equal(session.current('2').state,'unknown');
  assert.equal((await session.sample('2')).state,'blocked');
  assert.equal(session.current('1').state,'unknown');
 }finally{await session.close();}
});
test('concurrent demand shares one query; a target switch invalidates in-flight result',async()=>{
 const child=worker('late');const session=new ProbeSession({spawn:()=>child,timeoutMs:2000});
 try{
  const a=session.sample('1'),b=session.sample('1');assert.strictEqual(a,b);
  session.target('2');assert.equal((await a).state,'unknown');
  assert.equal(session.current('2').state,'unknown');
  assert.equal((await session.sample('2')).state,'blocked');
 }finally{await session.close();}
});
for(const mode of ['late','malformed','exit'])test(mode+' yields unknown, closes owned helper and cannot poison next request',async()=>{
 let calls=0;const children=[];const session=new ProbeSession({spawn:()=>{const child=worker(calls++===0?mode:'normal');children.push(child);return child;},timeoutMs:mode==='late'?60:2000});
 try{
  assert.equal((await session.sample('1')).state,'unknown');
  assert.equal(session.current('1').state,'unknown');
  assert.equal((await session.sample('1')).state,'blocked');
 }finally{await session.close();}
 for(const child of children)assert(child.exitCode!==null||child.signalCode!==null,'every owned helper exited');
});
