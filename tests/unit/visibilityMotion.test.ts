import {expect,test} from 'vitest';
import {currentWeight,retargetVisibility,type WeightMotion} from '../../src/shared/motionTokens';
test('快速进出从当前帧接续；无关状态更新不重启滑入',()=>{
 const idle:WeightMotion={from:0,to:0,startedAt:0,duration:0};
 const entering=retargetVisibility(idle,true,100,false);
 const again=retargetVisibility(entering,true,180,false);expect(again).toBe(entering);
 const value=currentWeight(entering,180),leaving=retargetVisibility(entering,false,180,false);
 expect(currentWeight(leaving,180)).toBe(value);expect(currentWeight(leaving,340)).toBe(0);
 const reversal=retargetVisibility(leaving,true,220,false);expect(currentWeight(reversal,220)).toBe(currentWeight(leaving,220));
 expect(currentWeight(reversal,440)).toBe(1);
});
test('系统减少动态效果在半途开启时直接到最终显隐',()=>{
 const moving=retargetVisibility({from:0,to:0,startedAt:0,duration:0},true,0,false);
 expect(currentWeight(retargetVisibility(moving,true,60,true),60)).toBe(1);
 expect(currentWeight(retargetVisibility(moving,false,60,true),60)).toBe(0);
});
