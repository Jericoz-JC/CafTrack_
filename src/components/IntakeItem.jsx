import React from 'react';
import { Coffee, X } from 'lucide-react';

export const IntakeItem = React.memo(function IntakeItem({
  intake,
  onRemove,
  darkMode = false,
  compact = false
}) {
  // Format the timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
    
    // Format just time for today's entries
    if (isToday) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } 
    // Format date and time for older entries
    else {
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };
  
  // Get icon based on category
  const getIcon = () => {
    return <Coffee size={compact ? 16 : 18} aria-hidden="true" />;
  };
  
  // Get background color based on category
  const getBgColor = () => {
    const colors = {
      coffee: darkMode ? 'bg-amber-900' : 'bg-amber-100',
      tea: darkMode ? 'bg-green-900' : 'bg-green-100',
      energy: darkMode ? 'bg-red-900' : 'bg-red-100',
      soda: darkMode ? 'bg-purple-900' : 'bg-purple-100',
      custom: darkMode ? 'bg-slate-800' : 'bg-blue-100'
    };
    
    return colors[intake.category] || (darkMode ? 'bg-white/10' : 'bg-white/70');
  };
  
  // Get text color based on category
  const getTextColor = () => {
    const colors = {
      coffee: darkMode ? 'text-amber-400' : 'text-amber-800',
      tea: darkMode ? 'text-green-400' : 'text-green-800',
      energy: darkMode ? 'text-red-400' : 'text-red-800',
      soda: darkMode ? 'text-purple-400' : 'text-purple-800',
      custom: darkMode ? 'text-slate-200' : 'text-blue-800'
    };
    
    return colors[intake.category] || (darkMode ? 'text-slate-300' : 'text-slate-800');
  };
  
  return (
    <div
      className={`rounded-2xl flex items-center justify-between glass-surface glass-highlight transition-transform duration-200 hover:-translate-y-0.5 ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      } ${compact ? 'p-2' : 'p-3'}`}
    >
      <div className="flex items-center min-w-0">
        <div className={`${compact ? 'p-1.5 mr-2' : 'p-2 mr-3'} rounded-full ${getBgColor()}`}>
          <span className={getTextColor()}>
            {getIcon()}
          </span>
        </div>
        
        <div className="min-w-0">
          <h3
            className={`font-medium truncate ${compact ? 'text-sm' : ''} ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
            title={intake.name}
          >
            {intake.name}
          </h3>
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {formatTime(intake.timestamp)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center">
        <span className={`font-medium mr-4 tabular-nums ${compact ? 'text-xs' : ''} ${darkMode ? 'text-slate-100' : 'text-blue-600'}`}>
          {intake.amount} mg
        </span>
        
        <button 
          onClick={() => onRemove(intake.id)}
          aria-label={`Remove ${intake.name}`}
          className={`p-1 rounded-full hover:bg-opacity-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-900/5'
          } ${
            darkMode
              ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
              : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
          }`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}); 
