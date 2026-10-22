// SPDX-License-Identifier: GPL-3.0-only
// Test-only observer: arm before input so runner RPC latency cannot consume the
// real short animation before geometry/pixel assertions. Product timing is unchanged.
async function sampleCalendarMotion(page, action) {
 await page.evaluate(()=>{
  const before=document.querySelector('[data-calendar-motion]');
  window.__calendarSampler?.disconnect();window.__calendarSampleSeen=false;
  const observer=new MutationObserver(()=>{
   const layer=document.querySelector('[data-calendar-motion]');if(!layer||layer===before)return;
   for(const animation of document.getAnimations()){animation.pause();animation.currentTime=0;}
   window.__calendarSampleSeen=true;observer.disconnect();
  });
  window.__calendarSampler=observer;observer.observe(document.body,{childList:true,subtree:true});
 });
 try {
  await action();
  await page.waitForFunction(()=>window.__calendarSampleSeen,null,{timeout:5000});
  if(process.env.THOUGHTLINE_MOTION_SAMPLE_DELAY)await new Promise(resolve=>setTimeout(resolve,Number(process.env.THOUGHTLINE_MOTION_SAMPLE_DELAY)));
 } finally {await page.evaluate(()=>window.__calendarSampler?.disconnect());}
}
async function resumeCalendarMotion(page) {
 await page.evaluate(()=>{for(const animation of document.getAnimations())if(animation.playState==='paused')animation.play();});
}
module.exports={sampleCalendarMotion,resumeCalendarMotion};
