// SPDX-License-Identifier: GPL-3.0-only
import {BrowserWindow,nativeTheme} from 'electron';
import {currentComposerMaterial} from './composer';
// Settings is a standalone always-available window, not a mode of the calendar
// overlay, so it keeps its own identity and independently resizable bounds.
export const SETTINGS_SIZE={width:500,height:600};
export function createSettingsWindow(preload:string):BrowserWindow{
 const material=currentComposerMaterial();
 const window=new BrowserWindow({title:'Thoughtline Settings',frame:false,show:false,resizable:true,minWidth:350,minHeight:360,skipTaskbar:true,alwaysOnTop:true,width:SETTINGS_SIZE.width,height:SETTINGS_SIZE.height,transparent:process.platform==='darwin',roundedCorners:true,vibrancy:material==='vibrancy'?'popover':undefined,visualEffectState:'followWindow',backgroundMaterial:material==='acrylic'?'acrylic':'none',backgroundColor:material==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const theme=()=>{const next=currentComposerMaterial(window.isFocused());if(process.platform==='darwin')window.setVibrancy(next==='vibrancy'?'popover':null);if(process.platform==='win32')window.setBackgroundMaterial(next==='acrylic'?'acrylic':'none');window.setBackgroundColor(next==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000');};
 nativeTheme.on('updated',theme);window.on('focus',theme);window.on('blur',theme);window.once('closed',()=>nativeTheme.removeListener('updated',theme));return window;
}
