import React, { useState, useEffect, useMemo } from 'react';
import { 
  Github, Save, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, ExternalLink, Shield, CloudOff,
  Database, Download, Upload, Lock, FileJson,
  Activity, Cloud, CloudUpload, CloudDownload,
  FolderOpen, FileText, CalendarDays, Scale, Search, Filter, Gavel
} from 'lucide-react';
import EmptyState from './ui/EmptyState';

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
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'files'
  
  // Settings Tab State
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [repoConfig, setRepoConfig] = useState({ owner: '', repo: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, synced: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [analyticsStatus, setAnalyticsStatus] = useState({ enabled: false, anonymousId: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  // Backup State
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  // Files Tab State
  const [fileSearch, setFileSearch] = useState('');
  const [fileFilterType, setFileFilterType] = useState('');

  useEffect(() => {
    checkToken();
    loadRepoConfig();
    loadQueueStats();
    loadAnalyticsStatus();
    const interval = setInterval(loadQueueStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsStatus = async () => {
    try {
      const status = await window.legisAPI.analytics.status();
      setAnalyticsStatus(status);
    } catch (err) {
      console.error('Error loading analytics status:', err);
    }
  };

  const handleExportBackup = async (e) => {
    e.preventDefault();
    if (!backupPassword || backupPassword.length < 8) {
      addToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    setIsProcessingBackup(true);
    try {
      const result = await window.legisAPI.db.exportBackup(backupPassword);
      if (result.success) {
        addToast(`Copia de seguridad exportada: ${result.path}`, 'success');
        setBackupPassword('');
      } else if (result.error !== 'CANCELED') {
        addToast('Error al exportar backup', 'error');
      }
    } catch (err) {
      addToast('Error crítico al exportar', 'error');
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleSelectRestoreFile = async () => {
    const filePath = await window.legisAPI.dialog.openBackup();
    if (filePath) setRestoreFile(filePath);
  };

  const handleRestoreBackup = async (e) => {
    e.preventDefault();
    if (!restoreFile || !restorePassword) return;

    if (!window.confirm('¡ATENCIÓN! Al restaurar se reemplazará TODA la base de datos actual. Esta acción no se puede deshacer de forma sencilla. ¿Deseas continuar?')) {
      return;
    }

    setIsProcessingBackup(true);
    try {
      const result = await window.legisAPI.db.restoreBackup(restoreFile, restorePassword);
      if (result.success) {
        addToast('Base de datos restaurada con éxito. La aplicación se reiniciará.', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const errors = {
          'INVALID_CREDENTIALS': 'Contraseña incorrecta o archivo dañado.',
          'INVALID_FILE_TYPE': 'El archivo seleccionado no es un backup válido.',
          'FILE_NOT_FOUND': 'No se pudo encontrar el archivo seleccionado.',
          'CORRUPTED_FILE': 'El archivo de backup está dañado.'
        };
        addToast(errors[result.error] || 'Error al restaurar el backup', 'error');
      }
    } catch (err) {
      addToast('Error crítico al restaurar', 'error');
    } finally {
      setIsProcessingBackup(false);
    }
  };

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

  const loadRepoConfig = async () => {
    try {
      const config = await window.legisAPI.sync.github.getRepo();
      setRepoConfig(config);
      if (config.owner) setShowForm(true);
    } catch (err) {
      console.error('Error loading repo config:', err);
    }
  };

  const checkToken = async () => {
    const exists = await window.legisAPI.sync.github.hasToken();
    setHasToken(exists);
    if (exists) {
      validateConnection();
      setShowForm(true);
    }
  };

  const validateConnection = async () => {
    setIsValidating(true);
    try {
      const result = await window.legisAPI.sync.github.validate();
      setSyncStatus(result);
    } catch (err) {
      setSyncStatus({ success: false, error: 'Error de comunicación con el sistema.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    try {
      const success = await window.legisAPI.sync.github.saveToken(token);
      if (success) {
        addToast('Token de GitHub guardado correctamente', 'success');
        setHasToken(true);
        setToken('');
        validateConnection();
      }
    } catch (err) {
      addToast('Error al guardar el token', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRepo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await window.legisAPI.sync.github.setRepo(repoConfig);
      addToast('Repositorio actualizado', 'success');
    } catch (err) {
      addToast('Error al actualizar repositorio', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar el token de GitHub? La sincronización dejará de funcionar.')) {
      await window.legisAPI.sync.github.clear();
      setHasToken(false);
      setSyncStatus(null);
      addToast('Token eliminado', 'info');
    }
  };

  const handleCloudUpload = async () => {
    const password = document.getElementById('backup-password-input')?.value;
    if (!password) {
      addToast('Ingresa la contraseña del backup para cifrar la subida.', 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await window.legisAPI.invoke('backup:cloud:upload', password);
      if (result.success) {
        addToast('Respaldo subido a la nube correctamente', 'success');
      }
    } catch (err) {
      addToast('Error al subir a la nube', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudDownload = async () => {
    const password = document.getElementById('backup-password-input')?.value;
    if (!password) {
      addToast('Ingresa la contraseña del backup para descifrar la descarga.', 'warning');
      return;
    }

    if (!window.confirm('Esto reemplazará todos tus datos locales con la versión de la nube. ¿Continuar?')) return;

    setIsSyncing(true);
    try {
      const result = await window.legisAPI.invoke('backup:cloud:download', password);
      if (result.success) {
        addToast(result.message, 'success');
      }
    } catch (err) {
      addToast('Error al descargar de la nube', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAnalytics = async () => {
    try {
      const newEnabled = !analyticsStatus.enabled;
      const result = await window.legisAPI.analytics.setOptIn(newEnabled);
      setAnalyticsStatus(prev => ({ ...prev, enabled: result.enabled }));
      addToast(result.enabled ? 'Analíticas activadas (Privacidad respetada)' : 'Analíticas desactivadas', 'info');
    } catch (err) {
      addToast('Error al cambiar configuración de privacidad', 'error');
    }
  };

  const handleForceSync = async () => {
    setIsValidating(true);
    try {
      const result = await window.legisAPI.sync.github.force();
      if (result.success) {
        addToast(result.message, 'success');
        loadQueueStats();
      } else {
        addToast(result.error, 'error');
      }
    } catch (err) {
      addToast('Error en la sincronización forzada', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // Helper de Bóveda: Obtener nombre de la entidad vinculada
  const getEntityName = (doc) => {
    if (doc.entidadTipo === 'Sesion') {
      const s = sessions.find(s => s.id === doc.entidadId);
      return s ? `${s.numeroCorrelativo || s.tipo} (${s.fecha})` : 'Sesión no encontrada';
    }
    if (doc.entidadTipo === 'Oficio') {
      const o = oficios.find(o => o.id === doc.entidadId);
      return o ? o.numeroOficio : 'Oficio no encontrado';
    }
    if (doc.entidadTipo === 'ProyectoLey' || doc.entidadTipo === 'Project') {
      const p = projects.find(p => p.id === doc.entidadId);
      return p ? p.titulo : 'Proyecto no encontrado';
    }
    if (doc.entidadTipo === 'Agreement') {
      const a = agreements.find(a => a.id === doc.entidadId);
      return a ? `${a.numeroCorrelativo} - ${a.objeto ? (a.objeto.substring(0, 30) + '...') : ''}` : 'Acuerdo de Cámara no encontrado';
    }
    if (doc.entidadTipo === 'Law') {
      const l = laws.find(l => l.id === doc.entidadId);
      return l ? l.titulo : 'Ley no encontrada';
    }
    return 'Documento Huérfano';
  };

  const typeIcons = { 
    Sesion: <CalendarDays className="w-4 h-4" />, 
    Oficio: <FileText className="w-4 h-4" />, 
    ProyectoLey: <Scale className="w-4 h-4" />,
    Project: <Scale className="w-4 h-4" />,
    Agreement: <Gavel className="w-4 h-4" />,
    Law: <Scale className="w-4 h-4" />
  };
  const typeColors = { 
    Sesion: 'text-blue-500 bg-blue-500/10', 
    Oficio: 'text-purple-500 bg-purple-500/10', 
    ProyectoLey: 'text-emerald-500 bg-emerald-500/10',
    Project: 'text-emerald-500 bg-emerald-500/10',
    Agreement: 'text-amber-500 bg-amber-500/10',
    Law: 'text-indigo-500 bg-indigo-500/10'
  };

  // Filtrado de documentos de Bóveda
  const filteredDocs = useMemo(() => {
    let docs = (documents || []).filter(d => d.activo);

    if (fileFilterType) {
      docs = docs.filter(d => d.entidadTipo === fileFilterType);
    }

    if (fileSearch.trim()) {
      const q = fileSearch.toLowerCase();
      docs = docs.filter(d => 
        d.nombreOriginal.toLowerCase().includes(q) ||
        getEntityName(d).toLowerCase().includes(q) ||
        (d.faseEtiqueta || '').toLowerCase().includes(q)
      );
    }

    return docs;
  }, [documents, fileFilterType, fileSearch, sessions, oficios, projects]);

  const handleDeleteFile = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo permanentemente de la bóveda del sistema?')) return;
    try {
      await onDeleteDocument?.(id);
      addToast('Archivo eliminado del sistema', 'warning');
    } catch {
      addToast('Error al eliminar archivo', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Selector de Pestañas Principal */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit mb-4">
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'settings' 
              ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          🛠️ Ajustes del Sistema
        </button>
        <button 
          onClick={() => setActiveTab('files')} 
          className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'files' 
              ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-500' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          📂 Archivos del Sistema
        </button>
      </div>

      {/* Pestaña: AJUSTES */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* GitHub Sync Section */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sincronización con GitHub</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configura la publicación automática de leyes al portal ciudadano.</p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Configuración */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    Credenciales de Acceso
                  </h3>
                  
                  {!hasToken ? (
                    <form onSubmit={handleSaveToken} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black opacity-40 uppercase tracking-widest">Personal Access Token (PAT)</label>
                        <input
                          type="password"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none text-sm ${
                            darkMode ? 'bg-gray-800 border-gray-700 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'
                          }`}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Guardando...' : 'Guardar Token'}
                      </button>
                    </form>
                  ) : (
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-600">Token Configurado</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Encriptación activa en este equipo.</p>
                        </div>
                        <button onClick={handleClearToken} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-800/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Github className="w-4 h-4 text-indigo-500" />
                    Repositorio Destino
                  </h3>
                  <form onSubmit={handleSaveRepo} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Usuario</label>
                        <input
                          type="text"
                          value={repoConfig.owner}
                          onChange={(e) => setRepoConfig({ ...repoConfig, owner: e.target.value })}
                          className={`w-full px-3 py-1.5 rounded-lg border text-sm outline-none ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Repo</label>
                        <input
                          type="text"
                          value={repoConfig.repo}
                          onChange={(e) => setRepoConfig({ ...repoConfig, repo: e.target.value })}
                          className={`w-full px-3 py-1.5 rounded-lg border text-sm outline-none ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                    <button type="submit" className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      Actualizar Repositorio
                    </button>
                  </form>
                </div>
              </div>

              {/* Estado de la Conexión */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-indigo-500 ${isValidating ? 'animate-spin' : ''}`} />
                  Conectividad API
                </h3>

                <div className={`h-full p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'} flex flex-col justify-center`}>
                  {isValidating ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-500">Verificando...</p>
                    </div>
                  ) : syncStatus ? (
                    <div className="space-y-4 text-center py-4">
                      {syncStatus.success ? (
                        <>
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500 mb-2">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium">Conectado como <b>@{syncStatus.user}</b></p>
                          <button 
                            onClick={handleForceSync}
                            className="text-xs px-4 py-2 rounded-lg font-bold transition-all bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Sincronizar Metadata Ahora
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-2">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium text-red-500">Error de API</p>
                          <button onClick={validateConnection} className="mt-2 text-xs text-indigo-500 hover:underline">Reintentar</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 opacity-50"><p className="text-xs">Sin configuración activa</p></div>
                  )}
                </div>
              </div>
            </div>

            {/* Estado de la Cola */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-800/50 pt-8">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'} flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <RefreshCw className={`w-5 h-5 ${queueStats.pending > 0 ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Pendientes</p>
                  <p className="text-xl font-bold">{queueStats.pending}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'} flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Fallidos</p>
                  <p className="text-xl font-bold">{queueStats.failed}</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'} flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Publicados</p>
                  <p className="text-xl font-bold">{queueStats.synced}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Local Backups Section */}
          <div className="flex items-center gap-3 mt-12 mb-2">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Respaldo y Restauración Local</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exporta tus datos a un archivo seguro o restaura una copia previa.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exportar */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="flex items-center gap-2 mb-6 text-emerald-500 font-bold">
                <Download className="w-5 h-5" />
                <h3>Exportar Datos</h3>
              </div>
              <p className={`text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Crea una copia de seguridad encriptada. Podrás elegir dónde guardarla (ej. un USB).
              </p>
              <form onSubmit={handleExportBackup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Contraseña del Backup</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      id="backup-password-input"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all outline-none text-sm ${
                        darkMode ? 'bg-gray-800 border-gray-700 focus:border-emerald-500' : 'bg-gray-50 border-gray-200 focus:border-emerald-500'
                      }`}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessingBackup}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  {isProcessingBackup ? 'Procesando...' : 'Elegir Ubicación y Exportar'}
                </button>
              </form>
            </div>

            {/* Restaurar */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
              <div className="flex items-center gap-2 mb-6 text-amber-500 font-bold">
                <Upload className="w-5 h-5" />
                <h3>Restaurar Backup</h3>
              </div>
              <p className={`text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Selecciona un archivo <b>.clbak</b> o <b>.enc</b> para restaurar el sistema.
              </p>
              <form onSubmit={handleRestoreBackup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Archivo de Backup</label>
                  <button
                    type="button"
                    onClick={handleSelectRestoreFile}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      restoreFile 
                        ? (darkMode ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600')
                        : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    <span className="truncate">{restoreFile ? restoreFile.split(/[\\/]/).pop() : 'Seleccionar archivo...'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Contraseña del Backup</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      placeholder="Contraseña usada al exportar"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all outline-none text-sm ${
                        darkMode ? 'bg-gray-800 border-gray-700 focus:border-amber-500' : 'bg-gray-50 border-gray-200 focus:border-amber-500'
                      }`}
                      disabled={!restoreFile}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessingBackup || !restoreFile}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessingBackup ? 'animate-spin' : ''}`} />
                  {isProcessingBackup ? 'Restaurando...' : 'Restaurar Ahora'}
                </button>
              </form>
            </div>
          </div>

          {/* Cloud Sync Section */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm mt-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">GitHub Cloud Sync (Oficina-Casa)</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Sincroniza tu base de datos cifrada para trabajar desde diferentes lugares de forma segura.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <p className="text-xs text-indigo-500 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Cifrado AES-256 activo: Tus datos están protegidos por tu contraseña de backup antes de salir de este equipo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleCloudUpload}
                disabled={isSyncing}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-gray-50 border-gray-200 hover:border-indigo-500'
                }`}
              >
                <CloudUpload className={`w-8 h-8 mb-2 ${isSyncing ? 'animate-bounce text-indigo-500' : 'text-gray-400'}`} />
                <span className="font-bold">Subir a la Nube</span>
                <span className="text-[10px] text-gray-500">Enviar sesión actual</span>
              </button>

              <button
                onClick={handleCloudDownload}
                disabled={isSyncing}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${
                  darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-gray-50 border-gray-200 hover:border-indigo-500'
                }`}
              >
                <CloudDownload className={`w-8 h-8 mb-2 ${isSyncing ? 'animate-bounce text-indigo-500' : 'text-gray-400'}`} />
                <span className="font-bold">Descargar de la Nube</span>
                <span className="text-[10px] text-gray-500">Recuperar última sesión</span>
              </button>
            </div>
          </div>

          {/* Analytics Section */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm mt-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Analíticas Anónimas</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ayúdanos a mejorar el sistema enviando métricas técnicas anónimas (uso de CPU, errores, frecuencia de uso).
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAnalytics}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  analyticsStatus.enabled ? 'bg-indigo-600' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    analyticsStatus.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {analyticsStatus.enabled && (
              <div className={`mt-4 p-3 rounded-xl text-[10px] font-mono ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                ID Anónimo: {analyticsStatus.anonymousId}
              </div>
            )}
          </div>

          {/* Portal Analytics Link Section */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm mt-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Panel de Analíticas del Portal Ciudadano</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ingresa el enlace compartido (Shared Link) de Plausible para monitorear el portal desde la pestaña de analíticas.
                </p>
              </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.plausibleLink.value.trim();
              setConfig({ plausible_shared_link: val });
              addToast('Shared Link de Plausible guardado con éxito', 'success');
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">Shared Link de Plausible</label>
                <input
                  type="text"
                  name="plausibleLink"
                  defaultValue={config?.plausible_shared_link || ''}
                  placeholder="https://plausible.io/share/parlamentum.legislativo.com?auth=..."
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none text-sm ${
                    darkMode ? 'bg-gray-800 border-gray-700 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors text-xs"
              >
                <Save className="w-4 h-4" />
                Guardar Enlace
              </button>
            </form>
          </div>

          {/* Footer Info */}
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} mt-6`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Resiliencia Offline</h4>
            <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Si no hay conexión, los cambios se guardarán en la cola de <b>Pendientes</b> y se reintentarán automáticamente 
              cada 60 segundos con backoff exponencial. El sistema es totalmente autónomo.
            </p>
          </div>
        </div>
      )}

      {/* Pestaña: ARCHIVOS (Bóveda Reconvertida) */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          {/* Header Bóveda */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Archivos del Sistema (Bóveda)</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Vista de solo lectura del histórico de archivos locales vinculados a expedientes, actas y oficios.
              </p>
            </div>
          </div>

          {/* Filtros de Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar archivos por nombre o entidad..." 
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 shadow-sm'
                }`}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={fileFilterType}
                onChange={e => setFileFilterType(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none ${
                  darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <option value="">Todos los Orígenes</option>
                <option value="Sesion">Sesiones</option>
                <option value="Oficio">Oficios</option>
                <option value="ProyectoLey">Proyectos (Old)</option>
                <option value="Project">Proyectos de Ley</option>
                <option value="Agreement">Acuerdos de Cámara</option>
                <option value="Law">Biblioteca de Leyes</option>
              </select>
            </div>
          </div>

          {/* Listado de Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                className={`group rounded-2xl border p-5 transition-all hover:border-indigo-500/30 ${
                  darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${typeColors[doc.entidadTipo] || 'text-gray-500 bg-gray-500/10'}`}>
                      {typeIcons[doc.entidadTipo] || <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{doc.nombreOriginal}</p>
                      <p className={`text-[9px] mt-0.5 font-black uppercase tracking-wider opacity-40`}>
                        {doc.entidadTipo}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFile(doc.id)} 
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar archivo huérfano"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className={`mt-4 p-3 rounded-xl border ${
                  darkMode ? 'bg-gray-950/40 border-gray-800/80' : 'bg-gray-50 border-gray-100'
                }`}>
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Vinculado a:</p>
                  <p className="text-xs font-bold truncate leading-tight mb-2">
                    {getEntityName(doc)}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t dark:border-gray-800/50 border-gray-100">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                      darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {doc.faseEtiqueta || 'Adjunto'}
                    </span>
                    <span className="text-[10px] font-mono opacity-40">
                      {(doc.tamanoBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {doc.contenidoBase64 && (
                    <a 
                      href={doc.contenidoBase64} 
                      download={doc.nombreOriginal} 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-xs font-bold ${
                        darkMode ? 'bg-gray-800 hover:bg-indigo-600 hover:text-white' : 'bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-700'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500 group-hover:text-white" /> Descargar
                    </a>
                  )}
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl opacity-50">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold opacity-30">No se encontraron archivos en el sistema</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
