import type {Clip} from './contracts';
import {ropeClipBounds} from './ropeGeometry';
export const CARD_WIDTH=160,CARD_HEIGHT=226,MIN_SPACING=172,COMFORT_SPACING=220,MARGIN=12;
// Positions are ratios within this shared travel area. Existing 0..1 positions
// map proportionally into the centered rail; no snapshot or note rewrite.
export function clipTravelBounds(width:number){
 return ropeClipBounds(width,CARD_WIDTH/2+MARGIN);
}
// Search every legal gap while leaving already allocated centers untouched.
export function availableClipPosition(centers:number[],width:number,preferred:number):number|null{
 const {min,max}=clipTravelBounds(width);if(max<min)return null;
 const points=[...centers].sort((a,b)=>a-b);const desired=Math.max(min,Math.min(max,preferred));
 if(points.every(x=>Math.abs(x-desired)>=MIN_SPACING-1e-8))return desired;
 let lower=min,best:number|null=null,distance=Infinity;
 const offer=(upper:number)=>{if(upper<lower)return;const x=Math.max(lower,Math.min(upper,preferred)),d=Math.abs(x-preferred);if(d<distance){best=x;distance=d;}};
 for(const x of points){offer(Math.min(max,x-MIN_SPACING));lower=Math.max(lower,x+MIN_SPACING);}
 offer(max);return best;
}
export function layoutClips(clips:Clip[],width:number){
 const {min,max}=clipTravelBounds(width),allocated=new Map<string,number>();
 const capacity=Math.max(0,1+Math.floor((max-min)/COMFORT_SPACING));
 const start=(min+max-(Math.min(clips.length,capacity)-1)*COMFORT_SPACING)/2;
 // Mutation commands capture old centers and append new clips. Allocation
 // follows that stable order; each new clip searches all gaps, including left.
 let index=0;
 for(const clip of clips){
  const preferred=clip.position===null?start+index++*COMFORT_SPACING:min+clip.position*Math.max(0,max-min);
  const x=availableClipPosition([...allocated.values()],width,preferred);
  if(x!==null)allocated.set(clip.id,x);
 }
 const visible=clips.filter(c=>allocated.has(c.id)).map(clip=>({clip,x:allocated.get(clip.id)!})).sort((a,b)=>a.x-b.x);
 for(let i=1;i<visible.length;i++)if(visible[i].x-visible[i-1].x<MIN_SPACING&&visible[i-1].x+MIN_SPACING<=max+1e-8)visible[i].x=visible[i-1].x+MIN_SPACING;
 return {visible,overflow:clips.filter(c=>!allocated.has(c.id))};
}
export function normalizedPosition(x:number,width:number){const {min,max}=clipTravelBounds(width);return max>min?Math.max(0,Math.min(1,(x-min)/(max-min))):0;}

// Snapshot current rendered positions before a clip mutation.
export function captureClipPositions(clips:Clip[],width:number,agentId='all'){
 const visibleClips=clips.filter(clip=>agentId==='all'||clip.agentId===agentId);
 const positions=new Map(layoutClips(visibleClips,width).visible.map(p=>[p.clip.id,normalizedPosition(p.x,width)]));
 return clips.map(clip=>{
  if(!positions.has(clip.id))return clip;const position=positions.get(clip.id)!;
  if(clip.position!==null&&Math.abs(clip.position-position)<1e-10)return clip;
  return {...clip,position};
 });
}
