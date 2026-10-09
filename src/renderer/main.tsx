import {LocaleProvider} from './LocaleContext';
import {newerPreferences} from '../shared/preferences';
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {PilotInfo} from '../shared/bridge';
import {Shelf} from './components/Shelf';
import {Composer} from './components/Composer';
import {Detail} from './components/Detail';
import {Calendar} from './components/Calendar';
import {Settings} from './components/Settings';
import './styles/overlay.css';
import './styles/auxiliary.css';
import './styles/preferences-theme.css';
import {flushPageSelections} from './hooks/useClipPage';
import {prepareLeave} from './hooks/leaveGuards';
function App(){
 useEffect(()=>window.thoughtline.onPrepareLeave(async()=>{try{if(!await prepareLeave())return false;await flushPageSelections();return true;}catch{return false;}}),[]);
 const [info,setInfo]=useState<PilotInfo|null>(null);
 useEffect(()=>{const accept=(incoming:PilotInfo)=>setInfo(prior=>prior?{...incoming,preferences:newerPreferences(prior.preferences,incoming.preferences),dark:incoming.preferences.version<prior.preferences.version?prior.dark:incoming.dark}:incoming);const off=window.thoughtline.onInfo(accept);window.thoughtline.info().then(accept).catch(console.error);return off;},[]);
 useEffect(()=>{if(info){document.documentElement.lang=info.preferences.locale;document.documentElement.dataset.theme=info.dark?'dark':'light';document.documentElement.dataset.motion=info.snapshot.settings.reducedMotion?'reduce':'normal';}},[info?.preferences.locale,info?.dark,info?.snapshot.settings.reducedMotion]);
 if(!info)return null;const view=new URLSearchParams(location.search).get('view');
 return <LocaleProvider locale={info.preferences.locale}>{view==='composer'?<Composer key={info.composerSession} info={info}/>:view==='manage'?(info.manageMode==='settings'?<Settings info={info}/>:info.manageMode==='detail'?<Detail info={info}/>:<Calendar info={info}/>):<Shelf info={info}/>}</LocaleProvider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
