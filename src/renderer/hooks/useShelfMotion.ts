import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {sagForCount} from '../../shared/ropeGeometry';
import {currentWeight,retargetWeight,retargetVisibility,type WeightMotion} from '../../shared/motionTokens';
export function useShelfMotion(count:number,info:PilotInfo){
 const [systemReduced,setSystemReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const reduced=info.snapshot.settings.reducedMotion||systemReduced;
 const initial=sagForCount(count);
 const weight=useRef<WeightMotion>({from:initial,to:initial,startedAt:0,duration:0});
 const visibility=useRef<WeightMotion>({from:0,to:0,startedAt:0,duration:0});
 const [frame,setFrame]=useState({sag:initial,progress:0});
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setSystemReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 useEffect(()=>{
  const now=performance.now();let request=0;
  weight.current=retargetWeight(weight.current,sagForCount(count),now,{visible:info.shelfVisible,locked:info.interactionLocked,reduced});
  visibility.current=retargetVisibility(visibility.current,info.shelfVisible,now,reduced);
  const tick=()=>{
   const at=performance.now();setFrame({sag:currentWeight(weight.current,at),progress:currentWeight(visibility.current,at)});
   if([weight.current,visibility.current].some(m=>m.duration>0&&at<m.startedAt+m.duration))request=requestAnimationFrame(tick);
  };
  tick();return()=>cancelAnimationFrame(request);
 },[count,info.shelfVisible,info.interactionLocked,reduced]);
 useEffect(()=>{if(!info.shelfVisible&&frame.progress===0)window.thoughtline.presentationFinished(info.presentationSession);},[info.shelfVisible,info.presentationSession,frame.progress]);
 return {...frame,reduced};
}
