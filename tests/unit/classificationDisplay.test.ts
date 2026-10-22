// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {classificationLabel} from '../../src/shared/classification';
test('classification metadata consistently presents group before tag without changing names',()=>{
 expect(classificationLabel('工作','领导A')).toBe('工作 · 领导A');
 expect(classificationLabel('','通用')).toBe('通用');
 expect(classificationLabel('组😀','tag')).toBe('组😀 · tag');
});
