const path=require('node:path'),{runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture({worker:path.join(__dirname,'packaged-capacity-worker.cjs'),fixture:'capacity'}).then(result=>{console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
