import React from 'react';

export const RangeSelector = React.memo(function RangeSelector({
  title = 'Metabolism Stats',
  value,
  onChange,
  options = [],
  darkMode = false,
  size = 'default',
  surface = 'default'
}) {
  const isCompact = size === 'compact';
  const surfaceClass = surface === 'strong' ? 'glass-surface-strong' : 'glass-surface';
  return (
    <section
      className={`rounded-glass ${surfaceClass} glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      } ${isCompact ? 'px-4 py-3' : 'px-4 py-5'}`}
      aria-label={title}
    >
      <p className={`${isCompact ? 'text-sm font-semibold' : 'text-lg font-semibold'}`}>
        {title}
      </p>
      <div
        className={`flex rounded-full p-1 ${
          darkMode ? 'bg-white/10' : 'bg-white/70 shadow-sm'
        } ${isCompact ? 'mt-2' : 'mt-3'}`}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? darkMode
                    ? 'bg-white/15 text-white ring-offset-slate-950'
                    : 'bg-slate-900/90 text-white ring-offset-white'
                  : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
              } ${darkMode ? 'focus-visible:ring-white/30' : 'focus-visible:ring-blue-500'} ${
                isCompact ? 'px-3 py-1.5 text-xs font-medium' : 'px-3 py-2 text-sm font-semibold'
              }`}
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

