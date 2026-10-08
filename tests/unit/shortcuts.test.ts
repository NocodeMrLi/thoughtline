import {expect,test} from 'vitest';
import {swapShortcut,type ShortcutRegistry} from '../../src/main/shortcuts';
class Registry implements ShortcutRegistry{
  active=new Map<string,()=>void>(); external=new Set<string>();
  register(key:string,callback:()=>void){if(this.external.has(key)||this.active.has(key))return false;this.active.set(key,callback);return true;}
  unregister(key:string){this.active.delete(key);}
}
test('改键失败保留旧入口，成功后新入口触发且旧入口释放',()=>{
  const registry=new Registry();let opened=0;
  registry.register('old',()=>opened++);registry.external.add('busy');
  expect(swapShortcut(registry,'old','busy',()=>opened++)).toEqual({ok:false,active:'old'});
  registry.active.get('old')!();expect(opened).toBe(1);
  expect(swapShortcut(registry,'old','free',()=>opened++)).toEqual({ok:true,active:'free'});
  expect(registry.active.has('old')).toBe(false);registry.active.get('free')!();expect(opened).toBe(2);
});
test('不更改键位时保留已有注册',()=>{
  const registry=new Registry();registry.register('old',()=>{});
  expect(swapShortcut(registry,'old','old',()=>{})).toEqual({ok:true,active:'old'});
  expect(registry.active.has('old')).toBe(true);
});
