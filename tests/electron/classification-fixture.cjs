const assert=require('node:assert/strict');
async function openTagPicker(page){await page.locator('.classification-trigger').nth(1).click();const panel=page.locator('.classification-picker');await panel.locator('.classification-choices').waitFor();return panel;}
async function chooseTag(page,name){const panel=await openTagPicker(page);await panel.getByRole('button',{name,exact:true}).click();await panel.waitFor({state:'detached'});}
async function managerPage(app){const deadline=Date.now()+10000;while(Date.now()<deadline){const page=(await app.windows()).find(p=>p.url().includes('view=manage'));if(page)return page;await new Promise(r=>setTimeout(r,25));}throw Error('Management view did not load');}
async function writePage(app,shelf){assert((await shelf.evaluate(()=>window.thoughtline.openComposer())).ok);let page;const deadline=Date.now()+10000;while(!page&&Date.now()<deadline){page=(await app.windows()).find(p=>p.url().includes('view=composer'));if(!page)await new Promise(r=>setTimeout(r,25));}if(!page)throw Error('Composer view did not load');await page.waitForSelector('#idea-text');return page;}
module.exports={openTagPicker,chooseTag,managerPage,writePage};
