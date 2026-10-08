import {expect,test} from 'vitest';
import * as geometry from '../../src/shared/ropeGeometry';
import {layoutClips} from '../../src/shared/clipLayout';
import type {Clip} from '../../src/shared/contracts';
test('空绳也有自然弧度，长度居中且两端在屏幕内',()=>{
 for(const width of [260,320,800,1440,2560,3840]){
  const rope=geometry.fixedRope?.(width);expect(rope).toBeDefined();if(!rope)continue;
  expect(rope.left).toBeGreaterThanOrEqual(0);expect(rope.left+rope.length).toBeLessThanOrEqual(width);expect(rope.length).toBeLessThanOrEqual(1160);expect(rope.sag).toBeGreaterThanOrEqual(18);expect(rope.sag).toBeLessThanOrEqual(30);expect(rope.top+rope.sag+138).toBeLessThan(340);
  expect(geometry.fixedRopeY?.(rope.left,rope)).toBeCloseTo(rope.top,10);expect(geometry.fixedRopeY?.(rope.left+rope.length,rope)).toBeCloseTo(rope.top,10);expect(geometry.fixedRopeY?.(width/2,rope)).toBeCloseTo(rope.top+rope.sag,10);
 }
});
test('少量与大量便签均沿固定绳排布，不因数量改变绳高；溢出仍可取用',()=>{
 const width=1440,rope=geometry.fixedRope?.(width);expect(rope).toBeDefined();if(!rope)return;
 for(const count of [0,1,3,24]){
  const clips:Clip[]=Array.from({length:count},(_,n)=>({id:String(n),agentId:'general',ideaIds:[String(n)],currentId:String(n),position:null}));
  const layout=layoutClips(clips,rope.length);expect(layout.visible.length+layout.overflow.length).toBe(count);
  for(const p of layout.visible){const x=rope.left+p.x,y=geometry.fixedRopeY?.(x,rope)!;expect(x-80).toBeGreaterThanOrEqual(0);expect(x+80).toBeLessThanOrEqual(width);expect(y).toBeGreaterThanOrEqual(rope.top);expect(y).toBeLessThanOrEqual(rope.top+rope.sag);}
  expect(geometry.fixedRopeY?.(width/2,rope)).toBeCloseTo(rope.top+rope.sag,10);
 }
});
