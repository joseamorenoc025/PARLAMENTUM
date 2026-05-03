import React, { useState, useMemo } from 'react';
import { Gavel, User, Lock, ArrowRight, ShieldCheck, UserPlus, Eye, EyeOff, Check, X } from 'lucide-react';
import { dbService } from '../services/db';

const AuthScreen = ({ onLogin, darkMode, addToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    role: 'admin'
  });

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
    if (!form.username || !form.password) {
      addToast('Usuario y contraseña requeridos', 'error');
      return;
    }

    if (isSignUp && passwordStrength.score < 100) {
      addToast('La contraseña debe cumplir todos los requisitos de seguridad', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const existing = await dbService.getUserByUsername(form.username);
        if (existing) {
          addToast('El usuario ya existe', 'error');
          setLoading(false);
          return;
        }

        const hash = await window.legisAPI.auth.hash(form.password);
        await dbService.saveUser({
          username: form.username,
          password_hash: hash,
          nombre_completo: form.nombre_completo,
          role: form.role
        });
        addToast('Usuario registrado exitosamente', 'success');
        setIsSignUp(false);
      } else {
        const user = await dbService.getUserByUsername(form.username);
        if (!user) {
          addToast('Usuario no encontrado', 'error');
          setLoading(false);
          return;
        }

        const isValid = await window.legisAPI.auth.verify(form.password, user.password_hash);
        if (isValid) {
          await dbService.updateLastLogin(user.id);
          onLogin(user);
          addToast(`Bienvenido, ${user.nombre_completo || user.username}`, 'success');
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
            {isSignUp ? 'Crear Administrador' : 'Segundo Cerebro'}
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
                  value={form.nombre_completo}
                  onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold opacity-50 mb-1 uppercase tracking-wider ml-1">Usuario</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="admin"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
          </div>

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
          <button
            onClick={() => { setIsSignUp(!isSignUp); setForm({...form, password: ''}); }}
            className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'} flex items-center justify-center gap-2 mx-auto`}
          >
            {isSignUp ? (
              <>¿Ya tienes cuenta? Iniciar Sesión</>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Registrar nuevo Administrador
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
