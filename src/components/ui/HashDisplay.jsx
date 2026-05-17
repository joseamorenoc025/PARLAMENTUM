import React, { useState } from 'react';
import { ShieldCheck, Copy, Check } from 'lucide-react';

/**
 * HashDisplay — Muestra un hash SHA-256 completo con botón de copia.
 * Props:
 *   hash     (string) — El hash de 64 caracteres SHA-256.
 *   darkMode (bool)   — Tema oscuro/claro.
 *   label    (string) — Etiqueta opcional (default: "Sello de Integridad SHA-256").
 */
const HashDisplay = ({ hash, darkMode, label = 'Sello de Integridad SHA-256' }) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para Electron sin permisos de clipboard
      const el = document.createElement('textarea');
      el.value = hash;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-2xl border ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Copiar hash al portapapeles"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
            copied
              ? 'bg-emerald-500 text-white'
              : (darkMode
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200')
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </button>
      </div>

      {/* Hash completo */}
      <code
        className={`block w-full text-[11px] font-mono break-all leading-relaxed select-all ${
          darkMode ? 'text-emerald-300' : 'text-emerald-800'
        }`}
      >
        {hash}
      </code>

      {/* Nota informativa */}
      <p className={`mt-3 text-[9px] leading-relaxed opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Este código identifica de forma única el archivo registrado. Si el documento original es alterado, el código cambiará.
      </p>
    </div>
  );
};

export default HashDisplay;
