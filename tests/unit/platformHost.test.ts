import {expect,test,vi} from 'vitest';
vi.mock('electron',()=>({screen:{getCursorScreenPoint:()=>({x:0,y:0}),getAllDisplays:()=>[]}}));
import {createHost} from '../../src/main/platform/host';
import type {BrowserWindow} from 'electron';
test('同一穿透状态不重复跨原生调用，隐藏后下一次命中仍可恢复交互',()=>{
 const setIgnoreMouseEvents=vi.fn(),hide=vi.fn();const shelf={setIgnoreMouseEvents,hide} as unknown as BrowserWindow;
 const host=createHost(shelf,()=>null);for(let i=0;i<120;i++)host.setShelfInteractive(true);
 expect(setIgnoreMouseEvents).toHaveBeenCalledTimes(1);expect(setIgnoreMouseEvents).toHaveBeenLastCalledWith(false,{forward:true});
 host.hideShelf();for(let i=0;i<120;i++)host.setShelfInteractive(false);expect(setIgnoreMouseEvents).toHaveBeenCalledTimes(2);
 host.setShelfInteractive(true);expect(setIgnoreMouseEvents).toHaveBeenCalledTimes(3);expect(hide).toHaveBeenCalledOnce();
});
