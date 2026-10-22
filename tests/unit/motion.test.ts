// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {currentWeight,retargetWeight,type WeightMotion} from '../../src/shared/motionTokens';
const start:WeightMotion={from:26,to:44,startedAt:0,duration:360};
test('半途减重从当前可见值继续，无跳回原始位置',()=>{
  expect(currentWeight(start,180)).toBe(41.75);
  const next=retargetWeight(start,26,180,{visible:true,locked:false,reduced:false});
  expect(currentWeight(next,180)).toBe(41.75);
  expect(currentWeight(next,540)).toBe(26);
});
test('隐藏或减少动态效果立即定在新目标',()=>{
  const hidden=retargetWeight(start,26,180,{visible:false,locked:false,reduced:false});
  expect(hidden.duration).toBe(0);expect(currentWeight(hidden,180)).toBe(26);
  const reduced=retargetWeight(start,26,180,{visible:true,locked:false,reduced:true});
  expect(reduced.duration).toBe(0);expect(currentWeight(reduced,180)).toBe(26);
});
test('在重量过渡中加操作锁，当前卡片高度必须冻结到解锁',()=>{
 const frozen=retargetWeight(start,26,180,{visible:true,locked:true,reduced:false});
 expect(currentWeight(frozen,180)).toBe(41.75);
 expect(currentWeight(frozen,5000)).toBe(41.75);
 const resumed=retargetWeight(frozen,26,5000,{visible:true,locked:false,reduced:false});
 expect(currentWeight(resumed,5000)).toBe(41.75);
 expect(currentWeight(resumed,5360)).toBe(26);
});
test('重量使用有限时长的临界阻尼回弹，不越过88DIP上限',()=>{
 const m=retargetWeight({from:8,to:8,startedAt:0,duration:0},88,100,{visible:true,locked:false,reduced:false});
 expect(m.easing).toBe('spring');let previous=8;
 for(let now=100;now<=460;now+=5){const value=currentWeight(m,now);expect(value).toBeGreaterThanOrEqual(previous);expect(value).toBeLessThanOrEqual(88);previous=value;}
 expect(currentWeight(m,460)).toBe(88);
});
