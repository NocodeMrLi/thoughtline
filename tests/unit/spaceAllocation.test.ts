// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {layoutClips,clipTravelBounds,captureClipPositions,MIN_SPACING} from '../../src/shared/clipLayout';
import type {Clip} from '../../src/shared/contracts';
const c=(id:string,position:number|null):Clip=>({id,agentId:'general',ideaIds:[id],currentId:id,position});
test.each([800,1040,1440,1920,2560])('右侧手动夹后新增，必须回填左侧合法空位且旧位置不漂移 width=%i',width=>{
 const old=[c('right',1)],before=layoutClips(old,width),after=layoutClips([...old,c('new',null)],width),{min,max}=clipTravelBounds(width);
 if(max-min<MIN_SPACING)return;
 expect(after.visible.map(p=>p.clip.id).sort()).toEqual(['new','right']);expect(after.visible.find(p=>p.clip.id==='right')!.x).toBe(before.visible[0].x);expect(after.visible.find(p=>p.clip.id==='new')!.x).toBeLessThan(before.visible[0].x-MIN_SPACING+1e-8);
 expect(after.overflow).toHaveLength(0);
});
test('左/右保留，中间空位可新挂，满后明确溢出而不盖住旧纸',()=>{
 const width=1440,old=[c('left',0),c('right',1)],after=layoutClips([...old,c('middle',null)],width);
 expect(after.visible).toHaveLength(3);expect(after.visible.find(p=>p.clip.id==='middle')!.x).toBeGreaterThan(clipTravelBounds(width).min+171);expect(after.visible.find(p=>p.clip.id==='right')!.x).toBeCloseTo(clipTravelBounds(width).max,8);
 const full=[c('a',0),c('b',.2),c('c',.4),c('d',.6),c('e',.8),c('f',1),c('new',null)];const shown=layoutClips(full,width);expect(shown.visible).toHaveLength(6);expect(shown.overflow.map(c=>c.id)).toEqual(['new']);
});
test('空位回填捕获后重复投影位置/身份稳定',()=>{
 const old=[c('right',1),c('new',null),c('other',null)],first=layoutClips(old,1440),next=layoutClips(captureClipPositions(old,1440),1440);
 expect(next.visible.map(p=>[p.clip.id,p.x])).toEqual(first.visible.map(p=>[p.clip.id,p.x]));expect(next.overflow.map(c=>c.id)).toEqual(first.overflow.map(c=>c.id));
});
