import {BrowserWindow,nativeTheme} from 'electron';
import {release} from 'node:os';
import {composerMaterial} from '../../shared/composerMaterial';
export const COMPOSER_SIZE={width:480,height:260};
export const currentComposerMaterial=(focused=true)=>composerMaterial(process.platform,release(),nativeTheme.prefersReducedTransparency,nativeTheme.shouldUseHighContrastColors,nativeTheme.inForcedColorsMode,focused);
export function createComposer(preload:string):BrowserWindow{
 const material=currentComposerMaterial();
 const window=new BrowserWindow({title:'Thoughtline Composer',frame:false,show:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,width:COMPOSER_SIZE.width,height:COMPOSER_SIZE.height,transparent:process.platform==='darwin',roundedCorners:true,vibrancy:material==='vibrancy'?'popover':undefined,visualEffectState:'followWindow',backgroundMaterial:material==='acrylic'?'acrylic':'none',backgroundColor:material==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const theme=()=>{const material=currentComposerMaterial(window.isFocused());if(process.platform==='darwin')window.setVibrancy(material==='vibrancy'?'popover':null);if(process.platform==='win32')window.setBackgroundMaterial(material==='acrylic'?'acrylic':'none');window.setBackgroundColor(material==='opaque'?(nativeTheme.shouldUseDarkColors?'#202226':'#F5F5F7'):'#00000000');};
 nativeTheme.on('updated',theme);window.on('focus',theme);window.on('blur',theme);window.once('closed',()=>nativeTheme.removeListener('updated',theme));return window;
}
