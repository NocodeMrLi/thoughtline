import {useLocale} from '../LocaleContext';
import {useEffect,useRef,useState,type PointerEvent,type ReactNode} from 'react';
export function ProjectOptions({projects,reduced,disabled,onChoose,onDelete,onDone,composing,children}:{projects:string[];reduced:boolean;disabled:boolean;onChoose:(project:string)=>void;onDelete:(project:string)=>Promise<void>;onDone:()=>void;composing?:()=>boolean;children?:ReactNode}){
 const {t,m}=useLocale();
 const [editing,setEditing]=useState(false),[removing,setRemoving]=useState(false),[error,setError]=useState('');
 const press=useRef<{timer:ReturnType<typeof setTimeout>;x:number;y:number}|null>(null),suppress=useRef(false);
 const cancel=()=>{if(press.current)clearTimeout(press.current.timer);press.current=null;};
 useEffect(()=>cancel,[]);
 const start=(e:PointerEvent<HTMLButtonElement>)=>{if(e.button!==0||disabled||editing)return;suppress.current=false;cancel();press.current={x:e.clientX,y:e.clientY,timer:setTimeout(()=>{press.current=null;suppress.current=true;setEditing(true);},500)};};
 const remove=async(p:string)=>{if(removing)return;setRemoving(true);setError('');try{await onDelete(p);}catch(e){setError(e instanceof Error?e.message:'分组未删除，请重试。');}finally{setRemoving(false);}};
 return <div className="project-editor" data-editing={editing} data-reduced={reduced} onKeyDown={e=>{if(e.key==='Escape'&&!e.nativeEvent.isComposing&&!composing?.()){e.preventDefault();e.stopPropagation();if(!removing){cancel();setEditing(false);onDone();}}}}>
  <div className="project-editor-controls"><button type="button" aria-label={t("退出项目编辑")} disabled={removing} onClick={()=>{cancel();setEditing(false);onDone();}}>×</button><button type="button" disabled={removing} onClick={()=>{cancel();setEditing(false);onDone();}}>{t("完成")}</button></div>
  {children}<p className="project-hint">{editing?t("删除分组不会删除念头"):t("长按分组可整理")}</p>
  <div className="composer-project-options"><button type="button" disabled={disabled||removing} onClick={()=>{if(!editing)onChoose('');}}>{t("未分组")}</button>{projects.map(p=><span className="project-tag" key={p} data-deletable={editing}>
   <button type="button" disabled={disabled||removing} onPointerDown={start} onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onPointerMove={e=>{if(press.current&&Math.hypot(e.clientX-press.current.x,e.clientY-press.current.y)>6)cancel();}} onContextMenu={e=>{e.preventDefault();if(!disabled)setEditing(true);}} onClick={()=>{if(suppress.current){suppress.current=false;return;}if(!editing)onChoose(p);}}>{p}</button>
   {editing&&<button type="button" className="project-delete" aria-label={t("deleteProjectValue",{p0:p})} title={t("deleteProjectValueHelp",{p0:p})} disabled={disabled||removing} onClick={()=>void remove(p)}>×</button>}
  </span>)}</div><p className="error" role="alert">{m(error)}</p>
 </div>;
}
