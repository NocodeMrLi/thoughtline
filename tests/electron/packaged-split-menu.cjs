// Use a supervised, sanitized actual-package launch; retain fatal-launch evidence.
const path=require('node:path');
const {runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture({worker:path.join(__dirname,'packaged-split-worker.cjs'),fixture:'split'}).then(result=>{console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
