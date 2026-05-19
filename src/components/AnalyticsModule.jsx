import React from 'react';
import { BarChart3, ExternalLink, Settings, Shield, Info } from 'lucide-react';

export default function AnalyticsModule({ config = {}, darkMode, addToast, setCurrentPage }) {
  const sharedLink = config.plausible_shared_link || '';

  const getIframeUrl = () => {
    if (!sharedLink) return '';
    try {
      const url = new URL(sharedLink);
      url.searchParams.set('theme', darkMode ? 'dark' : 'light');
      url.searchParams.set('embed', 'true');
      return url.toString();
    } catch (e) {
      // Fallback simple string concatenation
      const separator = sharedLink.includes('?') ? '&' : '?';
      return `${sharedLink}${separator}theme=${darkMode ? 'dark' : 'light'}&embed=true`;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Impacto y Analíticas</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Monitoreo del impacto, descargas y participación ciudadana del portal de transparencia.
            </p>
          </div>
        </div>
      </div>

      {sharedLink ? (
        <div className={`flex-1 min-h-[600px] h-[calc(100vh-200px)] rounded-2xl border overflow-hidden shadow-md ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <iframe
            src={getIframeUrl()}
            className="w-full h-full border-none"
            loading="lazy"
            title="Plausible Analytics Dashboard"
            allow="fullscreen"
          />
        </div>
      ) : (
        <div className={`p-8 rounded-3xl border text-center max-w-2xl mx-auto my-8 ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } shadow-xl animate-[scale-in_0.4s_ease-out]`}>
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Monitorea la Participación Ciudadana</h3>
          <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Obtén métricas en tiempo real sobre descargas de leyes, proyectos consultados y tráfico general 
            sin comprometer la privacidad de los ciudadanos (cumplimiento estricto de GDPR/LOPD).
          </p>

          <div className="text-left space-y-4 mb-8 bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> Pasos para Configurar
            </h4>
            
            <div className="space-y-3 text-xs">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex-shrink-0">1</span>
                <div>
                  <p className="font-semibold">Registra tu dominio</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Crea una cuenta en <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline inline-flex items-center gap-0.5">plausible.io <ExternalLink className="w-3 h-3" /></a> y registra el dominio del portal.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex-shrink-0">2</span>
                <div>
                  <p className="font-semibold">Genera un Shared Link</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>En los ajustes de Plausible del sitio, ve a <b>Visibility</b>, activa los enlaces compartidos y copia la URL generada.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex-shrink-0">3</span>
                <div>
                  <p className="font-semibold">Guarda el enlace en PARLAMENTUM</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Pega el enlace en los ajustes de configuración para que esté disponible aquí.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('sincronizacion')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all mx-auto shadow-lg shadow-indigo-500/20"
          >
            <Settings className="w-4 h-4" />
            Configurar Ahora
          </button>
        </div>
      )}
    </div>
  );
}
