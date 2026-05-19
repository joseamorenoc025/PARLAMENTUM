import React, { useState, useMemo } from 'react';
import { Gavel, User, Lock, ArrowRight, ShieldCheck, UserPlus, Eye, EyeOff, Check, X, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';

const AuthScreen = ({ onLogin, darkMode, addToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [form, setForm] = useState({
    password: '',
    nombreCompleto: '',
    role: 'admin'
  });

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
      const result = await window.legisAPI.invoke('auth:recover', {
        phrase: recoveryPhrase.trim().toLowerCase(),
        newPassword: form.password
      });

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
        const user = await window.legisAPI.invoke('auth:get-user');
        if (!user) {
          addToast('El sistema no está configurado', 'error');
          setLoading(false);
          return;
        }

        const isValid = await window.legisAPI.auth.verify(form.password, user.passwordHash);
        if (isValid) {
          await dbService.updateLastLogin(user.id);
          onLogin(user);
          addToast(`Bienvenido`, 'success');
        } else {
          addToast('Contraseña incorrecta', 'error');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      addToast('Error en la autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-all ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            {isSignUp ? 'Crear Administrador' : 'PARLAMENTUM'}
          </h1>
          <p className="text-sm mt-1 opacity-60">
            {isSignUp ? 'Configuración inicial del sistema' : 'Sistema de Gestión Legislativa'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej: Dr. Juan Pérez"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
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
                className={`w-full pl-10 pr-12 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
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

            {/* Medidor de fortaleza */}
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
            className={`w-full py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50`}
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

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          {showRestore ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs font-bold text-amber-500 uppercase">Restauración de Sistema</p>
              <input
                type="password"
                placeholder="Contraseña del respaldo"
                className={`w-full px-4 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
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
                  onClick={async () => {
                    if (!restorePassword) {
                      addToast('Ingresa la contraseña del respaldo', 'warning');
                      return;
                    }
                    if (window.confirm('ATENCIÓN: Restaurar un respaldo reemplazará TODOS los datos actuales. ¿Deseas continuar?')) {
                      try {
                        const result = await window.legisAPI.backup.import(restorePassword);
                        if (result.success) {
                          alert(result.message);
                          window.close();
                        }
                      } catch (err) {
                        addToast('Error al restaurar: Contraseña incorrecta o archivo dañado.', 'error');
                      }
                    }
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
                  className={`w-full p-3 rounded-xl border outline-none text-sm resize-none focus:ring-2 focus:ring-amber-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
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
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-amber-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
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
                {form.password.length > 0 && (
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
                  </div>
                )}
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
                onClick={() => setShowRestore(true)}
                className={`text-xs font-medium transition-colors ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} flex items-center justify-center gap-2 mx-auto mt-4`}
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar sistema desde respaldo (.clbak)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
