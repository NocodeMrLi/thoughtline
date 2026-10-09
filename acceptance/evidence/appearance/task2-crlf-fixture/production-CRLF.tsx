import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type KeyboardEvent,type PointerEvent,type ReactNode} from 'react';
import type {PilotInfo} from '../../shared/bridge';import type {PreferencePatch} from '../../shared/preferences';
import {useLocale} from '../LocaleContext';
import {acceptsPreferenceFailure} from '../preference-ordering';
let sequence=0;
function Symbol({moon=false}:{moon?:boolean}){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{moon?<path d="M20 15.4A8.5 8.5 0 0 1 8.6 4 8.5 8.5 0 1 0 20 15.4Z"/>:<><circle cx="12" cy="12" r="3.7"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></>}</svg>;}
function Capsule({value,labels,children,onChange,width,reduced,kind}:{value:number;labels:[string,string];children:[ReactNode,ReactNode];onChange:(value:number)=>void;width:number;reduced:boolean;kind:string}){
 const root=useRef<HTMLDivElement>(null),thumb=useRef<HTMLSpanElement>(null),motion=useRef<Animation|null>(null),committed=useRef(value);committed.current=value;
 const gesture=useRef<{id:number;x:number;from:number;clicked:number;dragged:boolean}|null>(null);
 const travel=(width-8)/2,position=useRef(value*travel),suppressClick=useRef(false);
 const quiet=()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(forced-colors: active)').matches;
 const freeze=()=>{const node=thumb.current;if(!node)return;const matrix=new DOMMatrixReadOnly(getComputedStyle(node).transform);position.current=matrix.m41;motion.current?.cancel();motion.current=null;node.style.transform=`translateX(${position.current}px)`;};
 const place=(x:number,pressed=false)=>{const node=thumb.current;if(!node)return;position.current=x;node.style.transform=`translateX(${x}px) scale(${pressed&&!quiet()?'.96,.92':'1'})`;};
 const settle=(next:number)=>{freeze();const from=position.current,to=next*travel;place(to);if(!quiet()&&Math.abs(to-from)>.01){motion.current=thumb.current!.animate([{transform:`translateX(${from}px) scale(.97,.95)`},{offset:.78,transform:`translateX(${to+(to-from)*.025}px) scale(1.005,1)`},{transform:`translateX(${to}px) scale(1)`}],{duration:160,easing:'cubic-bezier(.2,.7,.25,1)'});}};
 useLayoutEffect(()=>{if(!gesture.current)settle(value);});
 useEffect(()=>{const a=matchMedia('(prefers-reduced-motion: reduce)'),b=matchMedia('(forced-colors: active)');const finish=()=>{if(quiet()){freeze();place(gesture.current?position.current:committed.current*travel);}};a.addEventListener('change',finish);b.addEventListener('change',finish);finish();return()=>{a.removeEventListener('change',finish);b.removeEventListener('change',finish);motion.current?.cancel();};},[reduced]);
 const cancel=()=>{const g=gesture.current;gesture.current=null;if(g&&root.current?.hasPointerCapture(g.id))root.current.releasePointerCapture(g.id);settle(committed.current);};
 useEffect(()=>{const escape=(e:globalThis.KeyboardEvent)=>{if(e.key==='Escape'&&gesture.current){e.preventDefault();e.stopImmediatePropagation();cancel();}};window.addEventListener('keydown',escape,true);return()=>window.removeEventListener('keydown',escape,true);},[reduced]);
 const down=(e:PointerEvent<HTMLDivElement>)=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();freeze();suppressClick.current=true;const left=e.currentTarget.getBoundingClientRect().left;gesture.current={id:e.pointerId,x:e.clientX,from:position.current,clicked:e.clientX-left<width/2?0:1,dragged:false};e.currentTarget.setPointerCapture(e.pointerId);place(position.current,true);};
 const move=(e:PointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;const dx=e.clientX-g.x;if(Math.abs(dx)>=12)g.dragged=true;if(g.dragged)place(Math.max(0,Math.min(travel,g.from+dx)),true);};
 const up=(e:PointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const next=g.dragged?(position.current>=travel/2?1:0):g.clicked;gesture.current=null;e.currentTarget.releasePointerCapture(e.pointerId);settle(next);onChange(next);};
 const key=(e:KeyboardEvent<HTMLDivElement>)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();return;}const next=e.key==='Home'||e.key==='ArrowLeft'?0:e.key==='End'||e.key==='ArrowRight'?1:null;if(next!==null){e.preventDefault();e.stopPropagation();cancel();settle(next);onChange(next);root.current?.querySelectorAll<HTMLButtonElement>('button')[next].focus();}};
 return <div ref={root} className="preference-capsule" data-capsule={kind} role="radiogroup" aria-label={labels.join(' / ')} style={{'--capsule-width':`${width}px`} as CSSProperties} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={()=>{if(gesture.current)cancel();}} onKeyDown={key} onMouseDown={e=>e.preventDefault()}>
  <span className="capsule-track" aria-hidden="true"><span ref={thumb} className="capsule-thumb" style={{transform:`translateX(${value*travel}px)`}}/></span>
  {children.map((child,index)=><button key={index} type="button" role="radio" aria-checked={value===index} aria-label={labels[index]} title={labels[index]} tabIndex={value===index?0:-1} onClick={e=>{e.stopPropagation();if(e.detail!==0&&suppressClick.current){suppressClick.current=false;return;}settle(index);onChange(index);}}>{child}</button>)}
 </div>;
}
export function PreferencesControl({info,settings=false}:{info:PilotInfo;settings?:boolean}){
 const {t}=useLocale();const [error,setError]=useState<{message:string;request:number;base:number}|null>(null);const intent=useRef(0),live=useRef(true),latest=useRef(info);latest.current=info;
 useEffect(()=>{live.current=true;return()=>{live.current=false;intent.current++;};},[]);
 const change=async(patch:PreferencePatch)=>{const token=++intent.current,request=++sequence,base=latest.current.preferences.version;const owns=()=>live.current&&intent.current===token&&request===sequence&&acceptsPreferenceFailure(request,base,latest.current);setError(null);try{const r=await window.thoughtline.setPreferences(patch,request);if(owns()&&!r.ok)setError({message:r.message,request,base});}catch(e){if(owns())setError({message:e instanceof Error?e.message:String(e),request,base});}};
 const visibleError=error&&error.request===sequence&&acceptsPreferenceFailure(error.request,error.base,info)?error.message:'';
 return <div className="preferences" data-preferences onKeyDown={e=>e.stopPropagation()}>
  {!settings&&<div className="preference-switches">
   <Capsule kind="locale" value={info.preferences.locale==='en'?1:0} labels={['中文 / English — 中文','中文 / English — English']} width={88} reduced={info.snapshot.settings.reducedMotion} onChange={v=>void change({locale:v?'en':'zh-CN'})}>{['中','EN']}</Capsule>
   <Capsule kind="theme" value={info.dark?1:0} labels={[t('light'),t('dark')]} width={72} reduced={info.snapshot.settings.reducedMotion} onChange={v=>void change({theme:v?'dark':'light'})}>{[<Symbol key="sun"/>,<Symbol moon key="moon"/>]}</Capsule>
  </div>}
  {settings&&<label className="system-theme"><input type="checkbox" checked={info.preferences.theme==='system'} onChange={e=>void change({theme:e.target.checked?'system':info.dark?'dark':'light'})}/>{t('followSystem')}</label>}
  {(visibleError||info.preferenceError)&&<div className="preference-error" role="alert">{t('preferenceError',{detail:visibleError||info.preferenceError||''})}</div>}
 </div>;
}
