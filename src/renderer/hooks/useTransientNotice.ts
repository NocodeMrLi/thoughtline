// SPDX-License-Identifier: GPL-3.0-only
import {useCallback,useEffect,useRef,useState,type FocusEvent} from 'react';

/** Every call is a new event, even when the displayed text is identical. */
export function useTransientNotice(duration=1600){
 const [entry,setEntry]=useState<{id:number;text:string;duration:number}|null>(null);
 const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false);
 const sequence=useRef(0),remaining=useRef(duration),scheduled=useRef<number|null>(null);
 const setNotice=useCallback((text:string,stay=duration)=>{
  if(!text){setEntry(null);setHovered(false);setFocused(false);return;}
  setEntry({id:++sequence.current,text,duration:stay});
 },[duration]);
 useEffect(()=>{
  if(entry&&scheduled.current!==entry.id){scheduled.current=entry.id;remaining.current=entry.duration;}
  if(!entry||hovered||focused||!Number.isFinite(entry.duration))return;
  const started=performance.now(),timer=setTimeout(()=>setEntry(current=>current?.id===entry.id?null:current),Math.max(0,remaining.current));
  return()=>{clearTimeout(timer);remaining.current=Math.max(0,remaining.current-(performance.now()-started));};
 },[entry,hovered,focused]);
 return {notice:entry?.text??'',setNotice,noticeProps:{
  onMouseEnter:()=>setHovered(true),onMouseLeave:()=>setHovered(false),onFocus:()=>setFocused(true),
  onBlur:(e:FocusEvent<HTMLElement>)=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}
 }};
}
