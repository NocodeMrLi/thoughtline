import {BrowserWindow} from 'electron';
export function createPicker(preload:string):BrowserWindow{
 return new BrowserWindow({title:'Thoughtline Picker',...(process.platform==='darwin'?{type:'panel'}:{}),frame:false,transparent:true,show:false,hasShadow:false,alwaysOnTop:true,skipTaskbar:true,focusable:true,resizable:false,fullscreenable:false,minimizable:false,maximizable:false,width:376,height:350,backgroundColor:'#00000000',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
}
