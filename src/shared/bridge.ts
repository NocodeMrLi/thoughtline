import type {Draft,Rect,Result,Snapshot} from './contracts';
export type ComposerContext={mode:'new'|'edit';ideaId:string|null;draft:Draft};
export type AgentMutation={kind:'add';name:string;color:string}|{kind:'update';id:string;name:string;color:string}|{kind:'remove';id:string;replacement:string};
export type PilotInfo={platform:'mac'|'windows';snapshot:Snapshot;displayId:string;width:number;dark:boolean;hotkeyRegistered:boolean;composerSession:number;composerContext:ComposerContext;manageSession:number;manageSelection:string|null;shelfVisible:boolean;interactionLocked:boolean};
export type HitLayout={layoutRevision:number;displayId:string;rects:Rect[]};
export interface ThoughtlineBridge{
 info():Promise<PilotInfo>; onInfo(callback:(info:PilotInfo)=>void):()=>void;
 hitRects(layout:HitLayout):void; copy(id:string):Promise<Result<void>>;
 submit(draft:Draft,revision:number):Promise<Result<Snapshot>>;
 close(draft:Draft):Promise<Result<Snapshot>>;
 openManage(id?:string):Promise<Result<void>>; closeManage():Promise<Result<void>>;
 openEdit(id:string):Promise<Result<void>>;
 setStatus(id:string,status:'hanging'|'archived',revision:number):Promise<Result<Snapshot>>;
 agentChange(change:AgentMutation,revision:number):Promise<Result<Snapshot>>;
}
declare global{interface Window{thoughtline:ThoughtlineBridge;}}
