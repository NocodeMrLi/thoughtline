import {expect,test} from 'vitest';
import {layoutClips,MIN_SPACING,CARD_WIDTH} from '../../src/shared/clipLayout';
const clips=Array.from({length:12},(_,i)=>({id:''+i,agentId:'codex',ideaIds:[''+i],currentId:''+i,position:null as number|null}));
test('宽屏不限制6夹，小屏放不下仍完整溢出',()=>{
 expect(layoutClips(clips,2400).visible.length).toBeGreaterThan(6);
 expect(layoutClips(clips,150).visible).toHaveLength(0);expect(layoutClips(clips,150).overflow).toHaveLength(12);
});
test('拉近到最小距离释放空间，不遮文字，位置随宽度夹紧',()=>{
 const compact=clips.map((c,i)=>({...c,position:i*.17}));const normal=layoutClips(clips,1000),dense=layoutClips(compact,1000);
 expect(dense.visible.length).toBeGreaterThan(normal.visible.length);
 for(let i=1;i<dense.visible.length;i++)expect(dense.visible[i].x-dense.visible[i-1].x).toBeGreaterThanOrEqual(MIN_SPACING);
 for(const {x} of layoutClips(compact,600).visible){expect(x-CARD_WIDTH/2).toBeGreaterThanOrEqual(12);expect(x+CARD_WIDTH/2).toBeLessThanOrEqual(588);}
});
