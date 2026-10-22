// SPDX-License-Identifier: GPL-3.0-only
// Keep a Mac-only notification addon out of a Windows cross-build, then restore it.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const native=path.resolve('out/main/notification-permission.node');
const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let holding,originalHash;
try {
 if(process.platform==='darwin'&&fs.existsSync(native)) {
  holding=fs.mkdtempSync(path.join(os.tmpdir(),'thoughtline-win-native-'));
  originalHash=digest(native);
  fs.renameSync(native,path.join(holding,'notification-permission.node'));
 }
 const result=spawnSync(process.execPath,['node_modules/electron-builder/cli.js','--win','nsis','--x64','--publish','never'],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Windows builder failed: '+result.status);
} catch(error) { console.error(error.stack||error);process.exitCode=1; }
finally {
 if(holding) {
  const saved=path.join(holding,'notification-permission.node');
  if(fs.existsSync(native))throw Error('Native output changed during Windows build; preserved recovery file at '+saved);
  if(digest(saved)!==originalHash)throw Error('Native recovery hash changed: '+saved);
  fs.renameSync(saved,native);fs.rmdirSync(holding);
  if(digest(native)!==originalHash)throw Error('Native restore failed');
 }
}
