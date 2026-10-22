// SPDX-License-Identifier: GPL-3.0-only
import {describe,it,expect} from 'vitest';
import {layoutClips} from '../../src/shared/clipLayout';
import {initialSnapshot,newIdea,validateSnapshot} from '../../src/shared/ideaCommands';
import {placeIdea} from '../../src/shared/ideaPlacement';
import type {Result,Snapshot} from '../../src/shared/contracts';
const v=(r:Result<Snapshot>)=>{if(!r.ok)throw Error(r.message);return r.value;};
const seed=(n:number)=>{let s=initialSnapshot();for(let k=0;k<n;k++)s=v(newIdea(s,{title:'念头'+k,text:'正文',project:'工作',agentId:'general'},'n'+k,'2026-10-11T00:00:00Z'));return s;};
describe('round3 capacity and waiting origin',()=>{
 for(const count of [4,6,8])for(const width of [1024,1280,1440,1920,2560])it(`${width} DIP retains selected ${count} places`,()=>{
  const s=seed(12),r=(layoutClips as (...args:any[])=>ReturnType<typeof layoutClips>)(s.clips,width,count);
  expect(r.visible).toHaveLength(count);expect(r.overflow).toHaveLength(12-count);
 });
 it('new capacity save explicitly waits while legacy archived stays unchanged',()=>{
  const s=seed(8),next=v(placeIdea(s,{id:'waiting',draft:{title:'等待补位',text:'',project:'',agentId:'general'}},{kind:'save'},1440,'2026-10-11T01:00:00Z'));
  expect(next.ideas.find(i=>i.id==='waiting')).toMatchObject({status:'archived',offRopeReason:'waiting'});
  expect(s.ideas.every(i=>!('offRopeReason' in i))).toBe(true);
 });
});

it('invalid capacity inputs fail without changing saved snapshot',()=>{const s=seed(1),original=structuredClone(s);for(const value of [null,'4',5,Infinity,0])expect(validateSnapshot({...s,settings:{...s.settings,shelfCapacity:value}}).ok).toBe(false);expect(s).toEqual(original);});
