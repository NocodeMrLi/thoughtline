const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),os=require('node:os'),{execFileSync}=require('node:child_process');
const repo=process.cwd(),asar=require(path.join(repo,'node_modules/@electron/asar')),manifest=JSON.parse(fs.readFileSync('dist/mac-build-manifest.json'));
const mount='/tmp/thoughtline-r512-dmg-mount',app=path.join(mount,'Thoughtline.app'),archive=path.join(app,'Contents/Resources/app.asar'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[],receipt={source:manifest.actualMacBuildSource,mount,checks};
assert.equal(hash(fs.readFileSync(archive)),manifest.appAsarSha256);assert.equal(hash(fs.readFileSync('dist/Thoughtline-0.0.29-mac-arm64.dmg')),manifest.dmgSha256);
assert.deepEqual(require(path.join(repo,'scripts/source-input-vector.cjs')).sourceInputVector(),manifest.inputVector);
for(const [file,expected] of Object.entries(manifest.hashes)){
 const original=fs.readFileSync(file);assert.equal(hash(original),expected);
 const content=asar.extractFile(archive,file);
 if(file.endsWith('.node')){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'thoughtline-r5-native-replay-')),native=path.join(archive+'.unpacked',file),target=path.join(tmp,path.basename(file));
  fs.writeFileSync(target,original);const signature=execFileSync('/usr/bin/codesign',['-dv','--verbose=4',native],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  // codesign writes description to stderr; spawnSync captures it independently.
  const info=require('node:child_process').spawnSync('/usr/bin/codesign',['-dv','--verbose=4',native],{encoding:'utf8'});assert.equal(info.status,0);const identifier=info.stderr.match(/^Identifier=(.+)$/m)[1];
  execFileSync('/usr/bin/codesign',['--force','--sign','-','--identifier',identifier,target],{stdio:'pipe'});assert.equal(hash(fs.readFileSync(target)),hash(content));receipt.nativeReplay={identifier,original:expected,packaged:hash(content),exact:true};fs.rmSync(tmp,{recursive:true});
 }else assert.equal(hash(content),expected,file);
 checks.push(file);
}
execFileSync('/usr/bin/codesign',['--verify','--deep','--strict',app],{stdio:'pipe'});
Object.assign(receipt,{dmgSha256:manifest.dmgSha256,asarSha256:manifest.appAsarSha256,builtAndDmgSameAsar:true,inputVectorFrozen:true,passed:true});
fs.writeFileSync('acceptance/evidence/round5/final-v0.0.29/mac-package-binding.json',JSON.stringify(receipt,null,2));console.log('Mac binding passed',checks.length,receipt.source);
