const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo='/Users/lihongwei/Desktop/晾念头 : Thoughtline/app',clone=fs.readFileSync(path.join(repo,'.superpowers/sdd/Thoughtline第二轮修复优化/package-source-path.txt'),'utf8').trim(),delivery='/Users/lihongwei/Documents/Codex/2026-10-10/thoughtline-round2-repair/delivery/v0.0.17-preview.5';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),m=JSON.parse(fs.readFileSync(path.join(delivery,'mac-build-manifest.json'))),w=JSON.parse(fs.readFileSync(path.join(delivery,'windows-build-manifest.json'))),expected='60453773034347e1b49ccfd5d1cd42657e9ac60c';
assert.equal(m.actualMacBuildSource,expected);assert.equal(w.actualWinBuildSource,expected);assert.equal(w.runId,'38018943609');assert.equal(m.version,'0.0.17-preview.5');assert.equal(w.version,m.version);assert.equal(m.inputVector.vectorSha256,w.inputVector.vectorSha256);assert.deepEqual(Object.keys(m.inputVector.files),Object.keys(w.inputVector.files));
const differences=[];
for(const [file,entry] of Object.entries(m.inputVector.files)){
 const other=w.inputVector.files[file];assert.equal(entry.mode,other.mode,file);assert.equal(entry.blob,other.blob,file);
 const bytes=fs.readFileSync(path.join(clone,file));assert.equal(sha(bytes),entry.sha256,file);
 if(entry.sha256!==other.sha256){assert(!bytes.includes(0),'Binary source input differs: '+file);const converted=Buffer.from(bytes.toString('utf8').replace(/\r?\n/g,'\r\n'));assert.equal(sha(converted),other.sha256,'Not an exact CRLF conversion: '+file);differences.push(file);}
}
const asar=require('@electron/asar'),appAsar=path.join(clone,'dist/mac-arm64/Thoughtline.app/Contents/Resources/app.asar'),verifiedMac=[];
for(const [file,hash] of Object.entries(m.hashes)){assert.equal(sha(asar.extractFile(appAsar,file)),hash,'Mac packed file mismatch: '+file);verifiedMac.push(file);}
const common=[];for(const file of Object.keys(m.hashes)){if(w.hashes[file]===m.hashes[file])common.push(file);}
assert(common.includes('out/main/index.js'));assert(common.includes('out/preload/index.js'));for(const f of Object.keys(m.hashes).filter(f=>f.startsWith('assets/')))assert(common.includes(f),f);
const cssMac=Object.keys(m.hashes).find(f=>f.endsWith('.css')),cssWin=Object.keys(w.hashes).find(f=>f.endsWith('.css')),jsMac=Object.keys(m.hashes).find(f=>f.startsWith('out/renderer/assets/')&&f.endsWith('.js')),jsWin=Object.keys(w.hashes).find(f=>f.startsWith('out/renderer/assets/')&&f.endsWith('.js'));
assert.equal(m.hashes[jsMac],w.hashes[jsWin]);
const css=fs.readFileSync(path.join(clone,cssMac),'utf8');assert.equal(sha(Buffer.from(css.replace(/\r?\n/g,'\r\n'))),w.hashes[cssWin]);
const html=fs.readFileSync(path.join(clone,'out/renderer/index.html'),'utf8').replace(path.basename(cssMac),path.basename(cssWin)).replace(path.basename(jsMac),path.basename(jsWin)).replace(/\n$/,'\r\n');assert.equal(sha(Buffer.from(html)),w.hashes['out/renderer/index.html']);
const installed=JSON.parse(fs.readFileSync(path.join(delivery,'windows-installed-preflight.json')));assert(installed.passed);assert(installed.checks.packagedOutputsMatchBuild);assert.equal(installed.version,m.version);
const report={source:expected,windowsRun:w.runId,count:m.inputVector.count,canonicalVectorSha256:m.inputVector.vectorSha256,canonicalMatch:true,rawDifferencesAreVerifiedCRLFOnly:true,sourceCRLFDifferences:differences,mainPreloadRendererJSAndBrandAssetsMatch:true,WindowsInstallerPayloadVerified:true,MacAsarInputsVerified:verifiedMac.length,cssDifferenceOnlyCRLF:true,htmlDifferenceOnlyCRLFAndDerivedAssetNames:true,commonOutputHashes:common,macAsarSha256:sha(fs.readFileSync(appAsar)),physicalWindowsAcceptance:false,userAcceptancePassed:false};
fs.writeFileSync(path.join(delivery,'source-pair-proof.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({count:report.count,source:expected,CRLFInputs:differences.length,MacAsarInputs:verifiedMac.length,commonOutputs:common.length,passed:true}));
