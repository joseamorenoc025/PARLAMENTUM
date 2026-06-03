import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ darkMode, icon, label, value, color, onClick, trend }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  };

  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-gray-400';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 transition-colors ${onClick ? 'cursor-pointer hover:shadow-lg active:scale-95' : ''} ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-3xl font-bold">{value}</p>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
