import {expect,test} from 'vitest';
import {initialSnapshot,validateSnapshot,removeProject,removeAgent} from '../../src/shared/ideaCommands';
import {projectNames,addProject,renameProject,classificationCount} from '../../src/shared/classification';
import type {Snapshot} from '../../src/shared/contracts';
const fixture=():Snapshot=>{const s=initialSnapshot(),date='2026-10-12T00:00:00Z';s.ideas=['hanging','archived','deleted'].map((status,n)=>({id:'i'+n,title:'标题 '+n,text:'完整正文 '+n,project:'工作记录',agentId:'general',status:status as 'hanging'|'archived'|'deleted',createdAt:date,updatedAt:date,createdDay:'2026-10-12',creationTimeZone:'UTC',...(status==='deleted'?{deletedAt:date,deletedFrom:'hanging' as const}:{})}));s.clips=[{id:'c0',agentId:'general',ideaIds:['i0'],currentId:'i0',position:.4}];s.draft={title:'未提交',text:'草稿正文',project:'工作记录',agentId:'general'};return s;};
test('legacy projects include hanging, archived, deleted and draft-only groups without changing input',()=>{const s=fixture();s.draft!.project='草稿分组';const before=JSON.stringify(s);expect(new Set(projectNames(s))).toEqual(new Set(['工作记录','草稿分组']));expect(JSON.stringify(s)).toBe(before);});
test('an empty group persists through validation and JSON reload and counts zero notes',()=>{const s=fixture(),r=addProject(s,'  产品迭代  ');expect(r.ok).toBe(true);if(!r.ok)return;expect(projectNames(r.value)).toContain('产品迭代');expect(classificationCount(r.value,'project','产品迭代')).toBe(0);expect(r.value.ideas).toEqual(s.ideas);expect(r.value.draft).toEqual(s.draft);const loaded=validateSnapshot(JSON.parse(JSON.stringify(r.value)));expect(loaded.ok).toBe(true);if(loaded.ok)expect(projectNames(loaded.value)).toContain('产品迭代');});
test('project names reject empty, duplicate and overlong inputs; malformed catalog cannot silently load',()=>{const s=fixture();for(const name of [' ','工作记录','x'.repeat(41)])expect(addProject(s,name).ok).toBe(false);for(const projects of [[''],['a','a'],[7],null])expect(validateSnapshot({...s,projects}).ok).toBe(false);});
test('rename updates every status and draft, preserves text, tag, clip membership and creation data',()=>{const s=fixture(),r=renameProject(s,'工作记录','工作日志','2026-10-12T01:00:00Z');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.value.ideas.map(i=>i.project)).toEqual(['工作日志','工作日志','工作日志']);expect(r.value.draft).toEqual({...s.draft,project:'工作日志'});expect(r.value.clips).toEqual(s.clips);for(let n=0;n<3;n++)expect({...r.value.ideas[n],project:s.ideas[n].project,updatedAt:s.ideas[n].updatedAt}).toEqual(s.ideas[n]);expect(projectNames(r.value)).not.toContain('工作记录');expect(classificationCount(r.value,'project','工作日志')).toBe(3);});
test('rename rejects a duplicate or missing group and supports empty catalog groups',()=>{const s=addProject(fixture(),'空分组');if(!s.ok)throw Error('fixture');expect(renameProject(s.value,'工作记录','空分组','2026-10-12T01:00:00Z').ok).toBe(false);expect(renameProject(s.value,'不存在','新名','2026-10-12T01:00:00Z').ok).toBe(false);const r=renameProject(s.value,'空分组','空分组改名','2026-10-12T01:00:00Z');expect(r.ok).toBe(true);if(r.ok)expect(projectNames(r.value)).toContain('空分组改名');});
test('delete removes empty and used groups from catalog, preserves every note and clears draft association',()=>{const s=addProject(fixture(),'空分组');if(!s.ok)throw Error('fixture');const r=removeProject(s.value,'工作记录','2026-10-12T01:00:00Z');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.value.ideas.map(i=>i.project)).toEqual(['','','']);expect(r.value.draft?.project).toBe('');expect(projectNames(r.value)).not.toContain('工作记录');const empty=removeProject(r.value,'空分组','2026-10-12T01:00:00Z');expect(empty.ok).toBe(true);if(empty.ok)expect(projectNames(empty.value)).not.toContain('空分组');expect(removeProject(r.value,'','2026-10-12T01:00:00Z').ok).toBe(false);});
test('tag migration covers recent deletion and draft, keeps project directory and prevents default removal',()=>{const s=fixture();s.projects=['空分组'];s.agents.push({id:'daily',name:'日报',color:'#789360'});s.ideas=s.ideas.map(i=>({...i,agentId:'daily'}));s.clips=s.clips.map(c=>({...c,agentId:'daily'}));s.draft!.agentId='daily';expect(classificationCount(s,'tag','daily')).toBe(3);const r=removeAgent(s,'daily','general');expect(r.ok).toBe(true);if(r.ok){expect(r.value.projects).toEqual(['空分组']);expect(r.value.draft?.agentId).toBe('general');expect(r.value.ideas.every(i=>i.agentId==='general')).toBe(true);}expect(removeAgent(s,'general','daily').ok).toBe(false);});

