import React, { useState, useEffect } from 'react';
import { 
  Building2, UserPlus, ShieldCheck, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, Image as ImageIcon,
  ShieldAlert, AlertCircle, RefreshCw
} from 'lucide-react';
import BackupRestoreStep from './BackupRestoreStep';

const OnboardingWizard = ({ darkMode, onComplete, addToast }) => {
  const [step, setStep] = useState(1); // 1: Welcome, 2: Admin, 3: Institutional, 4: Success, 5: Restore
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState(null);
  
  // Data State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '¿Cuál fue el nombre de su primera mascota?',
    securityAnswer: '',
    chamberName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    logoBuffer: null
  });

  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const newErrors = {};
    if (step === 2) {
      if (formData.username.length < 3) newErrors.username = 'Mínimo 3 caracteres';
      if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
      if (formData.securityAnswer.length < 3) newErrors.securityAnswer = 'Mínimo 3 caracteres';
    }
    if (step === 3) {
      if (formData.chamberName.length < 3) newErrors.chamberName = 'Mínimo 3 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const result = await window.legisAPI.invoke('setup:initialize', formData);
      if (result.success) {
        setRecoveryCode(result.recoveryCode);
        setStep(4);
        if (addToast) addToast('Sistema inicializado con éxito', 'success');
      }
    } catch (err) {
      console.error('Setup failed:', err);
      if (addToast) addToast('Error en la configuración inicial. Revise los logs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreComplete = (userInfo) => {
    // Al restaurar con éxito, saltamos directamente al final o completamos
    onComplete();
  };

  const handleLogoSelect = async () => {
    try {
      const result = await window.legisAPI.invoke('dialog:open-image');
      if (result) {
        setFormData({ ...formData, logoBuffer: result.buffer });
      }
    } catch (err) {
      console.error('Logo selection failed:', err);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 rounded-2xl bg-indigo-500/10 w-fit">
              <Building2 className="w-12 h-12 text-indigo-500" />
            </div>
            <div>
              <h2 data-testid="onboarding-welcome-title" className="text-3xl font-black mb-3">Bienvenido a Cerebro Legislativo</h2>
              <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Este asistente le permitirá preparar el sistema en menos de 3 minutos. 
                Los datos configurados habilitarán la creación de sesiones, oficios y el portal público de leyes.
              </p>
            </div>
            <div className={`p-4 rounded-xl border border-dashed ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Nota de Seguridad</p>
              <p className="text-xs">Toda la configuración inicial se almacena de forma local y encriptada.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setStep(2)}
                data-testid="btn-start-setup"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/20"
              >
                Comenzar configuración <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setStep(5)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <RefreshCw className="w-4 h-4" /> Restaurar desde backup
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><UserPlus className="w-5 h-5" /></div>
              <h3 className="text-xl font-bold">Cuenta de Administrador</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  value={formData.username}
                  data-testid="admin-username-input"
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  placeholder="ej: admin.secretaria"
                />
                {errors.username && <p className="text-xs text-red-500 mt-1 ml-1">{errors.username}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Contraseña</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    data-testid="admin-password-input"
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Confirmar</label>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    data-testid="admin-confirm-password-input"
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Pregunta de Seguridad (Recuperación)</label>
                <select 
                  value={formData.securityQuestion}
                  onChange={e => setFormData({...formData, securityQuestion: e.target.value})}
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <option>¿Cuál fue el nombre de su primera mascota?</option>
                  <option>¿En qué ciudad nació su madre?</option>
                  <option>¿Cuál era el nombre de su escuela primaria?</option>
                </select>
                <input 
                  type="text" 
                  value={formData.securityAnswer}
                  data-testid="admin-security-answer-input"
                  onChange={e => setFormData({...formData, securityAnswer: e.target.value})}
                  placeholder="Su respuesta..."
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                />
                {errors.securityAnswer && <p className="text-xs text-red-500 mt-1 ml-1">{errors.securityAnswer}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Atrás</button>
              <button onClick={handleNext} data-testid="btn-onboarding-next" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20">Continuar</button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><Building2 className="w-5 h-5" /></div>
              <h3 className="text-xl font-bold">Datos Institucionales</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Nombre Oficial de la Cámara</label>
                <input 
                  type="text" 
                  value={formData.chamberName}
                  data-testid="chamber-name-input"
                  onChange={e => setFormData({...formData, chamberName: e.target.value})}
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  placeholder="ej: Concejo Municipal de..."
                />
                {errors.chamberName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.chamberName}</p>}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Zona Horaria</label>
                <select 
                  value={formData.timezone}
                  onChange={e => setFormData({...formData, timezone: e.target.value})}
                  className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <option value="America/Caracas">Venezuela (Caracas)</option>
                  <option value="America/Mexico_City">México (Ciudad de México)</option>
                  <option value="America/Bogota">Colombia (Bogotá)</option>
                  <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                </select>
              </div>

              <div className="pt-4">
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Escudo / Logo Oficial</label>
                <div className={`w-full p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50'}`}>
                  {formData.logoBuffer ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-emerald-500">Logo seleccionado</p>
                      <button onClick={handleLogoSelect} className="mt-2 text-[10px] uppercase font-black opacity-40 hover:opacity-100">Cambiar</button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-xs opacity-50 text-center">Formato PNG o JPG recomendado<br/>Máximo 2MB</p>
                      <button 
                        onClick={handleLogoSelect}
                        className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-all"
                      >
                        Seleccionar archivo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Atrás</button>
              <button 
                onClick={handleFinish} 
                disabled={isSubmitting}
                data-testid="btn-onboarding-finish"
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Finalizar
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in zoom-in duration-500 text-center py-4">
            <div className="mx-auto p-4 rounded-full bg-emerald-500/10 text-emerald-500 w-fit mb-4">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h2 data-testid="onboarding-success-title" className="text-3xl font-black">¡Configuración Exitosa!</h2>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>El sistema ha sido inicializado correctamente.</p>
            
            <div className={`p-6 rounded-3xl border-2 border-dashed text-left ${darkMode ? 'bg-gray-900 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-center gap-2 mb-3 text-indigo-500">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Código de Recuperación</span>
              </div>
              <p className="text-xs opacity-60 mb-4 leading-relaxed">Guarde este código en un lugar seguro. Le permitirá recuperar el acceso si olvida su contraseña o pierde el acceso a la cuenta administradora.</p>
              <div className={`p-4 rounded-xl text-center font-mono text-2xl font-black tracking-widest ${darkMode ? 'bg-gray-800' : 'bg-white shadow-inner'}`}>
                {recoveryCode}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-500/5 text-amber-500 rounded-2xl border border-amber-500/10 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-[10px] font-bold leading-tight">ATENCIÓN: Por seguridad, este código no volverá a mostrarse. Por favor, anótelo o tome una captura antes de continuar.</p>
            </div>

            <button 
              onClick={() => onComplete()}
              data-testid="btn-onboarding-start-using"
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest"
            >
              Comenzar a usar el sistema
            </button>
          </div>
        );

      case 5:
        return (
          <BackupRestoreStep 
            darkMode={darkMode} 
            onComplete={handleRestoreComplete} 
            onCancel={() => setStep(1)} 
            addToast={addToast}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-[2.5rem] border shadow-2xl p-8 md:p-12 ${darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-100'}`}>
        {step < 4 && (
          <div className="flex items-center gap-2 mb-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 h-1.5 w-full">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}
        
        {renderStep()}

        {(step < 4 && step !== 5) && (
          <div className="mt-10 flex justify-center">
             <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-indigo-500 w-6' : 'bg-gray-300 dark:bg-gray-700'}`} />
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
