import React from 'react';

/**
 * EmptyState component to display when there is no data.
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} props.icon - Lucide icon component
 * @param {string} props.title - Formal title
 * @param {string} props.description - Guide/action description
 * @param {Object} [props.action] - Optional action button
 * @param {string} props.action.label - Button label
 * @param {Function} props.action.onClick - Click handler
 * @param {'default' | 'outline'} [props.action.variant] - Button variant
 * @param {string} [props.className] - Additional Tailwind classes
 * @param {string} [props.dataTestId] - For E2E testing
 */
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '', 
  dataTestId 
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-8 min-h-[60vh] animate-in fade-in zoom-in duration-300 ${className}`}
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      <div className="p-6 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-6">
        <Icon className="w-12 h-12 text-gray-400 dark:text-gray-600 opacity-60" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`
            px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95
            ${action.variant === 'outline' 
              ? 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default React.memo(EmptyState);
