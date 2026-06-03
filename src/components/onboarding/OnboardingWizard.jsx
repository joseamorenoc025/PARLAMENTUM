import React, { useState, useEffect } from 'react';
import { 
  Building2, UserPlus, ShieldCheck, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, Image as ImageIcon,
  ShieldAlert, AlertCircle, RefreshCw, Copy, Download, FileText, Lock
} from 'lucide-react';
import BackupRestoreStep from './BackupRestoreStep';

const OnboardingWizard = ({ darkMode, onComplete, addToast }) => {
  const [step, setStep] = useState(1); // 1: Welcome, 2: Admin, 3: Institutional, 4: Success, 5: Restore
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState(null);
  const [saveOption, setSaveOption] = useState('A');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationIndices, setVerificationIndices] = useState([]);
  const [verificationInputs, setVerificationInputs] = useState(['', '', '']);
  const [clipboardTimeoutId, setClipboardTimeoutId] = useState(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    chamberName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    logoBuffer: null
  });

  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const newErrors = {};
    if (step === 2) {
      if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      const result = await window.legisAPI.setup.initialize(formData);
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
      const result = await window.legisAPI.dialog.openImage();
      if (result) {
        setFormData({ ...formData, logoBuffer: result.buffer });
      }
    } catch (err) {
      console.error('Logo selection failed:', err);
    }
  };

  useEffect(() => {
    if (recoveryCode && verificationIndices.length === 0) {
      const indices = [];
      while (indices.length < 3) {
        const r = Math.floor(Math.random() * 12);
        if (!indices.includes(r)) indices.push(r);
      }
      setVerificationIndices(indices.sort((a, b) => a - b));
    }
  }, [recoveryCode, verificationIndices.length]);

  useEffect(() => {
    return () => {
      if (clipboardTimeoutId) clearTimeout(clipboardTimeoutId);
    };
  }, [clipboardTimeoutId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    if (addToast) addToast('Copiado. Pégalo en tu gestor de contraseñas. El portapapeles se limpiará en 30s.', 'success');
    
    if (clipboardTimeoutId) clearTimeout(clipboardTimeoutId);
    const id = setTimeout(() => {
        navigator.clipboard.writeText('');
        if (addToast) addToast('Portapapeles limpiado por seguridad.', 'info');
    }, 30000);
    setClipboardTimeoutId(id);
  };

  const isVerificationCorrect = () => {
    if (!recoveryCode || verificationIndices.length !== 3) return false;
    const words = recoveryCode.split(' ');
    return verificationInputs.every((input, index) => {
        const targetWord = words[verificationIndices[index]];
        return input.trim().toLowerCase() === targetWord.toLowerCase();
    });
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
              <h2 data-testid="onboarding-welcome-title" className="text-3xl font-black mb-3">Bienvenido a PARLAMENTUM</h2>
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
                  <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Confirmar Contraseña</label>
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
        if (showVerification) {
          const words = recoveryCode ? recoveryCode.split(' ') : [];
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
              <div className="mx-auto p-4 rounded-full bg-indigo-500/10 text-indigo-500 w-fit mb-4">
                <ShieldCheck className="w-16 h-16" />
              </div>
              <h2 className="text-3xl font-black text-center">Verificación de Seguridad</h2>
              <p className={`text-lg text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Para confirmar que guardaste tu frase, ingresa las palabras correspondientes.
              </p>
              
              <div className="space-y-4 max-w-sm mx-auto mt-8">
                {verificationIndices.map((idx, i) => (
                  <div key={idx}>
                    <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">
                      Palabra #{idx + 1}
                    </label>
                    <input 
                      type="text"
                      data-testid={`verification-input-${i}`}
                      value={verificationInputs[i]}
                      onChange={(e) => {
                        const newInputs = [...verificationInputs];
                        newInputs[i] = e.target.value;
                        setVerificationInputs(newInputs);
                      }}
                      className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      placeholder={`Palabra ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-8">
                <button 
                  onClick={() => setShowVerification(false)} 
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Volver a ver la frase
                </button>
                <button 
                  onClick={() => onComplete()}
                  disabled={!isVerificationCorrect()}
                  data-testid="btn-onboarding-start-using"
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center transition-all ${
                    isVerificationCorrect() 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  }`}
                >
                  Comenzar a usar
                </button>
              </div>
            </div>
          );
        }

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
                <span className="text-sm font-black uppercase tracking-widest">Frase de Recuperación (12 Palabras)</span>
              </div>
              <p className="text-xs opacity-60 mb-6 leading-relaxed">
                Seleccione un método seguro para respaldar estas palabras. Son la ÚNICA forma de recuperar el acceso si olvida su contraseña.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <label className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all ${saveOption === 'A' ? 'border-indigo-500 bg-indigo-500/5' : (darkMode ? 'border-gray-800' : 'border-gray-200')}`}>
                  <input type="radio" name="saveOption" value="A" checked={saveOption === 'A'} onChange={() => setSaveOption('A')} className="mr-3" />
                  <div className="flex-1">
                    <p className="font-bold text-sm flex items-center gap-2"><Lock className="w-4 h-4"/> Opción A (Recomendada): Bóveda Digital</p>
                    <p className="text-[10px] opacity-60">Proton Pass, Bitwarden, 1Password, etc.</p>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all ${saveOption === 'B' ? 'border-indigo-500 bg-indigo-500/5' : (darkMode ? 'border-gray-800' : 'border-gray-200')}`}>
                  <input type="radio" name="saveOption" value="B" checked={saveOption === 'B'} onChange={() => setSaveOption('B')} className="mr-3" />
                  <div className="flex-1">
                    <p className="font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4"/> Opción B: Imprimir en papel</p>
                    <p className="text-[10px] opacity-60">Copiar manualmente o imprimir la frase.</p>
                  </div>
                </label>
                <label className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all ${saveOption === 'C' ? 'border-indigo-500 bg-indigo-500/5' : (darkMode ? 'border-gray-800' : 'border-gray-200')}`}>
                  <input type="radio" name="saveOption" value="C" checked={saveOption === 'C'} onChange={() => setSaveOption('C')} className="mr-3" />
                  <div className="flex-1">
                    <p className="font-bold text-sm flex items-center gap-2"><Download className="w-4 h-4"/> Opción C: Exportar como PDF</p>
                    <p className="text-[10px] opacity-60">Guardar un archivo PDF en un lugar seguro.</p>
                  </div>
                </label>
              </div>
              
              {saveOption === 'A' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 p-3 bg-indigo-500/10 text-indigo-500 rounded-xl mb-4">
                     <AlertCircle className="w-4 h-4" />
                     <p className="text-xs font-bold">Abre tu app de contraseñas, crea una &quot;Nota Segura&quot; y pega las palabras allí.</p>
                  </div>
                  <div className={`p-4 rounded-xl font-mono font-black ${darkMode ? 'bg-gray-800' : 'bg-white shadow-inner'} grid grid-cols-3 gap-3 mb-4 text-center text-sm md:text-base`}>
                    {recoveryCode && recoveryCode.split(' ').map((word, i) => (
                      <div key={i} className="flex gap-2 justify-center">
                        <span className="opacity-40 text-[10px] self-center">{i + 1}.</span>
                        <span className="tracking-widest uppercase">{word}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCopyCode} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                    <Copy className="w-4 h-4" /> Copiar al Portapapeles
                  </button>
                </div>
              )}

              {saveOption === 'B' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`p-4 rounded-xl font-mono font-black ${darkMode ? 'bg-gray-800' : 'bg-white shadow-inner'} grid grid-cols-3 gap-3 mb-4 text-center text-sm md:text-base`}>
                    {recoveryCode && recoveryCode.split(' ').map((word, i) => (
                      <div key={i} className="flex gap-2 justify-center">
                        <span className="opacity-40 text-[10px] self-center">{i + 1}.</span>
                        <span className="tracking-widest uppercase">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveOption === 'C' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`p-4 rounded-xl font-mono font-black ${darkMode ? 'bg-gray-800' : 'bg-white shadow-inner'} grid grid-cols-3 gap-3 mb-4 text-center text-sm md:text-base blur-sm hover:blur-none transition-all`}>
                    {recoveryCode && recoveryCode.split(' ').map((word, i) => (
                      <div key={i} className="flex gap-2 justify-center">
                        <span className="opacity-40 text-[10px] self-center">{i + 1}.</span>
                        <span className="tracking-widest uppercase">{word}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      import('jspdf').then(({ jsPDF }) => {
                        const doc = new jsPDF();
                        doc.setFontSize(22);
                        doc.text("PARLAMENTUM", 20, 30);
                        doc.setFontSize(16);
                        doc.text("Frase de Recuperación", 20, 45);
                        doc.setFontSize(12);
                        doc.text("Guarde este documento en un lugar seguro (ej. caja fuerte).", 20, 60);
                        doc.text("Estas 12 palabras son la ÚNICA forma de recuperar el acceso", 20, 70);
                        doc.text("si olvida su contraseña.", 20, 80);
                        
                        doc.setFontSize(14);
                        doc.setFont("courier", "bold");
                        const words = recoveryCode.split(' ');
                        let y = 100;
                        for (let i = 0; i < words.length; i += 3) {
                          const line = words.slice(i, i + 3).map((w, idx) => `${i + idx + 1}. ${w.toUpperCase()}`).join('    ');
                          doc.text(line, 20, y);
                          y += 15;
                        }
                        doc.save("Frase_de_Recuperacion_PARLAMENTUM.pdf");
                      });
                    }}
                    className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Descargar PDF
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowVerification(true)}
              data-testid="btn-onboarding-verify"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-widest mt-4"
            >
              Ya guardé mi frase, Continuar
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
