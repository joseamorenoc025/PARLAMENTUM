import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm
          ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30 text-white' : ''}
          ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/30 text-white' : ''}
          ${toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400/30 text-white' : ''}
          ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-400/30 text-white' : ''}`}
        style={{ animation: 'slide-in 0.3s ease-out' }}
      >
        {toast.type === 'success' && <Check className="w-4 h-4" />}
        {toast.type === 'error' && <X className="w-4 h-4" />}
        {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
        {toast.type === 'info' && <Info className="w-4 h-4" />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

export default ToastContainer;
