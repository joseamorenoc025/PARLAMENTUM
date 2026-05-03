import React, { useState, useMemo } from 'react';
import { 
  Plus, ArrowRight, ChevronLeft, History, Trash2, Layout, Clock, CheckCircle2, Gavel, Scale, AlertCircle
} from 'lucide-react';
import { dbService } from '../services/db';
import ProjectTimeline from './ProjectTimeline';
import { getStagnationColor, getStagnationLabel } from '../utils/helpers';

const AgendaModule = ({ projects, commissions, legislators, onSave, onDelete, darkMode, addToast, config }) => {
  const [view, setView] = useState('kanban'); // 'kanban', 'list', 'form', 'history'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ 
    titulo: '', 
    origen: 'Comisión', 
    comision_id: '', 
    ponente_id: '', 
    fase_actual: 'Estudio en Comisión', 
    urgencia_parlamentaria: 0, 
    fecha_ingreso: new Date().toISOString().split('T')[0] 
  });
  const [detailProject, setDetailProject] = useState(null);

  const resetForm = () => { 
    setForm({ 
      titulo: '', 
      origen: 'Comisión', 
      comision_id: '', 
      ponente_id: '', 
      fase_actual: 'Estudio en Comisión', 
      urgencia_parlamentaria: 0, 
      fecha_ingreso: new Date().toISOString().split('T')[0] 
    }); 
    setEditingId(null); 
    setView('kanban'); 
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return addToast('El título del proyecto es obligatorio', 'error');
    if (form.origen === 'Comisión' && !form.comision_id) return addToast('Debes seleccionar una comisión responsable', 'warning');
    
    const data = {
      ...form,
      comision_id: form.comision_id ? Number(form.comision_id) : null,
      ponente_id: form.ponente_id ? Number(form.ponente_id) : null,
      urgencia_parlamentaria: Number(form.urgencia_parlamentaria),
      fecha_actualizacion: new Date().toISOString().split('T')[0],
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

  const phases = ['Estudio en Comisión', '1ra Discusión', '2da Discusión', '3ra Discusión', 'Aprobada', 'Promulgada'];

  const handleAdvancePhase = async (project) => {
    const currentIdx = phases.indexOf(project.fase_actual);
    if (currentIdx === -1 || currentIdx >= phases.length - 1) {
      addToast('El proyecto ya alcanzó su fase final', 'info');
      return;
    }

    const nextPhase = phases[currentIdx + 1];
    const updated = { 
      ...project, 
      fase_actual: nextPhase, 
      fecha_actualizacion: new Date().toISOString().split('T')[0] 
    };
    
    try {
      await dbService.saveProjectVersion({
        project_id: project.id,
        version_label: project.fase_actual,
        mensaje: `Cambio de fase a ${nextPhase}`,
        snapshot: project,
        autor: config?.nombre_secretario || 'Sistema'
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
    const currentIdx = phases.indexOf(detailProject.fase_actual);
    const commission = commissions.find(c => c.id === detailProject.comision_id);
    const ponente = legislators.find(l => l.id === detailProject.ponente_id);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setDetailProject(null)} className={`flex items-center gap-2 text-sm font-bold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
          <ChevronLeft className="w-4 h-4" /> Volver al Tablero
        </button>

        <div className={`rounded-3xl border p-8 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${detailProject.origen === 'Comisión' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{detailProject.origen}</span>
              <h2 className="text-3xl font-black leading-tight">{detailProject.titulo}</h2>
              {commission && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800 w-fit border border-gray-100 dark:border-gray-700">
                  <Gavel className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold opacity-70">{commission.nombre}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('history')} className={`p-3 rounded-2xl border ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'} transition-colors`} title="Ver historial">
                <History className="w-6 h-6 opacity-40" />
              </button>
              <div className={`px-4 py-3 rounded-2xl border flex flex-col items-end ${getStagnationColor(detailProject.fecha_actualizacion || detailProject.fecha_ingreso)}`}>
                 <span className="text-[9px] uppercase font-black opacity-50">Estado</span>
                 <span className="text-xs font-bold">{getStagnationLabel(detailProject.fecha_actualizacion || detailProject.fecha_ingreso)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Fase Actual</p>
              <p className="text-sm font-black text-indigo-500">{detailProject.fase_actual}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Ponente</p>
              <p className="text-sm font-bold">{ponente?.nombre || 'No asignado'}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black opacity-30 mb-1 tracking-widest">Ingreso</p>
              <p className="text-sm font-bold opacity-60">{detailProject.fecha_ingreso}</p>
            </div>
          </div>

          <div className="flex gap-4">
            {currentIdx < phases.length - 1 && (
              <button onClick={() => handleAdvancePhase(detailProject)} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-xs">
                <ArrowRight className="w-5 h-5" /> Avanzar a {phases[currentIdx + 1]}
              </button>
            )}
            <button onClick={() => { if(window.confirm('¿Eliminar este proyecto permanentemente?')) { onDelete(detailProject.id); setDetailProject(null); } }} className="px-6 py-5 text-red-500 border-2 border-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className={`max-w-3xl mx-auto p-10 rounded-[2.5rem] border shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black">Nuevo Proyecto</h2>
            <p className="text-sm opacity-40 font-bold uppercase tracking-widest">Iniciativa Legislativa</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3 ml-1">Título del Proyecto</label>
            <textarea 
              placeholder="Escribe el título institucional completo..." 
              value={form.titulo} 
              onChange={e => setForm({...form, titulo: e.target.value})} 
              className={`w-full p-5 rounded-3xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-40 text-lg font-bold leading-tight ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Origen</label>
              <select value={form.origen} onChange={e => setForm({...form, origen: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <option value="Comisión">Comisión Legislativa</option>
                <option value="Gobernación">Gobernación / Ejecutivo</option>
                <option value="Votantes">Iniciativa Popular</option>
              </select>
            </div>

            {form.origen === 'Comisión' && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Comisión Responsable</label>
                <select value={form.comision_id} onChange={e => setForm({...form, comision_id: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <option value="">Seleccionar...</option>
                  {commissions.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black opacity-40 uppercase tracking-[0.2em] ml-1">Legislador Ponente</label>
            <select value={form.ponente_id} onChange={e => setForm({...form, ponente_id: e.target.value})} className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <option value="">Seleccionar...</option>
              {legislators.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
             <input 
               type="checkbox" 
               id="urgencia" 
               checked={!!form.urgencia_parlamentaria} 
               onChange={e => setForm({...form, urgencia_parlamentaria: e.target.checked ? 1 : 0})}
               className="w-5 h-5 rounded-lg text-indigo-600"
             />
             <label htmlFor="urgencia" className="text-xs font-black uppercase tracking-widest cursor-pointer opacity-70">Declarar Urgencia Parlamentaria</label>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={resetForm} className={`flex-1 py-5 rounded-2xl font-black transition-all uppercase tracking-[0.2em] text-xs ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-2xl shadow-indigo-500/30 uppercase tracking-[0.2em] text-xs">Registrar Proyecto</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">Agenda Legislativa</h1>
          <p className={`text-sm font-bold opacity-40 uppercase tracking-widest`}>Control Parlamentario en Tiempo Real</p>
        </div>
        <div className="flex gap-4">
          <div className="flex p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-inner">
             <button onClick={() => setView('kanban')} className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-xl text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}><Layout className="w-5 h-5" /></button>
             <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-xl text-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}><Plus className="w-5 h-5 rotate-45" /></button>
          </div>
          <button onClick={() => setView('form')} className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/30 uppercase tracking-widest text-xs">
            <Plus className="w-5 h-5" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-8 scrollbar-hide">
          <div className="flex gap-6 h-full min-w-max px-1">
            {phases.map(column => {
              const columnProjects = filteredProjects.filter(p => p.fase_actual === column);
              return (
                <div key={column} className={`w-[22rem] flex flex-col rounded-[2rem] border transition-all ${darkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                  <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{column}</h3>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black shadow-inner">{columnProjects.length}</span>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                    {columnProjects.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setDetailProject(p)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer group hover:shadow-2xl hover:-translate-y-1 active:scale-95 ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
                      >
                        <p className="text-[13px] font-black leading-snug mb-4 line-clamp-3">{p.titulo}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-30">
                             <Clock className="w-3.5 h-3.5" />
                             <span>{p.fecha_actualizacion || p.fecha_ingreso}</span>
                          </div>
                          {p.urgencia_parlamentaria ? (
                            <div className="flex items-center gap-1 text-red-500">
                               <AlertCircle className="w-3 h-3" />
                               <span className="text-[8px] font-black uppercase tracking-tighter">Urgencia</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {columnProjects.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] opacity-10">
                         <Scale className="w-8 h-8 mb-2" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Sin Proyectos</span>
                      </div>
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
              className={`p-6 rounded-3xl border flex justify-between items-center cursor-pointer transition-all hover:shadow-xl ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-gray-100 hover:border-indigo-200 shadow-sm'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${p.urgencia_parlamentaria ? 'bg-red-500/10 text-red-500' : 'bg-indigo-50/10 text-indigo-500'}`}>
                  {p.titulo.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm leading-tight">{p.titulo}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-30">{p.fase_actual}</span>
                    <span className="w-1 h-1 rounded-full bg-indigo-500/30" />
                    <span className="text-[9px] font-bold opacity-30">{p.fecha_ingreso}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaModule;
