import pathlib, subprocess, json, os, datetime
root=pathlib.Path.cwd()
evidence=root/'acceptance/evidence/round3'
receipt={'authorizedByUser':True,'scope':'Two accessibility display toggles only; actual package compositor test; restore original values in finally','before':None,'during':None,'after':None,'restored':False,'testPassed':False}
def native():
 return json.loads(subprocess.check_output(['/usr/bin/osascript','-l','JavaScript','-e','ObjC.import("AppKit"); JSON.stringify({reduceTransparency:$.NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceTransparency,increaseContrast:$.NSWorkspace.sharedWorkspace.accessibilityDisplayShouldIncreaseContrast})'],text=True))
def save():
 receipt['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 (evidence/'mac-native-material-authorized.json').write_text(json.dumps(receipt,indent=2)+'\n')
def toggle(value):
 script='''tell application "System Events" to tell process "System Settings"
 set elems to entire contents of window 1
 set toggled to 0
 repeat with targetName in {"增强对比度", "降低透明度"}
  repeat with el in elems
   if role of el is "AXCheckBox" and name of el is (contents of targetName) then
    if (value of el as integer) is not VALUE then click el
    set toggled to toggled + 1
    exit repeat
   end if
  end repeat
 end repeat
 if toggled is not 2 then error "Both authorized checkboxes must be identified"
 return toggled
end tell'''.replace('VALUE',str(value))
 subprocess.run(['/usr/bin/osascript','-e',script],check=True,text=True,capture_output=True)
receipt['before']=native();assert receipt['before']=={'reduceTransparency':True,'increaseContrast':True};save()
try:
 toggle(0);receipt['during']=native();save();assert receipt['during']=={'reduceTransparency':False,'increaseContrast':False}
 env=dict(os.environ);env['PATH']='/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:'+env['PATH'];env['THOUGHTLINE_EXECUTABLE']=str(root/'dist/mac-arm64/Thoughtline.app/Contents/MacOS/Thoughtline')
 code="const p=require('node:path');require('./tests/electron/packaged-launch.cjs').runPackagedFixture({worker:p.resolve('acceptance/evidence/round3/native-material-worker.cjs'),fixture:'native-material',out:p.resolve('acceptance/evidence/round3/mac-packaged/authorized-native-material-verified')}).then(r=>{console.log(JSON.stringify(r));if(!r.passed)process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});"
 with (evidence/'mac-authorized-native-material.log').open('w') as log:
  completed=subprocess.run(['node','-e',code],env=env,stdout=log,stderr=subprocess.STDOUT)
 receipt['testExitCode']=completed.returncode;receipt['testPassed']=completed.returncode==0;save()
finally:
 toggle(1);receipt['after']=native();receipt['restored']=receipt['after']==receipt['before'];save();assert receipt['restored'],'Original accessibility values not restored'
print(json.dumps(receipt))
assert receipt['testPassed'],'Actual native material test failed; original OS settings restored'
