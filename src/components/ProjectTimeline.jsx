import React, { useState, useEffect } from 'react';
import { 
  History, User, Calendar, MessageSquare, 
  ArrowLeft, CheckCircle2, Layout 
} from 'lucide-react';
import { dbService } from '../services/db';

const ProjectTimeline = ({ project, darkMode, onBack }) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const data = await dbService.getProjectVersions(project.id);
        setVersions(data);
      } catch (err) {
        console.error('Error loading versions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadVersions();
  }, [project.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{project.titulo}</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Historial de versiones y cambios de fase</p>
        </div>
      </div>

      <div className="relative">
        {/* Línea central */}
        <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />

        <div className="space-y-8 relative">
          {versions.map((v, idx) => (
            <div key={v.id} className="flex gap-6 items-start">
              <div className={`z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-4 ${darkMode ? 'bg-gray-900 border-gray-950' : 'bg-white border-gray-50'} ${idx === 0 ? 'text-indigo-500' : 'text-gray-400'}`}>
                {idx === 0 ? <CheckCircle2 className="w-5 h-5" /> : <History className="w-4 h-4" />}
              </div>
              
              <div className={`flex-1 p-5 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {v.versionLabel}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(v.fechaCreacion).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {v.autor || 'Sistema'}</span>
                  </div>
                </div>
                
                {v.mensaje && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl mb-3 text-sm ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" />
                    <p>{v.mensaje}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">Snapshot guardado automáticamente</span>
                </div>
              </div>
            </div>
          ))}

          {versions.length === 0 && !isLoading && (
            <div className="ml-12 py-8">
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No hay versiones registradas para este proyecto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
