import React, { useState, useEffect } from 'react';
import { Github, Save, RefreshCw, Trash2, CheckCircle2, AlertCircle, ExternalLink, Shield, CloudOff } from 'lucide-react';
import EmptyState from './ui/EmptyState';

export default function SyncSettings({ darkMode, addToast }) {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [repoConfig, setRepoConfig] = useState({ owner: '', repo: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // { success, user, error }
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0, synced: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    checkToken();
    loadRepoConfig();
    loadQueueStats();
    const interval = setInterval(loadQueueStats, 10000); // Actualizar cada 10s
    return () => clearInterval(interval);
  }, []);

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

  if (!hasToken && !repoConfig.owner && !showForm) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sincronización con GitHub</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configura la publicación automática de leyes al portal ciudadano.</p>
          </div>
        </div>
        <EmptyState 
          icon={CloudOff}
          title="Sincronización pendiente"
          description="Configure su repositorio para publicar el portal de leyes. Los cambios se mantendrán locales hasta conectar."
          action={{
            label: "Configurar sincronización",
            onClick: () => setShowForm(true)
          }}
          dataTestId="empty-state-sync"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                    <label className="text-sm font-medium">Personal Access Token (PAT)</label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className={`w-full px-4 py-2 rounded-xl border transition-all outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'
                      }`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
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
                        className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${
                          darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
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

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Resiliencia Offline</h4>
        <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Si no hay conexión, los cambios se guardarán en la cola de <b>Pendientes</b> y se reintentarán automáticamente 
          cada 60 segundos con backoff exponencial. El sistema es totalmente autónomo.
        </p>
      </div>
    </div>
  );
}
