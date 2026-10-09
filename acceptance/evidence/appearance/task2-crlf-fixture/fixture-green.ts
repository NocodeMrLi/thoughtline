import {describe,test,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import {acceptsPreferenceFailure} from '../../src/renderer/preference-ordering';
// Run the production callback unchanged, supplying its refs and deferred bridge.
function harness(eol:string){
 const source=fs.readFileSync('src/renderer/components/PreferencesControl.tsx','utf8').replace(/\r?\n/g,eol);
 const match=source.match(/const change=async\(patch:PreferencePatch\)=>(.*);\r?\n/);
 expect(match,'Production preference change callback must be present').not.toBeNull();
 const callback=match![1];
 const pending:any[]=[];let error:any='';const info:any={preferences:{version:0}};
 const context:any={sequence:0,intent:{current:0},live:{current:true},version:{current:0},latest:{current:info},setError:(e:any)=>{error=e;},window:{thoughtline:{setPreferences:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}},Error};
 // The old version guard and the new helper are both driven by real callback order.
 context.acceptsPreferenceFailure=acceptsPreferenceFailure;
 const change=vm.runInNewContext('async(patch)=>'+callback,context);
 const broadcast=(own=true,sequence=1)=>{info.preferences.version++;info.preferenceCommit={own,sequence,version:info.preferences.version};context.version.current=info.preferences.version;};
 return {change,pending,broadcast,get error(){return typeof error==='string'?error:error?.message||'';}};
}
describe.each([['LF','\n'],['CRLF','\r\n']])('%s production source',(_name,eol)=>{
for(const rejected of [false,true])test(`newest ${rejected?'rejection':'IO result'} stays visible after older successful broadcast`,async()=>{const h=harness(eol);const first=h.change({locale:'en'}),last=h.change({theme:'dark'});h.broadcast();h.pending[0].resolve({ok:true});await first;if(rejected)h.pending[1].reject(Error('ENOSPC'));else h.pending[1].resolve({ok:false,message:'ENOSPC'});await last;expect(h.error).toBe('ENOSPC');});
test('newer local intent still suppresses older failure',async()=>{const h=harness(eol);const old=h.change({theme:'dark'}),last=h.change({locale:'en'});h.broadcast(true,2);h.pending[1].resolve({ok:true});await last;h.pending[0].resolve({ok:false,message:'old error'});await old;expect(h.error).toBe('');});
test('another window success still suppresses delayed failure',async()=>{const h=harness(eol);const old=h.change({theme:'dark'});h.broadcast(false,1);h.pending[0].reject(Error('old error'));await old;expect(h.error).toBe('');});
});
