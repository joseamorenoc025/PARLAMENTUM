import React, { useState, useEffect, useCallback } from 'react';
import { useLegisData } from './hooks/useLegisData';
import { Toaster, toast } from 'sonner';

// Componentes UI
import CommandPalette from './components/ui/CommandPalette';
import AuthScreen from './components/AuthScreen';
import OnboardingWizard from './components/onboarding/OnboardingWizard';

// Módulos de Funcionalidad
import Dashboard from './components/Dashboard';
import SessionsModule from './components/SessionsModule';
import OficiosModule from './components/OficiosModule';
import AgendaModule from './components/AgendaModule';
import LegislatorsModule from './components/LegislatorsModule';
import LawsLibrary from './components/LawsLibrary';
import AgreementsModule from './components/AgreementsModule';
import AuditModule from './components/AuditModule';
import SyncSettings from './components/SyncSettings';

// Iconos
import { 
  LayoutDashboard, Users, Calendar, FileText, Scale, FolderOpen, 
  Search, Moon, Sun, ChevronRight, ChevronLeft, Gavel, ShieldCheck,
  LogOut, Database, Github, Activity
} from 'lucide-react';

const defaultConfig = {
  nombreSecretario: '',
  cedula: '',
  periodoSesiones: '2026-2027',
  fechaConfiguracion: new Date().toISOString().split('T')[0],
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
    laws,
    agreements, saveAgreement, deleteAgreement,
    documents, saveDocument, deleteDocument,
    auditLogs,
    isLoading, reload: loadAllData
  } = useLegisData(defaultConfig);

  const [user, setUser] = useState(null);
  const [setupStatus, setSetupStatus] = useState({ needsOnboarding: false, isLoading: true });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'pending', 'error'
  const [logo, setLogo] = useState(null);
  const darkMode = config.darkMode;

  // Verificar entorno Electron
  const isElectron = window.legisAPI !== undefined;

  useEffect(() => {
    if (!isElectron) return;

    const checkSetup = async () => {
      try {
        // Esperar a que la DB esté lista
        await window.legisAPI.invoke('db:isReady');
        
        const status = await window.legisAPI.invoke('app:get-setup-status');
        setSetupStatus({ ...status, isLoading: false });
        
        // Cargar logo si está configurado
        const logoData = await window.legisAPI.invoke('app:get-logo');
        if (logoData) setLogo(logoData);
      } catch (err) {
        console.error('Setup status check failed:', err);
        setSetupStatus({ needsOnboarding: true, isLoading: false });
      }
    };
    checkSetup();
  }, [isElectron]);

  const onOnboardingComplete = useCallback(async () => {
    setSetupStatus({ needsOnboarding: false, onboardingCompleted: true, isLoading: false });
    // Recargar logo tras finalizar wizard
    if (window.legisAPI) {
      const logoData = await window.legisAPI.invoke('app:get-logo');
      if (logoData) setLogo(logoData);
    }
  }, []);

  useEffect(() => {
    if (!isElectron) return;

    const checkSync = async () => {
      try {
        const stats = await window.legisAPI.sync.github.getQueueStats();
        if (stats.failed > 0) setSyncStatus('error');
        else if (stats.pending > 0) setSyncStatus('pending');
        else setSyncStatus('synced');
      } catch (e) {
        console.error('Sync check failed:', e);
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 15000);
    return () => clearInterval(interval);
  }, [isElectron]);

  // Señal de disponibilidad para tests E2E
  useEffect(() => {
    if (!isLoading && !setupStatus.isLoading) {
      console.log('E2E: Cerebro is Ready');
      window.__CEREBO_READY = true;
    }
  }, [isLoading, setupStatus.isLoading]);

  const addToast = useCallback((message, type = 'info') => {
    const options = {
      duration: type === 'error' ? Infinity : 4000,
      closeButton: true,
    };
    
    // Log error to Winston via IPC
    if (type === 'error' && isElectron) {
      window.legisAPI.invoke('log', { level: 'error', message: `toast:error - ${message}` })
        .catch(err => console.error('Failed to log toast error:', err));
    }

    if (toast[type]) {
      toast[type](message, options);
    } else {
      toast(message, options);
    }
  }, [isElectron]);

  const toggleDarkMode = () => setConfig({ darkMode: !config.darkMode });

  const navigateToEntity = useCallback((type, id) => {
    const pages = { sesion: 'sesiones', oficio: 'oficios', proyecto: 'agenda', legislador: 'legisladores' };
    if (pages[type]) setCurrentPage(pages[type]);
  }, []);

  const handleLogout = () => {
    setUser(null);
    addToast('Sesión cerrada', 'info');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'sesiones', label: 'Sesiones', icon: <Calendar className="w-5 h-5" /> },
    { id: 'oficios', label: 'Oficios', icon: <FileText className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda Legislativa', icon: <Scale className="w-5 h-5" /> },
    { id: 'legisladores', label: 'Legisladores', icon: <Users className="w-5 h-5" /> },
    { id: 'leyes', label: 'Biblioteca', icon: <Scale className="w-5 h-5" /> },
    { id: 'acuerdos', label: 'Acuerdos', icon: <Gavel className="w-5 h-5" /> },
    { id: 'auditoria', label: 'Actividad', icon: <Activity className="w-5 h-5" />, roles: ['admin'] },
    { id: 'sincronizacion', label: 'Configuración', icon: <Github className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  const renderMainContent = () => {
    if (!isElectron) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-10 rounded-[2rem] shadow-2xl border border-red-100">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-4">Entorno No Soportado</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              PARLAMENTUM requiere ser ejecutado a través de la aplicación de escritorio (**Electron**). 
              No puede funcionar correctamente en un navegador web convencional.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl text-left font-mono text-xs text-gray-500 mb-8">
              Terminal: npm run dev
            </div>
          </div>
        </div>
      );
    }

    if (isLoading || setupStatus.isLoading) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="flex flex-col items-center space-y-6 animate-[scale-in_0.5s_ease-out]">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <div className="absolute w-28 h-28 rounded-full border-2 border-indigo-500/20 animate-ping"></div>
              {/* Logo container */}
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-700/50 shadow-2xl z-10">
                <img src="/logo-parlamentum.png" alt="PARLAMENTUM" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-widest text-indigo-500 uppercase">PARLAMENTUM</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-semibold tracking-wide animate-pulse`}>
                Cargando sistema legislativo...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (setupStatus.needsOnboarding) {
      return <OnboardingWizard darkMode={darkMode} addToast={addToast} onComplete={onOnboardingComplete} />;
    }

    if (!user) {
      return <AuthScreen onLogin={setUser} darkMode={darkMode} addToast={addToast} />;
    }

    return (
      <div className={`min-h-screen flex ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r ${sidebarOpen ? 'w-64' : 'w-16'}`}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800/50">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-gray-700/50 bg-white flex items-center justify-center">
              <img src="/logo-parlamentum.png" alt="PARLAMENTUM" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{config.chamber_name || 'PARLAMENTUM'}</p>
                <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{config.chamber_name ? 'Legislativo' : 'Sistema de Gestión'}</p>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {filteredNavItems.map(item => (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
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
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.nombreCompleto || user.username}</p>
              <p className={`text-[10px] uppercase font-bold tracking-tighter ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{user.role}</p>
            </div>
          )}

          <div className="p-2 border-t border-gray-800/50 space-y-1">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-red-500 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
            <button onClick={() => setSidebarOpen(prev => !prev)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'} ${!sidebarOpen ? 'justify-center' : ''}`}>
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              {sidebarOpen && <span>Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          {/* Top Bar */}
          <header role="banner" className={`sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b backdrop-blur-xl ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              {logo && (
                <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-gray-200 dark:border-gray-800 flex items-center justify-center mr-1 flex-shrink-0">
                  <img src={logo} alt="Logo Institucional" className="w-full h-full object-contain" />
                </div>
              )}
              <span className="text-sm font-semibold">{navItems.find(i => i.id === currentPage)?.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Status Badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                syncStatus === 'synced' ? (darkMode ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-green-50 border-green-200 text-green-600') :
                syncStatus === 'pending' ? (darkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600') :
                (darkMode ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-red-50 border-red-200 text-red-600')
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced' ? 'bg-green-500' :
                  syncStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                {syncStatus === 'synced' ? 'PORTAL AL DÍA' : syncStatus === 'pending' ? 'SINCRONIZANDO...' : 'ERROR SYNC'}
              </div>

              <div className={`w-px h-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
              
              <button onClick={() => setShowCommandPalette(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'} transition-colors`}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>⌘K</kbd>
              </button>
              <div className={`w-px h-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <button 
                onClick={async () => {
                  const res = await window.legisAPI.db.backupLocal();
                  if (res.success) addToast('Backup local creado exitosamente', 'success');
                  else addToast('Error al crear backup', 'error');
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Copia de seguridad local"
              >
                <Database className="w-4 h-4" />
              </button>
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {currentPage === 'dashboard' && <Dashboard sessions={sessions} oficios={oficios} projects={projects} laws={laws} legislators={legislators} darkMode={darkMode} config={config} onNavigate={navigateToEntity} />}
            {currentPage === 'sesiones' && <SessionsModule sessions={sessions} oficios={oficios} darkMode={darkMode} addToast={addToast} onSave={saveSession} onDelete={deleteSession} onNavigate={navigateToEntity} />}
            {currentPage === 'oficios' && <OficiosModule oficios={oficios} sessions={sessions} darkMode={darkMode} addToast={addToast} onSave={saveOficio} onDelete={deleteOficio} onNavigate={navigateToEntity} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />}
            {currentPage === 'agenda' && <AgendaModule projects={projects} commissions={commissions} legislators={legislators} darkMode={darkMode} addToast={addToast} onSave={saveProject} onDelete={deleteProject} onNavigate={navigateToEntity} config={config} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />}
            {currentPage === 'legisladores' && <LegislatorsModule legislators={legislators} commissions={commissions} darkMode={darkMode} addToast={addToast} onSaveLegislator={saveLegislator} onSaveCommission={saveCommission} onDeleteLegislator={deleteLegislator} onDeleteCommission={deleteCommission} />}
            {currentPage === 'leyes' && <LawsLibrary darkMode={darkMode} addToast={addToast} onDataChange={loadAllData} />}
            {currentPage === 'acuerdos' && <AgreementsModule sessions={sessions} darkMode={darkMode} addToast={addToast} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />}
            {currentPage === 'auditoria' && <AuditModule auditLogs={auditLogs} darkMode={darkMode} />}
            {currentPage === 'sincronizacion' && (
              <SyncSettings 
                darkMode={darkMode} 
                addToast={addToast} 
                documents={documents} 
                sessions={sessions} 
                oficios={oficios} 
                projects={projects} 
                agreements={agreements}
                laws={laws}
                onDeleteDocument={deleteDocument} 
              />
            )}
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
      </div>
    );
  };

  return (
    <div data-testid="app-root" className={darkMode ? 'dark' : ''}>
      <Toaster position="bottom-right" theme={darkMode ? 'dark' : 'light'} richColors />
      
      {/* Global Styles */}
      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? '#374151' : '#d1d5db'}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#4b5563' : '#9ca3af'}; }
      `}</style>

      {renderMainContent()}
    </div>
  );
}
