const fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
async function bindAppearanceSource(output){
 const include=p=>/^(src|assets|scripts|tests|licenses|\.github|docs\/delivery)\//.test(p)||/^(package.*\.json|electron\.vite\.config\.ts|tsconfig.*\.json|vitest\.config\..*|\.gitignore)$/.test(p);
 const tracked=execFileSync('git',['ls-files','-z']).toString().split('\0').filter(include),untracked=execFileSync('git',['ls-files','--others','--exclude-standard','-z']).toString().split('\0').filter(include);const hashes={};
 for(const p of [...new Set([...tracked,...untracked])].sort()){const raw=await fs.readFile(p);hashes[p]=createHash('sha256').update(raw).digest('hex');}
 await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'source-inputs.json'),JSON.stringify({base:execFileSync('git',['rev-parse','HEAD']).toString().trim(),node:process.version,files:hashes},null,2));await fs.writeFile(path.join(output,'tracked-source.patch'),execFileSync('git',['diff','--binary','HEAD','--',...tracked],{maxBuffer:20*1024*1024}));
 for(const p of untracked){const dest=path.join(output,'new-source',p);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(p,dest);}
}
module.exports={bindAppearanceSource};
