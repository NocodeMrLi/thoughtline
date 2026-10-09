import {mkdir} from 'node:fs/promises';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import type {Repository,Result,Snapshot} from '../../shared/contracts';
import {initialSnapshot,validateSnapshot} from '../../shared/ideaCommands';
import {atomicWrite,fileIO,type FileIO} from './atomicFile';
export type {FileIO} from './atomicFile';
const ioError=(e:unknown):Result<never>=>({ok:false,code:'IO',message:'本地保存未成功，请保留文字并重试。'+(e instanceof Error?` (${e.message})`:'')});
export class FileRepository implements Repository{
  private cached:Snapshot|null=null;private queue:Promise<unknown>=Promise.resolve();private damaged:string|null=null;private legacy:string|null=null;
  constructor(private dir:string,private io:FileIO=fileIO){}
  private async readOptional(path:string):Promise<string|null>{try{return await this.io.read(path);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
  async load():Promise<Result<Snapshot>>{
   if(this.cached)return {ok:true,value:structuredClone(this.cached)};
   try{
    const path=join(this.dir,'snapshot.json');const raw=await this.readOptional(path);
    if(raw!==null){
      try{const decoded=JSON.parse(raw);const result=validateSnapshot(decoded);
        if(result.ok){if(decoded.schemaVersion===1)this.legacy=raw;this.cached=result.value;return {ok:true,value:structuredClone(result.value)};}
        if(decoded&&![1,2].includes(decoded.schemaVersion))return result;
      }catch(e){if(!(e instanceof SyntaxError))throw e;}
      this.damaged=raw;
    }
    const backup=await this.readOptional(join(this.dir,'snapshot.bak.json'));
    if(backup!==null){
      try{const decoded=JSON.parse(backup),result=validateSnapshot(decoded);if(result.ok){if(decoded.schemaVersion===1)this.legacy=backup;this.cached=result.value;return {ok:true,value:structuredClone(result.value)};}}catch(e){if(!(e instanceof SyntaxError))throw e;}
    }
    if(raw!==null||backup!==null)return {ok:false,code:'INVALID',message:'数据损坏且没有可用备份，原文件已保留。'};
    await mkdir(this.dir,{recursive:true});const initial=initialSnapshot();
    await atomicWrite(path,JSON.stringify(initial),this.io);this.cached=initial;
    return {ok:true,value:structuredClone(initial)};
   }catch(e){return ioError(e);}
  }
  async flush():Promise<void>{await this.queue;}
  commit(next:Snapshot,expectedRevision:number):Promise<Result<Snapshot>>{
   const execute=async():Promise<Result<Snapshot>>=>{
    const loaded=await this.load();if(!loaded.ok)return loaded;
    if(loaded.value.revision!==expectedRevision)return {ok:false,code:'CONFLICT',message:'内容已更新，请重新读取后再试。'};
    const checked=validateSnapshot({...next,revision:expectedRevision+1});if(!checked.ok)return checked;
    try{
      if(this.legacy!==null&&await this.readOptional(join(this.dir,'snapshot.schema1.backup.json'))===null)await atomicWrite(join(this.dir,'snapshot.schema1.backup.json'),this.legacy,this.io);
      if(this.damaged!==null)await atomicWrite(join(this.dir,'snapshot.corrupt-'+randomUUID()+'.json'),this.damaged,this.io);
      await atomicWrite(join(this.dir,'snapshot.bak.json'),JSON.stringify(loaded.value),this.io);
      await atomicWrite(join(this.dir,'snapshot.json'),JSON.stringify(checked.value),this.io);
      this.cached=checked.value;this.damaged=null;this.legacy=null;return {ok:true,value:structuredClone(checked.value)};
    }catch(e){return ioError(e);}
   };
   const pending=this.queue.then(execute,execute);this.queue=pending;return pending;
  }
}

export async function loadWithRecovery(dir:string,choose:(error:Extract<Result<Snapshot>,{ok:false}>)=>Promise<'folder'|'retry'|'exit'>,openFolder:()=>Promise<void>):Promise<{repository:FileRepository;snapshot:Snapshot}|null>{
 for(;;){
  const repository=new FileRepository(dir),result=await repository.load();
  if(result.ok)return {repository,snapshot:result.value};
  const action=await choose(result);
  if(action==='exit')return null;
  if(action==='folder')await openFolder();
 }
}
