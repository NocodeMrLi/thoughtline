// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {layoutClips,MIN_SPACING,CARD_WIDTH,clipMetrics,captureClipPositions} from '../../src/shared/clipLayout';
const clips=Array.from({length:12},(_,i)=>({id:''+i,agentId:'codex',ideaIds:[''+i],currentId:''+i,position:null as number|null}));
test('默认6夹，极窄非屏幕窗口保留完整溢出',()=>{
 expect(layoutClips(clips,3840).visible.length).toBe(6);
 expect(layoutClips(clips,150).visible).toHaveLength(0);expect(layoutClips(clips,150).overflow).toHaveLength(12);
});
test('拉近到最小距离释放空间，不遮文字，位置随宽度夹紧',()=>{
 const compact=clips.map((c,i)=>({...c,position:Math.min(1,i*.13)}));const normal=layoutClips(clips,2000),dense=layoutClips(compact,2000);
 expect(dense.visible.length).toBe(normal.visible.length);
 for(let i=1;i<dense.visible.length;i++)expect(dense.visible[i].x-dense.visible[i-1].x).toBeGreaterThanOrEqual(MIN_SPACING);
 for(const {x} of layoutClips(compact,600).visible){expect(x-clipMetrics(600).cardWidth/2).toBeGreaterThanOrEqual(12);expect(x+clipMetrics(600).cardWidth/2).toBeLessThanOrEqual(588);}
});

test('保存布局与renderer使用同一可见宽度，未参与操作的夹子中心不漂移',()=>{
 const before=layoutClips(clips.slice(0,3),1440),captured=captureClipPositions(clips.slice(0,3),1440);
 const after=layoutClips(captured.slice(1),1440);
 expect(after.visible.find(p=>p.clip.id==='2')!.x).toBeCloseTo(before.visible[2].x,8);
});
test('主进程只记录renderer实际可见的容量，不把屏外绳段纳入位置',()=>{
 const width=1015,visible=layoutClips(clips,width).visible.map(p=>p.clip.id);
 expect(captureClipPositions(clips,width).filter(c=>c.position!==null).map(c=>c.id)).toEqual(visible);
});
test('筛选布局只冻结当前Agent可见夹子，其他Agent位置原样',()=>{
 const mixed=clips.slice(0,3).map((c,i)=>({...c,agentId:i===1?'claude':'codex'}));
 const captured=captureClipPositions(mixed,1440,'codex');expect(captured[1]).toEqual(mixed[1]);
 const before=layoutClips(mixed.filter(c=>c.agentId==='codex'),1440),after=layoutClips(captured.filter(c=>c.agentId==='codex'),1440);
 expect(after.visible.map(p=>p.x)).toEqual(before.visible.map(p=>p.x));
});
