import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, FileText, ChevronLeft, Link 
} from 'lucide-react';

const OficiosModule = ({ oficios, sessions, onSave, onDelete, darkMode, addToast, onNavigate }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ numeroOficio: '', fecha: new Date().toISOString().split('T')[0], organoReceptor: '', asunto: '', sesionId: '' });

  const resetForm = () => {
    setForm({ numeroOficio: '', fecha: new Date().toISOString().split('T')[0], organoReceptor: '', asunto: '', sesionId: '' });
    setEditingId(null);
    setView('list');
  };

  useEffect(() => {
    if (view === 'form') {
      const year = new Date().getFullYear();
      const active = oficios.filter(o => o.activo && o.numeroOficio?.includes(`-${year}`));
      const maxNum = active.reduce((max, o) => {
        const parts = o.numeroOficio.split('-');
        const num = parseInt(parts[1] || '0', 10);
        return num > max ? num : max;
      }, 0);
      setForm(prev => ({ ...prev, numeroOficio: `OF-${String(maxNum + 1).padStart(3, '0')}-${year}` }));
    }
  }, [view, oficios]);

  const handleSave = () => {
    if (!form.organoReceptor) { addToast('El órgano receptor es requerido', 'error'); return; }
    if (!form.asunto) { addToast('El asunto es requerido', 'error'); return; }
    const sesionIdVal = form.sesionId ? Number(form.sesionId) : null;
    onSave(editingId ? { ...form, id: editingId, sesionId: sesionIdVal } : { ...form, sesionId: sesionIdVal });
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
              <input type="text" value={form.numeroOficio} onChange={e => setForm(prev => ({ ...prev, numeroOficio: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Órgano Receptor</label>
              <input type="text" value={form.organoReceptor} onChange={e => setForm(prev => ({ ...prev, organoReceptor: e.target.value }))} placeholder="Ej: Ministerio de Hacienda" className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Asunto</label>
              <textarea value={form.asunto} onChange={e => setForm(prev => ({ ...prev, asunto: e.target.value }))} rows={3} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vincular a Sesión (opcional)</label>
              <select value={form.sesionId} onChange={e => setForm(prev => ({ ...prev, sesionId: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Sin vincular</option>
                {sessions.filter(s => s.activo).sort((a, b) => b.fecha.localeCompare(a.fecha)).map(s => (
                  <option key={s.id} value={s.id}>{s.numeroCorrelativo || s.tipo} - {s.fecha}</option>
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
                const sesion = sessions.find(s => s.id === o.sesionId);
                return (
                  <tr key={o.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium">{o.numeroOficio}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{new Date(o.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.organoReceptor}</span>
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
                          <Link className="w-3 h-3" /> {sesion.numeroCorrelativo || sesion.tipo}
                        </button>
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>Sin vincular</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(o.id); setForm({ numeroOficio: o.numeroOficio, fecha: o.fecha, organoReceptor: o.organoReceptor, asunto: o.asunto, sesionId: o.sesionId || '' }); setView('edit'); }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
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

export default OficiosModule;
