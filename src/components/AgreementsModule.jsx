import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Plus, Search, Download, Trash2, QrCode, 
  Loader2, Gavel, FileText, Calendar, ExternalLink, Filter
} from 'lucide-react';
import { dbService } from '../services/db';
import EmptyState from './ui/EmptyState';

const AgreementsModule = ({ darkMode, addToast, sessions = [] }) => {
  const [agreements, setAgreements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    numeroCorrelativo: '',
    fecha: new Date().toISOString().split('T')[0],
    objeto: '',
    sesionId: '',
    driveLink: '',
    localFilePath: null,
    localFileName: ''
  });

  const loadAgreements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getAgreements();
      setAgreements(data);
    } catch (err) {
      addToast('Error al cargar acuerdos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const handleSelectFile = async () => {
    if (!window.legisAPI) return addToast('Solo disponible en la aplicación de escritorio', 'info');
    const filePath = await window.legisAPI.invoke('dialog:open-pdf');
    if (filePath) {
      setForm(prev => ({
        ...prev,
        localFilePath: filePath,
        localFileName: filePath.split(/[\\/]/).pop(),
        driveLink: ''
      }));
    }
  };

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const handleSave = async () => {
    if (!form.numeroCorrelativo || !form.objeto || !form.fecha) {
      addToast('El número, fecha y objeto son obligatorios', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...form,
        id: editingId,
        sesionId: form.sesionId ? Number(form.sesionId) : null,
        activo: 1
      };
      
      await dbService.saveAgreement(data);
      addToast(editingId ? 'Acuerdo actualizado' : 'Acuerdo registrado exitosamente', 'success');
      
      setShowForm(false);
      setEditingId(null);
      setForm({
        numeroCorrelativo: '',
        fecha: new Date().toISOString().split('T')[0],
        objeto: '',
        sesionId: '',
        driveLink: '',
        localFilePath: null,
        localFileName: ''
      });
      loadAgreements();
    } catch (err) {
      addToast('Error al guardar el acuerdo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este acuerdo permanentemente?')) return;
    try {
      await dbService.deleteAgreement(id);
      addToast('Acuerdo eliminado', 'warning');
      loadAgreements();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const handleEdit = (agreement) => {
    setEditingId(agreement.id);
    setForm({
      numeroCorrelativo: agreement.numeroCorrelativo,
      fecha: agreement.fecha,
      objeto: agreement.objeto,
      sesionId: agreement.sesionId || '',
      driveLink: agreement.driveLink || '',
      localFilePath: null,
      localFileName: ''
    });
    setShowForm(true);
  };

  const showQR = async (agreement) => {
    if (!agreement.driveLink) return addToast('Este acuerdo no tiene enlace digital', 'info');
    try {
      const dataURL = await window.legisAPI.qr.generate(agreement.driveLink);
      const win = window.open();
      win.document.write(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
          <h2 style="margin-bottom:10px;">Acuerdo de Cámara: ${agreement.numeroCorrelativo}</h2>
          <p style="color:#666;margin-bottom:20px;max-width:500px;">${agreement.objeto}</p>
          <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
            <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
          </div>
          <p style="margin-top:20px;font-size:14px;color:#888;">Escanea para ver el documento oficial</p>
          <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
        </div>
      `);
    } catch (err) {
      addToast('Error al generar QR', 'error');
    }
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter(a => 
      a.activo && (
        a.numeroCorrelativo.toLowerCase().includes(search.toLowerCase()) || 
        a.objeto.toLowerCase().includes(search.toLowerCase())
      )
    ).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [agreements, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Acuerdos de Cámara</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Control y seguimiento de decisiones plenarias</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Acuerdo
        </button>
      </div>

      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por número u objeto del acuerdo..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="font-medium">Cargando acuerdos...</p>
        </div>
      ) : agreements.length === 0 ? (
        <EmptyState 
          icon={Gavel}
          title="Sin acuerdos registrados"
          description="Comience registrando los acuerdos tomados en las sesiones de cámara."
          action={{
            label: "Registrar primer acuerdo",
            onClick: () => setShowForm(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgreements.map(agreement => (
            <div key={agreement.id} className={`group rounded-2xl border p-6 transition-all hover:shadow-xl ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Expediente {agreement.numeroCorrelativo}</span>
                  <div className="flex items-center gap-2 text-xs opacity-40 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(agreement.fecha).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => showQR(agreement)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-50 text-gray-500'}`} title="QR Acceso">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(agreement)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-indigo-400' : 'hover:bg-gray-50 text-indigo-600'}`} title="Editar">
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <button onClick={() => handleDelete(agreement.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-bold leading-relaxed mb-6 line-clamp-3">
                {agreement.objeto}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-dashed dark:border-gray-800">
                <div className="flex items-center gap-2">
                   {agreement.sesionId ? (
                     <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-tighter">
                        <FileText className="w-3 h-3" />
                        Vinculado a Sesión
                     </div>
                   ) : (
                     <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest italic">Sin sesión vinculada</span>
                   )}
                </div>
                {agreement.driveLink && (
                  <a 
                    href={agreement.driveLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-500 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver Digital
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-8 shadow-2xl animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">{editingId ? 'Editar Acuerdo' : 'Nuevo Acuerdo'}</h2>
                <p className="text-xs opacity-40 font-bold uppercase tracking-widest">Protocolo de Decisión Plenaria</p>
              </div>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Trash2 className="w-5 h-5 opacity-20 rotate-45" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">N° Correlativo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 001-2024"
                    value={form.numeroCorrelativo}
                    onChange={e => setForm({...form, numeroCorrelativo: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Fecha de Acuerdo</label>
                  <input 
                    type="date" 
                    value={form.fecha}
                    onChange={e => setForm({...form, fecha: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Objeto / Descripción</label>
                <textarea 
                  placeholder="Escriba el objeto detallado del acuerdo..."
                  value={form.objeto}
                  onChange={e => setForm({...form, objeto: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold h-32 resize-none leading-relaxed ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Sesión Vinculada (Opcional)</label>
                <select 
                  value={form.sesionId}
                  onChange={e => setForm({...form, sesionId: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                >
                  <option value="">Seleccionar sesión...</option>
                  {sessions.filter(s => s.activo).map(s => (
                    <option key={s.id} value={s.id}>{s.tipo} {s.numeroCorrelativo} ({s.fecha})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Archivo PDF Local <span className="normal-case opacity-60">(opcional)</span></label>
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${
                    form.localFilePath
                      ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                      : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                  }`}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{form.localFilePath ? form.localFileName : 'Seleccionar PDF desde mi PC...'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Enlace de Google Drive <span className="normal-case opacity-60">(o pegar URL)</span></label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/..."
                  value={form.driveLink}
                  onChange={e => setForm({...form, driveLink: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); }} 
                disabled={isSaving}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Actualizar' : 'Registrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementsModule;
