import React, { useState, useMemo } from 'react';
import { 
  Plus, ArrowRight, ChevronLeft, History, Trash2 
} from 'lucide-react';
import { dbService } from '../services/db';
import ProjectTimeline from './ProjectTimeline';
import { getRoutePhases, getStagnationColor, getStagnationLabel } from '../utils/helpers';

const AgendaModule = ({ projects, commissions, legislators, onSave, onDelete, darkMode, addToast, onNavigate, config }) => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ titulo: '', origen: 'Comisión', comision_id: '', ponente_id: '', fase_actual: 'Estudio en Comisión', urgencia_parlamentaria: false, fecha_ingreso: new Date().toISOString().split('T')[0] });
  const [detailProject, setDetailProject] = useState(null);

  const resetForm = () => { setForm({ titulo: '', origen: 'Comisión', comision_id: '', ponente_id: '', fase_actual: 'Estudio en Comisión', urgencia_parlamentaria: false, fecha_ingreso: new Date().toISOString().split('T')[0] }); setEditingId(null); setView('list'); };

  const handleSave = () => {
    if (!form.titulo.trim()) return addToast('Título requerido', 'error');
    onSave(editingId ? { ...form, id: editingId } : form);
    addToast('Proyecto guardado', 'success');
    resetForm();
  };

  const handleAdvancePhase = async (project) => {
    if (project.fase_actual === 'Sancionada') {
      addToast('Este proyecto ya está sancionado', 'info');
      return;
    }
    const phases = getRoutePhases(project.origen);
    const currentIdx = phases.indexOf(project.fase_actual);
    if (currentIdx >= phases.length - 1) {
      addToast('El proyecto ya está en su fase final', 'info');
      return;
    }

    const nextPhase = phases[currentIdx + 1];
    const now = new Date().toISOString().split('T')[0];
    const updated = { ...project, fase_actual: nextPhase, fecha_actualizacion: now };
    
    try {
      // Guardar versión del estado actual antes de avanzar
      await dbService.saveProjectVersion({
        project_id: project.id,
        version_label: project.fase_actual,
        mensaje: `Cambio de fase automático a ${nextPhase}`,
        snapshot: project,
        autor: config?.nombre_secretario || 'Sistema'
      });
      
      await onSave(updated);
      setDetailProject(updated);
      addToast(`Fase avanzada a: ${nextPhase}`, 'success');
    } catch (err) {
      addToast('Error al avanzar fase', 'error');
    }
  };

  const filteredProjects = useMemo(() => projects.filter(p => p.activo), [projects]);

  if (view === 'history' && detailProject) {
    return <ProjectTimeline project={detailProject} darkMode={darkMode} onBack={() => setView('list')} />;
  }

  if (detailProject) {
    const phases = getRoutePhases(detailProject.origen);
    const currentIdx = phases.indexOf(detailProject.fase_actual);
    const commission = commissions.find(c => c.id === detailProject.comision_id);
    const ponente = legislators.find(l => l.id === detailProject.ponente_id);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setDetailProject(null)} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>

        <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{detailProject.titulo}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${detailProject.origen === 'Comisión' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'}`}>{detailProject.origen}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('history')} className={`p-2 rounded-xl border ${darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'} transition-colors`} title="Ver historial">
                <History className="w-5 h-5 text-gray-500" />
              </button>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${getStagnationColor(detailProject.fecha_actualizacion || detailProject.fecha_ingreso)}`}>
                {getStagnationLabel(detailProject.fecha_actualizacion || detailProject.fecha_ingreso)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500">Fase Actual</p>
              <p className="text-sm font-bold">{detailProject.fase_actual}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500">Fecha Ingreso</p>
              <p className="text-sm font-medium">{detailProject.fecha_ingreso}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {currentIdx < phases.length - 1 && (
              <button onClick={() => handleAdvancePhase(detailProject)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4" /> Avanzar a {phases[currentIdx + 1]}
              </button>
            )}
            <button onClick={() => onDelete(detailProject.id)} className="px-4 py-3 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl border">
        <h2 className="text-xl font-bold mb-6">Nuevo Proyecto</h2>
        <div className="space-y-4">
          <input placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Origen</label>
              <select value={form.origen} onChange={e => setForm({...form, origen: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="Comisión">Comisión</option>
                <option value="Gobernación">Gobernación</option>
                <option value="Votantes">Votantes</option>
              </select>
            </div>
            {form.origen === 'Comisión' && (
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Seleccionar Comisión</label>
                <select value={form.comision_id} onChange={e => setForm({...form, comision_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {commissions.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Legislador Ponente</label>
            <select value={form.ponente_id} onChange={e => setForm({...form, ponente_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
              <option value="">Seleccionar...</option>
              {legislators.filter(l => l.activo).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={resetForm} className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">Guardar Proyecto</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda Legislativa</h1>
        <button onClick={() => setView('form')} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium"><Plus className="w-4 h-4 inline mr-2" /> Nuevo Proyecto</button>
      </div>
      <div className="space-y-3">
        {filteredProjects.map(p => (
          <div 
            key={p.id} 
            onClick={() => setDetailProject(p)}
            className="p-5 bg-white dark:bg-gray-900 border rounded-2xl flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition-all"
          >
            <div>
              <h3 className="font-bold">{p.titulo}</h3>
              <p className="text-xs text-gray-500">{p.fase_actual} • Ingreso: {p.fecha_ingreso}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgendaModule;
