import React, { useState, useMemo, useCallback } from 'react';
import { FolderOpen, Search, Filter, FileText, CalendarDays, Scale, Trash2, Download } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import SectionHeader from './SectionHeader';

const typeIcons = {
  law: Scale, project: FileText, session: CalendarDays, oficio: FileText, other: FileText,
};
const typeColors = {
  law: 'indigo', project: 'amber', session: 'blue', oficio: 'purple', other: 'gray',
};

export default function FilesVaultSection({ darkMode, addToast, documents, sessions, oficios, projects, agreements, laws, onDeleteDocument }) {
  const [fileSearch, setFileSearch] = useState('');
  const [fileFilterType, setFileFilterType] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  const getEntityName = useCallback((doc) => {
    const id = Number(doc.entidadId);
    if (doc.entidadTipo === 'law') return laws?.find(l => l.id === id)?.titulo || `Ley #${id}`;
    if (doc.entidadTipo === 'project') return projects?.find(p => p.id === id)?.titulo || `Proyecto #${id}`;
    if (doc.entidadTipo === 'session') return sessions?.find(s => s.id === id)?.motivo || `Sesion #${id}`;
    if (doc.entidadTipo === 'oficio') return oficios?.find(o => o.id === id)?.asunto || `Oficio #${id}`;
    if (doc.entidadTipo === 'agreement') return agreements?.find(a => a.id === id)?.objeto || `Acuerdo #${id}`;
    return 'Sin vinculo';
  }, [laws, projects, sessions, oficios, agreements]);

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(d => {
      if (fileFilterType && d.entidadTipo !== fileFilterType) return false;
      if (fileSearch) {
        const search = fileSearch.toLowerCase();
        return d.nombreOriginal?.toLowerCase().includes(search) || getEntityName(d).toLowerCase().includes(search);
      }
      return true;
    });
  }, [documents, fileSearch, fileFilterType, getEntityName]);

  const handleDeleteFile = (doc) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar archivo',
      message: `Eliminar "${doc.nombreOriginal}" de la Boveda Documental?`,
      destructive: true,
      onConfirm: () => {
        onDeleteDocument?.(doc.id);
        addToast('Archivo eliminado', 'success');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
      <SectionHeader icon={FolderOpen} title="Archivos del Sistema (Boveda)" description="Gestione los archivos vinculados a entidades" color="gray" darkMode={darkMode} />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={fileSearch}
            onChange={e => setFileSearch(e.target.value)}
            placeholder="Buscar archivo..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={fileFilterType}
            onChange={e => setFileFilterType(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none appearance-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
          >
            <option value="">Todos los tipos</option>
            <option value="law">Leyes</option>
            <option value="project">Proyectos</option>
            <option value="session">Sesiones</option>
            <option value="oficio">Oficios</option>
            <option value="agreement">Acuerdos</option>
          </select>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <p className={`text-center py-10 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No se encontraron archivos</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const Icon = typeIcons[doc.entidadTipo] || FileText;
            const color = typeColors[doc.entidadTipo] || 'gray';
            return (
              <div key={doc.id} className={`p-4 rounded-xl border transition-colors hover:shadow-md ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                    <Icon className={`w-5 h-5 text-${color}-500`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{doc.nombreOriginal}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getEntityName(doc)}</p>
                    <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{doc.entidadTipo}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {doc.rutaArchivo && (
                    <a
                      href={`file:///${doc.rutaArchivo}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Descargar
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteFile(doc)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        darkMode={darkMode}
      />
    </div>
  );
}
