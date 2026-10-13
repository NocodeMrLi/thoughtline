import {useEffect,useId,useRef,useState,type MouseEvent} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {AUTHOR_GITHUB_NAME,AUTHOR_GITHUB_URL,FEEDBACK_EMAIL,FEEDBACK_MAILTO,type ContactAction} from '../../shared/contact';
import {useLocale} from '../LocaleContext';
import {ActionIcon,IconButton} from './ActionIcon';
import {ClassificationUnavailableHint as SmallActionHint} from './ClassificationUnavailableHint';
import githubBlack from '../../../assets/github-invertocat-black.svg?url';
import githubWhite from '../../../assets/github-invertocat-white.svg?url';

export function SettingsContact({info,disabled,section}:{info:PilotInfo;disabled:boolean;section:string}){
 const {t}=useLocale(),id=useId(),sequence=useRef(0),pending=useRef(false),alive=useRef(true);
 const [busy,setBusy]=useState(false),[hint,setHint]=useState<{anchor:HTMLElement;text:string;eventId:number}|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>setHint(null),[t,info.dark,section]);
 const act=async(action:ContactAction,anchor:HTMLElement)=>{
  if(disabled||pending.current)return;pending.current=true;setBusy(true);setHint(null);
  try{const r=await window.thoughtline.contactAction(action);if(alive.current&&(!r.ok||action==='copy-email'))setHint({anchor,text:r.ok?t('邮箱已复制'):r.message,eventId:++sequence.current});}
  catch{if(alive.current)setHint({anchor,text:t(action==='copy-email'?'邮箱复制未成功，请重试。':'未能打开联系入口，请稍后重试。'),eventId:++sequence.current});}
  finally{pending.current=false;if(alive.current)setBusy(false);}
 };
 const open=(action:ContactAction)=>(e:MouseEvent<HTMLAnchorElement>)=>{e.preventDefault();void act(action,e.currentTarget);};
 return <div className="settings-contact-bar">
  <a className="settings-contact-action" href={AUTHOR_GITHUB_URL} aria-label={'GitHub: '+AUTHOR_GITHUB_NAME} aria-disabled={disabled||busy} aria-describedby={hint?.anchor instanceof HTMLAnchorElement&&hint.anchor.href===AUTHOR_GITHUB_URL?id:undefined} onClick={open('github')}><img className="settings-github-mark" src={info.dark?githubWhite:githubBlack} alt="" width="14" height="14"/><span>{AUTHOR_GITHUB_NAME}</span></a>
  <div className="settings-contact-mail"><a className="settings-contact-action" href={FEEDBACK_MAILTO} aria-disabled={disabled||busy} onClick={open('email')}><ActionIcon name="mail"/><span>{t('反馈建议')}：</span><span className="settings-contact-email">{FEEDBACK_EMAIL}</span></a><IconButton icon="copy" label={t('复制反馈邮箱')} disabled={disabled||busy} onClick={e=>void act('copy-email',e.currentTarget)}/></div>
  {hint&&<SmallActionHint anchor={hint.anchor} text={hint.text} eventId={hint.eventId} id={id} onClose={()=>setHint(null)}/>}</div>;
}
