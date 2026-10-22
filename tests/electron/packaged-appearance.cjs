// SPDX-License-Identifier: GPL-3.0-only
// Supervisor survives a fatal Playwright launch worker and retains failure evidence.
const {runPackagedFixture}=require('./packaged-launch.cjs');
runPackagedFixture().then(result=>{console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});
