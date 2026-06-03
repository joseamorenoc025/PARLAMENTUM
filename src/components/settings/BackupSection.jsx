import React, { useState } from 'react';
import { Database, Download, Upload, Lock, RefreshCw, FolderOpen } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function BackupSection({ darkMode, addToast }) {
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleExportBackup = async (e) => {
    e.preventDefault();
    if (!backupPassword) { addToast('Ingrese una contrasena', 'warning'); return; }
    setIsExporting(true);
    try {
      const result = await window.legisAPI.db.exportBackup(backupPassword);
      if (result?.path) addToast(`Respaldo exportado: ${result.path}`, 'success');
    } catch (err) {
      addToast('Error al exportar', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectRestoreFile = async () => {
    const filePath = await window.legisAPI.dialog.openBackup();
    if (filePath) setRestoreFile(filePath);
  };

  const handleRestoreBackup = async (e) => {
    e.preventDefault();
    if (!restoreFile || !restorePassword) { addToast('Seleccione archivo e ingrese contrasena', 'warning'); return; }
    setIsRestoring(true);
    try {
      await window.legisAPI.db.restoreBackup(restoreFile, restorePassword);
      addToast('Restauracion completada. Reinicie la app.', 'success');
    } catch (err) {
      addToast('Error al restaurar', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
      <SectionHeader icon={Database} title="Respaldo y Restauracion Local" description="Exporte o restaure la base de datos completa" color="blue" darkMode={darkMode} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleExportBackup} className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-sm font-bold mb-3">Exportar Respaldo</h3>
          <div className="relative mb-3">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={backupPassword}
              onChange={e => setBackupPassword(e.target.value)}
              placeholder="Contrasena para cifrar"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
          <button
            type="submit"
            disabled={isExporting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exportando...' : 'Elegir Ubicacion y Exportar'}
          </button>
        </form>

        <form onSubmit={handleRestoreBackup} className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-sm font-bold mb-3">Restaurar Respaldo</h3>
          <button
            type="button"
            onClick={handleSelectRestoreFile}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm mb-3 transition-colors ${
              restoreFile ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : darkMode ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="truncate">{restoreFile ? restoreFile.split(/[/\\]/).pop() : 'Seleccionar archivo...'}</span>
          </button>
          <div className="relative mb-3">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={restorePassword}
              onChange={e => setRestorePassword(e.target.value)}
              placeholder="Contrasena del respaldo"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            />
          </div>
          <button
            type="submit"
            disabled={isRestoring || !restoreFile}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isRestoring ? 'Restaurando...' : 'Restaurar Ahora'}
          </button>
        </form>
      </div>
    </div>
  );
}
