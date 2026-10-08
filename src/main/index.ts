import {app,BrowserWindow,clipboard,globalShortcut,ipcMain,nativeImage,nativeTheme,powerMonitor,screen,Tray,Menu} from 'electron';
import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import {createShelf} from './windows/shelf';import {createComposer} from './windows/composer';import {createHost} from './platform/host';import {EdgeController} from './edgeController';
import {FileRepository} from './store/repository';import {newIdea} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';import type {PilotInfo,HitLayout} from '../shared/bridge';
app.setName('Thoughtline');
app.setPath('userData',process.env.THOUGHTLINE_DATA_DIR||join(app.getPath('appData'),'Thoughtline'));
let tray:Tray;let edge:EdgeController;let shelf:BrowserWindow;let composer:BrowserWindow;let quitting=false;
const invalid=<T>(message:string):Result<T>=>({ok:false,code:'INVALID',message});
async function loadView(w:BrowserWindow,view:string){
 w.on('page-title-updated',event=>event.preventDefault());
 w.webContents.on('will-navigate',event=>event.preventDefault());
 w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 if(process.env.ELECTRON_RENDERER_URL)await w.loadURL(process.env.ELECTRON_RENDERER_URL+'/?view='+view);
 else await w.loadFile(join(__dirname,'../renderer/index.html'),{query:{view}});
}
if(!app.requestSingleInstanceLock())app.quit();
else app.whenReady().then(async()=>{
 const repository=new FileRepository(app.getPath('userData'));const loaded=await repository.load();if(!loaded.ok)throw Error(loaded.message);
 let snapshot:Snapshot=loaded.value;let displayId=String(screen.getPrimaryDisplay().id);let width=screen.getPrimaryDisplay().bounds.width;let composerSession=0;
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);composer=createComposer(preload);const host=createHost(shelf,composer);
 const info=():PilotInfo=>({platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey)});
 const publish=()=>{for(const w of [shelf,composer])if(!w.isDestroyed())w.webContents.send('thoughtline:info-update',info());};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,w?:BrowserWindow)=>[...(w?[w]:[shelf,composer])].some(x=>x.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 edge=new EdgeController(host,(id,w)=>{displayId=id;width=w;shelf.setBounds({x:screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds.x,y:screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea.y,width:w,height:340});publish();});
 const openComposer=()=>{composerSession++;const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());edge.event({type:'lock',name:'composer',active:true,now:Date.now()});publish();host.showComposer({x:Math.round(d.workArea.x+(d.workArea.width-Math.min(530,d.workArea.width-40))/2),y:d.workArea.y+24,width:Math.min(530,d.workArea.width-40),height:Math.min(410,d.workArea.height-48)});};
 ipcMain.handle('thoughtline:info',e=>{if(!trusted(e))throw Error('不允许读取');return info();});
 ipcMain.on('thoughtline:hit-layout',(e,p:HitLayout)=>{if(!trusted(e,shelf)||!p||!Number.isSafeInteger(p.layoutRevision)||!Array.isArray(p.rects)||p.rects.length>64||typeof p.displayId!=='string')return;
  const valid=p.rects.every(r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=340);
  if(valid)edge.layout(p);
 });
 ipcMain.handle('thoughtline:copy',async(e,id:string):Promise<Result<void>>=>{
  if(!trusted(e,shelf)||typeof id!=='string')return invalid('无效操作');
  const text=snapshot.ideas.find(x=>x.id===id)?.text??(id.startsWith('pilot-')?'Thoughtline 窗口小样\n中文第二行\n第三行':null);
  if(text===null)return invalid('找不到正文');try{await clipboard.writeText(text);return {ok:true,value:undefined};}catch{return {ok:false,code:'IO',message:'复制失败，请保留正文。'};}
 });
 ipcMain.handle('thoughtline:submit',async(e,draft:Draft,revision:number):Promise<Result<Snapshot>>=>{
  if(!trusted(e,composer)||!draft||typeof draft.text!=='string'||typeof draft.title!=='string'||typeof draft.project!=='string'||typeof draft.agentId!=='string')return invalid('无效内容');
  const next=newIdea(snapshot,draft,randomUUID(),new Date().toISOString());if(!next.ok)return next;
  const committed=await repository.commit(next.value,revision);if(!committed.ok)return committed;
  snapshot=committed.value;host.closeComposer();edge.event({type:'lock',name:'composer',active:false,now:Date.now()});edge.event({type:'peek',now:Date.now()});publish();return committed;
 });
 ipcMain.handle('thoughtline:close',async(e,draft:Draft):Promise<Result<Snapshot>>=>{
  if(!trusted(e,composer))return invalid('无效操作');
  const saved=await repository.commit({...snapshot,draft},snapshot.revision);if(!saved.ok)return saved;
  snapshot=saved.value;host.closeComposer();edge.event({type:'lock',name:'composer',active:false,now:Date.now()});publish();return saved;
 });
 composer.on('close',event=>{if(!quitting)event.preventDefault();});
 await Promise.all([loadView(shelf,'shelf'),loadView(composer,'composer')]);
 const registered=globalShortcut.register(snapshot.settings.writeHotkey,openComposer);
 const icon=nativeImage.createFromDataURL('data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M1 5Q10 13 19 5" fill="none" stroke="black" stroke-width="1.5"/><rect x="8" y="8" width="4" height="8" rx="1" fill="black"/></svg>').toString('base64'));
 icon.setTemplateImage(true);tray=new Tray(icon);tray.setToolTip('晾念头 / Thoughtline');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'Thoughtline · 原生窗口小样',enabled:false},{label:`写作：${snapshot.settings.writeHotkey}${registered?'':'（注册失败）'}`,enabled:false},{type:'separator'},{label:'暂停悬停',type:'checkbox',click:item=>edge.pause(item.checked)},{label:'退出',click:()=>app.quit()}]));
 nativeTheme.on('updated',publish);powerMonitor.on('suspend',()=>edge.pause(true));powerMonitor.on('lock-screen',()=>edge.pause(true));powerMonitor.on('resume',()=>edge.pause(false));powerMonitor.on('unlock-screen',()=>edge.pause(false));
 screen.on('display-metrics-changed',()=>publish());app.dock?.hide();publish();edge.start();
}).catch(error=>{console.error(error);app.quit();});
app.on('before-quit',()=>{quitting=true;edge?.stop();globalShortcut.unregisterAll();});
app.on('window-all-closed',()=>{if(quitting)app.quit();});
