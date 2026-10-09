import type {Rect} from '../../shared/contracts';
export function fitManageBounds(requested:Rect,workAreas:Rect[]):Rect{
 if(!workAreas.length)return requested;
 const overlap=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const area=[...workAreas].sort((a,b)=>overlap(requested,b)-overlap(requested,a))[0];
 const margin=12,width=Math.max(1,Math.min(requested.width,area.width-margin*2)),height=Math.max(1,Math.min(requested.height,area.height-margin*2));
 const clamp=(value:number,min:number,max:number)=>Math.round(Math.max(min,Math.min(max,value)));
 return {x:clamp(requested.x,area.x+margin,area.x+area.width-margin-width),y:clamp(requested.y,area.y+margin,area.y+area.height-margin-height),width,height};
}
