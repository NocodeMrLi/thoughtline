// SPDX-License-Identifier: GPL-3.0-only
import {test,expect} from 'vitest';
import {fitManageBounds} from '../../src/main/windows/manageGeometry';
const area={x:0,y:24,width:1280,height:960},paper={x:250,y:70,width:650,height:226};
test('默认窗口避开真实便签底边并保留16DIP间距',()=>{const r=fitManageBounds({x:270,y:48,width:740,height:540},[area],[paper]);expect(r.y).toBeGreaterThanOrEqual(paper.y+paper.height+16);expect(r.y+r.height).toBeLessThanOrEqual(area.y+area.height-12)});
test('不同页面优先保持父窗口同屏顶部与水平中心',()=>{const other={x:-1920,y:0,width:1920,height:1080},anchor={x:-1510,y:360,width:740,height:540};const r=fitManageBounds({x:300,y:24,width:500,height:600},[area,other],[],{anchor});expect(r.x+r.width/2).toBe(anchor.x+anchor.width/2);expect(r.y).toBe(anchor.y);expect(r.x).toBeLessThan(0)});
test('避让后的可用高度不足时缩短窗口而不越界',()=>{const a={x:0,y:0,width:1366,height:700};const r=fitManageBounds({x:400,y:24,width:500,height:600},[a],[paper]);expect(r.y).toBeGreaterThanOrEqual(312);expect(r.height).toBeGreaterThanOrEqual(360);expect(r.y+r.height).toBeLessThanOrEqual(688)});
test('安全的手动位置保留，空绳及极小工作区始终屏内',()=>{const manual={x:50,y:410,width:500,height:400};expect(fitManageBounds(manual,[area],[paper],{preserve:true})).toEqual(manual);const a={x:-800,y:40,width:500,height:380};const r=fitManageBounds({x:0,y:0,width:740,height:540},[a],[],{preferredArea:a});expect(r.x).toBeGreaterThanOrEqual(a.x+12);expect(r.y).toBeGreaterThanOrEqual(a.y+12);expect(r.x+r.width).toBeLessThanOrEqual(a.x+a.width-12);expect(r.y+r.height).toBeLessThanOrEqual(a.y+a.height-12)});
test('重新打开保留仍有效的跨屏手动位置，断屏时回到当前可用屏',()=>{
 const first={x:0,y:0,width:1440,height:900},second={x:1440,y:0,width:1440,height:900},saved={x:1600,y:340,width:740,height:540};expect(fitManageBounds(saved,[first,second],[],{preferredArea:first,preserve:true})).toEqual(saved);const fallback=fitManageBounds(saved,[first],[],{preferredArea:first,preserve:true});expect(fallback.x+fallback.width).toBeLessThanOrEqual(1428);
});
