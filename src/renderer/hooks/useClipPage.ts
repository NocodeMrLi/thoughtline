import {useEffect,useRef,useState} from 'react';
import type {Clip} from '../../shared/contracts';
import {DraftAutosaver} from '../../shared/draftAutosaver';
let sequence=0;
type Choice={id:string;sequence:number};
type Checkpoint={worker:DraftAutosaver<Choice>;detached:boolean};
const savers=new Set<Checkpoint>();
function release(checkpoint:Checkpoint){checkpoint.worker.dispose();savers.delete(checkpoint);}
export async function flushPageSelections(){await Promise.all([...savers].map(async checkpoint=>{await checkpoint.worker.flush();if(checkpoint.detached)release(checkpoint);}));}
export function useClipPage(clip:Clip|undefined,onError:(message:string)=>void){
 const [optimistic,setOptimistic]=useState<string|null>(null),[ack,setAck]=useState<{sequence:number;id:string}|null>(null);
 const pending=useRef<Choice|null>(null),saver=useRef<DraftAutosaver<Choice>|null>(null),error=useRef(onError);error.current=onError;
 const current=useRef('');current.current=optimistic&&clip?.ideaIds.includes(optimistic)?optimistic:clip?.currentId??'';
 useEffect(()=>{
  setOptimistic(null);pending.current=null;if(!clip)return;
  let live=true;const worker=new DraftAutosaver<Choice>({id:clip.currentId,sequence:0},async choice=>{
   const r=await window.thoughtline.selectClip(clip.id,choice.id,choice.sequence);if(!r.ok)throw Error(r.message);if(live)setAck({sequence:choice.sequence,id:r.value.clips.find(c=>c.id===clip.id)?.currentId??choice.id});
  },e=>{if(live)error.current(e instanceof Error?e.message:'页码尚未保存，请重试。');},100,300);
  const checkpoint={worker,detached:false};saver.current=worker;savers.add(checkpoint);return()=>{live=false;checkpoint.detached=true;void worker.flush().then(()=>release(checkpoint)).catch(()=>{});if(saver.current===worker)saver.current=null;};
 },[clip?.id]);
 useEffect(()=>{if(pending.current&&ack&&ack.sequence>=pending.current.sequence){pending.current=null;setOptimistic(ack.id===clip?.currentId?null:ack.id);}else if(!pending.current&&optimistic===clip?.currentId)setOptimistic(null);},[clip?.currentId,ack,optimistic]);
 const choose=(id:string)=>{if(!clip?.ideaIds.includes(id))return;const choice={id,sequence:++sequence};pending.current=choice;current.current=id;setOptimistic(id);saver.current?.update(choice);};
 return {id:current.current,current:()=>current.current,choose,flush:()=>saver.current?.flush()??Promise.resolve()};
}
