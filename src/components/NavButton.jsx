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
      ? 'bg-slate-800 text-blue-200'
      : 'bg-blue-50 text-blue-700'
    : darkMode
      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100';

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        darkMode
          ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
          : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
      } ${baseClass}`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
});
