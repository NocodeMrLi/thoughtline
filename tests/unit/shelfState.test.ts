// SPDX-License-Identifier: GPL-3.0-only
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
test('从顶边到纸张的慢速路径保持显示，离开操作区域500ms后收起',()=>{
  let s=step(initialShelf(),{type:'pointer',zone:'edge',now:0});
  s=step(s,{type:'tick',now:250});
  s=step(s,{type:'pointer',zone:'corridor',now:300});
  expect(step(s,{type:'tick',now:899}).phase).toBe('revealed');
  s=step(s,{type:'tick',now:3000});expect(s.phase).toBe('revealed');
  s=step(s,{type:'pointer',zone:'card',now:3100});
  s=step(s,{type:'pointer',zone:'corridor',now:3200});
  expect(step(s,{type:'tick',now:6000}).phase).toBe('revealed');
  s=step(s,{type:'pointer',zone:'outside',now:6100});
  expect(step(s,{type:'tick',now:6599}).phase).toBe('revealed');
  expect(step(s,{type:'tick',now:6600}).phase).toBe('hidden');
});
test('隐藏时经过走廊不会唤出；自动预览只有进入有效区域才转为停留',()=>{
 let s=step(initialShelf(),{type:'pointer',zone:'corridor',now:0});
 expect(step(s,{type:'tick',now:9000}).phase).toBe('hidden');
 s=step(s,{type:'peek',now:9001});
 s=step(s,{type:'pointer',zone:'outside',now:9002});
 s=step(s,{type:'pointer',zone:'corridor',now:9100});
 expect(step(s,{type:'tick',now:15000}).phase).toBe('revealed');
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
import * as transitions from '../../src/shared/shelfState';
test('手动暂停经睡眠恢复仍暂停，锁屏与睡眠分别释放',()=>{
 let state={manual:false,sleep:false,lock:false,paused:false};
 state=transitions.pauseTransition?.(state,'manual',true)??state;
 state=transitions.pauseTransition?.(state,'sleep',true)??state;
 state=transitions.pauseTransition?.(state,'sleep',false)??state;
 expect(state.paused).toBe(true);
 state=transitions.pauseTransition?.(state,'manual',false)??state;
 expect(state.paused).toBe(false);
 state=transitions.pauseTransition?.(state,'lock',true)??state;
 state=transitions.pauseTransition?.(state,'sleep',true)??state;
 state=transitions.pauseTransition?.(state,'sleep',false)??state;
 expect(state.paused).toBe(true);
 state=transitions.pauseTransition?.(state,'lock',false)??state;
 expect(state.paused).toBe(false);
});

test.each(['composer','manage','menu','drag','text-drag'])('暂停期间%s结束后恢复正常250ms悬停',name=>{
 let s=step(initialShelf(),{type:'lock',name,active:true,now:0});
 s=step(s,{type:'suspend',now:1});s=step(s,{type:'lock',name,active:false,now:2});
 expect(s.locks).toEqual([]);expect(s.suspended).toBe(true);expect(s.phase).toBe('hidden');
 s=step(s,{type:'resume',now:3});s=step(s,{type:'pointer',zone:'edge',now:10});
 expect(step(s,{type:'tick',now:259}).phase).toBe('hidden');
 expect(step(s,{type:'tick',now:260}).phase).toBe('revealed');
});
test('暂停中新操作仍记录锁，禁止peek和指针展开直到恢复后解除',()=>{
 let s=step(initialShelf(),{type:'suspend',now:0});
 s=step(s,{type:'lock',name:'composer',active:true,now:1});expect(s.locks).toEqual(['composer']);
 s=step(s,{type:'peek',now:2});s=step(s,{type:'pointer',zone:'edge',now:3});s=step(s,{type:'tick',now:1000});
 expect(s.phase).toBe('hidden');expect(s.dwellAt).toBe(null);
 s=step(s,{type:'resume',now:1001});s=step(s,{type:'pointer',zone:'edge',now:1002});
 expect(step(s,{type:'tick',now:2000}).phase).toBe('revealed');
 expect(s.locks).toEqual(['composer']);
});
test('暂停中只释放已结束锁，仍活跃的其他锁不能被恢复清空',()=>{
 let s=step(initialShelf(),{type:'lock',name:'manage',active:true,now:0});
 s=step(s,{type:'lock',name:'menu',active:true,now:1});s=step(s,{type:'suspend',now:2});
 s=step(s,{type:'lock',name:'menu',active:false,now:3});expect(s.locks).toEqual(['manage']);
 s=step(s,{type:'resume',now:4});s=step(s,{type:'pointer',zone:'edge',now:5});expect(step(s,{type:'tick',now:1000}).phase).toBe('hidden');
 s=step(s,{type:'lock',name:'manage',active:false,now:1001});expect(step(s,{type:'tick',now:1002}).phase).toBe('revealed');
});

test('writing window can reveal and dismiss a hidden shelf without releasing its session lock',()=>{
 let s=step(initialShelf(),{type:'lock',name:'composer',active:true,now:0});s=step(s,{type:'pointer',zone:'edge',now:10});expect(step(s,{type:'tick',now:259}).phase).toBe('hidden');s=step(s,{type:'tick',now:260});expect(s.phase).toBe('revealed');expect(s.locks).toEqual(['composer']);s=step(s,{type:'pointer',zone:'outside',now:300});expect(step(s,{type:'tick',now:800}).phase).toBe('hidden');
});
test('writing does not bypass active menu, drag, manager or sleep guards',()=>{
 for(const name of ['menu','drag','text-drag','manage']){let s=step(initialShelf(),{type:'lock',name:'composer',active:true,now:0});s=step(s,{type:'lock',name,active:true,now:1});s=step(s,{type:'pointer',zone:'edge',now:10});expect(step(s,{type:'tick',now:1000}).phase).toBe('hidden');}
 let s=step(initialShelf(),{type:'lock',name:'composer',active:true,now:0});s=step(s,{type:'suspend',now:1});s=step(s,{type:'pointer',zone:'edge',now:10});expect(step(s,{type:'tick',now:1000}).phase).toBe('hidden');
});
