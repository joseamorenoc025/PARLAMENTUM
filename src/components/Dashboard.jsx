import React, { useMemo } from 'react';
import { 
  CalendarDays, FileText, Scale, BarChart3, AlertTriangle, Check 
} from 'lucide-react';
import StatCard from './ui/StatCard';
import { getDaysSince } from '../utils/helpers';

const Dashboard = ({ sessions, oficios, projects, laws = [], legislators, darkMode, onNavigate }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthSessions = useMemo(() => sessions.filter(s => {
    if (!s.activo) return false;
    const d = new Date(s.fecha + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [sessions, currentMonth, currentYear]);

  const ytdSessions = useMemo(() => sessions.filter(s => {
    if (!s.activo) return false;
    return new Date(s.fecha + 'T12:00:00').getFullYear() === currentYear;
  }), [sessions, currentYear]);

  const monthOficios = useMemo(() => oficios.filter(o => {
    if (!o.activo) return false;
    const d = new Date(o.fecha + 'T12:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [oficios, currentMonth, currentYear]);

  const ytdOficios = useMemo(() => oficios.filter(o => {
    if (!o.activo) return false;
    return new Date(o.fecha + 'T12:00:00').getFullYear() === currentYear;
  }), [oficios, currentYear]);

  const libraryLawsCount = useMemo(() => laws.filter(l => l.activo).length, [laws]);
  const activeProjects = useMemo(() => projects.filter(p => p.activo && p.faseActual !== 'Sancionada'), [projects]);

  const sessionTypeBreakdown = useMemo(() => {
    const counts = {};
    monthSessions.forEach(s => { counts[s.tipo] = (counts[s.tipo] || 0) + 1; });
    return counts;
  }, [monthSessions]);

  const stalledProjects = useMemo(() => projects.filter(p => {
    if (!p.activo || p.faseActual === 'Sancionada') return false;
    return getDaysSince(p.fechaActualizacion) > 30;
  }), [projects]);

  const alertProjects = useMemo(() => projects.filter(p => {
    if (!p.activo || p.faseActual === 'Sancionada') return false;
    const days = getDaysSince(p.fechaActualizacion);
    return days >= 15 && days <= 30;
  }), [projects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Resumen del mes de {now.toLocaleDateString('es-ES', { month: 'long' })} {currentYear}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard darkMode={darkMode} icon={<CalendarDays className="w-5 h-5" />} label="Sesiones del Mes" value={monthSessions.length} color="blue" />
        <StatCard darkMode={darkMode} icon={<FileText className="w-5 h-5" />} label="Oficios del Mes" value={monthOficios.length} color="purple" />
        <StatCard darkMode={darkMode} icon={<Scale className="w-5 h-5" />} label="Leyes en Biblioteca" value={libraryLawsCount} color="emerald" />
        <StatCard darkMode={darkMode} icon={<BarChart3 className="w-5 h-5" />} label="Proyectos Activos" value={activeProjects.length} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="font-semibold mb-4">Sesiones del Mes por Tipo</h3>
          <div className="space-y-3">
            {Object.entries(sessionTypeBreakdown).map(([tipo, count]) => (
              <div key={tipo} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tipo === 'Ordinaria' ? 'bg-blue-500' : tipo === 'Extraordinaria' ? 'bg-purple-500' : tipo === 'Especial' ? 'bg-amber-500' : 'bg-gray-500'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tipo}</span>
                </div>
                <span className="font-semibold text-sm">{count}</span>
              </div>
            ))}
            {Object.keys(sessionTypeBreakdown).length === 0 && (
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin sesiones este mes</p>
            )}
          </div>
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>YTD: {ytdSessions.length} sesiones | {ytdOficios.length} oficios</p>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Semáforo de Proyectos
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stalledProjects.map(p => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'border-red-500/20 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                <div className="min-w-0 flex-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate?.('proyecto', p.id); }}
                    className="text-left w-full"
                  >
                    <p className="text-sm font-medium truncate hover:underline">{p.titulo}</p>
                    <p className="text-xs text-red-400">{getDaysSince(p.fechaActualizacion)} días sin actividad</p>
                  </button>
                </div>
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 ml-2" />
              </div>
            ))}
            {alertProjects.map(p => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                <div className="min-w-0 flex-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate?.('proyecto', p.id); }}
                    className="text-left w-full"
                  >
                    <p className="text-sm font-medium truncate hover:underline">{p.titulo}</p>
                    <p className="text-xs text-amber-400">{getDaysSince(p.fechaActualizacion)} días sin actividad</p>
                  </button>
                </div>
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 ml-2" />
              </div>
            ))}
            {stalledProjects.length === 0 && alertProjects.length === 0 && (
              <div className="text-center py-8">
                <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Todos los proyectos están activos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="font-semibold mb-4">Legisladores Registrados</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {legislators.filter(l => l.activo).map(l => (
            <div key={l.id} className={`p-3 rounded-xl border text-center ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {l.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <p className="text-xs font-medium truncate">{l.nombre}</p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>{l.partidoPolitico}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
