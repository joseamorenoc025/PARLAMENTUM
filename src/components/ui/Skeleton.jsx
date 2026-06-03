import React from 'react';

const Skeleton = ({ className = '', variant = 'rect', count = 1 }) => {
  const base = 'animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700/50';
  const variants = {
    rect: '',
    circle: 'rounded-full',
    text: 'h-4 rounded',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${base} ${variants[variant]}`}>&nbsp;</div>
      ))}
    </div>
  );
};

export const StatCardSkeleton = ({ darkMode }) => (
  <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
    <div className={`w-10 h-10 rounded-xl mb-3 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className={`h-3 w-20 rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className={`h-8 w-12 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
  </div>
);

export const TableRowSkeleton = ({ darkMode, cols = 4 }) => (
  <tr className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + Math.random() * 30}%` }} />
      </td>
    ))}
  </tr>
);

export const CardSkeleton = ({ darkMode }) => (
  <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
    <div className="flex items-start justify-between mb-5">
      <div className={`w-12 h-12 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-6 w-6 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
    <div className={`h-5 w-3/4 rounded mb-3 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className="space-y-2">
      <div className={`h-3 w-full rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-2/3 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
);

export const KanbanColumnSkeleton = ({ darkMode, count = 3 }) => (
  <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
    <div className={`h-4 w-24 rounded mb-4 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`h-4 w-full rounded mb-2 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-3 w-2/3 rounded mb-3 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className="flex gap-2">
            <div className={`h-5 w-16 rounded-full animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-5 w-12 rounded-full animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
