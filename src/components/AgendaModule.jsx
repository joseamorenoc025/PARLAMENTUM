import React, { useState, useMemo } from 'react';
import { 
  Plus, ArrowRight, ChevronLeft, History, Trash2, Layout, Clock, Gavel, Scale, AlertCircle, ExternalLink
} from 'lucide-react';
import { dbService } from '../services/db';
import ProjectTimeline from './ProjectTimeline';
import { getStagnationColor, getStagnationLabel } from '../utils/helpers';
import ConfirmDialog from './ui/ConfirmDialog';

const AgendaModule = ({ projects, commissions, legislators, onSave, onDelete, darkMode, addToast, config, documents = [], deleteDocument, reload }) => {
  const [view, setView] = useState('kanban');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    titulo: '', 
    origen: 'Comisión', 
    comisionId: '', 
    ponenteId: '', 
    faseActual: 'Estudio en Comisión', 
    urgenciaParlamentaria: 0, 
    fechaIngreso: new Date().toISOString().split('T')[0],
    linkPrimeraDiscusion: '',
    linkConsultaPublica: '',
    linkSegundaDiscusion: '',
    linkTerceraDiscusion: '',
    fechaConsultaPublica: '',
    tags: ''
  });
  const [detailProject, setDetailProject] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  const resetForm = () => { 
    setForm({ 
      titulo: '', 
      origen: 'Comisión', 
      comisionId: '', 
      ponenteId: '', 
      faseActual: 'Estudio en Comisión', 
      urgenciaParlamentaria: 0, 
      fechaIngreso: new Date().toISOString().split('T')[0],
      linkPrimeraDiscusion: '',
      linkConsultaPublica: '',
      linkSegundaDiscusion: '',
      linkTerceraDiscusion: '',
      fechaConsultaPublica: '',
      tags: ''
    }); 
    setEditingId(null); 
    setView('kanban'); 
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return addToast('El título del proyecto es obligatorio', 'error');
    if (form.origen === 'Comisión' && !form.comisionId) return addToast('Debes seleccionar una comisión responsable', 'warning');
    
    const data = {
      ...form,
      comisionId: form.comisionId ? Number(form.comisionId) : null,
      ponenteId: form.ponenteId ? Number(form.ponenteId) : null,
      urgenciaParlamentaria: Number(form.urgenciaParlamentaria),
      fechaActualizacion: new Date().toISOString().split('T')[0],
      activo: 1
    };
    
    try {
      await onSave(editingId ? { ...data, id: editingId } : data);
      addToast('Proyecto guardado exitosamente', 'success');
      resetForm();
    } catch (err) {
      addToast('Error al guardar el proyecto', 'error');
    }
  };

  const phases = ['Recepción', 'Estudio en Comisión', '1ra Discusión', 'Consulta Pública', '2da Discusión', '3ra Discusión', 'Aprobada', 'Promulgada'];

  const handleAdvancePhase = async (project) => {
    const currentIdx = phases.indexOf(project.faseActual);
    if (currentIdx === -1 || currentIdx >= phases.length - 1) {
      addToast('El proyecto ya alcanzó su fase final', 'info');
      return;
    }

    // Validación crítica: si está en "Estudio en Comisión", es obligatorio tener asignada una comisión
    if (project.faseActual === 'Estudio en Comisión' && !project.comisionId) {
      addToast('Error: Debe asignar una comisión responsable en el proyecto antes de poder avanzar de fase.', 'error');
      return;
    }

    const nextPhase = phases[currentIdx + 1];
    const updated = { 
      ...project, 
      faseActual: nextPhase, 
      fechaActualizacion: new Date().toISOString().split('T')[0] 
    };
    
    try {
      await dbService.saveProjectVersion({
        projectId: project.id,
        versionLabel: project.faseActual,
        mensaje: `Cambio de fase a ${nextPhase}`,
        snapshot: project,
        autor: config?.nombreSecretario || 'Sistema'
      });
      
      await onSave(updated);
      setDetailProject(updated);
      addToast(`Avanzado a: ${nextPhase}`, 'success');
    } catch (err) {
      addToast('Error al actualizar fase', 'error');
    }
  };

  const filteredProjects = useMemo(() => projects.filter(p => p.activo), [projects]);

  if (view === 'history' && detailProject) {
    return <ProjectTimeline project={detailProject} darkMode={darkMode} onBack={() => setView('kanban')} />;
  }

  if (detailProject && view !== 'form') {
    const currentIdx = phases.indexOf(detailProject.faseActual);
    const commission = commissions.find(c => c.id === detailProject.comisionId);
    const ponente = legislators.find(l => l.id === detailProject.ponenteId);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setDetailProject(null)} className={`flex items-center gap-2 text-sm font-bold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
          <ChevronLeft className="w-4 h-4" /> Volver al Tablero
        </button>

        <div className={`rounded-2xl border p-8 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${detailProject.origen === 'Comisión' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{detailProject.origen}</span>
              <h2 className="text-3xl font-black leading-tight">{detailProject.titulo}</h2>
              
              {detailProject.faseActual === 'Estudio en Comisión' ? (
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Asignar Comisión Responsable *</label>
                  <select 
                    value={detailProject.comisionId || ''} 
                    onChange={async (e) => {
                      const comId = e.target.value ? Number(e.target.value) : null;
                      const updatedProject = { ...detailProject, comisionId: comId };
                      await onSave(updatedProject);
                      setDetailProject(updatedProject);
                      addToast('Comisión asignada exitosamente', 'success');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-colors w-fit min-w-[240px] ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-700'}`}
                  >
                    <option value="">Seleccionar comisión...</option>
                    {commissions.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                commission && (
                  <div className={`flex items-center gap-2 p-2 px-3 rounded-xl w-fit border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <Gavel className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold opacity-70">{commission.nombre}</span>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('history')} className={`p-3 rounded-2xl border ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'} transition-colors`} title="Ver historial">
                <History className="w-6 h-6 opacity-40" />
              </button>
              <div className={`px-4 py-3 rounded-2xl border flex flex-col items-end ${getStagnationColor(detailProject.fechaActualizacion || detailProject.fechaIngreso)}`}>
                 <span className="text-[9px] uppercase font-black opacity-50">Estado</span>
                 <span className="text-xs font-bold">{getStagnationLabel(detailProject.fechaActualizacion || detailProject.fechaIngreso)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Fase Actual</p>
              <p className="text-sm font-black text-indigo-500">{detailProject.faseActual}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Ponente</p>
              <p className="text-sm font-bold">{ponente?.nombre || 'No asignado'}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Ingreso</p>
              <p className="text-sm font-bold opacity-60">{detailProject.fechaIngreso}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Documentación por Fases</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Recepción', key: null },
                { label: 'Estudio en Comisión', key: null },
                { label: '1ra Discusión', key: 'linkPrimeraDiscusion' },
                { label: 'Consulta Pública', key: 'linkConsultaPublica' },
                { label: '2da Discusión', key: 'linkSegundaDiscusion' },
                { label: '3ra Discusión/Aprobada', key: 'linkTerceraDiscusion' }
              ].map((fase) => (
                <div key={fase.label} className={`p-4 rounded-2xl border flex flex-col gap-3 justify-between ${darkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-40">{fase.label}</p>
                      {fase.key && detailProject[fase.key] ? (
                        <p className="text-xs font-bold text-indigo-500 truncate max-w-[150px]">Enlace Digital Activo</p>
                      ) : (
                        <p className="text-[9px] font-bold opacity-30">Sin enlace digital</p>
                      )}
                    </div>
                    {fase.key && detailProject[fase.key] && (
                      <a 
                        href={detailProject[fase.key]} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        title="Ver en Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  
                  {fase.key && (
                    <div className="relative">
                      <input 
                        type="url"
                        placeholder="Pegar enlace de Drive..."
                        value={detailProject[fase.key] || ''}
                        onChange={(e) => {
                          const newLink = e.target.value;
                          onSave({ ...detailProject, [fase.key]: newLink });
                          setDetailProject(prev => ({ ...prev, [fase.key]: newLink }));
                        }}
                        className={`w-full p-2 rounded-xl text-[10px] border outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                      />
                    </div>
                  )}

                  {/* Selector y visualizador de archivo local PDF de Bóveda */}
                  <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-dashed dark:border-gray-800">
                    <p className="text-[9px] font-black uppercase opacity-40">Archivo PDF Local</p>
                    {(() => {
                      const doc = (documents || []).find(d => d.entidadTipo === 'Project' && d.entidadId === detailProject.id && d.faseEtiqueta === fase.label && d.activo);
                      if (doc) {
                        return (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-500 truncate max-w-[120px]">{doc.nombreOriginal}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={async () => {
                                  try {
                                    await window.legisAPI.documents.openFile(doc.id);
                                    addToast('Archivo abierto con el visor del sistema', 'success');
                                  } catch (e) {
                                    addToast('Error al abrir el archivo local', 'error');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                                title="Abrir PDF"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={async () => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Desvincular PDF',
                                    message: '¿Desvincular este PDF del proyecto?',
                                    destructive: true,
                                    onConfirm: async () => {
                                      await deleteDocument(doc.id);
                                      addToast('Archivo desvinculado', 'warning');
                                    }
                                  });
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Desvincular PDF"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          onClick={async () => {
                            if (!window.legisAPI) return addToast('Solo disponible en la aplicación de escritorio', 'info');
                            const filePath = await window.legisAPI.dialog.openPdf();
                            if (filePath) {
                              try {
                                await window.legisAPI.documents.saveFile({
                                  filePath,
                                  entidadTipo: 'Project',
                                  entidadId: detailProject.id,
                                  faseEtiqueta: fase.label
                                });
                                if (reload) await reload();
                                addToast('PDF cargado exitosamente en Bóveda', 'success');
                              } catch (err) {
                                addToast('Error al archivar el PDF', 'error');
                              }
                            }
                          }}
                          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed text-[10px] font-black uppercase transition-colors cursor-pointer ${darkMode ? 'border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-indigo-500' : 'border-gray-200 hover:border-indigo-500 text-gray-500 hover:text-indigo-600 bg-gray-50/50'}`}
                        >
                          <Plus className="w-3.5 h-3.5" /> Adjuntar PDF Local
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {currentIdx < phases.length - 1 && (
              <button onClick={() => handleAdvancePhase(detailProject)} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-colors shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-xs">
                <ArrowRight className="w-5 h-5" /> Avanzar a {phases[currentIdx + 1]}
              </button>
            )}
            <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Eliminar proyecto', message: '¿Eliminar este proyecto permanentemente? Esta acción no se puede deshacer.', destructive: true, onConfirm: () => { onDelete(detailProject.id); setDetailProject(null); } })} className="px-6 py-5 text-red-500 border-2 border-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white transition-colors font-black uppercase tracking-widest text-xs">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
    }

  if (view === 'form') {
    return (
      <div className={`max-w-3xl mx-auto p-10 rounded-2xl border shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black">{editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
            <p className="text-sm opacity-40 font-bold uppercase tracking-widest">{editingId ? 'Actualizar Información' : 'Iniciativa Legislativa'}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3 ml-1">Título del Proyecto</label>
            <textarea 
              placeholder="Escribe el título institucional completo..." 
              data-testid="project-title-input"
              value={form.titulo} 
              onChange={e => setForm({...form, titulo: e.target.value})} 
              className={`w-full p-5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none h-40 text-lg font-bold leading-tight ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Origen</label>
              <select 
                value={form.origen} 
                onChange={e => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    origen: val,
                    faseActual: val === 'Ejecutivo / Órganos del Estado' ? 'Recepción' : 'Estudio en Comisión'
                  }));
                }} 
                className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
              >
                <option value="Comisión">Comisión Legislativa</option>
                <option value="Ejecutivo / Órganos del Estado">Ejecutivo / Órganos del Estado</option>
                <option value="Votantes">Iniciativa Popular</option>
              </select>
            </div>

            {form.origen === 'Comisión' && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Comisión Responsable</label>
                <select value={form.comisionId} onChange={e => setForm({...form, comisionId: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <option value="">Seleccionar...</option>
                  {commissions.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Legislador Ponente</label>
            <select value={form.ponenteId} onChange={e => setForm({...form, ponenteId: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <option value="">Seleccionar...</option>
              {legislators.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Etiquetas / Ejes Temáticos</label>
            <input 
              type="text" 
              placeholder="Ej: Salud, Presupuesto, Educación (separados por comas)" 
              value={form.tags || ''} 
              onChange={e => setForm({...form, tags: e.target.value})} 
              className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-bold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'}`} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Enlace 1ra Discusión (Opcional)</label>
              <input 
                type="url" 
                placeholder="Google Drive Link..." 
                value={form.linkPrimeraDiscusion} 
                onChange={e => setForm({...form, linkPrimeraDiscusion: e.target.value})} 
                className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Enlace Consulta Pública (Opcional)</label>
              <input 
                type="url" 
                placeholder="Google Drive Link..." 
                value={form.linkConsultaPublica} 
                onChange={e => setForm({...form, linkConsultaPublica: e.target.value})} 
                className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Enlace 2da Discusión (Opcional)</label>
              <input 
                type="url" 
                placeholder="Google Drive Link..." 
                value={form.linkSegundaDiscusion} 
                onChange={e => setForm({...form, linkSegundaDiscusion: e.target.value})} 
                className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Enlace 3ra Discusión (Opcional)</label>
              <input 
                type="url" 
                placeholder="Google Drive Link..." 
                value={form.linkTerceraDiscusion} 
                onChange={e => setForm({...form, linkTerceraDiscusion: e.target.value})} 
                className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
             <input 
               type="checkbox" 
               id="urgencia" 
               checked={!!form.urgenciaParlamentaria} 
               onChange={e => setForm({...form, urgenciaParlamentaria: e.target.checked ? 1 : 0})}
               className="w-5 h-5 rounded-lg text-indigo-600"
             />
             <label htmlFor="urgencia" className="text-xs font-black uppercase tracking-widest cursor-pointer opacity-70">Declarar Urgencia Parlamentaria</label>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={resetForm} className={`flex-1 py-5 rounded-2xl font-black transition-colors uppercase tracking-[0.2em] text-xs ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button 
              onClick={handleSave} 
              data-testid="btn-save-project"
              className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-colors shadow-2xl shadow-indigo-500/30 uppercase tracking-[0.2em] text-xs"
            >
              {editingId ? 'Guardar Cambios' : 'Registrar Proyecto'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="agenda-page-title" className="text-3xl font-black mb-1">Agenda Legislativa</h1>
          <p className={`text-sm font-bold opacity-40 uppercase tracking-widest`}>Control Parlamentario en Tiempo Real</p>
        </div>
        <div className="flex gap-4">
          <div className="flex p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-inner">
             <button onClick={() => setView('kanban')} className={`p-2.5 rounded-xl transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-xl text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}><Layout className="w-5 h-5" /></button>
             <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-xl text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}><Plus className="w-5 h-5 rotate-45" /></button>
          </div>
          <button 
            onClick={() => setView('form')} 
            data-testid="btn-new-project"
            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-colors shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phases.map((column) => {
              const columnProjects = filteredProjects.filter(p => p.faseActual === column);
              const isEmpty = columnProjects.length === 0;
              const hasActiveProject = columnProjects.length > 0;
              
              return (
                <div
                  key={column}
                  className={`flex flex-col rounded-2xl border transition-all duration-300 min-h-[260px] ${
                    hasActiveProject
                      ? (darkMode 
                          ? 'bg-indigo-950/20 border-indigo-500/80 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.01]' 
                          : 'bg-indigo-50/20 border-indigo-200 shadow-xl shadow-indigo-100/50 scale-[1.01]')
                      : (darkMode 
                          ? 'bg-gray-950/40 border-gray-800 opacity-60 hover:opacity-100 hover:scale-[1.005]' 
                          : 'bg-white border-gray-100 opacity-80 hover:opacity-100 hover:scale-[1.005]')
                  }`}
                >
                  <div className={`p-5 border-b flex items-center justify-between ${
                    hasActiveProject 
                      ? (darkMode ? 'border-indigo-500/30' : 'border-indigo-100') 
                      : (darkMode ? 'border-gray-800' : 'border-gray-100')
                  }`}>
                    <div className="flex items-center gap-2">
                      {hasActiveProject && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                      )}
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        hasActiveProject 
                          ? 'text-indigo-500' 
                          : 'opacity-40'
                      }`}>
                        {column}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-inner flex-shrink-0 ${
                      hasActiveProject 
                        ? 'bg-indigo-500 text-white' 
                        : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')
                    }`}>
                      {columnProjects.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-4 space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {isEmpty ? (
                      <div className="h-full flex items-center justify-center py-12">
                        <p className="text-[10px] uppercase font-black opacity-20 tracking-widest">Sin proyectos</p>
                      </div>
                    ) : (
                      columnProjects.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => setDetailProject(p)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 active:scale-95 ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/80' 
                              : 'bg-white border-gray-200 hover:border-indigo-300 shadow-sm hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-xs font-bold leading-snug mb-2 line-clamp-3 group-hover:text-indigo-500 transition-colors">{p.titulo}</p>
                          
                          {p.tags && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {p.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-[9px] font-bold opacity-40">
                                <Clock className="w-3 h-3" />
                                <span>{p.fechaActualizacion || p.fechaIngreso}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForm({ ...p, tags: p.tags || '' });
                                  setEditingId(p.id);
                                  setView('form');
                                }}
                                className="p-1 rounded-lg hover:bg-indigo-500/10 text-indigo-500 transition-colors"
                                title="Editar proyecto"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                              </button>
                            </div>
                            {p.urgenciaParlamentaria ? (
                              <div className="flex items-center gap-0.5 text-red-500">
                                <AlertCircle className="w-2.5 h-2.5 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Urgente</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto w-full">
          {filteredProjects.map(p => (
            <div 
              key={p.id} 
              onClick={() => setDetailProject(p)}
              className={`p-6 rounded-2xl border flex justify-between items-center cursor-pointer transition-all hover:shadow-xl ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${p.urgenciaParlamentaria ? 'bg-red-500/10 text-red-500' : 'bg-indigo-50/10 text-indigo-500'}`}>
                  {p.titulo.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm leading-tight">{p.titulo}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-30">{p.faseActual}</span>
                    <span className="w-1 h-1 rounded-full bg-indigo-500/30" />
                    <span className="text-[9px] font-bold opacity-30">{p.fechaIngreso}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm({ ...p, tags: p.tags || '' });
                    setEditingId(p.id);
                    setView('form');
                  }}
                  className={`p-3 rounded-2xl border transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800 text-indigo-400' : 'border-gray-100 hover:bg-gray-50 text-indigo-600'}`}
                >
                   <Plus className="w-5 h-5 rotate-45" />
                </button>
                <ArrowRight className="w-5 h-5 opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} darkMode={darkMode} destructive={confirmDialog.destructive} />
    </>
  );
};

export default AgendaModule;
