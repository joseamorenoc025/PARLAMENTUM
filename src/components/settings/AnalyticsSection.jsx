import React, { useState, useEffect } from 'react';
import { Activity, Save, RefreshCw } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function AnalyticsSection({ darkMode, addToast, config, setConfig }) {
  const [analyticsStatus, setAnalyticsStatus] = useState({ enabled: false, anonymousId: '' });
  const [plausibleLink, setPlausibleLink] = useState(config?.plausible_shared_link || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const status = await window.legisAPI.analytics.status();
        setAnalyticsStatus(status);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleToggleAnalytics = async (enabled) => {
    try {
      await window.legisAPI.analytics.setOptIn(enabled);
      setAnalyticsStatus({ ...analyticsStatus, enabled });
      addToast(enabled ? 'Analiticas activadas' : 'Analiticas desactivadas', 'success');
    } catch {
      addToast('Error al cambiar analiticas', 'error');
    }
  };

  const handleSavePlausibleLink = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setConfig({ ...config, plausible_shared_link: plausibleLink });
      addToast('Enlace guardado', 'success');
    } catch {
      addToast('Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Activity} title="Analiticas Anonimas" description="Ayude a mejorar el sistema con datos anonymous" color="amber" darkMode={darkMode} />
          <button
            onClick={() => handleToggleAnalytics(!analyticsStatus.enabled)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${analyticsStatus.enabled ? 'bg-amber-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
          >
            <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${analyticsStatus.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {analyticsStatus.enabled && analyticsStatus.anonymousId && (
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: {analyticsStatus.anonymousId}</p>
        )}
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
        <SectionHeader icon={Activity} title="Panel de Analiticas del Portal Ciudadano" description="Enlace de Plausible para monitorear el portal" color="emerald" darkMode={darkMode} />
        <form onSubmit={handleSavePlausibleLink} className="flex gap-3">
          <input
            type="url"
            value={plausibleLink}
            onChange={e => setPlausibleLink(e.target.value)}
            placeholder="https://plausible.io/share/..."
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
          />
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
