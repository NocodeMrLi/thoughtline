// SPDX-License-Identifier: GPL-3.0-only
import {afterEach,expect,test} from 'vitest';
import {initialSnapshot,newIdea,editIdea,validateSnapshot} from '../../src/shared/ideaCommands';
import type {Result} from '../../src/shared/contracts';

const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const originalTZ=process.env.TZ;
afterEach(()=>{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;});
const draft={text:' \n原文 🧵\n ',title:'标题',project:'项目',agentId:'general'};
const oldIdea={...draft,id:'old',status:'hanging',createdAt:'2026-01-01T00:30:00+08:00',updatedAt:'2026-01-01T00:30:00+08:00'};
const legacy=(schemaVersion:1|2)=>({...initialSnapshot(),schemaVersion,revision:11,ideas:[oldIdea],clips:schemaVersion===1?undefined:[{id:'custom-clip',agentId:'general',ideaIds:['old'],currentId:'old',position:0.25}]});

test('新快照与旧typed fixture规范化后始终是schema4，未知版本类型不被数字转换接受',()=>{
 expect(initialSnapshot().schemaVersion).toBe(4);
 for(const schemaVersion of [0,5,99,'2','3',null])expect(validateSnapshot({...initialSnapshot(),schemaVersion})).toMatchObject({ok:false,code:'INVALID'});
 const v=value(validateSnapshot({...legacy(2),schemaVersion:3}));
 expect(v.ideas[0]).toMatchObject({createdDay:'2026-01-01',creationTimeZone:'legacy-offset'});
});

test.each([1,2] as const)('schema%s创建日冻结在原始偏移日期，迁移不使用当前时区或今天',schemaVersion=>{
 process.env.TZ='America/Los_Angeles';
 const result=value(validateSnapshot(legacy(schemaVersion)));
 expect(result).toMatchObject({schemaVersion:4,revision:11});
 expect(result.ideas[0]).toMatchObject({...oldIdea,createdDay:'2026-01-01',creationTimeZone:'legacy-offset'});
 expect(result.clips[0]).toMatchObject(schemaVersion===1?{id:'clip:old',position:null}:{id:'custom-clip',position:0.25});
 process.env.TZ='Pacific/Kiritimati';
 const edited=value(editIdea(result,'old',{...draft,text:' 改文 🪢\n '},'2026-10-09T12:00:00Z'));
 expect(edited.ideas[0]).toMatchObject({createdAt:oldIdea.createdAt,createdDay:'2026-01-01',creationTimeZone:'legacy-offset',text:' 改文 🪢\n '});
});

test.each([1,2] as const)('schema%s迁移按原始偏移日期重建旧版本附带的日历元数据',schemaVersion=>{
 const result=value(validateSnapshot({...legacy(schemaVersion),ideas:[{...oldIdea,createdDay:'2025-12-31',creationTimeZone:'America/Los_Angeles'}]}));
 expect(result.ideas[0]).toMatchObject({createdDay:'2026-01-01',creationTimeZone:'legacy-offset',createdAt:oldIdea.createdAt});
});

test('旧无明确偏移时间使用UTC日期，schema3已存日期跨时区和编辑不变',()=>{
 process.env.TZ='America/Los_Angeles';
 const result=value(validateSnapshot({...legacy(2),ideas:[{...oldIdea,createdAt:'2026-01-01T00:30:00'}]}));
 expect(result.ideas[0]).toMatchObject({createdDay:'2026-01-01',creationTimeZone:'legacy-offset'});
 const frozen=value(validateSnapshot({...result,ideas:[{...result.ideas[0],createdDay:'2025-12-31',creationTimeZone:'America/Los_Angeles'}]}));
 process.env.TZ='Asia/Shanghai';
 expect(value(editIdea(frozen,'old',draft,'2026-10-09T12:00:00Z')).ideas[0]).toMatchObject({createdDay:'2025-12-31',creationTimeZone:'America/Los_Angeles'});
});

test.each([
 ['Asia/Shanghai','2026-01-01T18:30:00Z','2026-01-02'],
 ['America/Los_Angeles','2026-01-01T00:30:00Z','2025-12-31'],
] as const)('新建按%s系统本地日期跨午夜，createdAt和完整正文不变', (tz,createdAt,createdDay)=>{
 process.env.TZ=tz;
 const next=value(newIdea(initialSnapshot(),draft,'new',createdAt));
 expect(next.ideas[0]).toMatchObject({...draft,createdAt,updatedAt:createdAt,createdDay,creationTimeZone:tz});
});

test('旧typed schema2快照中新建仍按localday，与迁移的旧记录规则分开',()=>{
 process.env.TZ='Asia/Shanghai';const s={...initialSnapshot(),schemaVersion:2 as const};
 const next=value(newIdea(s,draft,'new','2026-01-01T18:30:00Z'));
 expect(next.schemaVersion).toBe(4);expect(next.ideas[0]).toMatchObject({createdDay:'2026-01-02',creationTimeZone:'Asia/Shanghai',createdAt:'2026-01-01T18:30:00Z'});
});

test.each(['+010000-01-01T00:00:00Z','-000001-01-01T00:00:00Z'])('迁移扩展年份%s不能返回非法创建日或截断为今天',createdAt=>{
 expect(Number.isFinite(Date.parse(createdAt))).toBe(true);
 expect(validateSnapshot({...legacy(2),ideas:[{...oldIdea,createdAt}]})).toMatchObject({ok:false,code:'INVALID'});
});

test.each(['2026-02-29','2026-02-30','2026-13-01','2026-00-10','2026-1-01','not-date'])('schema3拒绝不真实或非规范创建日%s',createdDay=>{
 for(const schemaVersion of [2,3])expect(validateSnapshot({...legacy(2),schemaVersion,ideas:[{...oldIdea,createdDay,creationTimeZone:'Asia/Shanghai'}]})).toMatchObject({ok:false,code:'INVALID'});
});

test('schema3接受闰年日期但拒绝空时区和部分创建日元数据',()=>{
 const candidate={...legacy(2),schemaVersion:3,ideas:[{...oldIdea,createdDay:'2024-02-29',creationTimeZone:'Asia/Shanghai'}]};
 expect(validateSnapshot(candidate).ok).toBe(true);
 for(const creationTimeZone of ['', '  ',null,42])expect(validateSnapshot({...candidate,ideas:[{...candidate.ideas[0],creationTimeZone}]})).toMatchObject({ok:false,code:'INVALID'});
 expect(validateSnapshot({...candidate,ideas:[{...candidate.ideas[0],creationTimeZone:undefined}]})).toMatchObject({ok:false,code:'INVALID'});
});

test('日历窗口bounds接受有限坐标与正合理尺寸，缺省设置兼容',()=>{
 expect(validateSnapshot(initialSnapshot()).ok).toBe(true);
 const bounds={x:-1900,y:20,width:900,height:720};
 expect(value(validateSnapshot({...initialSnapshot(),settings:{...initialSnapshot().settings,calendarBounds:bounds}})).settings).toMatchObject({calendarBounds:bounds});
 for(const bad of [{...bounds,x:Infinity},{...bounds,y:NaN},{...bounds,width:0},{...bounds,height:-1},{...bounds,width:16385},{...bounds,height:16385},null,{}]){
  expect(validateSnapshot({...initialSnapshot(),settings:{...initialSnapshot().settings,calendarBounds:bad}})).toMatchObject({ok:false,code:'INVALID'});
 }
});
