import React, { useState } from 'react';
import { Plus, Trash2, Users, User, Shield, Phone, Mail, UserPlus, FileText, Camera, QrCode, Crown } from 'lucide-react';
import Modal from './ui/Modal';
import EmptyState from './ui/EmptyState';
import JuntaDirectivaTab from './JuntaDirectivaTab';

const LegislatorsModule = ({ legislators, commissions, onSaveLegislator, onSaveCommission, onDeleteLegislator, onDeleteCommission, darkMode, addToast }) => {
  const [tab, setTab] = useState('legislators');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('legislator');
  const [editingId, setEditingId] = useState(null);
  const [isCitizenM3, setIsCitizenM3] = useState(false);
  
  const [form, setForm] = useState({ nombre: '', partidoPolitico: '', contacto: '', notas: '', biografia: '', foto: '' });
  const [commissionForm, setCommissionForm] = useState({ 
    nombre: '', 
    presidenteId: '', 
    vicepresidenteId: '',
    miembro1Id: '',
    miembro2Id: '',
    miembro3Id: '',
    miembro3Nombre: ''
  });

  const resetForm = () => { 
    setForm({ nombre: '', partidoPolitico: '', contacto: '', notas: '', biografia: '', foto: '' }); 
    setEditingId(null); 
    setShowForm(false); 
  };
  
  const resetCommissionForm = () => { 
    setCommissionForm({ 
      nombre: '', 
      presidenteId: '', 
      vicepresidenteId: '',
      miembro1Id: '',
      miembro2Id: '',
      miembro3Id: '',
      miembro3Nombre: ''
    }); 
    setEditingId(null); 
    setShowForm(false);
    setIsCitizenM3(false);
  };

  const handleSelectFoto = async () => {
    try {
      const result = await window.legisAPI.invoke('dialog:open-image');
      if (result) {
        const bytes = result.buffer instanceof Uint8Array ? result.buffer : new Uint8Array(Object.values(result.buffer));
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        const ext = result.filePath.split('.').pop().toLowerCase();
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setForm(prev => ({ ...prev, foto: dataUrl }));
        addToast('Foto seleccionada', 'success');
      }
    } catch (err) {
      addToast('Error al seleccionar foto', 'error');
    }
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

  const showLegislatorQR = async (legislator) => {
    try {
      // El QR apunta a la subpage del portal ciudadano en GitHub Pages
      // Ejemplo: https://owner.github.io/repo/public/portal/?id=123
      const repoInfo = await window.legisAPI.invoke('sync:github:get-repo');
      const url = `https://${repoInfo.owner}.github.io/${repoInfo.repo}/public/portal/?id=${legislator.id}`;
      
      const dataURL = await window.legisAPI.qr.generate(url);
      const win = window.open();
      win.document.write(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
          <h2 style="margin-bottom:10px;">Conoce a tu Legislador: ${legislator.nombre}</h2>
          <p style="color:#666;margin-bottom:20px;">Escanea para ver perfil público y actividad legislativa</p>
          <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
            <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
          </div>
          <p style="margin-top:20px;font-size:14px;color:#888;">PARLAMENTUM • Transparencia</p>
          <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
        </div>
      `);
    } catch (err) {
      addToast('Error al generar QR', 'error');
    }
  };

  const handleSaveCommission = async () => {
    if (!commissionForm.nombre.trim()) return addToast('Nombre de comisión obligatorio', 'error');
    
    const data = {
      ...commissionForm,
      id: editingId,
      presidenteId: commissionForm.presidenteId ? Number(commissionForm.presidenteId) : null,
      vicepresidenteId: commissionForm.vicepresidenteId ? Number(commissionForm.vicepresidenteId) : null,
      miembro1Id: commissionForm.miembro1Id ? Number(commissionForm.miembro1Id) : null,
      miembro2Id: commissionForm.miembro2Id ? Number(commissionForm.miembro2Id) : null,
      miembro3Id: isCitizenM3 ? null : (commissionForm.miembro3Id ? Number(commissionForm.miembro3Id) : null),
      miembro3Nombre: isCitizenM3 ? (commissionForm.miembro3Nombre || 'Ciudadano') : null,
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
  const getM3Display = (c) => c.miembro3Nombre ? `${c.miembro3Nombre} (Ciudadano)` : getLegislatorName(c.miembro3Id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Legisladores y Comisiones</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Directorio y organización del cuerpo legislativo</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              try {
                const repoInfo = await window.legisAPI.invoke('sync:github:get-repo');
                const url = `https://${repoInfo.owner}.github.io/${repoInfo.repo}/public/portal/?view=legislators`;
                const dataURL = await window.legisAPI.qr.generate(url);
                const win = window.open();
                win.document.write(`
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
                    <h1 style="margin-bottom:10px;">Conoce a tus Legisladores</h1>
                    <p style="color:#666;margin-bottom:20px;">Escanea para ver el directorio completo y perfiles públicos</p>
                    <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
                      <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
                    </div>
                    <p style="margin-top:20px;font-size:14px;color:#888;">PARLAMENTUM • Transparencia</p>
                    <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
                  </div>
                `);
              } catch (e) { addToast('Error al generar QR Portal', 'error'); }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            <QrCode className="w-4 h-4 text-indigo-500" /> QR Portal Público
          </button>
          {tab !== 'junta' && (
            <button 
              onClick={() => { 
                setFormType(tab === 'legislators' ? 'legislator' : 'commission');
                setShowForm(true); 
              }} 
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Nuevo {tab === 'legislators' ? 'Legislador' : 'Comisión'}
            </button>
          )}
        </div>
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
        <button 
          onClick={() => setTab('junta')} 
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${tab === 'junta' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Crown className="w-3.5 h-3.5" />
          Junta Directiva
        </button>
      </div>

      {tab === 'legislators' && (
        legislators.filter(l => l.activo).length === 0 ? (
          <EmptyState 
            icon={UserPlus}
            title="Directorio de legisladores vacío"
            description="Registre a los miembros activos para gestionar sesiones, votaciones y directorio de transparencia."
            action={{
              label: "Agregar legislador",
              onClick: () => { 
                setFormType('legislator');
                setShowForm(true); 
              }
            }}
            dataTestId="empty-state-legisladores"
          />
        ) : (
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
                          {l.foto ? (
                            <img src={l.foto} alt={l.nombre} className="w-8 h-8 rounded-lg object-cover border border-gray-700/50" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                              {l.nombre.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold block">{l.nombre}</span>
                            {l.biografia && <p className="text-[10px] opacity-40 truncate max-w-[150px]">{l.biografia}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {l.partidoPolitico || 'Independiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs opacity-60 font-medium">{l.contacto || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => showLegislatorQR(l)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="QR Perfil Público">
                            <QrCode className="w-4 h-4 opacity-40 text-indigo-500" />
                          </button>
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
        )
      )}

      {tab === 'commissions' && (
        commissions.filter(c => c.activo).length === 0 ? (
          <div className={`max-w-2xl mx-auto p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 shadow-sm'} space-y-6`}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">No se han configurado comisiones</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Las comisiones organizan el trabajo legislativo. Inicie configurando la primera comisión a continuación.
              </p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Nombre de la Comisión</label>
                <input value={commissionForm.nombre} onChange={e => setCommissionForm({...commissionForm, nombre: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Hacienda y Presupuesto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Presidente</label>
                  <select value={commissionForm.presidenteId} onChange={e => setCommissionForm({...commissionForm, presidenteId: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option value="">Seleccionar...</option>
                    {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Vicepresidente</label>
                  <select value={commissionForm.vicepresidenteId} onChange={e => setCommissionForm({...commissionForm, vicepresidenteId: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                    <option value="">Seleccionar...</option>
                    {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/30 space-y-4 border border-gray-100 dark:border-gray-800">
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
                  <select value={commissionForm.miembro1Id} onChange={e => setCommissionForm({...commissionForm, miembro1Id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <option value="">Miembro I...</option>
                    {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                  <select value={commissionForm.miembro2Id} onChange={e => setCommissionForm({...commissionForm, miembro2Id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <option value="">Miembro II...</option>
                    {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>

                {isCitizenM3 ? (
                  <input 
                    placeholder="Nombre completo del Ciudadano (M-III)" 
                    value={commissionForm.miembro3Nombre} 
                    onChange={e => setCommissionForm({...commissionForm, miembro3Nombre: e.target.value})} 
                    className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  />
                ) : (
                  <select value={commissionForm.miembro3Id} onChange={e => setCommissionForm({...commissionForm, miembro3Id: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <option value="">Miembro III (Legislador)...</option>
                    {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                )}
              </div>

              <button onClick={handleSaveCommission} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs">Instalar Comisión</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commissions.filter(c => c.activo).map(c => (
              <div key={c.id} className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-indigo-500/30' : 'bg-white border-gray-200 hover:border-indigo-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner"><Users className="w-6 h-6" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(c.id); setCommissionForm(c); setIsCitizenM3(!!c.miembro3Nombre); setShowForm(true); }} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><Shield className="w-4 h-4 opacity-40" /></button>
                    <button onClick={() => { if(window.confirm('¿Eliminar comisión?')) onDeleteCommission(c.id); }} className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-black text-lg mb-6 leading-tight">{c.nombre}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-40 font-bold uppercase tracking-widest text-[9px]">Presidente</span>
                    <span className="font-bold">{getLegislatorName(c.presidenteId)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-50 dark:border-gray-800 pt-3">
                    <span className="opacity-40 font-bold uppercase tracking-widest text-[9px]">Vicepresidente</span>
                    <span className="font-medium">{getLegislatorName(c.vicepresidenteId)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full" title={`M-I: ${getLegislatorName(c.miembro1Id)}`} />
                    <div className="bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full" title={`M-II: ${getLegislatorName(c.miembro2Id)}`} />
                    <div className={`h-1.5 rounded-full ${c.miembro3Nombre ? 'bg-emerald-500/40' : 'bg-gray-100 dark:bg-gray-800'}`} title={`M-III: ${getM3Display(c)}`} />
                  </div>
                  <p className="text-[10px] opacity-40 font-medium text-right">Miembros activos</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'junta' && (
        <JuntaDirectivaTab darkMode={darkMode} addToast={addToast} />
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); resetCommissionForm(); }} title={formType === 'legislator' ? 'Registrar Legislador' : 'Configurar Comisión'} darkMode={darkMode}>
        {formType === 'legislator' ? (
          <div className="space-y-5">
            <div className="flex justify-center mb-2">
              <div 
                onClick={handleSelectFoto}
                className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-500/5 hover:border-indigo-500/50 relative overflow-hidden ${form.foto ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}
              >
                {form.foto ? (
                  <img src={form.foto} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Foto</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Nombre y Apellido</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Ej: Dr. Juan Pérez" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Partido Político</label>
                <input value={form.partidoPolitico} onChange={e => setForm({...form, partidoPolitico: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Siglas o Nombre" />
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Contacto</label>
                <input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Teléfono o Email" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Biografía Corta</label>
              <textarea 
                value={form.biografia} 
                onChange={e => setForm({...form, biografia: e.target.value})} 
                className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px] resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} 
                placeholder="Resumen de trayectoria y formación..." 
              />
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
                <select value={commissionForm.presidenteId} onChange={e => setCommissionForm({...commissionForm, presidenteId: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="">Seleccionar...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black opacity-40 mb-1.5 uppercase tracking-widest ml-1">Vicepresidente</label>
                <select value={commissionForm.vicepresidenteId} onChange={e => setCommissionForm({...commissionForm, vicepresidenteId: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
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
                <select value={commissionForm.miembro1Id} onChange={e => setCommissionForm({...commissionForm, miembro1Id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <option value="">Miembro I...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
                <select value={commissionForm.miembro2Id} onChange={e => setCommissionForm({...commissionForm, miembro2Id: e.target.value})} className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <option value="">Miembro II...</option>
                  {legislators.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>

              {isCitizenM3 ? (
                <input 
                  placeholder="Nombre completo del Ciudadano (M-III)" 
                  value={commissionForm.miembro3Nombre} 
                  onChange={e => setCommissionForm({...commissionForm, miembro3Nombre: e.target.value})} 
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                />
              ) : (
                <select value={commissionForm.miembro3Id} onChange={e => setCommissionForm({...commissionForm, miembro3Id: e.target.value})} className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
