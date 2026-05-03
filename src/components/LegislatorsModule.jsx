import React, { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import Modal from './ui/Modal';

const LegislatorsModule = ({ legislators, commissions, onSaveLegislator, onSaveCommission, onDeleteLegislator, onDeleteCommission, darkMode, addToast }) => {
  const [tab, setTab] = useState('legislators');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('legislator');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', partido_politico: '', contacto: '', notas: '' });
  const [commissionForm, setCommissionForm] = useState({ 
    nombre: '', 
    presidente_id: '', 
    vicepresidente_id: '',
    miembro_1_id: '',
    miembro_2_id: '',
    miembro_3_id: ''
  });

  const resetForm = () => { setForm({ nombre: '', partido_politico: '', contacto: '', notas: '' }); setEditingId(null); setShowForm(false); };
  const resetCommissionForm = () => { 
    setCommissionForm({ 
      nombre: '', 
      presidente_id: '', 
      vicepresidente_id: '',
      miembro_1_id: '',
      miembro_2_id: '',
      miembro_3_id: ''
    }); 
    setEditingId(null); 
    setShowForm(false); 
  };

  const handleSaveLegislator = () => {
    if (!form.nombre.trim()) return addToast('Nombre requerido', 'error');
    onSaveLegislator(editingId ? { ...form, id: editingId } : form);
    addToast('Legislador guardado', 'success');
    resetForm();
  };

  const handleSaveCommission = () => {
    if (!commissionForm.nombre.trim()) return addToast('Nombre requerido', 'error');
    const data = {
      ...commissionForm,
      id: editingId,
      presidente_id: commissionForm.presidente_id ? Number(commissionForm.presidente_id) : null,
      vicepresidente_id: commissionForm.vicepresidente_id ? Number(commissionForm.vicepresidente_id) : null,
      miembro_1_id: commissionForm.miembro_1_id ? Number(commissionForm.miembro_1_id) : null,
      miembro_2_id: commissionForm.miembro_2_id ? Number(commissionForm.miembro_2_id) : null,
      miembro_3_id: commissionForm.miembro_3_id ? Number(commissionForm.miembro_3_id) : null,
    };
    onSaveCommission(data);
    addToast('Comisión guardada', 'success');
    resetCommissionForm();
  };

  const getLegislatorName = (id) => legislators.find(l => l.id === id)?.nombre || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Legisladores y Comisiones</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Directorio y organización del cuerpo legislativo</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormType(tab === 'legislators' ? 'legislator' : 'commission'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Nuevo {tab === 'legislators' ? 'Legislador' : 'Comisión'}
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        <button onClick={() => setTab('legislators')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'legislators' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Legisladores</button>
        <button onClick={() => setTab('commissions')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'commissions' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Comisiones</button>
      </div>

      {tab === 'legislators' ? (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'} text-gray-500`}>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Nombre</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Partido</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Contacto</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {legislators.filter(l => l.activo).map(l => (
                  <tr key={l.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium">{l.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{l.partido_politico || 'Independiente'}</span>
                    </td>
                    <td className="px-6 py-4">{l.contacto || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onDeleteLegislator(l.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commissions.filter(c => c.activo).map(c => (
            <div key={c.id} className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></div>
                <button onClick={() => onDeleteCommission(c.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-lg mb-4">{c.nombre}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500">Presidente</span>
                  <span className="font-semibold">{getLegislatorName(c.presidente_id)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500">Vicepresidente</span>
                  <span className="font-medium">{getLegislatorName(c.vicepresidente_id)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 mb-1">M-I</p>
                    <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800" title={getLegislatorName(c.miembro_1_id)} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 mb-1">M-II</p>
                    <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800" title={getLegislatorName(c.miembro_2_id)} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 mb-1">M-III</p>
                    <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800" title={getLegislatorName(c.miembro_3_id)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Nuevo ${formType === 'legislator' ? 'Legislador' : 'Comisión'}`} darkMode={darkMode}>
        {formType === 'legislator' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Nombre Completo</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Partido Político</label>
              <input value={form.partido_politico} onChange={e => setForm({...form, partido_politico: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Partido Liberal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Contacto (Email/Tel)</label>
              <input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="ejemplo@correo.com" />
            </div>
            <button onClick={handleSaveLegislator} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all mt-2">Guardar Legislador</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Nombre de la Comisión</label>
              <input value={commissionForm.nombre} onChange={e => setCommissionForm({...commissionForm, nombre: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Comisión de Hacienda" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Presidente</label>
                <select value={commissionForm.presidente_id} onChange={e => setCommissionForm({...commissionForm, presidente_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Vicepresidente</label>
                <select value={commissionForm.vicepresidente_id} onChange={e => setCommissionForm({...commissionForm, vicepresidente_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-medium text-gray-500 uppercase">Miembros</label>
              <select value={commissionForm.miembro_1_id} onChange={e => setCommissionForm({...commissionForm, miembro_1_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Miembro I...</option>
                {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
              <select value={commissionForm.miembro_2_id} onChange={e => setCommissionForm({...commissionForm, miembro_2_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Miembro II...</option>
                {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
              <select value={commissionForm.miembro_3_id} onChange={e => setCommissionForm({...commissionForm, miembro_3_id: e.target.value})} className={`w-full p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="">Miembro III...</option>
                {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <button onClick={handleSaveCommission} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all mt-2">Guardar Comisión</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LegislatorsModule;
