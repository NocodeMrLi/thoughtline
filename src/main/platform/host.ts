// SPDX-License-Identifier: GPL-3.0-only
import {BrowserWindow,screen} from 'electron';import type {PlatformHost,Rect} from '../../shared/contracts';
export function createHost(shelf:BrowserWindow,composer:()=>BrowserWindow|null):PlatformHost{
 if(!['darwin','win32'].includes(process.platform))throw Error('Thoughtline目标平台为macOS和Windows。');
 let interactive=false;
 const setInteractive=(value:boolean)=>{if(interactive===value)return;shelf.setIgnoreMouseEvents(!value,{forward:true});interactive=value;};
 return {
  platform:process.platform==='darwin'?'mac':'windows',cursor:()=>screen.getCursorScreenPoint(),
  displays:()=>screen.getAllDisplays().map(d=>({id:String(d.id),bounds:d.bounds,workArea:d.workArea,scaleFactor:d.scaleFactor})),
  showShelf:(bounds:Rect)=>{
   shelf.setBounds(bounds);shelf.showInactive();shelf.moveTop();
   // macOS can restore the hidden non-activating panel's old origin during show.
   // Correct its native frame after showing; renderer and hit geometry use these DIP bounds.
   const actual=shelf.getBounds();
   if(actual.x!==bounds.x||actual.y!==bounds.y||actual.width!==bounds.width||actual.height!==bounds.height)shelf.setBounds(bounds);
  },
  hideShelf:()=>{setInteractive(false);shelf.hide();},
  setShelfInteractive:setInteractive,
  showComposer:(bounds:Rect)=>{const w=composer();if(w){w.setBounds(bounds);w.show();w.focus();}},
  closeComposer:()=>composer()?.hide()
 };
}
