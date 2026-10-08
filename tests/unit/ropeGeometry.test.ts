import { expect, test } from 'vitest';
import { sagForCount, ropeY, toLocal, contains, visibleSlots } from '../../src/shared/ropeGeometry';
test('挂多下沉、取下回升，固定端点且封顶', () => {
  expect(sagForCount(3)).toBe(26); expect(sagForCount(6)).toBe(44);
  expect(sagForCount(1000)).toBe(88); expect(sagForCount(-2)).toBe(8);
  expect(ropeY(0,1200,6)).toBe(10); expect(ropeY(1200,1200,6)).toBe(10);
  expect(ropeY(600,1200,6)).toBe(54); expect(ropeY(600,1200,3)).toBe(36);
});
test('负坐标屏幕转本地DIP，点到卡片内才交互', () => {
  const p=toLocal({x:-900,y:122},{x:-1920,y:120});
  expect(p).toEqual({x:1020,y:2});
  expect(contains({x:1000,y:0,width:200,height:160},p)).toBe(true);
  expect(contains({x:1000,y:0,width:200,height:160},{x:999,y:2})).toBe(false);
  expect(contains({x:0,y:0,width:0,height:0},{x:0,y:0})).toBe(false);
});
test('窄屏减少数量而不压缩正文，宽屏按真实空间增加', () => {
  expect(visibleSlots(380)).toBe(1); expect(visibleSlots(800)).toBe(3);
  expect(visibleSlots(1440)).toBe(6); expect(visibleSlots(3200)).toBe(14);
});
