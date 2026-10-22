// SPDX-License-Identifier: GPL-3.0-only
import {useLayoutEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {ShelfFilterPicker} from './ShelfFilterPicker';
import {ShelfMergePicker} from './ShelfMergePicker';
export function PickerHost({info}:{info:PilotInfo}){
 const root=useRef<HTMLDivElement>(null),[error,setError]=useState(''),session=info.shelfMergePicker?.session??info.shelfFilterPicker?.session;
 useLayoutEffect(()=>{if(!session||!root.current)return;let frame=0,alive=true;const size=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const panel=root.current?.querySelector<HTMLElement>('.compact-popover');if(!alive||!panel)return;const capped=panel.style.maxHeight;panel.style.maxHeight='none';const r=panel.getBoundingClientRect();panel.style.maxHeight=capped;void window.thoughtline.pickerSize(session,Math.ceil(r.width+16),Math.ceil(r.height+16)).catch(()=>{});});};const observer=new ResizeObserver(size);observer.observe(root.current);window.addEventListener('thoughtline:hit-layout-refresh',size);size();return()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('thoughtline:hit-layout-refresh',size);};},[session]);
 return <div ref={root} className="picker-host">{info.shelfMergePicker?<ShelfMergePicker key={session} info={info} onError={setError}/>:info.shelfFilterPicker?<ShelfFilterPicker key={session} info={info} onError={setError}/>:null}{error&&<p className="error" role="alert">{error}</p>}</div>;
}
