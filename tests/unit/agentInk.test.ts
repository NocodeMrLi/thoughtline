// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {agentInkColors} from '../../src/renderer/components/agentInk';
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const lum=(values:number[])=>values.map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
test('预设蓝和暖橙在两主题都保留明显色彩，拒绝85%近黑混色',()=>{
 for(const theme of ['light','dark'] as const){
  const blue=rgb(agentInkColors('#4C90D9')[theme]),orange=rgb(agentInkColors('#D79551')[theme]);
  expect(blue[2]-blue[0]).toBeGreaterThanOrEqual(60);expect(blue[2]).toBeGreaterThan(blue[1]);
  expect(orange[0]-orange[2]).toBeGreaterThanOrEqual(60);expect(orange[0]).toBeGreaterThan(orange[1]);expect(orange[1]).toBeGreaterThan(orange[2]);
 }
});
test('可读性校准包含标签区域最深1.5%跨纸明暗，不只未叠加的纸基色',()=>{
 for(const color of ['#4C90D9','#D79551','#9574CE','#FFFFFF','#000000','#00FF00','#FF0000','#0000FF','#EEEEEE','#123456','#8AADD4','#A0A3AA']){
  const result=agentInkColors(color);
  for(const [theme,paper] of [['light',[245,239,223]],['dark',[56,56,49]]] as const){
   const foreground=lum(rgb(result[theme]));for(const backdrop of [paper.map(v=>v*.985),paper.map(v=>v*.955+255*.045)]){const background=lum(backdrop);expect((Math.max(background,foreground)+.05)/(Math.min(background,foreground)+.05)).toBeGreaterThanOrEqual(4.6);}
  }
 }
});
test('自定义夹子输入色保持不变，标签按两主题可读性调亮或调暗',()=>{
 const custom='#123456',result=agentInkColors(custom);expect(agentInkColors(custom)).toEqual(result);
 expect(result.light).toBe(custom);expect(result.dark).not.toBe(custom);expect(custom).toBe('#123456');
});
