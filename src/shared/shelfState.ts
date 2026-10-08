export type Zone='edge'|'card'|'corridor'|'outside';
export type ShelfState={phase:'hidden'|'revealed'|'peek';zone:Zone;locks:string[];dwellAt:number|null;leaveAt:number|null;corridorUntil:number|null;peekUntil:number|null;suspended:boolean};
export type ShelfEvent={type:'pointer';zone:Zone;now:number}|{type:'tick';now:number}|{type:'lock';name:string;active:boolean;now:number}|{type:'peek'|'suspend'|'resume';now:number};
export const initialShelf=():ShelfState=>({phase:'hidden',zone:'outside',locks:[],dwellAt:null,leaveAt:null,corridorUntil:null,peekUntil:null,suspended:false});
export function shelfTransition(previous:ShelfState,event:ShelfEvent):ShelfState{
  const s={...previous,locks:[...previous.locks]};
  if(event.type==='suspend')return {...initialShelf(),locks:s.locks,suspended:true};
  if(event.type==='resume')return {...initialShelf(),locks:s.locks};
  if(s.suspended)return s;
  if(event.type==='peek')return {...s,phase:'peek',peekUntil:event.now+2300,leaveAt:null};
  if(event.type==='lock'){
    s.locks=event.active?[...new Set([...s.locks,event.name])]:s.locks.filter(x=>x!==event.name);
    if(!s.locks.length){
      s.leaveAt=(s.zone==='card'||s.zone==='edge')?null:event.now;
      if(s.peekUntil!==null)s.peekUntil=Math.max(s.peekUntil,event.now+500);
    }
    return s;
  }
  if(event.type==='pointer'&&event.zone!==s.zone){
    const oldZone=s.zone;s.zone=event.zone;
    s.dwellAt=event.zone==='edge'?event.now:null;
    if(event.zone==='card'){
      if(s.phase!=='hidden')s.phase='revealed';
      s.leaveAt=null;s.peekUntil=null;s.corridorUntil=null;
    }else if(event.zone==='edge'){
      s.leaveAt=null;s.corridorUntil=null;
    }else{
      s.leaveAt=event.now;
      s.corridorUntil=event.zone==='corridor'&&oldZone==='edge'&&s.phase!=='hidden'?event.now+600:null;
    }
  }
  if(s.locks.length)return s;
  if(s.phase==='hidden'&&s.dwellAt!==null&&event.now-s.dwellAt>=250){s.phase='revealed';s.leaveAt=null;}
  if(s.phase!=='hidden'&&s.zone!=='card'&&s.zone!=='edge'){
    const expiry=s.phase==='peek'?s.peekUntil:s.leaveAt===null?null:Math.max(s.leaveAt+500,s.corridorUntil??0);
    if(expiry!==null&&event.now>=expiry)return {...s,phase:'hidden',leaveAt:null,corridorUntil:null,peekUntil:null};
  }
  return s;
}
export type PauseReason='manual'|'sleep'|'lock';
export type PauseState={manual:boolean;sleep:boolean;lock:boolean;paused:boolean};
export function pauseTransition(state:PauseState,reason:PauseReason,active:boolean):PauseState{
 const next={...state,[reason]:active};return {...next,paused:next.manual||next.sleep||next.lock};
}
