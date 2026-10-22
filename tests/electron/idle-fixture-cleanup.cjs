// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs/promises');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function processAlive(pid){try{process.kill(pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}}
async function cleanupIdleFixture(dir,pids,{alive=processAlive,sleep=delay,attempts=20}={}){
 for(let attempt=0;attempt<=attempts;attempt++){
  const remaining=[...new Set(pids)].filter(alive);
  if(!remaining.length){await fs.rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});return;}
  if(attempt===attempts)throw Error(`Idle fixture processes still present (${remaining.join(', ')}); kept fixture: ${dir}`);
  await sleep(250);
 }
}
module.exports={cleanupIdleFixture};
