import {afterEach,expect,test} from 'vitest';
import {mkdtemp,rm,readFile,writeFile,rename,open,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FileRepository,type FileIO} from '../../src/main/store/repository';
import {initialSnapshot,editIdea} from '../../src/shared/ideaCommands';
import type {Result} from '../../src/shared/contracts';

const dirs:string[]=[];const originalTZ=process.env.TZ;
const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const io:FileIO={write:async(p,t)=>writeFile(p,t,'utf8'),fsync:async p=>{const f=await open(p,'r+');try{await f.sync();}finally{await f.close();}},rename,read:p=>readFile(p,'utf8')};
afterEach(async()=>{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;await Promise.all(dirs.splice(0).map(d=>rm(d,{recursive:true,force:true})));});
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'thoughtline-p3-schema-'));dirs.push(dir);return dir;}
const old=(schemaVersion:1|2)=>({...initialSnapshot(),schemaVersion,revision:7,ideas:[{id:'old',text:'  原文 🧵\n第二行\n ',title:'短名',project:'项目',agentId:'general',status:'hanging',createdAt:'2026-01-01T00:30:00+08:00',updatedAt:'2026-02-10T18:00:00Z'}],clips:schemaVersion===1?undefined:[{id:'old-group',agentId:'general',ideaIds:['old'],currentId:'old',position:0.43}],draft:{text:' 尚未写完\n ',title:'草稿名',project:'项目',agentId:'general'}});

test.each([1,2] as const)('schema%s原始字节先备份，修订/全文/草稿/日期跨提交重启保全，备份不覆盖',async schemaVersion=>{
 const dir=await fixture();const raw=' \n'+JSON.stringify(old(schemaVersion),null,2)+'\n';await writeFile(join(dir,'snapshot.json'),raw);
 process.env.TZ='America/Los_Angeles';const repo=new FileRepository(dir);const migrated=value(await repo.load());
 expect(migrated.schemaVersion).toBe(4);expect(migrated.revision).toBe(7);
 expect(migrated.ideas[0]).toMatchObject({text:'  原文 🧵\n第二行\n ',createdDay:'2026-01-01',creationTimeZone:'legacy-offset'});
 expect(migrated.draft?.text).toBe(' 尚未写完\n ');expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);
 const committed=value(await repo.commit(migrated,7));expect(committed.revision).toBe(8);
 const backupPath=join(dir,`snapshot.schema${schemaVersion}.backup.json`);expect(await readFile(backupPath,'utf8')).toBe(raw);
 process.env.TZ='Pacific/Kiritimati';const restarted=new FileRepository(dir);const current=value(await restarted.load());
 expect(current).toEqual(committed);expect(JSON.parse(await readFile(join(dir,'snapshot.json'),'utf8')).schemaVersion).toBe(4);
 const edited=value(editIdea(current,'old',{text:'  修改 😄\n ',title:'短名',project:'项目',agentId:'general'},'2026-10-09T12:00:00Z'));
 value(await restarted.commit(edited,8));expect(value(await new FileRepository(dir).load()).ideas[0]).toMatchObject({id:'old',text:'  修改 😄\n ',createdAt:'2026-01-01T00:30:00+08:00',createdDay:'2026-01-01',creationTimeZone:'legacy-offset'});
 expect(await readFile(backupPath,'utf8')).toBe(raw);
});

test.each([1,2] as const)('schema%s已有原始备份不会被后续迁移覆盖',async schemaVersion=>{
 const dir=await fixture();await writeFile(join(dir,'snapshot.json'),JSON.stringify(old(schemaVersion)));
 const backup=join(dir,`snapshot.schema${schemaVersion}.backup.json`);await writeFile(backup,'existing raw backup');
 const repo=new FileRepository(dir);const s=value(await repo.load());value(await repo.commit(s,7));
 expect(await readFile(backup,'utf8')).toBe('existing raw backup');
});

test.each([1,2] as const)('schema%s原始备份失败时不升级snapshot或丢旧文',async schemaVersion=>{
 const dir=await fixture(),raw=JSON.stringify(old(schemaVersion));await writeFile(join(dir,'snapshot.json'),raw);
 const writes:string[]=[];const repo=new FileRepository(dir,{...io,write:async(p,t)=>{writes.push(p);if(p.includes(`snapshot.schema${schemaVersion}.backup.json`))throw Error('synthetic backup failure');await io.write(p,t);}});
 const s=value(await repo.load());expect(await repo.commit(s,7)).toMatchObject({ok:false,code:'IO'});
 expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);expect(writes.some(p=>p.includes('snapshot.json.tmp'))).toBe(false);
});

test('未知schema遇到有效bak仍fail closed，主文件与所有备份不变',async()=>{
 const dir=await fixture();const raw=JSON.stringify({...initialSnapshot(),schemaVersion:99});await writeFile(join(dir,'snapshot.json'),raw);
 const backup=JSON.stringify(initialSnapshot());await writeFile(join(dir,'snapshot.bak.json'),backup);
 expect(await new FileRepository(dir).load()).toMatchObject({ok:false,code:'INVALID'});
 expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);expect(await readFile(join(dir,'snapshot.bak.json'),'utf8')).toBe(backup);
 expect((await readdir(dir)).sort()).toEqual(['snapshot.bak.json','snapshot.json']);
});

test('扩展年份无法迁移为规范创建日时保留原文件，禁止提交空库或无效schema3',async()=>{
 const dir=await fixture();const source=old(2);source.ideas[0].createdAt='+010000-01-01T00:00:00Z';const raw=JSON.stringify(source);await writeFile(join(dir,'snapshot.json'),raw);
 const repo=new FileRepository(dir);expect(await repo.load()).toMatchObject({ok:false,code:'INVALID'});
 expect(await repo.commit(initialSnapshot(),7)).toMatchObject({ok:false,code:'INVALID'});
 expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);expect(await readdir(dir)).toEqual(['snapshot.json']);
});

test('损坏主文件由schema2备份恢复后分别保留损坏原文和schema2原字节',async()=>{
 const dir=await fixture(),raw=JSON.stringify(old(2),null,2);await writeFile(join(dir,'snapshot.json'),'{synthetic damage');await writeFile(join(dir,'snapshot.bak.json'),raw);
 const repo=new FileRepository(dir);const s=value(await repo.load());value(await repo.commit(s,7));
 expect(await readFile(join(dir,'snapshot.schema2.backup.json'),'utf8').catch(()=>null)).toBe(raw);
 const corrupt=(await readdir(dir)).find(f=>f.startsWith('snapshot.corrupt-'));expect(corrupt).toBeTruthy();expect(await readFile(join(dir,corrupt!),'utf8')).toBe('{synthetic damage');
 expect(value(await new FileRepository(dir).load()).ideas[0].text).toBe('  原文 🧵\n第二行\n ');
});
