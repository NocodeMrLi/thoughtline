import {contextBridge,ipcRenderer} from 'electron';import type {ThoughtlineBridge} from '../shared/bridge';
const api:ThoughtlineBridge={
 info:()=>ipcRenderer.invoke('thoughtline:info'),
 onInfo:callback=>{const listener=(_event:Electron.IpcRendererEvent,info:Parameters<typeof callback>[0])=>callback(info);ipcRenderer.on('thoughtline:info-update',listener);return()=>ipcRenderer.removeListener('thoughtline:info-update',listener);},
 hitRects:layout=>ipcRenderer.send('thoughtline:hit-layout',layout),
 copy:id=>ipcRenderer.invoke('thoughtline:copy',id),
 submit:(draft,revision)=>ipcRenderer.invoke('thoughtline:submit',draft,revision),
 close:draft=>ipcRenderer.invoke('thoughtline:close',draft)
};
contextBridge.exposeInMainWorld('thoughtline',api);
