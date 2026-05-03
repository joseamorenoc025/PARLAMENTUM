import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} style={{ animation: 'scale-in 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-t-2xl z-10`}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
