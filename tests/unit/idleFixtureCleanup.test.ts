// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {mkdtemp,writeFile,readFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const {cleanupIdleFixture}=createRequire(import.meta.url)('../electron/idle-fixture-cleanup.cjs');
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'thoughtline-cleanup-check-'));await writeFile(join(dir,'snapshot.json'),'fixture');return dir;}
test('等待仍存活的已测子进程退出后才删除测试数据',async()=>{
 const dir=await fixture();let checks=0,waits=0;
 try{await cleanupIdleFixture(dir,[123],{alive:()=>++checks<3,sleep:async()=>{expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe('fixture');waits++;}});expect(waits).toBe(2);await expect(access(dir)).rejects.toMatchObject({code:'ENOENT'});}
 finally{await rm(dir,{recursive:true,force:true});}
});
test('子进程始终不退出时有界失败并保留测试目录',async()=>{
 const dir=await fixture();let waits=0;
 try{await expect(cleanupIdleFixture(dir,[123],{alive:()=>true,sleep:async()=>{waits++;},attempts:2})).rejects.toThrow('kept fixture');expect(waits).toBe(2);expect(await readFile(join(dir,'snapshot.json'),'utf8')).toBe('fixture');}
 finally{await rm(dir,{recursive:true,force:true});}
});
test('所有已测进程已消失时直接完成真实目录清理',async()=>{
 const dir=await fixture();
 try{await cleanupIdleFixture(dir,[123],{alive:()=>false,sleep:async()=>{throw Error('unexpected wait');}});await expect(access(dir)).rejects.toMatchObject({code:'ENOENT'});}
 finally{await rm(dir,{recursive:true,force:true});}
});
