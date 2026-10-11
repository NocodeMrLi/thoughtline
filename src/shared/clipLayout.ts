import type {Clip} from './contracts';
import {ropeClipBounds,type ShelfCapacity} from './ropeGeometry';
export const CARD_WIDTH=160,CARD_HEIGHT=226,MIN_SPACING=172,COMFORT_SPACING=220,MARGIN=12;
export function clipMetrics(width:number,capacity:ShelfCapacity=6){
 const maxScale=capacity===4?1.05:capacity===6?1:.95;
 const {min,max}=ropeClipBounds(width,12,capacity);
 const scale=Math.max(.1,Math.min(maxScale,(max-min)/(capacity*CARD_WIDTH+(capacity-1)*12)));
 return {scale,spacing:172*scale,comfort:220*scale,cardWidth:CARD_WIDTH*scale,cardHeight:CARD_HEIGHT*scale};
}
// Positions are ratios within this shared travel area. Existing 0..1 positions
// map proportionally into the centered rail; no snapshot or note rewrite.
export function clipTravelBounds(width:number,capacity:ShelfCapacity=6){
 return ropeClipBounds(width,clipMetrics(width,capacity).cardWidth/2+MARGIN,capacity);
}
// Search every legal gap while leaving already allocated centers untouched.
export function availableClipPosition(centers:number[],width:number,preferred:number,capacity:ShelfCapacity=6):number|null{
 const {min,max}=clipTravelBounds(width,capacity),spacing=clipMetrics(width,capacity).spacing;if(width<320||centers.length>=capacity||max<min)return null;
 const points=[...centers].sort((a,b)=>a-b);const desired=Math.max(min,Math.min(max,preferred));
 if(points.every(x=>Math.abs(x-desired)>=spacing-1e-8))return desired;
 let lower=min,best:number|null=null,distance=Infinity;
 const offer=(upper:number)=>{if(upper<lower)return;const x=Math.max(lower,Math.min(upper,preferred)),d=Math.abs(x-preferred);if(d<distance){best=x;distance=d;}};
 for(const x of points){offer(Math.min(max,x-spacing));lower=Math.max(lower,x+spacing);}
 offer(max);return best;
}
export function layoutClips(clips:Clip[],width:number,capacity:ShelfCapacity=6){
 const {min,max}=clipTravelBounds(width,capacity),{spacing,comfort}=clipMetrics(width,capacity),allocated=new Map<string,number>();
 const count=Math.min(clips.length,capacity),step=count>1?Math.min(comfort,(max-min)/(count-1)):comfort;
 const start=(min+max-(count-1)*step)/2;
 // Mutation commands capture old centers and append new clips. Allocation
 // follows that stable order; each new clip searches all gaps, including left.
 let index=0;
 for(const clip of clips){
  const preferred=clip.position===null?start+index++*step:min+clip.position*Math.max(0,max-min);
  const x=availableClipPosition([...allocated.values()],width,preferred,capacity);
  if(x!==null)allocated.set(clip.id,x);
 }
 const visible=clips.filter(c=>allocated.has(c.id)).map(clip=>({clip,x:allocated.get(clip.id)!})).sort((a,b)=>a.x-b.x);
 for(let i=1;i<visible.length;i++)if(visible[i].x-visible[i-1].x<spacing&&visible[i-1].x+spacing<=max+1e-8)visible[i].x=visible[i-1].x+spacing;
 return {visible,overflow:clips.filter(c=>!allocated.has(c.id))};
}
export function normalizedPosition(x:number,width:number,capacity:ShelfCapacity=6){const {min,max}=clipTravelBounds(width,capacity);return max>min?Math.max(0,Math.min(1,(x-min)/(max-min))):0;}

// Snapshot current rendered positions before a clip mutation.
export function captureClipPositions(clips:Clip[],width:number,agentId='all',capacity:ShelfCapacity=6){
 const visibleClips=clips.filter(clip=>agentId==='all'||clip.agentId===agentId);
 const positions=new Map(layoutClips(visibleClips,width,capacity).visible.map(p=>[p.clip.id,normalizedPosition(p.x,width,capacity)]));
 return clips.map(clip=>{
  if(!positions.has(clip.id))return clip;const position=positions.get(clip.id)!;
  if(clip.position!==null&&Math.abs(clip.position-position)<1e-10)return clip;
  return {...clip,position};
 });
}
