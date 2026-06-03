import React, { useState, useMemo } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, UserPlus, Eye, EyeOff, Check, X, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';
import ConfirmDialog from './ui/ConfirmDialog';

const AuthScreen = ({ onLogin, darkMode, addToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [showCloudRestore, setShowCloudRestore] = useState(false);
  const [cloudTokenInput, setCloudTokenInput] = useState('');
  const [needsCloudToken, setNeedsCloudToken] = useState(false);
  const [cloudBackupDetails, setCloudBackupDetails] = useState(null); // { filePath, date }
  const [restorePassword, setRestorePassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [form, setForm] = useState({
    username: 'admin',
    password: '',
    nombreCompleto: '',
    role: 'admin'
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, destructive: false });

  const handleRecover = async () => {
    if (recoveryPhrase.trim().split(/\s+/).length !== 12) {
      addToast('Debe ingresar las 12 palabras exactas', 'warning');
      return;
    }
    if (passwordStrength.score < 100) {
      addToast('La nueva contraseña debe ser fuerte', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await window.legisAPI.auth.recover(recoveryPhrase.trim().toLowerCase(), form.password);

      if (result.success) {
        addToast('Contraseña restablecida con éxito. Ya puede iniciar sesión.', 'success');
        setShowRecoverPassword(false);
        setRecoveryPhrase('');
        setForm({ ...form, password: '' });
      } else {
        addToast(result.message || 'Frase incorrecta', 'error');
      }
    } catch (e) {
      addToast('Error al restablecer contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordCriteria = useMemo(() => [
    { label: 'Mínimo 12 caracteres', met: form.password.length >= 12 },
    { label: 'Mayúscula y Minúscula', met: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
    { label: 'Al menos un número', met: /[0-9]/.test(form.password) },
    { label: 'Carácter especial (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(form.password) },
  ], [form.password]);

  const passwordStrength = useMemo(() => {
    const metCount = passwordCriteria.filter(c => c.met).length;
    if (form.password.length === 0) return { score: 0, color: 'bg-gray-200', label: 'Sin contraseña' };
    if (metCount <= 1) return { score: 25, color: 'bg-red-500', label: 'Muy Débil' };
    if (metCount === 2) return { score: 50, color: 'bg-orange-500', label: 'Débil' };
    if (metCount === 3) return { score: 75, color: 'bg-amber-500', label: 'Media' };
    return { score: 100, color: 'bg-emerald-500', label: 'Fuerte' };
  }, [passwordCriteria, form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password) {
      addToast('La contraseña es requerida', 'error');
      return;
    }

    if (isSignUp && passwordStrength.score < 100) {
      addToast('La contraseña debe cumplir todos los requisitos de seguridad', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const hash = await window.legisAPI.auth.hash(form.password);
        await dbService.saveUser({
          username: 'admin',
          passwordHash: hash,
          nombreCompleto: form.nombreCompleto,
          role: form.role
        });
        addToast('Usuario registrado exitosamente', 'success');
        setIsSignUp(false);
      } else {
        const result = await window.legisAPI.auth.login(form.username, form.password);
        if (result.success) {
          onLogin(result.user);
          addToast(`Bienvenido`, 'success');
        } else {
          addToast(result.message || 'Contraseña incorrecta', 'error');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      addToast('Error en la autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleCloudRestoreInit = async () => {
    setShowCloudRestore(true);
    setLoading(true);
    try {
      const { exists } = await window.legisAPI.backup.checkCloudToken();
      if (exists) {
        await fetchCloudBackup();
      } else {
        setNeedsCloudToken(true);
      }
    } catch (err) {
      addToast('Error verificando acceso a la nube.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCloudToken = async () => {
    if (!cloudTokenInput.trim()) return addToast('Ingresa el token', 'warning');
    setLoading(true);
    try {
      const res = await window.legisAPI.backup.setCloudToken(cloudTokenInput.trim());
      if (res.success) {
        setNeedsCloudToken(false);
        await fetchCloudBackup();
      } else {
        addToast(res.error || 'Error guardando token', 'error');
      }
    } catch (err) {
      addToast('Error de sistema', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudBackup = async () => {
    setLoading(true);
    try {
      const res = await window.legisAPI.backup.downloadFromCloud();
      if (res.success) {
        setCloudBackupDetails({ filePath: res.filePath, date: res.date });
      } else {
        addToast(res.details || res.error || 'No se pudo descargar el respaldo', 'error');
        if (res.error === 'TOKEN_MISSING' || res.error === 'CONFIG_MISSING') {
           setNeedsCloudToken(true);
        }
      }
    } catch (err) {
      addToast('Error descargando respaldo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmCloudRestore = async () => {
    if (!restorePassword) return addToast('Ingresa la contraseña del respaldo', 'warning');
    
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar respaldo en la nube',
      message: 'Restaurar un respaldo reemplazará TODOS los datos actuales. ¿Deseas continuar?',
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const result = await window.legisAPI.backup.validateAndRestore(cloudBackupDetails.filePath, restorePassword);
          if (result.success || !result.error) {
            alert('Restauración completada. La aplicación se reiniciará o volverá a la pantalla inicial.');
            window.location.reload();
          } else {
            addToast(result.error || 'Contraseña incorrecta o archivo dañado.', 'error');
          }
        } catch (err) {
          addToast('Error crítico al restaurar.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ... (keeping existing render logic and adding the new flow below)
  return (
    <>
    <div className={`min-h-[100dvh] flex items-center justify-center p-4 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4 shadow-lg">
            <img src="/logo-parlamentum.png" alt="PARLAMENTUM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold">
            {isSignUp ? 'Crear Administrador' : 'PARLAMENTUM'}
          </h1>
          <p className="text-sm mt-1 opacity-60">
            {isSignUp ? 'Configuración inicial del sistema' : 'Sistema de Gestión Legislativa'}
          </p>
        </div>

        {!showCloudRestore && !showRestore && !showRecoverPassword && (
           <form onSubmit={handleSubmit} className="space-y-4">
             {/* ... existing login form ... */}
             {isSignUp && (
               <div>
                 <label className="block text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider ml-1">Nombre Completo</label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Ej: Dr. Juan Pérez"
                     className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                     value={form.nombreCompleto}
                     onChange={e => setForm({ ...form, nombreCompleto: e.target.value })}
                     required
                   />
                 </div>
               </div>
             )}

             <div>
               <label className="block text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider ml-1">Contraseña</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                   type={showPassword ? "text" : "password"}
                   placeholder="••••••••"
                   className={`w-full pl-10 pr-12 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                   value={form.password}
                   onChange={e => setForm({ ...form, password: e.target.value })}
                   required
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                 >
                   {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                 </button>
               </div>
               
               {isSignUp && form.password.length > 0 && (
                 <div className="mt-3 space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                     <span className="opacity-60">Seguridad: {passwordStrength.label}</span>
                     <span className={passwordStrength.score === 100 ? 'text-emerald-500' : ''}>{passwordStrength.score}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-500 ${passwordStrength.color}`} 
                       style={{ width: `${passwordStrength.score}%` }}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                     {passwordCriteria.map((c, i) => (
                       <div key={i} className={`flex items-center gap-1.5 text-[10px] ${c.met ? 'text-emerald-500' : 'opacity-40'}`}>
                         {c.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         <span>{c.label}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>

             <button
               type="submit"
               disabled={loading}
               className={`w-full py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50`}
             >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <>
                   {isSignUp ? 'Registrar y Configurar' : 'Acceder al Sistema'}
                   <ArrowRight className="w-4 h-4" />
                 </>
               )}
             </button>
           </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          {showCloudRestore ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <p className="text-xs font-bold text-indigo-500 uppercase text-center flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Restaurar desde la Nube
              </p>
              
              {needsCloudToken ? (
                <div className="space-y-3">
                  <p className="text-sm opacity-80 mb-2">Para restaurar, necesito acceso a tu repositorio privado.</p>
                  <label className="block text-xs font-semibold opacity-50 mb-1 ml-1">Token de GitHub (PAT)</label>
                  <input
                    type="password"
                    placeholder="ghp_..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    value={cloudTokenInput}
                    onChange={e => setCloudTokenInput(e.target.value)}
                  />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowCloudRestore(false)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Cancelar</button>
                    <button onClick={handleSetCloudToken} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg disabled:opacity-50 flex justify-center items-center">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conectar'}
                    </button>
                  </div>
                </div>
              ) : cloudBackupDetails ? (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20 text-center">
                    <p className="text-xs font-bold mb-1">Se encontró un respaldo:</p>
                    <p className="text-sm">{new Date(cloudBackupDetails.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold opacity-50 mb-1 ml-1">Contraseña Maestra para Descifrar</label>
                    <input
                      type="password"
                      placeholder="Tu contraseña del sistema..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      value={restorePassword}
                      onChange={e => setRestorePassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCloudRestore(false)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Cancelar</button>
                    <button onClick={confirmCloudRestore} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg disabled:opacity-50 flex justify-center items-center">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Restaurar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold opacity-70">Buscando respaldos en GitHub...</p>
                </div>
              )}
            </div>
          ) : showRestore ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs font-bold text-amber-500 uppercase">Restauración de Sistema (Local)</p>
              <input
                type="password"
                placeholder="Contraseña del respaldo"
                className={`w-full px-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                value={restorePassword}
                onChange={e => setRestorePassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRestore(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!restorePassword) {
                      addToast('Ingresa la contraseña del respaldo', 'warning');
                      return;
                    }
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Restaurar respaldo local',
                      message: 'Restaurar un respaldo reemplazará TODOS los datos actuales. ¿Deseas continuar?',
                      destructive: true,
                      onConfirm: async () => {
                        try {
                          const result = await window.legisAPI.backup.import(restorePassword);
                          if (result.success) {
                            alert(result.message);
                            window.location.reload();
                          } else {
                            addToast('Contraseña incorrecta', 'error');
                          }
                        } catch (err) {
                          addToast('Error al restaurar: Contraseña incorrecta o archivo dañado.', 'error');
                        }
                       }
                    });
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Confirmar Restauración
                </button>
              </div>
            </div>
          ) : showRecoverPassword ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <p className="text-xs font-bold text-amber-500 uppercase text-center">Recuperación de Contraseña</p>
              
              <div>
                <label className="block text-xs font-semibold opacity-50 mb-1 ml-1">Frase de 12 Palabras</label>
                <textarea
                  placeholder="Ingrese las 12 palabras separadas por espacios..."
                  className={`w-full p-3 rounded-xl border outline-none text-sm resize-none focus:ring-2 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  rows={3}
                  value={recoveryPhrase}
                  onChange={e => setRecoveryPhrase(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold opacity-50 mb-1 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva contraseña fuerte"
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowRecoverPassword(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRecover}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Restablecer'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRecoverPassword(true)}
                className={`text-xs font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'} flex items-center justify-center gap-2 mx-auto`}
              >
                ¿Olvidaste tu contraseña? Restablecer acceso
              </button>

              <button
                type="button"
                onClick={handleCloudRestoreInit}
                className={`text-xs font-medium transition-colors ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} flex items-center justify-center gap-2 mx-auto mt-4`}
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar datos desde la Nube
              </button>

              <button
                type="button"
                onClick={() => setShowRestore(true)}
                className={`text-[10px] font-medium transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'} flex items-center justify-center gap-2 mx-auto mt-3`}
              >
                Restaurar sistema desde archivo local (.clbak)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    <ConfirmDialog isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} darkMode={darkMode} destructive={confirmDialog.destructive} />
    </>
  );
};

export default AuthScreen;
