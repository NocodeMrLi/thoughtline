// SPDX-License-Identifier: GPL-3.0-only
export const motion={reveal:220,hide:160,weight:360,composerIn:140,composerOut:100,copy:120} as const;
export const theme={dark:{surface:'#22242B',text:'#F5F3ED',muted:'#B8BDC9'},light:{surface:'#F5F3ED',text:'#24262D',muted:'#565B68'}} as const;
export type WeightMotion={from:number;to:number;startedAt:number;duration:number;easing?:'spring'|'in'};
export function currentWeight(m:WeightMotion,now:number):number{
  if(m.duration<=0)return m.to;
  const t=Math.max(0,Math.min(1,(now-m.startedAt)/m.duration));
  const progress=m.easing==='spring'?(1-(1+8*t)*Math.exp(-8*t))/(1-9*Math.exp(-8)):m.easing==='in'?t*t:1-(1-t)**3;
  return m.from+(m.to-m.from)*progress;
}
export function retargetWeight(m:WeightMotion,next:number,now:number,o:{visible:boolean;locked:boolean;reduced:boolean}):WeightMotion{
  if(o.locked){const value=currentWeight(m,now);return {from:value,to:value,startedAt:now,duration:0};}
  return {from:o.visible&&!o.reduced?currentWeight(m,now):next,to:next,startedAt:now,duration:o.visible&&!o.reduced?motion.weight:0,easing:'spring'};
}

export function retargetVisibility(m:WeightMotion,visible:boolean,now:number,reduced:boolean):WeightMotion{
 const to=visible?1:0;
 if(reduced)return {from:to,to,startedAt:now,duration:0};
 if(m.to===to)return m;
 return {from:currentWeight(m,now),to,startedAt:now,duration:visible?motion.reveal:motion.hide,easing:visible?'spring':'in'};
}
