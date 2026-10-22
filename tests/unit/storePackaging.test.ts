// SPDX-License-Identifier: GPL-3.0-only
import {createRequire} from 'node:module';
import {mkdtempSync, mkdirSync, symlinkSync, rmSync, realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,test} from 'vitest';
const require=createRequire(import.meta.url);
const {storeVersion,validateIdentity,manifest,ownedStage,assertSourceBinding,publisherId}=require('../../scripts/store/package-contract.cjs');
const identity={name:'NocodeMrli.Thoughtline',publisher:'CN=B5946604-C81F-4CBD-97F9-E2F6C22D124D',publisherDisplayName:'NocodeMrli',storeId:'9PK55N0ZM4TB',applicationId:'App',packageFamilyName:'NocodeMrli.Thoughtline_a1n5zxj14c524',toastClsid:'5d3acf61-53d7-51af-ad67-05db67eae9e8'};
test('Store version is a bounded, monotonically mapped four-part identity, separate from product version',()=>{expect(storeVersion('0.0.38')).toBe('1.0.38.0');expect(storeVersion('1.2.3')).toBe('2.2.3.0');for(const x of ['0.0.38-beta','01.0.1','65535.0.1','1.0.65536','1.2','1.2.3.4'])expect(()=>storeVersion(x)).toThrow();});
test('manifest binds exact case-sensitive Store identity, x64, both locales and stable notification COM server',()=>{
 const xml=manifest('0.0.38',identity);expect(xml).toContain('Version="1.0.38.0"');expect(xml).toContain('Name="NocodeMrli.Thoughtline"');expect(xml).toContain('ProcessorArchitecture="x64"');expect(xml).toContain('Executable="app\\Thoughtline.exe"');expect(xml).toContain('Language="en-US"');expect(xml).toContain('Language="zh-CN"');expect(xml).toContain('ToastActivatorCLSID="'+identity.toastClsid+'"');expect(xml).toContain('<com:Class Id="'+identity.toastClsid+'"');expect(xml).toContain('runFullTrust');expect(xml).not.toContain('StartupTask');
});
test('identity mismatch and source drift reject before package operations',()=>{expect(validateIdentity(identity)).toEqual(identity);for(const key of Object.keys(identity))expect(()=>validateIdentity({...identity,[key]:'wrong'})).toThrow();expect(publisherId(identity.publisher)).toBe('a1n5zxj14c524');const sha='a'.repeat(40),tree='b'.repeat(40);expect(()=>assertSourceBinding(sha,sha,tree,tree)).not.toThrow();expect(()=>assertSourceBinding(sha,'c'.repeat(40),tree,tree)).toThrow();expect(()=>assertSourceBinding(sha,sha,tree,'d'.repeat(40))).toThrow();expect(()=>assertSourceBinding('main',sha,tree,tree)).toThrow();});
test('only the designated stage is writable; traversal and symlink escapes are rejected',()=>{const root=mkdtempSync(join(tmpdir(),'thoughtline-store-contract-'));try{mkdirSync(join(root,'dist'));expect(ownedStage(root,join(root,'dist/store/staging'))).toBe(join(realpathSync(root),'dist/store/staging'));for(const p of [root,join(root,'dist'),join(root,'dist/store-other'),join(root,'../escape')])expect(()=>ownedStage(root,p)).toThrow();symlinkSync(tmpdir(),join(root,'dist/store'),process.platform==='win32'?'junction':'dir');expect(()=>ownedStage(root,join(root,'dist/store/staging'))).toThrow();}finally{rmSync(root,{recursive:true,force:true});}});
test('path/source preflight occurs before the first package writer',()=>{
 const fs=require('node:fs');const text=fs.readFileSync('scripts/store/build-msix.ps1','utf8');
 const gate=text.indexOf("'scripts/store/stage.cjs', 'preflight'");const write=text.indexOf("'node_modules/electron-builder/cli.js'");
 expect(gate).toBeGreaterThanOrEqual(0);expect(write).toBeGreaterThan(gate);
});
test('each fallible cleanup is isolated and failure reports survive cleanup errors',()=>{
 const text=require('node:fs').readFileSync('scripts/store/install-check.ps1','utf8');
 expect(text).toContain('function Invoke-OwnedCleanup');expect(text).toContain('$report.cleanupErrors');
 const final=text.slice(text.indexOf('} finally {'));
 for(const label of ['package','trust','private certificate','temporary files','profile'])expect(final).toContain("Invoke-OwnedCleanup '"+label+"'");
 expect(final).toContain('} finally {');expect(final).toContain("Set-Content 'dist/store/install-report.json'");
});
