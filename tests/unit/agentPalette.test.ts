import {expect,test} from 'vitest';
import {initialSnapshot,validateSnapshot} from '../../src/shared/ideaCommands';
test('13设计新默认Codex蓝/Claude橙/柔紫Cursor，样板Agent不强制预置',()=>{
 const agents=initialSnapshot().agents;
 expect(Object.fromEntries(agents.map(a=>[a.id,a.color]))).toEqual({codex:'#4C90D9',claude:'#D79551',cursor:'#9574CE',general:'#A0A3AA'});
 expect(agents.some(a=>['gemini','workbuddy'].includes(a.id))).toBe(false);
});
test('升级不替换既有Agent颜色，包括用户选回旧默认色',()=>{
 for(const color of ['#123456','#7EAC65']){
  const s=initialSnapshot();s.agents.find(a=>a.id==='codex')!.color=color;
  const result=validateSnapshot(JSON.parse(JSON.stringify(s)));expect(result.ok).toBe(true);if(result.ok)expect(result.value.agents.find(a=>a.id==='codex')!.color).toBe(color);
 }
});
