const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {_electron}=require('playwright'),{launchOptions,warmViews,waitForInfo}=require('./window-fixture.cjs');const {cleanupIdleFixture}=require('./idle-fixture-cleanup.cjs');
const stage=['baseline','paper'].includes(process.argv[2])?process.argv[2]:'candidate';const output=path.resolve(stage==='baseline'?'acceptance/evidence/clamp-review/baseline':'acceptance/evidence/upright-paper-review/'+(stage==='paper'?'preview':'candidate'));
(async()=>{
 await fs.mkdir(output,{recursive:true});const scenes=[];
 for(const scale of (stage==='candidate'?[1,2]:[1])){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-clamp-review-'));let app,pids=[];
  try{
   const options=await launchOptions(dir);options.args.push('--force-device-scale-factor='+scale);app=await _electron.launch(options);const {shelf,composer}=await warmViews(app);
   const add=async(n,agentId)=>{const r=await composer.evaluate(async({n,agentId})=>{const i=await window.thoughtline.info();return window.thoughtline.submit({text:'只作视觉复验的中文假正文 '+n+'\n第二行😀',title:['检查交互细节','整理下一步','梳理产品思路'][Math.max(0,n-1)%3],agentId,project:''},i.snapshot.revision);},{n,agentId});assert(r.ok,r.message);return r.value.ideas.at(-1).id;};
   const seed=await add(0,'general'),i=await shelf.evaluate(()=>window.thoughtline.info());assert((await shelf.evaluate(({id,revision})=>window.thoughtline.setStatus(id,'archived',revision),{id:seed,revision:i.snapshot.revision})).ok);
   const shape=()=>shelf.locator('.rope > .rope-core').getAttribute('d');const fixed=await shape();let count=0;
   for(const requested of (stage==='candidate'?[0,3,24]:[3])){
    while(count<requested){count++;await add(count,['codex','claude','cursor'][(count-1)%3]);}
    const expected=stage==='baseline'?3:1+Math.floor(((await shelf.evaluate(()=>innerWidth))-160)/220);
    await shelf.waitForFunction(n=>document.querySelectorAll('.hanging').length===n,requested===0?0:Math.min(requested,expected));
    await waitForInfo(shelf,i=>!i.interactionLocked);await shelf.evaluate(()=>window.thoughtline.dragLock(true));
    await shelf.waitForFunction(()=>Number(document.querySelector('[data-view=shelf]').dataset.progress)===1);
    for(const theme of ['light','dark']){
     await app.evaluate(({nativeTheme},theme)=>{nativeTheme.themeSource=theme;},theme);await shelf.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
     await shelf.evaluate(theme=>{document.body.style.background=theme==='dark'?'#30343A':'#EAE8E0';},theme);
     const geometry=await shelf.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},rope:document.querySelector('.rope > .rope-core').getAttribute('d'),cards:[...document.querySelectorAll('.hanging')].map(el=>{const p=el.querySelector('.clothespin').getBoundingClientRect(),hit=el.querySelector('.peg-button').getBoundingClientRect(),paper=el.querySelector('.idea-card').getBoundingClientRect(),r=el.getBoundingClientRect();return {visual:{width:p.width,height:p.height,top:p.top,bottom:p.bottom},hit:{x:hit.x,y:hit.y,width:hit.width,height:hit.height},paper:{x:paper.x,y:paper.y,width:paper.width,height:paper.height},ropeCenter:r.y,frontOverlap:p.bottom-paper.top,ropeInPin:r.y-p.top,paperInPin:paper.top-p.top,rearArm:!!el.querySelector('[data-part=rear-arm]'),contactRope:!!el.querySelector('.clamp-rope'),frontArm:!!el.querySelector('[data-part=front-arm]')};})}));
     assert.equal(geometry.rope,fixed);assert.equal(await shelf.locator('nav').count(),0);
     for(const g of geometry.cards){for(const [value,want] of [[g.hit.width,24],[g.hit.height,44],[g.visual.width,18],[g.visual.height,38],[g.paper.width,stage==='baseline'?160:136],[g.paper.height,stage==='baseline'?112:188]])assert(Math.abs(value-want)<.01);
      if(stage!=='baseline'){assert(g.ropeInPin>=25&&g.ropeInPin<=29,'rope belongs in lower jaw');assert(g.paperInPin>=32&&g.paperInPin<=34,'paper enters same lower jaw');assert(g.frontOverlap>=4&&g.frontOverlap<=6);assert(g.rearArm&&g.frontArm&&g.contactRope);assert(g.hit.x>=0&&g.hit.y>=0);assert(g.paper.x>=0&&g.paper.x+g.paper.width<=geometry.viewport.width);}
     }
     const name=`${scale}x-${theme}-${requested}`,normal=path.join(output,name+'-overall.png');await shelf.screenshot({path:normal});
     let zoom=null,paperDetail=null;
     if(requested===3){const root=shelf.locator('[data-view=shelf]'),origin=await shelf.locator('.hanging').first().boundingBox();const before=await root.getAttribute('style');await root.evaluate((el,p)=>{el.style.transformOrigin='0 0';el.style.transform=`translate(${360-(p.x+68)*4}px,${110-p.y*4}px) scale(4)`;},origin);zoom=path.join(output,name+'-clamp-4x.png');await shelf.screenshot({path:zoom,clip:{x:0,y:0,width:720,height:340}});await root.evaluate((el,before)=>el.setAttribute('style',before),before);if(stage!=='baseline'){await root.evaluate((el,p)=>{el.style.transformOrigin='0 0';el.style.transform=`translate(${210-(p.x+68)*1.35}px,${50-p.y*1.35}px) scale(1.35)`;},origin);paperDetail=path.join(output,name+'-paper-detail.png');await shelf.screenshot({path:paperDetail,clip:{x:0,y:0,width:420,height:340}});await root.evaluate((el,before)=>el.setAttribute('style',before),before);}}
     const sha=async file=>crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');scenes.push({stage,scale,theme,seededHanging:requested,visible:geometry.cards.length,geometry,normal:{file:path.basename(normal),sha256:await sha(normal)},zoom:zoom?{file:path.basename(zoom),sha256:await sha(zoom),scope:'4x renderer transform inspection; not physical desktop scale'}:null,paperDetail:paperDetail?{file:path.basename(paperDetail),sha256:await sha(paperDetail),scope:'1.35x renderer detail showing entire upright paper, not physical desktop scaling'}:null});
    }
    await shelf.evaluate(()=>window.thoughtline.dragLock(false));
   }
  }finally{if(app){pids=await app.evaluate(({app})=>app.getAppMetrics().map(m=>m.pid));if(!pids.includes(app.process().pid))pids.push(app.process().pid);await app.close();}await cleanupIdleFixture(dir,pids);}
 }
 const report={stage,scope:'actual isolated source Electron renderer at forced DPR1/2; own neutral backdrop and 4x detail; visual review pending, not physical Windows',realShortcutRegistration:false,scenes,allOwnedProcessesExited:true,fakeDataRemoved:true};await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({stage,scenes:scenes.length,files:scenes.reduce((n,s)=>n+1+Number(!!s.zoom)+Number(!!s.paperDetail),0)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
