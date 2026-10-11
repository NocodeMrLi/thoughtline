const assert=require('node:assert/strict'),path=require('node:path');
const labels={zh:{more:'更多操作',top:'日历更多选项',trash:'最近删除',permanent:'永久删除当前念头'},en:{more:'More actions',top:'More calendar options',trash:'Recently deleted',permanent:'Permanently delete this thought'}};
function fixture(){
 const now=new Date().toISOString(),d=new Date(),day=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const base={agentId:'general',project:'',createdAt:now,updatedAt:now,createdDay:day,creationTimeZone:'legacy-offset'};
 return {schemaVersion:3,revision:0,ideas:[{...base,id:'menu-live',text:'菜单检查正文',title:'菜单检查',status:'hanging'},{...base,id:'menu-trash',text:'删除保护正文',title:'删除保护',status:'deleted',deletedAt:now,deletedFrom:'archived'}],clips:[{id:'menu-clip',agentId:'general',ideaIds:['menu-live'],currentId:'menu-live',position:null}],agents:[{id:'general',name:'通用',color:'#A0A3AA'}],draft:null,settings:{writeHotkey:'Control+Alt+F18',reducedMotion:false}};
}
async function checks(page,{kind,language,evidence}){
 const l=labels[language],isTop=kind==='calendar-top',anchor=page.getByRole('button',{name:isTop?l.top:l.more,exact:true}),menu=page.locator('.reader-more');
 const result={kind,language,checks:[]};
 const check=async(name,action)=>{try{result.checks.push({name,passed:true,detail:await action()});}catch(e){result.checks.push({name,passed:false,error:e.stack});await page.keyboard.press('Escape').catch(()=>{});await page.locator('.reader-more').evaluateAll(nodes=>nodes.forEach(n=>n.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})))).catch(()=>{});}};
 const open=async()=>{await anchor.click();await menu.waitFor();await page.waitForTimeout(130);};
 const gone=()=>menu.waitFor({state:'detached',timeout:1200});
 await check('compact-shared-rows',async()=>{
  await open();const measure=await menu.evaluate(e=>{const c=getComputedStyle(e),b=e.getBoundingClientRect();return {width:b.width,height:b.height,padding:c.padding,gap:c.gap,borderRadius:c.borderRadius,rows:[...e.querySelectorAll(':scope>button')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {height:r.height,font:s.fontSize,padding:s.padding,borderRadius:s.borderRadius};})};});
  assert.equal(measure.padding,'4px');assert.equal(measure.gap,'2px');assert.equal(measure.borderRadius,'9px');assert(measure.width<390,'natural menu must not fill the window');for(const row of measure.rows){assert.equal(row.height,32);assert.equal(row.font,'12px');assert.equal(row.padding,'6px 10px');assert.equal(row.borderRadius,'5px');}
  assert.equal(await page.locator('.icon-tooltip').count(),0);await page.screenshot({path:path.join(evidence,kind+'-'+language+'.png')});await page.keyboard.press('Escape');await gone();return measure;
 });
 await check('pointer-cross-gap-and-return-cancels-dismissal',async()=>{
  await open();const a=await anchor.boundingBox(),m=await menu.boundingBox();const gapY=isTop?(a.y+a.height+m.y)/2:(m.y+m.height+a.y)/2;
  await page.mouse.move(a.x+a.width/2,gapY);await page.waitForTimeout(230);assert.equal(await menu.count(),1,'crossing the anchor gap must not close');
  // Resolve the return point before starting the 180ms dismissal clock. Locator
  // hover adds stability/actionability waits and can arrive after the deadline
  // on a loaded runner, testing a late return rather than cancellation.
  const returnPoint=await menu.locator('button').first().boundingBox(),outsideY=await page.evaluate(()=>innerHeight)-1;assert(returnPoint);
  await page.mouse.move(1,outsideY);await page.waitForTimeout(70);await page.mouse.move(returnPoint.x+returnPoint.width/2,returnPoint.y+returnPoint.height/2);await page.waitForTimeout(230);assert.equal(await menu.count(),1,'return before delay cancels dismissal');
  await page.mouse.move(1,await page.evaluate(()=>innerHeight)-1);await gone();
 });
 await check('outside-click-and-escape-return-focus',async()=>{
  await open();await page.mouse.click(1,await page.evaluate(()=>innerHeight)-1);await gone();await open();await page.keyboard.press('Escape');await gone();assert(await anchor.evaluate(el=>el===document.activeElement));
 });
 await check('pointer-leaving-document-dismisses',async()=>{
  await open();await page.evaluate(()=>document.documentElement.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse',relatedTarget:null})));await gone();
 });
 await check('window-blur-dismisses',async()=>{await open();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await gone();});
 await check('keyboard-navigation-and-tab-dismissal',async()=>{
  await open();await page.keyboard.press('End');assert(await menu.locator('button').last().evaluate(el=>el===document.activeElement));await page.keyboard.press('Home');assert(await menu.locator('button').first().evaluate(el=>el===document.activeElement));await page.keyboard.press('Tab');await gone();
 });
 if(!isTop&&kind!=='expanded-bottom')await check('keyboard-opens-only-one-more-menu',async()=>{
  await open();const top=page.getByRole('button',{name:l.top,exact:true});await top.focus();await page.keyboard.press('Enter');await page.waitForTimeout(130);assert.equal(await menu.count(),1,'header and detail must not leave two menus open');assert(await menu.first().evaluate(el=>el.classList.contains('calendar-tools')));await page.keyboard.press('Escape');await gone();
 });
 if(kind==='trash-bottom')await check('permanent-delete-remains-protected',async()=>{
  await open();await page.getByRole('button',{name:l.permanent,exact:true}).click();await page.locator('.permanent-confirm').waitFor();await page.keyboard.press('Escape');await gone();const info=await page.evaluate(()=>window.thoughtline.info());assert.equal(info.snapshot.ideas.find(i=>i.id==='menu-trash').status,'deleted');
 });
 result.passed=result.checks.every(c=>c.passed);return result;
}
module.exports={fixture,checks,labels};
