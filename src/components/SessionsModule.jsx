import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, Plus, Edit3, Trash2, CalendarDays, RefreshCw, Link,
  CalendarClock, FileText
} from 'lucide-react';
import { getSessionTypeByDate, generateSessionNumber } from '../utils/helpers';
import EmptyState from './ui/EmptyState';

const SessionsModule = ({ sessions, oficios, onSave, onDelete, darkMode, addToast, onNavigate }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipo: 'Ordinaria', numeroCorrelativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], horaInicio: '09:00', horaCierre: '12:00', periodo: '2026-2027', observaciones: '', localFilePath: null, localFileName: '' });

  const handleSelectFile = async () => {
    if (!window.legisAPI) return addToast('Solo disponible en la aplicación de escritorio', 'info');
    const filePath = await window.legisAPI.invoke('dialog:open-pdf');
    if (filePath) {
      setForm(prev => ({ ...prev, localFilePath: filePath, localFileName: filePath.split(/[\\/]/).pop() }));
    }
  };

  const resetForm = () => {
    setForm({ tipo: 'Ordinaria', numeroCorrelativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], horaInicio: '09:00', horaCierre: '12:00', periodo: '2026-2027', observaciones: '', localFilePath: null, localFileName: '' });
    setEditingId(null);
    setView('list');
  };

  const handleDateChange = (val) => {
    const tipo = getSessionTypeByDate(val);
    const year = new Date(val + 'T12:00:00').getFullYear();
    const num = generateSessionNumber(tipo, year, sessions);
    setForm(prev => ({ ...prev, fecha: val, tipo, numeroCorrelativo: num }));
  };

  const handleTypeChange = (val) => {
    const needsNumber = val === 'Ordinaria' || val === 'Extraordinaria';
    setForm(prev => {
      if (needsNumber && prev.fecha) {
        const year = new Date(prev.fecha + 'T12:00:00').getFullYear();
        const num = generateSessionNumber(val, year, sessions);
        return { ...prev, tipo: val, numeroCorrelativo: num, motivo: '' };
      }
      return { ...prev, tipo: val, numeroCorrelativo: '', motivo: '' };
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
      s.numeroCorrelativo === form.numeroCorrelativo &&
      s.tipo === form.tipo &&
      form.numeroCorrelativo 
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
    const linkedOficios = oficios.filter(o => o.activo && o.sesionId === id);
    if (linkedOficios.length > 0) {
      const msg = `⚠️ Esta sesión tiene ${linkedOficios.length} oficio(s) vinculado(s).\n\n¿Deseas eliminarla igualmente? Los vínculos se romperán.`;
      if (!window.confirm(msg)) return;
    }
    onDelete(id);
    addToast('Sesión eliminada', 'warning');
  };

  const getLinkedOficios = useCallback((sesionId) => oficios.filter(o => o.activo && o.sesionId === sesionId), [oficios]);

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
                  <input 
                    type="text" 
                    value={form.numeroCorrelativo} 
                    onChange={e => setForm(prev => ({ ...prev, numeroCorrelativo: e.target.value }))}
                    placeholder="000-2026"
                    className={`flex-1 px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
                  />
                  <button 
                    onClick={() => handleTypeChange(form.tipo)} 
                    title="Autogenerar número"
                    className={`px-4 py-2.5 rounded-xl border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Formato sugerido: XXX-AÑO</p>
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
                <input type="time" value={form.horaInicio} onChange={e => setForm(prev => ({ ...prev, horaInicio: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora Cierre</label>
                <input type="time" value={form.horaCierre} onChange={e => setForm(prev => ({ ...prev, horaCierre: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Acta / Documento PDF <span className="text-xs opacity-60">(opcional)</span></label>
              <button
                type="button"
                onClick={handleSelectFile}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  form.localFilePath
                    ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                    : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                }`}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{form.localFilePath ? form.localFileName : 'Seleccionar acta o PDF desde mi PC...'}</span>
              </button>
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
        <button onClick={() => { setView('form'); setEditingId(null); setForm({ tipo: 'Ordinaria', numeroCorrelativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], horaInicio: '09:00', horaCierre: '12:00', periodo: '2026-2027', observaciones: '' }); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> Nueva Sesión
        </button>
      </div>

      {activeSessions.length === 0 ? (
        <EmptyState 
          icon={CalendarClock}
          title="No hay sesiones registradas"
          description="Registre la primera sesión ordinaria para habilitar el control de actas, asistencia y proyectos."
          action={{
            label: "Crear sesión",
            onClick: () => { 
              setView('form'); 
              setEditingId(null); 
              setForm({ tipo: 'Ordinaria', numeroCorrelativo: '', motivo: '', fecha: new Date().toISOString().split('T')[0], horaInicio: '09:00', horaCierre: '12:00', periodo: '2026-2027', observaciones: '' });
            }
          }}
          dataTestId="empty-state-sesiones"
        />
      ) : (
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
                        <span className="text-sm font-mono font-medium">{s.numeroCorrelativo || '—'}</span>
                        {s.motivo && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>{s.motivo}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[s.tipo] || ''}`}>{s.tipo}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.horaInicio} - {s.horaCierre}</span>
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
                          <button onClick={() => { setEditingId(s.id); setForm({ tipo: s.tipo, numeroCorrelativo: s.numeroCorrelativo, motivo: s.motivo, fecha: s.fecha, horaInicio: s.horaInicio, horaCierre: s.horaCierre, periodo: s.periodo, observaciones: s.observaciones }); setView('edit'); }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsModule;
