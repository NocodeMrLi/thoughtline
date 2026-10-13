import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

/** Explains an unavailable action without opening a dialog or taking focus. */
export function ClassificationUnavailableHint({anchor,text,eventId,id,onClose}:{anchor:HTMLElement;text:string;eventId:number;id:string;onClose:()=>void}){
 const panel=useRef<HTMLSpanElement>(null),close=useRef(onClose),[position,setPosition]=useState({left:8,top:8});close.current=onClose;
 useLayoutEffect(()=>{
  const place=()=>{const a=anchor.getBoundingClientRect(),p=panel.current?.getBoundingClientRect();if(!p)return;const above=a.top-p.height-6,below=a.bottom+6;setPosition({left:Math.max(8,Math.min(innerWidth-p.width-8,a.right-p.width)),top:Math.max(8,Math.min(innerHeight-p.height-8,above>=8?above:below))});};
  place();const observer=new ResizeObserver(place);if(panel.current)observer.observe(panel.current);return()=>observer.disconnect();
 },[anchor,text,eventId]);
 useEffect(()=>{
  const dismiss=()=>close.current(),outside=(e:PointerEvent)=>{if(!anchor.contains(e.target as Node))dismiss();},escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.isComposing){e.preventDefault();e.stopPropagation();dismiss();}};
  const timer=setTimeout(dismiss,2500);document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);document.addEventListener('scroll',dismiss,true);window.addEventListener('resize',dismiss);window.addEventListener('blur',dismiss);
  return()=>{clearTimeout(timer);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);document.removeEventListener('scroll',dismiss,true);window.removeEventListener('resize',dismiss);window.removeEventListener('blur',dismiss);};
 },[anchor,eventId]);
 return createPortal(<span ref={panel} id={id} className="icon-tooltip classification-unavailable-tip" role="status" style={{position:'fixed',...position}}>{text}</span>,document.body);
}
