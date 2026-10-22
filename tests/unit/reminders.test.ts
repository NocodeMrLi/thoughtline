// SPDX-License-Identifier: GPL-3.0-only
import {describe,it,expect} from 'vitest';
import {initialSnapshot,newIdea,validateSnapshot,deleteIdea,restoreIdea,editIdea} from '../../src/shared/ideaCommands';
import type {Draft} from '../../src/shared/contracts';
const now='2026-10-10T10:00:00.000Z',at='2026-10-10T11:00:00.000Z';
const draft=(time=at)=>({text:'正文😀\n保持原文',title:'汇报',project:'工作',agentId:'general',reminderAt:time} as Draft);
const seeded=()=>{const r=newIdea(initialSnapshot(),draft(),'idea-1',now);if(!r.ok)throw Error(r.message);return r.value;};
describe('one-time per-idea reminder persistence',()=>{
 it('activates only after committing a thought and keeps draft time out of idea fields',()=>{const s=seeded();expect(s.ideas[0]).toHaveProperty('reminder',{at,state:'scheduled'});expect(s.ideas[0]).not.toHaveProperty('reminderAt');expect(s.draft).toBeNull();});
 it('rejects an invalid reminder payload instead of silently accepting it',()=>{const s=seeded();(s.ideas[0] as unknown as Record<string,unknown>).reminder={at:'invalid',state:'scheduled'};expect(validateSnapshot(s).ok).toBe(false);});
 it('rejects past submission time while allowing an expired saved draft to reopen',()=>{const old=draft('2026-10-09T09:00:00.000Z');expect(validateSnapshot({...initialSnapshot(),draft:old}).ok).toBe(true);expect(newIdea(initialSnapshot(),old,'id',now).ok).toBe(false);});
 it('cancels deletion without restarting the reminder when restored',()=>{const s=seeded(),d=deleteIdea(s,'idea-1',now);if(!d.ok)throw Error(d.message);expect(d.value.ideas[0]).toHaveProperty('reminder.state','cancelled');const r=restoreIdea(d.value,'idea-1',now);if(!r.ok)throw Error(r.message);expect(r.value.ideas[0]).toHaveProperty('reminder.state','cancelled');});
 it('body editing preserves reminder, identity and original date',()=>{const s=seeded(),r=editIdea(s,'idea-1',{text:'新的正文',title:'新标题',project:'工作',agentId:'general'},now);if(!r.ok)throw Error(r.message);expect(r.value.ideas[0]).toHaveProperty('reminder',{at,state:'scheduled'});expect(r.value.ideas[0].createdAt).toBe(s.ideas[0].createdAt);});
});
