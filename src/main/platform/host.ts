import {BrowserWindow,screen} from 'electron';import type {PlatformHost,Rect} from '../../shared/contracts';
export function createHost(shelf:BrowserWindow,composer:()=>BrowserWindow|null):PlatformHost{
 if(!['darwin','win32'].includes(process.platform))throw Error('Thoughtline目标平台为macOS和Windows。');
 let interactive=false;
 const setInteractive=(value:boolean)=>{if(interactive===value)return;shelf.setIgnoreMouseEvents(!value,{forward:true});interactive=value;};
 return {
  platform:process.platform==='darwin'?'mac':'windows',cursor:()=>screen.getCursorScreenPoint(),
  displays:()=>screen.getAllDisplays().map(d=>({id:String(d.id),bounds:d.bounds,workArea:d.workArea,scaleFactor:d.scaleFactor})),
  showShelf:(bounds:Rect)=>{shelf.setBounds(bounds);shelf.showInactive();},
  hideShelf:()=>{setInteractive(false);shelf.hide();},
  setShelfInteractive:setInteractive,
  showComposer:(bounds:Rect)=>{const w=composer();if(w){w.setBounds(bounds);w.show();w.focus();}},
  closeComposer:()=>composer()?.hide()
 };
}
