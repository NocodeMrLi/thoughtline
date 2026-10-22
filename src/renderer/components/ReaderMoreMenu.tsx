// SPDX-License-Identifier: GPL-3.0-only
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {createPortal} from 'react-dom';
export function ReaderMoreMenu({anchor,onClose,label,children,side='above',className=''}:{anchor:RefObject<HTMLSpanElement|null>;onClose:()=>void;label:string;children:ReactNode;side?:'above'|'below';className?:string}){
 const menu=useRef<HTMLDivElement>(null),[position,setPosition]=useState({left:8,top:8});
 useLayoutEffect(()=>{const place=()=>{const a=anchor.current?.getBoundingClientRect(),m=menu.current?.getBoundingClientRect();if(a&&m)setPosition({left:Math.max(8,Math.min(innerWidth-m.width-8,a.right-m.width)),top:Math.max(8,Math.min(innerHeight-m.height-8,side==='below'?a.bottom+6:a.top-m.height-6))});};place();window.addEventListener('resize',place);return()=>window.removeEventListener('resize',place);},[anchor,children,side]);
 useEffect(()=>{menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();let timer:ReturnType<typeof setTimeout>|null=null;const clear=()=>{if(timer)clearTimeout(timer);timer=null;};
  const schedule=()=>{if(!timer)timer=setTimeout(()=>{timer=null;onClose();},180);};
  const move=(e:PointerEvent)=>{const a=anchor.current?.getBoundingClientRect(),m=menu.current?.getBoundingClientRect();if(!a||!m)return;const inside=e.clientX>=Math.min(a.left,m.left)-4&&e.clientX<=Math.max(a.right,m.right)+4&&e.clientY>=Math.min(a.top,m.top)-4&&e.clientY<=Math.max(a.bottom,m.bottom)+4;if(inside)clear();else if(!timer)timer=setTimeout(()=>{timer=null;onClose();},180);};
  const outside=(e:PointerEvent)=>{if(!menu.current?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))onClose();};const blur=()=>onClose();
  const opened=(e:Event)=>{if((e as CustomEvent).detail!==menu.current)onClose();};
  window.addEventListener('thoughtline:popover-opened',opened);window.dispatchEvent(new CustomEvent('thoughtline:popover-opened',{detail:menu.current}));
  document.addEventListener('pointerdown',outside,true);document.addEventListener('pointermove',move,true);document.documentElement.addEventListener('pointerleave',schedule);document.documentElement.addEventListener('pointerenter',clear);document.addEventListener('keydown',clear,true);window.addEventListener('blur',blur);
  return()=>{clear();window.removeEventListener('thoughtline:popover-opened',opened);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('pointermove',move,true);document.documentElement.removeEventListener('pointerleave',schedule);document.documentElement.removeEventListener('pointerenter',clear);document.removeEventListener('keydown',clear,true);window.removeEventListener('blur',blur);};},[anchor,onClose]);
 return createPortal(<div ref={menu} className={`reader-more ${className}`} style={{position:'fixed',...position}} role="group" aria-label={label} onKeyDown={e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();anchor.current?.querySelector<HTMLButtonElement>('button')?.focus();}
  if(e.key==='Tab')onClose();
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const b=[...menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]],at=b.indexOf(document.activeElement as HTMLButtonElement),index=e.key==='Home'?0:e.key==='End'?b.length-1:(at+(e.key==='ArrowDown'?1:-1)+b.length)%b.length;b[index]?.focus();}
 }}>{children}</div>,document.body);
}
