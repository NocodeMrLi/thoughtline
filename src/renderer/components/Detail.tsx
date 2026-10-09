import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import {useClipPage,flushPageSelections} from '../hooks/useClipPage';
import type {Result} from '../../shared/contracts';
export function Detail({info}:{info:PilotInfo}){
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[titles,setTitles]=useState(info.manageTitles),[menu,setMenu]=useState(false),[confirmAll,setConfirmAll]=useState(false);
 useEffect(()=>{setTitles(info.manageTitles);setMenu(false);setConfirmAll(false);setError('');setNotice('');},[info.manageSession]);
 const base=info.snapshot.ideas.find(i=>i.id===info.manageSelection);const original=info.snapshot.clips.find(c=>c.ideaIds.includes(base?.id??''));
 const heldClip=useRef({session:info.manageSession,id:original?.id});if(heldClip.current.session!==info.manageSession)heldClip.current={session:info.manageSession,id:original?.id};
 const clip=info.snapshot.clips.find(c=>c.id===heldClip.current.id)??original;const page=useClipPage(clip,setError);const idea=info.snapshot.ideas.find(i=>i.id===(page.id||base?.id));
 const index=clip?.ideaIds.indexOf(idea?.id??'')??0;
 const run=async(task:(current:PilotInfo)=>Promise<Result<unknown>>,message='')=>{if(busy)return;setBusy(true);setError('');try{await flushPageSelections();const current=await window.thoughtline.info();const r=await task(current);if(!r.ok)setError(r.message);else{setNotice(message);setMenu(false);setConfirmAll(false);}}catch{setError('操作未成功，原文已保留，请重试。');}finally{setBusy(false);}};
 const change=(c:ClipMutation,message='')=>run(current=>window.thoughtline.clipChange(c,current.snapshot.revision),message);
 const select=async(id:string)=>{if(clip)page.choose(id);setTitles(false);};
 const flip=(step:number)=>{const id=clip?.ideaIds[clip.ideaIds.indexOf(page.current())+step];if(id)void select(id);};
 return <main data-view="manage" data-mode="detail" className="manage compact-detail" onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229||busy)return;
  if(e.key==='Escape'){e.preventDefault();if(titles)setTitles(false);else if(menu)setMenu(false);else void window.thoughtline.closeManage();}
  if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement)return;
  if(e.key==='ArrowLeft'){e.preventDefault();flip(-1);}if(e.key==='ArrowRight'){e.preventDefault();flip(1);}
 }}>
  <header><span>{info.snapshot.agents.find(a=>a.id===idea?.agentId)?.name}{idea?.project?` · ${idea.project}`:''}</span><button className="close" aria-label="关闭详情" disabled={busy} onClick={()=>void window.thoughtline.closeManage()}>×</button></header>
  {idea?<>
   <div className="detail-heading"><strong>{idea.title}</strong>{clip&&clip.ideaIds.length>1&&<nav className="detail-pager" aria-label="便签切换"><button aria-label="上一张便签" disabled={busy||index===0} onClick={()=>flip(-1)}>‹</button><button aria-label="打开本夹标题列表" onClick={()=>setTitles(!titles)}>{index+1}/{clip.ideaIds.length}</button><button aria-label="下一张便签" disabled={busy||index===clip.ideaIds.length-1} onClick={()=>flip(1)}>›</button></nav>}</div>
   {titles&&clip?<div className="clip-titles" aria-label="本夹便签标题">{clip.ideaIds.map(id=>{const i=info.snapshot.ideas.find(i=>i.id===id)!;return <button key={id} aria-pressed={id===idea.id} disabled={busy} onClick={()=>void select(id)}>{i.title}</button>;})}</div>:<textarea data-full-text readOnly aria-label="完整正文，可手动选中复制" value={idea.text}/>}
   <div className="detail-actions"><button disabled={busy} onClick={()=>void run(()=>window.thoughtline.copy(idea.id),'已复制当前便签全文。')}>复制全文</button><button disabled={busy} onClick={()=>void run(()=>window.thoughtline.openEdit(idea.id))}>编辑</button><button disabled={busy} aria-label="整理当前便签" aria-expanded={menu} onClick={()=>{setMenu(!menu);setConfirmAll(false);}}>···</button></div>
   {menu&&<div className="detail-menu">
    <button disabled={busy} onClick={()=>void run(current=>window.thoughtline.setStatus(idea.id,idea.status==='hanging'?'archived':'hanging',current.snapshot.revision),'状态已更新，全文仍保留。')}>{idea.status==='hanging'?'收起当前便签':'重新挂上'}</button>
    {clip&&clip.ideaIds.length>1&&<><button disabled={busy} onClick={()=>void change({kind:'split',id:clip.id,ideaId:idea.id},'已拆出；放不下的夹子可在全部念头中找到。')}>拆出当前便签</button><button disabled={busy} onClick={()=>void change({kind:'splitAll',id:clip.id},'已拆为独立夹子。')}>全部拆开（{clip.ideaIds.length}张）</button><button disabled={busy} onClick={()=>setConfirmAll(true)}>收起整个夹子（{clip.ideaIds.length}张）</button>{confirmAll&&<button disabled={busy} onClick={()=>void change({kind:'archiveAll',id:clip.id},'整夹已收起，可撤销。')}>确认收起这{clip.ideaIds.length}张便签</button>}</>}
   </div>}
  </>:<p>这条念头暂时无法找到，请到全部念头中查找。</p>}
  <footer className="detail-bottom"><button className="text-button" disabled={busy} onClick={()=>void run(()=>window.thoughtline.openManage())}>全部念头</button>{info.canUndoClips&&<button className="text-button" disabled={busy} onClick={()=>void change({kind:'undo'},'已撤销夹子操作。')}>撤销整理</button>}<span role="status">{info.placementNotice||notice}</span></footer><p role="alert" className="error">{error}</p>
 </main>;
}
