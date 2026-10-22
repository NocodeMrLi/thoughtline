// SPDX-License-Identifier: GPL-3.0-only
import {BrowserWindow} from 'electron';
export function createShelf(preload:string):BrowserWindow{
 const w=new BrowserWindow({title:'Thoughtline Shelf',...(process.platform==='darwin'?{type:'panel'}:{}),frame:false,transparent:true,show:false,hasShadow:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,fullscreenable:false,resizable:false,backgroundColor:'#00000000',width:1200,height:340,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 w.setIgnoreMouseEvents(true,{forward:true});
 if(process.platform==='darwin')w.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});
 return w;
}
