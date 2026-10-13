import {mergeInto,mergeTargets,splitArchived} from '../shared/stackCommands';
import {addProject,renameProject,setClassificationActive,rememberIdeaProject} from '../shared/classification';
import {shelfCapacity,fixedRope,fixedRopeY} from '../shared/ropeGeometry';
import {filteredClips,matchesShelfFilter,type ShelfFilter} from '../shared/ideaVisibility';
import {canMergeClips,canMergeIdea} from '../shared/clipModel';
import {validPaper,validRope} from '../shared/appearance';
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
import {AUTHOR_GITHUB_URL,FEEDBACK_EMAIL,FEEDBACK_MAILTO} from '../shared/contact';
import {loadStorageDirectory,loadStorageLocation,commitStorageDirectory,migrateStorage,exportBackup as writeBackup} from './store/storageLocations';
import {saveThoughtDocument} from './store/ideaExport';
import {swapShortcut} from './shortcuts';
import {validWriteHotkey,displayWriteHotkey} from '../shared/composerKeys';
import {changeStatus,addAgent,updateAgent,removeAgent,removeProject,editIdeaIfUnchanged,deleteIdea,restoreIdea,permanentlyDeleteIdea} from '../shared/ideaCommands';
import type {Draft,Result,Snapshot} from '../shared/contracts';
import type {PilotInfo,HitLayout,ComposerContext,AgentMutation,ClipMutation,ClassificationTab,ClassificationMutation,EditorReturnDraft} from '../shared/bridge';
import {mergeClips,splitClip,moveClip,selectClipIdea,dropClipIdea,arrangeClips} from '../shared/clipCommands';
import {captureClipPositions,layoutClips,clipMetrics} from '../shared/clipLayout';
import {placeIdea,placementPlan,undoPlacement,backfillIdeas,setShelfCapacity,type PlacementIntent,type PlacementSource,type PlacementUndo} from '../shared/ideaPlacement';
import {ReminderScheduler,markReminders,setIdeaReminder,type ReminderClaim} from '../shared/reminders';
import {validReminder,validReminderTime} from '../shared/reminderTime';
import {ReminderNotifications,notificationAccess} from './reminderNotifications';
import {ReminderFallback} from '../shared/reminderFallback';
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
 let manageSafeToRelease=false;
 let manageReadyRequest=0;let composerSession=0,manageSession=0,manageSelection:string|null=null;
 let manageEditingOwner:{session:number;ideaId:string}|null=null,manageEditingRequested=false;
 let dragCancelSession=0,dragEscape=false;let textDragTimer:ReturnType<typeof setTimeout>|null=null;let textDragOwner:string|null=null;
 let placementNotice:string|null=null;let placementNoticeId=0;let placementNoticeKind:'info'|'error'='info';
 const setPlacementNotice=(message:string|null,error=false)=>{placementNotice=message;placementNoticeId++;placementNoticeKind=error?'error':'info';};let shelfAgentId='all';let shelfProject:string|null=null;let shelfFilterPicker:PilotInfo['shelfFilterPicker']=null;let shelfMergePicker:PilotInfo['shelfMergePicker']=null;let mergePickerBusy=false;let filterSession=0;let settingsBusy=false;let storageBusy=false;let refreshTray=()=>{};
 let geometryTimer:ReturnType<typeof setTimeout>|null=null,boundsIgnoreUntil=0;
 let classificationTab:ClassificationTab='projects',classificationOrigin:'composer'|'calendar'='calendar',classificationReturnBounds:Electron.Rectangle|null=null;
 let classificationReturnContext:{mode:'browse'|'detail';selection:string|null;editing:boolean;titles:boolean;raw?:EditorReturnDraft}|null=null;
 let restoredEditor:EditorReturnDraft|undefined;
 let classificationChange:PilotInfo['classificationChange'];let classificationSequence=0;
 let manageMode:'browse'|'detail'|'settings'|'classification'='browse',manageTitles=false;let undoClips:{snapshot:Snapshot;revision:number;positionsOnly?:boolean;command?:ClipMutation['kind'];placement?:PlacementUndo;placementKind?:'hang'|'arrange'|'swap'}|null=null;
 let composerContext:ComposerContext={mode:'new',ideaId:null,draft:snapshot.draft??blank};
 const preload=join(__dirname,'../preload/index.js');shelf=createShelf(preload);
 const host=createHost(shelf,()=>composer);
 let preferenceCommit:{version:number;sequence:number;sender:number}|null=null;
 let reminderFallback:ReminderFallback|null=null;
 const currentUndoLabel=():PilotInfo['undoActionLabel']=>{if(!undoClips||undoClips.revision!==snapshot.revision)return null;if(undoClips.placementKind==='swap')return '撤销换上';if(undoClips.placementKind==='hang'||undoClips.placementKind==='arrange')return '撤销挂上';if(['archiveIdea','archiveAll'].includes(undoClips.command??''))return '撤销收起';if(['merge','mergeTarget','paperDrop'].includes(undoClips.command??''))return '撤销合并';if(['split','splitAll'].includes(undoClips.command??''))return '撤销拆分';return '撤销整理';};
 const info=(viewer?:number):PilotInfo=>({restoredEditor,lightReminder:reminderFallback?.current??null,preferenceCommit:preferenceCommit?{version:preferenceCommit.version,sequence:preferenceCommit.sequence,own:preferenceCommit.sender===viewer}:null,preferences:preferences.current,preferenceError:preferences.error,platform:host.platform,snapshot,displayId,width,dark:nativeTheme.shouldUseDarkColors,composerSession,composerDraftSequence:draftSequence,composerMaterial:currentComposerMaterial(composer?.isFocused()??false),composerContext,placementNotice,placementNoticeId,placementNoticeKind,arrangeSession,manageVisit,calendarReturning,manageSession,manageReadyRequest,manageSelection,manageMode,classificationTab,classificationOrigin,classificationChange,manageTitles,manageMaterial:currentComposerMaterial(manage?.isFocused()??false),manageEditingRequested,canUndoClips:!!undoClips,undoActionLabel:currentUndoLabel(),undoPlacementKind:undoClips?.placementKind,dragCancelSession,textDragActive:!!textDragOwner,shelfAgentId,shelfProject,shelfFilterPicker,shelfMergePicker,hotkeyRegistered:globalShortcut.isRegistered(snapshot.settings.writeHotkey),...edge.presentation(),layoutLocked:dragEscape||!!textDragOwner});
 let reminderScheduler:ReminderScheduler|null=null,reminderNotices:ReminderNotifications|null=null;
 const publish=()=>{reminderFallback?.sync();edge.reminder(!!reminderFallback?.current);reminderNotices?.sync();reminderScheduler?.refresh();for(const w of [shelf,composer,manage])if(w&&!w.isDestroyed())w.webContents.send('thoughtline:info-update',info(w.webContents.id));};
 const trusted=(e:Electron.IpcMainInvokeEvent|Electron.IpcMainEvent,allowed:(BrowserWindow|null)[]=[shelf,composer,manage])=>allowed.some(w=>w?.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame;
 const prepareWindow=(w:BrowserWindow|null):Promise<boolean>=>{
  if(!w||w.isDestroyed())return Promise.resolve(true);
  // hideManage is reached only after the renderer acknowledged its save guard.
  // A hidden renderer can suspend on Windows; reuse that acknowledgement until shown again.
  if(w===manage&&manageSafeToRelease&&!w.isVisible())return Promise.resolve(true);
  return new Promise(resolve=>{const id=randomUUID();let finished=false;
   const finish=(ok:boolean)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:leave-ready',receive);resolve(ok);};
   const receive=(event:Electron.IpcMainEvent,requestId:string,ok:boolean)=>{if(requestId===id&&trusted(event,[w]))finish(ok===true);};
   const timer=setTimeout(()=>finish(false),5000);ipcMain.on('thoughtline:leave-ready',receive);w.webContents.send('thoughtline:prepare-leave',id);
  });
 };
 const prepareViews=async()=>await prepareWindow(shelf)&&await prepareWindow(manage);
 // Opening another window keeps Settings mounted, including its unsaved form.
 const prepareWritingViews=async()=>await prepareWindow(shelf)&&(manageMode==='settings'&&!!manage?.isVisible()||await prepareWindow(manage));
 const writerUnavailable=():Result<void>|null=>quitting||quitInFlight?invalid(t("正在退出。")):storageBusy?invalid(t("存储操作正在进行，请稍后重试。")):settingsBusy?invalid(t("正在保存设置，请稍后重试。")):null;
 const lock=(name:string,active:boolean)=>edge.event({type:'lock',name,active,now:Date.now()});
 const hideManage=()=>{manageEditingOwner=null;manageEditingRequested=false;manageSafeToRelease=true;manage?.hide();lock('manage',false);};
 const boundsFor=(w:number,h:number)=>{const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint());const width=Math.min(w,d.workArea.width-40),height=Math.min(h,d.workArea.height-48);return {x:Math.round(d.workArea.x+(d.workArea.width-width)/2),y:d.workArea.y+24,width,height};};
 const workAreas=()=>screen.getAllDisplays().map(d=>d.workArea);
 const paperObstacles=()=>{
  if(!edge.presentation().shelfVisible)return [];const b=shelf.getBounds(),capacity=shelfCapacity(snapshot.settings.shelfCapacity),metrics=clipMetrics(width,capacity),rope=fixedRope(width,capacity);
  return layoutClips(filteredClips(snapshot,{project:shelfProject,agentId:shelfAgentId}),width,capacity).visible.map(p=>({x:b.x+p.x-metrics.cardWidth/2,y:b.y+fixedRopeY(p.x,rope)-12*metrics.scale,width:metrics.cardWidth,height:264*metrics.scale}));
 };
 const setManageBounds=(bounds:Electron.Rectangle,preserve=false)=>{
  const anchor=manage?.isVisible()?manage.getBounds():undefined,preferredArea=screen.getDisplayMatching(anchor??shelf.getBounds()).workArea;
  const fitted=fitManageBounds(bounds,workAreas(),paperObstacles(),{anchor:preserve?undefined:anchor,preferredArea,preserve});boundsIgnoreUntil=Date.now()+500;
  if(manage){manage.setMinimumSize(Math.min(350,fitted.width),Math.min(360,fitted.height));const old=manage.getBounds();if(Object.keys(fitted).some(k=>fitted[k as keyof typeof fitted]!==old[k as keyof typeof old]))manage.setBounds(fitted);}
 };
 const calendarBounds=()=>snapshot.settings.calendarBounds??boundsFor(740,540);
 const manageRequests=new Map<string,Promise<Result<void>>>();
 const coalesceManage=(key:string,work:()=>Promise<Result<void>>)=>{const current=manageRequests.get(key);if(current)return current;const request=work().finally(()=>{if(manageRequests.get(key)===request)manageRequests.delete(key);});manageRequests.set(key,request);return request;};
 const presentManage=async():Promise<Result<void>>=>{
  const window=manage,session=manageSession,mode=manageMode,request=++manageReadyRequest;if(!window||window.isDestroyed()||quitting)return invalid(t('无效操作'));
  window.webContents.setBackgroundThrottling(false);
  const ready=await new Promise<boolean>(resolve=>{let finished=false;const finish=(ok:boolean)=>{if(finished)return;finished=true;clearTimeout(timer);ipcMain.removeListener('thoughtline:view-ready',receive);resolve(ok);};
   const receive=(e:Electron.IpcMainEvent,value:unknown)=>{const state=value as {session:number;mode:string;request:number}|null;if(trusted(e,[window])&&state?.session===session&&state.mode===mode&&state.request===request)finish(true);};
   const timer=setTimeout(()=>finish(false),5000);ipcMain.on('thoughtline:view-ready',receive);publish();
  });
  if(!ready||window!==manage||window.isDestroyed()||manageSession!==session||manageMode!==mode||quitting)return invalid(t('浏览浮层未能打开，请重试。'));
  window.show();window.focus();return done();
 };
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
 const closeConfirmedComposer=()=>{draftWritableSession=null;composerSafeToRelease=true;host.closeComposer();refreshTray();};
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
  const w=createManage(preload);manage=w;manageSafeToRelease=false;
  w.on('close',event=>{if(!quitting){event.preventDefault();void prepareWindow(w).then(ok=>{if(ok){hideManage();if(manageMode==='classification'&&classificationOrigin==='composer'){composer?.show();composer?.focus();}}else{w.show();w.focus();}});}});
  w.on('focus',publish);w.on('blur',publish);
  w.on('will-move',()=>{boundsIgnoreUntil=0;});w.on('will-resize',()=>{boundsIgnoreUntil=0;});
  w.on('move',queueCalendarGeometry);w.on('resize',queueCalendarGeometry);
  w.on('show',()=>{manageSafeToRelease=false;if(manageRelease)clearTimeout(manageRelease);manageRelease=null;refreshTray();});
  w.on('hide',()=>{w.webContents.setBackgroundThrottling(true);refreshTray();if(manageEditingOwner){w.show();w.focus();return;}manageRelease=setTimeout(()=>{manageRelease=null;if(!w.isDestroyed()&&!w.isVisible()&&!manageEditingOwner){manage=null;w.destroy();}},30000);});
  manageLoading=loadView(w,'manage').then(()=>w).catch(error=>{manage=null;w.destroy();throw error;}).finally(()=>{manageLoading=null;});
  return manageLoading;
 };
 app.on('will-quit',()=>{if(composerRelease)clearTimeout(composerRelease);if(manageRelease)clearTimeout(manageRelease);if(geometryTimer)clearTimeout(geometryTimer);});
 const openComposer=async(sourceId?:string):Promise<Result<void>>=>{
  if(composerLoading)return done();
  if(composer?.isVisible()){
   composer.show();composer.focus();return done();
  }
  const blocked=writerUnavailable();if(blocked)return blocked;
  if(composer&&!composerSafeToRelease){
   if(!await prepareWritingViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
   const blocked=writerUnavailable();if(blocked)return blocked;
   lock('composer',true);host.showComposer(boundsFor(COMPOSER_SIZE.width,COMPOSER_SIZE.height));
   return done();
  }
  if(!await prepareWritingViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  const source=snapshot.ideas.find(i=>i.id===sourceId&&i.status!=='deleted');
  composerContext={mode:'new',ideaId:null,draft:snapshot.draft??{...blank,...(source?{agentId:source.agentId,project:source.project}:{})}};
  composerSession++;draftWritableSession=composerSession;draftSequence=0;try{await ensureComposer();}catch{return {ok:false,code:'IO',message:t("输入浮层未能打开，请重试。原数据已保留。")};}const blockedAfterLoad=writerUnavailable();if(blockedAfterLoad)return blockedAfterLoad;composerSafeToRelease=false;lock('composer',true);publish();host.showComposer(boundsFor(COMPOSER_SIZE.width,COMPOSER_SIZE.height));return done();
 };
 ipcMain.handle('thoughtline:open-composer',(e,sourceId?:string)=>trusted(e)&&(!sourceId||typeof sourceId==='string')?openComposer(sourceId):invalid(t('无效操作')));
 ipcMain.handle('thoughtline:composer-size',(e,height:number,session:number)=>{
  if(!trusted(e,[composer])||session!==composerSession||!composer||!Number.isFinite(height)||height<260||height>600)return invalid(t('无效操作'));
  const bounds=composer.getBounds(),area=screen.getDisplayMatching(bounds).workArea;
  const fitted=Math.round(Math.min(height,Math.max(1,area.height-48)));
  if(bounds.height===fitted)return done();
  try{composer.setBounds({...bounds,y:Math.max(area.y+12,Math.min(bounds.y,area.y+area.height-fitted-12)),height:fitted});return done();}
  catch{return {ok:false,code:'IO',message:t('输入浮层尺寸调整未成功，请重试。')};}
 });
 const save=async(next:Result<Snapshot>,revision:number,onCommitted?:()=>void,allowBackfill=true):Promise<Result<Snapshot>>=>{
  if(!next.ok)return next;
  if(allowBackfill&&next.value.clips.length<snapshot.clips.length)next=backfillIdeas(next.value,width,new Date().toISOString(),shelfAgentId);
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
  if(snapshot.draft&&['text','title','project','agentId','reminderAt'].every(key=>snapshot.draft![key as keyof Draft]===draft[key as keyof Draft]))return {ok:true,value:snapshot};
  const saved=await repository.commit({...snapshot,draft},snapshot.revision);
  if(saved.ok){snapshot=saved.value;composerContext={...composerContext,draft};if(undoClips)undoClips={...undoClips,snapshot:{...undoClips.snapshot,draft},revision:snapshot.revision};publish();}
  return saved;
 }));
 const commitPlacement=async(source:PlacementSource,intent:PlacementIntent,revision:number,reveal=false):Promise<Result<Snapshot>>=>{
  if(!intent||!['save','hang','arrange','swap'].includes(intent.kind))return invalid(t('无效操作'));
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t('内容已变化，请重新操作。')};
  const classification=source.draft??snapshot.ideas.find(i=>i.id===source.id);
  if(intent.kind!=='save'&&classification&&!matchesShelfFilter(classification,{project:shelfProject,agentId:shelfAgentId})&&!reveal)return invalid(t('当前Agent筛选会隐藏这张纸，请选择显示全部Agent后挂上。'));
  if(!source.draft&&intent.kind==='hang'&&snapshot.ideas.find(i=>i.id===source.id)?.status==='hanging'&&placementPlan(snapshot,width,source.id)==='already'){edge.event({type:'peek',now:Date.now()});publish();return {ok:true as const,value:snapshot};}
  const before=snapshot,next=placeIdea(snapshot,source,intent,width,new Date().toISOString());
  const r=await save(next,revision);if(!r.ok)return r;
  setPlacementNotice(null);
  if(intent.kind!=='save'){
   if(reveal){shelfAgentId='all';shelfProject=null;}
   undoClips={snapshot:before,revision:snapshot.revision,placement:{before,after:snapshot,incomingId:source.id},placementKind:intent.kind};
   if(intent.kind==='arrange')arrangeSession++;
   edge.event({type:'peek',now:Date.now()});
  }
  publish();return r;
 };
 ipcMain.handle('thoughtline:submit',async(e,draft:Draft,revision:number,intent?:PlacementIntent,reveal=false)=>composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid(t("无效内容"));
  const createdId=randomUUID();
  if(composerContext.mode!=='new')return invalid(t("已有念头请在原窗口编辑。"));
  const committed=await commitPlacement({draft,id:createdId},intent??{kind:placementPlan(snapshot,width)==='full'?'save':'hang'},revision,reveal===true);if(!committed.ok)return committed;
  closeConfirmedComposer();lock('composer',false);publish();return committed;
 }));
 ipcMain.handle('thoughtline:place-idea',(e,id:string,intent:PlacementIntent,revision:number,reveal=false,session?:number)=>composerWrite(async()=>{
  if(!trusted(e,[manage])||!manage?.isVisible()||session!==manageSession||typeof id!=='string'||!intent||!['hang','arrange','swap'].includes(intent.kind))return invalid(t('无效操作'));
  return commitPlacement({id},intent,revision,reveal===true);
 }));
 ipcMain.handle('thoughtline:close',(e,draft:Draft)=>composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[composer])||!draftShape(draft))return invalid(t("无效操作"));
  const saved=await save({ok:true,value:{...snapshot,draft}},snapshot.revision);if(!saved.ok)return saved;
  closeConfirmedComposer();lock('composer',false);return saved;
 }));
 ipcMain.handle('thoughtline:open-manage',async(e,id?:string,titles?:boolean):Promise<Result<void>>=>{
  if(!trusted(e)||id!==undefined&&typeof id!=='string'||titles!==undefined&&typeof titles!=='boolean')return invalid(t("无效操作"));
  if(id&&!snapshot.ideas.some(x=>x.id===id))return invalid(t("找不到这条念头。"));
  return coalesceManage('manage:'+String(id??'calendar')+':'+String(titles??false),async()=>{
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:t("浏览浮层未能打开，请重试。")};}if(quitting)return invalid(t("正在退出。"));manageSelection=id??null;manageMode=id?'detail':'browse';manageTitles=!!titles;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);publish();if(id){const d=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()),p=screen.getCursorScreenPoint();const b=boundsFor(420,500);b.x=Math.round(Math.max(d.workArea.x+12,Math.min(d.workArea.x+d.workArea.width-b.width-12,p.x-b.width/2)));b.y=Math.round(Math.max(d.workArea.y+12,Math.min(d.workArea.y+d.workArea.height-b.height-12,p.y+24)));setManageBounds(b);}else setManageBounds(calendarBounds(),!!snapshot.settings.calendarBounds);const shown=await presentManage();refreshTray();return shown;
  });
 });
 const currentFilter=():ShelfFilter=>({project:shelfProject,agentId:shelfAgentId});
 const captureShelfPositions=()=>{const captured=new Map(captureClipPositions(filteredClips(snapshot,currentFilter()),width,'all',shelfCapacity(snapshot.settings.shelfCapacity)).map(c=>[c.id,c]));return snapshot.clips.map(c=>captured.get(c.id)??c);};
 const closeFilterPicker=()=>{if(!shelfFilterPicker)return;shelfFilterPicker=null;lock('filter',false);if(!shelf.isDestroyed()){if(shelf.isFocused())shelf.blur();shelf.setFocusable(false);}publish();};
 const closeMergePicker=()=>{if(!shelfMergePicker||mergePickerBusy)return;shelfMergePicker=null;lock('filter',false);if(!shelf.isDestroyed()){if(shelf.isFocused())shelf.blur();shelf.setFocusable(false);}publish();};
 const openMergePicker=(sourceId:string)=>{if(quitting||composer?.isVisible()||!mergeTargets(snapshot,sourceId,'',undefined,width,currentFilter()).length)return;closeFilterPicker();const p=screen.getCursorScreenPoint(),b=shelf.getBounds();shelfMergePicker={x:Math.max(8,Math.min(width-8,p.x-b.x)),y:Math.max(8,Math.min(320,p.y-b.y)),session:++filterSession,sourceId};edge.event({type:'peek',now:Date.now()});lock('filter',true);shelf.setFocusable(true);shelf.focus();publish();};
 const selectShelfFilter=async(filter:ShelfFilter):Promise<Result<void>>=>{
  if(!await prepareWindow(shelf))return invalid(t("页码尚未保存，筛选已保留。"));
  shelfProject=filter.project;shelfAgentId=filter.agentId;closeFilterPicker();refreshTray();publish();return done();
 };
 const openFilterPicker=()=>{if(quitting||composer?.isVisible())return;closeMergePicker();const p=screen.getCursorScreenPoint(),b=shelf.getBounds();shelfFilterPicker={x:Math.max(8,Math.min(width-8,p.x-b.x)),y:Math.max(8,Math.min(320,p.y-b.y)),session:++filterSession};edge.event({type:'peek',now:Date.now()});lock('filter',true);shelf.setFocusable(true);shelf.focus();publish();};
 ipcMain.handle('thoughtline:shelf-filter',async(e,filter:unknown)=>{
  if(!trusted(e,[shelf])||!filter||typeof filter!=='object'||quitting)return invalid(t('无效操作'));
  const f=filter as ShelfFilter;if(!(f.project===null||typeof f.project==='string')||typeof f.agentId!=='string'||f.agentId!=='all'&&!snapshot.agents.some(a=>a.id===f.agentId)||f.project!==null&&f.project!==''&&!(snapshot.projects??[]).includes(f.project))return invalid(t('无效操作'));
  return selectShelfFilter(f);
 });
 ipcMain.handle('thoughtline:close-shelf-filter-picker',e=>{if(!trusted(e,[shelf]))return invalid(t('无效操作'));closeFilterPicker();return done();});
 shelf.on('blur',()=>{closeFilterPicker();closeMergePicker();});
 const browseFromTray=()=>{void openBrowse();};
 const openBrowse=async()=>{
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return invalid(t("浏览浮层未能打开，请重试。"));}
  if(quitting)return invalid(t("正在退出。"));
  manageMode='browse';manageSelection=null;manageTitles=false;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);setManageBounds(calendarBounds(),!!snapshot.settings.calendarBounds);publish();const shown=await presentManage();refreshTray();return shown;
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
  const hasMergeTargets=mergeTargets(snapshot,id,'',undefined,width,currentFilter()).length>0;
  const runClip=(change:ClipMutation)=>{void (async()=>{if(!await prepareViews())return;cancelDrag();const r=await applyClipChange(change,snapshot.revision);if(!r.ok){setPlacementNotice(r.message,true);publish();}})();};
  const undoLabel=currentUndoLabel(),primaryUndo=undoLabel==='撤销换上'||undoLabel==='撤销挂上';
  const menu=Menu.buildFromTemplate([
   {label:t("新建念头"),accelerator:snapshot.settings.writeHotkey,click:()=>{void openComposer(id);}},
   ...(primaryUndo?[{label:t(undoLabel!),click:()=>runClip({kind:'undo'})}]:[]),
   {type:'separator'},
   {label:t('只看分组',{name:idea.project||t('未分组')}),type:'checkbox',checked:shelfProject===idea.project,click:()=>{void selectShelfFilter({project:shelfProject===idea.project?null:idea.project,agentId:shelfAgentId});}},
   {label:t("筛选 Agent"),click:openFilterPicker},
   {label:t('显示全部'),enabled:shelfProject!==null||shelfAgentId!=='all',click:()=>{void selectShelfFilter({project:null,agentId:'all'});}},
   {label:t("查找 / 已收起"),click:browseFromTray},
   {type:'separator'},
   {label:t('整理'),submenu:[
    {label:t('收起'),click:()=>runClip({kind:'archiveIdea',ideaId:id})},
    {label:t('合并…'),enabled:hasMergeTargets,click:()=>openMergePicker(id)},
    {label:t('拆分叠放'),enabled:!!clip&&clip.ideaIds.length>1,click:()=>{if(clip)runClip({kind:'split',id:clip.id,ideaId:id});}},
    {label:t('自动整理'),click:()=>runClip({kind:'arrange'})},
    ...(!primaryUndo&&undoLabel?[{type:'separator' as const},{label:t(undoLabel),click:()=>runClip({kind:'undo'})}]:[])
   ]}
  ]);
  let finished=false;
  const finish=()=>{if(finished)return;finished=true;if(activeShelfMenu?.menu!==menu)return;activeShelfMenu=null;if(process.platform==='win32'&&!shelf.isDestroyed()&&!shelfFilterPicker&&!shelfMergePicker){if(shelf.isFocused())shelf.blur();shelf.setFocusable(false);}lock('menu',false);};
  activeShelfMenu={menu,finish};
  try{if(process.platform==='win32'){shelf.setFocusable(true);shelf.focus();}menu.popup({window:shelf,callback:finish});}catch{finish();return invalid(t("菜单未能打开，请从托盘查找念头。"));}return done();
 });
 const openBrowseDetail=async(id:string):Promise<Result<void>>=>{
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return invalid(t("全文浮层未能打开，请重试。"));}
  if(quitting)return invalid(t("正在退出。"));
  manageMode='detail';manageSelection=id;manageTitles=false;manageEditingRequested=false;manageVisit++;calendarReturning=false;manageSession++;lock('manage',true);setManageBounds(boundsFor(420,500));publish();const shown=await presentManage();refreshTray();return shown;
 };
 const reminderCommit=async(next:Snapshot):Promise<Result<Snapshot>>=>{
  const r=await repository.commit(next,snapshot.revision);if(r.ok){snapshot=r.value;if(undoClips)undoClips={...undoClips,revision:snapshot.revision,snapshot:{...undoClips.snapshot,ideas:undoClips.snapshot.ideas.map(i=>{const current=snapshot.ideas.find(c=>c.id===i.id);const {reminder:_old,...rest}=i;return {...rest,...(current?.reminder?{reminder:current.reminder}:{})};})}};publish();}return r;
 };
 ipcMain.handle('thoughtline:notification-access',async(e,request:unknown)=>{if(!trusted(e,[composer,manage])||typeof request!=='boolean'||quitting||request&&![composer,manage].some(w=>w?.isVisible()&&w.webContents.id===e.sender.id))return invalid(t('无效操作'));return {ok:true,value:await notificationAccess(request)};});
 ipcMain.handle('thoughtline:notification-settings',async e=>{if(!trusted(e,[composer,manage]))return invalid(t('无效操作'));try{await shell.openExternal(process.platform==='darwin'?'x-apple.systempreferences:com.apple.preference.notifications':'ms-settings:notifications');return done();}catch{return invalid(t('通知设置未能打开。'));}});
 ipcMain.handle('thoughtline:set-reminder',(e,id:unknown,at:unknown,expected:unknown,session:unknown)=>composerWrite(async():Promise<Result<Snapshot>>=>{
  if(!trusted(e,[manage])||!manage?.isVisible()||quitting||session!==manageSession||typeof id!=='string'||!(at===null||validReminderTime(at))||!(expected===null||validReminder(expected)))return invalid(t('无效操作'));
  const r=setIdeaReminder(snapshot,id,at,expected,new Date().toISOString());return r.ok?reminderCommit(r.value):r;
 }));
 const openReminder=async(id:string):Promise<Result<void>>=>{
  if(quitting||quitInFlight)return invalid(t("正在退出。"));
  if(composer?.isVisible()){
   const draft=await captureDraft();const r=draft.ok?await composerWrite(()=>save({ok:true,value:{...snapshot,draft:draft.value}},snapshot.revision)):draft;
   composer?.webContents.send('thoughtline:quit-error',r.ok?'':r.message);if(!r.ok)return r;closeConfirmedComposer();
  }
  if(snapshot.ideas.some(i=>i.id===id&&i.status!=='deleted'))return openBrowseDetail(id);
  return invalid(t('找不到这条念头。'));
 };
 reminderNotices=new ReminderNotifications(()=>snapshot,()=>preferences.current.locale,async id=>{await openReminder(id);});
 reminderFallback=new ReminderFallback(()=>snapshot,publish);
 ipcMain.handle('thoughtline:reminder-action',async(e,key:unknown,open:unknown)=>{
  if(!trusted(e,[shelf])||typeof key!=='string'||typeof open!=='boolean'||quitting)return invalid(t('无效操作'));
  const id=reminderFallback!.target(key);if(!id)return invalid(t('找不到这条念头。'));
  const r=open?await openReminder(id):done();if(r.ok)reminderFallback!.dismiss(key);return r;
 });
 const consumeReminders=(claims:ReminderClaim[],state:'notified'|'missed'|'failed',now:string)=>composerWrite(async()=>{if(quitting)return false;const r=await reminderCommit(markReminders(snapshot,claims,state,now));return r.ok;});
 reminderScheduler=new ReminderScheduler({snapshot:()=>snapshot,consume:(c,s,n)=>consumeReminders(c,s,n),failed:async(c,n)=>{if(await consumeReminders(c,'failed',n)&&!quitting)reminderFallback!.show(c);},notify:(ids,missed)=>reminderNotices!.show(ids,missed),onError:()=>{/* A persisted scheduled reminder remains retryable after a storage failure. */}});
 app.on('will-quit',()=>{reminderScheduler?.stop();reminderFallback?.stop();});
 const returnClassification=async():Promise<Result<void>>=>{
  if(manageMode!=='classification'||!await prepareWindow(manage))return invalid(t('最后修改尚未保存，窗口已保留。'));
  if(classificationOrigin==='composer'){hideManage();composer?.show();composer?.focus();}
  else{const context=classificationReturnContext;manageMode=context?.mode??'browse';manageSelection=context?.selection??null;manageEditingRequested=context?.editing??false;manageTitles=context?.titles??false;calendarReturning=manageMode==='browse';manageSession++;const raw=context?.raw,record=raw&&snapshot.ideas.find(i=>i.id===raw.ideaId&&i.status!=='deleted');restoredEditor=raw&&record?{...raw,session:manageSession,draft:{...raw.draft,agentId:record.agentId,project:record.project}}:undefined;setManageBounds(classificationReturnBounds??calendarBounds(),true);const shown=await presentManage();if(!shown.ok)return shown;}
  return done();
 };
 ipcMain.handle('thoughtline:open-classification',async(e,tab:ClassificationTab,returnDraft?:EditorReturnDraft)=>{
  if(!trusted(e,[composer,manage])||!['tags','projects','removed'].includes(tab)||quitting||settingsBusy||storageBusy)return invalid(t('无效操作'));
  if((trusted(e,[composer])&&composer?.isVisible()&&!await prepareWindow(composer))||!await prepareWindow(manage))return invalid(t('最后修改尚未保存，窗口已保留。'));
  const editor=manageEditingOwner?.session===manageSession?manageEditingOwner:null;
  if(returnDraft&&(!trusted(e,[manage])||returnDraft.session!==manageSession||returnDraft.ideaId!==editor?.ideaId||!draftShape(returnDraft.draft)))return invalid(t('编辑会话已结束。'));
  const origin=trusted(e,[composer])?'composer' as const:'calendar' as const;
  classificationReturnContext=origin==='calendar'&&manageMode!=='settings'&&manageMode!=='classification'?{mode:manageMode,selection:editor?.ideaId??manageSelection,editing:!!editor,titles:manageTitles,raw:returnDraft}:null;
  classificationReturnBounds=origin==='calendar'&&manage?.isVisible()?manage.getBounds():null;
  await ensureManage();classificationOrigin=origin;classificationTab=tab;manageMode='classification';manageSelection=null;manageEditingRequested=false;manageEditingOwner=null;manageSession++;lock('manage',true);setManageBounds(boundsFor(740,570));publish();return presentManage();
 });
 ipcMain.handle('thoughtline:return-classification',e=>trusted(e,[manage])?returnClassification():invalid(t('无效操作')));
 ipcMain.handle('thoughtline:close-manage',async e=>{if(!trusted(e,[manage]))return invalid(t("无效操作"));if(manageMode==='classification'&&classificationOrigin==='composer')return returnClassification();if(!await prepareWindow(manage))return invalid(t("最后修改尚未保存，窗口已保留。"));hideManage();return done();});
 const openSettings=(fromCalendar=false):Promise<Result<void>>=>coalesceManage('settings:'+fromCalendar,async()=>{
  const blocked=writerUnavailable();if(blocked)return blocked;
  if(!await prepareViews())return invalid(t("最后修改尚未保存，窗口已保留。"));
  try{await ensureManage();}catch{return {ok:false,code:'IO',message:t("设置浮层未能打开，请重试。")};}const blockedAfterLoad=writerUnavailable();if(blockedAfterLoad)return blockedAfterLoad;calendarReturnBounds=fromCalendar&&manage?.isVisible()?manage.getBounds():null;if(!fromCalendar)manageVisit++;calendarReturning=false;cancelDrag();manageMode='settings';manageTitles=false;manageSelection=null;manageEditingRequested=false;manageSession++;lock('manage',true);setManageBounds(boundsFor(500,600));publish();const shown=await presentManage();refreshTray();return shown;
 });
 ipcMain.handle('thoughtline:open-settings',e=>trusted(e)?openSettings(trusted(e,[manage])&&manageMode==='browse'&&!!manage?.isVisible()):invalid(t("无效操作")));
 ipcMain.handle('thoughtline:return-calendar',async e=>{
  if(!trusted(e,[manage])||manageMode!=='settings'||settingsBusy||storageBusy)return invalid(t('无效操作'));
  if(!await prepareWindow(manage))return invalid(t('最后修改尚未保存，窗口已保留。'));
  calendarReturning=calendarReturnBounds!==null;manageMode='browse';manageSelection=null;manageEditingRequested=false;manageSession++;setManageBounds(calendarReturnBounds??calendarBounds(),true);calendarReturnBounds=null;publish();return presentManage();
 });
 const storageState=()=>({directory:dataDir,profileDirectory:profileDir,revision:snapshot.revision});
 ipcMain.handle('thoughtline:contact-action',async(e,action:unknown)=>{
  if(!trusted(e,[manage])||!manage?.isVisible()||manageMode!=='settings'||quitting||!['github','email','copy-email'].includes(action as string))return invalid(t('无效操作'));
  try{if(action==='copy-email')clipboard.writeText(FEEDBACK_EMAIL);else await shell.openExternal(action==='github'?AUTHOR_GITHUB_URL:FEEDBACK_MAILTO);return done();}
  catch{return invalid(t(action==='copy-email'?'邮箱复制未成功，请重试。':'未能打开联系入口，请稍后重试。'));}
 });
 ipcMain.handle('thoughtline:storage-info',e=>trusted(e,[manage])?{ok:true,value:storageState()}:invalid(t("无效操作")));
 ipcMain.handle('thoughtline:open-storage-directory',async e=>{
  if(!trusted(e,[manage]))return invalid(t("无效操作"));
  const valid=await loadStorageDirectory(profileDir);if(!valid.ok)return valid;
  try{const error=await shell.openPath(dataDir);return error?invalid(error):done();}catch{return invalid(t("无法打开当前念头目录。"));}
 });
 const storageOperation=async(e:Electron.IpcMainInvokeEvent,kind:'migrate'|'backup')=>{
  if(!trusted(e,[manage])||storageBusy||quitting)return invalid(t("存储操作正在进行，请稍后重试。"));
  if(kind==='migrate'&&composer?.isVisible())return invalid(t("请先保存草稿并关闭新建窗口，再更改数据位置。"));
  storageBusy=true;refreshTray();
  try{
   // Storage operations keep Settings mounted; its busy/dirty close guard is not a navigation request.
   const ready=await prepareWindow(shelf)&&(manageMode==='settings'||await prepareWindow(manage));
   if(!ready)return invalid(t("最后修改尚未保存或输入法尚未确认，仍使用原位置。"));
   if(kind==='backup'&&composer?.isVisible()&&!await prepareWindow(composer))return invalid(t("草稿尚未保存或输入法尚未确认，备份未生成。请完成输入后重试。"));
   const choice=await dialog.showOpenDialog(manage!,{title:kind==='migrate'?t("选择新的空念头文件夹"):t("选择独立备份的保存文件夹"),properties:['openDirectory','createDirectory']});
   if(choice.canceled||!choice.filePaths[0])return {ok:true,value:{...storageState(),canceled:true}};
   // The user can keep typing in the other window while choosing a folder.
   if(kind==='backup'&&composer?.isVisible()&&!await prepareWindow(composer))return invalid(t("草稿尚未保存或输入法尚未确认，备份未生成。请完成输入后重试。"));
   return await composerWrite(async()=>{
    if(!trusted(e,[manage])||quitting)return invalid(t("操作窗口已关闭。"));
    await repository.flush();
    if(kind==='migrate'&&composer?.isVisible())return invalid(t("请先保存草稿并关闭新建窗口，再更改数据位置。"));
    if(kind==='backup'){
     const result=await writeBackup(dataDir,choice.filePaths[0],snapshot,app.getVersion());
     return result.ok?{ok:true,value:{...storageState(),directory:result.value,canceled:false}}:result;
    }
    const result=await migrateStorage(dataDir,choice.filePaths[0],snapshot,path=>commitStorageDirectory(profileDir,path));
    if(!result.ok)return result;
    dataDir=result.value.directory;repository=result.value.repository;snapshot=result.value.snapshot;undoClips=null;publish();
    return {ok:true,value:{...storageState(),canceled:false}};
   });
  }catch(error){return invalid(`操作未完成，仍使用原位置。${error instanceof Error?error.message:''}`);}finally{storageBusy=false;refreshTray();}
 };
 ipcMain.handle('thoughtline:change-storage',e=>storageOperation(e,'migrate'));
 ipcMain.handle('thoughtline:export-backup',e=>storageOperation(e,'backup'));
 ipcMain.handle('thoughtline:export-thoughts',async(e,format:unknown)=>{
  if(!trusted(e,[manage])||!manage?.isVisible()||manageMode!=='settings'||quitting||storageBusy||!['txt','docx'].includes(format as string))return invalid(t('无效操作'));
  const kind=format as 'txt'|'docx',locale=preferences.current.locale;
  storageBusy=true;refreshTray();
  try{
   if(!await prepareWindow(shelf)||composer?.isVisible()&&!await prepareWindow(composer))return invalid(t('最后修改尚未保存或输入法尚未确认，请完成输入后再导出。'));
   if(!snapshot.ideas.some(idea=>idea.status==='hanging'||idea.status==='archived'))return invalid(t('暂无可导出的念头。'));
   const stamp=new Date(),name=(locale==='en'?'Thoughtline':'晾念头')+'-'+[stamp.getFullYear(),String(stamp.getMonth()+1).padStart(2,'0'),String(stamp.getDate()).padStart(2,'0')].join('-')+'.'+kind;
   const choice=await dialog.showSaveDialog(manage,{title:t(kind==='txt'?'导出 TXT':'导出 DOCX'),defaultPath:join(app.getPath('downloads'),name),filters:[{name:kind==='txt'?'TXT':'DOCX',extensions:[kind]}],properties:['createDirectory','showOverwriteConfirmation']});
   if(choice.canceled||!choice.filePath)return {ok:true,value:{canceled:true}};
   if(composer?.isVisible()&&!await prepareWindow(composer))return invalid(t('最后修改尚未保存或输入法尚未确认，请完成输入后再导出。'));
   return await composerWrite(async()=>{
    if(!trusted(e,[manage])||!manage?.isVisible()||manageMode!=='settings'||quitting)return invalid(t('操作窗口已关闭。'));
    await repository.flush();
    const result=await saveThoughtDocument(structuredClone(snapshot),choice.filePath!,kind,locale,new Date());
    return result.ok?{ok:true,value:{canceled:false,...result.value}}:result;
   });
  }catch{return invalid(t('导出未完成，请检查保存位置、剩余空间或文件是否被占用后重试。'));}
  finally{storageBusy=false;refreshTray();}
 });
 ipcMain.handle('thoughtline:settings',async(e,settings:Snapshot['settings'],revision:number):Promise<Result<Snapshot>>=>{
  if(!trusted(e,[manage])||manageMode!=='settings'||!settings||!validWriteHotkey(settings.writeHotkey)||typeof settings.reducedMotion!=='boolean'||settings.shelfCapacity!==undefined&&![4,6,8].includes(settings.shelfCapacity))return invalid(t("请录制有效的组合快捷键。"));
  if(settings.rope!==undefined&&!validRope(settings.rope)||settings.paper!==undefined&&!validPaper(settings.paper))return invalid(t('设置无效。'));
  return composerWrite(async()=>{
  if(settingsBusy)return invalid(t("正在保存设置，请稍后重试。"));
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t("设置已变化，请核对后重试。")};
  settingsBusy=true;refreshTray();let committed:Result<Snapshot>=invalid(t("快捷键已被占用，请录制其他组合；原键位保持。"));
  try{
   const changed=await swapShortcut(globalShortcut,snapshot.settings.writeHotkey,settings.writeHotkey,()=>{openComposer();},async()=>{
    const capacity=setShelfCapacity(snapshot,shelfCapacity(settings.shelfCapacity),width,new Date().toISOString(),shelfAgentId);
    committed=await save(capacity.ok?{ok:true,value:{...capacity.value,settings:{...capacity.value.settings,writeHotkey:settings.writeHotkey,reducedMotion:settings.reducedMotion,...(settings.rope===undefined?{}:{rope:settings.rope}),...(settings.paper===undefined?{}:{paper:settings.paper})}}}:capacity,revision);return committed;
   });
   if(!changed.ok)return changed.error?.ok===false?changed.error:committed;
   refreshTray();publish();return committed;
  }finally{settingsBusy=false;refreshTray();}
  });
 });
 ipcMain.handle('thoughtline:open-edit',async(e,id:string)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||!snapshot.ideas.some(i=>i.id===id&&i.status!=='deleted'))return invalid(t("找不到这条念头。"));
  if(trusted(e,[manage])&&manageMode==='detail'&&manageSelection===id){manageEditingRequested=true;publish();return done();}
  const opened=await openBrowseDetail(id);if(opened.ok){manageEditingRequested=true;publish();}return opened;
 });
 ipcMain.handle('thoughtline:set-editing',(e,active:boolean,session:number,ideaId:string):Result<void>=>{
  if(!trusted(e,[manage])||typeof active!=='boolean'||session!==manageSession||typeof ideaId!=='string')return invalid(t("编辑会话已结束。"));
  if(active){if(!snapshot.ideas.some(i=>i.id===ideaId&&i.status!=='deleted'))return invalid(t("找不到这条念头。"));manageEditingOwner={session,ideaId};if(restoredEditor?.session===session&&restoredEditor.ideaId===ideaId)restoredEditor=undefined;}
  else if(manageEditingOwner?.session===session&&manageEditingOwner.ideaId===ideaId)manageEditingOwner=null;
  publish();return done();
 });
 ipcMain.handle('thoughtline:update-idea',(e,id:string,draft:Draft,expectedDraft:Draft,session:number)=>{
  if(!trusted(e,[manage])||typeof id!=='string'||!draftShape(draft)||!draftShape(expectedDraft)||session!==manageSession||!manage?.isVisible())return Promise.resolve(invalid<Snapshot>(t("编辑会话已结束，文字仍在窗口中。")));
  return composerWrite(async():Promise<Result<Snapshot>>=>{
   if(!trusted(e,[manage])||session!==manageSession||!manage?.isVisible()||manageEditingOwner?.session!==session||manageEditingOwner.ideaId!==id)return invalid(t("编辑会话已结束，文字仍在窗口中。"));
   const priorClips=new Set(snapshot.clips.map(c=>c.id));
   const priorUndo=undoClips;
   const saved=await save(editIdeaIfUnchanged(snapshot,id,draft,expectedDraft,new Date().toISOString(),width),snapshot.revision);
   if(saved.ok&&priorUndo?.placement&&undoPlacement(snapshot,priorUndo.placement).ok){undoClips={...priorUndo,revision:snapshot.revision};publish();}
   if(saved.ok&&snapshot.clips.some(c=>!priorClips.has(c.id)&&c.ideaIds.includes(id))){
    setPlacementNotice(layoutClips(snapshot.clips,width,shelfCapacity(snapshot.settings.shelfCapacity)).overflow.some(c=>c.ideaIds.includes(id))?t("已保存，绳上暂时放不下，可在念头日历查看"):null);publish();
   }
   return saved;
  });
 });
 ipcMain.handle('thoughtline:idea-history',(e,id:string,kind:'delete'|'restore'|'permanent',revision:number)=>{
  if(!trusted(e,[manage])||typeof id!=='string'||!['delete','restore','permanent'].includes(kind))return Promise.resolve(invalid<Snapshot>(t("无效操作")));
  return composerWrite(async()=>{
   if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已更新，请重新操作。")};
   const next=kind==='delete'?deleteIdea(snapshot,id,new Date().toISOString(),width):kind==='restore'?restoreIdea({...snapshot,clips:captureClipPositions(snapshot.clips,width,'all',shelfCapacity(snapshot.settings.shelfCapacity))},id,new Date().toISOString(),width):permanentlyDeleteIdea(snapshot,id);
   const r=await save(next,revision);if(r.ok){setPlacementNotice(null);publish();}return r;
  });
 });
 ipcMain.handle('thoughtline:status',async(e,id:string,status:'hanging'|'archived',revision:number)=>{
  if(!trusted(e,[shelf,manage])||typeof id!=='string'||!['hanging','archived'].includes(status))return invalid(t("无效操作"));
  return composerWrite(async()=>{if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已变化，请重新操作。")};
  if(status==='hanging')return commitPlacement({id},{kind:'hang'},revision);
  const before=snapshot;const r=await save(changeStatus({...snapshot,clips:captureClipPositions(snapshot.clips,width,'all',shelfCapacity(snapshot.settings.shelfCapacity))},id,status,new Date().toISOString()),revision);
  if(r.ok&&before.ideas.find(i=>i.id===id)?.status!==status)undoClips={snapshot:before,revision:snapshot.revision,command:'archiveIdea'};
  if(r.ok){setPlacementNotice(null);edge.event({type:'peek',now:Date.now()});publish();}return r;
  });
 });
 ipcMain.handle('thoughtline:agent',(e,c:AgentMutation,revision:number)=>{
  if(!trusted(e,[manage,composer])||!c||typeof c!=='object'||trusted(e,[composer])&&c.kind!=='add')return invalid(t("无效操作"));
  return composerWrite(async()=>{if(revision!==snapshot.revision)return {ok:false as const,code:'CONFLICT' as const,message:t("内容已变化，请重新操作。")};
  let next:Result<Snapshot>;
  if(c.kind==='add'&&typeof c.name==='string'&&typeof c.color==='string')next=addAgent(snapshot,{id:randomUUID(),name:c.name.trim(),color:c.color});
  else if(c.kind==='update'&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.color==='string')next=updateAgent(snapshot,c.id,{name:c.name.trim(),color:c.color});
  else if(c.kind==='remove'&&typeof c.id==='string'&&typeof c.replacement==='string')next=removeAgent(snapshot,c.id,c.replacement);
  else return invalid(t("Agent内容无效"));
  return save(next,revision,()=>{if(c.kind==='remove'){
   if(composerContext.draft.agentId===c.id)composerContext={...composerContext,draft:{...composerContext.draft,agentId:c.replacement}};
   classificationChange={sequence:++classificationSequence,field:'agentId',from:c.id,to:c.replacement};
  }});
  });
 });
 ipcMain.handle('thoughtline:classification',(e,c:ClassificationMutation,revision:number)=>composerWrite(async()=>{
  if(!trusted(e,[composer,manage])||!c||typeof c!=='object'||revision!==snapshot.revision)return invalid(t('内容已变化，请重新操作。'));
  const priorUndo=undoClips;let next:Result<Snapshot>;
  if(c.kind==='active'&&['tag','project'].includes(c.field)&&typeof c.id==='string'&&typeof c.active==='boolean')next=setClassificationActive(snapshot,c.field,c.id,c.active);
  else if(c.kind==='rememberProject'&&trusted(e,[manage])&&c.session===manageSession&&manageEditingOwner?.session===c.session&&manageEditingOwner.ideaId===c.ideaId){
   const project=snapshot.ideas.find(i=>i.id===c.ideaId&&i.status!=='deleted')?.project;
   if(!project||snapshot.projects?.includes(project))return {ok:true,value:snapshot};
   next=rememberIdeaProject(snapshot,c.ideaId);
  }
  else if(c.kind==='addProject')next=addProject(snapshot,c.name);
  else if(c.kind==='renameProject'&&trusted(e,[manage])&&typeof c.from==='string')next=renameProject(snapshot,c.from,c.name,new Date().toISOString());
  else return invalid(t('无效操作'));
  return save(next,revision,()=>{
   // Catalog maintenance does not invalidate a reversible clip arrangement.
   if(priorUndo){const original=priorUndo.snapshot;undoClips={...priorUndo,revision:snapshot.revision,snapshot:{...original,agents:snapshot.agents,projects:snapshot.projects,inactiveProjects:snapshot.inactiveProjects,inactiveAgents:snapshot.inactiveAgents,draft:snapshot.draft,ideas:c.kind==='renameProject'?original.ideas.map(i=>i.project===c.from?{...i,project:c.name.trim()}:i):original.ideas}};}
   if(c.kind==='renameProject'&&next.ok){
   if(shelfProject===c.from)shelfProject=c.name.trim();
   if(composerContext.draft.project===c.from)composerContext={...composerContext,draft:{...composerContext.draft,project:c.name.trim()}};
   classificationChange={sequence:++classificationSequence,field:'project',from:c.from,to:c.name.trim()};
  }});
 }));
 ipcMain.handle('thoughtline:project-delete',(e,project:string,revision:number,replacement='')=>composerWrite(async()=>{
  if(!trusted(e,[composer,manage])||typeof project!=='string'||!project||typeof replacement!=='string')return invalid(t("未分组不能删除。"));
  if(revision!==snapshot.revision)return {ok:false,code:'CONFLICT',message:t("内容已更新，请重新删除分组。")};
  const priorUndo=undoClips,now=new Date().toISOString();
  const saved=await save(removeProject(snapshot,project,now,replacement),revision);
  if(saved.ok){
   if(shelfProject===project)shelfProject=replacement;
   classificationChange={sequence:++classificationSequence,field:'project',from:project,to:replacement};
   if(composerContext.draft.project===project)composerContext={...composerContext,draft:{...composerContext.draft,project:replacement}};
   if(priorUndo){const cleaned=removeProject(priorUndo.snapshot,project,now,replacement);if(cleaned.ok)undoClips={...priorUndo,snapshot:cleaned.value,revision:snapshot.revision};}
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
  const positioned=()=>({...snapshot,clips:captureShelfPositions()});
  if(c.kind==='arrange')next=arrangeClips(snapshot,width);
  else if(c.kind==='archiveIdea'&&typeof c.ideaId==='string')next=changeStatus(positioned(),c.ideaId,'archived',new Date().toISOString());
  else if(c.kind==='mergeTarget'&&typeof c.ideaId==='string'&&typeof c.targetIdeaId==='string')next=mergeInto(positioned(),c.ideaId,c.targetIdeaId,width,new Date().toISOString(),currentFilter());
  else if(c.kind==='merge'&&typeof c.sourceId==='string'&&typeof c.targetId==='string')next=mergeClips(positioned(),c.sourceId,c.targetId,c.currentIdeaId);
  else if(c.kind==='move'&&typeof c.id==='string'&&typeof c.position==='number'&&(c.beforeId===null||typeof c.beforeId==='string'))next=moveClip(positioned(),c.id,c.position,c.beforeId,width,shelfAgentId,shelfProject);
  else if(c.kind==='paperDrop'&&typeof c.id==='string'&&typeof c.ideaId==='string'&&(c.targetId===null||typeof c.targetId==='string')&&(c.position===null||typeof c.position==='number'))next=dropClipIdea(positioned(),c.id,c.ideaId,c.targetId,c.position,randomUUID(),width);
  else if(c.kind==='select'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=selectClipIdea(snapshot,c.id,c.ideaId);
  else if(c.kind==='split'&&typeof c.id==='string'&&typeof c.ideaId==='string')next=[...snapshot.archivedClips??[],...snapshot.capacityOverflow??[]].some(x=>x.id===c.id)?splitArchived(snapshot,c.id,c.ideaId,randomUUID()):splitClip(positioned(),c.id,c.ideaId,randomUUID(),width);
  else if(c.kind==='splitAll'&&typeof c.id==='string'){
   const clip=[...snapshot.clips,...snapshot.archivedClips??[],...snapshot.capacityOverflow??[]].find(x=>x.id===c.id);if(!clip||clip.ideaIds.length<2)return invalid(t("没有可拆出的便签。"));
   next={ok:true,value:positioned()};for(const id of clip.ideaIds.slice(1)){if(!next.ok)break;next=snapshot.clips.some(x=>x.id===c.id)?splitClip(next.value,c.id,id,randomUUID(),width):splitArchived(next.value,c.id,id,randomUUID());}
  }else if(c.kind==='archiveAll'&&typeof c.id==='string'){
   const clip=snapshot.clips.find(x=>x.id===c.id);if(!clip)return invalid(t("找不到夹子。"));next={ok:true,value:snapshot};for(const id of clip.ideaIds){if(!next.ok)break;next=changeStatus(next.value,id,'archived',new Date().toISOString());}
  }else if(c.kind==='undo'){
   if(!oldUndo||oldUndo.revision!==revision)return invalid(t("没有可撤销的夹子操作。"));next=oldUndo.placement?undoPlacement(snapshot,oldUndo.placement):oldUndo.positionsOnly?{ok:true,value:{...snapshot,clips:oldUndo.snapshot.clips.flatMap(old=>{const current=snapshot.clips.find(c=>c.id===old.id);return current?[{...current,position:old.position}]:[]})}}:{ok:true,value:{...oldUndo.snapshot,revision}};
  }else return invalid(t("夹子操作无效"));
  const repositioned=next.ok&&['split','splitAll','undo'].includes(c.kind)&&next.value.clips.some(clip=>{const old=previous.clips.find(old=>old.id===clip.id);return old&&old.position!==clip.position;});
  const r=await save(next,revision,()=>{if(c.kind==='arrange'||c.kind==='undo'&&oldUndo?.positionsOnly||repositioned)arrangeSession++;},c.kind!=='undo');
  if(r.ok){setPlacementNotice(['arrange','split','splitAll'].includes(c.kind)&&layoutClips(snapshot.clips,width,shelfCapacity(snapshot.settings.shelfCapacity)).overflow.length?t("已保存，绳上暂时放不下，可在念头日历查看"):null);if(c.kind==='split'){manageSelection=c.ideaId;manageSession++;}undoClips=c.kind==='undo'?null:c.kind==='select'?(oldUndo?{...oldUndo,revision:r.value.revision}:null):{snapshot:previous,revision:r.value.revision,positionsOnly:c.kind==='arrange',command:c.kind};publish();}
  return r;
 });
 ipcMain.handle('thoughtline:clip',async(e,c:ClipMutation,revision:number)=>{
  if(!trusted(e,[shelf,manage])||!c||typeof c!=='object')return invalid(t('无效操作'));
  return applyClipChange(c,revision);
 });
 ipcMain.handle('thoughtline:close-shelf-merge-picker',e=>{if(!trusted(e,[shelf]))return invalid(t('无效操作'));closeMergePicker();return done();});
 ipcMain.handle('thoughtline:merge-target',async(e,targetId:string,revision:number,session:number)=>{if(!trusted(e,[shelf])||!shelfMergePicker||session!==shelfMergePicker.session||typeof targetId!=='string'||mergePickerBusy)return invalid(t('无效操作'));const context=shelfMergePicker;if(!await prepareViews()||shelfMergePicker?.session!==session)return invalid(t('最后修改尚未保存，窗口已保留。'));mergePickerBusy=true;try{const r=await applyClipChange({kind:'mergeTarget',ideaId:context.sourceId,targetIdeaId:targetId},revision);if(r.ok){mergePickerBusy=false;closeMergePicker();}return r;}finally{mergePickerBusy=false;}});
 await loadView(shelf,'shelf');
 globalShortcut.register(snapshot.settings.writeHotkey,()=>{openComposer();});
 const trayPath=join(__dirname,'../../assets/'+(process.platform==='darwin'?'trayTemplate.png':'tray-win.ico'));
 if(process.platform==='darwin'){
  const icon=nativeImage.createFromPath(trayPath);
  if(icon.isEmpty())throw Error('Thoughtline tray icon failed to load.');
  icon.setTemplateImage(true);tray=new Tray(icon);
 }else tray=new Tray(trayPath);
 tray.setToolTip(t("晾念头 / Thoughtline"));
 refreshTray=()=>{tray.setToolTip(t('晾念头 / Thoughtline'));tray.setContextMenu(Menu.buildFromTemplate([{label:t("晾念头 / Thoughtline"),enabled:false},{label:t('trayWrite',{hotkey:displayWriteHotkey(snapshot.settings.writeHotkey,host.platform).replace('空格',t('空格')),failure:globalShortcut.isRegistered(snapshot.settings.writeHotkey)?'':t('（注册失败）')}),enabled:!composer?.isVisible()&&!settingsBusy&&!storageBusy&&!quitting,click:()=>{void openComposer();}},{type:'separator'},{label:t("查找 / 已收起"),click:browseFromTray},{label:t("筛选 Agent"),click:openFilterPicker},{label:t('显示全部'),enabled:shelfProject!==null||shelfAgentId!=='all',click:()=>{void selectShelfFilter({project:null,agentId:'all'});}},{label:t("设置"),enabled:!settingsBusy&&!storageBusy&&!quitting,click:()=>{openSettings();}},{label:t("暂停悬停"),type:'checkbox',checked:edge.isManuallyPaused(),click:item=>{cancelDrag();edge.pause(item.checked);}},{label:t("退出"),click:()=>app.quit()}]));};
 refreshTray();
 let reminderSleeping=false,reminderLocked=false;const resumeReminders=()=>{if(!reminderSleeping&&!reminderLocked)reminderScheduler?.start();};
 nativeTheme.on('updated',publish);powerMonitor.on('suspend',()=>{reminderSleeping=true;reminderScheduler?.stop();cancelDrag();edge.pause(true,'sleep');});powerMonitor.on('lock-screen',()=>{reminderLocked=true;reminderScheduler?.stop();cancelDrag();edge.pause(true,'lock');});powerMonitor.on('resume',()=>{reminderSleeping=false;edge.pause(false,'sleep');resumeReminders();});powerMonitor.on('unlock-screen',()=>{reminderLocked=false;edge.pause(false,'lock');resumeReminders();});
 const clampManage=()=>{cancelDrag();if(manage?.isVisible())setManageBounds(manage.getBounds(),true);};
 screen.on('display-metrics-changed',clampManage);screen.on('display-removed',clampManage);app.dock?.hide();publish();edge.start();reminderNotices.restore();reminderScheduler.start();
}).catch(error=>{console.error(error);dialog.showErrorBox(t("晾念头启动未成功"),error instanceof Error?error.message:t("启动发生错误，请保留数据后重试。"));app.quit();});
app.on('before-quit',event=>{
 if(!quitting&&prepareQuit){
  event.preventDefault();if(quitInFlight)return;quitInFlight=true;
  void prepareQuit().then(ok=>{quitInFlight=false;if(ok){quitting=true;app.quit();}}).catch(()=>{quitInFlight=false;composer?.webContents.send('thoughtline:quit-error',t("退出未成功，文字已保留，请重试。"));});return;
 }
 quitting=true;edge?.stop();globalShortcut.unregisterAll();
});
app.on('window-all-closed',()=>{if(quitting)app.quit();});
