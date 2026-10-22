// SPDX-License-Identifier: GPL-3.0-only
import {useState,useRef} from 'react';
import {CompositionSession} from '../../shared/compositionSession';
import {useLocale} from '../LocaleContext';
const colours=['#A0A3AA','#3C87DD','#39ADB3','#AA73D0','#D99759','#789360'];
export function ClassificationForm({tag,name:initial='',color:initialColor='#789360',protectedName=false,busy,error,creating,selectOnCreate=false,onCancel,onSave}:{tag:boolean;name?:string;color?:string;protectedName?:boolean;busy:boolean;error:string;creating:boolean;selectOnCreate?:boolean;onCancel:()=>void;onSave:(name:string,color:string)=>void}){
 const {t,m}=useLocale(),[name,setName]=useState(initial),[color,setColor]=useState(initialColor),[preedit,setPreedit]=useState(false),composition=useRef(new CompositionSession<'name'>());
 return <form className="classification-form" onSubmit={e=>{e.preventDefault();if(!busy&&!composition.current.composing&&name.trim())onSave(name.trim(),color);}}>
  <label>{t('名称')}<input autoFocus aria-label={t('名称')} maxLength={40} disabled={busy||protectedName} value={name} onChange={e=>setName(e.target.value)} onFocus={e=>composition.current.focus(e.currentTarget)} onCompositionStart={e=>{composition.current.start('name',e.currentTarget,name,e.timeStamp);setPreedit(true);}} onCompositionEnd={e=>{if(composition.current.end(e.currentTarget,e.timeStamp)){setName(e.currentTarget.value);setPreedit(false);}}} onBlur={e=>{const abandoned=composition.current.blur(e.currentTarget);if(abandoned){setName(abandoned.before);setPreedit(false);}}} onKeyDown={e=>{if(composition.current.composing||e.nativeEvent.isComposing||e.nativeEvent.keyCode===229){if(e.key==='Enter'||e.key==='Escape')e.preventDefault();e.stopPropagation();}}}/></label>
  {tag&&<fieldset disabled={busy}><legend>{t('夹子颜色')}</legend><div className="classification-colours">{colours.map(c=><button type="button" key={c} style={{background:c}} aria-label={c} aria-pressed={color.toLowerCase()===c.toLowerCase()} onClick={()=>setColor(c)}>{color.toLowerCase()===c.toLowerCase()?'✓':''}</button>)}<label className="classification-custom-colour" title={t('自定')}>＋<input aria-label={t('自定颜色')} type="color" value={color} onChange={e=>setColor(e.target.value)}/></label></div><div className="classification-preview"><span className="classification-dot" style={{background:color}}/>{name||t('名称')}</div></fieldset>}
  {error&&<p role="alert" className="error">{m(error)}</p>}
  <div className="popover-form-actions"><button type="button" disabled={busy} onClick={onCancel}>{t('取消')}</button><button type="submit" className="primary" disabled={busy||preedit||!name.trim()}>{busy?t('保存中…'):creating?t(selectOnCreate?'创建并选用':'创建'):t('保存')}</button></div>
 </form>;
}
