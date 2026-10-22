// SPDX-License-Identifier: GPL-3.0-only
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import type {Snapshot} from '../../src/shared/contracts';
const mocks=vi.hoisted(()=>({setAppUserModelId:vi.fn(),setToastActivatorCLSID:vi.fn(),handleActivation:vi.fn(),execFile:vi.fn()}));
vi.mock('electron',()=>({app:{setAppUserModelId:mocks.setAppUserModelId,setToastActivatorCLSID:mocks.setToastActivatorCLSID},Notification:{isSupported:()=>true,handleActivation:mocks.handleActivation}}));
vi.mock('node:child_process',()=>({execFile:mocks.execFile}));
import {ReminderNotifications,notificationAccess} from '../../src/main/reminderNotifications';
const platform=Object.getOwnPropertyDescriptor(process,'platform')!;
const store=Object.getOwnPropertyDescriptor(process,'windowsStore');
beforeEach(()=>{vi.clearAllMocks();Object.defineProperty(process,'platform',{value:'win32',configurable:true});mocks.execFile.mockImplementation((_file,_args,_opts,callback)=>callback(null,'Enabled'));});
afterEach(()=>{Object.defineProperty(process,'platform',platform);if(store)Object.defineProperty(process,'windowsStore',store);else Reflect.deleteProperty(process,'windowsStore');});
function packaged(value:boolean){Object.defineProperty(process,'windowsStore',{value,configurable:true});}
test('Store notifications bind to the registered package AUMID and stable manifest COM activator',async()=>{
 packaged(true);new ReminderNotifications(()=>({ideas:[]} as unknown as Snapshot),()=> 'en',async()=>{});
 expect(mocks.setAppUserModelId).toHaveBeenCalledWith('NocodeMrli.Thoughtline_a1n5zxj14c524!App');
 expect(mocks.setToastActivatorCLSID).toHaveBeenCalledWith('5d3acf61-53d7-51af-ad67-05db67eae9e8');
 expect(mocks.handleActivation).toHaveBeenCalledOnce();
 expect(await notificationAccess()).toEqual({status:'granted'});
 expect(mocks.execFile.mock.calls[0][1].at(-1)).toContain("CreateToastNotifier('NocodeMrli.Thoughtline_a1n5zxj14c524!App')");
});
test('ordinary EXE retains legacy AUMID, activation and permission handling',async()=>{
 packaged(false);new ReminderNotifications(()=>({ideas:[]} as unknown as Snapshot),()=> 'en',async()=>{});
 expect(mocks.setAppUserModelId).toHaveBeenCalledWith('com.nocodemrli.thoughtline');expect(mocks.setToastActivatorCLSID).not.toHaveBeenCalled();
 expect(await notificationAccess()).toEqual({status:'granted'});expect(mocks.execFile.mock.calls[0][1].at(-1)).toContain("CreateToastNotifier('com.nocodemrli.thoughtline')");
});
