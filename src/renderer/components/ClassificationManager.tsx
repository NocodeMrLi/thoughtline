import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,ClassificationTab} from '../../shared/bridge';
import type {Result,Snapshot} from '../../shared/contracts';
import {projectNames,classificationCount,activeTags,activeProjects} from '../../shared/classification';
import {useLocale} from '../LocaleContext';
import {PreferencesControl} from './PreferencesControl';
import {IconButton} from './ActionIcon';
import {ClassificationForm} from './ClassificationForm';
import {FolderIcon,SearchIcon} from './ClassificationPicker';
import {registerLeaveGuard} from '../hooks/leaveGuards';
import {useTransientNotice} from '../hooks/useTransientNotice';
type Field='tag'|'project';
type Row={id:string;name:string;color:string;system:boolean;inactive:boolean};
type Operation={kind:'new'|'edit'|'delete';field:Field;id:string;name:string;color:string};
export function ClassificationManager({info}:{info:PilotInfo}){
 const {t,m,agentName}=useLocale(),[tab,setTab]=useState<ClassificationTab>(info.classificationTab??'tags'),[query,setQuery]=useState(''),[op,setOp]=useState<Operation|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[replacement,setReplacement]=useState('general');
 const modal=useRef<HTMLDivElement>(null),priorFocus=useRef<HTMLElement|null>(null),current=useRef({busy,op});current.current={busy,op};
 const pending=useRef(false),live=useRef(true),{notice,setNotice,noticeProps}=useTransientNotice();
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 useEffect(()=>registerLeaveGuard(async()=>!current.current.busy&&!current.current.op),[]);
 useEffect(()=>{if(!op)return;priorFocus.current=document.activeElement as HTMLElement;modal.current?.querySelector<HTMLElement>('input:not(:disabled),select,button:not(:disabled)')?.focus();return()=>{priorFocus.current?.focus();};},[op]);
 const tags:Row[]=info.snapshot.agents.map(a=>({id:a.id,name:agentName(a),color:a.color,system:a.id==='general',inactive:!!info.snapshot.inactiveAgents?.includes(a.id)})).sort((a,b)=>Number(b.system)-Number(a.system));
 const projects:Row[]=[{id:'',name:t('未分组'),color:'',system:true,inactive:false},...projectNames(info.snapshot).map(p=>({id:p,name:p,color:'',system:false,inactive:!!info.snapshot.inactiveProjects?.includes(p)}))];
 const matches=(r:Row)=>r.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
 const run=async(task:(current:PilotInfo)=>Promise<Result<Snapshot>>,message:string)=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const i=await window.thoughtline.info(),r=await task(i);if(!r.ok)throw Error(r.message);if(live.current){setOp(null);setNotice(message);}}catch(e){if(live.current)setError(e instanceof Error?e.message:'操作未成功，请重试。');}finally{pending.current=false;if(live.current)setBusy(false);}};
 const save=(name:string,color:string)=>{if(!op)return;void run(i=>op.field==='tag'?window.thoughtline.agentChange(op.kind==='new'?{kind:'add',name,color}:{kind:'update',id:op.id,name:op.id==='general'?(i.snapshot.agents.find(a=>a.id==='general')?.name??name):name,color},i.snapshot.revision):window.thoughtline.classificationChange(op.kind==='new'?{kind:'addProject',name}:{kind:'renameProject',from:op.id,name},i.snapshot.revision),t('已保存'));};
 const close=async(back:boolean)=>{if(busy||op)return;const r=back?await window.thoughtline.returnClassification():await window.thoughtline.closeManage();if(!r.ok)setError(r.message);};
 const renderRow=(row:Row,field:Field,removed=false)=><div className={'classification-row'+(removed?' classification-restore-row':'')} key={row.id} data-classification-id={row.id}>
  <span className="classification-name">{field==='tag'?<span className="classification-dot" style={{background:row.color}}/>:<FolderIcon/>}<span title={row.name}>{row.name}</span>{!removed&&(row.system||row.inactive)&&<small className="classification-state">{t(row.system?'默认':'已移除')}</small>}</span>
  {!removed&&<span className="classification-count">{classificationCount(info.snapshot,field,row.id)}</span>}
  <span className="classification-row-actions">{removed?<button disabled={busy} onClick={()=>void run(i=>window.thoughtline.classificationChange({kind:'active',field,id:row.id,active:true},i.snapshot.revision),t('已恢复选用'))}>{t('恢复选用')}</button>:<>
   {(!row.system||field==='tag')&&<span title={row.inactive?t(field==='tag'?'恢复选用后可编辑':'恢复选用后可改名'):undefined} tabIndex={row.inactive?0:undefined}><button disabled={busy||row.inactive} onClick={()=>{setError('');setOp({kind:'edit',field,id:row.id,name:field==='tag'?(info.snapshot.agents.find(a=>a.id===row.id)?.name??row.name):row.name,color:row.color});}}>{t(row.system?'改颜色':field==='tag'?'编辑':'改名')}</button></span>}
   {!row.system&&<button disabled={busy} onClick={()=>{setError('');setReplacement(field==='tag'?'general':'');setOp({kind:'delete',field,id:row.id,name:row.name,color:row.color});}}>{t('删除')}</button>}
  </>}</span>
 </div>;
 const renderList=(rows:Row[],field:Field,removed=false)=>{const list=rows.filter(r=>matches(r)&&(!removed||r.inactive));return <section className="classification-list" {...(removed?{'data-removed-kind':field}:{})}>
  {removed?<h2 className="classification-section-title">{t(field==='tag'?'标签':'分组')} <small>· {rows.filter(r=>r.inactive).length}</small></h2>:<div className="classification-row classification-columns"><span>{t(field==='tag'?'标签':'分组')}</span><span>{t('关联念头')}</span><span>{t('操作')}</span></div>}
  <div className="classification-scroll">{list.map(row=>renderRow(row,field,removed))}{!list.length&&<p className="classification-empty">{t(query?'未找到匹配项':removed?(field==='tag'?'暂无已移除标签':'暂无已移除分组'):'暂无分类')}</p>}</div>
 </section>;};
 const modalTag=op?.field==='tag';
 return <main data-view="manage" data-mode="classification" data-material={info.manageMaterial} data-platform={info.platform} className="manage classification-manager" onKeyDown={e=>{if(e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;if(e.key==='Escape'){e.preventDefault();if(op){if(!busy){setOp(null);setError('');}}else void close(true);}}}>
  <div className="classification-content" inert={!!op}>
   <header><div className="classification-heading"><IconButton icon="back" label={t('返回')} onClick={()=>void close(true)}/><strong>{t('标签与分组')}</strong></div><div className="detail-header-actions"><PreferencesControl info={info}/><button className="close" aria-label={t('关闭')} onClick={()=>void close(false)}>×</button></div></header>
   <nav className="settings-tabs" role="tablist" aria-label={t('标签与分组')}>{(['tags','projects','removed'] as const).map((key,n)=><button key={key} id={'classification-tab-'+key} role="tab" aria-selected={tab===key} aria-controls="classification-list-panel" tabIndex={tab===key?0:-1} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const keys=['tags','projects','removed'] as const,index=keys.indexOf(key),next=keys[e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3];setTab(next);setQuery('');setError('');document.getElementById('classification-tab-'+next)?.focus();}}} onClick={()=>{setTab(key);setQuery('');setError('');}}>{t(n===0?'标签':n===1?'分组':'已移除')}</button>)}</nav>
   <div className="classification-toolbar"><div className="classification-search"><SearchIcon/><input aria-label={t(tab==='tags'?'搜索标签':tab==='projects'?'搜索分组':'搜索已移除项')} placeholder={t(tab==='tags'?'搜索标签':tab==='projects'?'搜索分组':'搜索已移除项')} value={query} onChange={e=>setQuery(e.target.value)}/></div>{tab!=='removed'&&<button className="primary" disabled={busy} onClick={()=>{setError('');setOp({kind:'new',field:tab==='tags'?'tag':'project',id:'',name:'',color:'#789360'});}}><span aria-hidden="true">＋</span> {t(tab==='tags'?'新增标签':'新增分组')}</button>}</div>
   <div id="classification-list-panel" role="tabpanel" aria-labelledby={'classification-tab-'+tab} className={'classification-panel'+(tab==='removed'?' classification-removed-sections':'')}>{tab==='removed'?<>{renderList(tags,'tag',true)}{renderList(projects,'project',true)}</>:renderList(tab==='tags'?tags:projects,tab==='tags'?'tag':'project')}</div>
   <p role={error?'alert':'status'} className={'classification-feedback'+(error?' error':'')} {...noticeProps}>{m(error||notice)||'\u00a0'}</p>
  </div>
  {op&&<div className="classification-modal-backdrop"><div ref={modal} className="classification-modal" role="dialog" aria-modal="true" aria-labelledby="classification-dialog-heading" onKeyDown={e=>{if(e.key!=='Tab')return;const controls=[...modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')??[]],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}><h2 id="classification-dialog-heading">{t(op.kind==='new'?(modalTag?'新建标签':'新建分组'):op.kind==='delete'?(modalTag?'删除标签':'删除分组'):modalTag?'编辑标签':'分组改名')}</h2>
   {op.kind==='delete'?<><p className="classification-impact">{t(modalTag?'删除后，相关念头和草稿改用所选标签。':'删除后，相关念头和草稿改用所选分组。')}<br/>{t('正文保留。')} <strong>{op.name}</strong> · {classificationCount(info.snapshot,op.field,op.id)}</p><label className="classification-migration">{t('迁移到')}<select aria-label={t('迁移到')} disabled={busy} value={replacement} onChange={e=>setReplacement(e.target.value)}>{modalTag?activeTags(info.snapshot).filter(a=>a.id!==op.id).map(a=><option key={a.id} value={a.id}>{agentName(a)}</option>):<><option value="">{t('未分组')}</option>{activeProjects(info.snapshot).filter(p=>p!==op.id).map(p=><option key={p}>{p}</option>)}</>}</select></label>{error&&<p className="error" role="alert">{m(error)}</p>}<div className="popover-form-actions"><button disabled={busy} onClick={()=>{setOp(null);setError('');}}>{t('取消')}</button><button className="classification-danger" disabled={busy} onClick={()=>void run(i=>modalTag?window.thoughtline.agentChange({kind:'remove',id:op.id,replacement},i.snapshot.revision):window.thoughtline.projectDelete(op.id,i.snapshot.revision,replacement),t('已删除'))}>{t('删除')}</button></div></>:<><ClassificationForm key={op.kind+op.id} tag={modalTag} name={op.name} color={op.color||'#789360'} protectedName={modalTag&&op.id==='general'} creating={op.kind==='new'} busy={busy} error={error} onCancel={()=>{setOp(null);setError('');}} onSave={save}/>{op.kind==='edit'&&<p className="classification-impact">{t('关联念头')} · {classificationCount(info.snapshot,op.field,op.id)}</p>}</>}
  </div></div>}
 </main>;
}
