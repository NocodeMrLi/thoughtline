import {BrowserWindow} from 'electron';
export function createManage(preload:string):BrowserWindow{
 return new BrowserWindow({title:'Thoughtline Manage',frame:false,show:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,width:740,height:540,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
}
