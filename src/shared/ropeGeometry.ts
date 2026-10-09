import type { Point, Rect } from './contracts';
export const sagForCount = (n: number): number => Math.min(88, 8 + 6 * Math.max(0, Number.isFinite(n) ? n : 0));
export function ropeY(x: number, width: number, n: number): number {
  const t=width>0?Math.max(0,Math.min(1,x/width)):0.5;
  return 10+4*sagForCount(n)*t*(1-t);
}
export const toLocal=(p:Point,o:Point):Point=>({x:p.x-o.x,y:p.y-o.y});
export const contains=(r:Rect,p:Point):boolean=>r.width>0&&r.height>0&&p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.width&&p.y<r.y+r.height;
export const visibleSlots=(width:number):number=>{const {min,max}=ropeClipBounds(width,92);return Math.max(0,1+Math.floor((max-min)/220));};

// Fixed desktop rope: note count never changes its position, length or curvature.
export type FixedRope={left:number;length:number;top:number;sag:number};
export function fixedRope(width:number):FixedRope{
 const screenWidth=Math.max(0,Number.isFinite(width)?width:0);
 const length=screenWidth*.7;
 return {left:(screenWidth-length)/2,length,top:32,sag:Math.min(30,Math.max(18,length*.026))};
}
export function ropeClipBounds(width:number,edgeInset:number){
 const rope=fixedRope(width),screenWidth=Math.max(0,Number.isFinite(width)?width:0);
 return {min:Math.max(edgeInset,rope.left+rope.length/6),max:Math.min(screenWidth-edgeInset,rope.left+rope.length*5/6)};
}
export function fixedRopeY(x:number,rope:FixedRope):number{
 const t=rope.length>0?Math.max(0,Math.min(1,(x-rope.left)/rope.length)):.5;
 return rope.top+4*rope.sag*t*(1-t);
}
