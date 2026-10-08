import {app,BrowserWindow,clipboard,globalShortcut,ipcMain,nativeImage,nativeTheme,powerMonitor,screen,Tray,Menu} from 'electron';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createShelf} from './windows/shelf';
import {createComposer} from './windows/composer';
import {createManage} from './windows/manage';
import {createHost} from './platform/host';
import {EdgeController} from './edgeController';
import {FileRepository} from './store/repository';
import {newIdea,editIdea,changeStatus,addAgent,updateAgent,removeAgent} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';
import type {PilotInfo,HitLayout,ComposerContext,AgentMutation} from '../shared/bridge';
app.setName('Thoughtline');
app.setPath('userData',process.env.THOUGHTLINE_DATA_DIR||join(app.getPath('appData'),'Thoughtline'));
let tray:Tray;let edge:EdgeController;let shelf:BrowserWindow;let composer:BrowserWindow;let manage:BrowserWindow;let quitting=false;
const blank:Draft={text:'',title:'',project:'',agentId:'general'};
const invalid=<T>(message:string):Result<T>=>({ok:false,code:'INVALID',message});
const done=():Result<void>=>({ok:true,value:undefined});
const draftShape=(d:unknown):d is Draft=>!!d&&typeof d==='object'&&['text','title','project','agentId'].every(k=>typeof (d as Record<string,unknown>)[k]==='string');
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
 let snapshot:Snapshot=loaded.value;let displayId=String(screen.getPrimaryDisplay().id);let width=screen.getPrimaryDisplay().bounds.width;
 let composerSession=0,manageSession=0,manageSelection:string|null=null,editRevision=snapshot.revision;
 let composerContext:ComposerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);composer=createComposer(preload);manage=createManage(preload);
 const host=createHost(shelf,composer);
 const info=():PilotInfo=>({platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,composerContext,manageSession,manageSelection,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey),...edge.presentation()});
 const publish=()=>{for(const w of [shelf,composer,manage])if(!w.isDestroyed())w.webContents.send('thoughtline:info-update',info());};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,allowed:BrowserWindow[]=[shelf,composer,manage])=>allowed.some(w=>w.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 const lock=(name:string,active:boolean)=>edge.event({type:'lock',name,active,now:Date.now()});
 const hideManage=()=>{manage.hide();lock('manage',false);};
 const boundsFor=(w:number,h:number)=>{const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const width=Math.min(w,d.workArea.width-40),height=Math.min(h,d.workArea.height-48);return {x:Math.round(d.workArea.x+(d.workArea.width-width)/2),y:d.workArea.y+24,width,height};};
 edge=new EdgeController(host,(id,w)=>{displayId=id;width=w;publish();},publish);
 const openComposer=(ideaId?:string):Result<void>=>{
  if(composer.isVisible()){
   composer.show();composer.focus();return ideaId?invalid('请先保存或取消当前编辑。'):done();
  }
  const idea=ideaId?snapshot.ideas.find(x=>x.id===ideaId):null;
  if(ideaId&&!idea)return invalid('找不到这条念头。');
  composerContext=idea?{mode:'edit',ideaId:idea.id,draft:{text:idea.text,title:idea.title,project:idea.project,agentId:idea.agentId}}:{mode:'new',ideaId:null,draft:snapshot.draft??blank};
  editRevision=snapshot.revision;composerSession++;lock('composer',true);hideManage();publish();host.showComposer(boundsFor(530,440));return done();
 };
 const save=async(next:Result<Snapshot>,revision:number):Promise<Result<Snapshot>>=>{
  if(!next.ok)return next;const r=await repository.commit(next.value,revision);
  if(r.ok){snapshot=r.value;publish();}return r;
 };
 ipcMain.handle('thoughtline:info',e=>{if(!trusted(e))throw Error('不允许读取');return info();});
 ipcMain.on('thoughtline:hit-layout',(e,p:HitLayout)=>{
  if(!trusted(e,[shelf])||!p||!Number.isSafeInteger(p.layoutRevision)||!Array.isArray(p.rects)||p.rects.length>64||typeof p.displayId!=='string')return;
  if(p.rects.every(r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=340))edge.layout(p);
 });
 ipcMain.handle('thoughtline:copy',async(e,id:string):Promise<Result<void>>=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string')return invalid('无效操作');
  const idea=snapshot.ideas.find(x=>x.id===id);if(!idea)return invalid('找不到正文');
  try{await clipboard.writeText(idea.text);return done();}catch{return {ok:false,code:'IO',message:'复制失败，请在全文中手动选中复制。'};}
 });
 ipcMain.handle('thoughtline:submit',async(e,draft:Draft,revision:number):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid('无效内容');
  if(composerContext.mode==='edit'&&revision!==editRevision)return {ok:false,code:'CONFLICT',message:'记录已变化，请保留文字，重新打开后核对。'};
  const now=new Date().toISOString();
  const next=composerContext.mode==='edit'?editIdea(snapshot,composerContext.ideaId!,draft,now):newIdea(snapshot,draft,randomUUID(),now);
  const committed=await save(next,revision);if(!committed.ok)return committed;
  host.closeComposer();lock('composer',false);edge.event({type:'peek',now:Date.now()});publish();return committed;
 });
 ipcMain.handle('thoughtline:close',async(e,draft:Draft):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid('无效操作');
  if(composerContext.mode==='edit'){host.closeComposer();lock('composer',false);return {ok:true,value:snapshot};}
  const saved=await save({ok:true,value:{...snapshot,draft}},snapshot.revision);if(!saved.ok)return saved;
  host.closeComposer();lock('composer',false);return saved;
 });
 ipcMain.handle('thoughtline:open-manage',(e,id?:string):Result<void>=>{
  if(!trusted(e)||id!==undefined&&typeof id!=='string')return invalid('无效操作');
  if(composer.isVisible())return invalid('请先保存或取消当前输入。');
  if(id&&!snapshot.ideas.some(x=>x.id===id))return invalid('找不到这条念头。');
  manageSelection=id??null;manageSession++;lock('manage',true);publish();manage.setBounds(boundsFor(740,540));manage.show();manage.focus();return done();
 });
 ipcMain.handle('thoughtline:close-manage',e=>{if(!trusted(e,[manage]))return invalid('无效操作');hideManage();return done();});
 ipcMain.handle('thoughtline:open-edit',(e,id:string)=>trusted(e,[shelf,manage])&&typeof id==='string'?openComposer(id):invalid('无效操作'));
 ipcMain.handle('thoughtline:status',async(e,id:string,status:'hanging'|'archived',revision:number)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||!['hanging','archived'].includes(status))return invalid('无效操作');
  const r=await save(changeStatus(snapshot,id,status,new Date().toISOString()),revision);
  if(r.ok)edge.event({type:'peek',now:Date.now()});return r;
 });
 ipcMain.handle('thoughtline:agent',async(e,c:AgentMutation,revision:number)=>{
  if(!trusted(e,[manage])||!c||typeof c!=='object')return invalid('无效操作');
  let next:Result<Snapshot>;
  if(c.kind==='add'&&typeof c.name==='string'&&typeof c.color==='string')next=addAgent(snapshot,{id:randomUUID(),name:c.name.trim(),color:c.color});
  else if(c.kind==='update'&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.color==='string')next=updateAgent(snapshot,c.id,{name:c.name.trim(),color:c.color});
  else if(c.kind==='remove'&&typeof c.id==='string'&&typeof c.replacement==='string')next=removeAgent(snapshot,c.id,c.replacement);
  else return invalid('Agent内容无效');
  return save(next,revision);
 });
 for(const w of [composer,manage])w.on('close',event=>{if(!quitting)event.preventDefault();});
 await Promise.all([loadView(shelf,'shelf'),loadView(composer,'composer'),loadView(manage,'manage')]);
 const registered=globalShortcut.register(snapshot.settings.writeHotkey,()=>{openComposer();});
 const icon=nativeImage.createFromPath(join(__dirname,'../../assets/'+(process.platform==='darwin'?'trayTemplate.png':'app-icon.png'))).resize({width:22,height:22});
 if(icon.isEmpty())throw Error('Thoughtline tray icon failed to load.');
 if(process.platform==='darwin')icon.setTemplateImage(true);tray=new Tray(icon);tray.setToolTip('晾念头 / Thoughtline');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'晾念头 / Thoughtline',enabled:false},{label:`写念头：${snapshot.settings.writeHotkey}${registered?'':'（注册失败）'}`,enabled:false},{type:'separator'},{label:'暂停悬停',type:'checkbox',click:item=>edge.pause(item.checked)},{label:'退出',click:()=>app.quit()}]));
 nativeTheme.on('updated',publish);powerMonitor.on('suspend',()=>edge.pause(true));powerMonitor.on('lock-screen',()=>edge.pause(true));powerMonitor.on('resume',()=>edge.pause(false));powerMonitor.on('unlock-screen',()=>edge.pause(false));
 screen.on('display-metrics-changed',()=>publish());app.dock?.hide();publish();edge.start();
}).catch(error=>{console.error(error);app.quit();});
app.on('before-quit',()=>{quitting=true;edge?.stop();globalShortcut.unregisterAll();});
app.on('window-all-closed',()=>{if(quitting)app.quit();});