// A stop must never erase historical or in-progress ownership; re-enable must
// survive a disk round trip. These are different from permanent deletion.
import * as catalog from '../../src/shared/classification';
test('stop hides groups from new choices, retains all history and draft, and can resume after reload',()=>{
 const s=fixture(),r=catalog.setClassificationActive(s,'project','工作记录',false);expect(r.ok).toBe(true);if(!r.ok)return;
 expect(catalog.activeProjects(r.value)).not.toContain('工作记录');expect(r.value.ideas).toEqual(s.ideas);expect(r.value.draft).toEqual(s.draft);
 const loaded=validateSnapshot(JSON.parse(JSON.stringify(r.value)));expect(loaded.ok).toBe(true);if(!loaded.ok)return;
 expect(catalog.activeProjects(loaded.value)).not.toContain('工作记录');const resumed=catalog.setClassificationActive(loaded.value,'project','工作记录',true);expect(resumed.ok).toBe(true);if(resumed.ok)expect(catalog.activeProjects(resumed.value)).toContain('工作记录');
});
test('stop preserves tag colour and ownership; general and ungrouped cannot be stopped',()=>{
 const s=fixture();s.agents.push({id:'daily',name:'日报',color:'#789360'});const r=catalog.setClassificationActive(s,'tag','daily',false);expect(r.ok).toBe(true);if(r.ok){expect(catalog.activeTags(r.value).map(a=>a.id)).not.toContain('daily');expect(r.value.agents).toEqual(s.agents);}
 expect(catalog.setClassificationActive(s,'tag','general',false).ok).toBe(false);expect(catalog.setClassificationActive(s,'project','',false).ok).toBe(false);expect(catalog.setClassificationActive(s,'tag','missing',false).ok).toBe(false);
 for(const patch of [{inactiveAgents:['general']},{inactiveAgents:['missing']},{inactiveProjects:['missing']},{inactiveProjects:['工作记录','工作记录']},{inactiveAgents:null}])expect(validateSnapshot({...s,...patch}).ok).toBe(false);
});
test('renaming a stopped group keeps it stopped and permanent removal clears stop metadata',()=>{
 const stopped=catalog.setClassificationActive(fixture(),'project','工作记录',false);if(!stopped.ok)throw Error('stop');const renamed=renameProject(stopped.value,'工作记录','历史工作','2026-10-12T01:00:00Z');expect(renamed.ok).toBe(true);if(!renamed.ok)return;expect(catalog.activeProjects(renamed.value)).not.toContain('历史工作');const removed=removeProject(renamed.value,'历史工作','2026-10-12T02:00:00Z');expect(removed.ok).toBe(true);if(removed.ok)expect(removed.value.inactiveProjects).not.toContain('历史工作');
});
import {addAgent,updateAgent,newIdea,editIdea,permanentlyDeleteIdea} from '../../src/shared/ideaCommands';
test('new tags reject duplicate names, general name is protected while its colour remains editable',()=>{
 const s=fixture();expect(addAgent(s,{id:'duplicate',name:' 通用 ',color:'#789360'}).ok).toBe(false);expect(updateAgent(s,'general',{name:'changed',color:'#789360'}).ok).toBe(false);expect(updateAgent(s,'general',{name:s.agents[0].name,color:'#789360'}).ok).toBe(true);
});
test('final note creation registers group independently; removing last note does not erase classification',()=>{
 const s=initialSnapshot(),r=newIdea(s,{text:'正文',title:'',project:'独立目录',agentId:'general'},'new','2026-10-12T00:00:00Z');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.value.projects).toContain('独立目录');const deleted={...r.value,clips:[],ideas:r.value.ideas.map(i=>({...i,status:'deleted' as const,deletedAt:i.createdAt,deletedFrom:'hanging' as const}))};const removed=permanentlyDeleteIdea(deleted,'new');expect(removed.ok).toBe(true);if(removed.ok)expect(projectNames(removed.value)).toContain('独立目录');const edited=editIdea(fixture(),'i0',{text:'正文',title:'',project:'新归属',agentId:'general'},'2026-10-12T00:00:00Z');expect(edited.ok).toBe(true);if(edited.ok)expect(projectNames(edited.value)).toContain('新归属');
});

