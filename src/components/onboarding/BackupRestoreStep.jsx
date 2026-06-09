import React, { useState } from 'react';
import { 
  FileArchive, ShieldCheck, AlertCircle, Loader2, 
  CheckCircle2, Eye, EyeOff, UploadCloud
} from 'lucide-react';

const BackupRestoreStep = ({ darkMode, onComplete, onCancel, addToast }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [filePath, setFilePath] = useState('');
  const [error, setError] = useState(null);

  const handleRestore = async () => {
    if (!filePath || password.length < 8) return;
    
    setIsSubmitting(true);
    setError(null);
    
    console.log('E2E Debug - Restoring from:', { filePath, password: password ? '***' : 'missing' });
    try {
      const result = await window.legisAPI.backup.validateAndRestore(filePath, password);

      if (result.success) {
        if (addToast) addToast('Base de datos restaurada con éxito', 'success');
        onComplete(result.userInfo);
      } else {
        const errorMessages = {
          'INVALID_CREDENTIALS': 'La contraseña es incorrecta.',
          'CORRUPTED_FILE': 'El archivo de backup está dañado o no es válido.',
          'INVALID_FILE_TYPE': 'Solo se permiten archivos con extensión .enc.',
          'FILE_NOT_FOUND': 'No se pudo encontrar el archivo seleccionado.',
          'INVALID_PAYLOAD': 'Datos de entrada no válidos.'
        };
        setError(errorMessages[result.error] || 'Error inesperado durante la restauración.');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      setError('Error crítico del sistema al intentar restaurar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="backup-restore-step" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <FileArchive className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold">Restaurar desde Backup</h3>
      </div>

      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Seleccione su archivo de copia de seguridad (.enc) e ingrese la contraseña con la que fue protegido.
      </p>

      <div className="space-y-4">
        {/* Selector de Archivo */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Archivo de Backup</label>
          <input 
            type="file" 
            accept=".clbak,.enc" 
            data-testid="backup-file-input" 
            className="hidden" 
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                setFilePath(e.target.files[0].path);
                setError(null);
              }
            }} 
          />
          <div 
            onClick={() => document.querySelector('[data-testid="backup-file-input"]').click()}
            data-testid="btn-select-backup-file"
            className={`w-full p-4 border-2 border-dashed rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
              filePath 
                ? (darkMode ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50')
                : (darkMode ? 'border-gray-800 hover:border-indigo-500/50 bg-gray-900' : 'border-gray-200 hover:border-indigo-300 bg-gray-50')
            }`}
          >
            {filePath ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <UploadCloud className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            )}
            <span data-testid="selected-file-name" className={`text-sm truncate ${filePath ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : 'opacity-50'}`}>
              {filePath ? filePath.split(/[\\/]/).pop() : 'Seleccionar archivo .enc o .clbak'}
            </span>
          </div>
          {!filePath.endsWith('.clbak') && !filePath.endsWith('.enc') && filePath !== '' && (
            <p data-testid="file-extension-error" className="text-xs text-red-500 mt-1 ml-1">Solo se permiten archivos .clbak o .enc</p>
          )}
        </div>

        {/* Password Input */}
        <div className="relative">
          <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-2 ml-1">Contraseña de Encriptación</label>
          <input 
            type={showPassword ? "text" : "password"} 
            value={password}
            data-testid="backup-password-input"
            onChange={e => setPassword(e.target.value)}
            className={`w-full p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
            placeholder="Mínimo 8 caracteres"
          />
          <button 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-10 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div data-testid="restore-error" className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            <span data-testid="restore-error-message">{error}</span>
          </div>
        )}
      </div>

      <div className={`p-4 rounded-xl border border-dashed ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Aviso Importante</p>
        </div>
        <p className="text-[10px] leading-relaxed">
          La restauración reemplazará todos los datos actuales del sistema. Se creará una copia de seguridad automática antes de proceder.
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onCancel}
          disabled={isSubmitting}
          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Cancelar
        </button>
        <button 
          onClick={handleRestore} 
          disabled={isSubmitting || !filePath || password.length < 8 || (!filePath.endsWith('.clbak') && !filePath.endsWith('.enc'))}
          data-testid="btn-validate-restore"
          className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
        >
          {isSubmitting ? (
            <Loader2 data-testid="restore-loading" className="w-4 h-4 animate-spin" />
          ) : (
            <>Restaurar y Continuar</>
          )}
        </button>
      </div>
    </div>
  );
};

export default BackupRestoreStep;
