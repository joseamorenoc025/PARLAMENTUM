import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Download, Trash2, QrCode, 
  Info, FileText, Filter, Scale, FileUp, Loader2
} from 'lucide-react';
import { dbService } from '../services/db';

const LawsLibrary = ({ darkMode, addToast }) => {
  const [laws, setLaws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [form, setForm] = useState({
    nombre: '',
    gaceta: '',
    tipo: 'Ordinaria',
    anio: new Date().getFullYear(),
    fechaVigencia: '',
    rutaPdf: '',
    qrData: '',
    publicLink: '' // Nuevo: Enlace manual a Drive Desktop
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
    try {
      const filePath = await window.legisAPI.invoke('dialog:open-pdf');
      if (filePath) {
        setForm(prev => ({ ...prev, rutaPdf: filePath }));
        addToast('Archivo vinculado localmente', 'info');
      }
    } catch (err) {
      addToast('Error al seleccionar archivo', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.gaceta) {
      addToast('Nombre y Gaceta son requeridos', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // El QR ahora usa el enlace público manual si existe, sino los metadatos
      const qrData = form.publicLink || JSON.stringify({
        n: form.nombre,
        g: form.gaceta,
        t: form.tipo,
        v: form.fechaVigencia
      });

      // Limpiar objeto para la DB (eliminar campos de UI como publicLink)
      const { publicLink, ...dbData } = form;

      await dbService.saveLaw({
        ...dbData,
        titulo: form.nombre, // Asegurar consistencia con el nuevo esquema
        qrData: qrData,
        activo: 1
      });

      addToast('Ley registrada exitosamente', 'success');
      setShowForm(false);
      setForm({ nombre: '', gaceta: '', tipo: 'Ordinaria', anio: new Date().getFullYear(), fechaVigencia: '', rutaPdf: '', qrData: '', publicLink: '' });
      loadLaws();
    } catch (err) {
      addToast('Error al guardar la ley', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta ley de la biblioteca?')) return;
    try {
      await dbService.deleteLaw(id);
      addToast('Ley eliminada', 'warning');
      loadLaws();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const showQR = async (law) => {
    try {
      const dataURL = await window.legisAPI.qr.generate(law.qrData || law.nombre);
      const win = window.open();
      win.document.write(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
        <h2 style="margin-bottom:10px;">Acceso Ciudadano: ${law.nombre}</h2>
        <p style="color:#666;margin-bottom:20px;">Escanea para descargar la Gaceta Oficial No. ${law.gaceta}</p>
        <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
          <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
        </div>
        <p style="margin-top:20px;font-size:14px;color:#888;">Segundo Cerebro Legislativo • Transparencia Total</p>
        <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
      </div>`);
    } catch (err) {
      addToast('Error al generar QR', 'error');
    }
  };

  const filteredLaws = useMemo(() => {
    return laws.filter(l => 
      (l.nombre.toLowerCase().includes(search.toLowerCase()) || l.gaceta.includes(search)) &&
      (!filterType || l.tipo === filterType)
    );
  }, [laws, search, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Biblioteca de Leyes</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Catálogo oficial y generación de códigos QR con respaldo en Drive</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Ley
        </button>
      </div>

      <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o gaceta..." 
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
            <option value="">Todos los tipos</option>
            <option value="Ordinaria">Ordinaria</option>
            <option value="Extraordinaria">Extraordinaria</option>
            <option value="Especial">Especial</option>
            <option value="Orgánica">Orgánica</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p>Cargando biblioteca...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLaws.map(law => (
            <div key={law.id} className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => showQR(law)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Generar QR">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(law.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 line-clamp-2">{law.nombre}</h3>
              <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gaceta No. {law.gaceta} • {law.anio}</p>
              
              <div className={`p-3 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">{law.tipo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Vigencia:</span>
                  <span className="font-medium">{law.fechaVigencia || '—'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                  {law.descargas} descargas
                </span>
                {law.rutaPdf ? (
                  <a 
                    href={law.rutaPdf} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Ver PDF
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin archivo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-8 shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-2xl font-bold mb-6">Registrar Nueva Ley</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nombre de la Ley</label>
                <input 
                  type="text" 
                  placeholder="Ej: Ley Orgánica de Transparencia..."
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">No. Gaceta</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 42.123"
                    value={form.gaceta}
                    onChange={e => setForm({...form, gaceta: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Año</label>
                  <input 
                    type="number" 
                    value={form.anio}
                    onChange={e => setForm({...form, anio: parseInt(e.target.value)})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Tipo</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm({...form, tipo: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                    <option value="Especial">Especial</option>
                    <option value="Orgánica">Orgánica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Fecha Vigencia</label>
                  <input 
                    type="date" 
                    value={form.fechaVigencia}
                    onChange={e => setForm({...form, fechaVigencia: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Enlace Público (Google Drive)</label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/file/d/..."
                  value={form.publicLink}
                  onChange={e => setForm({...form, publicLink: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
                <p className="text-[10px] mt-1 text-gray-500 italic">El código QR apuntará a este enlace si se proporciona.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Documento Local (Opcional)</label>
                <div 
                  onClick={handleSelectFile}
                  className={`w-full px-4 py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-500/5 hover:border-indigo-500/50 ${form.rutaPdf ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  {form.rutaPdf ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-xs font-medium text-emerald-600 truncate max-w-full px-4">
                        {form.rutaPdf.split(/[\\/]/).pop()}
                      </p>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Haz clic para seleccionar el archivo PDF</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => setShowForm(false)} 
                disabled={isUploading}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isUploading}
                className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
                  </>
                ) : (
                  'Guardar Ley'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawsLibrary;
