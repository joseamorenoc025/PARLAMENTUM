import React from 'react';
import { TriangleAlert } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, darkMode, destructive = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ animation: 'scale-in 0.2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${destructive ? (darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500') : (darkMode ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500')}`}>
            <TriangleAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{message}</p>
        </div>
        <div className={`flex gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
