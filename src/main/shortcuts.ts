import type {Result} from '../shared/contracts';
export interface ShortcutRegistry{register(key:string,callback:()=>void):boolean;unregister(key:string):void;isRegistered(key:string):boolean;}
export async function swapShortcut(registry:ShortcutRegistry,previous:string,next:string,callback:()=>void,persist:()=>Promise<Result<unknown>>=async()=>({ok:true,value:undefined})):Promise<{ok:boolean;active:string;error?:Result<never>}>{
  const alreadyActive=previous===next&&registry.isRegistered(previous);
  if(!alreadyActive){try{if(!registry.register(next,callback))return {ok:false,active:previous};}catch{return {ok:false,active:previous};}}
  let saved:Result<unknown>;
  try{saved=await persist();}catch{saved={ok:false,code:'IO',message:'设置保存未成功，请重试。'};}
  if(!saved.ok){if(!alreadyActive)registry.unregister(next);return {ok:false,active:previous,error:saved};}
  if(previous&&previous!==next)registry.unregister(previous);
  return {ok:true,active:next};
}
