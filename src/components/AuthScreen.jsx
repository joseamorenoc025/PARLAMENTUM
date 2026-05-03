import React, { useState } from 'react';
import { Gavel, User, Lock, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import { dbService } from '../services/db';

const AuthScreen = ({ onLogin, darkMode, addToast }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    role: 'admin' // El primer usuario será admin por defecto
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      addToast('Usuario y contraseña requeridos', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Registro (Solo para el primer Admin o si el Admin crea otros)
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
        addToast('Usuario registrado exitosamente. Por favor, inicia sesión.', 'success');
        setIsSignUp(false);
      } else {
        // Login
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
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Gavel className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isSignUp ? 'Crear Administrador' : 'Segundo Cerebro'}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isSignUp ? 'Configuración inicial del sistema' : 'Sistema de Gestión Legislativa'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ej: Dr. Juan Pérez"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                  value={form.nombre_completo}
                  onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider ml-1">Usuario</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="admin"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
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
                {isSignUp ? 'Registrar' : 'Acceder'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
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
