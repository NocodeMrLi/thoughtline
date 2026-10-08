import type {Draft,Rect,Result,Snapshot} from './contracts';
export type PilotInfo={platform:'mac'|'windows';snapshot:Snapshot;displayId:string;width:number;dark:boolean;hotkeyRegistered:boolean;composerSession:number};
export type HitLayout={layoutRevision:number;displayId:string;rects:Rect[]};
export interface ThoughtlineBridge{
 info():Promise<PilotInfo>; onInfo(callback:(info:PilotInfo)=>void):()=>void;
 hitRects(layout:HitLayout):void; copy(id:string):Promise<Result<void>>;
 submit(draft:Draft,revision:number):Promise<Result<Snapshot>>;
 close(draft:Draft):Promise<Result<Snapshot>>;
}
declare global{interface Window{thoughtline:ThoughtlineBridge;}}
