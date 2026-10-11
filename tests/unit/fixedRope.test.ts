import {expect,test} from 'vitest';
import * as geometry from '../../src/shared/ropeGeometry';
import {layoutClips,CARD_WIDTH,CARD_HEIGHT} from '../../src/shared/clipLayout';
import type {Clip} from '../../src/shared/contracts';
test('绳居中并留两端空白，固定弧线留出上方夹子命中空间',()=>{
 for(const width of [260,320,800,1440,2560,3840]){
  const rope=geometry.fixedRope?.(width);expect(rope).toBeDefined();if(!rope)continue;
  expect(rope.left).toBeGreaterThan(0);expect(rope.left+rope.length).toBeLessThan(width);expect(rope.sag).toBeGreaterThanOrEqual(18);expect(rope.sag).toBeLessThanOrEqual(30);expect(rope.top-31).toBeGreaterThanOrEqual(0);expect(rope.top+rope.sag+6+CARD_HEIGHT+4).toBeLessThan(340);
  expect(geometry.fixedRopeY?.(rope.left,rope)).toBeCloseTo(rope.top,10);expect(geometry.fixedRopeY?.(rope.left+rope.length,rope)).toBeCloseTo(rope.top,10);expect(geometry.fixedRopeY?.(width/2,rope)).toBeCloseTo(rope.top+rope.sag,10);
 }
});
test('少量与大量便签均沿固定绳排布，不因数量改变绳高；溢出仍可取用',()=>{
 const width=1440,rope=geometry.fixedRope?.(width);expect(rope).toBeDefined();if(!rope)return;
 for(const count of [0,1,3,24]){
  const clips:Clip[]=Array.from({length:count},(_,n)=>({id:String(n),agentId:'general',ideaIds:[String(n)],currentId:String(n),position:null}));
  const layout=layoutClips(clips,width);expect(layout.visible.length+layout.overflow.length).toBe(count);
  for(const p of layout.visible){const x=p.x,y=geometry.fixedRopeY?.(x,rope)!;expect(x-CARD_WIDTH/2).toBeGreaterThanOrEqual(12);expect(x+CARD_WIDTH/2).toBeLessThanOrEqual(width-12);expect(y).toBeGreaterThanOrEqual(rope.top);expect(y).toBeLessThanOrEqual(rope.top+rope.sag);}
  expect(geometry.fixedRopeY?.(width/2,rope)).toBeCloseTo(rope.top+rope.sag,10);
 }
});
