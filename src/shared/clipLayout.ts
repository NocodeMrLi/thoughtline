import type {Clip} from './contracts';
export const CARD_WIDTH=160,CARD_HEIGHT=226,MIN_SPACING=172,COMFORT_SPACING=220,MARGIN=12;
export function layoutClips(clips:Clip[],width:number){
 const min=CARD_WIDTH/2+MARGIN,max=width-min;const visible:{clip:Clip;x:number}[]=[],overflow:Clip[]=[];const capacity=Math.max(0,1+Math.floor((width-2*min)/COMFORT_SPACING));const start=(width-(Math.min(clips.length,capacity)-1)*COMFORT_SPACING)/2;let last=start-COMFORT_SPACING;
 for(const clip of clips){
  const preferred=clip.position===null?last+COMFORT_SPACING:min+clip.position*Math.max(0,max-min);
  const x=Math.max(min,last+MIN_SPACING,preferred);
  if(max<min||x>max){overflow.push(clip);continue;}
  visible.push({clip,x});last=x;
 }
 return {visible,overflow};
}
export function normalizedPosition(x:number,width:number){const min=CARD_WIDTH/2+MARGIN;return Math.max(0,Math.min(1,(x-min)/Math.max(1,width-2*min)));}

// Snapshot current rendered positions before a clip mutation.
export function captureClipPositions(clips:Clip[],width:number,agentId='all'){
 const visibleClips=clips.filter(clip=>agentId==='all'||clip.agentId===agentId);
 const positions=new Map(layoutClips(visibleClips,width).visible.map(p=>[p.clip.id,normalizedPosition(p.x,width)]));
 return clips.map(clip=>positions.has(clip.id)?{...clip,position:positions.get(clip.id)!}:clip);
}
