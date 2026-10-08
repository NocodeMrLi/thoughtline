export interface ShortcutRegistry{register(key:string,callback:()=>void):boolean;unregister(key:string):void;}
export function swapShortcut(registry:ShortcutRegistry,previous:string,next:string,callback:()=>void):{ok:boolean;active:string}{
  if(previous===next&&previous)return {ok:true,active:previous};
  if(!registry.register(next,callback))return {ok:false,active:previous};
  if(previous)registry.unregister(previous);
  return {ok:true,active:next};
}
