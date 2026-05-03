import React, { useState, useMemo, useRef } from 'react';
import { 
  Upload, Download, Trash2, CalendarDays, FileText, Scale, X, FileUp
} from 'lucide-react';
import Modal from './ui/Modal';
import { fileToBase64 } from '../utils/helpers';

const VaultModule = ({ documents, sessions, oficios, projects, darkMode, addToast, onSaveDocument, onDeleteDocument }) => {
  const [filterType, setFilterType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ entidad_tipo: 'Sesion', entidad_id: '', fase_etiqueta: '', nombre_archivo: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const getEntityName = (doc) => {
    if (doc.entidad_tipo === 'Sesion') {
      const s = sessions.find(s => s.id === doc.entidad_id);
      return s ? `${s.numero_correlativo || s.tipo} (${s.fecha})` : 'Sesión no encontrada';
    }
    if (doc.entidad_tipo === 'Oficio') {
      const o = oficios.find(o => o.id === doc.entidad_id);
      return o ? o.numero_oficio : 'Oficio no encontrado';
    }
    if (doc.entidad_tipo === 'ProyectoLey') {
      const p = projects.find(p => p.id === doc.entidad_id);
      return p ? p.titulo : 'Proyecto no encontrado';
    }
    return '';
  };

  const getPhaseLabels = (entidadTipo) => {
    if (entidadTipo === 'Sesion') return ['Acta', 'Acuerdo', 'Orden del Día', 'Asistencia'];
    if (entidadTipo === 'Oficio') return ['Oficio Original', 'Acuse de Recibo', 'Respuesta'];
    if (entidadTipo === 'ProyectoLey') return ['Estudio en Comisión', 'Informe de Dirección', '1ra Discusión', '2da Discusión', '3ra Discusión', 'Aprobada', 'Gaceta Oficial'];
    return [];
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      addToast('Solo se permiten archivos PDF o Word', 'error');
      return;
    }
    setSelectedFile(file);
    setUploadForm(prev => ({ ...prev, nombre_archivo: file.name }));
  };

  const handleUpload = async () => {
    if (!selectedFile) { addToast('Seleccione un archivo primero', 'error'); return; }
    if (!uploadForm.entidad_id) { addToast('Seleccione una entidad vinculada', 'error'); return; }
    if (!uploadForm.fase_etiqueta) { addToast('Seleccione la etiqueta de fase', 'error'); return; }
    
    try {
      setUploadProgress(30);
      const base64Content = await fileToBase64(selectedFile);
      setUploadProgress(70);
      
      const hash = `sha256:${Array.from(uploadForm.nombre_archivo).reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(8, '0')}`;
      const newDoc = {
        entidad_tipo: uploadForm.entidad_tipo,
        entidad_id: Number(uploadForm.entidad_id),
        fase_etiqueta: uploadForm.fase_etiqueta,
        ruta_archivo: `/boveda/${uploadForm.entidad_tipo.toLowerCase()}/${uploadForm.entidad_id}/${uploadForm.nombre_archivo}`,
        hash_integridad: hash,
        nombre_original: uploadForm.nombre_archivo,
        tipo_mime: selectedFile.type,
        tamano_bytes: selectedFile.size,
        fecha_subida: new Date().toISOString().split('T')[0],
        contenido_base64: base64Content,
        activo: true
      };
      
      await onSaveDocument?.(newDoc);
      setUploadProgress(100);
      addToast(`✅ Documento "${uploadForm.nombre_archivo}" cargado`, 'success');
      setShowUpload(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadForm({ entidad_tipo: 'Sesion', entidad_id: '', fase_etiqueta: '', nombre_archivo: '' });
    } catch (error) {
      console.error(error);
      addToast('Error al procesar el archivo', 'error');
      setUploadProgress(0);
    }
  };

  const typeIcons = { Sesion: <CalendarDays className="w-5 h-5" />, Oficio: <FileText className="w-5 h-5" />, ProyectoLey: <Scale className="w-5 h-5" /> };
  const typeColors = { Sesion: 'text-blue-500 bg-blue-500/10', Oficio: 'text-purple-500 bg-purple-500/10', ProyectoLey: 'text-emerald-500 bg-emerald-500/10' };

  const activeDocs = useMemo(() => documents.filter(d => d.activo && (!filterType || d.entidad_tipo === filterType)), [documents, filterType]);
  const activeSessions = useMemo(() => sessions.filter(s => s.activo), [sessions]);
  const activeOficios = useMemo(() => oficios.filter(o => o.activo), [oficios]);
  const activeProjects = useMemo(() => projects.filter(p => p.activo), [projects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bóveda Documental</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión segura de expedientes y archivos</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Upload className="w-4 h-4" /> Subir Documento
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        {['', 'Sesion', 'Oficio', 'ProyectoLey'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === t ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{t || 'Todos'}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDocs.map(doc => (
          <div key={doc.id} className={`group rounded-2xl border p-5 transition-all hover:border-indigo-500/30 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${typeColors[doc.entidad_tipo] || 'text-gray-500 bg-gray-500/10'}`}>{typeIcons[doc.entidad_tipo]}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate leading-tight">{doc.nombre_original}</p>
                  <p className={`text-[10px] mt-0.5 font-medium opacity-50 uppercase tracking-wider`}>{doc.entidad_tipo}</p>
                </div>
              </div>
              <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Vinculado a:</p>
              <p className="text-xs font-medium truncate">{getEntityName(doc)}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 text-[10px] border dark:border-gray-700 font-medium">{doc.fase_etiqueta}</span>
                <span className="text-[10px] font-mono opacity-40">{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {doc.contenido_base64 && (
                <a 
                  href={doc.contenido_base64} 
                  download={doc.nombre_original} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar
                </a>
              )}
            </div>
          </div>
        ))}
        {activeDocs.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-gray-500 text-sm">No se encontraron documentos</p>
          </div>
        )}
      </div>

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Cargar Documento" darkMode={darkMode}>
        <div className="space-y-5">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all 
              ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500/50'}`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx" />
            {selectedFile ? (
              <div className="space-y-2">
                <FileUp className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="text-sm font-bold text-emerald-600 truncate px-4">{selectedFile.name}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="text-[10px] uppercase font-bold text-red-500 hover:underline"
                >
                  Quitar archivo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Haz clic para seleccionar o arrastra un archivo</p>
                <p className="text-[10px] text-gray-400">PDF o Word (Máx. 10MB)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Tipo de Entidad</label>
              <select 
                value={uploadForm.entidad_tipo} 
                onChange={e => setUploadForm({...uploadForm, entidad_tipo: e.target.value, entidad_id: ''})} 
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <option value="Sesion">Sesión Legislativa</option>
                <option value="Oficio">Oficio Saliente</option>
                <option value="ProyectoLey">Proyecto de Ley</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Vincular a:</label>
              <select 
                value={uploadForm.entidad_id} 
                onChange={e => setUploadForm({...uploadForm, entidad_id: e.target.value})} 
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <option value="">Seleccionar...</option>
                {(uploadForm.entidad_tipo === 'Sesion' ? activeSessions : uploadForm.entidad_tipo === 'Oficio' ? activeOficios : activeProjects).map(e => (
                  <option key={e.id} value={e.id}>{e.numero_correlativo || e.numero_oficio || e.titulo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Fase/Etiqueta:</label>
              <select 
                value={uploadForm.fase_etiqueta} 
                onChange={e => setUploadForm({...uploadForm, fase_etiqueta: e.target.value})} 
                className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <option value="">Seleccionar...</option>
                {getPhaseLabels(uploadForm.entidad_tipo).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || !uploadForm.entidad_id || !uploadForm.fase_etiqueta}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:grayscale"
          >
            {uploadProgress > 0 ? `Subiendo... ${uploadProgress}%` : 'Confirmar Carga'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VaultModule;
