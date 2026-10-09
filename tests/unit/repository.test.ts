import {afterEach,expect,test} from 'vitest';
import {mkdtemp,rm,readFile,writeFile,rename,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import * as storage from '../../src/main/store/repository';
import {FileRepository,type FileIO} from '../../src/main/store/repository';
import type {Snapshot,Result} from '../../src/shared/contracts';
const dirs:string[]=[];
const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const io:FileIO={write:async(p,t)=>writeFile(p,t,'utf8'),fsync:async p=>{const f=await open(p,'r+');try{await f.sync();}finally{await f.close();}},rename,read:p=>readFile(p,'utf8')};
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'thoughtline-store-'));dirs.push(dir);return {dir,repo:new FileRepository(dir)};}
afterEach(async()=>{await Promise.all(dirs.splice(0).map(d=>rm(d,{recursive:true,force:true})));});
const add=(s:Snapshot,text='正文\n第二行'):Snapshot=>({...s,clips:[...s.clips,{id:'clip:idea-1',agentId:'general',ideaIds:['idea-1'],currentId:'idea-1',position:null}],ideas:[...s.ideas,{id:'idea-1',text,title:'测试',project:'项目',agentId:'general',status:'hanging',createdAt:'2026-10-08T00:00:00.000Z',updatedAt:'2026-10-08T00:00:00.000Z'}]});
test('首次创建，100KB全文和草稿跨重启逐字节保持',async()=>{
 const {dir,repo}=await fixture();const s=value(await repo.load());
 const next=add(s,'中文\n'.repeat(12000));next.draft={text:'没写完\n',title:'',project:'',agentId:'general'};
 const committed=value(await repo.commit(next,s.revision));expect(committed.revision).toBe(1);
 const loaded=value(await new FileRepository(dir).load());expect(loaded.ideas[0].text).toBe('中文\n'.repeat(12000));expect(loaded.draft?.text).toBe('没写完\n');
});
test.each(['write','fsync','rename'] as const)('故障%s返回IO，旧正文和磁盘文件不变',async fault=>{
 const {dir,repo}=await fixture();let s=value(await repo.load());s=value(await repo.commit(add(s),s.revision));
 const before=await readFile(join(dir,'snapshot.json'),'utf8');
 const failing=new FileRepository(dir,{...io,[fault]:async()=>{throw Object.assign(Error('disk fault'),{code:'EIO'});}});
 value(await failing.load());const next={...s,ideas:s.ideas.map(x=>({...x,text:'不可丢旧文'}))};
 expect(await failing.commit(next,s.revision)).toMatchObject({ok:false,code:'IO'});
 expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(before);
 expect(value(await new FileRepository(dir).load()).ideas[0].text).toBe('正文\n第二行');
});
test('并发旧revision只允许一个提交，外部返回对象不能污染缓存',async()=>{
 const {repo}=await fixture();const s=value(await repo.load());
 const [a,b]=await Promise.all([repo.commit(add(s),0),repo.commit(add(s,'另一个'),0)]);
 expect(a.ok).toBe(true);expect(b).toMatchObject({ok:false,code:'CONFLICT'});
 const changed=value(a);changed.ideas[0].text='外部改动';expect(value(await repo.load()).ideas[0].text).toBe('正文\n第二行');
});
test('半份JSON恢复校验通过备份，损坏原文件保留',async()=>{
 const {dir,repo}=await fixture();let s=value(await repo.load());s=value(await repo.commit(add(s),0));
 value(await repo.commit({...s,ideas:s.ideas.map(x=>({...x,text:'新版'}))},1));
 await writeFile(join(dir,'snapshot.json'),'{half');
 const restored=value(await new FileRepository(dir).load());expect(restored.ideas[0].text).toBe('正文\n第二行');
 expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe('{half');
});
test('未知schema不被备份或空数据覆盖；非法Agent引用不能保存',async()=>{
 const {dir,repo}=await fixture();const s=value(await repo.load());
 expect(await repo.commit({...add(s),ideas:add(s).ideas.map(x=>({...x,agentId:'missing'}))},0)).toMatchObject({ok:false,code:'INVALID'});
 await writeFile(join(dir,'snapshot.json'),JSON.stringify({...s,schemaVersion:99}));
 expect(await new FileRepository(dir).load()).toMatchObject({ok:false,code:'INVALID'});
 expect(JSON.parse(await readFile(join(dir,'snapshot.json'),'utf8')).schemaVersion).toBe(99);
});
test('旧schema1首次提交前保留原始备份，迁移保全全文与草稿',async()=>{
 const {dir,repo}=await fixture();const s=value(await repo.load());const legacy={...add(s),schemaVersion:1,clips:undefined,draft:{text:'旧草稿',title:'',project:'',agentId:'general'}};const raw=JSON.stringify(legacy);
 await writeFile(join(dir,'snapshot.json'),raw);const upgraded=new FileRepository(dir);const migrated=value(await upgraded.load());expect(migrated.schemaVersion).toBe(3);expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);
 value(await upgraded.commit(migrated,migrated.revision));expect(await readFile(join(dir,'snapshot.schema1.backup.json'),'utf8')).toBe(raw);expect(value(await new FileRepository(dir).load()).draft?.text).toBe('旧草稿');
});

test('启动恢复界面退出时保留损坏原文，打开目录后可人工修复再重试',async()=>{
 const {dir,repo}=await fixture();const s=value(await repo.load());const raw='{damaged';
 await writeFile(join(dir,'snapshot.json'),raw);let prompt=0,folderRead='';
 const result=await storage.loadWithRecovery?.(dir,async()=>{
  prompt++;if(prompt===1)return 'folder';
  await writeFile(join(dir,'snapshot.json'),JSON.stringify(add(s,'人工修复后的中文正文')));return 'retry';
 },async()=>{folderRead=await readFile(join(dir,'snapshot.json'),'utf8');});
 expect(folderRead).toBe(raw);expect(result?.snapshot.ideas[0].text).toBe('人工修复后的中文正文');
 await writeFile(join(dir,'snapshot.json'),raw);
 const cancelled=await storage.loadWithRecovery?.(dir,async()=>'exit',async()=>{});expect(cancelled).toBeNull();expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe(raw);
});

test('退出等待正在进行的原子提交，完成后重启读到新正文',async()=>{
 const {dir,repo}=await fixture();const initial=value(await repo.load());
 let release!:()=>void;let started!:()=>void;
 const entered=new Promise<void>(resolve=>{started=resolve;});const gate=new Promise<void>(resolve=>{release=resolve;});
 const slow=new FileRepository(dir,{...io,rename:async(from,to)=>{if(to===join(dir,'snapshot.json')){started();await gate;}await rename(from,to);}});
 value(await slow.load());const pending=slow.commit(add(initial,'退出前已点击保存的正文'),initial.revision);await entered;
 let drained=false;const idle=slow.flush?.().then(()=>{drained=true;});await Promise.resolve();expect(drained).toBe(false);
 release();value(await pending);await idle;expect(drained).toBe(true);expect(value(await new FileRepository(dir).load()).ideas[0].text).toBe('退出前已点击保存的正文');
});
