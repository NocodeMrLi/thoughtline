import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Idea,Result} from '../../shared/contracts';
import {prepareLeave} from '../hooks/leaveGuards';
import {flushPageSelections} from '../hooks/useClipPage';
import {InlineIdeaEditor} from './InlineIdeaEditor';
import {IconButton,ActionIcon} from './ActionIcon';
export function IdeaReader({idea,info,initialEdit=false}:{idea:Idea;info:PilotInfo;initialEdit?:boolean}){
 const [editing,setEditing]=useState(initialEdit),[menu,setMenu]=useState(false),[permanent,setPermanent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{setMenu(false);setPermanent(false);setError('');setNotice('');},[idea.id]);
 useEffect(()=>{if(initialEdit)setEditing(true);},[initialEdit]);
 const live=useRef(true),operation=useRef(0),pending=useRef(false),owner=useRef({session:info.manageSession,id:idea.id});
 owner.current={session:info.manageSession,id:idea.id};
 useEffect(()=>{live.current=true;return()=>{live.current=false;operation.current++;};},[]);
 const checkpoint=()=>{const token=++operation.current,session=info.manageSession,id=idea.id;return ()=>live.current&&operation.current===token&&owner.current.session===session&&owner.current.id===id;};
 const finishEdit=async()=>{const current=checkpoint();if(await prepareLeave()&&current())setEditing(false);};
 const clip=info.snapshot.clips.find(c=>c.ideaIds.includes(idea.id)),deleted=(idea.status as string)==='deleted';
 const run=async(task:(current:PilotInfo)=>Promise<Result<unknown>>,message='')=>{
  if(pending.current)return;const currentOwner=checkpoint();pending.current=true;setBusy(true);setError('');
  try{
   if(!await prepareLeave()||!currentOwner())return;
   await flushPageSelections();if(!currentOwner())return;
   const current=await window.thoughtline.info();if(!currentOwner()||current.manageSession!==info.manageSession)return;
   const result=await task(current);if(!currentOwner())return;
   if(!result.ok){setError(result.message);return;}setNotice(message);setMenu(false);setPermanent(false);
  }catch{if(currentOwner())setError('操作未成功，原文已保留，请重试。');}
  finally{if(currentOwner()){pending.current=false;setBusy(false);}}
 };
 const change=(c:ClipMutation,message:string)=>run(current=>window.thoughtline.clipChange(c,current.snapshot.revision),message);
 const history=(kind:'delete'|'restore'|'permanent')=>run(current=>window.thoughtline.ideaHistory(idea.id,kind,current.snapshot.revision),kind==='delete'?'已移到最近删除，可恢复。':kind==='restore'?'念头已恢复。':'已永久删除。');
 return <section className="idea-reader" data-reader-id={idea.id}>
  {editing&&!deleted?<InlineIdeaEditor key={idea.id+':'+info.manageSession} idea={idea} info={info} onDone={()=>setEditing(false)}/>:<textarea data-full-text readOnly aria-label="完整正文，可手动选中复制" value={idea.text}/>}
  <div className="reader-toolbar" aria-label="念头操作">
   <IconButton icon="copy" label="复制正文" disabled={busy} onClick={()=>void run(()=>window.thoughtline.copy(idea.id),'已复制完整正文。')}/>
   {!deleted&&<><IconButton icon="edit" label={editing?'完成编辑':'编辑'} disabled={busy} aria-pressed={editing} onClick={()=>{if(editing)void finishEdit();else setEditing(true);}}/><IconButton icon={idea.status==='hanging'?'archive':'restore'} label={idea.status==='hanging'?'收起当前念头':'重新挂上'} disabled={busy} onClick={()=>void run(current=>window.thoughtline.setStatus(idea.id,idea.status==='hanging'?'archived':'hanging',current.snapshot.revision),'状态已更新，正文保留。')}/>{clip&&clip.ideaIds.length>1&&<IconButton icon="split" label="拆出当前纸张" disabled={busy} onClick={()=>void change({kind:'split',id:clip.id,ideaId:idea.id},'已拆出当前纸张。')}/>}</>}
   {deleted&&<IconButton icon="restore" label="恢复念头" disabled={busy} onClick={()=>void history('restore')}/>}
   <IconButton icon="more" label="更多操作" disabled={busy} aria-expanded={menu} onClick={()=>{setMenu(!menu);setPermanent(false);}}/>
  </div>
  {menu&&<div className="reader-more" aria-label="更多念头操作">
   {!deleted&&clip&&clip.ideaIds.length>1&&<><button disabled={busy} onClick={()=>void change({kind:'splitAll',id:clip.id},'已全部拆开，可撤销。')}><ActionIcon name="split"/>全部拆开（{clip.ideaIds.length}张）</button><button disabled={busy} onClick={()=>void change({kind:'archiveAll',id:clip.id},'已收起整个夹子，可撤销。')}><ActionIcon name="archive"/>收起整个夹子（{clip.ideaIds.length}张）</button></>}
   {!deleted?<button disabled={busy} onClick={()=>void history('delete')}><ActionIcon name="delete"/>删除当前念头（1张，可恢复）</button>:<><button disabled={busy} onClick={()=>setPermanent(true)}><ActionIcon name="delete"/>永久删除当前念头</button>{permanent&&<div className="permanent-confirm"><p>永久删除这1张纸，无法恢复。</p><button disabled={busy} onClick={()=>void history('permanent')}>确认永久删除这条念头</button><button onClick={()=>setPermanent(false)}>取消</button></div>}</>}
  </div>}
  <p className="reader-notice" role="status">{info.placementNotice||notice}</p>{error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
