import React, { useState } from 'react';
import { Plus, Trash2, Users, User, Shield, Phone, Mail } from 'lucide-react';
import Modal from './ui/Modal';

const LegislatorsModule = ({ legislators, commissions, onSaveLegislator, onSaveCommission, onDeleteLegislator, onDeleteCommission, darkMode, addToast }) => {
  const [tab, setTab] = useState('legislators');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('legislator');
  const [editingId, setEditingId] = useState(null);
  const [isCitizenM3, setIsCitizenM3] = useState(false);
  
  const [form, setForm] = useState({ nombre: '', partido_politico: '', contacto: '', notas: '' });
  const [commissionForm, setCommissionForm] = useState({ 
    nombre: '', 
    presidente_id: '', 
    vicepresidente_id: '',
    miembro_1_id: '',
    miembro_2_id: '',
    miembro_3_id: '',
    miembro_3_nombre: ''
  });

  const resetForm = () => { 
    setForm({ nombre: '', partido_politico: '', contacto: '', notas: '' }); 
    setEditingId(null); 
    setShowForm(false); 
  };
  
  const resetCommissionForm = () => { 
    setCommissionForm({ 
      nombre: '', 
      presidente_id: '', 
      vicepresidente_id: '',
      miembro_1_id: '',
      miembro_2_id: '',
      miembro_3_id: '',
      miembro_3_nombre: ''
    }); 
    setEditingId(null); 
    setShowForm(false);
    setIsCitizenM3(false);
  };

  const handleSaveLegislator = async () => {
    if (!form.nombre.trim()) return addToast('El nombre es obligatorio', 'error');
    try {
      await onSaveLegislator(editingId ? { ...form, id: editingId } : form);
      addToast(editingId ? 'Datos actualizados' : 'Legislador registrado', 'success');
      resetForm();
    } catch (err) {
      addToast('Error al guardar legislador', 'error');
    }
  };

  const handleSaveCommission = async () => {
    if (!commissionForm.nombre.trim()) return addToast('Nombre de comisión obligatorio', 'error');
    
    const data = {
      ...commissionForm,
      id: editingId,
      presidente_id: commissionForm.presidente_id ? Number(commissionForm.presidente_id) : null,
      vicepresidente_id: commissionForm.vicepresidente_id ? Number(commissionForm.vicepresidente_id) : null,
      miembro_1_id: commissionForm.miembro_1_id ? Number(commissionForm.miembro_1_id) : null,
      miembro_2_id: commissionForm.miembro_2_id ? Number(commissionForm.miembro_2_id) : null,
      miembro_3_id: isCitizenM3 ? null : (commissionForm.miembro_3_id ? Number(commissionForm.miembro_3_id) : null),
      miembro_3_nombre: isCitizenM3 ? (commissionForm.miembro_3_nombre || 'Ciudadano') : null,
      activo: 1
    };
    
    try {
      await onSaveCommission(data);
      addToast('Comisión guardada exitosamente', 'success');
      resetCommissionForm();
    } catch (err) {
      addToast('Error al guardar comisión', 'error');
    }
  };

  const getLegislatorName = (id) => legislators.find(l => l.id === id)?.nombre || '—';
  const getM3Display = (c) => c.miembro_3_nombre ? `${c.miembro_3_nombre} (Ciudadano)` : getLegislatorName(c.miembro_3_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Legisladores y Comisiones</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Directorio y organización del cuerpo legislativo</p>
        </div>
        <button 
          onClick={() => { 
            setFormType(tab === 'legislators' ? 'legislator' : 'commission');
            setShowForm(true); 
          }} 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Nuevo {tab === 'legislators' ? 'Legislador' : 'Comisión'}
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        <button 
          onClick={() => setTab('legislators')} 
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'legislators' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Legisladores
        </button>
        <button 
          onClick={() => setTab('commissions')} 
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'commissions' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Comisiones
        </button>
      </div>

      {tab === 'legislators' ? (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50'} text-gray-500`}>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Nombre</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Partido</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Contacto</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {legislators.filter(l => l.activo).map(l => (
                  <tr key={l.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                          {l.nombre.charAt(0)}
                        </div>
                        <span className="font-bold">{l.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        {l.partido_politico || 'Independiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs opacity-60 font-medium">{l.contacto || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(l.id); setForm(l); setShowForm(true); }} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                          <User className="w-4 h-4 opacity-40" />
                        </button>
                        <button onClick={() => { if(window.confirm('¿Eliminar legislador?')) onDeleteLegislator(l.id); }} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
            <div key={c.id} className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-5">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner"><Users className="w-6 h-6" /></div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(c.id); setCommissionForm(c); setIsCitizenM3(!!c.miembro_3_nombre); setShowForm(true); }} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><Shield className="w-4 h-4 opacity-40" /></button>
                  <button onClick={() => { if(window.confirm('¿Eliminar comisión?')) onDeleteCommission(c.id); }} className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-black text-lg mb-6 leading-tight">{c.nombre}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="opacity-40 font-bold uppercase tracking-widest text-[9px]">Presidente</span>
                  <span className="font-bold">{getLegislatorName(c.presidente_id)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-gray-50 dark:border-gray-800 pt-3">
                  <span className="opacity-40 font-bold uppercase tracking-widest text-[9px]">Vicepresidente</span>
                  <span className="font-medium">{getLegislatorName(c.vicepresidente_id)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full" title={`M-I: ${getLegislatorName(c.miembro_1_id)}`} />
                  <div className="bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full" title={`M-II: ${getLegislatorName(c.miembro_2_id)}`} />
                  <div className={`h-1.5 rounded-full ${c.miembro_3_nombre ? 'bg-emerald-500/40' : 'bg-gray-100 dark:bg-gray-800'}`} title={`M-III: ${getM3Display(c)}`} />
                </div>
                <p className="text-[10px] opacity-40 font-medium text-right">Miembros activos</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); resetCommissionForm(); }} title={formType === 'legislator' ? 'Registrar Legislador' : 'Configurar Comisión'} darkMode={darkMode}>
        {formType === 'legislator' ? (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Nombre y Apellido</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Dr. Juan Pérez" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Partido Político</label>
                <input value={form.partido_politico} onChange={e => setForm({...form, partido_politico: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Siglas o Nombre" />
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Contacto</label>
                <input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Teléfono o Email" />
              </div>
            </div>
            <button onClick={handleSaveLegislator} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all mt-2 shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs">Guardar Legislador</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Nombre de la Comisión</label>
              <input value={commissionForm.nombre} onChange={e => setCommissionForm({...commissionForm, nombre: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Hacienda y Presupuesto" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Presidente</label>
                <select value={commissionForm.presidente_id} onChange={e => setCommissionForm({...commissionForm, presidente_id: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Vicepresidente</label>
                <select value={commissionForm.vicepresidente_id} onChange={e => setCommissionForm({...commissionForm, vicepresidente_id: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 space-y-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Configuración Miembros</label>
                <div className="flex gap-2">
                   <button 
                    type="button" 
                    onClick={() => setIsCitizenM3(false)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${!isCitizenM3 ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 opacity-40'}`}
                  >
                    LEGISLADORES
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCitizenM3(true)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all ${isCitizenM3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 opacity-40'}`}
                  >
                    + CIUDADANO
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={commissionForm.miembro_1_id} onChange={e => setCommissionForm({...commissionForm, miembro_1_id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <option value="">Miembro I...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
                <select value={commissionForm.miembro_2_id} onChange={e => setCommissionForm({...commissionForm, miembro_2_id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <option value="">Miembro II...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>

              {isCitizenM3 ? (
                <input 
                  placeholder="Nombre completo del Ciudadano (M-III)" 
                  value={commissionForm.miembro_3_nombre} 
                  onChange={e => setCommissionForm({...commissionForm, miembro_3_nombre: e.target.value})} 
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                />
              ) : (
                <select value={commissionForm.miembro_3_id} onChange={e => setCommissionForm({...commissionForm, miembro_3_id: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <option value="">Miembro III (Legislador)...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              )}
            </div>

            <button onClick={handleSaveCommission} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs">Instalar Comisión</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LegislatorsModule;
