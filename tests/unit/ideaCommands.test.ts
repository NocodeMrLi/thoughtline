// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,changeStatus,renameAgent,removeAgent,validateSnapshot} from '../../src/shared/ideaCommands';
import type {Result} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-08T00:00:00.000Z';
test('新念头保留原文换行和空白，自动标题只用于显示',()=>{
 const s=initialSnapshot();const text='  标题\n正文\n';
 const n=value(newIdea(s,{text,title:'',project:'',agentId:'general'},'one',now));
 expect(n.ideas[0].text).toBe(text);expect(n.ideas[0].title).toBe('标题');expect(s.ideas).toHaveLength(0);
 expect(newIdea(n,{text:'  ',title:'',project:'',agentId:'general'},'two',now)).toMatchObject({ok:false,code:'INVALID'});
 expect(newIdea(n,{text:'a'.repeat(1048577),title:'',project:'',agentId:'general'},'two',now)).toMatchObject({ok:false,code:'INVALID'});
});
test('收起与恢复保持全文，自定义Agent迁移含草稿和已收起记录',()=>{
 let s=initialSnapshot();s.agents.push({id:'custom',name:'工具',color:'#123456'});
 s=value(newIdea(s,{text:'全文',title:'',project:'',agentId:'custom'},'one',now));
 s.draft={text:'草稿',title:'',project:'',agentId:'custom'};
 s=value(changeStatus(s,'one','archived',now));expect(s.ideas[0].text).toBe('全文');
 s=value(renameAgent(s,'custom','新名字'));expect(s.ideas[0].agentId).toBe('custom');
 expect(removeAgent(s,'custom','custom')).toMatchObject({ok:false,code:'INVALID'});
 s=value(removeAgent(s,'custom','general'));expect(s.draft?.agentId).toBe('general');expect(s.ideas[0].agentId).toBe('general');
 s=value(changeStatus(s,'one','hanging',now));expect(s.ideas[0].text).toBe('全文');expect(s.ideas[0].status).toBe('hanging');
});
test('数据校验拒绝未知版本、重复ID、缺失正文和未知Agent',()=>{
 const s=initialSnapshot();expect(validateSnapshot(s).ok).toBe(true);
 expect(validateSnapshot({...s,schemaVersion:99})).toMatchObject({ok:false,code:'INVALID'});
 expect(validateSnapshot({...s,agents:[...s.agents,...s.agents]})).toMatchObject({ok:false,code:'INVALID'});
 expect(validateSnapshot({...s,draft:{text:'draft',title:'',project:'',agentId:'missing'}})).toMatchObject({ok:false,code:'INVALID'});
});
