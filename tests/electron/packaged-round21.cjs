// SPDX-License-Identifier: GPL-3.0-only
const path=require('node:path'),{runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture({worker:path.join(__dirname,'packaged-round21-worker.cjs'),fixture:'round-twenty-one'}).then(r=>{console.log(JSON.stringify(r));if(!r.passed)process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
