import {PreferenceRepository} from './store/preferences';
import {translator,localizeMessage,agentLabel,countThoughts,type Translator} from '../shared/i18n';
import {app,BrowserWindow,dialog,shell,clipboard,globalShortcut,ipcMain,nativeImage,nativeTheme,powerMonitor,screen,Tray,Menu} from 'electron';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createShelf} from './windows/shelf';
import {createComposer,COMPOSER_SIZE,currentComposerMaterial} from './windows/composer';
import {createManage} from './windows/manage';
import {fitManageBounds} from './windows/manageGeometry';
import {createHost} from './platform/host';
import {EdgeController} from './edgeController';
import {FileRepository} from './store/repository';
import {loadStorageDirectory,loadStorageLocation,commitStorageDirectory,migrateStorage,exportBackup as writeBackup} from './store/storageLocations';
import {swapShortcut} from './shortcuts';
import {validWriteHotkey,displayWriteHotkey} from '../shared/composerKeys';
import {newIdea,changeStatus,addAgent,updateAgent,removeAgent,removeProject,editIdeaIfUnchanged,deleteIdea,restoreIdea,permanentlyDeleteIdea} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';
import type {PilotInfo,HitLayout,ComposerContext,AgentMutation,ClipMutation} from '../shared/bridge';
import {mergeClips,splitClip,moveClip,selectClipIdea,dropClipIdea,arrangeClips} from '../shared/clipCommands';
import {captureClipPositions,layoutClips} from '../shared/clipLayout';
app.setName('Thoughtline');
app.setPath('userData',process.env.THOUGHTLINE_DATA_DIR||join(app.getPath('appData'),'Thoughtline'));
let startupLocale:'zh-CN'|'en'='zh-CN';
const t:Translator=(key,...args)=>translator(startupLocale)(key,...args);
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
 const profileDir=app.getPath('userData');let dataDir=profileDir;
 const preferences=new PreferenceRepository(profileDir,app.getLocale());await preferences.load();startupLocale=preferences.current.locale;nativeTheme.themeSource=preferences.current.theme;

 const m=(message:string)=>localizeMessage(preferences.current.locale,message);
 let loaded:{repository:FileRepository;snapshot:Snapshot}|null=null;
 for(;;){
  const location=await loadStorageLocation(profileDir);
  const candidate=location.ok?new FileRepository(location.value.directory,undefined,{allowCreate:location.value.allowCreate}):null;
  const result=candidate?await candidate.load():location;
  if(result.ok&&candidate&&location.ok){dataDir=location.value.directory;loaded={repository:candidate,snapshot:result.value as Snapshot};break;}
  const error=result.ok?t("无法读取位置配置"):result.message;
  const {response}=await dialog.showMessageBox({type:'error',title:t("晾念头：数据读取未成功"),message:t("念头数据暂时无法读取"),detail:t('startupDetails',{error:m(error),path:profileDir}),buttons:[t("打开配置文件夹"),t("重试读取"),t("退出")],defaultId:1,cancelId:2,noLink:true});
  if(response===2){app.quit();return;}
  if(response===0){const error=await shell.openPath(profileDir);if(error)dialog.showErrorBox(t("无法打开配置目录"),error);}
 }
 let repository=loaded.repository;
 let snapshot:Snapshot=loaded.snapshot;let displayId=String(screen.getPrimaryDisplay().id);let width=screen.getPrimaryDisplay().bounds.width;
 let draftSequence=0,draftWritableSession:number|null=null;let composerWrites:Promise<unknown>=Promise.resolve();
 const composerWrite=<T>(action:()=>Promise<T>):Promise<T>=>{const next=composerWrites.then(action,action);composerWrites=next;return next;};
 let arrangeSession=0,manageVisit=0,calendarReturning=false,calendarReturnBounds:Electron.Rectangle|null=null;
 let composerSession=0,manageSession=0,manageSelection:string|null=null;
 let manageEditingOwner:{session:number;ideaId:string}|null=null,manageEditingRequested=false;
 let dragCancelSession=0,dragEscape=false;let textDragTimer:ReturnType<typeof setTimeout>|null=null;let textDragOwner:string|null=null;
 let placementNotice:string|null=null;let shelfAgentId='all';let settingsBusy=false;let storageBusy=false;let refreshTray=()=>{};
 let geometryTimer:ReturnType<typeof setTimeout>|null=null,boundsIgnoreUntil=0;
 let manageMode:'browse'|'detail'|'settings'='browse',manageTitles=false;let undoClips:{snapshot:Snapshot;revision:number;positionsOnly?:boolean}|null=null;
 let composerContext:ComposerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);
 const host=createHost(shelf,()=>composer);
 let preferenceCommit:{version:number;sequence:number;sender:number}|null=null;
 const info=(viewer?:number):PilotInfo=>({preferenceCommit:preferenceCommit?{version:preferenceCommit.version,sequence:preferenceCommit.sequence,own:preferenceCommit.sender===viewer}:null,preferences:preferences.current,preferenceError:preferences.error,platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,composerDraftSequence:draftSequence,composerMaterial:currentComposerMaterial(composer?.isFocused()??false),composerContext,placementNotice,arrangeSession,manageVisit,calendarReturning,manageSession,manageSelection,manageMode,manageTitles,manageMaterial:currentComposerMaterial(manage?.isFocused()??false),manageEditingRequested,canUndoClips:!!undoClips,dragCancelSession,textDragActive:!!textDragOwner,shelfAgentId,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey),...edge.presentation()});
 const publish=()=>{for(const w of [shelf,composer,manage])if(w&&!w.isDestroyed())w.webContents.send('thoughtline:info-update',info(w.webContents.id));};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,allowed:(BrowserWindow|null)[]=[shelf,composer,manage])=>allowed.some(w=>w?.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 const prepareWindow=(w:BrowserWindow|null):Promise<boolean>=>{
  if(!w||w.isDestroyed())return Promise.resolve(true);
  return new Promise(resolve=>{const id=randomUUID();let finished=false;
   const finish=(ok:boolean)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:leave-ready',receive);resolve(ok);};
   const receive=(event:Electron.IpcMainEvent,requestId:string,ok:boolean)=>{if(requestId===id&&trusted(event,[w]))finish(ok===true);};
   const timer=setTimeout(()=>finish(false),5000);ipcMain.on('thoughtline:leave-ready',receive);w.webContents.send('thoughtline:prepare-leave',id);
  });
 };
 const prepareViews=async()=>await prepareWindow(shelf)&&await prepareWindow(manage);
 const lock=(name:string,active:boolean)=>edge.event({type:'lock',name,active,now:Date.now()});
 const hideManage=()=>{manageEditingOwner=null;manageEditingRequested=false;manage?.hide();lock('manage',false);};
 const boundsFor=(w:number,h:number)=>{const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const width=Math.min(w,d.workArea.width-40),height=Math.min(h,d.workArea.height-48);return {x:Math.round(d.workArea.x+(d.workArea.width-width)/2),y:d.workArea.y+24,width,height};};
 const workAreas=()=>screen.getAllDisplays().map(d=>d.workArea);
 const setManageBounds=(bounds:Electron.Rectangle)=>{boundsIgnoreUntil=Date.now()+500;manage?.setBounds(fitManageBounds(bounds,workAreas()));};
 const calendarBounds=()=>fitManageBounds(snapshot.settings.calendarBounds??boundsFor(740,540),workAreas());
 const queueCalendarGeometry=()=>{
  if(manageMode!=='browse'||!manage?.isVisible()||Date.now()<boundsIgnoreUntil)return;
  if(geometryTimer)clearTimeout(geometryTimer);
  geometryTimer=setTimeout(()=>{geometryTimer=null;const bounds=manage?.getBounds();if(!bounds||!manage?.isVisible()||manageMode!=='browse')return;
   void composerWrite(async()=>{const saved=await repository.commit({...snapshot,settings:{...snapshot.settings,calendarBounds:bounds}},snapshot.revision);
    if(saved.ok){snapshot=saved.value;if(undoClips)undoClips={...undoClips,snapshot:{...undoClips.snapshot,settings:{...undoClips.snapshot.settings,calendarBounds:bounds}},revision:snapshot.revision};publish();}
   });
  },350);
 };
 const finishTextDrag=()=>{if(textDragTimer)clearTimeout(textDragTimer);textDragTimer=null;textDragOwner=null;lock('text-drag',false);};
 app.on('will-quit',()=>{if(textDragTimer)clearTimeout(textDragTimer);});
 const cancelDrag=()=>{finishTextDrag();if(dragEscape){globalShortcut.unregister('Escape');dragEscape=false;lock('drag',false);}dragCancelSession++;publish();};
 edge=new EdgeController(host,(id,w)=>{displayId=id;width=w;cancelDrag();},publish);
 let composerLoading:Promise<BrowserWindow>|null=null,manageLoading:Promise<BrowserWindow>|null=null;
 let composerSafeToRelease=true;
 const closeConfirmedComposer=()=>{draftWritableSession=null;composerSafeToRelease=true;host.closeComposer();};
 let composerRelease:ReturnType<typeof setTimeout>|null=null,manageRelease:ReturnType<typeof setTimeout>|null=null;
 const ensureComposer=():Promise<BrowserWindow>=>{
  if(composerRelease)clearTimeout(composerRelease);composerRelease=null;
  if(composerLoading)return composerLoading;if(composer)return Promise.resolve(composer);
  const w=createComposer(preload);composer=w;
  w.on('close',event=>{if(!quitting)event.preventDefault();});w.on('focus',publish);w.on('blur',publish);
  w.on('show',()=>{composerSafeToRelease=false;if(composerRelease)clearTimeout(composerRelease);composerRelease=null;refreshTray();});
  w.on('hide',()=>{refreshTray();lock('composer',false);if(!composerSafeToRelease)return;composerRelease=setTimeout(()=>{composerRelease=null;if(composerSafeToRelease&&!w.isDestroyed()&&!w.isVisible()){composer=null;w.destroy();}},30000);});
  composerLoading=loadView(w,'composer').then(()=>w).catch(error=>{composer=null;w.destroy();throw error;}).finally(()=>{composerLoading=null;});
  return composerLoading;
 };
 const ensureManage=():Promise<BrowserWindow>=>{
  if(manageRelease)clearTimeout(manageRelease);manageRelease=null;
  if(manageLoading)return manageLoading;if(manage)return Promise.resolve(manage);
  const w=createManage(preload);manage=w;
  w.on('close',event=>{if(!quitting){event.preventDefault();void prepareWindow(w).then(ok=>{if(ok)hideManage();else{w.show();w.focus();}});}});
  w.on('focus',publish);w.on('blur',publish);
  w.on('will-move',()=>{boundsIgnoreUntil=0;});w.on('will-resize',()=>{boundsIgnoreUntil=0;});
  w.on('move',queueCalendarGeometry);w.on('resize',queueCalendarGeometry);
  w.on('show',()=>{if(manageRelease)clearTimeout(manageRelease);manageRelease=null;refreshTray();});
  w.on('hide',()=>{refreshTray();if(manageEditingOwner){w.show();w.focus();return;}manageRelease=setTimeout(()=>{manageRelease=null;if(!w.isDestroyed()&&!w.isVisible()&&!manageEditingOwner){manage=null;w.destroy();}},30000);});
  manageLoading=loadView(w,'manage').then(()=>w).catch(error=>{manage=null;w.destroy();throw error;}).finally(()=>{manageLoading=null;});
  return manageLoading;
 };
 app.on('will-quit',()=>{if(composerRelease)clearTimeout(composerRelease);if(manageRelease)clearTimeout(manageRelease);if(geometryTimer)clearTimeout(geometryTimer);});
 const openComposer=async():Promise<Result<void>>=>{
  if(composerLoading)return done();
  if(manage?.isVisible()&&manageMode==='settings')return invalid(t("请先关闭设置。"));
  if(composer?.isVisible()){
   composer.show();composer.focus();return done();
  }
  if(composer&&!composerSafeToRelease){
   if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
   hideManage();lock('composer',true);host.showComposer(boundsFor(COMPOSER_SIZE.width,COMPOSER_SIZE.height));
   return done();
  }
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  composerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
  composerSession++;draftWritableSession=composerSession;draftSequence=0;try{await ensureComposer();}catch{return {ok:false,code:'IO',message:t("输入浮层未能打开，请重试。原数据已保留。")};}if(quitting)return invalid(t("正在退出。"));if(manage?.isVisible()&&manageMode==='settings')return invalid(t("请先关闭设置。"));composerSafeToRelease=false;lock('composer',true);hideManage();publish();host.showComposer(boundsFor(COMPOSER_SIZE.width,COMPOSER_SIZE.height));return done();
 };
 const save=async(next:Result<Snapshot>,revision:number,onCommitted?:()=>void):Promise<Result<Snapshot>>=>{
  if(!next.ok)return next;const r=await repository.commit(next.value,revision);
  if(r.ok){snapshot=r.value;undoClips=null;if(shelfAgentId!=='all'&&!snapshot.agents.some(a=>a.id===shelfAgentId))shelfAgentId='all';refreshTray();onCommitted?.();publish();}return r;
 };
 const captureDraft=():Promise<Result<Draft>>=>new Promise(resolve=>{
  const id=randomUUID();let finished=false;
  const finish=(result:Result<Draft>)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:quit-draft',receive);resolve(result);};
  const receive=(event:Electron.IpcMainEvent,requestId:string,draft:Draft|null)=>{if(requestId!==id||!trusted(event,[composer]))return;finish(draftShape(draft)?{ok:true,value:draft}:{ok:false,code:'IO',message:t("当前内容正在保存，退出未完成。请稍后重试。")});};
  const timer=setTimeout(()=>finish({ok:false,code:'IO',message:t("未能读取当前草稿，退出已取消。请保留文字后重试。")}),3000);
  ipcMain.on('thoughtline:quit-draft',receive);composer!.webContents.send('thoughtline:prepare-quit',id);
 });
 prepareQuit=async()=>{
  if(settingsBusy||storageBusy)return false;
  if(!await prepareWindow(shelf)||!await prepareWindow(manage))return false;
  await composerWrites;await repository.flush();await preferences.flush();
  if(!composer||(composerSafeToRelease&&!composer.isVisible()))return true;
  const draft=await captureDraft();const saved=draft.ok?await save({ok:true,value:{...snapshot,draft:draft.value}},snapshot.revision):draft;
  if(saved.ok)return true;
  composer!.webContents.send('thoughtline:quit-error',saved.message);composer!.show();composer!.focus();return false;
 };
 ipcMain.handle('thoughtline:preferences',async(e,patch:unknown,sequence:number)=>{
  if(!trusted(e,[composer,manage])||quitting||quitInFlight)return invalid(t("无效操作"));
  const result=await preferences.update(patch,String(e.sender.id),sequence);
  if(result.ok){preferenceCommit={version:result.value.version,sequence,sender:e.sender.id};startupLocale=preferences.current.locale;nativeTheme.themeSource=preferences.current.theme;refreshTray();publish();}
  return result;
 });
 ipcMain.handle('thoughtline:info',e=>{if(!trusted(e))throw Error(t("不允许读取"));return info(e.sender.id);});
 ipcMain.on('thoughtline:presentation-finished',(e,session:number)=>{if(trusted(e,[shelf])&&Number.isSafeInteger(session)&&session>=0)edge.presentationFinished(session);});
 ipcMain.on('thoughtline:hit-layout',(e,p:HitLayout)=>{
  if(!trusted(e,[shelf])||!p||!Number.isSafeInteger(p.layoutRevision)||!Array.isArray(p.rects)||p.rects.length>512||typeof p.displayId!=='string')return;
  if(p.rects.every(r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=340))edge.layout(p);
 });
 ipcMain.handle('thoughtline:copy',async(e,id:string):Promise<Result<void>>=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string')return invalid(t("无效操作"));
  const idea=snapshot.ideas.find(x=>x.id===id);if(!idea)return invalid(t("找不到正文"));
  try{await clipboard.writeText(idea.text);return done();}catch{return {ok:false,code:'IO',message:t("复制失败，请在全文中手动选中复制。")};}
 });
 ipcMain.handle('thoughtline:save-draft',(e,draft:Draft,session:number,sequence:number)=>composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft)||session!==composerSession||session!==draftWritableSession||!Number.isSafeInteger(sequence)||sequence<=0||quitting||quitInFlight||composerSafeToRelease||composerContext.mode!=='new')return invalid(t("草稿会话已结束或内容无效。"));
  if(sequence<=draftSequence)return {ok:true,value:snapshot};draftSequence=sequence;
  if(snapshot.draft&&['text','title','project','agentId'].every(key=>snapshot.draft![key as keyof Draft]===draft[key as keyof Draft]))return {ok:true,value:snapshot};
  const saved=await repository.commit({...snapshot,draft},snapshot.revision);
  if(saved.ok){snapshot=saved.value;composerContext={...composerContext,draft};if(undoClips)undoClips={...undoClips,snapshot:{...undoClips.snapshot,draft},revision:snapshot.revision};publish();}
  return saved;
 }));
 ipcMain.handle('thoughtline:submit',async(e,draft:Draft,revision:number)=>{let overflowId:string|null=null;const committed=await composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid(t("无效内容"));
  const now=new Date().toISOString(),createdId=randomUUID();
  if(composerContext.mode!=='new')return invalid(t("已有念头请在原窗口编辑。"));
  const next=newIdea({...snapshot,clips:captureClipPositions(snapshot.clips,width)},draft,createdId,now);
  const committed=await save(next,revision);if(!committed.ok)return committed;
  closeConfirmedComposer();lock('composer',false);edge.event({type:'peek',now:Date.now()});placementNotice=null;const createdClip=snapshot.clips.find(c=>c.ideaIds.includes(createdId));if(createdClip&&layoutClips(snapshot.clips,width).overflow.some(c=>c.id===createdClip.id)){placementNotice=t("已保存，绳上暂时放不下");overflowId=createdId;}publish();return committed;
 });if(committed.ok&&overflowId)await openBrowseDetail(overflowId);return committed;
 });
 ipcMain.handle('thoughtline:close',(e,draft:Draft)=>composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid(t("无效操作"));
  const saved=await save({ok:true,value:{...snapshot,draft}},snapshot.revision);if(!saved.ok)return saved;
  closeConfirmedComposer();lock('composer',false);return saved;
 }));
 ipcMain.handle('thoughtline:open-manage',async(e,id?:string,titles?:boolean):Promise<Result<void>>=>{
  if(!trusted(e)||id!==undefined&&typeof id!=='string'||titles!==undefined&&typeof titles!=='boolean')return invalid(t("无效操作"));
  if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));
  if(id&&!snapshot.ideas.some(x=>x.id===id))return invalid(t("找不到这条念头。"));
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:t("浏览浮层未能打开，请重试。")};}if(quitting)return invalid(t("正在退出。"));if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));manageSelection=id??null;manageMode=id?'detail':'browse';manageTitles=!!titles;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);publish();if(id){const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()),p=screen.getCursorScreenPoint();const b=boundsFor(420,500);b.x=Math.round(Math.max(d.workArea.x+12,Math.min(d.workArea.x+d.workArea.width-b.width-12,p.x-b.width/2)));b.y=Math.round(Math.max(d.workArea.y+12,Math.min(d.workArea.y+d.workArea.height-b.height-12,p.y+24)));setManageBounds(b);}else setManageBounds(calendarBounds());manage!.show();manage!.focus();refreshTray();return done();
 });
 const selectShelfAgent=async(id:string)=>{if(!await prepareWindow(shelf))return invalid(t("页码尚未保存，筛选已保留。"));shelfAgentId=id==='all'||snapshot.agents.some(a=>a.id===id)?id:'all';refreshTray();publish();};
 const agentFilterMenu=():Electron.MenuItemConstructorOptions[]=>[
  {label:t("全部"),type:'radio',checked:shelfAgentId==='all',click:()=>selectShelfAgent('all')},
  ...snapshot.agents.map(agent=>({label:agentLabel(preferences.current.locale,agent),type:'radio' as const,checked:shelfAgentId===agent.id,click:()=>selectShelfAgent(agent.id)}))
 ];
 const browseFromTray=()=>{void openBrowse();};
 const openBrowse=async()=>{
  if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return invalid(t("浏览浮层未能打开，请重试。"));}
  if(quitting||composer?.isVisible())return invalid(t("请先结束当前输入。"));
  manageMode='browse';manageSelection=null;manageTitles=false;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);setManageBounds(calendarBounds());publish();manage!.show();manage!.focus();refreshTray();return done();
 };
 let activeShelfMenu:{menu:Menu;finish:()=>void}|null=null;
 const closeShelfMenu=()=>{const active=activeShelfMenu;if(!active)return;try{active.menu.closePopup();}finally{active.finish();}};
 shelf.on('hide',closeShelfMenu);app.on('before-quit',closeShelfMenu);
 ipcMain.handle('thoughtline:shelf-menu',(e,id:string):Result<void>=>{
  if(!trusted(e,[shelf])||typeof id!=='string')return invalid(t("无效操作"));
  const idea=snapshot.ideas.find(i=>i.id===id);if(!idea)return invalid(t("找不到这条念头。"));
  const clip=snapshot.clips.find(c=>c.ideaIds.includes(id));
  if(!edge.presentation().shelfVisible)return invalid(t("挂绳已收起。"));
  closeShelfMenu();lock('menu',true);
  const allPositions=layoutClips(snapshot.clips,width);
  const mergeTargets=clip?[...allPositions.visible.map(p=>p.clip),...allPositions.overflow].filter(c=>c.id!==clip.id&&c.agentId===clip.agentId):[];
  const mergeItems=mergeTargets.map(target=>{
   const targetIdea=snapshot.ideas.find(i=>i.id===target.currentId);
   const characters=Array.from((targetIdea?.title||targetIdea?.text.trim().split('\n')[0]||t('无标题')).replace(/\s+/g,' '));
   const title=characters.slice(0,24).join('')+(characters.length>24?'…':'');
   return {label:`${title} · ${countThoughts(preferences.current.locale,target.ideaIds.length)}`,click:()=>{void (async()=>{if(!await prepareViews())return;cancelDrag();const r=await applyClipChange({kind:'paperDrop',id:clip!.id,ideaId:id,targetId:target.id,position:null},snapshot.revision);if(!r.ok){placementNotice=r.message;publish();}})();}};
  });
  const menu=Menu.buildFromTemplate([
   {label:t("查看全文"),click:()=>{void openBrowseDetail(id);}},
   {label:t("合并"),enabled:!!clip,submenu:mergeItems.length?mergeItems:[{label:t("没有可合并的夹子"),enabled:false}]},
   ...(clip&&clip.ideaIds.length>1?[{label:t("拆分"),click:()=>{void (async()=>{if(!await prepareViews())return;cancelDrag();const r=await applyClipChange({kind:'split',id:clip.id,ideaId:id},snapshot.revision);if(!r.ok){placementNotice=r.message;publish();}})();}}]:[]),
   {label:t("收起当前念头"),click:()=>{void (async()=>{if(!await prepareViews())return;const r=await composerWrite(()=>{const current=snapshot.ideas.find(i=>i.id===id&&i.status==='hanging');return current?save(changeStatus({...snapshot,clips:captureClipPositions(snapshot.clips,width)},id,'archived',new Date().toISOString()),snapshot.revision):Promise.resolve(invalid(t("找不到这条念头。")));});if(!r.ok){placementNotice=r.message;publish();}})();}},
   {label:t('onlyAgent',{name:agentLabel(preferences.current.locale,snapshot.agents.find(a=>a.id===idea.agentId))||t('这个 Agent')}),click:()=>selectShelfAgent(idea.agentId)},
   {label:t("显示全部"),click:()=>selectShelfAgent('all')},
   {label:t('自动整理'),click:()=>{void (async()=>{if(!await prepareViews())return;cancelDrag();const r=await applyClipChange({kind:'arrange'},snapshot.revision);if(!r.ok){placementNotice=r.message;publish();}})();}},
   ...(undoClips?[{label:t('撤销整理'),click:()=>{void (async()=>{if(!await prepareViews())return;cancelDrag();const r=await applyClipChange({kind:'undo'},snapshot.revision);if(!r.ok){placementNotice=r.message;publish();}})();}}]:[]),

   {label:t("筛选 Agent"),submenu:agentFilterMenu()},
   {type:'separator'},
   {label:t("查找 / 已收起"),click:browseFromTray}
  ]);
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;if(activeShelfMenu?.menu!==menu)return;activeShelfMenu=null;if(process.platform==='win32'&&!shelf.isDestroyed()){if(shelf.isFocused())shelf.blur();shelf.setFocusable(false);}lock('menu',false);};
  activeShelfMenu={menu,finish};
  try{if(process.platform==='win32'){shelf.setFocusable(true);shelf.focus();}menu.popup({window:shelf,callback:finish});}catch{finish();return invalid(t("菜单未能打开，请从托盘查找念头。"));}return done();
 });
 const openBrowseDetail=async(id:string)=>{
  if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return invalid(t("全文浮层未能打开，请重试。"));}
  if(quitting||composer?.isVisible())return invalid(t("请先结束当前输入。"));
  manageMode='detail';manageSelection=id;manageTitles=false;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);setManageBounds(boundsFor(420,500));publish();manage!.show();manage!.focus();refreshTray();return done();
 };
 ipcMain.handle('thoughtline:close-manage',async e=>{if(!trusted(e,[manage]))return invalid(t("无效操作"));if(!await prepareWindow(manage))return invalid(t("最后修改尚未保存，窗口已保留。"));hideManage();return done();});
 const openSettings=async(fromCalendar=false):Promise<Result<void>>=>{
  if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:t("设置浮层未能打开，请重试。")};}if(quitting)return invalid(t("正在退出。"));if(composer?.isVisible())return invalid(t("请先保存或取消当前输入。"));calendarReturnBounds=fromCalendar&&manage?.isVisible()?manage.getBounds():null;if(!fromCalendar)manageVisit++;calendarReturning=false;cancelDrag();manageMode='settings';manageTitles=false;manageSelection=null;manageEditingRequested=false;manageSession++;lock('manage',true);setManageBounds(boundsFor(500,600));publish();manage!.show();manage!.focus();refreshTray();return done();
 };
 ipcMain.handle('thoughtline:open-settings',e=>trusted(e)?openSettings(trusted(e,[manage])&&manageMode==='browse'&&!!manage?.isVisible()):invalid(t("无效操作")));
 ipcMain.handle('thoughtline:return-calendar',async e=>{
  if(!trusted(e,[manage])||manageMode!=='settings'||settingsBusy||storageBusy)return invalid(t('无效操作'));
  if(!await prepareWindow(manage))return invalid(t('最后修改尚未保存，窗口已保留。'));
  calendarReturning=calendarReturnBounds!==null;manageMode='browse';manageSelection=null;manageEditingRequested=false;manageSession++;setManageBounds(calendarReturnBounds??calendarBounds());calendarReturnBounds=null;publish();manage!.show();manage!.focus();return done();
 });
 const storageState=()=>({directory:dataDir,profileDirectory:profileDir,revision:snapshot.revision});
 ipcMain.handle('thoughtline:storage-info',e=>trusted(e,[manage])?{ok:true,value:storageState()}:invalid(t("无效操作")));
 ipcMain.handle('thoughtline:open-storage-directory',async e=>{
  if(!trusted(e,[manage]))return invalid(t("无效操作"));
  const valid=await loadStorageDirectory(profileDir);if(!valid.ok)return valid;
  try{const error=await shell.openPath(dataDir);return error?invalid(error):done();}catch{return invalid(t("无法打开当前念头目录。"));}
 });
 const storageOperation=async(e:Electron.IpcMainInvokeEvent,kind:'migrate'|'backup')=>{
  if(!trusted(e,[manage])||storageBusy||quitting)return invalid(t("存储操作正在进行，请稍后重试。"));
  if(composer?.isVisible())return invalid(t("请先保存当前输入。"));
  storageBusy=true;
  try{
   // Storage operations keep Settings mounted; its busy/dirty close guard is not a navigation request.
   const ready=await prepareWindow(shelf)&&(manageMode==='settings'||await prepareWindow(manage));
   if(!ready)return invalid(t("最后修改尚未保存或输入法尚未确认，仍使用原位置。"));
   const choice=await dialog.showOpenDialog(manage!,{title:kind==='migrate'?t("选择新的空念头文件夹"):t("选择独立备份的保存文件夹"),properties:['openDirectory','createDirectory']});
   if(choice.canceled||!choice.filePaths[0])return {ok:true,value:{...storageState(),canceled:true}};
   return await composerWrite(async()=>{
    if(!trusted(e,[manage])||quitting)return invalid(t("操作窗口已关闭。"));
    await repository.flush();
    if(kind==='backup'){
     const result=await writeBackup(dataDir,choice.filePaths[0],snapshot,app.getVersion());
     return result.ok?{ok:true,value:{...storageState(),directory:result.value,canceled:false}}:result;
    }
    const result=await migrateStorage(dataDir,choice.filePaths[0],snapshot,path=>commitStorageDirectory(profileDir,path));
    if(!result.ok)return result;
    dataDir=result.value.directory;repository=result.value.repository;snapshot=result.value.snapshot;undoClips=null;publish();
    return {ok:true,value:{...storageState(),canceled:false}};
   });
  }catch(error){return invalid(`操作未完成，仍使用原位置。${error instanceof Error?error.message:''}`);}finally{storageBusy=false;}
 };
 ipcMain.handle('thoughtline:change-storage',e=>storageOperation(e,'migrate'));
 ipcMain.handle('thoughtline:export-backup',e=>storageOperation(e,'backup'));
 ipcMain.handle('thoughtline:settings',async(e,settings:Snapshot['settings'],revision:number):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[manage])||manageMode!=='settings'||!settings||!validWriteHotkey(settings.writeHotkey)||typeof settings.reducedMotion!=='boolean')return invalid(t("请录制有效的组合快捷键。"));
  return composerWrite(async()=>{
  if(settingsBusy)return invalid(t("正在保存设置，请稍后重试。"));
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t("设置已变化，请核对后重试。")};
  settingsBusy=true;let committed:Result<Snapshot>=invalid(t("快捷键已被占用，请录制其他组合；原键位保持。"));
  try{
   const changed=await swapShortcut(globalShortcut,snapshot.settings.writeHotkey,settings.writeHotkey,()=>{openComposer();},async()=>{committed=await save({ok:true,value:{...snapshot,settings:{...snapshot.settings,writeHotkey:settings.writeHotkey,reducedMotion:settings.reducedMotion}}},revision);return committed;});
   if(!changed.ok)return changed.error?.ok===false?changed.error:committed;
   refreshTray();publish();return committed;
  }finally{settingsBusy=false;}
  });
 });
 ipcMain.handle('thoughtline:open-edit',async(e,id:string)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||!snapshot.ideas.some(i=>i.id===id&&i.status!=='deleted'))return invalid(t("找不到这条念头。"));
  if(trusted(e,[manage])&&manageMode==='detail'&&manageSelection===id){manageEditingRequested=true;publish();return done();}
  const opened=await openBrowseDetail(id);if(opened.ok){manageEditingRequested=true;publish();}return opened;
 });
 ipcMain.handle('thoughtline:set-editing',(e,active:boolean,session:number,ideaId:string):Result<void>=>{
  if(!trusted(e,[manage])||typeof active!=='boolean'||session!==manageSession||typeof ideaId!=='string')return invalid(t("编辑会话已结束。"));
  if(active){if(!snapshot.ideas.some(i=>i.id===ideaId&&i.status!=='deleted'))return invalid(t("找不到这条念头。"));manageEditingOwner={session,ideaId};}
  else if(manageEditingOwner?.session===session&&manageEditingOwner.ideaId===ideaId)manageEditingOwner=null;
  publish();return done();
 });
 ipcMain.handle('thoughtline:update-idea',(e,id:string,draft:Draft,expectedDraft:Draft,session:number)=>{
  if(!trusted(e,[manage])||typeof id!=='string'||!draftShape(draft)||!draftShape(expectedDraft)||session!==manageSession||!manage?.isVisible())return Promise.resolve(invalid<Snapshot>(t("编辑会话已结束，文字仍在窗口中。")));
  return composerWrite(async():Promise<Result<Snapshot>>=>{
   if(!trusted(e,[manage])||session!==manageSession||!manage?.isVisible()||manageEditingOwner?.session!==session||manageEditingOwner.ideaId!==id)return invalid(t("编辑会话已结束，文字仍在窗口中。"));
   const priorClips=new Set(snapshot.clips.map(c=>c.id));
   const saved=await save(editIdeaIfUnchanged(snapshot,id,draft,expectedDraft,new Date().toISOString(),width),snapshot.revision);
   if(saved.ok&&snapshot.clips.some(c=>!priorClips.has(c.id)&&c.ideaIds.includes(id))){
    placementNotice=layoutClips(snapshot.clips,width).overflow.some(c=>c.ideaIds.includes(id))?t("已保存，绳上暂时放不下，可在念头日历查看"):null;publish();
   }
   return saved;
  });
 });
 ipcMain.handle('thoughtline:idea-history',(e,id:string,kind:'delete'|'restore'|'permanent',revision:number)=>{
  if(!trusted(e,[manage])||typeof id!=='string'||!['delete','restore','permanent'].includes(kind))return Promise.resolve(invalid<Snapshot>(t("无效操作")));
  return composerWrite(async()=>{
   if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已更新，请重新操作。")};
   const next=kind==='delete'?deleteIdea(snapshot,id,new Date().toISOString()):kind==='restore'?restoreIdea({...snapshot,clips:captureClipPositions(snapshot.clips,width)},id,new Date().toISOString()):permanentlyDeleteIdea(snapshot,id);
   const r=await save(next,revision);if(r.ok){placementNotice=kind==='restore'&&layoutClips(snapshot.clips,width).overflow.some(c=>c.ideaIds.includes(id))?t("已恢复，绳上暂时放不下，可在念头日历查看"):null;publish();}return r;
  });
 });
 ipcMain.handle('thoughtline:status',async(e,id:string,status:'hanging'|'archived',revision:number)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||!['hanging','archived'].includes(status))return invalid(t("无效操作"));
  return composerWrite(async()=>{if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已变化，请重新操作。")};
  const r=await save(changeStatus({...snapshot,clips:captureClipPositions(snapshot.clips,width)},id,status,new Date().toISOString()),revision);
  if(r.ok){placementNotice=status==='hanging'&&layoutClips(snapshot.clips,width).overflow.some(c=>c.ideaIds.includes(id))?t("已保存，绳上暂时放不下"):null;edge.event({type:'peek',now:Date.now()});publish();}return r;
  });
 });
 ipcMain.handle('thoughtline:agent',(e,c:AgentMutation,revision:number)=>{
  if(!trusted(e,[manage])||!c||typeof c!=='object')return invalid(t("无效操作"));
  return composerWrite(async()=>{if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已变化，请重新操作。")};
  let next:Result<Snapshot>;
  if(c.kind==='add'&&typeof c.name==='string'&&typeof c.color==='string')next=addAgent(snapshot,{id:randomUUID(),name:c.name.trim(),color:c.color});
  else if(c.kind==='update'&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.color==='string')next=updateAgent(snapshot,c.id,{name:c.name.trim(),color:c.color});
  else if(c.kind==='remove'&&typeof c.id==='string'&&typeof c.replacement==='string')next=removeAgent(snapshot,c.id,c.replacement);
  else return invalid(t("Agent内容无效"));
  return save(next,revision);
  });
 });
 ipcMain.handle('thoughtline:project-delete',(e,project:string,revision:number)=>composerWrite(async()=>{
  if(!trusted(e,[composer,manage])||typeof project!=='string'||!project)return invalid(t("未分组不能删除。"));
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t("内容已更新，请重新删除分组。")};
  const priorUndo=undoClips,now=new Date().toISOString();
  const saved=await save(removeProject(snapshot,project,now),revision);
  if(saved.ok){
   if(composerContext.draft.project===project)composerContext={...composerContext,draft:{...composerContext.draft,project:''}};
   if(priorUndo){const cleaned=removeProject(priorUndo.snapshot,project,now);if(cleaned.ok)undoClips={...priorUndo,snapshot:cleaned.value,revision:snapshot.revision};}
   publish();
  }
  return saved;
 }));
 ipcMain.on('thoughtline:text-drag' ,(e,active:boolean,id?:string)=>{
  if(!trusted(e,[shelf])||typeof active!=='boolean')return;
  if(!active){if(id===textDragOwner)finishTextDrag();return;}
  if(textDragTimer||!edge.presentation().shelfVisible||typeof id!=='string'||!snapshot.ideas.some(i=>i.id===id&&i.status==='hanging'))return;
  // Standard OS drag handles Escape. Do not register the peg's global Escape hook here.
  textDragOwner=id;lock('text-drag',true);textDragTimer=setTimeout(finishTextDrag,60000);
 });
 ipcMain.handle('thoughtline:drag-lock',(e,active:boolean)=>{
  if(!trusted(e,[shelf])||typeof active!=='boolean')return invalid(t("无效操作"));if(active&&!dragEscape){if(!globalShortcut.register('Escape',cancelDrag))return invalid(t("Esc快捷键被占用，拖动未开始，请释放快捷键后重试。"));dragEscape=true;}
  if(!active&&dragEscape){globalShortcut.unregister('Escape');dragEscape=false;}lock('drag',active);return done();
 });
 // A failed retry keeps its original cross-window generation. Only a new choice can supersede it.
 const pageSequences=new Map<string,{sequence:number;generation:number}>(),pageGenerations=new Map<string,number>();let pageGeneration=0;
 ipcMain.handle('thoughtline:select-clip',(e,id:string,ideaId:string,sequence:number)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||typeof ideaId!=='string'||!Number.isSafeInteger(sequence)||sequence<=0)return invalid(t("页码请求无效。"));
  const key=e.sender.id+':'+id,priorRequest=pageSequences.get(key);if(sequence<(priorRequest?.sequence??0))return Promise.resolve({ok:true as const,value:snapshot});
  const generation=sequence===priorRequest?.sequence?priorRequest.generation:++pageGeneration;if(sequence!==priorRequest?.sequence){pageSequences.set(key,{sequence,generation});pageGenerations.set(id,generation);}
  return composerWrite(async()=>{if(generation!==pageGenerations.get(id))return {ok:true as const,value:snapshot};const prior=undoClips;const r=await save(selectClipIdea(snapshot,id,ideaId),snapshot.revision);if(r.ok){if(prior)undoClips={...prior,revision:snapshot.revision};publish();}return r;});
 });
 const applyClipChange=(c:ClipMutation,revision:number)=>composerWrite(async()=>{
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t("布局已变化，请重新操作。")};
  const previous=snapshot,oldUndo=undoClips;let next:Result<Snapshot>;
  const positioned=()=>({...snapshot,clips:captureClipPositions(snapshot.clips,width,shelfAgentId)});
  if(c.kind==='arrange')next=arrangeClips(snapshot,width);
  else if(c.kind==='merge'&&typeof c.sourceId==='string'&&typeof c.targetId==='string')next=mergeClips(positioned(),c.sourceId,c.targetId);
  else if(c.kind==='move'&&typeof c.id==='string'&&typeof c.position==='number'&&(c.beforeId===null||typeof c.beforeId==='string'))next=moveClip(positioned(),c.id,c.position,c.beforeId,width,shelfAgentId);
  else if(c.kind==='paperDrop'&&typeof c.id==='string'&&typeof c.ideaId==='string'&&(c.targetId===null||typeof c.targetId==='string')&&(c.position===null||typeof c.position==='number'))next=dropClipIdea(positioned(),c.id,c.ideaId,c.targetId,c.position,randomUUID(),width);
  else if(c.kind==='select'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=selectClipIdea(snapshot,c.id,c.ideaId);
  else if(c.kind==='split'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=splitClip(positioned(),c.id,c.ideaId,randomUUID(),width);
  else if(c.kind==='splitAll'&&typeof c.id==='string'){
   const clip=snapshot.clips.find(x=>x.id===c.id);if(!clip||clip.ideaIds.length<2)return invalid(t("没有可拆出的便签。"));
   next={ok:true,value:positioned()};for(const id of clip.ideaIds.slice(1)){if(!next.ok)break;next=splitClip(next.value,c.id,id,randomUUID(),width);}
  }else if(c.kind==='archiveAll'&&typeof c.id==='string'){
   const clip=snapshot.clips.find(x=>x.id===c.id);if(!clip)return invalid(t("找不到夹子。"));next={ok:true,value:snapshot};for(const id of clip.ideaIds){if(!next.ok)break;next=changeStatus(next.value,id,'archived',new Date().toISOString());}
  }else if(c.kind==='undo'){
   if(!oldUndo||oldUndo.revision!==revision)return invalid(t("没有可撤销的夹子操作。"));next=oldUndo.positionsOnly?{ok:true,value:{...snapshot,clips:oldUndo.snapshot.clips.flatMap(old=>{const current=snapshot.clips.find(c=>c.id===old.id);return current?[{...current,position:old.position}]:[]})}}:{ok:true,value:{...oldUndo.snapshot,revision}};
  }else return invalid(t("夹子操作无效"));
  const repositioned=next.ok&&['split','splitAll','undo'].includes(c.kind)&&next.value.clips.some(clip=>{const old=previous.clips.find(old=>old.id===clip.id);return old&&old.position!==clip.position;});
  const r=await save(next,revision,()=>{if(c.kind==='arrange'||c.kind==='undo'&&oldUndo?.positionsOnly||repositioned)arrangeSession++;});
  if(r.ok){placementNotice=['arrange','split','splitAll'].includes(c.kind)&&layoutClips(snapshot.clips,width).overflow.length?t("已保存，绳上暂时放不下，可在念头日历查看"):null;if(c.kind==='split'){manageSelection=c.ideaId;manageSession++;}undoClips=c.kind==='undo'?null:c.kind==='select'?(oldUndo?{...oldUndo,revision:r.value.revision}:null):{snapshot:previous,revision:r.value.revision,positionsOnly:c.kind==='arrange'};publish();}
  return r;
 });
 ipcMain.handle('thoughtline:clip',async(e,c:ClipMutation,revision:number)=>{
  if(!trusted(e,[shelf,manage])||!c||typeof c!=='object')return invalid(t('无效操作'));
  return applyClipChange(c,revision);
 });
 await loadView(shelf,'shelf');
 globalShortcut.register(snapshot.settings.writeHotkey,()=>{openComposer();});
 const trayPath=join(__dirname,'../../assets/'+(process.platform==='darwin'?'trayTemplate.png':'tray-win.ico'));
 if(process.platform==='darwin'){
  const icon=nativeImage.createFromPath(trayPath);
  if(icon.isEmpty())throw Error('Thoughtline tray icon failed to load.');
  icon.setTemplateImage(true);tray=new Tray(icon);
 }else tray=new Tray(trayPath);
 tray.setToolTip(t("晾念头 / Thoughtline"));
 refreshTray=()=>{tray.setToolTip(t('晾念头 / Thoughtline'));tray.setContextMenu(Menu.buildFromTemplate([{label:t("晾念头 / Thoughtline"),enabled:false},{label:t('trayWrite',{hotkey:displayWriteHotkey(snapshot.settings.writeHotkey,host.platform).replace('空格',t('空格')),failure:globalShortcut.isRegistered(snapshot.settings.writeHotkey)?'':t('（注册失败）')}),enabled:!composer?.isVisible()&&!(manage?.isVisible()&&manageMode==='settings'),click:()=>{void openComposer();}},{type:'separator'},{label:t("查找 / 已收起"),enabled:!composer?.isVisible(),click:browseFromTray},{label:t("筛选 Agent"),submenu:agentFilterMenu()},{label:t("设置"),enabled:!composer?.isVisible(),click:()=>{openSettings();}},{label:t("暂停悬停"),type:'checkbox',checked:edge.isManuallyPaused(),click:item=>{cancelDrag();edge.pause(item.checked);}},{label:t("退出"),click:()=>app.quit()}]));};
 refreshTray();
 nativeTheme.on('updated',publish);powerMonitor.on('suspend',()=>{cancelDrag();edge.pause(true,'sleep');});powerMonitor.on('lock-screen',()=>{cancelDrag();edge.pause(true,'lock');});powerMonitor.on('resume',()=>edge.pause(false,'sleep'));powerMonitor.on('unlock-screen',()=>edge.pause(false,'lock'));
 const clampManage=()=>{cancelDrag();if(manage?.isVisible())setManageBounds(manage.getBounds());};
 screen.on('display-metrics-changed',clampManage);screen.on('display-removed',clampManage);app.dock?.hide();publish();edge.start();
}).catch(error=>{console.error(error);dialog.showErrorBox(t("晾念头启动未成功"),error instanceof Error?error.message:t("启动发生错误，请保留数据后重试。"));app.quit();});
app.on('before-quit',event=>{
 if(!quitting&&prepareQuit){
  event.preventDefault();if(quitInFlight)return;quitInFlight=true;
  void prepareQuit().then(ok=>{quitInFlight=false;if(ok){quitting=true;app.quit();}}).catch(()=>{quitInFlight=false;composer?.webContents.send('thoughtline:quit-error',t("退出未成功，文字已保留，请重试。"));});return;
 }
 quitting=true;edge?.stop();globalShortcut.unregisterAll();
});
app.on('window-all-closed',()=>{if(quitting)app.quit();});
