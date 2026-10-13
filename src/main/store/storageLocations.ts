import * as fs from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import type {Result,Snapshot} from '../../shared/contracts';
import {validateSnapshot} from '../../shared/ideaCommands';
import {FileRepository} from './repository';
import {atomicWrite} from './atomicFile';

/** Narrowly owned files only. Browser profile and arbitrary files never travel. */
const owned=(name:string)=>/^(snapshot(?:\.bak|\.schema[123]\.backup)?\.json|snapshot\.corrupt-[a-f0-9-]+\.json)$/.test(name);
export const storageIO=fs;
export type StorageIO=Pick<typeof fs,'lstat'|'realpath'|'readdir'|'readFile'|'copyFile'|'open'|'unlink'|'mkdir'|'rmdir'|'writeFile'>;
type Entry={name:string;size:number;sha256:string};
type Verified={directory:string;repository:FileRepository;snapshot:Snapshot};
type Manifest={schemaVersion:1;appVersion:string;snapshotSchemaVersion:number;revision:number;createdAt:string;files:Entry[]};
class Invalid extends Error{}
const fail=(e:unknown):Result<never>=>({ok:false,code:e instanceof Invalid?'INVALID':'IO',message:`操作未完成，仍使用原位置，原副本保留。${e instanceof Error?e.message:String(e)}`});
const hash=(raw:Uint8Array)=>createHash('sha256').update(raw).digest('hex');
async function directory(path:string,io:StorageIO):Promise<string>{if(!isAbsolute(path))throw new Invalid('请选择绝对目录。');const stat=await io.lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Invalid('目录不能是符号链接。');return io.realpath(path);}
async function bytes(dir:string,name:string,io:StorageIO):Promise<Buffer>{if(!owned(name)&&name!=='manifest.json')throw new Invalid('非法数据文件名。');const path=join(dir,name),stat=await io.lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw new Invalid('数据文件不能是链接。');return io.readFile(path);}
async function entries(dir:string,io:StorageIO):Promise<Entry[]>{const names=(await io.readdir(dir)).filter(owned).sort();const out:Entry[]=[];for(const name of names){const raw=await bytes(dir,name,io);out.push({name,size:raw.length,sha256:hash(raw)});}return out;}
async function snapshotAt(dir:string,io:StorageIO):Promise<Snapshot>{
 for(const name of ['snapshot.json','snapshot.bak.json']){
  let raw:Buffer;try{raw=await bytes(dir,name,io);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')continue;throw e;}
  let parsed;try{parsed=JSON.parse(raw.toString('utf8'));}catch{continue;}
  const result=validateSnapshot(parsed);if(result.ok)return result.value;
  if(parsed&&![1,2,3,4].includes(parsed.schemaVersion))throw new Invalid('未知快照版本，拒绝替换。');
 }
 throw new Invalid('没有可读取的念头快照或备份，未创建空库。');
}
async function syncFile(path:string,io:StorageIO){const h=await io.open(path,'r+');try{await h.sync();}finally{await h.close();}}
async function syncDirectory(path:string,io:StorageIO){try{const h=await io.open(path,'r');try{await h.sync();}finally{await h.close();}}catch(e){if(process.platform==='win32'&&['EISDIR','EPERM','EINVAL','ENOTSUP','EACCES'].includes((e as NodeJS.ErrnoException).code??''))return;throw e;}}
export async function loadStorageLocation(profileDir:string):Promise<Result<{directory:string;allowCreate:boolean}>>{
 try{let raw:string;const path=join(profileDir,'data-location.json');try{const s=await fs.lstat(path);if(!s.isFile()||s.isSymbolicLink())throw new Invalid('位置配置不是普通文件。');raw=await fs.readFile(path,'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {ok:true,value:{directory:profileDir,allowCreate:true}};throw e;}
  let config;try{config=JSON.parse(raw);}catch{throw new Invalid('位置配置损坏。');}
  if(config?.schemaVersion!==1||typeof config.path!=='string'||!isAbsolute(config.path))throw new Invalid('未知或非法位置配置，原文件保留。');
  const dir=await directory(config.path,fs);await snapshotAt(dir,fs);return {ok:true,value:{directory:dir,allowCreate:false}};
 }catch(e){return fail(e);}
}
/** Preserve the simple directory lookup API; startup also needs the no-create policy. */
export async function loadStorageDirectory(profileDir:string):Promise<Result<string>>{
 const result=await loadStorageLocation(profileDir);return result.ok?{ok:true,value:result.value.directory}:result;
}
export async function commitStorageDirectory(profileDir:string,path:string):Promise<void>{await atomicWrite(join(profileDir,'data-location.json'),JSON.stringify({schemaVersion:1,path}));}
async function verifyEntries(dir:string,list:Entry[],io:StorageIO){for(const e of list){const raw=await bytes(dir,e.name,io);if(raw.length!==e.size||hash(raw)!==e.sha256)throw new Invalid(`文件校验不符：${e.name}`);}}
async function cleanCreated(dir:string,created:Entry[],io:StorageIO){for(const e of created){try{const raw=await bytes(dir,e.name,io);if(raw.length===e.size&&hash(raw)===e.sha256)await io.unlink(join(dir,e.name));}catch{/* Never remove files whose ownership cannot be verified. */}}}
async function copyVerified(source:string,target:string,list:Entry[],expected:Snapshot,io:StorageIO,commit?:(path:string)=>Promise<void>):Promise<Verified>{
 const a=await directory(source,io),b=await directory(target,io);if((process.platform==='win32'?a.toLowerCase():a)===(process.platform==='win32'?b.toLowerCase():b))throw new Invalid('新位置不能与原位置相同。');
 if((await io.readdir(b)).length)throw new Invalid('请选择空文件夹，不会合并或覆盖已有文件。');
 const created:Entry[]=[];
 try{
  for(const e of list){await io.copyFile(join(a,e.name),join(b,e.name),constants.COPYFILE_EXCL);created.push(e);await syncFile(join(b,e.name),io);}
  await verifyEntries(b,list,io);await verifyEntries(a,list,io);
  if(!isDeepStrictEqual(await snapshotAt(b,io),expected))throw new Invalid('完整快照与当前内容不一致。');
  const repository=new FileRepository(b,undefined,{allowCreate:false}),loaded=await repository.load();if(!loaded.ok)throw new Invalid(loaded.message);if(!isDeepStrictEqual(loaded.value,expected))throw new Invalid('恢复读取内容不一致。');
  await syncDirectory(b,io);
  // All fallible preparation precedes the configuration commit; caller swaps prepared repository.
  if(commit)await commit(b);
  return {directory:b,repository,snapshot:loaded.value};
 }catch(e){await cleanCreated(b,created,io);throw e;}
}
export async function migrateStorage(source:string,target:string,expected:Snapshot,commitLocation:(path:string)=>Promise<void>,io:StorageIO=fs):Promise<Result<Verified>>{
 try{const dir=await directory(source,io);if(!isDeepStrictEqual(await snapshotAt(dir,io),expected))throw new Invalid('磁盘与当前内容不一致，迁移已停止。');return {ok:true,value:await copyVerified(dir,target,await entries(dir,io),expected,io,commitLocation)};}catch(e){return fail(e);}
}
export async function exportBackup(source:string,parent:string,expected:Snapshot,appVersion:string,io:StorageIO=fs):Promise<Result<string>>{
 let backup:string|null=null;let list:Entry[]=[];
 try{const dir=await directory(source,io),dest=await directory(parent,io);if(!isDeepStrictEqual(await snapshotAt(dir,io),expected))throw new Invalid('磁盘与当前内容不一致，备份已停止。');list=await entries(dir,io);backup=join(dest,`Thoughtline-backup-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}`);await io.mkdir(backup);
  await copyVerified(dir,backup,list,expected,io);
  const manifest:Manifest={schemaVersion:1,appVersion,snapshotSchemaVersion:expected.schemaVersion,revision:expected.revision,createdAt:new Date().toISOString(),files:list};
  await io.writeFile(join(backup,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});await syncFile(join(backup,'manifest.json'),io);await syncDirectory(backup,io);return {ok:true,value:backup};
 }catch(e){if(backup){await cleanCreated(backup,list,io);/* A failed manifest is retained for diagnosis; never delete unverified bytes. */await io.rmdir(backup).catch(()=>{});}return fail(e);}
}
export async function restoreBackup(backup:string,target:string,io:StorageIO=fs):Promise<Result<Verified>>{
 try{const dir=await directory(backup,io);let manifest:Manifest;try{manifest=JSON.parse((await bytes(dir,'manifest.json',io)).toString('utf8'));}catch{throw new Invalid('备份清单不可读取。');}
  if(manifest?.schemaVersion!==1||typeof manifest.appVersion!=='string'||!Number.isInteger(manifest.revision)||typeof manifest.createdAt!=='string'||!Number.isFinite(Date.parse(manifest.createdAt))||!Array.isArray(manifest.files)||!manifest.files.length)throw new Invalid('备份清单版本或内容非法。');
  const names=new Set<string>();for(const e of manifest.files){if(!e||typeof e.name!=='string'||!owned(e.name)||names.has(e.name)||!Number.isSafeInteger(e.size)||e.size<0||typeof e.sha256!=='string'||!/^[a-f0-9]{64}$/.test(e.sha256))throw new Invalid('备份文件清单非法。');names.add(e.name);}
  if(!isDeepStrictEqual((await io.readdir(dir)).sort(),[...names,'manifest.json'].sort()))throw new Invalid('备份缺失文件或含未知文件。');
  await verifyEntries(dir,manifest.files,io);const expected=await snapshotAt(dir,io);if(expected.schemaVersion!==manifest.snapshotSchemaVersion||expected.revision!==manifest.revision)throw new Invalid('备份版本或修订号不一致。');
  return {ok:true,value:await copyVerified(dir,target,manifest.files,expected,io)};
 }catch(e){return fail(e);}
}
