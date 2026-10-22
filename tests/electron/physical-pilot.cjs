// SPDX-License-Identifier: GPL-3.0-only
// Manual native test fixture; no helper windows ship in the product.
const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os');
const {_electron}=require(process.env.THOUGHTLINE_PLAYWRIGHT_PACKAGE||'playwright');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'thoughtline-physical-'));
 let app;let timer;
 try{
 app=await _electron.launch({executablePath:require('electron'),args:[path.resolve('out/main/index.js')],env:{...process.env,THOUGHTLINE_DATA_DIR:dir}});
 await app.firstWindow();
 await app.evaluate(async({BrowserWindow,screen})=>{
  const d=screen.getPrimaryDisplay();
  const w=new BrowserWindow({title:'Thoughtline Native Test Target',x:d.bounds.x,y:d.workArea.y,width:d.bounds.width,height:460,webPreferences:{nodeIntegration:false,contextIsolation:true},show:true});
  w.on('page-title-updated',e=>e.preventDefault());
  await w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<html lang="zh-CN"><body style="margin:0;background:#edeef1;font-family:system-ui"><p style="position:absolute;top:310px;left:24px">Thoughtline原生测试靶窗：顶部空白点击次数 <b id="count">0</b></p><textarea autofocus id="input" style="position:absolute;top:350px;left:24px;width:500px;height:60px">焦点测试</textarea><script>document.body.addEventListener("mousedown",()=>{document.querySelector("#count").textContent=String(Number(document.querySelector("#count").textContent)+1)})</script></body></html>'));
  w.focus();
 });
 const snapshot=async()=>{
  const data=await app.evaluate(async({BrowserWindow,screen})=>({cursor:screen.getCursorScreenPoint(),windows:await Promise.all(BrowserWindow.getAllWindows().map(async w=>({title:w.getTitle(),bounds:w.getBounds(),visible:w.isVisible(),focused:w.isFocused(),state:await w.webContents.executeJavaScript('({count:document.querySelector("#count")?.textContent,input:document.querySelector("#input")?.value,active:document.activeElement?.id,view:document.querySelector("[data-view]")?.dataset.view})')})))}));
  await fs.writeFile('acceptance/evidence/native-physical-live.json',JSON.stringify(data,null,2));
 };
 timer=setInterval(()=>snapshot().catch(console.error),1000);await snapshot();
 console.log('Native test target ready; physical OS interactions required.');
 let stopping=false;
 const stop=async()=>{if(stopping)return;stopping=true;clearInterval(timer);await snapshot().catch(()=>{});await app.close().catch(()=>{});await fs.rm(dir,{recursive:true,force:true});process.exit(0);};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
 await new Promise(()=>{});
 }finally{if(timer)clearInterval(timer);if(app)await app.close().catch(()=>{});await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
