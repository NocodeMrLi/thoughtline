export const motion={reveal:220,hide:160,weight:360,composerIn:140,composerOut:100,copy:120} as const;
export const theme={dark:{surface:'#22242B',text:'#F5F3ED',muted:'#B8BDC9'},light:{surface:'#F5F3ED',text:'#24262D',muted:'#565B68'}} as const;
export type WeightMotion={from:number;to:number;startedAt:number;duration:number};
export function currentWeight(m:WeightMotion,now:number):number{
  if(m.duration<=0)return m.to;
  const t=Math.max(0,Math.min(1,(now-m.startedAt)/m.duration));
  return m.from+(m.to-m.from)*(1-(1-t)**3);
}
export function retargetWeight(m:WeightMotion,next:number,now:number,o:{visible:boolean;locked:boolean;reduced:boolean}):WeightMotion{
  if(o.locked)return m;
  return {from:o.visible&&!o.reduced?currentWeight(m,now):next,to:next,startedAt:now,duration:o.visible&&!o.reduced?motion.weight:0};
}
