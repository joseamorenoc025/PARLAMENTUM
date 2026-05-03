import React, { useState, useEffect, useCallback } from 'react';
import { useLegisData } from './hooks/useLegisData';

// Componentes UI
import ToastContainer from './components/ui/ToastContainer';
import CommandPalette from './components/ui/CommandPalette';

// Módulos de Funcionalidad
import Dashboard from './components/Dashboard';
import SessionsModule from './components/SessionsModule';
import OficiosModule from './components/OficiosModule';
import AgendaModule from './components/AgendaModule';
import LegislatorsModule from './components/LegislatorsModule';
import VaultModule from './components/VaultModule';
import LawsLibrary from './components/LawsLibrary';
import AuditModule from './components/AuditModule';

// Iconos
import { 
  LayoutDashboard, Users, Calendar, FileText, Scale, FolderOpen, 
  Search, Moon, Sun, ChevronRight, ChevronLeft, Gavel, ShieldCheck 
} from 'lucide-react';

const defaultConfig = {
  nombre_secretario: '',
  cedula: '',
  periodo_sesiones: '2026-2027',
  fecha_configuracion: new Date().toISOString().split('T')[0],
  setupComplete: false,
  darkMode: true
};

export default function App() {
  const {
    config, setConfig,
    sessions, saveSession, deleteSession,
    legislators, saveLegislator, deleteLegislator,
    commissions, saveCommission, deleteCommission,
    oficios, saveOficio, deleteOficio,
    projects, saveProject, deleteProject,
    documents, saveDocument, deleteDocument,
    auditLogs,
    isLoading
  } = useLegisData(defaultConfig);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const darkMode = config.darkMode;

  // Atajos de teclado
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleDarkMode = () => setConfig({ darkMode: !config.darkMode });

  const navigateToEntity = useCallback((type, id) => {
    const pages = { sesion: 'sesiones', oficio: 'oficios', proyecto: 'agenda', legislador: 'legisladores' };
    if (pages[type]) setCurrentPage(pages[type]);
    addToast(`Navegando a ${type}`, 'info');
  }, [addToast]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Calendar className="w-5 h-5" /> },
    { id: 'oficios', label: 'Oficios', icon: <FileText className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda Legislativa', icon: <Scale className="w-5 h-5" /> },
    { id: 'legisladores', label: 'Legisladores', icon: <Users className="w-5 h-5" /> },
    { id: 'boveda', label: 'Bóveda', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'leyes', label: 'Biblioteca', icon: <Scale className="w-5 h-5" /> },
    { id: 'auditoria', label: 'Auditoría', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!config.setupComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border w-full max-md">
          <Gavel className="w-12 h-12 text-indigo-500 mb-6 mx-auto" />
          <h2 className="text-2xl font-bold text-center mb-6">Configuración Inicial</h2>
          <div className="space-y-4">
            <input 
              placeholder="Nombre del Secretario" 
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
              onChange={e => setConfig({ nombre_secretario: e.target.value })} 
            />
            <input 
              placeholder="Cédula" 
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} 
              onChange={e => setConfig({ cedula: e.target.value })} 
            />
            <button 
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold" 
              onClick={() => setConfig({ setupComplete: true })}
            >
              Empezar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`min-h-screen flex ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r ${sidebarOpen ? 'w-64' : 'w-16'}`}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800/50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Segundo Cerebro</p>
                <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Legislativo</p>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${currentPage === item.id 
                    ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') 
                    : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}
                  ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              >
                {item.icon}
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className={`mx-3 mb-4 p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{config.nombre_secretario || 'Secretario'}</p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{config.cedula || ''} · {config.periodo_sesiones}</p>
            </div>
          )}

          <div className="p-2 border-t border-gray-800/50">
            <button onClick={() => setSidebarOpen(prev => !prev)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} ${!sidebarOpen ? 'justify-center' : ''}`}>
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              {sidebarOpen && <span>Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          {/* Top Bar */}
          <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b backdrop-blur-xl ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{navItems.find(i => i.id === currentPage)?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCommandPalette(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'} transition-colors`}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>⌘K</kbd>
              </button>
              <div className={`w-px h-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {currentPage === 'dashboard' && <Dashboard sessions={sessions} oficios={oficios} projects={projects} legislators={legislators} darkMode={darkMode} onNavigate={navigateToEntity} />}
            {currentPage === 'sesiones' && <SessionsModule sessions={sessions} oficios={oficios} darkMode={darkMode} addToast={addToast} onSave={saveSession} onDelete={deleteSession} onNavigate={navigateToEntity} />}
            {currentPage === 'oficios' && <OficiosModule oficios={oficios} sessions={sessions} darkMode={darkMode} addToast={addToast} onSave={saveOficio} onDelete={deleteOficio} onNavigate={navigateToEntity} />}
            {currentPage === 'agenda' && <AgendaModule projects={projects} commissions={commissions} legislators={legislators} darkMode={darkMode} addToast={addToast} onSave={saveProject} onDelete={deleteProject} onNavigate={navigateToEntity} config={config} />}
            {currentPage === 'legisladores' && <LegislatorsModule legislators={legislators} commissions={commissions} darkMode={darkMode} addToast={addToast} onSaveLegislator={saveLegislator} onSaveCommission={saveCommission} onDeleteLegislator={deleteLegislator} onDeleteCommission={deleteCommission} />}
            {currentPage === 'boveda' && <VaultModule documents={documents} sessions={sessions} oficios={oficios} projects={projects} darkMode={darkMode} addToast={addToast} onSaveDocument={saveDocument} onDeleteDocument={deleteDocument} />}
            {currentPage === 'leyes' && <LawsLibrary darkMode={darkMode} addToast={addToast} />}
            {currentPage === 'auditoria' && <AuditModule auditLogs={auditLogs} darkMode={darkMode} />}
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          sessions={sessions}
          oficios={oficios}
          projects={projects}
          legislators={legislators}
          onNavigate={navigateToEntity}
        />

        {/* Toasts */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {/* Global Styles */}
        <style>{`
          @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${darkMode ? '#374151' : '#d1d5db'}; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#4b5563' : '#9ca3af'}; }
        `}</style>
      </div>
    </div>
  );
}
