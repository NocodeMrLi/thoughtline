import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,changeStatus,validateSnapshot,deleteIdea} from '../../src/shared/ideaCommands';
import {calendarIndex} from '../../src/shared/ideaHistory';
import {layoutClips} from '../../src/shared/clipLayout';
import {mergeClips} from '../../src/shared/clipCommands';
import {agentLabel,dictionaries,translate} from '../../src/shared/i18n';
import type {Result} from '../../src/shared/contracts';
const value=<T>(r:Result<T>)=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const draft={text:'保留正文\n😀',title:'旧念头',project:'项目',agentId:'general'};
const fixture=(n=6)=>{let s=initialSnapshot();for(let i=0;i<n;i++)s=value(newIdea(s,draft,'id'+i,'2026-10-09T01:00:00Z'));return s;};
const ids=(index:Map<string,{id:string}[]>)=>[...index.values()].flat().map(i=>i.id);
test('fresh profile has only six compact presets spanning everyday, work, specific people and development',()=>{
 expect(initialSnapshot().agents.map(a=>a.name)).toEqual(['通用','生活灵感','工作记录','直属领导','同事','Codex']);
 expect(new Set(initialSnapshot().agents.map(a=>a.id)).size).toBe(6);
});
test('legacy schema2 custom developer tags, colors, note fields, positions and draft survive validation',()=>{
 let s=fixture(2);s={...s,schemaVersion:2,agents:[{id:'general',name:'通用',color:'#A0A3AA'},{id:'claude',name:'Claude 我改过',color:'#123456'}],ideas:s.ideas.map(i=>({...i,agentId:'claude'})),clips:s.clips.map(c=>({...c,agentId:'claude',position:.3})),draft:{...draft,agentId:'claude'}};
 s.ideas=s.ideas.map(({createdDay:_day,creationTimeZone:_zone,...i})=>i);const original=structuredClone(s),next=value(validateSnapshot(JSON.parse(JSON.stringify(s))));
 expect(next.agents).toEqual(original.agents);expect(next.ideas.map(({createdDay:_day,creationTimeZone:_zone,...i})=>i)).toEqual(original.ideas);expect(next.ideas.every(i=>i.createdDay==='2026-10-09'&&i.creationTimeZone==='legacy-offset')).toBe(true);expect(next.clips).toEqual(original.clips);expect(next.draft).toEqual(original.draft);expect(next.schemaVersion).toBe(3);
});
test('all app-owned messages use generic tag terminology in both languages',()=>{
 const offenders=Object.entries(dictionaries).flatMap(([locale,dict])=>Object.entries(dict).filter(([,v])=>/Agent/.test(v)).map(([k])=>locale+':'+k));expect(offenders).toEqual([]);
 expect(translate('zh-CN','Agent 标签')).toBe('Thoughtline标签');expect(translate('en','Agent 标签')).toBe('Thoughtline Tags');expect(translate('zh-CN','给谁：')).toBe('标签：');expect(translate('en','给谁：')).toBe('Tag:');
});
test('preset display translates only intact built-in names; user labels and renamed presets remain literal',()=>{
 expect(agentLabel('en',{id:'preset:life-inspiration',name:'生活灵感'})).toBe('Everyday ideas');expect(agentLabel('en',{id:'preset:manager',name:'直属领导'})).toBe('Direct manager');
 expect(agentLabel('en',{id:'preset:life-inspiration',name:'我的Agent生活记录'})).toBe('我的Agent生活记录');expect(agentLabel('en',{id:'custom',name:'直属领导'})).toBe('直属领导');expect(agentLabel('en',{id:'manager',name:'直属领导'})).toBe('直属领导');
});
test('native filter wording restores all tags and retains arbitrary user names',()=>{
 expect(translate('zh-CN','显示全部 Agent')).toBe('显示全部标签');expect(translate('en','显示全部 Agent')).toBe('Show all tags');expect(translate('zh-CN','onlyAgent',{name:'日报'})).toBe('只看 日报');expect(translate('en','onlyAgent',{name:'我的 Agent'})).toBe('Only 我的 Agent');
});
test('calendar off-line includes saved-only and put-away records, excludes deleted and drafts',()=>{
 let s=fixture(3);s=value(changeStatus(s,'id1','archived','2026-10-10T01:00:00Z'));s=value(changeStatus(s,'id2','archived','2026-10-10T01:00:00Z'));s=value(deleteIdea(s,'id2','2026-10-10T01:00:00Z'));s.draft={...draft,text:'尚未保存草稿'};
 expect(ids(calendarIndex(s,{status:'archived'},{width:1280,shelfAgentId:'all'}))).toEqual(['id1']);expect(ids(calendarIndex(s,{status:'all'},{width:1280,shelfAgentId:'all'}))).toEqual(['id0','id1']);
});
test('legacy hanging capacity overflow is off-line without mutating snapshot or creation dates',()=>{
 const s=fixture(8),before=JSON.stringify(s),shown=layoutClips(s.clips,800).visible.flatMap(p=>p.clip.ideaIds);expect(shown.length).toBeLessThan(8);
 expect(ids(calendarIndex(s,{status:'hanging'},{width:800,shelfAgentId:'all'}))).toEqual(s.ideas.filter(i=>shown.includes(i.id)).map(i=>i.id));expect(ids(calendarIndex(s,{status:'archived'},{width:800,shelfAgentId:'all'}))).toEqual(s.ideas.filter(i=>!shown.includes(i.id)).map(i=>i.id));expect(JSON.stringify(s)).toBe(before);
});
test('width changes recompute capacity status; tag-hidden normal clip remains on-line',()=>{
 const s=fixture(6);s.agents.push({id:'custom',name:'日报',color:'#8899AA'});s.ideas[0].agentId='custom';s.clips[0].agentId='custom';
 expect(ids(calendarIndex(s,{status:'hanging'},{width:2560,shelfAgentId:'custom'}))).toHaveLength(6);
 expect(ids(calendarIndex(s,{status:'hanging'},{width:800,shelfAgentId:'all'}))).not.toHaveLength(6);
});
test('legacy overflow actually shown by active tag filter is on-line',()=>{
 const s=fixture(8);s.agents.push({id:'custom',name:'日报',color:'#8899AA'});s.ideas[7].agentId='custom';s.clips[7].agentId='custom';
 expect(ids(calendarIndex(s,{status:'archived'},{width:800,shelfAgentId:'all'}))).toContain('id7');expect(ids(calendarIndex(s,{status:'hanging'},{width:800,shelfAgentId:'custom'}))).toContain('id7');
});
test('all stack members count on-line, including the page that is not current',()=>{
 const s=value(mergeClips(fixture(2),'clip:id1','clip:id0'));expect(s.clips[0].ideaIds).toHaveLength(2);expect(ids(calendarIndex(s,{status:'hanging'},{width:800,shelfAgentId:'all'}))).toEqual(['id0','id1']);
});
