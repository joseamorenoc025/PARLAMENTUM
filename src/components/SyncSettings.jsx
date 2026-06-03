import React, { useState, useEffect } from 'react';
import { FolderOpen, Settings } from 'lucide-react';
import GitHubSyncSection from './settings/GitHubSyncSection';
import BackupSection from './settings/BackupSection';
import CloudSyncSection from './settings/CloudSyncSection';
import AnalyticsSection from './settings/AnalyticsSection';
import FilesVaultSection from './settings/FilesVaultSection';

export default function SyncSettings({
  darkMode,
  addToast,
  documents = [],
  sessions = [],
  oficios = [],
  projects = [],
  agreements = [],
  laws = [],
  onDeleteDocument,
  config = {},
  setConfig
}) {
  const [activeTab, setActiveTab] = useState('settings');
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, synced: 0 });

  useEffect(() => {
    const loadQueueStats = async () => {
      try {
        const stats = await window.legisAPI.sync.github.getQueueStats();
        setQueueStats({
          pending: stats.pending || 0,
          failed: stats.failed || 0,
          synced: stats.synced || 0
        });
      } catch (err) {
        console.error('Error loading queue stats:', err);
      }
    };
    loadQueueStats();
    const interval = setInterval(loadQueueStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className={`flex gap-2 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? (darkMode ? 'bg-gray-700 text-white shadow-lg' : 'bg-white text-gray-900 shadow-md')
              : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
          }`}
        >
          <Settings className="w-4 h-4" />
          Ajustes del Sistema
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'files'
              ? (darkMode ? 'bg-gray-700 text-white shadow-lg' : 'bg-white text-gray-900 shadow-md')
              : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Archivos del Sistema
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <GitHubSyncSection darkMode={darkMode} addToast={addToast} queueStats={queueStats} />
          <BackupSection darkMode={darkMode} addToast={addToast} />
          <CloudSyncSection darkMode={darkMode} addToast={addToast} />
          <AnalyticsSection darkMode={darkMode} addToast={addToast} config={config} setConfig={setConfig} />

          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Resiliencia Offline</h4>
            <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Si no hay conexion, los cambios se guardan en la cola de <b>Pendientes</b> y se reintentan automaticamente
              cada 60 segundos con backoff exponencial. El sistema es totalmente autonomo.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <FilesVaultSection
          darkMode={darkMode}
          addToast={addToast}
          documents={documents}
          sessions={sessions}
          oficios={oficios}
          projects={projects}
          agreements={agreements}
          laws={laws}
          onDeleteDocument={onDeleteDocument}
        />
      )}
    </div>
  );
}
