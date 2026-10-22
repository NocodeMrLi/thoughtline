// SPDX-License-Identifier: GPL-3.0-only
import {it,expect} from 'vitest';
import {CompositionSession} from '../../src/shared/compositionSession';
it('a duplicate start retains the original rollback value',()=>{
 const c=new CompositionSession<'title'>(),a={};c.start('title',a,'确认名称',1);c.start('title',a,'未确认',2);
 expect(c.blur(a)?.before).toBe('确认名称');
});
it('A to B switch rolls back A and a delayed A end cannot resume B',()=>{
 const c=new CompositionSession<'title'|'project'>(),a={},b={};c.start('title',a,'名称',10);
 expect(c.start('project',b,'项目',20)?.before).toBe('名称');expect(c.accepts(a)).toBe(false);
 expect(c.end(a,30)).toBeNull();expect(c.composing).toBe(true);expect(c.end(b,19)).toBeNull();
 expect(c.end(b,31)?.field).toBe('project');expect(c.composing).toBe(false);
});
it('blur without end rolls back, rejects delayed changes, and permits fresh focused typing',()=>{
 const c=new CompositionSession<'text'>(),a={};c.start('text',a,'正文',10);
 expect(c.blur(a)?.before).toBe('正文');expect(c.composing).toBe(false);expect(c.end(a,30)).toBeNull();
 expect(c.accepts(a)).toBe(false);c.focus(a);expect(c.accepts(a)).toBe(true);
});
it('unrelated blur and duplicate end do not change active ownership',()=>{
 const c=new CompositionSession<'title'>(),a={},b={};c.start('title',a,'旧',1);
 expect(c.blur(b)).toBeNull();expect(c.composing).toBe(true);expect(c.end(a,2)).not.toBeNull();expect(c.end(a,3)).toBeNull();
});
