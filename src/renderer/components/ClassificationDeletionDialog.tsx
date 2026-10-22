// SPDX-License-Identifier: GPL-3.0-only
import {useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {classificationDeletionPreview,type ClassificationField} from '../../shared/classificationDeletion';
import {activeProjects,activeTags} from '../../shared/classification';
import {formatShelfDay,ideaDay} from '../../shared/ideaHistory';
import {useLocale} from '../LocaleContext';
export function ClassificationDeletionDialog({info,field,id,name,busy,error,onCancel,onMigrate,onPermanent}:{info:PilotInfo;field:ClassificationField;id:string;name:string;busy:boolean;error:string;onCancel:()=>void;onMigrate:(replacement:string)=>void;onPermanent:(fingerprint:string)=>void}){
 const {t,m,locale,agentName}=useLocale(),tag=field==='tag',preview=classificationDeletionPreview(info.snapshot,field,id);
 const [permanent,setPermanent]=useState(false),[expanded,setExpanded]=useState(false),[ack,setAck]=useState<string|null>(null),[replacement,setReplacement]=useState(tag?'general':'');
 const used=preview.ideas.length>0||!!preview.draft,active=permanent&&used,ready=ack===preview.fingerprint,displayName=tag?(info.snapshot.agents.find(a=>a.id===id)?.name??name):name;
 const location=(status:string)=>t(status==='hanging'?'挂绳':status==='deleted'?'最近删除':'日历');
 return <>
  <div className="classification-delete-body">
   {used&&<div className="classification-delete-modes" role="radiogroup" aria-label={t('删除方式')}>
    <label><input type="radio" name="classification-delete-mode" checked={!permanent} disabled={busy} onChange={()=>{setPermanent(false);setAck(null);}}/>{t('保留内容并迁移')}</label>
    <label><input type="radio" name="classification-delete-mode" checked={permanent} disabled={busy} onChange={()=>{setPermanent(true);setAck(null);}}/>{t(tag?'彻底删除标签及内容':'彻底删除分组及内容')}</label>
   </div>}
   {active?<>
    <div className="classification-delete-summary"><div><strong>{displayName}</strong><span>{t('共几张念头',{count:preview.ideas.length})}</span><button className="classification-delete-link" disabled={busy} onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>{t(expanded?'收起内容':'查看内容')}</button></div>
     <small>{t('分类删除数量',{hanging:preview.counts.hanging,archived:preview.counts.archived,deleted:preview.counts.deleted})}</small>
     {preview.draft&&<small>{t('另有1份关联草稿')}</small>}
     {tag&&<small>{t('此标签的内容可能分布在多个分组。')}</small>}
    </div>
    {expanded&&<div className="classification-delete-preview" tabIndex={0} role="region" aria-label={t('待删除内容')}>
     <table><thead><tr><th>{t('念头名称')}</th><th>{t('创建日期')}</th><th>{t('所在位置')}</th>{tag&&<th>{t('分组')}</th>}</tr></thead><tbody>{preview.ideas.map(i=><tr key={i.id} data-delete-idea-id={i.id}><td title={i.title||i.text}>{i.title||i.text.split('\n')[0]||t('无标题')}</td><td>{formatShelfDay(ideaDay(i),locale)}</td><td>{location(i.status)}</td>{tag&&<td title={i.project||t('未分组')}>{i.project||t('未分组')}</td>}</tr>)}</tbody></table>
    </div>}
    {expanded&&preview.draft&&<p className="classification-delete-draft" title={preview.draft.title||preview.draft.text}>{t('关联草稿')}：{preview.draft.title||preview.draft.text.split('\n')[0]||t('无标题')}</p>}
   </>:<><p className="classification-impact">{t(used?(tag?'删除后，相关念头和草稿改用所选标签。':'删除后，相关念头和草稿改用所选分组。'):'此分类没有念头或草稿，确认删除？')}<br/><strong>{displayName}</strong>{used&&<> · {preview.ideas.length}</>}</p>
    {used&&<label className="classification-migration">{t('迁移到')}<select aria-label={t('迁移到')} value={replacement} disabled={busy} onChange={e=>setReplacement(e.target.value)}>{tag?activeTags(info.snapshot).filter(a=>a.id!==id).map(a=><option key={a.id} value={a.id}>{agentName(a)}</option>):<><option value="">{t('未分组')}</option>{activeProjects(info.snapshot).filter(p=>p!==id).map(p=><option key={p}>{p}</option>)}</>}</select></label>}
   </>}
  </div>
  {active&&<><p className="classification-delete-warning">{t('不进入最近删除，已有备份保留。')}</p><label className="classification-delete-ack"><input type="checkbox" checked={ready} disabled={busy} onChange={e=>setAck(e.target.checked?preview.fingerprint:null)}/>{t('我已了解，此操作不可撤销')}</label></>}
  {error&&<p className="error" role="alert">{m(error)}</p>}
  <div className="popover-form-actions"><button disabled={busy} onClick={onCancel}>{t('取消')}</button><button className={active?'classification-delete-permanent':'classification-danger'} disabled={busy||!preview.exists||active&&!ready} onClick={()=>active?onPermanent(preview.fingerprint):onMigrate(replacement)}>{t(active?'彻底删除':used?'迁移并删除':'删除')}</button></div>
 </>;
}
