import {BrowserWindow,nativeTheme} from 'electron';
export const COMPOSER_SIZE={width:530,height:520};
export function createComposer(preload:string):BrowserWindow{
 const window=new BrowserWindow({title:'Thoughtline Composer',frame:false,show:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,width:COMPOSER_SIZE.width,height:COMPOSER_SIZE.height,backgroundColor:nativeTheme.shouldUseDarkColors?'#202226':'#F7F7F5',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const theme=()=>window.setBackgroundColor(nativeTheme.shouldUseDarkColors?'#202226':'#F7F7F5');nativeTheme.on('updated',theme);window.once('closed',()=>nativeTheme.removeListener('updated',theme));return window;
}
