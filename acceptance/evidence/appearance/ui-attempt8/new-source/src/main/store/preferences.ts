import {mkdir,readdir,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {atomicWrite,fileIO,type FileIO} from './atomicFile';
import {validPatch,validPreferences,type Preferences} from '../../shared/preferences';
import type {Result} from '../../shared/contracts';
/** Independent profile preferences: never writes a note or settings snapshot. */
export class PreferenceRepository {
 private value:Preferences;private blocked:string|null=null;private ready=false;
 private queue:Promise<unknown>=Promise.resolve();private sequences=new Map<string,number>();
 constructor(private directory:string,private osLocale:string,private io:FileIO=fileIO){this.value={schemaVersion:1,version:0,locale:'zh-CN',theme:'system'};}
 get current():Preferences{return {...this.value};}
 get error(){return this.blocked;}
 async load():Promise<{value:Preferences;error:string|null}>{
  if(this.ready)return {value:this.current,error:this.blocked};
  try{
   await mkdir(this.directory,{recursive:true});
   const names=await readdir(this.directory),existing=names.some(n=>n==='data-location.json'||/^snapshot(?:\.|$)/.test(n));
   this.value={schemaVersion:1,version:0,locale:existing||/^zh(?:[-_]|$)/i.test(this.osLocale)?'zh-CN':'en',theme:'system'};
   const path=join(this.directory,'preferences.json');
   if(names.includes('preferences.json')){const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw Error('Preferences must be a regular unlinked file');const p:unknown=JSON.parse(await this.io.read(path));if(!validPreferences(p))throw Error('Invalid preference schema or values');this.value=p;}
   else await atomicWrite(path,JSON.stringify(this.value),this.io);
  }catch(e){this.blocked=e instanceof Error?e.message:String(e);}
  this.ready=true;return {value:this.current,error:this.blocked};
 }
 update(patch:unknown,sender:string,sequence:number):Promise<Result<Preferences>>{
  if(!validPatch(patch)||!Number.isSafeInteger(sequence)||sequence<1)return Promise.resolve({ok:false,code:'INVALID',message:'Invalid preference request'});
  // Claim sequence on receipt, not completion; late older callbacks cannot win.
  if(sequence<=(this.sequences.get(sender)??0))return Promise.resolve({ok:false,code:'CONFLICT',message:'Stale preference request'});
  this.sequences.set(sender,sequence);const change={...patch};
  const action=async():Promise<Result<Preferences>>=>{
   if(!this.ready||this.blocked)return {ok:false,code:'IO',message:this.blocked??'Preferences are not loaded'};
   const next={...this.value,...change,version:this.value.version+1};
   if(!Number.isSafeInteger(next.version))return {ok:false,code:'INVALID',message:'Preference version exhausted'};
   try{const path=join(this.directory,'preferences.json');const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw Error('Preferences must remain a regular unlinked file');const disk:unknown=JSON.parse(await this.io.read(path));if(!validPreferences(disk)||disk.version!==this.value.version||disk.locale!==this.value.locale||disk.theme!==this.value.theme)throw Error('Preference file changed externally; preserved for recovery');await atomicWrite(path,JSON.stringify(next),this.io);this.value=next;return {ok:true,value:this.current};}
   catch(e){return {ok:false,code:'IO',message:e instanceof Error?e.message:String(e)};}
  };
  const result=this.queue.then(action,action);this.queue=result;return result;
 }
 async flush(){await this.queue;}
}
