import React, { useState, useMemo } from 'react';
import { 
  Shield, Clock, User, Activity, Search, 
  ChevronLeft, ChevronRight, Hash, AlertCircle
} from 'lucide-react';

const AuditModule = ({ auditLogs, darkMode }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 15;

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      log.userId.toLowerCase().includes(search.toLowerCase())
    );
  }, [auditLogs, search]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const getActionColor = (action) => {
    if (action.startsWith('CREATE')) return 'text-emerald-500 bg-emerald-500/10';
    if (action.startsWith('UPDATE')) return 'text-amber-500 bg-amber-500/10';
    if (action.startsWith('DELETE')) return 'text-red-500 bg-red-500/10';
    return 'text-blue-500 bg-blue-500/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Auditoría del Sistema</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Registros inmutables de todas las acciones críticas</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
          <Shield className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Hash Chain Activo</span>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por acción, entidad o usuario..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={`border-b ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
                <th className="px-6 py-4 font-semibold">Entidad</th>
                <th className="px-6 py-4 font-semibold">Firma (Hash)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentLogs.map(log => (
                <tr key={log.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">{log.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{log.entityType}</span>
                      <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: {log.entityId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[150px]">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400" title={log.signature}>
                      <Hash className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{log.signature.substring(7, 27)}...</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No se encontraron registros de auditoría</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Mostrando {currentLogs.length} de {filteredLogs.length} registros
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg border ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} disabled:opacity-30`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg border ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} disabled:opacity-30`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditModule;
