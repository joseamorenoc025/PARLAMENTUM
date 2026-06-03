import React, { useState } from 'react';
import { GitBranch, Save, RefreshCw, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function GitHubSyncSection({ darkMode, addToast, queueStats }) {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(null);
  const [repoConfig, setRepoConfig] = useState({ owner: '', repo: '', branch: 'gh-pages' });
  const [isValidating, setIsValidating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const exists = await window.legisAPI.sync.github.hasToken();
        setHasToken(exists);
        if (exists) {
          const cfg = await window.legisAPI.sync.github.getRepo();
          if (cfg) setRepoConfig(cfg);
          const result = await window.legisAPI.sync.github.validate();
          setSyncStatus(result);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setIsSaving(true);
    try {
      await window.legisAPI.sync.github.saveToken(token);
      setHasToken(true);
      setToken('');
      addToast('Token guardado correctamente', 'success');
    } catch (err) {
      addToast('Error al guardar token', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRepo = async (e) => {
    e.preventDefault();
    if (!repoConfig.owner || !repoConfig.repo) return;
    setIsSaving(true);
    try {
      await window.legisAPI.sync.github.setRepo(repoConfig);
      addToast('Repositorio actualizado', 'success');
    } catch {
      addToast('Error al guardar repositorio', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = async () => {
    try {
      await window.legisAPI.sync.github.clear();
      setHasToken(false);
      setSyncStatus(null);
      setRepoConfig({ owner: '', repo: '', branch: 'gh-pages' });
      addToast('Token eliminado', 'success');
    } catch {
      addToast('Error al eliminar token', 'error');
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await window.legisAPI.sync.github.validate();
      setSyncStatus(result);
    } catch {
      setSyncStatus({ success: false, error: 'Error de conexion' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await window.legisAPI.sync.github.force();
      addToast('Sincronizacion completada', 'success');
    } catch {
      addToast('Error en la sincronizacion', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
      <SectionHeader icon={GitBranch} title="Sincronizacion con GitHub" description="Configure la conexion con su repositorio" color="indigo" darkMode={darkMode} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {!hasToken ? (
            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>GitHub Personal Access Token</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Guardando...' : 'Guardar Token'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">Token configurado</span>
              </div>
              <form onSubmit={handleSaveRepo} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={repoConfig.owner}
                    onChange={e => setRepoConfig({ ...repoConfig, owner: e.target.value })}
                    placeholder="Owner"
                    className={`px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  />
                  <input
                    type="text"
                    value={repoConfig.repo}
                    onChange={e => setRepoConfig({ ...repoConfig, repo: e.target.value })}
                    placeholder="Repo"
                    className={`px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  />
                  <input
                    type="text"
                    value={repoConfig.branch}
                    onChange={e => setRepoConfig({ ...repoConfig, branch: e.target.value })}
                    placeholder="Branch (ej: gh-pages)"
                    className={`px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Actualizar Repositorio
                </button>
              </form>
              <button
                onClick={handleClearToken}
                className="w-full py-2 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Eliminar token
              </button>
            </div>
          )}
        </div>

        <div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-xs font-semibold mb-3 uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estado de Conexion</p>
            {isValidating ? (
              <div className="flex items-center gap-2 text-indigo-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Validando...</span>
              </div>
            ) : syncStatus?.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">@{syncStatus.user}</span>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Metadata Ahora'}
                </button>
              </div>
            ) : syncStatus?.error ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{syncStatus.error}</span>
                </div>
                <button onClick={handleValidate} className="text-xs text-indigo-500 hover:text-indigo-600">Reintentar</button>
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin configuracion activa</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Pendientes', value: queueStats.pending, color: 'amber', icon: GitBranch },
          { label: 'Fallidos', value: queueStats.failed, color: 'red', icon: AlertCircle },
          { label: 'Publicados', value: queueStats.synced, color: 'emerald', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <Icon className={`w-5 h-5 mx-auto mb-1 text-${color}-500`} />
            <p className="text-2xl font-black">{value}</p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
