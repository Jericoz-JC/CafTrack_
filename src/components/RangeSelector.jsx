import React from 'react';

export const RangeSelector = React.memo(function RangeSelector({
  title = 'Metabolism Stats',
  value,
  onChange,
  options = [],
  darkMode = false,
}) {
  return (
    <section
      className={`rounded-glass px-4 py-5 glass-surface glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
      aria-label={title}
    >
      <p className="text-lg font-semibold">{title}</p>
      <div
        className={`mt-3 flex rounded-full p-1 ${
          darkMode ? 'bg-white/10' : 'bg-white/70 shadow-sm'
        }`}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? darkMode
                    ? 'bg-slate-700 text-white ring-offset-slate-900'
                    : 'bg-slate-900 text-white ring-offset-white'
                  : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
              } ${darkMode ? 'focus-visible:ring-blue-400' : 'focus-visible:ring-blue-500'}`}
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
});

