"use strict";
const electron = require("electron");
const api = {
  info: () => electron.ipcRenderer.invoke("thoughtline:info"),
  onInfo: (callback) => {
    const listener = (_event, info) => callback(info);
    electron.ipcRenderer.on("thoughtline:info-update", listener);
    return () => electron.ipcRenderer.removeListener("thoughtline:info-update", listener);
  },
  hitRects: (layout) => electron.ipcRenderer.send("thoughtline:hit-layout", layout),
  presentationFinished: (session) => electron.ipcRenderer.send("thoughtline:presentation-finished", session),
  copy: (id) => electron.ipcRenderer.invoke("thoughtline:copy", id),
  submit: (draft, revision) => electron.ipcRenderer.invoke("thoughtline:submit", draft, revision),
  close: (draft) => electron.ipcRenderer.invoke("thoughtline:close", draft),
  saveDraft: (draft, session, sequence) => electron.ipcRenderer.invoke("thoughtline:save-draft", draft, session, sequence),
  openManage: (id, titles) => electron.ipcRenderer.invoke("thoughtline:open-manage", id, titles),
  closeManage: () => electron.ipcRenderer.invoke("thoughtline:close-manage"),
  openEdit: (id) => electron.ipcRenderer.invoke("thoughtline:open-edit", id),
  shelfMenu: (id) => electron.ipcRenderer.invoke("thoughtline:shelf-menu", id),
  openSettings: () => electron.ipcRenderer.invoke("thoughtline:open-settings"),
  saveSettings: (settings, revision) => electron.ipcRenderer.invoke("thoughtline:settings", settings, revision),
  onPrepareQuit: (callback) => {
    const listener = (_e, id) => {
      let draft = null;
      try {
        draft = callback();
      } catch {
      }
      electron.ipcRenderer.send("thoughtline:quit-draft", id, draft);
    };
    electron.ipcRenderer.on("thoughtline:prepare-quit", listener);
    return () => electron.ipcRenderer.removeListener("thoughtline:prepare-quit", listener);
  },
  onQuitError: (callback) => {
    const listener = (_e, message) => callback(message);
    electron.ipcRenderer.on("thoughtline:quit-error", listener);
    return () => electron.ipcRenderer.removeListener("thoughtline:quit-error", listener);
  },
  setStatus: (id, status, revision) => electron.ipcRenderer.invoke("thoughtline:status", id, status, revision),
  dragLock: (active) => electron.ipcRenderer.invoke("thoughtline:drag-lock", active),
  textDrag: (active, id) => electron.ipcRenderer.send("thoughtline:text-drag", active, id),
  clipChange: (change, revision) => electron.ipcRenderer.invoke("thoughtline:clip", change, revision),
  agentChange: (change, revision) => electron.ipcRenderer.invoke("thoughtline:agent", change, revision)
};
electron.contextBridge.exposeInMainWorld("thoughtline", api);
