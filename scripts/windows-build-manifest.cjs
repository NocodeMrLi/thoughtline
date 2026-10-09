const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');const pkg=require('../package.json');
assert.equal(process.platform,'win32');assert.equal(process.env.GITHUB_ACTIONS,'true');
assert.equal(pkg.version,JSON.parse(fs.readFileSync('package-lock.json','utf8')).version);
assert.equal(pkg.build.appId,'com.nocodemrli.thoughtline');assert.equal(pkg.build.productName,'Thoughtline');
assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);assert.equal(pkg.build.win.signExecutable,false);
assert.deepEqual(pkg.build.win.target,[{target:'nsis',arch:['x64']}]);
const hashes={};
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else hashes[file.replaceAll('\\','/')]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');}}
walk('out');walk('assets');
for(const file of ['package.json','package-lock.json','docs/delivery/Start-Thoughtline-Isolated.ps1'])hashes[file]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={headSha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,runAttempt:process.env.GITHUB_RUN_ATTEMPT,ref:process.env.GITHUB_REF,version:pkg.version,node:process.version,arch:'x64',target:'nsis',signed:false,hashes,scope:process.env.GITHUB_REF?.includes('thoughtline-windows-preflight-')?'FUNCTIONAL PREFLIGHT WITH EXISTING ICON; v11 NOT INTEGRATED; NOT FINAL DELIVERY':'Packaging and installer preflight; physical acceptance remains separate',physicalWindowsAcceptance:false,formalAcceptance:false};
fs.writeFileSync('dist/build-manifest.json',JSON.stringify(report,null,2)+'\n');
