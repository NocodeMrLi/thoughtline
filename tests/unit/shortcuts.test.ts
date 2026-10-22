// SPDX-License-Identifier: GPL-3.0-only
import {expect,test} from 'vitest';
import {swapShortcut,type ShortcutRegistry} from '../../src/main/shortcuts';
class Registry implements ShortcutRegistry{
  active=new Map<string,()=>void>(); external=new Set<string>();
  register(key:string,callback:()=>void){if(this.external.has(key)||this.active.has(key))return false;this.active.set(key,callback);return true;}
  isRegistered(key:string){return this.active.has(key);}
  unregister(key:string){this.active.delete(key);}
}
test('改键失败保留旧入口，成功后新入口触发且旧入口释放',async()=>{
  const registry=new Registry();let opened=0;
  registry.register('old',()=>opened++);registry.external.add('busy');
  expect(await swapShortcut(registry,'old','busy',()=>opened++)).toEqual({ok:false,active:'old'});
  registry.active.get('old')!();expect(opened).toBe(1);
  expect(await swapShortcut(registry,'old','free',()=>opened++)).toEqual({ok:true,active:'free'});
  expect(registry.active.has('old')).toBe(false);registry.active.get('free')!();expect(opened).toBe(2);
});
test('不更改键位时保留已有注册',async()=>{
  const registry=new Registry();registry.register('old',()=>{});
  expect(await swapShortcut(registry,'old','old',()=>{})).toEqual({ok:true,active:'old'});
  expect(registry.active.has('old')).toBe(true);
});

test('新键注册后保存失败，旧入口仍可用且新键释放',async()=>{
 const registry=new Registry();let opened=0;registry.register('old',()=>opened++);
 const failed=await swapShortcut(registry,'old','new',()=>opened++,async()=>({ok:false,code:'IO',message:'disk full'}));
 expect(failed.ok).toBe(false);expect(registry.active.has('new')).toBe(false);registry.active.get('old')!();expect(opened).toBe(1);
});
test('旧配置键未注册时，同键重试不能伪报成功',async()=>{
 const registry=new Registry();registry.external.add('old');
 expect(await swapShortcut(registry,'old','old',()=>{})).toMatchObject({ok:false,active:'old'});
});
