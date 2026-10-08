import type {Draft,Rect,Result,Snapshot} from './contracts';
export type ComposerContext={mode:'new'|'edit';ideaId:string|null;draft:Draft};
export type AgentMutation={kind:'add';name:string;color:string}|{kind:'update';id:string;name:string;color:string}|{kind:'remove';id:string;replacement:string};
export type ClipMutation={kind:'merge';sourceId:string;targetId:string}|{kind:'move';id:string;position:number;beforeId:string|null}|{kind:'select';id:string;ideaId:string}|{kind:'split';id:string;ideaId:string}|{kind:'splitAll'|'archiveAll';id:string}|{kind:'undo'};
export type PilotInfo={platform:'mac'|'windows';snapshot:Snapshot;displayId:string;width:number;dark:boolean;hotkeyRegistered:boolean;composerSession:number;composerContext:ComposerContext;manageSession:number;manageSelection:string|null;manageMode:'browse'|'detail'|'settings';manageTitles:boolean;canUndoClips:boolean;dragCancelSession:number;shelfVisible:boolean;interactionLocked:boolean;presentationSession:number};
export type HitLayout={layoutRevision:number;displayId:string;rects:Rect[]};
export interface ThoughtlineBridge{
 info():Promise<PilotInfo>; onInfo(callback:(info:PilotInfo)=>void):()=>void;
 hitRects(layout:HitLayout):void; presentationFinished(session:number):void; copy(id:string):Promise<Result<void>>;
 submit(draft:Draft,revision:number):Promise<Result<Snapshot>>;
 close(draft:Draft):Promise<Result<Snapshot>>;
 openManage(id?:string,titles?:boolean):Promise<Result<void>>; closeManage():Promise<Result<void>>;
 openEdit(id:string):Promise<Result<void>>;
 openSettings():Promise<Result<void>>;
 saveSettings(settings:Snapshot['settings'],revision:number):Promise<Result<Snapshot>>;
 onPrepareQuit(callback:()=>Draft|null):()=>void;
 onQuitError(callback:(message:string)=>void):()=>void;
 setStatus(id:string,status:'hanging'|'archived',revision:number):Promise<Result<Snapshot>>;
 clipChange(change:ClipMutation,revision:number):Promise<Result<Snapshot>>;
 dragLock(active:boolean):Promise<Result<void>>;
 agentChange(change:AgentMutation,revision:number):Promise<Result<Snapshot>>;
}
declare global{interface Window{thoughtline:ThoughtlineBridge;}}
