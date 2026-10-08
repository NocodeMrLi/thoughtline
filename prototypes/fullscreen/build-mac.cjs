const {execFileSync}=require('node:child_process');const fs=require('node:fs'),path=require('node:path');
if(process.platform!=='darwin')throw new Error('Mac build requires macOS SDK');
const sdk=execFileSync('xcrun',['--show-sdk-path'],{encoding:'utf8'}).trim();
const compiler=execFileSync('xcrun',['--find','clang++'],{encoding:'utf8'}).trim();
const dir=__dirname;fs.mkdirSync(path.join(dir,'build'),{recursive:true});
for(const [input,output,extras] of [['selftest.cpp','fullscreen-selftest',[]],['mac.mm','fullscreen-probe',['-fobjc-arc','-framework','AppKit','-framework','CoreGraphics','-framework','Foundation']]]){
 execFileSync(compiler,['-isysroot',sdk,'-O2','-std=c++17',path.join(dir,input),...extras,'-o',path.join(dir,'build',output)],{stdio:'inherit'});
}
execFileSync(path.join(dir,'build/fullscreen-selftest'),[],{stdio:'inherit'});
console.log(JSON.stringify({sdk,compiler,scope:'local optimized Mac prototype build'}));
