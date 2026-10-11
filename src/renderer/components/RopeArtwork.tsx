import {memo,type CSSProperties} from 'react';
import {ropeAppearance,type RopeAppearance} from '../../shared/appearance';
import type {FixedRope} from '../../shared/ropeGeometry';
import {vineArtwork} from '../../shared/ropeArtwork';
export function ropeStyle(value?:RopeAppearance):CSSProperties{
 const rope=ropeAppearance(value);
 return {'--rope-light-color':rope.color??(rope.style==='cotton'?'#C0B497':rope.style==='vine'?'#778856':'#787D70'),'--rope-dark-color':rope.color??(rope.style==='cotton'?'#D1C5A7':rope.style==='vine'?'#9AAA79':'#A5AA9B'),'--rope-width':rope.style==='cotton'?3.1:rope.style==='vine'?2.8:2.2} as CSSProperties;
}
function Artwork({rope,anchors,appearance}:{rope:FixedRope;anchors:number[];appearance?:RopeAppearance}){
 const kind=ropeAppearance(appearance).style,base=`M ${rope.left} ${rope.top} Q ${rope.left+rope.length/2} ${rope.top+2*rope.sag} ${rope.left+rope.length} ${rope.top}`,vine=kind==='vine'?vineArtwork(rope,anchors):null,d=vine?.stem??base;
 const leaf=(x:number,y:number,angle:number,size:number,tone:string)=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}><path d="M0 0C-3.4 -4.7 -4 -10.2 0 -15.6C4.4 -11.7 6.4 -6.8 0 0Z" style={{fill:tone,stroke:'#5B734E',strokeWidth:.45}}/><path d="M0 -1Q.6 -7 .1 -13.5M.4 -6.3L-2 -8.3M.4 -9L2.3 -11" style={{fill:'none',stroke:'#D6DFB5',strokeOpacity:.45,strokeWidth:.45}}/></g>;
 return <>{vine&&<path d={vine.twine} className="vine-twine"/>}{['rope-shadow','rope-core','rope-light'].map(c=><path key={c} className={c} d={d}/>)}
 {kind==='cotton'&&Array.from({length:Math.floor(rope.length/4.8)},(_,i)=>{const t=(i+.5)*4.8/rope.length,x=rope.left+rope.length*t,y=rope.top+4*rope.sag*t*(1-t),angle=Math.atan2(4*rope.sag*(1-2*t),rope.length)*180/Math.PI;return <g key={i} transform={`translate(${x} ${y}) rotate(${angle})`}><path className="cotton-dark" d="M-1.3 -1.1L1.3 1.1"/><path className="cotton-light" d="M.7 -1.1L-1.6 1.1"/></g>;})}
 {vine?.branches.map(({x,y,side,length,angle,index:n})=><g key={n} transform={`translate(${x} ${y}) rotate(${angle})`}><path d={`M-6 0C2 ${-side*3} 6 ${side*length*.9} 18 ${side*length}`} className="vine-branch"/>{leaf(8,side*length*.5,side>0?133:-42,.78+(n%3)*.1,n%2?'#889D69':'#7D9564')}{leaf(16,side*length*.96,side>0?163:27,1.05,n%2?'#94A974':'#789360')}{leaf(1,side*5,side>0?220:-69,.64,'#A0B480')}{n%2===0&&<path d={`M14 ${side*length*.9}C31 ${side*(length+8)} 37 ${side*(length-13)} 29 ${side*(length-14)}C23 ${side*(length-16)} 21 ${side*(length-10)} 26 ${side*(length-8)}`} className="vine-tendril"/>}</g>)}
 </>;
}
export const RopeArtwork=memo(Artwork,(a,b)=>a.rope.left===b.rope.left&&a.rope.length===b.rope.length&&a.rope.top===b.rope.top&&a.rope.sag===b.rope.sag&&a.appearance?.style===b.appearance?.style&&a.appearance?.color===b.appearance?.color&&(a.appearance?.style!=='vine'||a.anchors.length===b.anchors.length&&a.anchors.every((x,i)=>x===b.anchors[i])));
