const path=require('node:path'),{runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture({worker:path.join(__dirname,'packaged-positioning-worker.cjs'),fixture:'positioning'}).catch(e=>{console.error(e);process.exitCode=1;});
