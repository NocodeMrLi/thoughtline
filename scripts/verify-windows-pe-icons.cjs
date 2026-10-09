// Read-only PE resource verification. Works on downloaded binaries as well as in Windows CI.
const fs=require('node:fs');const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');const ResEdit=require('resedit');
const digest=bytes=>createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const payload=icon=>icon.isRaw()?icon.bin:icon.generate();
function verify(executable,ico){
 const expected=ResEdit.Data.IconFile.from(fs.readFileSync(ico)).icons.map(item=>({width:item.data.width,height:item.data.height,sha256:digest(payload(item.data))}));
 const pe=ResEdit.NtExecutable.from(fs.readFileSync(executable));
 const resources=ResEdit.NtExecutableResource.from(pe);
 const groups=ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries).map(group=>({id:group.id,lang:group.lang,frames:group.getIconItemsFromEntries(resources.entries).map(icon=>({width:icon.width,height:icon.height,sha256:digest(payload(icon))}))}));
 const matching=groups.filter(group=>group.frames.length===expected.length&&expected.every(frame=>group.frames.some(actual=>actual.width===frame.width&&actual.height===frame.height&&actual.sha256===frame.sha256)));
 assert(matching.length>0,`${executable}: no PE icon group matches every approved ICO frame`);
 return {file:executable,executableSha256:digest(fs.readFileSync(executable)),expectedIco:ico,expectedIcoSha256:digest(fs.readFileSync(ico)),expectedFrames:expected,matchingGroups:matching,allGroups:groups,passed:true};
}
if(require.main===module){
 const [app,installer,uninstaller]=process.argv.slice(2);assert(app&&installer&&uninstaller);
 const report={headSha:process.env.GITHUB_SHA||null,scope:'Read-only embedded RT_GROUP_ICON/RT_ICON byte comparisons, not physical taskbar or Explorer cache acceptance',executables:[app,installer,uninstaller].map(file=>verify(file,'assets/app-icon.ico')),passed:true};
 fs.writeFileSync('dist/windows-pe-icons.json',JSON.stringify(report,null,2)+'\n');
}
module.exports={verify};
