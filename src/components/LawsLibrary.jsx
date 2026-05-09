import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Download, Trash2, QrCode, 
  Loader2, Scale, ExternalLink
} from 'lucide-react';
import { dbService } from '../services/db';
import EmptyState from './ui/EmptyState';

const LawsLibrary = ({ darkMode, addToast }) => {
  const [laws, setLaws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [form, setForm] = useState({
    titulo: '',
    gaceta: 'Ordinaria',
    numero: '',
    anio: new Date().getFullYear(),
    fechaPublicacion: new Date().toISOString().split('T')[0],
    driveLink: ''
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

  const handleSave = async () => {
    if (!form.titulo || !form.driveLink || !form.anio) {
      addToast('Título, Año y Enlace de Drive son requeridos', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Usar el nuevo canal IPC laws:import que configuramos en handlers.js
      await window.legisAPI.invoke('laws:import', {
        metadata: {
          titulo: form.titulo,
          gaceta: form.gaceta,
          numero: form.numero,
          anio: parseInt(form.anio),
          fechaPublicacion: form.fechaPublicacion,
          driveLink: form.driveLink
        }
      });

      addToast('Ley registrada exitosamente', 'success');
      setShowForm(false);
      setForm({ 
        titulo: '', 
        gaceta: 'Ordinaria', 
        numero: '',
        anio: new Date().getFullYear(), 
        fechaPublicacion: new Date().toISOString().split('T')[0],
        driveLink: '' 
      });
      loadLaws();
    } catch (err) {
      addToast(err.message || 'Error al guardar la ley', 'error');
    } finally {
      setIsSaving(false);
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
      // Extraer el link de contenido (guardado como "Enlace de descarga: ...")
      const driveLink = law.contenido.replace('Enlace de descarga: ', '');
      const dataURL = await window.legisAPI.qr.generate(driveLink);
      
      const win = window.open();
      win.document.write(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
          <h2 style="margin-bottom:10px;">Acceso Digital: ${law.titulo}</h2>
          <p style="color:#666;margin-bottom:20px;">Gaceta ${law.expediente}</p>
          <div style="padding:20px;border:2px solid #eee;border-radius:20px;background:white;">
            <img src="${dataURL}" style="width:300px;height:300px;display:block;"/>
          </div>
          <p style="margin-top:20px;font-size:14px;color:#888;">Escanea para descargar desde Google Drive</p>
          <button onclick="window.print()" style="margin-top:30px;padding:10px 20px;background:#4f46e5;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;">Imprimir Código</button>
        </div>
      `);
    } catch (err) {
      addToast('Error al generar QR', 'error');
    }
  };

  const filteredLaws = useMemo(() => {
    return laws.filter(l => 
      (l.titulo.toLowerCase().includes(search.toLowerCase()) || l.expediente.includes(search)) &&
      (!filterType || l.tipo === filterType)
    );
  }, [laws, search, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Biblioteca de Leyes</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gestión ligera vinculada a Google Drive y códigos QR</p>
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
                  <button onClick={() => showQR(law)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Ver Código QR">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(law.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 line-clamp-2">{law.titulo}</h3>
              <p className={`text-xs mb-4 font-medium ${law.tipo === 'Extraordinaria' ? 'text-amber-500' : 'text-indigo-500'}`}>
                Gaceta {law.tipo} {law.numero ? `#${law.numero}` : ''} ({law.anio})
              </p>
              
              <div className={`p-3 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                  <span>Enlace de Respaldo:</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <ExternalLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                  <span className="text-xs truncate text-gray-500 italic">
                    {law.contenido.replace('Enlace de descarga: ', '')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {new Date(law.fechaPublicacion).toLocaleDateString()}
                </span>
                <a 
                  href={law.contenido.replace('Enlace de descarga: ', '')} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Descargar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-8 shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-2xl font-bold mb-6">Registrar Ley</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Título de la Ley</label>
                <input 
                  type="text" 
                  placeholder="Ej: Reforma al Código de Comercio..."
                  value={form.titulo}
                  onChange={e => setForm({...form, titulo: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Tipo de Gaceta</label>
                  <select 
                    value={form.gaceta}
                    onChange={e => setForm({...form, gaceta: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
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
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Fecha de Publicación</label>
                  <input 
                    type="date" 
                    value={form.fechaPublicacion}
                    onChange={e => setForm({...form, fechaPublicacion: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Enlace de Google Drive</label>
                <input 
                  type="url" 
                  placeholder="Pegue aquí el enlace compartido..."
                  value={form.driveLink}
                  onChange={e => setForm({...form, driveLink: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
                <p className="text-[10px] mt-2 text-gray-500 italic">Este enlace se usará para generar el código QR público.</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => setShowForm(false)} 
                disabled={isSaving}
                className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawsLibrary;
