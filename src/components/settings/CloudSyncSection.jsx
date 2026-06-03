import React, { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, RefreshCw } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function CloudSyncSection({ darkMode, addToast }) {
  const [backupPassword, setBackupPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCloudUpload = async () => {
    if (!backupPassword) { addToast('Ingrese la contrasena', 'warning'); return; }
    setIsUploading(true);
    try {
      await window.legisAPI.backup.cloudUpload(backupPassword);
      addToast('Subida completada', 'success');
    } catch {
      addToast('Error al subir', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloudDownload = async () => {
    if (!backupPassword) { addToast('Ingrese la contrasena', 'warning'); return; }
    setIsDownloading(true);
    try {
      await window.legisAPI.backup.cloudDownload(backupPassword);
      addToast('Descarga completada. Reinicie la app.', 'success');
    } catch {
      addToast('Error al descargar', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
      <SectionHeader icon={Cloud} title="GitHub Cloud Sync (Oficina-Casa)" description="Sincronice su base de datos entre equipos via GitHub" color="purple" darkMode={darkMode} />

      <div className={`p-3 rounded-xl text-xs mb-4 ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
        Cifrado AES-256. El respaldo se almacena de forma encriptada en su repositorio privado.
      </div>

      <div className="relative mb-4">
        <input
          type="password"
          value={backupPassword}
          onChange={e => setBackupPassword(e.target.value)}
          placeholder="Contrasena para cifrar el respaldo"
          className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleCloudUpload}
          disabled={isUploading}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-bold transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500/50 text-purple-400' : 'bg-gray-50 border-gray-200 hover:border-purple-300 text-purple-600'}`}
        >
          {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
          {isUploading ? 'Subiendo...' : 'Subir Respaldo'}
        </button>
        <button
          onClick={handleCloudDownload}
          disabled={isDownloading}
          className={`flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-bold transition-colors ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 text-emerald-400' : 'bg-gray-50 border-gray-200 hover:border-emerald-300 text-emerald-600'}`}
        >
          {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
          {isDownloading ? 'Descargando...' : 'Descargar Respaldo'}
        </button>
      </div>
    </div>
  );
}
