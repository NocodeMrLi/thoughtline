import {useEffect,useRef,useState} from 'react';
import type {Clip} from '../../shared/contracts';
import {DraftAutosaver} from '../../shared/draftAutosaver';
let sequence=0;
type Choice={id:string;sequence:number};
type Checkpoint={worker:DraftAutosaver<Choice>;detached:boolean};
const savers=new Set<Checkpoint>();
function release(checkpoint:Checkpoint){checkpoint.worker.dispose();savers.delete(checkpoint);}
export async function flushPageSelections(){await Promise.all([...savers].map(async checkpoint=>{await checkpoint.worker.flush();if(checkpoint.detached)release(checkpoint);}));}
export function useClipPage(clip:Clip|undefined,onError:(message:string)=>void,view?:{ids:string[];key:string}){
 const [local,setLocal]=useState<{key:string;id:string}|null>(null);
 const ids=view?.ids??clip?.ideaIds??[];
 const [optimistic,setOptimistic]=useState<string|null>(null),[ack,setAck]=useState<{sequence:number;id:string}|null>(null);
 const pending=useRef<Choice|null>(null),saver=useRef<DraftAutosaver<Choice>|null>(null),error=useRef(onError);error.current=onError;
 const current=useRef('');current.current=view?(local?.key===view.key&&ids.includes(local.id)?local.id:ids.includes(clip?.currentId??'')?clip!.currentId:ids[0]??''):optimistic&&clip?.ideaIds.includes(optimistic)?optimistic:clip?.currentId??'';
 useEffect(()=>{
  setOptimistic(null);pending.current=null;if(!clip||view)return;
  let live=true;const worker=new DraftAutosaver<Choice>({id:clip.currentId,sequence:0},async choice=>{
   const r=await window.thoughtline.selectClip(clip.id,choice.id,choice.sequence);
   if(!r.ok){if(r.code==='INVALID'){const current=await window.thoughtline.info(),owner=[...current.snapshot.clips,...current.snapshot.archivedClips??[],...current.snapshot.capacityOverflow??[]].find(c=>c.id===clip.id);if(!owner?.ideaIds.includes(choice.id))return;}throw Error(r.message);}
   if(live)setAck({sequence:choice.sequence,id:[...r.value.clips,...r.value.archivedClips??[],...r.value.capacityOverflow??[]].find(c=>c.id===clip.id)?.currentId??choice.id});
  },e=>{if(live)error.current(e instanceof Error?e.message:'页码尚未保存，请重试。');},100,300);
  const checkpoint={worker,detached:false};saver.current=worker;savers.add(checkpoint);return()=>{live=false;checkpoint.detached=true;void worker.flush().then(()=>release(checkpoint)).catch(()=>{});if(saver.current===worker)saver.current=null;};
 },[clip?.id,view?.key]);
 useEffect(()=>{if(pending.current&&ack&&ack.sequence>=pending.current.sequence){pending.current=null;setOptimistic(ack.id===clip?.currentId?null:ack.id);}else if(!pending.current&&optimistic===clip?.currentId)setOptimistic(null);},[clip?.currentId,ack,optimistic]);
 const choose=(id:string)=>{if(!ids.includes(id))return;if(view){current.current=id;setLocal({key:view.key,id});return;}const choice={id,sequence:++sequence};pending.current=choice;current.current=id;setOptimistic(id);saver.current?.update(choice);};
 return {id:current.current,current:()=>current.current,choose,flush:()=>saver.current?.flush()??Promise.resolve()};
}
