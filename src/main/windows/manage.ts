// SPDX-License-Identifier: GPL-3.0-only
import {BrowserWindow,nativeTheme} from 'electron';
import {currentComposerMaterial} from './composer';
export function createManage(preload:string):BrowserWindow{
 const material=currentComposerMaterial();
 const window=new BrowserWindow({title:'Thoughtline Manage',frame:false,show:false,resizable:true,minWidth:350,minHeight:360,skipTaskbar:true,alwaysOnTop:true,width:740,height:540,transparent:process.platform==='darwin',roundedCorners:true,vibrancy:material==='vibrancy'?'popover':undefined,visualEffectState:'followWindow',backgroundMaterial:material==='acrylic'?'acrylic':'none',backgroundColor:material==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const theme=()=>{const next=currentComposerMaterial(window.isFocused());if(process.platform==='darwin')window.setVibrancy(next==='vibrancy'?'popover':null);if(process.platform==='win32')window.setBackgroundMaterial(next==='acrylic'?'acrylic':'none');window.setBackgroundColor(next==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000');};
 nativeTheme.on('updated',theme);window.on('focus',theme);window.on('blur',theme);window.once('closed',()=>nativeTheme.removeListener('updated',theme));return window;
}
