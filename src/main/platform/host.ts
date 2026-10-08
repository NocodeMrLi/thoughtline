import {BrowserWindow,screen} from 'electron';import type {PlatformHost,Rect} from '../../shared/contracts';
export function createHost(shelf:BrowserWindow,composer:BrowserWindow):PlatformHost{
 if(!['darwin','win32'].includes(process.platform))throw Error('Thoughtline目标平台为macOS和Windows。');
 return {
  platform:process.platform==='darwin'?'mac':'windows',cursor:()=>screen.getCursorScreenPoint(),
  displays:()=>screen.getAllDisplays().map(d=>({id:String(d.id),bounds:d.bounds,workArea:d.workArea,scaleFactor:d.scaleFactor})),
  showShelf:(bounds:Rect)=>{shelf.setBounds(bounds);shelf.showInactive();},
  hideShelf:()=>{shelf.setIgnoreMouseEvents(true,{forward:true});shelf.hide();},
  setShelfInteractive:value=>shelf.setIgnoreMouseEvents(!value,{forward:true}),
  showComposer:(bounds:Rect)=>{composer.setBounds(bounds);composer.show();composer.focus();},
  closeComposer:()=>composer.hide()
 };
}
