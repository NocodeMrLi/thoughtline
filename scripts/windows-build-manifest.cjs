// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');const pkg=require('../package.json');
const {sourceInputVector}=require('./source-input-vector.cjs');
assert.equal(process.platform,'win32');assert.equal(process.env.GITHUB_ACTIONS,'true');
assert.equal(pkg.version,JSON.parse(fs.readFileSync('package-lock.json','utf8')).version);
assert.equal(pkg.build.appId,'com.nocodemrli.thoughtline');assert.equal(pkg.build.productName,'Thoughtline');
assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);assert.equal(pkg.build.win.signExecutable,false);
assert.deepEqual(pkg.build.win.target,[{target:'nsis',arch:['x64']}]);
assert.equal(pkg.build.win.icon,'assets/app-icon.ico');
for(const key of ['installerIcon','uninstallerIcon','installerHeaderIcon'])assert.equal(pkg.build.nsis[key],'assets/app-icon.ico');
const assetVerification=JSON.parse(fs.readFileSync('acceptance/evidence/icon-final/resource-verification.json','utf8'));
for(const [file,expected] of Object.entries(assetVerification.assets)){
 assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected.sha256,`${file}: approved asset mismatch`);
}
const hashes={};
const inputVector=sourceInputVector();assert.equal(inputVector.headSha,process.env.GITHUB_SHA);
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else hashes[file.replaceAll('\\','/')]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');}}
walk('out');walk('assets');
for(const file of ['package.json','package-lock.json','docs/delivery/Start-Thoughtline-Isolated.ps1'])hashes[file]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={headSha:process.env.GITHUB_SHA,actualWinBuildSource:inputVector.headSha,inputVector,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,ref:process.env.GITHUB_REF,version:pkg.version,node:process.version,arch:'x64',target:'nsis',signed:false,hashes,scope:'Windows hosted runner source build and NSIS package; physical acceptance remains separate',approvedAssetCommit:'9bc6ef45856090f5e74a4dac63b2a00639770178',approvedManifestCommit:'70c064981c2b26505e58a8dcc72d40e96839e3e6',physicalWindowsAcceptance:false,formalAcceptance:false};
fs.writeFileSync('dist/build-manifest.json',JSON.stringify(report,null,2)+'\n');
