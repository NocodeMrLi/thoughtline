import {useEffect,useLayoutEffect,useRef,useState,type RefObject,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
export function CompactPopover({anchor,label,className='',busy=false,onClose,children}:{anchor:RefObject<HTMLElement|null>;label:string;className?:string;busy?:boolean;onClose:()=>void;children:ReactNode}){
 const panel=useRef<HTMLDivElement>(null),[position,setPosition]=useState({left:8,top:8}),close=useRef(onClose),pending=useRef(busy);close.current=onClose;pending.current=busy;
 useLayoutEffect(()=>{const place=()=>{const a=anchor.current?.getBoundingClientRect(),p=panel.current?.getBoundingClientRect();if(!a||!p)return;const above=a.top-p.height-6,below=a.bottom+6;setPosition({left:Math.max(8,Math.min(innerWidth-p.width-8,a.right-p.width)),top:Math.max(8,Math.min(innerHeight-p.height-8,above>=8?above:below+p.height<=innerHeight-8?below:above))});};place();const observer=new ResizeObserver(place);if(panel.current)observer.observe(panel.current);window.addEventListener('resize',place);return()=>{observer.disconnect();window.removeEventListener('resize',place);};},[anchor]);
 useEffect(()=>{const node=panel.current,previous=document.activeElement as HTMLElement|null;const opened=(e:Event)=>{if((e as CustomEvent).detail!==node)close.current();};const outside=(e:PointerEvent)=>{if(!pending.current&&!node?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))close.current();};
  window.addEventListener('thoughtline:popover-opened',opened);window.dispatchEvent(new CustomEvent('thoughtline:popover-opened',{detail:node}));node?.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled)')?.focus();document.addEventListener('pointerdown',outside,true);
  return()=>{window.removeEventListener('thoughtline:popover-opened',opened);document.removeEventListener('pointerdown',outside,true);if(node?.contains(document.activeElement)&&previous?.isConnected)previous.focus();};
 },[anchor]);
 return createPortal(<div ref={panel} className={`compact-popover ${className}`} style={{position:'fixed',...position}} role="dialog" aria-label={label} aria-busy={busy} onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!busy){onClose();anchor.current?.querySelector<HTMLButtonElement>('button')?.focus();}}
  if(e.key==='Tab'){const controls=[...panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')??[]],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 }}>{children}</div>,document.body);
}
