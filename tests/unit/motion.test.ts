import {expect,test} from 'vitest';
import {currentWeight,retargetWeight,type WeightMotion} from '../../src/shared/motionTokens';
const start:WeightMotion={from:26,to:44,startedAt:0,duration:360};
test('半途减重从当前可见值继续，无跳回原始位置',()=>{
  expect(currentWeight(start,180)).toBe(41.75);
  const next=retargetWeight(start,26,180,{visible:true,locked:false,reduced:false});
  expect(currentWeight(next,180)).toBe(41.75);
  expect(currentWeight(next,540)).toBe(26);
});
test('操作锁冻结几何，隐藏或减少动态效果立即定在新目标',()=>{
  expect(retargetWeight(start,26,180,{visible:true,locked:true,reduced:false})).toEqual(start);
  const hidden=retargetWeight(start,26,180,{visible:false,locked:false,reduced:false});
  expect(hidden.duration).toBe(0);expect(currentWeight(hidden,180)).toBe(26);
  const reduced=retargetWeight(start,26,180,{visible:true,locked:false,reduced:true});
  expect(reduced.duration).toBe(0);expect(currentWeight(reduced,180)).toBe(26);
});
