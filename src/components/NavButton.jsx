import React from 'react';

export const NavButton = ({ icon, label, active, onClick, darkMode = false }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-2 ${
        active 
          ? darkMode 
            ? 'text-blue-400' 
            : 'text-blue-600'
          : darkMode 
            ? 'text-gray-400' 
            : 'text-gray-500'
      }`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}; 