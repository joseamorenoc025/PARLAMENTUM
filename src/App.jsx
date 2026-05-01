import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLegisData } from './hooks/useLegisData';
import LawsLibrary from './components/LawsLibrary';
import ProjectTimeline from './components/ProjectTimeline';
import AgendaModule from './components/AgendaModule';
import { 
  LayoutDashboard, Users, Calendar, FileText, Scale, FolderOpen, 
  Search, Moon, Sun, ChevronRight, Plus, Trash2, Edit3, 
  AlertTriangle, Check, Clock, ArrowRight, Filter, 
  History,
  Upload, File, BarChart3, ChevronDown,
  ChevronLeft, Bell, Info, Zap,
  CalendarDays, User, Link, RefreshCw, Settings, Hash, Briefcase, Home, Gavel, Building2,
  X 
} from 'lucide-react';

// ============================================================
// UTILIDADES GLOBALES
// ============================================================
const safeJSONParse = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const getDaysSince = (dateStr) => {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getStagnationColor = (dateStr) => {
  const days = getDaysSince(dateStr);
  if (days > 30) return 'text-red-500 bg-red-500/10 border-red-500/20';
  if (days >= 15) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
};

const getStagnationLabel = (dateStr) => {
  const days = getDaysSince(dateStr);
  if (days > 30) return 'Estancado (>30 días)';
  if (days >= 15) return 'Atención (15-30 días)';
  return 'Activo (<15 días)';
};

const getSessionTypeByDate = (dateStr) => {
  if (!dateStr) return 'Ordinaria';
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  if (day === 2 || day === 4) return 'Ordinaria';
  return 'Extraordinaria';
};

const generateSessionNumber = (tipo, year, existingSessions) => {
  if (tipo === 'Especial' || tipo === 'Solemne' || tipo === 'Instalación') return '';
  const yearSessions = existingSessions.filter(s => 
    s.activo &&
    (s.tipo === 'Ordinaria' || s.tipo === 'Extraordinaria') &&
    s.tipo === tipo &&
    s.numero_correlativo &&
    s.numero_correlativo.endsWith(`-${year}`)
  );
  const maxNum = yearSessions.reduce((max, s) => {
    const parts = s.numero_correlativo.split('-');
    const num = parseInt(parts[0], 10);
    return num > max ? num : max;
  }, 0);
  return `${String(maxNum + 1).padStart(3, '0')}-${year}`;
};

const getRoutePhases = (origen) => {
  if (origen === 'Comisión') {
    return ['Estudio en Comisión', 'Informe de Dirección', '1ra Discusión', '2da Discusión', '3ra Discusión', 'Aprobada', 'Sancionada'];
  }
  return ['Entrada al Pleno', 'Estudio en Comisión', '2da Discusión', '3ra Discusión', 'Aprobada', 'Sancionada'];
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// ============================================================
// CONFIGURACIÓN INICIAL
// ============================================================
const defaultConfig = {
  nombre_secretario: '',
  cedula: '',
  periodo_sesiones: '2026-2027',
  fecha_configuracion: new Date().toISOString().split('T')[0],
  setupComplete: false,
  darkMode: true
};

// ============================================================
// SISTEMA DE TOASTS
// ============================================================
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm
          ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30 text-white' : ''}
          ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/30 text-white' : ''}
          ${toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400/30 text-white' : ''}
          ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-400/30 text-white' : ''}`}
        style={{ animation: 'slide-in 0.3s ease-out' }}
      >
        {toast.type === 'success' && <Check className="w-4 h-4" />}
        {toast.type === 'error' && <X className="w-4 h-4" />}
        {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
        {toast.type === 'info' && <Info className="w-4 h-4" />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

// ============================================================
// COMMAND PALETTE
// ============================================================
const CommandPalette = ({ isOpen, onClose, sessions, oficios, projects, legislators, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found = [];
    
    if (sessions) {
      sessions.filter(s => s.activo).forEach(s => {
        if (s.numero_correlativo?.toLowerCase().includes(q) || s.tipo?.toLowerCase().includes(q) || (s.fecha && s.fecha.includes(q))) {
          found.push({ type: 'sesion', id: s.id, label: `${s.numero_correlativo || s.tipo} - ${s.fecha}` });
        }
      });
    }
    
    if (oficios) {
      oficios.filter(o => o.activo).forEach(o => {
        if (o.numero_oficio?.toLowerCase().includes(q) || o.asunto?.toLowerCase().includes(q)) {
          found.push({ type: 'oficio', id: o.id, label: `${o.numero_oficio} - ${o.asunto}` });
        }
      });
    }
    
    if (projects) {
      projects.filter(p => p.activo).forEach(p => {
        if (p.titulo?.toLowerCase().includes(q)) {
          found.push({ type: 'proyecto', id: p.id, label: p.titulo });
        }
      });
    }

    if (legislators) {
      legislators.filter(l => l.activo).forEach(l => {
        if (l.nombre?.toLowerCase().includes(q)) {
          found.push({ type: 'legislador', id: l.id, label: l.nombre });
        }
      });
    }

    return found.slice(0, 10);
  }, [query, sessions, oficios, projects, legislators]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ animation: 'scale-in 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar sesiones, oficios, proyectos, legisladores..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query && (
            <p className="text-center py-8 text-gray-400 text-sm">Sin resultados</p>
          )}
          {!query && (
            <div className="py-8 text-center text-gray-400 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Escribe para buscar en toda la aplicación</p>
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors cursor-pointer"
              onClick={() => {
                if (onNavigate && r.type && r.id) onNavigate(r.type, r.id);
                onClose();
              }}
            >
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{r.type}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MODAL COMPONENT
// ============================================================
const Modal = ({ isOpen, onClose, title, children, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} style={{ animation: 'scale-in 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-t-2xl z-10`}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ darkMode, icon, label, value, color }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
};

// ============================================================
// DASHBOARD MODULE
// ============================================================
const Dashboard = ({ sessions, oficios, projects, legislators, darkMode, onNavigate }) => {
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

  const approvedLaws = useMemo(() => projects.filter(p => p.activo && (p.fase_actual === 'Aprobada' || p.fase_actual === 'Sancionada')), [projects]);
  const activeProjects = useMemo(() => projects.filter(p => p.activo && p.fase_actual !== 'Sancionada'), [projects]);

  const sessionTypeBreakdown = useMemo(() => {
    const counts = {};
    monthSessions.forEach(s => { counts[s.tipo] = (counts[s.tipo] || 0) + 1; });
    return counts;
  }, [monthSessions]);

  const stalledProjects = useMemo(() => projects.filter(p => {
    if (!p.activo || p.fase_actual === 'Sancionada') return false;
    return getDaysSince(p.fecha_actualizacion) > 30;
  }), [projects]);

  const alertProjects = useMemo(() => projects.filter(p => {
    if (!p.activo || p.fase_actual === 'Sancionada') return false;
    const days = getDaysSince(p.fecha_actualizacion);
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
        <StatCard darkMode={darkMode} icon={<Scale className="w-5 h-5" />} label="Leyes Aprobadas" value={approvedLaws.length} color="emerald" />
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
                    <p className="text-xs text-red-400">{getDaysSince(p.fecha_actualizacion)} días sin actividad</p>
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
                    <p className="text-xs text-amber-400">{getDaysSince(p.fecha_actualizacion)} días sin actividad</p>
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
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>{l.partido_politico}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SESSIONS MODULE
// ============================================================
const SessionsModule = ({ sessions, oficios, onSave, onDelete, darkMode, addToast, onNavigate }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipo: 'Ordinaria', numero_correlativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '09:00', hora_cierre: '12:00', periodo: '2026-2027', observaciones: '' });

  const resetForm = () => {
    setForm({ tipo: 'Ordinaria', numero_correlativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '09:00', hora_cierre: '12:00', periodo: '2026-2027', observaciones: '' });
    setEditingId(null);
    setView('list');
  };

  const handleDateChange = (val) => {
    const tipo = getSessionTypeByDate(val);
    const year = new Date(val + 'T12:00:00').getFullYear();
    const num = generateSessionNumber(tipo, year, sessions);
    setForm(prev => ({ ...prev, fecha: val, tipo, numero_correlativo: num }));
  };

  const handleTypeChange = (val) => {
    const needsNumber = val === 'Ordinaria' || val === 'Extraordinaria';
    setForm(prev => {
      if (needsNumber && prev.fecha) {
        const year = new Date(prev.fecha + 'T12:00:00').getFullYear();
        const num = generateSessionNumber(val, year, sessions);
        return { ...prev, tipo: val, numero_correlativo: num, motivo: '' };
      }
      return { ...prev, tipo: val, numero_correlativo: '', motivo: '' };
    });
  };

  const handleSave = () => {
    if (!form.fecha) { addToast('La fecha es requerida', 'error'); return; }
    if ((form.tipo === 'Especial' || form.tipo === 'Solemne' || form.tipo === 'Instalación') && !form.motivo) { 
      addToast('El motivo es requerido para este tipo de sesión', 'error'); return; 
    }
    
    const isDuplicate = sessions.some(s => 
      s.activo && 
      s.id !== editingId && 
      s.numero_correlativo === form.numero_correlativo &&
      s.tipo === form.tipo &&
      form.numero_correlativo 
    );
    if (isDuplicate) {
      addToast('Ya existe una sesión con este número correlativo', 'error');
      return;
    }
    
    onSave(editingId ? { ...form, id: editingId } : form);
    addToast(editingId ? 'Sesión actualizada' : 'Sesión creada', 'success');
    resetForm();
  };

  const handleDelete = (id) => {
    const linkedOficios = oficios.filter(o => o.activo && o.sesion_id === id);
    if (linkedOficios.length > 0) {
      const msg = `⚠️ Esta sesión tiene ${linkedOficios.length} oficio(s) vinculado(s).\n\n¿Deseas eliminarla igualmente? Los vínculos se romperán.`;
      if (!window.confirm(msg)) return;
    }
    onDelete(id);
    addToast('Sesión eliminada', 'warning');
  };

  const getLinkedOficios = useCallback((sesionId) => oficios.filter(o => o.activo && o.sesion_id === sesionId), [oficios]);

  const typeColors = {
    'Ordinaria': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'Extraordinaria': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    'Especial': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'Solemne': 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    'Instalación': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  };

  const activeSessions = useMemo(() => sessions.filter(s => s.activo).sort((a, b) => b.fecha.localeCompare(a.fecha)), [sessions]);

  if (view === 'form' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={resetForm} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
          <ChevronLeft className="w-4 h-4" /> Volver al listado
        </button>
        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-6">{editingId ? 'Editar Sesión' : 'Nueva Sesión'}</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => handleDateChange(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              {form.fecha && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tipo detectado: <span className="font-medium">{form.tipo}</span></p>}
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tipo de Sesión</label>
              <select value={form.tipo} onChange={e => handleTypeChange(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="Ordinaria">Ordinaria</option>
                <option value="Extraordinaria">Extraordinaria</option>
                <option value="Especial">Especial</option>
                <option value="Solemne">Solemne</option>
                <option value="Instalación">Instalación</option>
              </select>
            </div>
            {(form.tipo === 'Ordinaria' || form.tipo === 'Extraordinaria') && (
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Número Correlativo</label>
                <div className="flex gap-2">
                  <input type="text" value={form.numero_correlativo} readOnly className={`flex-1 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`} />
                  <button onClick={() => handleTypeChange(form.tipo)} className={`px-4 py-2.5 rounded-xl border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {(form.tipo === 'Especial' || form.tipo === 'Solemne' || form.tipo === 'Instalación') && (
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Motivo / Período</label>
                <input type="text" value={form.motivo} onChange={e => setForm(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Ej: Conmemoración bicentenario" className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora Inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm(prev => ({ ...prev, hora_inicio: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora Cierre</label>
                <input type="time" value={form.hora_cierre} onChange={e => setForm(prev => ({ ...prev, hora_cierre: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} rows={3} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={resetForm} className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all">
              {editingId ? 'Actualizar' : 'Crear Sesión'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Sesiones</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de sesiones legislativas</p>
        </div>
        <button onClick={() => { setView('form'); setEditingId(null); setForm({ tipo: 'Ordinaria', numero_correlativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '09:00', hora_cierre: '12:00', periodo: '2026-2027', observaciones: '' }); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Nueva Sesión
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tipo</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Horario</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Oficios</th>
                <th className={`text-right px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map(s => {
                const ofs = getLinkedOficios(s.id);
                return (
                  <tr key={s.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium">{s.numero_correlativo || '—'}</span>
                      {s.motivo && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>{s.motivo}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[s.tipo] || ''}`}>{s.tipo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.hora_inicio} - {s.hora_cierre}</span>
                    </td>
                    <td className="px-6 py-4">
                      {ofs.length > 0 ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onNavigate?.('oficio', ofs[0].id); }}
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                          title="Ver oficio vinculado"
                        >
                          <Link className="w-3 h-3" /> {ofs.length}
                        </button>
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(s.id); setForm({ tipo: s.tipo, numero_correlativo: s.numero_correlativo, motivo: s.motivo, fecha: s.fecha, hora_inicio: s.hora_inicio, hora_cierre: s.hora_cierre, periodo: s.periodo, observaciones: s.observaciones }); setView('edit'); }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <CalendarDays className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No hay sesiones registradas</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// OFICIOS MODULE
// ============================================================
const OficiosModule = ({ oficios, sessions, onSave, onDelete, darkMode, addToast, onNavigate }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ numero_oficio: '', fecha: new Date().toISOString().split('T')[0], organo_receptor: '', asunto: '', sesion_id: '' });

  const resetForm = () => {
    setForm({ numero_oficio: '', fecha: new Date().toISOString().split('T')[0], organo_receptor: '', asunto: '', sesion_id: '' });
    setEditingId(null);
    setView('list');
  };

  useEffect(() => {
    if (view === 'form') {
      const year = new Date().getFullYear();
      const active = oficios.filter(o => o.activo && o.numero_oficio?.includes(`-${year}`));
      const maxNum = active.reduce((max, o) => {
        const parts = o.numero_oficio.split('-');
        const num = parseInt(parts[1] || '0', 10);
        return num > max ? num : max;
      }, 0);
      setForm(prev => ({ ...prev, numero_oficio: `OF-${String(maxNum + 1).padStart(3, '0')}-${year}` }));
    }
  }, [view, oficios]);

  const handleSave = () => {
    if (!form.organo_receptor) { addToast('El órgano receptor es requerido', 'error'); return; }
    if (!form.asunto) { addToast('El asunto es requerido', 'error'); return; }
    const sesionIdVal = form.sesion_id ? Number(form.sesion_id) : null;
    onSave(editingId ? { ...form, id: editingId, sesion_id: sesionIdVal } : { ...form, sesion_id: sesionIdVal });
    addToast(editingId ? 'Oficio actualizado' : 'Oficio creado', 'success');
    resetForm();
  };

  const activeOficios = useMemo(() => oficios.filter(o => o.activo).sort((a, b) => b.fecha.localeCompare(a.fecha)), [oficios]);

  if (view === 'form' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={resetForm} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
          <ChevronLeft className="w-4 h-4" /> Volver al listado
        </button>
        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-6">{editingId ? 'Editar Oficio' : 'Nuevo Oficio Saliente'}</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Número de Oficio</label>
              <input type="text" value={form.numero_oficio} onChange={e => setForm(prev => ({ ...prev, numero_oficio: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Órgano Receptor</label>
              <input type="text" value={form.organo_receptor} onChange={e => setForm(prev => ({ ...prev, organo_receptor: e.target.value }))} placeholder="Ej: Ministerio de Hacienda" className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Asunto</label>
              <textarea value={form.asunto} onChange={e => setForm(prev => ({ ...prev, asunto: e.target.value }))} rows={3} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vincular a Sesión (opcional)</label>
              <select value={form.sesion_id} onChange={e => setForm(prev => ({ ...prev, sesion_id: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Sin vincular</option>
                {sessions.filter(s => s.activo).sort((a, b) => b.fecha.localeCompare(a.fecha)).map(s => (
                  <option key={s.id} value={s.id}>{s.numero_correlativo || s.tipo} - {s.fecha}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={resetForm} className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all">
              {editingId ? 'Actualizar' : 'Crear Oficio'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Oficios Salientes</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de comunicaciones oficiales</p>
        </div>
        <button onClick={() => setView('form')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Nuevo Oficio
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Número</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Receptor</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Asunto</th>
                <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sesión</th>
                <th className={`text-right px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activeOficios.map(o => {
                const sesion = sessions.find(s => s.id === o.sesion_id);
                return (
                  <tr key={o.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium">{o.numero_oficio}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{new Date(o.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.organo_receptor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm max-w-xs truncate block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{o.asunto}</span>
                    </td>
                    <td className="px-6 py-4">
                      {sesion ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onNavigate?.('sesion', sesion.id); }}
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                          title="Ver sesión vinculada"
                        >
                          <Link className="w-3 h-3" /> {sesion.numero_correlativo || sesion.tipo}
                        </button>
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>Sin vincular</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(o.id); setForm({ numero_oficio: o.numero_oficio, fecha: o.fecha, organo_receptor: o.organo_receptor, asunto: o.asunto, sesion_id: o.sesion_id || '' }); setView('edit'); }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { onDelete(o.id); addToast('Oficio eliminado', 'warning'); }} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeOficios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No hay oficios registrados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VAULT MODULE
// ============================================================
const VaultModule = ({ documents, sessions, oficios, projects, darkMode, addToast, onSaveDocument, onDeleteDocument }) => {
  const [filterType, setFilterType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ entidad_tipo: 'Sesion', entidad_id: '', fase_etiqueta: '', nombre_archivo: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getEntityName = (doc) => {
    if (doc.entidad_tipo === 'Sesion') {
      const s = sessions.find(s => s.id === doc.entidad_id);
      return s ? `${s.numero_correlativo || s.tipo} (${s.fecha})` : 'Sesión no encontrada';
    }
    if (doc.entidad_tipo === 'Oficio') {
      const o = oficios.find(o => o.id === doc.entidad_id);
      return o ? o.numero_oficio : 'Oficio no encontrado';
    }
    if (doc.entidad_tipo === 'ProyectoLey') {
      const p = projects.find(p => p.id === doc.entidad_id);
      return p ? p.titulo : 'Proyecto no encontrado';
    }
    return '';
  };

  const getPhaseLabels = (entidadTipo) => {
    if (entidadTipo === 'Sesion') return ['Acta', 'Acuerdo', 'Orden del Día', 'Asistencia'];
    if (entidadTipo === 'Oficio') return ['Oficio Original', 'Acuse de Recibo', 'Respuesta'];
    if (entidadTipo === 'ProyectoLey') return ['Estudio en Comisión', 'Informe de Dirección', '1ra Discusión', '2da Discusión', '3ra Discusión', 'Aprobada', 'Gaceta Oficial'];
    return [];
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      addToast('Solo se permiten archivos PDF o Word', 'error');
      return;
    }
    setSelectedFile(file);
    setUploadForm(prev => ({ ...prev, nombre_archivo: file.name }));
  };

  const handleUpload = async () => {
    if (!uploadForm.entidad_id) { addToast('Seleccione una entidad', 'error'); return; }
    if (!uploadForm.fase_etiqueta) { addToast('Seleccione la fase', 'error'); return; }
    try {
      setUploadProgress(30);
      let base64Content = null;
      if (selectedFile) {
        base64Content = await fileToBase64(selectedFile);
        setUploadProgress(70);
      }
      const hash = `sha256:${Array.from(uploadForm.nombre_archivo || 'doc').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(8, '0')}`;
      const newDoc = {
        id: Date.now(),
        entidad_tipo: uploadForm.entidad_tipo,
        entidad_id: Number(uploadForm.entidad_id),
        fase_etiqueta: uploadForm.fase_etiqueta,
        ruta_archivo: `/boveda/${uploadForm.entidad_tipo.toLowerCase()}/${uploadForm.entidad_id}/${uploadForm.nombre_archivo || 'documento'}`,
        hash_integridad: hash,
        nombre_original: uploadForm.nombre_archivo || 'documento',
        tipo_mime: selectedFile?.type || 'application/octet-stream',
        tamano_bytes: selectedFile?.size || 0,
        fecha_subida: new Date().toISOString().split('T')[0],
        contenido_base64: base64Content,
        activo: true
      };
      onSaveDocument?.(newDoc);
      setUploadProgress(100);
      addToast(`✅ "${uploadForm.nombre_archivo}" subido exitosamente`, 'success');
      setShowUpload(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      addToast('Error al subir el archivo', 'error');
      setUploadProgress(0);
    }
  };

  const typeIcons = { Sesion: <CalendarDays className="w-5 h-5" />, Oficio: <FileText className="w-5 h-5" />, ProyectoLey: <Scale className="w-5 h-5" /> };
  const typeColors = { Sesion: 'text-blue-500 bg-blue-500/10', Oficio: 'text-purple-500 bg-purple-500/10', ProyectoLey: 'text-emerald-500 bg-emerald-500/10' };

  const activeDocs = useMemo(() => documents.filter(d => d.activo && (!filterType || d.entidad_tipo === filterType)), [documents, filterType]);
  const activeSessions = useMemo(() => sessions.filter(s => s.activo), [sessions]);
  const activeOficios = useMemo(() => oficios.filter(o => o.activo), [oficios]);
  const activeProjects = useMemo(() => projects.filter(p => p.activo), [projects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bóveda Documental</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión y almacenamiento de documentos</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
          <Upload className="w-4 h-4" /> Subir Archivo
        </button>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        {['', 'Sesion', 'Oficio', 'ProyectoLey'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === t ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>{t || 'Todos'}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDocs.map(doc => (
          <div key={doc.id} className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${typeColors[doc.entidad_tipo] || 'text-gray-500 bg-gray-500/10'}`}>{typeIcons[doc.entidad_tipo]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{getEntityName(doc)}</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{doc.entidad_tipo}</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500">Fase</p>
              <p className="text-sm font-medium">{doc.fase_etiqueta}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-mono text-gray-400">{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
              <div className="flex gap-1">
                {doc.contenido_base64 && <a href={doc.contenido_base64} download={doc.nombre_original} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Download className="w-3.5 h-3.5" /></a>}
                <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Subir Archivo" darkMode={darkMode}>
        <div className="space-y-4">
          <input type="file" onChange={handleFileSelect} className="w-full text-sm" />
          <select value={uploadForm.entidad_tipo} onChange={e => setUploadForm({...uploadForm, entidad_tipo: e.target.value, entidad_id: ''})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="Sesion">Sesión</option>
            <option value="Oficio">Oficio</option>
            <option value="ProyectoLey">Proyecto</option>
          </select>
          <select value={uploadForm.entidad_id} onChange={e => setUploadForm({...uploadForm, entidad_id: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="">Seleccionar...</option>
            {(uploadForm.entidad_tipo === 'Sesion' ? activeSessions : uploadForm.entidad_tipo === 'Oficio' ? activeOficios : activeProjects).map(e => (
              <option key={e.id} value={e.id}>{e.numero_correlativo || e.numero_oficio || e.titulo}</option>
            ))}
          </select>
          <select value={uploadForm.fase_etiqueta} onChange={e => setUploadForm({...uploadForm, fase_etiqueta: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="">Fase...</option>
            {getPhaseLabels(uploadForm.entidad_tipo).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={handleUpload} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl">Subir</button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// LEGISLATORS MODULE
// ============================================================
const LegislatorsModule = ({ legislators, commissions, onSaveLegislator, onSaveCommission, onDeleteLegislator, onDeleteCommission, darkMode, addToast }) => {
  const [tab, setTab] = useState('legislators');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('legislator');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', partido_politico: '', contacto: '', notas: '' });
  const [commissionForm, setCommissionForm] = useState({ nombre: '', presidente_id: '' });

  const resetForm = () => { setForm({ nombre: '', partido_politico: '', contacto: '', notas: '' }); setEditingId(null); setShowForm(false); };
  const resetCommissionForm = () => { setCommissionForm({ nombre: '', presidente_id: '' }); setEditingId(null); setShowForm(false); };

  const handleSaveLegislator = () => {
    if (!form.nombre.trim()) return addToast('Nombre requerido', 'error');
    onSaveLegislator(editingId ? { ...form, id: editingId } : form);
    addToast('Legislador guardado', 'success');
    resetForm();
  };

  const handleSaveCommission = () => {
    if (!commissionForm.nombre.trim()) return addToast('Nombre requerido', 'error');
    onSaveCommission(editingId ? { ...commissionForm, id: editingId, presidente_id: Number(commissionForm.presidente_id) } : { ...commissionForm, presidente_id: Number(commissionForm.presidente_id) });
    addToast('Comisión guardada', 'success');
    resetCommissionForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Legisladores y Comisiones</h1>
        <button onClick={() => { setShowForm(true); setFormType(tab === 'legislators' ? 'legislator' : 'commission'); }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4 inline mr-2" /> Nuevo</button>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        <button onClick={() => setTab('legislators')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'legislators' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>Legisladores</button>
        <button onClick={() => setTab('commissions')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'commissions' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>Comisiones</button>
      </div>
      {tab === 'legislators' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
              <tr><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Partido</th><th className="px-6 py-3">Contacto</th><th className="px-6 py-3 text-right">Acciones</th></tr>
            </thead>
            <tbody>
              {legislators.filter(l => l.activo).map(l => (
                <tr key={l.id} className="border-b dark:border-gray-800">
                  <td className="px-6 py-4 font-medium">{l.nombre}</td>
                  <td className="px-6 py-4">{l.partido_politico}</td>
                  <td className="px-6 py-4">{l.contacto}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => onDeleteLegislator(l.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commissions.filter(c => c.activo).map(c => (
            <div key={c.id} className="p-5 bg-white dark:bg-gray-900 border rounded-2xl">
              <h3 className="font-bold">{c.nombre}</h3>
              <p className="text-xs text-gray-500">Presidente: {legislators.find(l => l.id === c.presidente_id)?.nombre || '—'}</p>
              <button onClick={() => onDeleteCommission(c.id)} className="mt-3 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Agregar" darkMode={darkMode}>
        {formType === 'legislator' ? (
          <div className="space-y-4">
            <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800" />
            <input placeholder="Partido" value={form.partido_politico} onChange={e => setForm({...form, partido_politico: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800" />
            <button onClick={handleSaveLegislator} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl">Guardar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <input placeholder="Nombre Comisión" value={commissionForm.nombre} onChange={e => setCommissionForm({...commissionForm, nombre: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800" />
            <select value={commissionForm.presidente_id} onChange={e => setCommissionForm({...commissionForm, presidente_id: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
              <option value="">Presidente...</option>
              {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
            <button onClick={handleSaveCommission} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl">Guardar</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ============================================================
// APP COMPONENT PRINCIPAL
// ============================================================
export default function App() {
  const {
    config, setConfig,
    sessions, saveSession, deleteSession,
    legislators, saveLegislator, deleteLegislator,
    commissions, saveCommission, deleteCommission,
    oficios, saveOficio, deleteOficio,
    projects, saveProject, deleteProject,
    documents, saveDocument, deleteDocument,
    isLoading
  } = useLegisData(defaultConfig);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const darkMode = config.darkMode;

  // Atajos de teclado
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleDarkMode = () => setConfig({ darkMode: !config.darkMode });

  const navigateToEntity = useCallback((type, id) => {
    const pages = { sesion: 'sesiones', oficio: 'oficios', proyecto: 'agenda', legislador: 'legisladores' };
    if (pages[type]) setCurrentPage(pages[type]);
    addToast(`Navegando a ${type}`, 'info');
  }, [addToast]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Calendar className="w-5 h-5" /> },
    { id: 'oficios', label: 'Oficios', icon: <FileText className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda Legislativa', icon: <Scale className="w-5 h-5" /> },
    { id: 'legisladores', label: 'Legisladores', icon: <Users className="w-5 h-5" /> },
    { id: 'boveda', label: 'Bóveda', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'leyes', label: 'Biblioteca', icon: <Scale className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!config.setupComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border w-full max-w-md">
          <Gavel className="w-12 h-12 text-indigo-500 mb-6 mx-auto" />
          <h2 className="text-2xl font-bold text-center mb-6">Configuración Inicial</h2>
          <div className="space-y-4">
            <input 
              placeholder="Nombre del Secretario" 
              className="w-full p-3 rounded-xl border dark:bg-gray-800" 
              onChange={e => setConfig({ nombre_secretario: e.target.value })} 
            />
            <input 
              placeholder="Cédula" 
              className="w-full p-3 rounded-xl border dark:bg-gray-800" 
              onChange={e => setConfig({ cedula: e.target.value })} 
            />
            <button 
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold" 
              onClick={() => setConfig({ setupComplete: true })}
            >
              Empezar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`min-h-screen flex ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r ${sidebarOpen ? 'w-64' : 'w-16'}`}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800/50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Segundo Cerebro</p>
                <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Legislativo</p>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${currentPage === item.id 
                    ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}
                  ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              >
                {item.icon}
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className={`mx-3 mb-4 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{config.nombre_secretario || 'Secretario'}</p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{config.cedula || ''} · {config.periodo_sesiones}</p>
            </div>
          )}

          <div className="p-2 border-t border-gray-800/50">
            <button onClick={() => setSidebarOpen(prev => !prev)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} ${!sidebarOpen ? 'justify-center' : ''}`}>
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              {sidebarOpen && <span>Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          {/* Top Bar */}
          <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b backdrop-blur-xl ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{navItems.find(i => i.id === currentPage)?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCommandPalette(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'} transition-colors`}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>⌘K</kbd>
              </button>
              <div className={`w-px h-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {currentPage === 'dashboard' && <Dashboard sessions={sessions} oficios={oficios} projects={projects} legislators={legislators} darkMode={darkMode} onNavigate={navigateToEntity} />}
            {currentPage === 'sesiones' && <SessionsModule sessions={sessions} oficios={oficios} darkMode={darkMode} addToast={addToast} onSave={saveSession} onDelete={deleteSession} onNavigate={navigateToEntity} />}
            {currentPage === 'oficios' && <OficiosModule oficios={oficios} sessions={sessions} darkMode={darkMode} addToast={addToast} onSave={saveOficio} onDelete={deleteOficio} onNavigate={navigateToEntity} />}
            {currentPage === 'agenda' && <AgendaModule projects={projects} commissions={commissions} legislators={legislators} darkMode={darkMode} addToast={addToast} onSave={saveProject} onDelete={deleteProject} onNavigate={navigateToEntity} config={config} />}
            {currentPage === 'legisladores' && <LegislatorsModule legislators={legislators} commissions={commissions} darkMode={darkMode} addToast={addToast} onSaveLegislator={saveLegislator} onSaveCommission={saveCommission} onDeleteLegislator={deleteLegislator} onDeleteCommission={deleteCommission} />}
            {currentPage === 'boveda' && <VaultModule documents={documents} sessions={sessions} oficios={oficios} projects={projects} darkMode={darkMode} addToast={addToast} onSaveDocument={saveDocument} onDeleteDocument={deleteDocument} />}
            {currentPage === 'leyes' && <LawsLibrary darkMode={darkMode} addToast={addToast} />}
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          sessions={sessions}
          oficios={oficios}
          projects={projects}
          legislators={legislators}
          onNavigate={navigateToEntity}
        />

        {/* Toasts */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Global Styles */}
        <style>{`
          @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#374151' : '#d1d5db'}; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#4b5563' : '#9ca3af'}; }
        `}</style>
      </div>
    </div>
  );
}
