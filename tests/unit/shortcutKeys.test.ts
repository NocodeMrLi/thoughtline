import {expect,test} from 'vitest';
import * as keys from '../../src/shared/composerKeys';

test('录制按物理键码保留组合，中文输入中的键不作为新快捷键',()=>{
 const event={code:'KeyK',metaKey:true,ctrlKey:false,altKey:true,shiftKey:false,isComposing:false};
 expect(keys.recordWriteHotkey?.(event,'mac')).toBe('Command+Alt+K');
 expect(keys.recordWriteHotkey?.({...event,metaKey:false,ctrlKey:true},'windows')).toBe('Control+Alt+K');
 expect(keys.recordWriteHotkey?.({...event,isComposing:true},'mac')).toBeNull();
 expect(keys.recordWriteHotkey?.({...event,metaKey:false,altKey:false},'mac')).toBeNull();
});
test('保存键位拒绝裸键、重复修饰键和非法系统字符串',()=>{
 expect(keys.validWriteHotkey?.('Control+Alt+F19')).toBe(true);
 expect(keys.validWriteHotkey?.('Command+Shift+Space')).toBe(true);
 for(const value of ['Escape','N','Shift+N','Control+Control+N','Control++N','Control+Invalid'])expect(keys.validWriteHotkey?.(value)).toBe(false);
});
test.each([
 ['Control+Alt+K','mac','⌃⌥K'],
 ['Command+Shift+Space','mac','⌘⇧空格'],
 ['Control+Alt+K','windows','Ctrl + Alt + K'],
 ['Super+Control+F12','windows','Win + Ctrl + F12'],
] as const)('快捷键提示按实际保存值及平台显示：%s/%s',(hotkey,platform,label)=>{
 expect(keys.displayWriteHotkey(hotkey,platform)).toBe(label);
});
