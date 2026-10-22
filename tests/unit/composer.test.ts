// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { shouldSubmit } from '../../src/shared/composerKeys';
const enter={key:'Enter',metaKey:false,ctrlKey:false,isComposing:false,keyCode:13};
test('Enter换行，两端按各自组合键提交',()=>{
  expect(shouldSubmit({...enter,platform:'mac'})).toBe(false);
  expect(shouldSubmit({...enter,platform:'mac',metaKey:true})).toBe(true);
  expect(shouldSubmit({...enter,platform:'windows',ctrlKey:true})).toBe(true);
  expect(shouldSubmit({...enter,platform:'windows',metaKey:true})).toBe(false);
});
test('IME选字保护优先于提交组合键',()=>{
  expect(shouldSubmit({...enter,platform:'mac',metaKey:true,isComposing:true})).toBe(false);
  expect(shouldSubmit({...enter,platform:'windows',ctrlKey:true,keyCode:229})).toBe(false);
});
