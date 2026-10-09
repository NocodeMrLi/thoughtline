import type {Clip} from './contracts';
import {ropeClipBounds} from './ropeGeometry';
export const CARD_WIDTH=160,CARD_HEIGHT=226,MIN_SPACING=172,COMFORT_SPACING=220,MARGIN=12;
// Positions are ratios within this shared travel area. Existing 0..1 positions
// map proportionally into the centered rail; no snapshot or note rewrite.
export function clipTravelBounds(width:number){
 return ropeClipBounds(width,CARD_WIDTH/2+MARGIN);
}
export function layoutClips(clips:Clip[],width:number){
 const {min,max}=clipTravelBounds(width);const visible:{clip:Clip;x:number}[]=[],overflow:Clip[]=[];const capacity=Math.max(0,1+Math.floor((max-min)/COMFORT_SPACING));const start=(min+max-(Math.min(clips.length,capacity)-1)*COMFORT_SPACING)/2;let last=Number.NEGATIVE_INFINITY;
 for(const clip of clips){
  const preferred=clip.position===null?(visible.length?last+COMFORT_SPACING:start):min+clip.position*Math.max(0,max-min);
  const x=Math.max(min,last+MIN_SPACING,preferred);
  if(max<min){overflow.push(clip);continue;}
  if(x>max){
   // An explicit move near the right end may need its neighbours to make room.
   // Reflow only when the whole candidate sequence physically fits; a merge
   // with already-spaced captured coordinates keeps unrelated centres intact.
   if(clip.position!==null&&visible.length<1+Math.floor((max-min)/MIN_SPACING)){
    const next=[...visible.map(p=>p.x),max];
    for(let i=next.length-2;i>=0;i--)next[i]=Math.min(next[i],next[i+1]-MIN_SPACING);
    if(next[0]>=min){visible.forEach((p,i)=>{p.x=next[i];});visible.push({clip,x:max});last=max;continue;}
   }
   overflow.push(clip);continue;
  }
  visible.push({clip,x});last=x;
 }
 return {visible,overflow};
}
export function normalizedPosition(x:number,width:number){const {min,max}=clipTravelBounds(width);return Math.max(0,Math.min(1,(x-min)/Math.max(1,max-min)));}

// Snapshot current rendered positions before a clip mutation.
export function captureClipPositions(clips:Clip[],width:number,agentId='all'){
 const visibleClips=clips.filter(clip=>agentId==='all'||clip.agentId===agentId);
 const positions=new Map(layoutClips(visibleClips,width).visible.map(p=>[p.clip.id,normalizedPosition(p.x,width)]));
 return clips.map(clip=>positions.has(clip.id)?{...clip,position:positions.get(clip.id)!}:clip);
}
