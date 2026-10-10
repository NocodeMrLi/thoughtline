import {countThoughts} from '../../shared/i18n';
import {useLocale} from '../LocaleContext';
import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,ClipMutation} from '../../shared/bridge';
import type {Idea,Result} from '../../shared/contracts';
import {prepareLeave} from '../hooks/leaveGuards';
import {flushPageSelections} from '../hooks/useClipPage';
import {InlineIdeaEditor} from './InlineIdeaEditor';
import {IconButton,ActionIcon} from './ActionIcon';
export function IdeaReader({idea,info,initialEdit=false}:{idea:Idea;info:PilotInfo;initialEdit?:boolean}){
 const {t,m,locale}=useLocale();
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
 const history=(kind:'delete'|'restore'|'permanent')=>run(current=>window.thoughtline.ideaHistory(idea.id,kind,current.snapshot.revision),kind==='delete'?t("已移到最近删除，可恢复。"):kind==='restore'?t("念头已恢复。"):t("已永久删除。"));
 return <section className="idea-reader" data-reader-id={idea.id}>
  {editing&&!deleted?<InlineIdeaEditor key={idea.id+':'+info.manageSession} idea={idea} info={info} onDone={()=>setEditing(false)}/>:<textarea data-full-text readOnly aria-label={t("完整正文，可手动选中复制")} value={idea.text}/>}
  <div className="reader-toolbar" aria-label={t("念头操作")}>
   <IconButton icon="copy" label={t("复制正文")} disabled={busy} onClick={()=>void run(()=>window.thoughtline.copy(idea.id),t("已复制完整正文。"))}/>
   {!deleted&&<><IconButton icon="edit" label={editing?t("完成编辑"):t("编辑")} disabled={busy} aria-pressed={editing} onClick={()=>{if(editing)void finishEdit();else setEditing(true);}}/><IconButton icon={idea.status==='hanging'?'archive':'restore'} label={idea.status==='hanging'?t("收起当前念头"):t("重新挂上")} disabled={busy} onClick={()=>void run(current=>window.thoughtline.setStatus(idea.id,idea.status==='hanging'?'archived':'hanging',current.snapshot.revision),t("状态已更新，正文保留。"))}/>{clip&&clip.ideaIds.length>1&&<IconButton icon="split" label={t("拆分")} disabled={busy} onClick={()=>void change({kind:'split',id:clip.id,ideaId:idea.id},t("已拆出当前纸张。"))}/>}</>}
   {deleted&&<IconButton icon="restore" label={t("恢复念头")} disabled={busy} onClick={()=>void history('restore')}/>}
   <IconButton icon="more" label={t("更多操作")} disabled={busy} aria-expanded={menu} onClick={()=>{setMenu(!menu);setPermanent(false);}}/>
  </div>
  {menu&&<div className="reader-more" aria-label={t("更多念头操作")}>
   {!deleted&&clip&&clip.ideaIds.length>1&&<><button disabled={busy} onClick={()=>void change({kind:'splitAll',id:clip.id},t("已全部拆开，可撤销。"))}><ActionIcon name="split"/>{t('splitAll',{count:countThoughts(locale,clip.ideaIds.length)})}</button><button disabled={busy} onClick={()=>void change({kind:'archiveAll',id:clip.id},t("已收起整个夹子，可撤销。"))}><ActionIcon name="archive"/>{t('archiveClip',{count:countThoughts(locale,clip.ideaIds.length)})}</button></>}
   {!deleted?<button disabled={busy} onClick={()=>void history('delete')}><ActionIcon name="delete"/>{t("删除当前念头（1张，可恢复）")}</button>:<><button disabled={busy} onClick={()=>setPermanent(true)}><ActionIcon name="delete"/>{t("永久删除当前念头")}</button>{permanent&&<div className="permanent-confirm"><p>{t("永久删除这1张纸，无法恢复。")}</p><button disabled={busy} onClick={()=>void history('permanent')}>{t("确认永久删除这条念头")}</button><button onClick={()=>setPermanent(false)}>{t("取消")}</button></div>}</>}
  </div>}
  <p className="reader-notice" role="status">{m(info.placementNotice||notice)}</p>{error&&<p className="error" role="alert">{m(error)}</p>}
 </section>;
}
