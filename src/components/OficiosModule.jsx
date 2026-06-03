import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, FileText, ChevronLeft, Link 
} from 'lucide-react';
import EmptyState from './ui/EmptyState';
import ConfirmDialog from './ui/ConfirmDialog';

const OficiosModule = ({ oficios, sessions, onSave, onDelete, darkMode, addToast, onNavigate, documents = [], saveDocument, deleteDocument, reload }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ numeroOficio: '', fecha: new Date().toISOString().split('T')[0], organoReceptor: '', asunto: '', sesionId: '', localFilePath: null, localFileName: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  const handleSelectFile = async () => {
    if (!window.legisAPI) return addToast('Solo disponible en la aplicación de escritorio', 'info');
    const filePath = await window.legisAPI.dialog.openPdf();
    if (filePath) {
      setForm(prev => ({ ...prev, localFilePath: filePath, localFileName: filePath.split(/[\\/]/).pop() }));
    }
  };

  const resetForm = () => {
    setForm({ numeroOficio: '', fecha: new Date().toISOString().split('T')[0], organoReceptor: '', asunto: '', sesionId: '', localFilePath: null, localFileName: '' });
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

  const handleSave = async () => {
    if (!form.organoReceptor) { addToast('El órgano receptor es requerido', 'error'); return; }
    if (!form.asunto) { addToast('El asunto es requerido', 'error'); return; }
    const sesionIdVal = form.sesionId ? Number(form.sesionId) : null;
    
    try {
      const savedId = await onSave(editingId ? { ...form, id: editingId, sesionId: sesionIdVal } : { ...form, sesionId: sesionIdVal });

      // Ingesta de archivo PDF a la Bóveda Documental
      if (form.localFilePath) {
        const existingDoc = (documents || []).find(d => d.entidadTipo === 'Oficio' && d.entidadId === (editingId || savedId) && d.activo);
        if (!existingDoc || existingDoc.rutaArchivo !== form.localFilePath) {
          if (existingDoc) {
            await deleteDocument(existingDoc.id);
          }
          await window.legisAPI.documents.saveFile({
            filePath: form.localFilePath,
            entidadTipo: 'Oficio',
            entidadId: editingId || savedId
          });
        }
      } else {
        const existingDoc = (documents || []).find(d => d.entidadTipo === 'Oficio' && d.entidadId === (editingId || savedId) && d.activo);
        if (existingDoc) {
          await deleteDocument(existingDoc.id);
        }
      }

      if (reload) await reload();
      addToast(editingId ? 'Oficio actualizado' : 'Oficio creado', 'success');
      resetForm();
    } catch (e) {
      console.error('Error al guardar el oficio:', e);
      addToast('Error al guardar el oficio', 'error');
    }
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
              <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Archivo PDF Adjunto <span className="text-xs opacity-60">(opcional)</span></label>
              <button
                type="button"
                onClick={handleSelectFile}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  form.localFilePath
                    ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                    : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                }`}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{form.localFilePath ? form.localFileName : 'Seleccionar PDF desde mi PC...'}</span>
              </button>
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
            <button onClick={resetForm} className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
              {editingId ? 'Actualizar' : 'Crear Oficio'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Oficios Salientes</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de comunicaciones oficiales</p>
        </div>
        <button onClick={() => setView('form')} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Oficio
        </button>
      </div>

      {activeOficios.length === 0 ? (
        <EmptyState 
          icon={FileText}
          title="Bandeja de oficios vacía"
          description="Los documentos oficiales generados aparecerán aquí. Comience redactando uno nuevo."
          action={{
            label: "Redactar oficio",
            onClick: () => setView('form')
          }}
          dataTestId="empty-state-oficios"
        />
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Número</th>
                  <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</th>
                  <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Receptor</th>
                  <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Asunto</th>
                  <th className={`text-left px-6 py-3 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Adjunto</th>
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
                        {(() => {
                          const doc = (documents || []).find(d => d.entidadTipo === 'Oficio' && d.entidadId === o.id && d.activo);
                          if (!doc) return <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>Sin archivo</span>;
                          return (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await window.legisAPI.documents.openFile(doc.id);
                                  addToast('Archivo abierto con el visor del sistema', 'success');
                                } catch (e) {
                                  addToast('Error al abrir el archivo local', 'error');
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors font-semibold cursor-pointer"
                              title="Abrir PDF local"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" /> Ver PDF
                            </button>
                          );
                        })()}
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
                          <button onClick={() => { 
                            const doc = (documents || []).find(d => d.entidadTipo === 'Oficio' && d.entidadId === o.id && d.activo);
                            setEditingId(o.id); 
                            setForm({ 
                              numeroOficio: o.numeroOficio, 
                              fecha: o.fecha, 
                              organoReceptor: o.organoReceptor, 
                              asunto: o.asunto, 
                              sesionId: o.sesionId || '', 
                              localFilePath: doc ? doc.rutaArchivo : null, 
                              localFileName: doc ? doc.nombreOriginal : '' 
                            }); 
                            setView('edit'); 
                          }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Eliminar oficio',
                              message: '¿Eliminar este oficio permanentemente? Esta acción no se puede deshacer.',
                              destructive: true,
                              onConfirm: async () => {
                                await onDelete(o.id);
                                const existingDoc = (documents || []).find(d => d.entidadTipo === 'Oficio' && d.entidadId === o.id && d.activo);
                                if (existingDoc) await deleteDocument(existingDoc.id);
                                addToast('Oficio eliminado', 'warning');
                              }
                            });
                          }} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
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
    <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} darkMode={darkMode} destructive={confirmDialog.destructive} />
    </>
  );
};

export default OficiosModule;
