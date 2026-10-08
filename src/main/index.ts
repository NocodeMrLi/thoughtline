import {app,BrowserWindow,dialog,shell,clipboard,globalShortcut,ipcMain,nativeImage,nativeTheme,powerMonitor,screen,Tray,Menu} from 'electron';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createShelf} from './windows/shelf';
import {createComposer} from './windows/composer';
import {createManage} from './windows/manage';
import {createHost} from './platform/host';
import {EdgeController} from './edgeController';
import {loadWithRecovery} from './store/repository';
import {swapShortcut} from './shortcuts';
import {validWriteHotkey} from '../shared/composerKeys';
import {newIdea,editIdea,changeStatus,addAgent,updateAgent,removeAgent} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';
import type {PilotInfo,HitLayout,ComposerContext,AgentMutation,ClipMutation} from '../shared/bridge';
import {mergeClips,splitClip,moveClip,selectClipIdea} from '../shared/clipCommands';
import {layoutClips,normalizedPosition} from '../shared/clipLayout';
app.setName('Thoughtline');
app.setPath('userData',process.env.THOUGHTLINE_DATA_DIR||join(app.getPath('appData'),'Thoughtline'));
let prepareQuit:(()=>Promise<boolean>)|null=null;let quitInFlight=false;
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
 const dataDir=app.getPath('userData');
 const loaded=await loadWithRecovery(dataDir,async error=>{
  const {response}=await dialog.showMessageBox({type:'error',title:'晾念头：数据读取未成功',message:'念头数据暂时无法读取',detail:`${error.message}\n\n原文件仍保留。可以打开数据目录备份并修复，之后重试。\n数据目录：${dataDir}`,buttons:['打开数据文件夹','重试读取','退出'],defaultId:1,cancelId:2,noLink:true});
  return response===0?'folder':response===1?'retry':'exit';
 },async()=>{const error=await shell.openPath(dataDir);if(error)dialog.showErrorBox('无法打开数据目录',error);});
 if(!loaded){app.quit();return;}const repository=loaded.repository;
 let snapshot:Snapshot=loaded.snapshot;let displayId=String(screen.getPrimaryDisplay().id);let width=screen.getPrimaryDisplay().bounds.width;
 let composerSession=0,manageSession=0,manageSelection:string|null=null,editRevision=snapshot.revision;
 let dragCancelSession=0,dragEscape=false;
 let settingsBusy=false;let refreshTray=()=>{};
 let manageMode:'browse'|'detail'|'settings'='browse',manageTitles=false;let undoClips:{snapshot:Snapshot;revision:number}|null=null;
 let composerContext:ComposerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);composer=createComposer(preload);manage=createManage(preload);
 const host=createHost(shelf,composer);
 const info=():PilotInfo=>({platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,composerContext,manageSession,manageSelection,manageMode,manageTitles,canUndoClips:!!undoClips,dragCancelSession,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey),...edge.presentation()});
 const publish=()=>{for(const w of [shelf,composer,manage])if(!w.isDestroyed())w.webContents.send('thoughtline:info-update',info());};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,allowed:BrowserWindow[]=[shelf,composer,manage])=>allowed.some(w=>w.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 const lock=(name:string,active:boolean)=>edge.event({type:'lock',name,active,now:Date.now()});
 const hideManage=()=>{manage.hide();lock('manage',false);};
 const boundsFor=(w:number,h:number)=>{const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const width=Math.min(w,d.workArea.width-40),height=Math.min(h,d.workArea.height-48);return {x:Math.round(d.workArea.x+(d.workArea.width-width)/2),y:d.workArea.y+24,width,height};};
 const cancelDrag=()=>{if(dragEscape){globalShortcut.unregister('Escape');dragEscape=false;lock('drag',false);}dragCancelSession++;publish();};
 edge=new EdgeController(host,(id,w)=>{displayId=id;width=w;cancelDrag();},publish);
 const openComposer=(ideaId?:string):Result<void>=>{
  if(manage.isVisible()&&manageMode==='settings')return invalid('请先关闭设置。');
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
  if(r.ok){snapshot=r.value;undoClips=null;publish();}return r;
 };
 const captureDraft=():Promise<Result<Draft>>=>new Promise(resolve=>{
  const id=randomUUID();let finished=false;
  const finish=(result:Result<Draft>)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:quit-draft',receive);resolve(result);};
  const receive=(event:Electron.IpcMainEvent,requestId:string,draft:Draft|null)=>{if(requestId!==id||!trusted(event,[composer]))return;finish(draftShape(draft)?{ok:true,value:draft}:{ok:false,code:'IO',message:'当前内容正在保存，退出未完成。请稍后重试。'});};
  const timer=setTimeout(()=>finish({ok:false,code:'IO',message:'未能读取当前草稿，退出已取消。请保留文字后重试。'}),3000);
  ipcMain.on('thoughtline:quit-draft',receive);composer.webContents.send('thoughtline:prepare-quit',id);
 });
 prepareQuit=async()=>{
  if(settingsBusy)return false;
  if(!composer.isVisible()||composerContext.mode==='edit')return true;
  const draft=await captureDraft();const saved=draft.ok?await save({ok:true,value:{...snapshot,draft:draft.value}},snapshot.revision):draft;
  if(saved.ok)return true;
  composer.webContents.send('thoughtline:quit-error',saved.message);composer.show();composer.focus();return false;
 };
 ipcMain.handle('thoughtline:info',e=>{if(!trusted(e))throw Error('不允许读取');return info();});
 ipcMain.on('thoughtline:presentation-finished',(e,session:number)=>{if(trusted(e,[shelf])&&Number.isSafeInteger(session)&&session>=0)edge.presentationFinished(session);});
 ipcMain.on('thoughtline:hit-layout',(e,p:HitLayout)=>{
  if(!trusted(e,[shelf])||!p||!Number.isSafeInteger(p.layoutRevision)||!Array.isArray(p.rects)||p.rects.length>512||typeof p.displayId!=='string')return;
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
 ipcMain.handle('thoughtline:open-manage',(e,id?:string,titles?:boolean):Result<void>=>{
  if(!trusted(e)||id!==undefined&&typeof id!=='string'||titles!==undefined&&typeof titles!=='boolean')return invalid('无效操作');
  if(composer.isVisible())return invalid('请先保存或取消当前输入。');
  if(id&&!snapshot.ideas.some(x=>x.id===id))return invalid('找不到这条念头。');
  manageSelection=id??null;manageMode=id?'detail':'browse';manageTitles=!!titles;manageSession++;lock('manage',true);publish();if(id){const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()),p=screen.getCursorScreenPoint();const b=boundsFor(380,360);b.x=Math.round(Math.max(d.workArea.x+12,Math.min(d.workArea.x+d.workArea.width-b.width-12,p.x-b.width/2)));b.y=Math.round(Math.max(d.workArea.y+12,Math.min(d.workArea.y+d.workArea.height-b.height-12,p.y+24)));manage.setBounds(b);}else manage.setBounds(boundsFor(740,540));manage.show();manage.focus();return done();
 });
 ipcMain.handle('thoughtline:close-manage',e=>{if(!trusted(e,[manage]))return invalid('无效操作');hideManage();return done();});
 const openSettings=():Result<void>=>{
  if(composer.isVisible())return invalid('请先保存或取消当前输入。');
  cancelDrag();manageMode='settings';manageTitles=false;manageSelection=null;manageSession++;lock('manage',true);manage.setBounds(boundsFor(440,390));publish();manage.show();manage.focus();return done();
 };
 ipcMain.handle('thoughtline:open-settings',e=>trusted(e)?openSettings():invalid('无效操作'));
 ipcMain.handle('thoughtline:settings',async(e,settings:Snapshot['settings'],revision:number):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[manage])||manageMode!=='settings'||!settings||!validWriteHotkey(settings.writeHotkey)||typeof settings.reducedMotion!=='boolean')return invalid('请录制有效的组合快捷键。');
  if(settingsBusy)return invalid('正在保存设置，请稍后重试。');
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:'设置已变化，请核对后重试。'};
  settingsBusy=true;let committed:Result<Snapshot>=invalid('快捷键已被占用，请录制其他组合；原键位保持。');
  try{
   const changed=await swapShortcut(globalShortcut,snapshot.settings.writeHotkey,settings.writeHotkey,()=>{openComposer();},async()=>{committed=await save({ok:true,value:{...snapshot,settings:{writeHotkey:settings.writeHotkey,reducedMotion:settings.reducedMotion}}},revision);return committed;});
   if(!changed.ok)return changed.error?.ok===false?changed.error:committed;
   refreshTray();publish();return committed;
  }finally{settingsBusy=false;}
 });
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
 ipcMain.handle('thoughtline:drag-lock',(e,active:boolean)=>{
  if(!trusted(e,[shelf])||typeof active!=='boolean')return invalid('无效操作');if(active&&!dragEscape){if(!globalShortcut.register('Escape',cancelDrag))return invalid('Esc快捷键被占用，拖动未开始，请释放快捷键后重试。');dragEscape=true;}
  if(!active&&dragEscape){globalShortcut.unregister('Escape');dragEscape=false;}lock('drag',active);return done();
 });
 ipcMain.handle('thoughtline:clip',async(e,c:ClipMutation,revision:number)=>{
  if(!trusted(e,[shelf,manage])||!c||typeof c!=='object')return invalid('无效操作');
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:'布局已变化，请重新操作。'};
  const previous=snapshot,oldUndo=undoClips;let next:Result<Snapshot>;
  const positioned=()=>{const positions=new Map(layoutClips(snapshot.clips,width).visible.map(p=>[p.clip.id,normalizedPosition(p.x,width)]));return {...snapshot,clips:snapshot.clips.map(clip=>positions.has(clip.id)?{...clip,position:positions.get(clip.id)!}:clip)};};
  if(c.kind==='merge'&&typeof c.sourceId==='string'&&typeof c.targetId==='string')next=mergeClips(positioned(),c.sourceId,c.targetId);
  else if(c.kind==='move'&&typeof c.id==='string'&&typeof c.position==='number'&&(c.beforeId===null||typeof c.beforeId==='string'))next=moveClip(positioned(),c.id,c.position,c.beforeId);
  else if(c.kind==='select'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=selectClipIdea(snapshot,c.id,c.ideaId);
  else if(c.kind==='split'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=splitClip(positioned(),c.id,c.ideaId,randomUUID());
  else if(c.kind==='splitAll'&&typeof c.id==='string'){
   const clip=snapshot.clips.find(x=>x.id===c.id);if(!clip||clip.ideaIds.length<2)return invalid('没有可拆出的便签。');
   next={ok:true,value:positioned()};for(const id of clip.ideaIds.slice(1)){if(!next.ok)break;next=splitClip(next.value,c.id,id,randomUUID());}
  }else if(c.kind==='archiveAll'&&typeof c.id==='string'){
   const clip=snapshot.clips.find(x=>x.id===c.id);if(!clip)return invalid('找不到夹子。');next={ok:true,value:snapshot};for(const id of clip.ideaIds){if(!next.ok)break;next=changeStatus(next.value,id,'archived',new Date().toISOString());}
  }else if(c.kind==='undo'){
   if(!oldUndo||oldUndo.revision!==revision)return invalid('没有可撤销的夹子操作。');next={ok:true,value:{...oldUndo.snapshot,revision}};
  }else return invalid('夹子操作无效');
  const r=await save(next,revision);
  if(r.ok){if(c.kind==='split'){manageSelection=c.ideaId;manageSession++;}undoClips=c.kind==='undo'?null:c.kind==='select'?(oldUndo?{...oldUndo,revision:r.value.revision}:null):{snapshot:previous,revision:r.value.revision};publish();}
  return r;
 });
 for(const w of [composer,manage])w.on('close',event=>{if(!quitting)event.preventDefault();});
 await Promise.all([loadView(shelf,'shelf'),loadView(composer,'composer'),loadView(manage,'manage')]);
 globalShortcut.register(snapshot.settings.writeHotkey,()=>{openComposer();});
 const icon=nativeImage.createFromPath(join(__dirname,'../../assets/'+(process.platform==='darwin'?'trayTemplate.png':'app-icon.png'))).resize({width:22,height:22});
 if(icon.isEmpty())throw Error('Thoughtline tray icon failed to load.');
 if(process.platform==='darwin')icon.setTemplateImage(true);tray=new Tray(icon);tray.setToolTip('晾念头 / Thoughtline');
 refreshTray=()=>tray.setContextMenu(Menu.buildFromTemplate([{label:'晾念头 / Thoughtline',enabled:false},{label:`写念头：${snapshot.settings.writeHotkey}${globalShortcut.isRegistered(snapshot.settings.writeHotkey)?'':'（注册失败）'}`,enabled:false},{type:'separator'},{label:'设置',enabled:!composer.isVisible(),click:()=>{openSettings();}},{label:'暂停悬停',type:'checkbox',checked:edge.isManuallyPaused(),click:item=>{cancelDrag();edge.pause(item.checked);}},{label:'退出',click:()=>app.quit()}]));
 composer.on('show',refreshTray);composer.on('hide',refreshTray);refreshTray();
 nativeTheme.on('updated',publish);powerMonitor.on('suspend',()=>{cancelDrag();edge.pause(true,'sleep');});powerMonitor.on('lock-screen',()=>{cancelDrag();edge.pause(true,'lock');});powerMonitor.on('resume',()=>edge.pause(false,'sleep'));powerMonitor.on('unlock-screen',()=>edge.pause(false,'lock'));
 screen.on('display-metrics-changed',cancelDrag);app.dock?.hide();publish();edge.start();
}).catch(error=>{console.error(error);dialog.showErrorBox('晾念头启动未成功',error instanceof Error?error.message:'启动发生错误，请保留数据后重试。');app.quit();});
app.on('before-quit',event=>{
 if(!quitting&&prepareQuit){
  event.preventDefault();if(quitInFlight)return;quitInFlight=true;
  void prepareQuit().then(ok=>{quitInFlight=false;if(ok){quitting=true;app.quit();}}).catch(()=>{quitInFlight=false;composer?.webContents.send('thoughtline:quit-error','退出未成功，文字已保留，请重试。');});return;
 }
 quitting=true;edge?.stop();globalShortcut.unregisterAll();
});
app.on('window-all-closed',()=>{if(quitting)app.quit();});
