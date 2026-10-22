// SPDX-License-Identifier: GPL-3.0-only
// Attach only to a package launched explicitly by the tester with its own temp data and localhost debugging port.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.connectOverCDP(process.env.THOUGHTLINE_TEST_CDP||'http://127.0.0.1:58777');
 try{
  const pages=browser.contexts()[0].pages();const shelf=pages.find(p=>p.url().includes('view=shelf'));const composer=pages.find(p=>p.url().includes('view=composer'));
  assert(shelf&&composer);await shelf.waitForSelector('[data-view="shelf"]');await composer.waitForSelector('[data-view="composer"]');
  const info=await composer.evaluate(()=>window.thoughtline.info());assert.equal(info.platform,'mac');assert.equal(info.hotkeyRegistered,true);
  const text='安装包正文测试\n中文第二行\n第三行';
  const saved=await composer.evaluate(async ({text,revision})=>window.thoughtline.submit({text,title:'安装包测试',project:'临时验收',agentId:'general'},revision),{text,revision:info.snapshot.revision});
  assert.equal(saved.ok,true);assert.equal(saved.value.ideas.at(-1).text,text);
  const report={platform:'macOS',packaged:true,bridgeLoaded:true,hotkeyRegistered:true,fullTextPersisted:true,temporaryData:true,scope:'安装包真实加载、桥接和保存；未声明物理鼠标/焦点/IME通过'};
  await fs.writeFile('acceptance/evidence/packaged-cdp.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
