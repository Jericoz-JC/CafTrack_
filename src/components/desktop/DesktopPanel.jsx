import React from 'react';

export const DesktopPanel = ({ title, subtitle, action, children, darkMode, className = '', bodyClassName }) => {
  const bodyClasses = bodyClassName ?? 'mt-4';
  const contrastClass = darkMode
    ? 'border-white/10 ring-0'
    : 'ring-1 ring-slate-200/80';
  const surfaceClass = darkMode ? 'glass-surface-strong' : 'glass-surface-strong glass-highlight';
  return (
    <section
      className={`rounded-3xl ${surfaceClass} p-4 ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      } ${contrastClass} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className={bodyClasses}>{children}</div>
    </section>
  );
};
