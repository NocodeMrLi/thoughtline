import {expect,test} from 'vitest';
import {initialSnapshot,newIdea,editIdea,validateSnapshot,deleteIdea,restoreIdea,changeStatus} from '../../src/shared/ideaCommands';
import type {Result,Snapshot} from '../../src/shared/contracts';
const value=<T>(r:Result<T>):T=>{expect(r.ok).toBe(true);if(!r.ok)throw Error(r.message);return r.value;};
const now='2026-10-10T00:00:00.000Z',fields={text:'',title:'日报',agentId:'general',project:'工作'};
test('title-only creation preserves exact empty body and a single clip',()=>{
 const s=value(newIdea(initialSnapshot(),fields,'one',now));expect(s.ideas[0]).toMatchObject(fields);expect(s.clips).toHaveLength(1);expect(validateSnapshot(JSON.parse(JSON.stringify(s))).ok).toBe(true);
});
test('clearing the body while retaining title saves and survives archive/delete/restore',()=>{
 let s=value(newIdea(initialSnapshot(),{...fields,text:'原正文'},'one',now));s=value(editIdea(s,'one',fields,now));expect(s.ideas[0].text).toBe('');
 s=value(changeStatus(s,'one','archived',now));s=value(restoreIdea(value(deleteIdea(s,'one',now)),'one',now));expect(s.ideas[0].text).toBe('');expect(s.ideas[0].title).toBe('日报');expect(validateSnapshot(s).ok).toBe(true);
});
test('both empty or whitespace-only fields are rejected without losing last saved content',()=>{
 const s=value(newIdea(initialSnapshot(),{...fields,text:'原正文'},'one',now));const before=structuredClone(s);
 for(const text of ['', ' \n\t'])for(const title of ['', '  ']){expect(newIdea(initialSnapshot(),{...fields,text,title},'new',now).ok).toBe(false);expect(editIdea(s,'one',{...fields,text,title},now)).toMatchObject({ok:false,message:'请填写标题或正文。'});expect(validateSnapshot({...s,ideas:[{...s.ideas[0],text,title}]}).ok).toBe(false);}
 expect(s).toEqual(before);
});
test('title-only body keeps whitespace and existing text limits still apply',()=>{
 const s=value(newIdea(initialSnapshot(),{...fields,text:' \n\t'},'one',now));expect(s.ideas[0].text).toBe(' \n\t');expect(newIdea(s,{...fields,text:'a'.repeat(1048577)},'two',now).ok).toBe(false);expect(editIdea(s,'one',{...fields,title:'a'.repeat(51)},now).ok).toBe(false);
});
