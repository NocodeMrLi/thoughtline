import {contextBridge,ipcRenderer} from 'electron';import type {ThoughtlineBridge} from '../shared/bridge';
const api:ThoughtlineBridge={
 info:()=>ipcRenderer.invoke('thoughtline:info'),
 onInfo:callback=>{const listener=(_event:Electron.IpcRendererEvent,info:Parameters<typeof callback>[0])=>callback(info);ipcRenderer.on('thoughtline:info-update',listener);return()=>ipcRenderer.removeListener('thoughtline:info-update',listener);},
 hitRects:layout=>ipcRenderer.send('thoughtline:hit-layout',layout),
 presentationFinished:session=>ipcRenderer.send('thoughtline:presentation-finished',session),
 copy:id=>ipcRenderer.invoke('thoughtline:copy',id),
 submit:(draft,revision)=>ipcRenderer.invoke('thoughtline:submit',draft,revision),
 close:draft=>ipcRenderer.invoke('thoughtline:close',draft),
 saveDraft:(draft,session,sequence)=>ipcRenderer.invoke('thoughtline:save-draft',draft,session,sequence),
 openManage:(id,titles)=>ipcRenderer.invoke('thoughtline:open-manage',id,titles),
 closeManage:()=>ipcRenderer.invoke('thoughtline:close-manage'),
 openEdit:id=>ipcRenderer.invoke('thoughtline:open-edit',id),
 shelfMenu:id=>ipcRenderer.invoke('thoughtline:shelf-menu',id),
 openSettings:()=>ipcRenderer.invoke('thoughtline:open-settings'),
 saveSettings:(settings,revision)=>ipcRenderer.invoke('thoughtline:settings',settings,revision),
 onPrepareQuit:callback=>{const listener=(_e:Electron.IpcRendererEvent,id:string)=>{let draft=null;try{draft=callback();}catch{}ipcRenderer.send('thoughtline:quit-draft',id,draft);};ipcRenderer.on('thoughtline:prepare-quit',listener);return()=>ipcRenderer.removeListener('thoughtline:prepare-quit',listener);},
 onQuitError:callback=>{const listener=(_e:Electron.IpcRendererEvent,message:string)=>callback(message);ipcRenderer.on('thoughtline:quit-error',listener);return()=>ipcRenderer.removeListener('thoughtline:quit-error',listener);},
 setStatus:(id,status,revision)=>ipcRenderer.invoke('thoughtline:status',id,status,revision),
 dragLock:active=>ipcRenderer.invoke('thoughtline:drag-lock',active),
 textDrag:(active,id)=>ipcRenderer.send('thoughtline:text-drag',active,id),
 clipChange:(change,revision)=>ipcRenderer.invoke('thoughtline:clip',change,revision),
 agentChange:(change,revision)=>ipcRenderer.invoke('thoughtline:agent',change,revision)
};
contextBridge.exposeInMainWorld('thoughtline',api);
