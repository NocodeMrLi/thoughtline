import {useEffect,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import {fixedRope,shelfCapacity} from '../../shared/ropeGeometry';
import {currentWeight,retargetVisibility,type WeightMotion} from '../../shared/motionTokens';
export function useShelfMotion(info:PilotInfo){
 const [systemReduced,setSystemReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const reduced=info.snapshot.settings.reducedMotion||systemReduced;
 const sag=fixedRope(info.width,shelfCapacity(info.snapshot.settings.shelfCapacity)).sag;
 const visibility=useRef<WeightMotion>({from:0,to:0,startedAt:0,duration:0});
 const [progress,setProgress]=useState(0);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setSystemReduced(media.matches);media.addEventListener('change',change);change();return()=>media.removeEventListener('change',change);},[]);
 useEffect(()=>{
  const now=performance.now();let request=0;
  visibility.current=retargetVisibility(visibility.current,info.shelfVisible,now,reduced);
  const tick=()=>{
   const at=performance.now();setProgress(currentWeight(visibility.current,at));
   if(visibility.current.duration>0&&at<visibility.current.startedAt+visibility.current.duration)request=requestAnimationFrame(tick);
  };
  tick();return()=>cancelAnimationFrame(request);
 },[info.shelfVisible,reduced]);
 useEffect(()=>{if(!info.shelfVisible&&progress===0)window.thoughtline.presentationFinished(info.presentationSession);},[info.shelfVisible,info.presentationSession,progress]);
 return {sag,progress,reduced};
}
