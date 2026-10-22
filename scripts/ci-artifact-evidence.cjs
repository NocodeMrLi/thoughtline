// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function inventory(root){
 const found={};
 function walk(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(item.isFile())found[path.relative(root,file).split(path.sep).join('/')]=hash(file);}}
 walk(root);return found;
}
function snapshot(root,baseline){fs.writeFileSync(baseline,JSON.stringify({schema:1,files:inventory(root)}));}
function collect(root,baseline,destination,context={}){
 const before=JSON.parse(fs.readFileSync(baseline,'utf8'));if(before.schema!==1||!before.files)throw Error('Missing evidence baseline');
 const after=inventory(root),files=[];fs.mkdirSync(destination,{recursive:true});
 for(const [name,sha256] of Object.entries(after)){if(before.files[name]===sha256)continue;const source=path.join(root,name),target=path.join(destination,'evidence',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);files.push({path:name,sha256,bytes:fs.statSync(target).size});}
 const result={schema:1,...context,files,bytes:files.reduce((n,f)=>n+f.bytes,0),unchangedHistoricalFiles:Object.keys(after).length-files.length};
 fs.writeFileSync(path.join(destination,'index.json'),JSON.stringify(result,null,2));return result;
}
module.exports={inventory,snapshot,collect};
if(require.main===module){const root=path.resolve('acceptance/evidence'),baseline=path.resolve('.ci-evidence-baseline.json');if(process.argv[2]==='snapshot')snapshot(root,baseline);else if(process.argv[2]==='collect')console.log(JSON.stringify(collect(root,baseline,path.resolve('dist/ci-evidence'),{sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT})));else throw Error('Use snapshot or collect');}
