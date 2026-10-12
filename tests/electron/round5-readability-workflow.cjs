const {launchOptions,warmViews,openComposer}=require('./window-fixture.cjs');
const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR||'acceptance/evidence/round5/readability');await fs.mkdir(root,{recursive:true});
 const out=await fs.mkdtemp(path.join(root,'readability-')),profile=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-r5-readability-'));let app;
 const receipt={platform:process.platform,scenes:[],scope:'Actual native renderer; opaque text contrast measured, native translucent scenes visually reviewed separately. Not arbitrary desktop-background certification.'};
 try{
  app=await _electron.launch(await launchOptions(profile));const {shelf}=await warmViews(app),page=await openComposer(app,shelf);
  for(const locale of ['zh-CN','en']){await page.locator('[data-capsule=locale] button').nth(locale==='en'?1:0).click();
   for(const theme of ['light','dark']){await page.locator('[data-capsule=theme] button').nth(theme==='dark'?1:0).click();await page.waitForFunction(v=>document.documentElement.dataset.theme===v,theme);
    for(const state of ['empty','ready']){await page.locator('#idea-text').fill(state==='empty'?'':'清晰可读 Readable text');await page.waitForFunction(v=>document.querySelector('.composer-submit>.primary').disabled===v,state==='empty');
     const scene=await page.evaluate(()=>{
      const root=document.querySelector('.composer');root.dataset.material='opaque';
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
      const rgba=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
      const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
      const bg=rgba(getComputedStyle(root).backgroundColor),rows=[];
      for(const [selector,pseudo] of [['.composer-title','::placeholder'],['#idea-text',null],['#idea-text','::placeholder'],['.composer-submit>.primary',null],['.classification-trigger',null]]){
       const e=document.querySelector(selector),s=getComputedStyle(e,pseudo),base=getComputedStyle(e),f=rgba(s.color),b=rgba(base.backgroundColor);const surface=b.slice(0,3).map((v,i)=>v*b[3]+bg[i]*(1-b[3]));
       // The primary has a small white sheen; measure its brightest endpoint too.
       const sheen=base.backgroundImage!=='none'&&e.classList.contains('primary')&&!e.disabled?(document.documentElement.dataset.platform==='mac'?22:13)/255:0;
       const brightest=surface.map(v=>v*(1-sheen)+255*sheen);
       rows.push({selector,pseudo,color:s.color,background:base.backgroundColor,opacity:Number(base.opacity),font:s.fontFamily,ratio:Math.min(ratio(f,surface),ratio(f,brightest))});
      }
      return {rows};
     });
     Object.assign(scene,{locale,theme,state});receipt.scenes.push(scene);
     for(const row of scene.rows){assert.equal(row.opacity,1,'Readable controls cannot fade their text: '+JSON.stringify({locale,theme,state,...row}));assert(row.ratio>=4.5,'Text contrast below 4.5:1: '+JSON.stringify({locale,theme,state,...row}));}
     await page.screenshot({path:path.join(out,`${locale}-${theme}-${state}-opaque.png`)});
     await page.evaluate(v=>document.querySelector('.composer').dataset.material=v,process.platform==='darwin'?'vibrancy':'acrylic');
     await page.screenshot({path:path.join(out,`${locale}-${theme}-${state}-native.png`)});
    }
   }
  }
  receipt.passed=true;
 }catch(e){receipt.passed=false;receipt.failure=e.stack;}
 finally{if(app){receipt.pids=[app.process().pid,...await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid))];await app.close();await cleanupIdleFixture(profile,receipt.pids);receipt.normalQuit=true;receipt.profileRemoved=true;}else await fs.rm(profile,{recursive:true,force:true});await fs.writeFile(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({out,...receipt}));if(!receipt.passed)process.exitCode=1;}
})();
