import {expect,test} from 'vitest';
import {mkdtemp,readFile,writeFile,rename,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {atomicWrite,fileIO} from '../../src/main/store/atomicFile';

// Runs on the Windows builder: exercise the real platform branch, never fake process.platform.
test.runIf(process.platform==='win32').each(['EPERM','EBUSY','EACCES'])('Windows transient %s retries without losing the old snapshot',async code=>{
 const dir=await mkdtemp(join(tmpdir(),'thoughtline-win-retry-'));
 try{
  const path=join(dir,'snapshot.json');await writeFile(path,'old snapshot');let attempts=0;
  await atomicWrite(path,'new snapshot',{...fileIO,rename:async(from,to)=>{
   attempts++;if(attempts<4){expect(await readFile(path,'utf8')).toBe('old snapshot');throw Object.assign(Error('transient fixture'),{code});}
   await rename(from,to);
  }});
  expect(attempts).toBe(4);expect(await readFile(path,'utf8')).toBe('new snapshot');expect(await readdir(dir)).toEqual(['snapshot.json']);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test.runIf(process.platform==='win32')('Windows exhausted rename retries preserve the prior snapshot and remove only the temporary file',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'thoughtline-win-retry-'));
 try{
  const path=join(dir,'snapshot.json');await writeFile(path,'old snapshot');let attempts=0;
  await expect(atomicWrite(path,'new snapshot',{...fileIO,rename:async()=>{attempts++;throw Object.assign(Error('persistent fixture'),{code:'EPERM'});}})).rejects.toMatchObject({code:'EPERM'});
  expect(attempts).toBe(4);expect(await readFile(path,'utf8')).toBe('old snapshot');expect(await readdir(dir)).toEqual(['snapshot.json']);
 }finally{await rm(dir,{recursive:true,force:true});}
});
