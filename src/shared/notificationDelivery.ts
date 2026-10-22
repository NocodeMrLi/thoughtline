// SPDX-License-Identifier: GPL-3.0-only
type NativeNotice={once(event:'show',callback:()=>void):unknown;once(event:'failed',callback:()=>void):unknown;once(event:'click',callback:()=>void):unknown;removeListener(event:'show',callback:()=>void):unknown;removeListener(event:'failed',callback:()=>void):unknown;removeListener(event:'click',callback:()=>void):unknown;show:()=>void};
export function showNotification(notice:NativeNotice,onClick:()=>void,timeout=5000):Promise<boolean>{
 return new Promise(resolve=>{
  let finished=false;const finish=(ok:boolean)=>{if(finished)return;finished=true;clearTimeout(timer);notice.removeListener('show',shown);notice.removeListener('failed',failed);if(!ok)notice.removeListener('click',onClick);resolve(ok);};
  const shown=()=>finish(true),failed=()=>finish(false),timer=setTimeout(()=>finish(false),timeout);
  notice.once('show',shown);notice.once('failed',failed);notice.once('click',onClick);try{notice.show();}catch{finish(false);}
 });
}
