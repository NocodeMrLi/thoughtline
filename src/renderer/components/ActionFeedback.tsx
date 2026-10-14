import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
export type ActionFeedbackEntry={id:number;text:string;left:number;top:number;duration:number};
/** Kept by the Reader rather than a button that may disappear after restore. */
export function ActionFeedback({entry,onDone}:{entry:ActionFeedbackEntry|null;onDone:()=>void}){
 const tip=useRef<HTMLSpanElement>(null),[left,setLeft]=useState(entry?.left??0),done=useRef(onDone);done.current=onDone;
 useLayoutEffect(()=>{if(!entry)return;const width=tip.current?.getBoundingClientRect().width??0;setLeft(Math.max(width/2+8,Math.min(innerWidth-width/2-8,entry.left)));},[entry]);
 useEffect(()=>{if(!entry)return;const timer=setTimeout(()=>done.current(),entry.duration),dismiss=()=>done.current();window.addEventListener('blur',dismiss);window.addEventListener('resize',dismiss);document.addEventListener('scroll',dismiss,true);return()=>{clearTimeout(timer);window.removeEventListener('blur',dismiss);window.removeEventListener('resize',dismiss);document.removeEventListener('scroll',dismiss,true);};},[entry]);
 return entry?createPortal(<span ref={tip} className="icon-tooltip" data-action-feedback role="status" style={{position:'fixed',left,top:entry.top,transform:'translateX(-50%)',pointerEvents:'none'}}>{entry.text}</span>,document.body):null;
}
