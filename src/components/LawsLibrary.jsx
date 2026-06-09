import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Download, Trash2, QrCode, 
  Loader2, Scale, ExternalLink, FileText, ShieldCheck, FileCheck
} from 'lucide-react';
import { dbService } from '../services/db';
import EmptyState from './ui/EmptyState';
import HashDisplay from './ui/HashDisplay';
import ConfirmDialog from './ui/ConfirmDialog';
import useDebounce from '../hooks/useDebounce';

const LawsLibrary = ({ darkMode, addToast, onDataChange }) => {
  const [laws, setLaws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });
  const [applyIntegritySeal, setApplyIntegritySeal] = useState(true);
  const debouncedSearch = useDebounce(search);
  
  const [form, setForm] = useState({
    titulo: '',
    gaceta: 'Ordinaria',
    numero: '',
    anio: new Date().getFullYear(),
    fechaPublicacion: new Date().toISOString().split('T')[0],
    driveLink: '',
    localFilePath: null,
    localFileName: '',
    fileHash: '',
    tags: ''
  });

  const loadLaws = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const dbLaws = await dbService.getLaws();
      setLaws(dbLaws);
    } catch (err) {
      addToast('Error al cargar leyes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  React.useEffect(() => {
    loadLaws();
  }, [loadLaws]);

  const handleSelectFile = async () => {
    const filePath = await window.legisAPI.dialog.openPdf();
    if (filePath) {
      const fileName = filePath.split(/[\\/]/).pop();
      setForm(prev => ({
        ...prev,
        localFilePath: filePath,
        localFileName: fileName,
        driveLink: '',
        fileHash: '' // Se recalculará automáticamente
      }));

      // Auto-calcular SHA si el toggle está activo
      if (applyIntegritySeal) {
        try {
          const hash = await window.legisAPI.app.fileHash(filePath);
          setForm(prev => ({ ...prev, fileHash: hash }));
        } catch (err) {
          console.warn('Hash calculation failed:', err);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!form.titulo || (!form.driveLink && !form.localFilePath) || !form.anio) {
      addToast('Título, Año y un Documento (Enlace o Archivo) son requeridos', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await window.legisAPI.laws.import({
        metadata: {
          id: editingId,
          titulo: form.titulo,
          gaceta: form.gaceta,
          numero: form.numero,
          anio: parseInt(form.anio),
          fechaPublicacion: form.fechaPublicacion,
          driveLink: form.driveLink,
          localFilePath: form.localFilePath,
          fileHash: form.fileHash,
          tags: form.tags
        }
      });

      addToast(editingId ? 'Ley actualizada exitosamente' : 'Ley registrada exitosamente', 'success');
      setShowForm(false);
      setEditingId(null);
      setForm({ 
        titulo: '', 
        gaceta: 'Ordinaria', 
        numero: '',
        anio: new Date().getFullYear(), 
        fechaPublicacion: new Date().toISOString().split('T')[0],
        driveLink: '',
        localFilePath: null,
        localFileName: '',
        fileHash: '',
        tags: ''
      });
      loadLaws();
    } catch (err) {
      addToast(err.message || 'Error al guardar la ley', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar ley',
      message: '¿Eliminar esta ley de la biblioteca? Esta acción no se puede deshacer.',
      destructive: true,
      onConfirm: async () => {
        try {
          await dbService.deleteLaw(id);
          addToast('Ley eliminada', 'warning');
          loadLaws();
          onDataChange?.();
        } catch (err) {
          addToast('Error al eliminar', 'error');
        }
      }
    });
  };

  const handleAudit = async (law) => {
    if (!law.fileHash) {
      addToast('Esta ley no tiene un sello de integridad registrado.', 'info');
      return;
    }

    try {
      const filePath = await window.legisAPI.dialog.openPdf();
      if (!filePath) return;

      const currentHash = await window.legisAPI.app.fileHash(filePath);
      
      if (currentHash === law.fileHash) {
        addToast('✅ Integridad Confirmada: El documento coincide con el sello original.', 'success');
      } else {
        addToast('❌ Alerta de Integridad: El documento ha sido modificado o es incorrecto.', 'error');
      }
    } catch (err) {
      addToast('Error durante la auditoría', 'error');
    }
  };

  const showQR = async (law) => {
    try {
      const repoInfo = await window.legisAPI.sync.github.getRepo();
      const isUserPage = repoInfo.repo.toLowerCase() === `${repoInfo.owner.toLowerCase()}.github.io`;
      const baseUrl = isUserPage 
        ? `https://${repoInfo.repo}/public/portal/`
        : `https://${repoInfo.owner}.github.io/${repoInfo.repo}/public/portal/`;

      const portalUrl = `${baseUrl}?q=${encodeURIComponent(law.titulo)}`;
      const dataURL = await window.legisAPI.qr.generate(portalUrl);
      
      const win = window.open();
      win.document.write(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
          <h2 style="margin-bottom:10px;">Acceso Digital: ${law.titulo}</h2>
          <p style="color:#666;margin-bottom:20px;">Gaceta ${law.expediente}</p>
          <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
            <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
          </div>
          <p style="margin-top:20px;font-size:14px;color:#888;">Escanea para ver en el Portal Ciudadano</p>
          <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
        </div>
      `);
    } catch (err) {
      addToast('Error al generar QR', 'error');
    }
  };

  const handleEdit = (law) => {
    try {
      setEditingId(law.id);
      const cleanDriveLink = (link) => link ? link.replace('Enlace de descarga: ', '') : '';
      const safeDrive = law.driveLink ?? law.drive_link;
      const cleanedContenido = law.contenido ? cleanDriveLink(law.contenido) : '';
      setForm({
        titulo: law.titulo || '',
        gaceta: law.tipo || law.gaceta || 'Ordinaria',
        numero: law.numero || '',
        anio: law.anio || (law.fechaPublicacion ? new Date(law.fechaPublicacion).getFullYear() : new Date().getFullYear()),
        fechaPublicacion: law.fechaPublicacion || law.fecha_publicacion || '',
        driveLink: safeDrive || cleanedContenido || law.link_drive || '',
        fileHash: law.fileHash || law.file_hash || '',
        localFilePath: '',
        tags: law.tags || ''
      });
      setShowForm(true);
    } catch (err) {
      addToast('Error al cargar la ley para edición', 'error');
    }
  };

  const filteredLaws = useMemo(() => {
    return laws.filter(l => 
      (l.titulo.toLowerCase().includes(debouncedSearch.toLowerCase()) || (l.expediente && l.expediente.includes(debouncedSearch))) &&
      (!filterType || l.tipo === filterType)
    );
  }, [laws, debouncedSearch, filterType]);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="laws-page-title" className="text-2xl font-bold mb-1">Biblioteca de Leyes</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión ligera vinculada a Google Drive y códigos QR</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          data-testid="btn-open-law-form"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar Ley
        </button>
      </div>

      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por título o gaceta..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
            />
          </div>
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
          >
            <option value="">Todas las gacetas</option>
            <option value="Ordinaria">Ordinaria</option>
            <option value="Extraordinaria">Extraordinaria</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p>Cargando biblioteca...</p>
        </div>
      ) : laws.length === 0 ? (
        <EmptyState 
          icon={Scale}
          title="Biblioteca legislativa vacía"
          description="Registre leyes pegando el enlace de Google Drive para habilitar la búsqueda y códigos QR."
          action={{
            label: "Registrar ley",
            onClick: () => setShowForm(true)
          }}
          dataTestId="empty-state-leyes"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLaws.length === 0 ? (
             <div className="col-span-full py-20 text-center opacity-50">
                <Search className="w-10 h-10 mx-auto mb-4" />
                <p>No se encontraron resultados</p>
             </div>
          ) : filteredLaws.map(law => (
            <div key={law.id} className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  {law.fileHash && (
                    <button onClick={() => handleAudit(law)} className={`p-2 rounded-lg transition-colors text-emerald-500 ${darkMode ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50'}`} title="Auditar Integridad">
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => showQR(law)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Ver Código QR">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(law)} className={`p-2 rounded-lg transition-colors text-indigo-500 ${darkMode ? 'hover:bg-indigo-500/10' : 'hover:bg-indigo-50'}`} title="Editar Ley">
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <button onClick={() => handleDelete(law.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 line-clamp-2">{law.titulo}</h3>
              <p className={`text-xs ${law.tags ? 'mb-2' : 'mb-4'} font-medium ${law.tipo === 'Extraordinaria' ? 'text-amber-500' : 'text-indigo-500'}`}>
                Gaceta {law.tipo} {law.numero ? `#${law.numero}` : ''} ({law.anio})
              </p>

              {law.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {law.tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                    <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className={`p-3 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                  <span>{law.rutaPdf ? 'Documento Local:' : 'Enlace de Respaldo:'}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  {law.rutaPdf ? (
                    <FileText className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <ExternalLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                  )}
                  <span className="text-xs truncate text-gray-500 italic">
                    {law.rutaPdf ? law.rutaPdf.split(/[\\/]/).pop() : (law.contenido ? law.contenido.replace('Enlace de descarga: ', '') : 'Sin enlace')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {law.fechaPublicacion ? new Date(law.fechaPublicacion).toLocaleDateString() : '---'}
                </span>
                {(law.driveLink || law.rutaPdf) && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (law.driveLink) window.open(law.driveLink, '_blank');
                        else addToast('Archivo guardado localmente para sincronización', 'info');
                      }}
                      className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> {law.rutaPdf ? 'PDF Local' : 'Descargar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Sello de integridad — hash completo */}
              {law.fileHash && (
                <HashDisplay hash={law.fileHash} darkMode={darkMode} />
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-8 shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Editar Ley' : 'Registrar Ley'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Título de la Ley</label>
                <input 
                  type="text" 
                  data-testid="law-title-input"
                  placeholder="Ej: Reforma al Código de Comercio..."
                  value={form.titulo}
                  onChange={e => setForm({...form, titulo: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Tipo de Gaceta</label>
                  <select 
                    value={form.gaceta}
                    onChange={e => setForm({...form, gaceta: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Número de Gaceta/Ley</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 42.123"
                    value={form.numero}
                    onChange={e => setForm({...form, numero: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Fecha de Publicación</label>
                  <input 
                    type="date" 
                    value={form.fechaPublicacion}
                    onChange={e => {
                      const fecha = e.target.value;
                      const anio = fecha ? new Date(fecha + 'T12:00:00').getFullYear() : new Date().getFullYear();
                      setForm({...form, fechaPublicacion: fecha, anio});
                    }}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Etiquetas / Ejes Temáticos</label>
                <input 
                  type="text" 
                  placeholder="Ej: Salud, Presupuesto, Educación (separados por comas)"
                  value={form.tags}
                  onChange={e => setForm({...form, tags: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Enlace de Google Drive</label>
                <input 
                  type="url" 
                  data-testid="law-drive-link-input"
                  placeholder="Pegue aquí el enlace compartido..."
                  value={form.driveLink}
                  onChange={e => setForm({...form, driveLink: e.target.value, localFilePath: null, localFileName: ''})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`w-full border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                  <span className={`px-2 ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-white text-gray-400'}`}>O subir archivo</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Archivo PDF Local</label>
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors ${
                    form.localFilePath 
                      ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
                      : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300')
                  }`}
                >
                  <Download className="w-4 h-4 rotate-180" />
                  <span className="truncate">{form.localFilePath ? form.localFileName : 'Seleccionar PDF desde mi PC...'}</span>
                </button>
                <p className="text-[10px] mt-2 text-gray-500 italic">El archivo se subirá automáticamente a GitHub Pages.</p>
              </div>

              {/* Toggle Sello de Integridad */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                applyIntegritySeal
                  ? (darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                  : (darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200')
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-4 h-4 ${applyIntegritySeal ? 'text-emerald-500' : 'opacity-30'}`} />
                  <div>
                    <p className="text-xs font-black">Colocar Sello de Integridad</p>
                    <p className={`text-[10px] opacity-50 mt-0.5`}>SHA-256 se calcula automáticamente al subir el archivo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !applyIntegritySeal;
                    setApplyIntegritySeal(next);
                    if (!next) setForm(prev => ({ ...prev, fileHash: '' }));
                  }}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    applyIntegritySeal ? 'bg-emerald-500' : (darkMode ? 'bg-gray-700' : 'bg-gray-300')
                  }`}
                >
                  <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${
                    applyIntegritySeal ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Vista previa del hash calculado */}
              {form.fileHash && applyIntegritySeal && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-black tracking-wider text-emerald-500 mb-0.5">Hash calculado</p>
                    <code className={`text-[10px] font-mono truncate block ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {form.fileHash.substring(0, 32)}...
                    </code>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); }} 
                disabled={isSaving}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                data-testid="btn-save-law"
                className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Actualizar' : 'Registrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} darkMode={darkMode} destructive={confirmDialog.destructive} />
    </>
  );
};

export default LawsLibrary;
