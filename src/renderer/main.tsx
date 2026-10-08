import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {PilotInfo} from '../shared/bridge';
import {Shelf} from './components/Shelf';
import {Composer} from './components/Composer';
import {Detail} from './components/Detail';
import {Manage} from './components/Manage';
import './styles/overlay.css';
function App(){
 const [info,setInfo]=useState<PilotInfo|null>(null);
 useEffect(()=>{const off=window.thoughtline.onInfo(setInfo);window.thoughtline.info().then(setInfo).catch(console.error);return off;},[]);
 useEffect(()=>{if(info)document.documentElement.dataset.theme=info.dark?'dark':'light';},[info?.dark]);
 if(!info)return null;const view=new URLSearchParams(location.search).get('view');
 return view==='composer'?<Composer info={info}/>:view==='manage'?(info.manageMode==='detail'?<Detail info={info}/>:<Manage info={info}/>):<Shelf info={info}/>;
}
createRoot(document.getElementById('root')!).render(<App/>);
