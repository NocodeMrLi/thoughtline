import {expect,test} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as commands from '../../src/shared/ideaCommands';
import {FileRepository} from '../../src/main/store/repository';
import type {Result,Snapshot} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-09T08:00:00.000Z';
function fixture(){let s=commands.initialSnapshot();for(const [id,project] of [['a','项目甲'],['b','项目甲'],['c','项目乙']])s=value(commands.newIdea(s,{text:` ${id}中文\nemoji🧷\n `,title:id,project,agentId:'general'},id,now));s.clips=[{...s.clips[0],ideaIds:['a','b'],currentId:'b'},s.clips[2]];s=value(commands.changeStatus(s,'c','archived',now));s.draft={text:'未提交草稿',project:'项目甲',title:'',agentId:'general'};return s;}
test('删除项目立即清除全部念头和草稿归属，物理合夹/当前页/正文保持',()=>{
 const s=fixture();const removed=value(commands.removeProject(s,'项目甲',now));
 expect(removed.ideas.map(i=>[i.id,i.project,i.text])).toEqual([['a','',' a中文\nemoji🧷\n '],['b','',' b中文\nemoji🧷\n '],['c','项目乙',' c中文\nemoji🧷\n ']]);
 expect(removed.clips).toEqual(s.clips);expect(removed.draft).toEqual({...s.draft,project:''});
 expect(s.ideas[0].project).toBe('项目甲');
});
test('未分组不可删除，退出无删除时无需任何数据写入',()=>{
 const s=fixture();expect(commands.removeProject(s,'',now)).toMatchObject({ok:false,code:'INVALID'});
});
test('删除项目含已收起念头并且独立重启不会复活',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'thoughtline-project-test-'));
 try{const repo=new FileRepository(dir);const initial=value(await repo.load());let s=fixture();s=value(await repo.commit(s,initial.revision));s=value(await repo.commit(value(commands.removeProject(s,'项目乙',now)),s.revision));const restarted=value(await new FileRepository(dir).load());expect(restarted.ideas.find(i=>i.id==='c')).toMatchObject({status:'archived',project:'',text:' c中文\nemoji🧷\n '});}finally{await rm(dir,{recursive:true,force:true});}
});