test('paused inline project typing does not accumulate unfinished prefixes in the directory',()=>{
 const s=fixture();s.projects=['工作记录'];let current=s;
 for(const project of ['新','新归属']){const r=editIdea(current,'i0',{...current.draft!,project},'2026-10-12T01:00:00Z');if(!r.ok)throw Error(r.message);current=r.value;}
 expect(current.projects).toEqual(['工作记录']);expect(projectNames(current)).not.toContain('新');
});

test('explicit completion retains only the final group even after its last note is removed',()=>{
 const s=fixture();s.projects=['工作记录'];let current=s;
 for(const project of ['新','新归属']){const r=editIdea(current,'i0',{...current.draft!,project},'2026-10-12T01:00:00Z');if(!r.ok)throw Error(r.message);current=r.value;}
 const r=catalog.rememberIdeaProject(current,'i0');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.value.projects).toContain('新归属');expect(r.value.projects).not.toContain('新');
 const deleted={...r.value,clips:[],ideas:r.value.ideas.map(i=>({...i,status:'deleted' as const,deletedAt:i.createdAt,deletedFrom:'hanging' as const}))},removed=permanentlyDeleteIdea(deleted,'i0');expect(removed.ok).toBe(true);if(removed.ok)expect(projectNames(removed.value)).toContain('新归属');
});

test('deleting the last legacy thought does not delete its independent historical group',()=>{
 const s=fixture();s.ideas=[s.ideas[2]];s.clips=[];s.draft=null;delete s.projects;
 const r=permanentlyDeleteIdea(s,'i2');expect(r.ok).toBe(true);if(!r.ok)return;expect(r.value.ideas).toEqual([]);expect(projectNames(r.value)).toContain('工作记录');
 const loaded=validateSnapshot(JSON.parse(JSON.stringify(r.value)));expect(loaded.ok).toBe(true);if(loaded.ok)expect(projectNames(loaded.value)).toContain('工作记录');
});

// Round 5: deleting a group may migrate ownership to another live group.
test('group deletion migrates hanging archived deleted and active draft atomically without text loss',()=>{
 const s=fixture();s.projects=['工作记录','接收分组'];s.inactiveProjects=['工作记录'];const before=JSON.stringify(s);
 const r=removeProject(s,'工作记录','2026-10-12T01:00:00Z','接收分组');expect(r.ok).toBe(true);if(!r.ok)return;
 expect(r.value.ideas.map(i=>i.project)).toEqual(['接收分组','接收分组','接收分组']);expect(r.value.draft).toEqual({...s.draft,project:'接收分组'});expect(r.value.clips).toEqual(s.clips);expect(r.value.inactiveProjects).not.toContain('工作记录');expect(projectNames(r.value)).not.toContain('工作记录');expect(JSON.stringify(s)).toBe(before);
 for(let n=0;n<3;n++)expect({...r.value.ideas[n],project:s.ideas[n].project,updatedAt:s.ideas[n].updatedAt}).toEqual(s.ideas[n]);
 expect(validateSnapshot(JSON.parse(JSON.stringify(r.value))).ok).toBe(true);
});
test('group migration rejects self missing inactive or invalid destination and protects defaults',()=>{
 const s=fixture();s.projects=['工作记录','停用接收'];s.inactiveProjects=['停用接收'];
 for(const to of ['工作记录','不存在','停用接收',7])expect(removeProject(s,'工作记录','2026-10-12T01:00:00Z',to as string).ok).toBe(false);
 expect(removeProject(s,'','2026-10-12T01:00:00Z','工作记录').ok).toBe(false);
});
