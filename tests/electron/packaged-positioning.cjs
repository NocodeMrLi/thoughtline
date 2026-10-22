// SPDX-License-Identifier: GPL-3.0-only
const path=require('node:path'),{runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture({worker:path.join(__dirname,'packaged-positioning-worker.cjs'),fixture:'positioning'}).then(result=>{console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
