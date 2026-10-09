import {expect,test} from 'vitest';
import {fixedRope,fixedRopeY} from '../../src/shared/ropeGeometry';
import {layoutClips,normalizedPosition,captureClipPositions,MIN_SPACING,CARD_WIDTH} from '../../src/shared/clipLayout';
import type {Clip} from '../../src/shared/contracts';
const clips=(count:number):Clip[]=>Array.from({length:count},(_,i)=>({id:String(i),agentId:i%2?'claude':'codex',ideaIds:[String(i)],currentId:String(i),position:null}));
test('已批准居中70%绳，左右留白与中央2/3夹区适配屏宽',()=>{
 for(const width of [260,380,800,1040,1440,1920,2560,3840]){
  const rope=fixedRope(width);expect(rope.length/width).toBeCloseTo(.7,10);expect(rope.left/width).toBeCloseTo(.15,10);
  expect(fixedRopeY(width/2,rope)).toBeCloseTo(rope.top+rope.sag,10);
  for(const count of [0,3,24]){const layout=layoutClips(clips(count),width);expect(layout.visible.length+layout.overflow.length).toBe(count);
   for(const p of layout.visible){expect(p.x).toBeGreaterThanOrEqual(rope.left+rope.length/6-1e-8);expect(p.x).toBeLessThanOrEqual(rope.left+rope.length*5/6+1e-8);expect(p.x-CARD_WIDTH/2).toBeGreaterThanOrEqual(12-1e-8);expect(p.x+CARD_WIDTH/2).toBeLessThanOrEqual(width-12+1e-8);}
  }
 }
});
test('旧比例位置映射到新夹区，无数据改写或丢失，捕获后可往返且合夹无关中心不漂移',()=>{
 for(const width of [380,800,1040,1440,2560]){
  const old=clips(12).map((c,i)=>({...c,position:i/11}));const original=structuredClone(old),layout=layoutClips(old,width);
  expect(old).toEqual(original);expect([...layout.visible.map(p=>p.clip),...layout.overflow].map(c=>c.id).sort()).toEqual(old.map(c=>c.id).sort());
  const captured=captureClipPositions(old,width);const after=layoutClips(captured,width);
  expect(after.visible.map(p=>p.clip.id)).toEqual(layout.visible.map(p=>p.clip.id));
  after.visible.forEach((p,i)=>{expect(p.x).toBeCloseTo(layout.visible[i].x,8);expect(normalizedPosition(p.x,width)).toBeCloseTo(captured.find(c=>c.id===p.clip.id)!.position!,8);if(i)expect(p.x-after.visible[i-1].x).toBeGreaterThanOrEqual(MIN_SPACING-1e-8);});
 }
 const before=layoutClips(clips(3),1440),captured=captureClipPositions(clips(3),1440);expect(layoutClips(captured.slice(1),1440).visible.find(p=>p.clip.id==='2')!.x).toBeCloseTo(before.visible[2].x,8);
});
test('移到新夹区最右侧时为已有夹子留最小间距，不把可容纳的移动夹藏入溢出',()=>{
 const captured=captureClipPositions(clips(3),1440),moving={...captured[0],position:1};
 const after=layoutClips([...captured.slice(1),moving],1440);expect(after.visible.map(p=>p.clip.id)).toEqual(['1','2','0']);expect(after.overflow).toHaveLength(0);
 for(let i=1;i<after.visible.length;i++)expect(after.visible[i].x-after.visible[i-1].x).toBeGreaterThanOrEqual(MIN_SPACING);
 expect(after.visible.at(-1)!.x).toBeCloseTo(1440*.15+1440*.7*5/6,8);
});
test('首夹显式比例0映射精确左界，不能被居中起排的虚拟前夹推走',()=>{
 const one={...clips(1)[0],position:0};expect(layoutClips([one,...clips(2).map((c,i)=>({...c,id:'other'+i,position:.5+i*.3}))],1440).visible[0].x).toBeCloseTo(384,8);
});
