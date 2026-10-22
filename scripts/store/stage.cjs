// SPDX-License-Identifier: GPL-3.0-only
'use strict';
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');const {createHash}=require('node:crypto');
const {identity,storeVersion,manifest,ownedStage,assertSourceBinding}=require('./package-contract.cjs');
const root=fs.realpathSync(path.join(__dirname,'../..'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
function inventory(dir){const result={};function walk(current){for(const entry of fs.readdirSync(current,{withFileTypes:true})){const p=path.join(current,entry.name);if(entry.isSymbolicLink())throw Error('Symlink payload rejected');if(entry.isDirectory())walk(p);else if(entry.isFile())result[path.relative(dir,p).split(path.sep).join('/')]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');else throw Error('Non-regular payload');}}walk(dir);return Object.fromEntries(Object.entries(result).sort());}
function preflight(){
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Windows x64 build required');
 ownedStage(root,path.join(root,'dist/store/staging'));
 const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');assertSourceBinding(process.env.STORE_SOURCE_SHA,sha,process.env.STORE_SOURCE_TREE,tree);
 if(git('status','--porcelain','--untracked-files=no'))throw Error('Tracked source changed before packaging');
 return {sha,tree};
}
function prepare(){
 const {sha,tree}=preflight();
 const version=require('../../package.json').version;const stage=ownedStage(root,path.join(root,'dist/store/staging'));
 if(fs.existsSync(stage))throw Error('Existing stage: preserve previous evidence before another build');
 const unpacked=path.join(root,'dist/store/win-unpacked');const files=inventory(unpacked);
 const asar=require('@electron/asar'),archive=path.join(unpacked,'resources/app.asar');
 const compiled=inventory(path.join(root,'out'));
 for(const [name,sha256] of Object.entries(compiled)){const member=path.join('out',...name.split('/'));const bytes=asar.extractFile(archive,member);if(createHash('sha256').update(bytes).digest('hex')!==sha256)throw Error(`Compiled payload mismatch: ${name}`);}
 if(JSON.parse(asar.extractFile(archive,'package.json')).version!==version)throw Error('Packaged product version mismatch');
 const exe=fs.readFileSync(path.join(unpacked,'Thoughtline.exe'));if(exe.toString('ascii',0,2)!=='MZ'||exe.readUInt16LE(exe.readUInt32LE(0x3c)+4)!==0x8664)throw Error('Expected x64 PE executable');
 for(const file of Object.keys(files).filter(x=>x.endsWith('.node'))){const bytes=fs.readFileSync(path.join(unpacked,file));if(bytes.toString('ascii',0,2)!=='MZ')throw Error('Non-Windows native module in payload');}
 fs.mkdirSync(stage,{recursive:true});fs.cpSync(unpacked,path.join(stage,'app'),{recursive:true});fs.mkdirSync(path.join(stage,'Assets'));
 fs.writeFileSync(path.join(stage,'AppxManifest.xml'),manifest(version));
 const receipt={schema:1,sourceSha:sha,sourceTree:tree,productVersion:version,storeVersion:storeVersion(version),identity,architecture:'x64',electron:require('../../package.json').devDependencies.electron,filename:`Thoughtline-${version}-store-x64.msix`,payload:files,logoSourceSha256:createHash('sha256').update(fs.readFileSync(path.join(root,'assets/app-icon.png'))).digest('hex'),compiledOutputs:compiled,status:'staged-only'};
 fs.writeFileSync(path.join(root,'dist/store/build-inputs.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({sourceSha:sha,storeVersion:receipt.storeVersion,files:Object.keys(files).length}));
}
if(require.main===module){if(process.argv[2]==='preflight')console.log(JSON.stringify(preflight()));else if(process.argv[2]==='prepare')prepare();else throw Error('Expected preflight or prepare');}
module.exports={inventory};
