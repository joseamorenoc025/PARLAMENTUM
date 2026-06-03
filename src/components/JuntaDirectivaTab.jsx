import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown, Users, BookOpen, Star, Plus, Trash2, Camera, Loader2,
  Calendar, Building2, AlertCircle, CheckCircle2
} from 'lucide-react';
import ConfirmDialog from './ui/ConfirmDialog';

const ROLES = [
  {
    id: 'presidente',
    label: 'Presidente(a)',
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    withBio: true,
    required: true
  },
  {
    id: 'vicepresidente',
    label: 'Vicepresidente(a)',
    icon: Star,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    withBio: true,
    required: true
  },
  {
    id: 'secretario',
    label: 'Secretario(a) de Cámara',
    icon: BookOpen,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    withBio: false,
    required: true
  },
  {
    id: 'subsecretario',
    label: 'Subsecretario(a) de Cámara',
    icon: Users,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    withBio: false,
    required: false // Opcional
  }
];

const emptyForm = {
  rol: 'presidente',
  nombre: '',
  foto: null,
  partidoPolitico: '',
  biografia: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: ''
};

const JuntaDirectivaTab = ({ darkMode, addToast }) => {
  const [junta, setJunta] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  const loadJunta = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.legisAPI.junta.getAll();
      setJunta(data || []);
    } catch (err) {
      addToast('Error al cargar Junta Directiva', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadJunta(); }, [loadJunta]);

  const handleSelectFoto = async () => {
    try {
      const result = await window.legisAPI.dialog.openImage();
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
      }
    } catch { addToast('Error al seleccionar foto', 'error'); }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return addToast('El nombre es obligatorio', 'error');
    if (!form.fechaInicio) return addToast('La fecha de inicio es obligatoria', 'error');

    setIsSaving(true);
    try {
      await window.legisAPI.junta.save({ ...form, id: editingId || undefined });
      addToast(editingId ? 'Cargo actualizado' : 'Cargo de Junta Directiva registrado', 'success');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadJunta();
    } catch (err) {
      addToast('Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover cargo',
      message: '¿Remover este cargo de la Junta Directiva? Esta acción no se puede deshacer.',
      destructive: true,
      onConfirm: async () => {
        try {
          await window.legisAPI.junta.delete(id);
          addToast('Cargo removido', 'warning');
          loadJunta();
        } catch { addToast('Error al eliminar', 'error'); }
      }
    });
  };

  const openEditForm = (member) => {
    setEditingId(member.id);
    setForm({
      rol: member.rol,
      nombre: member.nombre,
      foto: member.foto || null,
      partidoPolitico: member.partidoPolitico || '',
      biografia: member.biografia || '',
      fechaInicio: member.fechaInicio,
      fechaFin: member.fechaFin || ''
    });
    setShowForm(true);
  };

  const openNewForm = (rolId) => {
    setEditingId(null);
    setForm({ ...emptyForm, rol: rolId });
    setShowForm(true);
  };

  const selectedRole = ROLES.find(r => r.id === form.rol);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 opacity-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
        <span className="font-medium">Cargando Junta Directiva...</span>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-black text-sm">Junta Directiva de Cámara</h2>
            <p className={`text-[11px] opacity-60 mt-0.5`}>
              Los cargos activos se publican automáticamente en el portal ciudadano.
              Solo puede haber un titular activo por cargo.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de cargos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map(role => {
          const RoleIcon = role.icon;
          const member = junta.find(j => j.rol === role.id);

          return (
            <div
              key={role.id}
              className={`rounded-2xl border p-6 transition-colors ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              {/* Cargo header */}
              <div className="flex items-center justify-between mb-5">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${role.bg} ${role.border} border`}>
                  <RoleIcon className={`w-3.5 h-3.5 ${role.color}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${role.color}`}>
                    {role.label}
                    {!role.required && <span className="opacity-50 ml-1 normal-case font-medium">(Opcional)</span>}
                  </span>
                </div>
                {member ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400 opacity-30" />
                )}
              </div>

              {member ? (
                /* Miembro registrado */
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {member.foto ? (
                      <img
                        src={member.foto}
                        alt={member.nombre}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-700/20"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${role.bg}`}>
                        <span className={role.color}>{member.nombre.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-sm leading-tight">{member.nombre}</p>
                      {member.partidoPolitico && (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {member.partidoPolitico}
                        </span>
                      )}
                    </div>
                  </div>

                  {member.biografia && (
                    <p className={`text-[11px] leading-relaxed opacity-50 mb-4 line-clamp-2`}>
                      {member.biografia}
                    </p>
                  )}

                  <div className={`flex items-center gap-2 text-[10px] opacity-40 mb-4`}>
                    <Calendar className="w-3 h-3" />
                    <span>Desde {new Date(member.fechaInicio + 'T12:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(member)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Cargo vacante */
                <div className="flex flex-col items-center justify-center py-8">
                  <div className={`w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <Plus className="w-6 h-6 opacity-20" />
                  </div>
                  <p className="text-xs font-bold opacity-30 mb-4">Cargo Vacante</p>
                  <button
                    onClick={() => openNewForm(role.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${role.bg} ${role.color} hover:opacity-80`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Titular
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-8 shadow-2xl overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black">{editingId ? 'Editar Cargo' : 'Registrar Titular'}</h2>
                <p className="text-[11px] opacity-40 font-bold uppercase tracking-widest mt-0.5">Junta Directiva</p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Plus className="w-5 h-5 opacity-30 rotate-45" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Selector de Rol */}
              {!editingId && (
                <div>
                  <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Cargo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, rol: role.id }))}
                        className={`p-3 rounded-2xl border text-left text-[11px] font-bold transition-colors ${
                          form.rol === role.id
                            ? `${role.bg} ${role.border} ${role.color}`
                            : (darkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')
                        }`}
                      >
                        {role.label}
                        {!role.required && <span className="opacity-50 text-[9px] block">Opcional</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Foto */}
              <div className="flex justify-center">
                <div
                  onClick={handleSelectFoto}
                  className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80 overflow-hidden ${form.foto ? 'border-indigo-500' : (darkMode ? 'border-gray-700' : 'border-gray-200')}`}
                >
                  {form.foto ? (
                    <img src={form.foto} alt="Vista previa" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-[8px] font-bold text-gray-500 uppercase">Foto</span>
                    </>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Dip. María González"
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>

              {/* Partido y Biografía — solo para presidente/vicepresidente */}
              {selectedRole?.withBio && (
                <>
                  <div>
                    <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">Partido Político</label>
                    <input
                      value={form.partidoPolitico}
                      onChange={e => setForm(prev => ({ ...prev, partidoPolitico: e.target.value }))}
                      placeholder="Siglas o nombre del partido"
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">Biografía Corta</label>
                    <textarea
                      value={form.biografia}
                      onChange={e => setForm(prev => ({ ...prev, biografia: e.target.value }))}
                      placeholder="Resumen de trayectoria..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={e => setForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black opacity-40 uppercase tracking-widest mb-1.5">Fecha de Fin <span className="opacity-50 normal-case font-medium">(si aplica)</span></label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={e => setForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  disabled={isSaving}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Actualizar' : 'Registrar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} darkMode={darkMode} destructive={confirmDialog.destructive} />
    </>
  );
};

export default JuntaDirectivaTab;
