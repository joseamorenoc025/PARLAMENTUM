import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useLegisData } from './hooks/useLegisData';
import { Toaster, toast } from 'sonner';

// Componentes UI
import CommandPalette from './components/ui/CommandPalette';
import ErrorBoundary from './components/ui/ErrorBoundary';
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
import AnalyticsModule from './components/AnalyticsModule';

// Iconos
import { 
  LayoutDashboard, Users, Calendar, FileText, Scale, FolderOpen, 
  Search, Moon, Sun, ChevronRight, ChevronLeft, Gavel, ShieldCheck,
  LogOut, Database, GitBranch, Activity, BarChart3
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [logo, setLogo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const darkMode = config.darkMode;
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setConfig(prev => {
        if (prev.darkMode === undefined) return { ...prev, darkMode: e.matches };
        return prev;
      });
    };
    if (config.darkMode === undefined) {
      setConfig(prev => ({ ...prev, darkMode: mq.matches }));
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Verificar entorno Electron
  const isElectron = window.legisAPI !== undefined;

  // Glassmorphism classes
  const glassBase = darkMode
    ? 'bg-gray-900/80 border border-white/10'
    : 'bg-white/80 border border-black/5';
  const glassCard = darkMode
    ? 'bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-glass'
    : 'bg-white/60 backdrop-blur-xl border border-black/5 shadow-glass-light';
  const glassHover = darkMode
    ? 'hover:bg-gray-800/80 hover:border-white/20'
    : 'hover:bg-white/90 hover:border-black/10';

  useEffect(() => {
    if (!isElectron) return;

    const checkSetup = async () => {
      try {
        // Esperar a que la DB esté lista
        await window.legisAPI.db.isReady();
        
        const status = await window.legisAPI.app.getSetupStatus();
        setSetupStatus({ ...status, isLoading: false });
        
        // Cargar logo si está configurado
        const logoData = await window.legisAPI.app.getLogo();
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
      const logoData = await window.legisAPI.app.getLogo();
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
      window.legisAPI.log('error', `toast:error - ${message}`)
        .catch(err => console.error('Failed to log toast error:', err));
    }

    if (toast[type]) {
      toast[type](message, options);
    } else {
      toast(message, options);
    }
  }, [isElectron]);

  const toggleDarkMode = () => setConfig({ darkMode: !config.darkMode });

  const navigateToEntity = useCallback((type) => {
    const pages = { sesion: 'sesiones', oficio: 'oficios', proyecto: 'agenda', legislador: 'legisladores' };
    if (pages[type]) navigate(`/${pages[type]}`);
  }, [navigate]);

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
    { id: 'analytics', label: 'Impacto y Analíticas', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin'] },
    { id: 'auditoria', label: 'Actividad', icon: <Activity className="w-5 h-5" />, roles: ['admin'] },
    { id: 'sincronizacion', label: 'Configuración', icon: <GitBranch className="w-5 h-5" />, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role));

  const renderMainContent = () => {
    if (!isElectron) {
      return (
        <div className="min-h-[100dvh] bg-red-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-10 rounded-2xl shadow-2xl border border-red-100">
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
        <div className={`min-h-[100dvh] flex flex-col items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100 text-gray-900'}`}>
          <div className="flex flex-col items-center space-y-6 animate-[scale-in_0.5s_ease-out]">
            <div className="relative flex items-center justify-center">
              {/* Pulsing rings */}
              <div className="absolute w-28 h-28 rounded-2xl border border-amber-500/20 animate-ping"></div>
              <div className="absolute w-36 h-36 rounded-2xl border border-amber-500/10 animate-ping" style={{animationDelay: '0.5s'}}></div>
              {/* Logo container - glassmorphism */}
              <div className="w-24 h-24 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-glass-lg flex items-center justify-center z-10">
                <img src="/logo-parlamentum.png" alt="PARLAMENTUM" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-widest text-amber-400 uppercase animate-[glass-shimmer_3s_ease_infinite]">PARLAMENTUM</h2>
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
      <div className={`min-h-[100dvh] flex ${darkMode ? 'bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 text-white' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100 text-gray-900'}`}>
        {/* Mobile Backdrop */}
        {isMobile && mobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Glassmorphism Sidebar */}
        <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col backdrop-blur-xl ${darkMode ? 'bg-gray-900/70 border-r border-white/10' : 'bg-white/70 border-r border-black/5'} ${isMobile ? (mobileMenuOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full') : (sidebarOpen ? 'w-64' : 'w-16')}`}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-inherit backdrop-blur-xl">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-white/20 bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <img src="/logo-parlamentum.png" alt="PARLAMENTUM" className="w-full h-full object-contain" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{config.chamber_name || 'PARLAMENTUM'}</p>
                <p className={`text-[10px] truncate ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>{config.chamber_name ? 'Legislativo' : 'Sistema de Gestión'}</p>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {filteredNavItems.map(item => (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => { navigate(`/${item.id}`); if (isMobile) setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors backdrop-blur-xl
                  ${currentPage === item.id 
                    ? (darkMode ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200') 
                    : (darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900 border border-transparent')}
                  ${!sidebarOpen && !isMobile ? 'justify-center px-2' : ''}`}
              >
                {item.icon}
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className={`mx-3 mb-4 p-3 rounded-xl backdrop-blur-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.nombreCompleto || user.username}</p>
              <p className={`text-[10px] uppercase font-bold tracking-tighter text-amber-400`}>{user.role}</p>
            </div>
          )}

          <div className="p-2 border-t border-inherit backdrop-blur-xl space-y-1">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-red-400 hover:bg-red-500/10 ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
            <button onClick={() => isMobile ? setMobileMenuOpen(false) : setSidebarOpen(prev => !prev)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5'} ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}>
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              {sidebarOpen && <span>Colapsar</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isMobile ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-16')} ${darkMode ? 'bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'}`}>
          {/* Glassmorphism Top Bar */}
          <header role="banner" className={`sticky top-0 z-30 flex items-center justify-between px-6 py-3 backdrop-blur-xl border-b ${darkMode ? 'bg-gray-900/60 border-white/10' : 'bg-white/60 border-black/5'}`}>
            <div className="flex items-center gap-2">
              {isMobile && (
                <button onClick={() => setMobileMenuOpen(true)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              )}
              {logo && (
                <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-black/10 dark:border-white/20 backdrop-blur-xl flex items-center justify-center mr-1 flex-shrink-0">
                  <img src={logo} alt="Logo Institucional" className="w-full h-full object-contain" />
                </div>
              )}
              <span className="text-sm font-semibold">{navItems.find(i => i.id === currentPage)?.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Status Badge - Glass */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-xl transition-colors ${
                syncStatus === 'synced' ? (darkMode ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700') :
                syncStatus === 'pending' ? (darkMode ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700') :
                (darkMode ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'synced' ? 'bg-green-400' :
                  syncStatus === 'pending' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`} />
                {syncStatus === 'synced' ? 'PORTAL AL DÍA' : syncStatus === 'pending' ? 'SINCRONIZANDO...' : 'ERROR SYNC'}
              </div>

              <div className={`w-px h-6 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
              
              <button onClick={() => setShowCommandPalette(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm backdrop-blur-xl border transition-colors ${darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-black/5 border-black/5 text-gray-500 hover:text-gray-700 hover:bg-black/10'} transition-colors`}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>⌘K</kbd>
              </button>
              <div className={`w-px h-6 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
              <button 
                onClick={async () => {
                  const res = await window.legisAPI.db.backupLocal();
                  if (res.success) addToast('Backup local creado exitosamente', 'success');
                  else addToast('Error al crear backup', 'error');
                }}
                className={`p-2 rounded-lg backdrop-blur-xl border transition-colors ${darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-black/5 border-black/5 text-gray-500 hover:bg-black/10'}`}
                title="Copia de seguridad local"
              >
                <Database className="w-4 h-4" />
              </button>
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg backdrop-blur-xl border transition-colors ${darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-black/5 border-black/5 text-gray-500 hover:bg-black/10'}`}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <ErrorBoundary darkMode={darkMode}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard sessions={sessions} oficios={oficios} projects={projects} laws={laws} legislators={legislators} darkMode={darkMode} config={config} onNavigate={navigateToEntity} />} />
                <Route path="/sesiones" element={<SessionsModule sessions={sessions} oficios={oficios} darkMode={darkMode} addToast={addToast} onSave={saveSession} onDelete={deleteSession} onNavigate={navigateToEntity} />} />
                <Route path="/oficios" element={<OficiosModule oficios={oficios} sessions={sessions} darkMode={darkMode} addToast={addToast} onSave={saveOficio} onDelete={deleteOficio} onNavigate={navigateToEntity} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />} />
                <Route path="/agenda" element={<AgendaModule projects={projects} commissions={commissions} legislators={legislators} darkMode={darkMode} addToast={addToast} onSave={saveProject} onDelete={deleteProject} onNavigate={navigateToEntity} config={config} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />} />
                <Route path="/legisladores" element={<LegislatorsModule legislators={legislators} commissions={commissions} darkMode={darkMode} addToast={addToast} onSaveLegislator={saveLegislator} onSaveCommission={saveCommission} onDeleteLegislator={deleteLegislator} onDeleteCommission={deleteCommission} />} />
                <Route path="/leyes" element={<LawsLibrary darkMode={darkMode} addToast={addToast} onDataChange={loadAllData} />} />
                <Route path="/acuerdos" element={<AgreementsModule sessions={sessions} darkMode={darkMode} addToast={addToast} documents={documents} saveDocument={saveDocument} deleteDocument={deleteDocument} reload={loadAllData} />} />
                <Route path="/auditoria" element={<AuditModule auditLogs={auditLogs} darkMode={darkMode} />} />
                <Route path="/analytics" element={<AnalyticsModule config={config} darkMode={darkMode} addToast={addToast} setCurrentPage={(page) => navigate(`/${page}`)} />} />
                <Route path="/sincronizacion" element={<SyncSettings darkMode={darkMode} addToast={addToast} documents={documents} sessions={sessions} oficios={oficios} projects={projects} agreements={agreements} laws={laws} onDeleteDocument={deleteDocument} config={config} setConfig={setConfig} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ErrorBoundary>
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
