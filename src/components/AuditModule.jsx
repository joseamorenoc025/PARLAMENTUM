import React, { useState, useMemo } from 'react';
import { 
  Clock, Search, AlertCircle, ChevronLeft, ChevronRight, Hash, 
  Download, PlusCircle, Edit3, Trash2, ShieldCheck, Sparkles, Filter
} from 'lucide-react';

const AuditModule = ({ auditLogs = [], darkMode }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all'); // 'all', 'create', 'update', 'delete'
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Formatear fecha y hora completa: dd/mm/yyyy hh:mm:ss
  const formatFullTimestamp = (isoString) => {
    try {
      const dateObj = new Date(isoString);
      if (isNaN(dateObj.getTime())) return isoString;
      
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return isoString;
    }
  };

  // Mapear etiquetas legibles para las acciones del sistema
  const getActionDetails = (action = '', entityType = '') => {
    const act = action.toLowerCase();
    const ent = (entityType || '').toLowerCase();
    
    let entityLabel = entityType || 'Registro';
    if (ent === 'laws' || ent === 'law') entityLabel = 'Ley Biblioteca';
    else if (ent === 'sessions' || ent === 'session') entityLabel = 'Sesión Legislativa';
    else if (ent === 'oficios' || ent === 'oficio') entityLabel = 'Oficio Saliente';
    else if (ent === 'agreements' || ent === 'agreement') entityLabel = 'Acuerdo de Cámara';
    else if (ent === 'projects' || ent === 'project') entityLabel = 'Proyecto de Ley';
    else if (ent === 'legislators' || ent === 'legislator') entityLabel = 'Legislador';
    else if (ent === 'commissions' || ent === 'commission') entityLabel = 'Comisión';
    else if (ent === 'juntadirectiva') entityLabel = 'Junta Directiva';
    
    if (act.includes('create') || act.includes('add') || act.includes('import')) {
      return {
        label: `Registro de ${entityLabel}`,
        icon: PlusCircle,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        textColor: 'text-emerald-500',
        dotColor: 'bg-emerald-500'
      };
    }
    if (act.includes('update') || act.includes('edit')) {
      return {
        label: `Modificación de ${entityLabel}`,
        icon: Edit3,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        textColor: 'text-amber-500',
        dotColor: 'bg-amber-500'
      };
    }
    if (act.includes('delete') || act.includes('remove')) {
      return {
        label: `Eliminación de ${entityLabel}`,
        icon: Trash2,
        color: 'text-red-500 bg-red-500/10 border-red-500/20',
        textColor: 'text-red-500',
        dotColor: 'bg-red-500'
      };
    }
    return {
      label: action || 'Acción de Sistema',
      icon: Sparkles,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      textColor: 'text-blue-500',
      dotColor: 'bg-blue-500'
    };
  };

  // Filtrado de Logs
  const filteredLogs = useMemo(() => {
    let list = [...auditLogs];

    // Ordenar de más reciente a más antiguo
    list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Filtro por tipo de acción
    if (actionFilter !== 'all') {
      list = list.filter(log => {
        const act = log.action.toLowerCase();
        if (actionFilter === 'create') return act.includes('create') || act.includes('add') || act.includes('import');
        if (actionFilter === 'update') return act.includes('update') || act.includes('edit');
        if (actionFilter === 'delete') return act.includes('delete') || act.includes('remove');
        return true;
      });
    }

    // Filtro de búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(log => 
        log.action.toLowerCase().includes(q) ||
        (log.entityType || '').toLowerCase().includes(q) ||
        (log.changes || '').toLowerCase().includes(q) ||
        (log.signature || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [auditLogs, search, actionFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, currentPage]);

  // Exportar a CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Fecha y Hora (Timestamp)', 'Modulo / Entidad', 'Registro ID', 'Accion', 'Detalles', 'Sello de Integridad (Signature)'];
      const rows = filteredLogs.map(log => [
        log.id,
        formatFullTimestamp(log.timestamp),
        log.entityType || 'Sistema',
        log.entityId || 'N/A',
        log.action,
        log.changes ? log.changes.replace(/"/g, '""') : '',
        log.signature || 'N/A'
      ]);

      const csvContent = "\uFEFF" + [
        headers.join(','),
        ...rows.map(e => e.map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bitacora_actividades_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error al exportar CSV:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Actividad del Sistema</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Bitácora cronológica e inmutable de todas las acciones administrativas del cuerpo legislativo.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              darkMode 
                ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-40' 
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-500" /> Exportar CSV
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            darkMode 
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
              : 'border-emerald-200 bg-emerald-50 text-emerald-600'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sello Criptográfico</span>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buscador */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por acción, entidad, firma o descripción..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 shadow-sm'
            }`}
          />
        </div>
        {/* Filtro de Tipo de Acción */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none ${
              darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <option value="all">Todas las Acciones</option>
            <option value="create">Creación / Registro</option>
            <option value="update">Modificación</option>
            <option value="delete">Eliminación</option>
          </select>
        </div>
      </div>

      {/* Timeline de Actividades */}
      {filteredLogs.length === 0 ? (
        <div className={`rounded-3xl border p-12 text-center flex flex-col items-center justify-center ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <AlertCircle className="w-10 h-10 text-gray-400 opacity-30 mb-3" />
          <p className="text-sm font-bold opacity-30">No se encontraron eventos en la bitácora</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6">
          {/* Línea conectora del timeline */}
          <div className={`absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-0.5 ${
            darkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`} />

          {currentLogs.map(log => {
            const actDetails = getActionDetails(log.action, log.entityType);
            const ActIcon = actDetails.icon;

            return (
              <div key={log.id} className="relative group">
                {/* Icono de Acción / Nodo de timeline */}
                <div className={`absolute -left-[30px] sm:-left-[34px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-4 transition-transform group-hover:scale-110 z-10 ${
                  darkMode ? 'bg-gray-950 border-gray-950' : 'bg-gray-50 border-gray-50'
                }`}>
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${actDetails.color} border`}>
                    <ActIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>

                {/* Tarjeta de Evento */}
                <div className={`rounded-3xl border p-5 sm:p-6 transition-all ${
                  darkMode 
                    ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/25' 
                    : 'bg-white border-gray-200 hover:border-indigo-500/20 shadow-sm hover:shadow-md'
                }`}>
                  {/* Fila superior: Acción y Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 mb-4 dark:border-gray-800 border-gray-100">
                    <div className="min-w-0">
                      <span className={`text-xs font-black uppercase tracking-wider ${actDetails.textColor}`}>
                        {actDetails.label}
                      </span>
                      {log.entityId && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono ${
                          darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          REGISTRO ID: {log.entityId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] opacity-40 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatFullTimestamp(log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Cuerpo: Descripción y detalles del cambio */}
                  {log.changes && (
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed font-medium mb-4 ${
                      darkMode ? 'bg-gray-950/40 text-gray-300' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {log.changes}
                    </div>
                  )}

                  {/* Firma Criptográfica (Sello de integridad) */}
                  {log.signature && (
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border text-[10px] font-mono ${
                      darkMode ? 'bg-gray-950 border-gray-800/80 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Hash className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="truncate" title={log.signature}>
                          Sello de Verificación: {log.signature}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-sans uppercase tracking-widest ${
                        darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        Verificado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t ${
          darkMode ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Mostrando {currentLogs.length} de {filteredLogs.length} eventos registrados
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-xl border transition-all ${
                darkMode 
                  ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 hover:text-white' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900'
              } disabled:opacity-30`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${
              darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white shadow-sm'
            }`}>
              Página {currentPage} de {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-xl border transition-all ${
                darkMode 
                  ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 hover:text-white' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900'
              } disabled:opacity-30`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditModule;
