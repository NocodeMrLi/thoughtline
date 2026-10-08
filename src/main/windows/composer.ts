import {BrowserWindow} from 'electron';
export function createComposer(preload:string):BrowserWindow{
 return new BrowserWindow({title:'Thoughtline Composer',frame:false,show:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,width:530,height:410,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
}
