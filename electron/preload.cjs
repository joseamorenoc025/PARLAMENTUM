const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_CHANNELS = new Set([
  'db:isReady', 'db:select', 'db:upsert', 'db:query', 'db:get-stats',
  'db:backup:local', 'db:backup:export', 'db:backup:encrypted',
  'auth:hash', 'auth:verify', 'auth:get-user', 'auth:login', 'auth:recover', 'auth:update-login',
  'backup:export', 'backup:import', 'backup:validateAndRestore',
  'backup:cloud:upload', 'backup:cloud:download',
  'backup:uploadToCloud', 'backup:downloadFromCloud',
  'backup:checkCloudToken', 'backup:setCloudToken',
  'laws:import',
  'app:health', 'app:file-hash', 'app:get-logo', 'app:get-setup-status',
  'app:analytics:status', 'app:analytics:set-opt-in',
  'dialog:open-pdf', 'dialog:open-image', 'dialog:open-backup',
  'setup:initialize',
  'junta:getAll', 'junta:save', 'junta:delete',
  'documents:save-file', 'documents:open-file',
  'pdf:stamp-qr', 'qr:generate',
  'sync:github:save-token', 'sync:github:has-token', 'sync:github:validate',
  'sync:github:force', 'sync:github:clear', 'sync:github:set-repo',
  'sync:github:get-repo', 'sync:queue:stats', 'sync:queue:enqueue',
  'log',
]);

contextBridge.exposeInMainWorld('legisAPI', {
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  invoke: (channel, data) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`IPC channel '${channel}' is not allowed`));
    }
    return ipcRenderer.invoke(channel, data);
  },

  log: (level, message) => ipcRenderer.invoke('log', { level, message }),

  qr: {
    generate: (data) => ipcRenderer.invoke('qr:generate', data),
  },

  auth: {
    hash: (password) => ipcRenderer.invoke('auth:hash', password),
    verify: (password, hash) => ipcRenderer.invoke('auth:verify', { password, hash }),
    getUser: () => ipcRenderer.invoke('auth:get-user'),
    login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
    recover: (phrase, newPassword) => ipcRenderer.invoke('auth:recover', { phrase, newPassword }),
    updateLogin: (id) => ipcRenderer.invoke('auth:update-login', id),
  },

  db: {
    isReady: () => ipcRenderer.invoke('db:isReady'),
    select: (table, where) => ipcRenderer.invoke('db:select', { table, where }),
    upsert: (table, data) => ipcRenderer.invoke('db:upsert', { table, data }),
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
    getStats: () => ipcRenderer.invoke('db:get-stats'),
    backupLocal: () => ipcRenderer.invoke('db:backup:local'),
    exportBackup: (password) => ipcRenderer.invoke('db:backup:export', { password }),
    restoreBackup: (filePath, password) => ipcRenderer.invoke('backup:validateAndRestore', { filePath, password }),
  },

  dialog: {
    openPdf: () => ipcRenderer.invoke('dialog:open-pdf'),
    openImage: () => ipcRenderer.invoke('dialog:open-image'),
    openBackup: () => ipcRenderer.invoke('dialog:open-backup'),
  },

  backup: {
    export: (password) => ipcRenderer.invoke('backup:export', password),
    import: (password) => ipcRenderer.invoke('backup:import', password),
    validateAndRestore: (filePath, password) => ipcRenderer.invoke('backup:validateAndRestore', { filePath, password }),
    cloudUpload: (password) => ipcRenderer.invoke('backup:cloud:upload', password),
    cloudDownload: (password) => ipcRenderer.invoke('backup:cloud:download', password),
    uploadToCloud: (password) => ipcRenderer.invoke('backup:uploadToCloud', password),
    downloadFromCloud: () => ipcRenderer.invoke('backup:downloadFromCloud'),
    checkCloudToken: () => ipcRenderer.invoke('backup:checkCloudToken'),
    setCloudToken: (token) => ipcRenderer.invoke('backup:setCloudToken', { token }),
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
      enqueue: (data) => ipcRenderer.invoke('sync:queue:enqueue', data),
    },
  },

  analytics: {
    status: () => ipcRenderer.invoke('app:analytics:status'),
    setOptIn: (enabled) => ipcRenderer.invoke('app:analytics:set-opt-in', enabled),
  },

  app: {
    fileHash: (path) => ipcRenderer.invoke('app:file-hash', path),
    getLogo: () => ipcRenderer.invoke('app:get-logo'),
    getSetupStatus: () => ipcRenderer.invoke('app:get-setup-status'),
    health: () => ipcRenderer.invoke('app:health'),
  },

  laws: {
    import: (data) => ipcRenderer.invoke('laws:import', data),
  },

  setup: {
    initialize: (data) => ipcRenderer.invoke('setup:initialize', data),
  },

  documents: {
    saveFile: (data) => ipcRenderer.invoke('documents:save-file', data),
    openFile: (id) => ipcRenderer.invoke('documents:open-file', id),
  },

  pdf: {
    stampQr: (data) => ipcRenderer.invoke('pdf:stamp-qr', data),
  },

  junta: {
    getAll: () => ipcRenderer.invoke('junta:getAll'),
    save: (data) => ipcRenderer.invoke('junta:save', data),
    delete: (id) => ipcRenderer.invoke('junta:delete', id),
  },
});
