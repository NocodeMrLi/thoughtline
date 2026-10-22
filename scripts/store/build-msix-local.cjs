// SPDX-License-Identifier: GPL-3.0-only
// Cross-package the verified Windows payload with Microsoft's MSIX SDK on macOS.
// This checks package integrity; it does not claim Windows installation/runtime coverage.
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const {sourceInputVector}=require('../source-input-vector.cjs');
const {manifest,identity,storeVersion}=require('./package-contract.cjs');
const {inventory}=require('./stage.cjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(file,args)=>execFileSync(file,args,{stdio:'inherit'});
assert.equal(process.platform,'darwin','Use the native Windows SDK script on Windows');
const sdk=fs.realpathSync(process.env.THOUGHTLINE_MAKEMSIX||path.join(os.homedir(),'.cache/thoughtline-msix-sdk/build-thoughtline/bin/makemsix'));
const vector=sourceInputVector(),pkg=require('../../package.json');
run(process.execPath,['scripts/verify-local-windows-package.cjs']);
const win=JSON.parse(fs.readFileSync('dist/windows-local-build-manifest.json'));
assert.equal(win.buildSource,vector.headSha);assert.equal(win.inputVector.worktreeSha256,vector.worktreeSha256);
const payloadRoot=path.resolve('dist/win-unpacked'),payload=inventory(payloadRoot);
for(const name of Object.keys(payload).filter(n=>n.endsWith('.node')))assert.equal(fs.readFileSync(path.join(payloadRoot,name)).toString('ascii',0,2),'MZ','Non-Windows native module');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'thoughtline-local-msix-')),stage=path.join(temp,'stage'),unpack=path.join(temp,'unpack');
const output=path.resolve(`dist/store/Thoughtline-${pkg.version}-store-x64.msix`);
assert(!fs.existsSync(output),'Preserve the previous MSIX before rebuilding');
try {
 fs.mkdirSync(stage);fs.cpSync(payloadRoot,path.join(stage,'app'),{recursive:true});fs.mkdirSync(path.join(stage,'Assets'));
 const xml=manifest(pkg.version);fs.writeFileSync(path.join(stage,'AppxManifest.xml'),xml);
 const logoHashes={};
 for(const [name,size] of [['StoreLogo',50],['Square44x44Logo',44],['Square150x150Logo',150]]) {
  const file=path.join(stage,'Assets',name+'.png');
  run('/usr/bin/sips',['-s','format','png','--resampleHeightWidth',String(size),String(size),'assets/app-icon.png','--out',file]);
  const bytes=fs.readFileSync(file);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);logoHashes[name+'.png']=hash(bytes);
 }
 fs.mkdirSync(path.dirname(output),{recursive:true});
 run(sdk,['pack','-d',stage,'-p',output]);
 // Only signature enforcement is skipped: Store upload candidates are unsigned.
 run(sdk,['unpack','-p',output,'-d',unpack,'-ss']);
 assert.equal(fs.readFileSync(path.join(unpack,'AppxManifest.xml'),'utf8'),xml,'Manifest changed');
 assert.deepEqual(inventory(path.join(unpack,'app')),payload,'MSIX payload differs from verified Windows payload');
 assert.deepEqual(inventory(path.join(unpack,'Assets')),Object.fromEntries(Object.entries(logoHashes).sort()));
 assert(!fs.existsSync(path.join(unpack,'AppxSignature.p7x')),'Store candidate must remain unsigned');
 // SDK extraction intentionally omits [Content_Types].xml; inspect the ZIP directory too.
 const zipEntries=execFileSync('/usr/bin/unzip',['-Z1',output],{encoding:'utf8'}).trim().split('\n');
 for(const name of ['AppxBlockMap.xml','[Content_Types].xml'])assert(zipEntries.includes(name),name+' missing from package');
 assert(fs.existsSync(path.join(unpack,'AppxBlockMap.xml')),'Block map missing from SDK extraction');
 run('/usr/bin/unzip',['-tqq',output]);
 assert.deepEqual(sourceInputVector(),vector,'Build inputs changed during MSIX packaging');
 const sdkRoot=path.resolve(path.dirname(sdk),'../..');
 const receipt={schema:1,version:pkg.version,storeVersion:storeVersion(pkg.version),buildSource:vector.headSha,inputVectorSha256:vector.worktreeSha256,identity,architecture:'x64',file:path.basename(output),bytes:fs.statSync(output).size,sha256:hash(fs.readFileSync(output)),tool:{name:'Microsoft MSIX SDK makemsix',source:'https://github.com/microsoft/msix-packaging',commit:execFileSync('git',['-C',sdkRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha256:hash(fs.readFileSync(sdk)),localBuild:true},checks:{sdkSchemaValidatedPack:true,sdkBlockMapValidatedUnpack:true,payloadHashComparison:true,payloadFiles:Object.keys(payload).length,manifestIdentity:true,logoDimensions:true,unsigned:true},windowsRuntimeTested:false,windowsSdkMakeAppxTested:false,storeUploadTested:false,storeSubmissionPerformed:false,actionsUsed:false,passed:true};
 fs.writeFileSync('dist/store/local-msix-build-manifest.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
