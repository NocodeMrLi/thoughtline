// SPDX-License-Identifier: GPL-3.0-only
import {test,expect} from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const {runFixture}=createRequire(import.meta.url)('../../scripts/run-ci-fixture.cjs');
for(const mode of ['success','failure','timeout'])test(`CI fixture ${mode} is reported without deleting its data`,async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-ci-deadline-'));
 try{
  const file=path.join(root,'worker.cjs'),data=path.join(root,'preserved-data.json');await fs.writeFile(data,'{"text":"保留"}');
  await fs.writeFile(file,mode==='timeout'?'setInterval(()=>{},1000);':`console.log('observed ${mode}');process.exit(${mode==='success'?0:7});`);
  const r=await runFixture({file,evidence:root,timeoutMs:mode==='timeout'?300:5000,echo:false});
  expect(r.closeConfirmed).toBe(true);expect(r.passed).toBe(mode==='success');expect(r.timedOut).toBe(mode==='timeout');expect(await fs.readFile(data,'utf8')).toBe('{"text":"保留"}');
  const disk=JSON.parse(await fs.readFile(path.join(root,'supervisor.json'),'utf8'));expect(disk.passed).toBe(r.passed);expect(()=>process.kill(r.pid,0)).toThrow();
  if(mode!=='timeout')expect(r.stdout).toContain('observed '+mode);
 }finally{await fs.rm(root,{recursive:true,force:true});}
},10000);
test('CI fixture waits for pipe closure and captures trailing diagnostics',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-ci-tail-'));
 try{const file=path.join(root,'worker.cjs');await fs.writeFile(file,"process.stdout.write('x'.repeat(20000)+'FINAL-OUTPUT',()=>{process.stderr.write('FINAL-ERROR',()=>process.exit(0));});");
 const r=await runFixture({file,evidence:root,timeoutMs:5000,echo:false});expect(r.passed).toBe(true);expect(r.closeConfirmed).toBe(true);expect(r.stdout).toHaveLength(20012);expect(r.stdout.endsWith('FINAL-OUTPUT')).toBe(true);expect(r.stderr).toBe('FINAL-ERROR');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
