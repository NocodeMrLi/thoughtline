import {expect,test} from 'vitest';
import {initialSnapshot,validateSnapshot} from '../../src/shared/ideaCommands';
test('新默认六标签保持通用灰和Codex蓝，其他用途使用克制颜色',()=>{
 const agents=initialSnapshot().agents;
 expect(Object.fromEntries(agents.map(a=>[a.id,a.color]))).toEqual({general:'#A0A3AA','preset:life-inspiration':'#6CA78C','preset:work-notes':'#D79551','preset:manager':'#9574CE','preset:colleague':'#8AADD4',codex:'#4C90D9'});
 expect(agents.some(a=>['gemini','workbuddy'].includes(a.id))).toBe(false);
});
test('升级不替换既有Agent颜色，包括用户选回旧默认色',()=>{
 for(const color of ['#123456','#7EAC65']){
  const s=initialSnapshot();s.agents.find(a=>a.id==='codex')!.color=color;
  const result=validateSnapshot(JSON.parse(JSON.stringify(s)));expect(result.ok).toBe(true);if(result.ok)expect(result.value.agents.find(a=>a.id==='codex')!.color).toBe(color);
 }
});
