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
    backupLocal: () => ipcRenderer.invoke('db:backup:local'),
    exportBackup: (password) => ipcRenderer.invoke('db:backup:export', { password }),
    restoreBackup: (filePath, password) => ipcRenderer.invoke('backup:validateAndRestore', { filePath, password })
  },
  dialog: {
    openBackup: () => ipcRenderer.invoke('dialog:open-backup')
  },
  backup: {
    export: (password) => ipcRenderer.invoke('backup:export', password),
    import: (password) => ipcRenderer.invoke('backup:import', password)
  },
  sync: {
    github: {
      saveToken: (token) => ipcRenderer.invoke('sync:github:save-token', token),
      hasToken: () => ipcRenderer.invoke('sync:github:has-token'),
      validate: () => ipcRenderer.invoke('sync:github:validate'),
      force: () => ipcRenderer.invoke('sync:github:force'),
      clear: () => ipcRenderer.invoke('sync:github:clear'),
      setRepo: (config) => ipcRenderer.invoke('sync:github:set-repo', config),
      getRepo: () => ipcRenderer.invoke('sync:github:get-repo'),
      getQueueStats: () => ipcRenderer.invoke('sync:queue:stats'),
      enqueue: (data) => ipcRenderer.invoke('sync:queue:enqueue', data)
    }
  },
  analytics: {
    status: () => ipcRenderer.invoke('app:analytics:status'),
    setOptIn: (enabled) => ipcRenderer.invoke('app:analytics:set-opt-in', enabled)
  },
  app: {
    fileHash: (path) => ipcRenderer.invoke('app:file-hash', path)
  }
});
