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
import {validWriteHotkey,displayWriteHotkey} from '../shared/composerKeys';
import {newIdea,editIdea,changeStatus,addAgent,updateAgent,removeAgent} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';
import type {PilotInfo,HitLayout,ComposerContext,AgentMutation,ClipMutation} from '../shared/bridge';
import {mergeClips,splitClip,moveClip,selectClipIdea} from '../shared/clipCommands';
import {captureClipPositions} from '../shared/clipLayout';
app.setName('Thoughtline');
app.setPath('userData',process.env.THOUGHTLINE_DATA_DIR||join(app.getPath('appData'),'Thoughtline'));
let prepareQuit:(()=>Promise<boolean>)|null=null;let quitInFlight=false;
let tray:Tray;let edge:EdgeController;let shelf:BrowserWindow;let composer:BrowserWindow|null=null;let manage:BrowserWindow|null=null;let quitting=false;
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
 let dragCancelSession=0,dragEscape=false;let textDragTimer:ReturnType<typeof setTimeout>|null=null;let textDragOwner:string|null=null;
 let shelfAgentId='all';let settingsBusy=false;let refreshTray=()=>{};
 let manageMode:'browse'|'detail'|'settings'='browse',manageTitles=false;let undoClips:{snapshot:Snapshot;revision:number}|null=null;
 let composerContext:ComposerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);
 const host=createHost(shelf,()=>composer);
 const info=():PilotInfo=>({platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,composerContext,manageSession,manageSelection,manageMode,manageTitles,canUndoClips:!!undoClips,dragCancelSession,textDragActive:!!textDragOwner,shelfAgentId,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey),...edge.presentation()});
 const publish=()=>{for(const w of [shelf,composer,manage])if(w&&!w.isDestroyed())w.webContents.send('thoughtline:info-update',info());};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,allowed:(BrowserWindow|null)[]=[shelf,composer,manage])=>allowed.some(w=>w?.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 const lock=(name:string,active:boolean)=>edge.event({type:'lock',name,active,now:Date.now()});
 const hideManage=()=>{manage?.hide();lock('manage',false);};
 const boundsFor=(w:number,h:number)=>{const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const width=Math.min(w,d.workArea.width-40),height=Math.min(h,d.workArea.height-48);return {x:Math.round(d.workArea.x+(d.workArea.width-width)/2),y:d.workArea.y+24,width,height};};
 const finishTextDrag=()=>{if(textDragTimer)clearTimeout(textDragTimer);textDragTimer=null;textDragOwner=null;lock('text-drag',false);};
 app.on('will-quit',()=>{if(textDragTimer)clearTimeout(textDragTimer);});
 const cancelDrag=()=>{finishTextDrag();if(dragEscape){globalShortcut.unregister('Escape');dragEscape=false;lock('drag',false);}dragCancelSession++;publish();};
 edge=new EdgeController(host,(id,w)=>{displayId=id;width=w;cancelDrag();},publish);
 let composerLoading:Promise<BrowserWindow>|null=null,manageLoading:Promise<BrowserWindow>|null=null;
 let composerSafeToRelease=true;
 const closeConfirmedComposer=()=>{composerSafeToRelease=true;host.closeComposer();};
 let composerRelease:ReturnType<typeof setTimeout>|null=null,manageRelease:ReturnType<typeof setTimeout>|null=null;
 const ensureComposer=():Promise<BrowserWindow>=>{
  if(composerRelease)clearTimeout(composerRelease);composerRelease=null;
  if(composerLoading)return composerLoading;if(composer)return Promise.resolve(composer);
  const w=createComposer(preload);composer=w;
  w.on('close',event=>{if(!quitting)event.preventDefault();});
  w.on('show',()=>{composerSafeToRelease=false;if(composerRelease)clearTimeout(composerRelease);composerRelease=null;refreshTray();});
  w.on('hide',()=>{refreshTray();lock('composer',false);if(!composerSafeToRelease)return;composerRelease=setTimeout(()=>{composerRelease=null;if(composerSafeToRelease&&!w.isDestroyed()&&!w.isVisible()){composer=null;w.destroy();}},30000);});
  composerLoading=loadView(w,'composer').then(()=>w).catch(error=>{composer=null;w.destroy();throw error;}).finally(()=>{composerLoading=null;});
  return composerLoading;
 };
 const ensureManage=():Promise<BrowserWindow>=>{
  if(manageRelease)clearTimeout(manageRelease);manageRelease=null;
  if(manageLoading)return manageLoading;if(manage)return Promise.resolve(manage);
  const w=createManage(preload);manage=w;
  w.on('close',event=>{if(!quitting)event.preventDefault();});
  w.on('show',()=>{if(manageRelease)clearTimeout(manageRelease);manageRelease=null;refreshTray();});
  w.on('hide',()=>{refreshTray();manageRelease=setTimeout(()=>{manageRelease=null;if(!w.isDestroyed()&&!w.isVisible()){manage=null;w.destroy();}},30000);});
  manageLoading=loadView(w,'manage').then(()=>w).catch(error=>{manage=null;w.destroy();throw error;}).finally(()=>{manageLoading=null;});
  return manageLoading;
 };
 app.on('will-quit',()=>{if(composerRelease)clearTimeout(composerRelease);if(manageRelease)clearTimeout(manageRelease);});
 const openComposer=async(ideaId?:string):Promise<Result<void>>=>{
  if(composerLoading)return done();
  if(manage?.isVisible()&&manageMode==='settings')return invalid('请先关闭设置。');
  if(composer?.isVisible()){
   composer.show();composer.focus();return ideaId?invalid('请先保存或取消当前编辑。'):done();
  }
  if(composer&&!composerSafeToRelease){
   hideManage();lock('composer',true);host.showComposer(boundsFor(530,440));
   return ideaId?invalid('请先保存或取消尚未完成的输入。'):done();
  }
  const idea=ideaId?snapshot.ideas.find(x=>x.id===ideaId):null;
  if(ideaId&&!idea)return invalid('找不到这条念头。');
  composerContext=idea?{mode:'edit',ideaId:idea.id,draft:{text:idea.text,title:idea.title,project:idea.project,agentId:idea.agentId}}:{mode:'new',ideaId:null,draft:snapshot.draft??blank};
  editRevision=snapshot.revision;composerSession++;try{await ensureComposer();}catch{return {ok:false,code:'IO',message:'输入浮层未能打开，请重试。原数据已保留。'};}if(quitting)return invalid('正在退出。');if(manage?.isVisible()&&manageMode==='settings')return invalid('请先关闭设置。');composerSafeToRelease=false;lock('composer',true);hideManage();publish();host.showComposer(boundsFor(530,440));return done();
 };
 const save=async(next:Result<Snapshot>,revision:number):Promise<Result<Snapshot>>=>{
  if(!next.ok)return next;const r=await repository.commit(next.value,revision);
  if(r.ok){snapshot=r.value;undoClips=null;if(shelfAgentId!=='all'&&!snapshot.agents.some(a=>a.id===shelfAgentId))shelfAgentId='all';refreshTray();publish();}return r;
 };
 const captureDraft=():Promise<Result<Draft>>=>new Promise(resolve=>{
  const id=randomUUID();let finished=false;
  const finish=(result:Result<Draft>)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:quit-draft',receive);resolve(result);};
  const receive=(event:Electron.IpcMainEvent,requestId:string,draft:Draft|null)=>{if(requestId!==id||!trusted(event,[composer]))return;finish(draftShape(draft)?{ok:true,value:draft}:{ok:false,code:'IO',message:'当前内容正在保存，退出未完成。请稍后重试。'});};
  const timer=setTimeout(()=>finish({ok:false,code:'IO',message:'未能读取当前草稿，退出已取消。请保留文字后重试。'}),3000);
  ipcMain.on('thoughtline:quit-draft',receive);composer!.webContents.send('thoughtline:prepare-quit',id);
 });
 prepareQuit=async()=>{
  if(settingsBusy)return false;
  await repository.flush();
  if(!composer||(composerSafeToRelease&&!composer.isVisible())||composerContext.mode==='edit')return true;
  const draft=await captureDraft();const saved=draft.ok?await save({ok:true,value:{...snapshot,draft:draft.value}},snapshot.revision):draft;
  if(saved.ok)return true;
  composer!.webContents.send('thoughtline:quit-error',saved.message);composer!.show();composer!.focus();return false;
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
  closeConfirmedComposer();lock('composer',false);edge.event({type:'peek',now:Date.now()});publish();return committed;
 });
 ipcMain.handle('thoughtline:close',async(e,draft:Draft):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid('无效操作');
  if(composerContext.mode==='edit'){closeConfirmedComposer();lock('composer',false);return {ok:true,value:snapshot};}
  const saved=await save({ok:true,value:{...snapshot,draft}},snapshot.revision);if(!saved.ok)return saved;
  closeConfirmedComposer();lock('composer',false);return saved;
 });
 ipcMain.handle('thoughtline:open-manage',async(e,id?:string,titles?:boolean):Promise<Result<void>>=>{
  if(!trusted(e)||id!==undefined&&typeof id!=='string'||titles!==undefined&&typeof titles!=='boolean')return invalid('无效操作');
  if(composer?.isVisible())return invalid('请先保存或取消当前输入。');
  if(id&&!snapshot.ideas.some(x=>x.id===id))return invalid('找不到这条念头。');
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:'浏览浮层未能打开，请重试。'};}if(quitting)return invalid('正在退出。');if(composer?.isVisible())return invalid('请先保存或取消当前输入。');manageSelection=id??null;manageMode=id?'detail':'browse';manageTitles=!!titles;manageSession++;lock('manage',true);publish();if(id){const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()),p=screen.getCursorScreenPoint();const b=boundsFor(380,360);b.x=Math.round(Math.max(d.workArea.x+12,Math.min(d.workArea.x+d.workArea.width-b.width-12,p.x-b.width/2)));b.y=Math.round(Math.max(d.workArea.y+12,Math.min(d.workArea.y+d.workArea.height-b.height-12,p.y+24)));manage!.setBounds(b);}else manage!.setBounds(boundsFor(740,540));manage!.show();manage!.focus();refreshTray();return done();
 });
 const selectShelfAgent=(id:string)=>{shelfAgentId=id==='all'||snapshot.agents.some(a=>a.id===id)?id:'all';refreshTray();publish();};
 const agentFilterMenu=():Electron.MenuItemConstructorOptions[]=>[
  {label:'全部',type:'radio',checked:shelfAgentId==='all',click:()=>selectShelfAgent('all')},
  ...snapshot.agents.map(agent=>({label:agent.name,type:'radio' as const,checked:shelfAgentId===agent.id,click:()=>selectShelfAgent(agent.id)}))
 ];
 const browseFromTray=()=>{void openBrowse();};
 const openBrowse=async()=>{
  if(composer?.isVisible())return invalid('请先保存或取消当前输入。');
  try{await ensureManage();}catch{return invalid('浏览浮层未能打开，请重试。');}
  if(quitting||composer?.isVisible())return invalid('请先结束当前输入。');
  manageMode='browse';manageSelection=null;manageTitles=false;manageSession++;lock('manage',true);manage!.setBounds(boundsFor(740,540));publish();manage!.show();manage!.focus();refreshTray();return done();
 };
 ipcMain.handle('thoughtline:shelf-menu',(e,id:string):Result<void>=>{
  if(!trusted(e,[shelf])||typeof id!=='string')return invalid('无效操作');
  const idea=snapshot.ideas.find(i=>i.id===id);if(!idea)return invalid('找不到这条念头。');
  if(!edge.presentation().shelfVisible)return invalid('挂绳已收起。');
  lock('menu',true);
  const menu=Menu.buildFromTemplate([
   {label:'查看全文',click:()=>{void openBrowseDetail(id);}},
   {label:`只看 ${snapshot.agents.find(a=>a.id===idea.agentId)?.name??'这个 Agent'}`,click:()=>selectShelfAgent(idea.agentId)},
   {label:'显示全部',click:()=>selectShelfAgent('all')},
   {label:'筛选 Agent',submenu:agentFilterMenu()},
   {type:'separator'},
   {label:'查找 / 已收起',click:browseFromTray}
  ]);
  try{menu.popup({window:shelf,callback:()=>lock('menu',false)});}catch{lock('menu',false);return invalid('菜单未能打开，请从托盘查找念头。');}return done();
 });
 const openBrowseDetail=async(id:string)=>{
  if(composer?.isVisible())return invalid('请先保存或取消当前输入。');
  try{await ensureManage();}catch{return invalid('全文浮层未能打开，请重试。');}
  if(quitting||composer?.isVisible())return invalid('请先结束当前输入。');
  manageMode='detail';manageSelection=id;manageTitles=false;manageSession++;lock('manage',true);manage!.setBounds(boundsFor(380,360));publish();manage!.show();manage!.focus();refreshTray();return done();
 };
 ipcMain.handle('thoughtline:close-manage',e=>{if(!trusted(e,[manage]))return invalid('无效操作');hideManage();return done();});
 const openSettings=async():Promise<Result<void>>=>{
  if(composer?.isVisible())return invalid('请先保存或取消当前输入。');
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:'设置浮层未能打开，请重试。'};}if(quitting)return invalid('正在退出。');if(composer?.isVisible())return invalid('请先保存或取消当前输入。');cancelDrag();manageMode='settings';manageTitles=false;manageSelection=null;manageSession++;lock('manage',true);manage!.setBounds(boundsFor(440,390));publish();manage!.show();manage!.focus();refreshTray();return done();
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
 ipcMain.on('thoughtline:text-drag',(e,active:boolean,id?:string)=>{
  if(!trusted(e,[shelf])||typeof active!=='boolean')return;
  if(!active){if(id===textDragOwner)finishTextDrag();return;}
  if(textDragTimer||!edge.presentation().shelfVisible||typeof id!=='string'||!snapshot.ideas.some(i=>i.id===id&&i.status==='hanging'))return;
  // Standard OS drag handles Escape. Do not register the peg's global Escape hook here.
  textDragOwner=id;lock('text-drag',true);textDragTimer=setTimeout(finishTextDrag,60000);
 });
 ipcMain.handle('thoughtline:drag-lock',(e,active:boolean)=>{
  if(!trusted(e,[shelf])||typeof active!=='boolean')return invalid('无效操作');if(active&&!dragEscape){if(!globalShortcut.register('Escape',cancelDrag))return invalid('Esc快捷键被占用，拖动未开始，请释放快捷键后重试。');dragEscape=true;}
  if(!active&&dragEscape){globalShortcut.unregister('Escape');dragEscape=false;}lock('drag',active);return done();
 });
 ipcMain.handle('thoughtline:clip',async(e,c:ClipMutation,revision:number)=>{
  if(!trusted(e,[shelf,manage])||!c||typeof c!=='object')return invalid('无效操作');
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:'布局已变化，请重新操作。'};
  const previous=snapshot,oldUndo=undoClips;let next:Result<Snapshot>;
  const positioned=()=>({...snapshot,clips:captureClipPositions(snapshot.clips,width,shelfAgentId)});
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
 await loadView(shelf,'shelf');
 globalShortcut.register(snapshot.settings.writeHotkey,()=>{openComposer();});
 const icon=nativeImage.createFromPath(join(__dirname,'../../assets/'+(process.platform==='darwin'?'trayTemplate.png':'app-icon.png'))).resize({width:22,height:22});
 if(icon.isEmpty())throw Error('Thoughtline tray icon failed to load.');
 if(process.platform==='darwin')icon.setTemplateImage(true);tray=new Tray(icon);tray.setToolTip('晾念头 / Thoughtline');
 refreshTray=()=>tray.setContextMenu(Menu.buildFromTemplate([{label:'晾念头 / Thoughtline',enabled:false},{label:`写念头：${displayWriteHotkey(snapshot.settings.writeHotkey,host.platform)}${globalShortcut.isRegistered(snapshot.settings.writeHotkey)?'':'（注册失败）'}`,enabled:!composer?.isVisible()&&!(manage?.isVisible()&&manageMode==='settings'),click:()=>{void openComposer();}},{type:'separator'},{label:'查找 / 已收起',enabled:!composer?.isVisible(),click:browseFromTray},{label:'筛选 Agent',submenu:agentFilterMenu()},{label:'设置',enabled:!composer?.isVisible(),click:()=>{openSettings();}},{label:'暂停悬停',type:'checkbox',checked:edge.isManuallyPaused(),click:item=>{cancelDrag();edge.pause(item.checked);}},{label:'退出',click:()=>app.quit()}]));
 refreshTray();
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
