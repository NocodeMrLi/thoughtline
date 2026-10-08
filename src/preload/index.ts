import {contextBridge,ipcRenderer} from 'electron';import type {ThoughtlineBridge} from '../shared/bridge';
const api:ThoughtlineBridge={
 info:()=>ipcRenderer.invoke('thoughtline:info'),
 onInfo:callback=>{const listener=(_event:Electron.IpcRendererEvent,info:Parameters<typeof callback>[0])=>callback(info);ipcRenderer.on('thoughtline:info-update',listener);return()=>ipcRenderer.removeListener('thoughtline:info-update',listener);},
 hitRects:layout=>ipcRenderer.send('thoughtline:hit-layout',layout),
 copy:id=>ipcRenderer.invoke('thoughtline:copy',id),
 submit:(draft,revision)=>ipcRenderer.invoke('thoughtline:submit',draft,revision),
 close:draft=>ipcRenderer.invoke('thoughtline:close',draft),
 openManage:(id,titles)=>ipcRenderer.invoke('thoughtline:open-manage',id,titles),
 closeManage:()=>ipcRenderer.invoke('thoughtline:close-manage'),
 openEdit:id=>ipcRenderer.invoke('thoughtline:open-edit',id),
 setStatus:(id,status,revision)=>ipcRenderer.invoke('thoughtline:status',id,status,revision),
 dragLock:active=>ipcRenderer.invoke('thoughtline:drag-lock',active),
 clipChange:(change,revision)=>ipcRenderer.invoke('thoughtline:clip',change,revision),
 agentChange:(change,revision)=>ipcRenderer.invoke('thoughtline:agent',change,revision)
};
contextBridge.exposeInMainWorld('thoughtline',api);
