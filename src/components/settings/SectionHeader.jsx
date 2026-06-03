import React from 'react';

export default function SectionHeader({ icon: Icon, title, description, color = 'indigo', darkMode }) {
  const colorMap = {
    indigo: { bg: darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600' },
    emerald: { bg: darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600' },
    blue: { bg: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600' },
    amber: { bg: darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600' },
    purple: { bg: darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600' },
    gray: { bg: darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600' },
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${colorMap[color]?.bg || colorMap.indigo.bg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>}
      </div>
    </div>
  );
}
