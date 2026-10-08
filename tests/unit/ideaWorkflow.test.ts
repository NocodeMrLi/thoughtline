import {expect,test} from 'vitest';
import * as commands from '../../src/shared/ideaCommands';
import type {Result,Snapshot,Draft} from '../../src/shared/contracts';
const unwrap=<T>(r:Result<T>):T=>{if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-08T00:00:00.000Z';const later='2026-10-09T00:00:00.000Z';
const draft:Draft={text:'原文\n第二行',title:'原标题',project:'项目A',agentId:'codex'};
const fixture=()=>unwrap(commands.newIdea(commands.initialSnapshot(),draft,'one',now));
test('编辑只更新目标正文与归属，不重挂已收起记录或丢新建草稿',()=>{
 const s=fixture();s.ideas[0].status='archived';s.draft={...draft,text:'另外的新建草稿'};
 const next=unwrap(commands.editIdea(s,'one',{...draft,text:'  修改\n完整正文\n',agentId:'claude'},later));
 expect(next.ideas[0]).toMatchObject({id:'one',text:'  修改\n完整正文\n',agentId:'claude',status:'archived',createdAt:now,updatedAt:later});
 expect(next.draft?.text).toBe('另外的新建草稿');expect(s.ideas[0].text).toBe('原文\n第二行');
});
test('编辑拒绝空正文、未知Agent和不存在的ID，原记录不改变',()=>{
 const s=fixture();
 for(const [id,input] of [['missing',draft],['one',{...draft,text:'  '}],['one',{...draft,agentId:'missing'}]] as const){
  expect(commands.editIdea(s,id,input,later)).toMatchObject({ok:false,code:'INVALID'});
 }
 expect(s.ideas[0].text).toBe('原文\n第二行');
});
test('新增和改色Agent保留稳定ID，删除后挂着/已收起/草稿引用一起迁移',()=>{
 let s=unwrap(commands.addAgent(fixture(),{id:'my',name:'我的助手',color:'#123456'}));
 expect(commands.addAgent(s,{id:'my',name:'重复',color:'#abcdef'})).toMatchObject({ok:false});
 s=unwrap(commands.editIdea(s,'one',{...draft,agentId:'my'},later));s.ideas[0].status='archived';s.draft={...draft,agentId:'my'};
 s=unwrap(commands.updateAgent(s,'my',{name:'新名称',color:'#ABCDEF'}));
 expect(s.agents.find(x=>x.id==='my')).toMatchObject({name:'新名称',color:'#ABCDEF'});
 s=unwrap(commands.removeAgent(s,'my','general'));expect(s.ideas[0].agentId).toBe('general');expect(s.draft?.agentId).toBe('general');
 expect(commands.updateAgent(s,'general',{name:'',color:'red'})).toMatchObject({ok:false});
});
test('搜索覆盖正文/项目/Agent且保留稳定顺序，已收起也能找回',()=>{
 let s=fixture();s=unwrap(commands.newIdea(s,{...draft,text:'找回内容',project:'另外',agentId:'claude'},'two',now));
 s=unwrap(commands.changeStatus(s,'two','archived',later));
 expect(commands.findIdeas(s,{status:'all',query:'Claude'}).map(x=>x.id)).toEqual(['two']);
 expect(commands.findIdeas(s,{status:'archived',query:'找回'}).map(x=>x.id)).toEqual(['two']);
 expect(commands.findIdeas(s,{status:'all',query:'项目a'}).map(x=>x.id)).toEqual(['one']);
 expect(commands.findIdeas(s,{status:'hanging',query:'找回'})).toEqual([]);
});
test('筛选与可见容量不减少总重量，也不删除溢出记录',()=>{
 let s=commands.initialSnapshot();
 for(let i=0;i<8;i++)s=unwrap(commands.newIdea(s,{...draft,agentId:i<2?'claude':'codex'},'id'+i,now));
 const all=commands.shelfSelection(s,'all',1000);
 expect(all.totalHanging).toBe(8);expect(all.visible.map(x=>x.id)).toEqual(['id0','id1','id2','id3']);expect(all.overflow).toBe(4);
 const filtered=commands.shelfSelection(s,'claude',1000);
 expect(filtered.totalHanging).toBe(8);expect(filtered.visible.map(x=>x.id)).toEqual(['id0','id1']);expect(filtered.overflow).toBe(0);expect(s.ideas).toHaveLength(8);
});
test('大量历史不计重量，持续挂着也只占有限展示槽位',()=>{
 let s=commands.initialSnapshot();
 for(let i=0;i<40;i++)s=unwrap(commands.newIdea(s,{...draft},'idea'+String(i).padStart(3,'0'),now));
 s.ideas=s.ideas.map((x,i)=>({...x,status:i<35?'archived':'hanging'}));
 const picked=commands.shelfSelection(s,'all',1000);
 expect(picked.totalHanging).toBe(5);expect(picked.visible).toHaveLength(4);expect(picked.overflow).toBe(1);
 expect(commands.findIdeas(s,{status:'archived'})).toHaveLength(35);expect(s.ideas).toHaveLength(40);
});
