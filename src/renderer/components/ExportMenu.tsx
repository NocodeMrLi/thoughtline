// SPDX-License-Identifier: GPL-3.0-only
import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {useLocale} from '../LocaleContext';
export type ExportChoice='txt'|'docx'|'backup';
export function ExportMenu({anchor,onClose,onChoose}:{anchor:RefObject<HTMLButtonElement|null>;onClose:()=>void;onChoose:(choice:ExportChoice)=>void}){
 const {t}=useLocale(),panel=useRef<HTMLDivElement>(null),[position,setPosition]=useState({left:8,top:8});
 const close=useRef(onClose);close.current=onClose;
 useLayoutEffect(()=>{const place=()=>{const a=anchor.current?.getBoundingClientRect(),p=panel.current?.getBoundingClientRect();if(a&&p)setPosition({left:Math.max(8,Math.min(a.left,innerWidth-p.width-8)),top:Math.max(8,Math.min(a.bottom+5+p.height<=innerHeight-8?a.bottom+5:a.top-p.height-5,innerHeight-p.height-8))});};place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);const observer=new ResizeObserver(place);if(panel.current)observer.observe(panel.current);return()=>{observer.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[anchor]);
 useEffect(()=>{panel.current?.querySelector<HTMLButtonElement>('button')?.focus();const outside=(e:PointerEvent)=>{if(!panel.current?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))close.current();};document.addEventListener('pointerdown',outside,true);return()=>document.removeEventListener('pointerdown',outside,true);},[anchor]);
 const dismiss=()=>{onClose();anchor.current?.focus();};
 return createPortal(<div id="thought-export-menu" ref={panel} className="compact-popover export-menu" style={{position:'fixed',...position}} role="menu" aria-label={t('导出')} onKeyDown={e=>{
  const items=[...panel.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]')??[]];
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dismiss();}
  else if(e.key==='Tab'){e.stopPropagation();dismiss();}
  else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const index=items.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
 }}><button role="menuitem" data-export-format="txt" onClick={()=>{dismiss();onChoose('txt');}}>{t('导出 TXT')}</button><button role="menuitem" data-export-format="docx" onClick={()=>{dismiss();onChoose('docx');}}>{t('导出 DOCX')}</button><div role="separator"/><button role="menuitem" data-export-format="backup" onClick={()=>{dismiss();onChoose('backup');}}>{t('备份数据')}</button></div>,document.body);
}
