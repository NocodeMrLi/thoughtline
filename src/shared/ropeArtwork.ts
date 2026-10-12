import {fixedRopeY,type FixedRope} from './ropeGeometry';
/** Waves flatten smoothly at each jaw, preserving both contact point and tangent. */
export function vineArtwork(rope:FixedRope,anchors:number[]){
 const end=rope.left+rope.length;
 const distance=(x:number)=>Math.max(0,Math.min(x-rope.left,end-x,...anchors.map(a=>Math.abs(a-x))));
 const y=(x:number)=>fixedRopeY(x,rope)+3.4*Math.sin((x-rope.left)/31+.7)*Math.sin(Math.min(1,distance(x)/36)*Math.PI/2)**2;
 const points=[...new Set([...Array.from({length:Math.ceil(rope.length/3)+1},(_,i)=>rope.left+Math.min(rope.length,i*3)),...anchors])].filter(x=>x>=rope.left&&x<=end).sort((a,b)=>a-b);
 const path=(twine=false)=>points.map((x,i)=>`${i?'L':'M'}${x.toFixed(3)} ${(y(x)+(twine?Math.sin(x/12)*3.8*Math.min(1,distance(x)/22):0)).toFixed(3)}`).join(' ');
 // Foliage is attached to the rope, not the gaps between movable clips.
 // Only the stem's contact envelope follows jaws; clips paint over foliage.
 const count=rope.length<70?0:Math.max(1,Math.floor(rope.length/180));
 const branches=Array.from({length:count},(_,i)=>{const x=rope.left+rope.length*(i+.5)/count,d=Math.min(x-rope.left,end-x),wave=3.4*Math.sin((x-rope.left)/31+.7)*Math.sin(Math.min(1,d/36)*Math.PI/2)**2;return {x,y:fixedRopeY(x,rope)+wave,side:i%2?-1:1,length:17+(i%3)*5,angle:i%2?-17:24,index:i};});
 return {stem:path(),twine:path(true),branches,y};
}
