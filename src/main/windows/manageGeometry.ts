// SPDX-License-Identifier: GPL-3.0-only
import type {Rect} from '../../shared/contracts';
export type ManagePlacement={anchor?:Rect;preferredArea?:Rect;preserve?:boolean};
const overlap=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
export function fitManageBounds(requested:Rect,workAreas:Rect[],obstacles:Rect[]=[],options:ManagePlacement={}):Rect{
 if(!workAreas.length)return {...requested};
 const reference=options.preserve?requested:options.anchor??requested,savedArea=options.preserve&&workAreas.some(a=>overlap(requested,a)>0)?[...workAreas].sort((a,b)=>overlap(requested,b)-overlap(requested,a))[0]:undefined,area=savedArea??options.preferredArea??[...workAreas].sort((a,b)=>overlap(reference,b)-overlap(reference,a))[0];
 const margin=12,width=Math.max(1,Math.min(requested.width,area.width-margin*2)),height=Math.max(1,Math.min(requested.height,area.height-margin*2));
 const clamp=(value:number,min:number,max:number)=>Math.round(Math.max(min,Math.min(max,value)));
 const fit=(x:number,y:number,h=height):Rect=>({x:clamp(x,area.x+margin,area.x+area.width-margin-width),y:clamp(y,area.y+margin,area.y+area.height-margin-h),width,height:h});
 const base=fit(options.anchor?options.anchor.x+(options.anchor.width-width)/2:requested.x,options.anchor?.y??requested.y);
 const blockers=obstacles.filter(r=>overlap(base,r)>0);if(!blockers.length)return base;
 const crossing=obstacles.filter(r=>r.x<base.x+base.width&&r.x+r.width>base.x),below=Math.max(...crossing.map(r=>r.y+r.height))+16;
 const available=area.y+area.height-margin-below,minimum=Math.min(height,360);
 if(available>=minimum)return fit(base.x,below,Math.min(height,available));
 // Large side gaps can fit a full window; otherwise keep the complete window
 // on screen. Tiny work areas cannot promise both full avoidance and minimum size.
 const candidates=crossing.flatMap(r=>[fit(r.x-width-16,base.y),fit(r.x+r.width+16,base.y)]).filter(r=>!obstacles.some(o=>overlap(r,o)>0));
 candidates.sort((a,b)=>Math.abs(a.x-base.x)-Math.abs(b.x-base.x));return candidates[0]??base;
}
