import {expect,test} from 'vitest';
import {initialShelf,shelfTransition as step} from '../../src/shared/shelfState';
test('短暂过边不打开，停留250ms打开',()=>{
  let s=step(initialShelf(),{type:'pointer',zone:'edge',now:0});
  expect(step(s,{type:'tick',now:249}).phase).toBe('hidden');
  expect(step(s,{type:'tick',now:250}).phase).toBe('revealed');
  s=step(s,{type:'pointer',zone:'outside',now:100});
  expect(step(s,{type:'tick',now:500}).phase).toBe('hidden');
});
test('离开500ms收回，卡片重新进入取消过期计时',()=>{
  let s=step(initialShelf(),{type:'peek',now:0});
  s=step(s,{type:'pointer',zone:'card',now:10});
  s=step(s,{type:'pointer',zone:'outside',now:20});
  expect(step(s,{type:'tick',now:519}).phase).toBe('revealed');
  expect(step(s,{type:'tick',now:520}).phase).toBe('hidden');
  s=step(s,{type:'pointer',zone:'card',now:300});
  expect(step(s,{type:'tick',now:900}).phase).toBe('revealed');
});
test('操作锁保持显示，解锁重新计时而非立刻过期关闭',()=>{
  let s=step(initialShelf(),{type:'peek',now:0});
  s=step(s,{type:'lock',name:'drag',active:true,now:10});
  expect(step(s,{type:'tick',now:5000}).phase).toBe('peek');
  s=step(s,{type:'lock',name:'drag',active:false,now:5000});
  expect(step(s,{type:'tick',now:5001}).phase).toBe('peek');
  expect(step(s,{type:'tick',now:5500}).phase).toBe('hidden');
});
test('到达走廊给予600ms宽限，不能永久保持',()=>{
  let s=step(initialShelf(),{type:'pointer',zone:'edge',now:0});
  s=step(s,{type:'tick',now:250});
  s=step(s,{type:'pointer',zone:'corridor',now:300});
  expect(step(s,{type:'tick',now:899}).phase).toBe('revealed');
  expect(step(s,{type:'tick',now:900}).phase).toBe('hidden');
});
test('Peek2300ms结束，睡眠关闭并清过期边缘计时',()=>{
  let s=step(initialShelf(),{type:'peek',now:0});
  expect(step(s,{type:'tick',now:2299}).phase).toBe('peek');
  expect(step(s,{type:'tick',now:2300}).phase).toBe('hidden');
  s=step(s,{type:'suspend',now:20});
  expect(s.phase).toBe('hidden');
  s=step(s,{type:'resume',now:10000});
  expect(step(s,{type:'tick',now:10100}).phase).toBe('hidden');
});
