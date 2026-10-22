// SPDX-License-Identifier: GPL-3.0-only
import type { Point, Rect } from './contracts';
export const sagForCount = (n: number): number => Math.min(88, 8 + 6 * Math.max(0, Number.isFinite(n) ? n : 0));
export function ropeY(x: number, width: number, n: number): number {
  const t=width>0?Math.max(0,Math.min(1,x/width)):0.5;
  return 10+4*sagForCount(n)*t*(1-t);
}
export const toLocal=(p:Point,o:Point):Point=>({x:p.x-o.x,y:p.y-o.y});
export const contains=(r:Rect,p:Point):boolean=>r.width>0&&r.height>0&&p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.width&&p.y<r.y+r.height;
export type ShelfCapacity=4|6|8;
export const shelfCapacity=(value:unknown):ShelfCapacity=>value===4||value===8?value:6;
export const visibleSlots=(_width:number,capacity:ShelfCapacity=6):number=>capacity;
// The chosen capacity, rather than the current note count, controls the rail.
export type FixedRope={left:number;length:number;top:number;sag:number};
export function fixedRope(width:number,capacity:ShelfCapacity=6):FixedRope{
 const w=Math.max(0,Number.isFinite(width)?width:0),margin=Math.min(w*.08,capacity===4?120:64);
 const length=Math.max(0,w-2*margin);
 return {left:margin,length,top:32,sag:Math.min(30,Math.max(18,length*.026))};
}
export function ropeClipBounds(width:number,edgeInset:number,capacity:ShelfCapacity=6){
 const rope=fixedRope(width,capacity),w=Math.max(0,Number.isFinite(width)?width:0);
 return {min:Math.max(edgeInset,rope.left+rope.length*.05),max:Math.min(w-edgeInset,rope.left+rope.length*.95)};
}
export function fixedRopeY(x:number,rope:FixedRope):number{
 const t=rope.length>0?Math.max(0,Math.min(1,(x-rope.left)/rope.length)):.5;
 return rope.top+4*rope.sag*t*(1-t);
}
