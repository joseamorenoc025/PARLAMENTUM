import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Download, Trash2, QrCode, 
  Info, FileText, Filter, Scale 
} from 'lucide-react';
import { dbService } from '../services/db';

const LawsLibrary = ({ darkMode, addToast }) => {
  const [laws, setLaws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [form, setForm] = useState({
    nombre: '',
    gaceta: '',
    tipo: 'Ordinaria',
    anio: new Date().getFullYear(),
    fecha_vigencia: '',
    ruta_pdf: ''
  });

  const loadLaws = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const dbLaws = await window.legisAPI.invoke('db:query', { sql: 'SELECT * FROM laws WHERE activo = 1 ORDER BY anio DESC' });
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
    if (!form.nombre || !form.gaceta) {
      addToast('Nombre y Gaceta son requeridos', 'error');
      return;
    }

    try {
      // Generar data para el QR (JSON con ID y metadatos básicos)
      const qrData = JSON.stringify({
        n: form.nombre,
        g: form.gaceta,
        t: form.tipo,
        v: form.fecha_vigencia
      });

      await window.legisAPI.invoke('db:query', {
        sql: 'INSERT INTO laws (nombre, gaceta, tipo, anio, fecha_vigencia, ruta_pdf, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        params: [form.nombre, form.gaceta, form.tipo, form.anio, form.fecha_vigencia, form.ruta_pdf, qrData]
      });

      addToast('Ley registrada exitosamente', 'success');
      setShowForm(false);
      setForm({ nombre: '', gaceta: '', tipo: 'Ordinaria', anio: new Date().getFullYear(), fecha_vigencia: '', ruta_pdf: '' });
      loadLaws();
    } catch (err) {
      addToast('Error al guardar la ley', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta ley de la biblioteca?')) return;
    try {
      await window.legisAPI.invoke('db:query', { sql: 'UPDATE laws SET activo = 0 WHERE id = ?', params: [id] });
      addToast('Ley eliminada', 'warning');
      loadLaws();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const showQR = async (law) => {
    try {
      const dataURL = await window.legisAPI.qr.generate(law.qr_data || law.nombre);
      // Mostrar QR en un modal o nueva ventana (simplificado para demo: abrir en nueva pestaña)
      const win = window.open();
      win.document.write(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <h2>Código QR: ${law.nombre}</h2>
        <img src="${dataURL}" style="width:300px;height:300px;"/>
        <p>Gaceta: ${law.gaceta}</p>
        <button onclick="window.print()">Imprimir Código</button>
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
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Catálogo oficial y generación de códigos QR</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLaws.map(law => (
          <div key={law.id} className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
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
                <span className="font-medium">{law.fecha_vigencia || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                {law.descargas} descargas
              </span>
              <button className="text-xs font-medium text-indigo-500 hover:underline flex items-center gap-1">
                <Download className="w-3 h-3" /> Ver PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-6">Registrar Nueva Ley</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Nombre de la Ley</label>
                <input 
                  type="text" 
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">No. Gaceta</label>
                  <input 
                    type="text" 
                    value={form.gaceta}
                    onChange={e => setForm({...form, gaceta: e.target.value})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Año</label>
                  <input 
                    type="number" 
                    value={form.anio}
                    onChange={e => setForm({...form, anio: parseInt(e.target.value)})}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Tipo</label>
                <select 
                  value={form.tipo}
                  onChange={e => setForm({...form, tipo: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                >
                  <option value="Ordinaria">Ordinaria</option>
                  <option value="Extraordinaria">Extraordinaria</option>
                  <option value="Especial">Especial</option>
                  <option value="Orgánica">Orgánica</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Fecha Vigencia</label>
                <input 
                  type="date" 
                  value={form.fecha_vigencia}
                  onChange={e => setForm({...form, fecha_vigencia: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-800">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-600 text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawsLibrary;
