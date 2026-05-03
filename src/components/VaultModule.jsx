import React, { useState, useMemo } from 'react';
import { 
  Upload, Download, Trash2, CalendarDays, FileText, Scale 
} from 'lucide-react';
import Modal from './ui/Modal';
import { fileToBase64 } from '../utils/helpers';

const VaultModule = ({ documents, sessions, oficios, projects, darkMode, addToast, onSaveDocument, onDeleteDocument }) => {
  const [filterType, setFilterType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ entidad_tipo: 'Sesion', entidad_id: '', fase_etiqueta: '', nombre_archivo: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (!uploadForm.entidad_id) { addToast('Seleccione una entidad', 'error'); return; }
    if (!uploadForm.fase_etiqueta) { addToast('Seleccione la fase', 'error'); return; }
    try {
      setUploadProgress(30);
      let base64Content = null;
      if (selectedFile) {
        base64Content = await fileToBase64(selectedFile);
        setUploadProgress(70);
      }
      const hash = `sha256:${Array.from(uploadForm.nombre_archivo || 'doc').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).padStart(8, '0')}`;
      const newDoc = {
        id: Date.now(),
        entidad_tipo: uploadForm.entidad_tipo,
        entidad_id: Number(uploadForm.entidad_id),
        fase_etiqueta: uploadForm.fase_etiqueta,
        ruta_archivo: `/boveda/${uploadForm.entidad_tipo.toLowerCase()}/${uploadForm.entidad_id}/${uploadForm.nombre_archivo || 'documento'}`,
        hash_integridad: hash,
        nombre_original: uploadForm.nombre_archivo || 'documento',
        tipo_mime: selectedFile?.type || 'application/octet-stream',
        tamano_bytes: selectedFile?.size || 0,
        fecha_subida: new Date().toISOString().split('T')[0],
        contenido_base64: base64Content,
        activo: true
      };
      onSaveDocument?.(newDoc);
      setUploadProgress(100);
      addToast(`✅ "${uploadForm.nombre_archivo}" subido exitosamente`, 'success');
      setShowUpload(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      addToast('Error al subir el archivo', 'error');
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
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión y almacenamiento de documentos</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all">
          <Upload className="w-4 h-4" /> Subir Archivo
        </button>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
        {['', 'Sesion', 'Oficio', 'ProyectoLey'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === t ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>{t || 'Todos'}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDocs.map(doc => (
          <div key={doc.id} className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${typeColors[doc.entidad_tipo] || 'text-gray-500 bg-gray-500/10'}`}>{typeIcons[doc.entidad_tipo]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{getEntityName(doc)}</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{doc.entidad_tipo}</p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500">Fase</p>
              <p className="text-sm font-medium">{doc.fase_etiqueta}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] font-mono text-gray-400">{(doc.tamano_bytes / 1024).toFixed(1)} KB</span>
              <div className="flex gap-1">
                {doc.contenido_base64 && <a href={doc.contenido_base64} download={doc.nombre_original} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Download className="w-3.5 h-3.5" /></a>}
                <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Subir Archivo" darkMode={darkMode}>
        <div className="space-y-4">
          <input type="file" onChange={handleFileSelect} className="w-full text-sm" />
          <select value={uploadForm.entidad_tipo} onChange={e => setUploadForm({...uploadForm, entidad_tipo: e.target.value, entidad_id: ''})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="Sesion">Sesión</option>
            <option value="Oficio">Oficio</option>
            <option value="ProyectoLey">Proyecto</option>
          </select>
          <select value={uploadForm.entidad_id} onChange={e => setUploadForm({...uploadForm, entidad_id: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="">Seleccionar...</option>
            {(uploadForm.entidad_tipo === 'Sesion' ? activeSessions : uploadForm.entidad_tipo === 'Oficio' ? activeOficios : activeProjects).map(e => (
              <option key={e.id} value={e.id}>{e.numero_correlativo || e.numero_oficio || e.titulo}</option>
            ))}
          </select>
          <select value={uploadForm.fase_etiqueta} onChange={e => setUploadForm({...uploadForm, fase_etiqueta: e.target.value})} className="w-full p-2.5 rounded-xl border dark:bg-gray-800">
            <option value="">Fase...</option>
            {getPhaseLabels(uploadForm.entidad_tipo).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={handleUpload} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl">Subir</button>
        </div>
      </Modal>
    </div>
  );
};

export default VaultModule;
