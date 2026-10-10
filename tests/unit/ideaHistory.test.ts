import {legacySnapshot} from '../helpers/legacySnapshot';
import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,changeStatus,validateSnapshot} from '../../src/shared/ideaCommands';
import {ideaDay,calendarIndex} from '../../src/shared/ideaHistory';
import type {Idea,Result} from '../../src/shared/contracts';

const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const draft={text:'完整正文',title:'标题',project:'项目A',agentId:'general'};
test('ideaDay优先冻结日，旧fixture从原偏移日期回退而不随现在时区改变',()=>{
 const i:Idea={...draft,id:'old',status:'archived',createdAt:'2026-01-01T00:30:00+08:00',updatedAt:'2026-10-09T12:00:00Z'};
 expect(ideaDay(i)).toBe('2026-01-01');expect(ideaDay({...i,createdDay:'2025-12-31',creationTimeZone:'America/Los_Angeles'})).toBe('2025-12-31');
});

test('calendarIndex以Map索引hanging/archived，trash不计数且同日稳定创建顺序',()=>{
 let s=legacySnapshot();
 s=value(newIdea(s,draft,'hanging','2026-01-02T03:00:00Z'));s=value(newIdea(s,draft,'archived','2026-01-02T01:00:00Z'));s=value(changeStatus(s,'archived','archived','2026-01-03T12:00:00Z'));
 s=value(validateSnapshot({...s,ideas:s.ideas.map(i=>({...i,createdDay:'2026-01-02',creationTimeZone:'UTC'})).concat([{...s.ideas[0],id:'trash',status:'deleted',deletedFrom:'hanging',deletedAt:'2026-01-03T12:00:00Z',createdDay:'2026-01-03',creationTimeZone:'UTC'}])}));
 const index=calendarIndex(s);expect(index).toBeInstanceOf(Map);expect([...index.keys()]).toEqual(['2026-01-02']);expect(index.get('2026-01-02')!.map(i=>i.id)).toEqual(['archived','hanging']);
 expect(calendarIndex(s,{status:'archived'}).get('2026-01-02')!.map(i=>i.id)).toEqual(['archived']);
});

test('calendarIndex复用Agent/正文/项目过滤并按冻结日分组，空结果无假日期',()=>{
 let s=legacySnapshot();s=value(newIdea(s,draft,'first','2026-01-01T23:00:00Z'));s=value(newIdea(s,{...draft,text:'待找 😄\n',agentId:'claude',project:'项目B'},'second','2026-01-01T22:00:00Z'));
 s=value(validateSnapshot({...s,ideas:s.ideas.map(i=>({...i,createdDay:i.id==='first'?'2026-01-02':'2026-01-01',creationTimeZone:'UTC'}))}));
 expect([...calendarIndex(s).keys()]).toEqual(['2026-01-01','2026-01-02']);
 expect(calendarIndex(s,{query:'项目B',agentId:'claude',status:'all'}).get('2026-01-01')!.map(i=>i.id)).toEqual(['second']);
 expect(calendarIndex(s,{query:'找不到'}).size).toBe(0);expect(calendarIndex(s,{agentId:'missing'}).size).toBe(0);
});
