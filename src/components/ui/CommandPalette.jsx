import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, sessions, oficios, projects, legislators, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found = [];
    
    if (sessions) {
      sessions.filter(s => s.activo).forEach(s => {
        if (s.numeroCorrelativo?.toLowerCase().includes(q) || s.tipo?.toLowerCase().includes(q) || (s.fecha && s.fecha.includes(q))) {
          found.push({ type: 'sesion', id: s.id, label: `${s.numeroCorrelativo || s.tipo} - ${s.fecha}` });
        }
      });
    }
    
    if (oficios) {
      oficios.filter(o => o.activo).forEach(o => {
        if (o.numeroOficio?.toLowerCase().includes(q) || o.asunto?.toLowerCase().includes(q)) {
          found.push({ type: 'oficio', id: o.id, label: `${o.numeroOficio} - ${o.asunto}` });
        }
      });
    }
    
    if (projects) {
      projects.filter(p => p.activo).forEach(p => {
        if (p.titulo?.toLowerCase().includes(q)) {
          found.push({ type: 'proyecto', id: p.id, label: p.titulo });
        }
      });
    }

    if (legislators) {
      legislators.filter(l => l.activo).forEach(l => {
        if (l.nombre?.toLowerCase().includes(q)) {
          found.push({ type: 'legislador', id: l.id, label: l.nombre });
        }
      });
    }

    return found.slice(0, 10);
  }, [query, sessions, oficios, projects, legislators]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ animation: 'scale-in 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar sesiones, oficios, proyectos, legisladores..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query && (
            <p className="text-center py-8 text-gray-400 text-sm">Sin resultados</p>
          )}
          {!query && (
            <div className="py-8 text-center text-gray-400 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Escribe para buscar en toda la aplicación</p>
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors cursor-pointer"
              onClick={() => {
                if (onNavigate && r.type && r.id) onNavigate(r.type, r.id);
                onClose();
              }}
            >
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{r.type}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
