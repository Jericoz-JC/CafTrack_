import React from 'react';

export const NavButton = React.memo(function NavButton({
  icon,
  label,
  active,
  onClick,
  darkMode = false
}) {
  const baseClass = active
    ? darkMode
      ? 'bg-white/10 text-slate-100'
      : 'bg-sky-500/10 text-sky-700'
    : darkMode
      ? 'text-slate-400 hover:text-white hover:bg-white/10'
      : 'text-slate-500 hover:text-slate-700 hover:bg-white/70';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        darkMode
          ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
          : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
      } ${baseClass}`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform duration-200`} aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
});
