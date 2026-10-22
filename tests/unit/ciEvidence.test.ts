// SPDX-License-Identifier: GPL-3.0-only
import {test,expect} from 'vitest';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const {snapshot,collect}=createRequire(import.meta.url)('../../scripts/ci-artifact-evidence.cjs');
test('CI evidence preserves changed and new files without uploading unchanged history',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'thoughtline-ci-evidence-'));
 try{const root=path.join(temp,'source'),baseline=path.join(temp,'baseline.json'),dest=path.join(temp,'delivery');fs.mkdirSync(root);fs.writeFileSync(path.join(root,'historical.json'),'old');fs.writeFileSync(path.join(root,'fixed-path.json'),'previous');snapshot(root,baseline);fs.writeFileSync(path.join(root,'fixed-path.json'),'current');fs.mkdirSync(path.join(root,'new-run'));fs.writeFileSync(path.join(root,'new-run','receipt.json'),'pass');const result=collect(root,baseline,dest);expect(result.files.map((f:{path:string})=>f.path).sort()).toEqual(['fixed-path.json','new-run/receipt.json']);expect(fs.existsSync(path.join(dest,'evidence','historical.json'))).toBe(false);expect(fs.readFileSync(path.join(dest,'evidence','fixed-path.json'),'utf8')).toBe('current');expect(()=>collect(root,path.join(temp,'absent.json'),dest)).toThrow();}finally{fs.rmSync(temp,{recursive:true,force:true});}
});
