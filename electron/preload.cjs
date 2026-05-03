const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('legisAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  log: (level, message) => ipcRenderer.invoke('log', { level, message }),
  qr: { generate: (data) => ipcRenderer.invoke('qr:generate', data) },
  auth: {
    hash: (password) => ipcRenderer.invoke('auth:hash', password),
    verify: (password, hash) => ipcRenderer.invoke('auth:verify', { password, hash })
  },
  db: {
    backupLocal: () => ipcRenderer.invoke('db:backup:local')
  }
});
