import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('legisAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  log: (level, message) => ipcRenderer.invoke('log', { level, message }),
  qr: { generate: (data) => ipcRenderer.invoke('qr:generate', data) }
});
