import React from 'react';
import { Coffee, X } from 'lucide-react';

export const IntakeItem = React.memo(function IntakeItem({
  intake,
  onRemove,
  darkMode = false
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
    return <Coffee size={18} />;
  };
  
  // Get background color based on category
  const getBgColor = () => {
    const colors = {
      coffee: darkMode ? 'bg-amber-900' : 'bg-amber-100',
      tea: darkMode ? 'bg-green-900' : 'bg-green-100',
      energy: darkMode ? 'bg-red-900' : 'bg-red-100',
      soda: darkMode ? 'bg-purple-900' : 'bg-purple-100',
      custom: darkMode ? 'bg-blue-900' : 'bg-blue-100'
    };
    
    return colors[intake.category] || (darkMode ? 'bg-slate-800' : 'bg-slate-100');
  };
  
  // Get text color based on category
  const getTextColor = () => {
    const colors = {
      coffee: darkMode ? 'text-amber-400' : 'text-amber-800',
      tea: darkMode ? 'text-green-400' : 'text-green-800',
      energy: darkMode ? 'text-red-400' : 'text-red-800',
      soda: darkMode ? 'text-purple-400' : 'text-purple-800',
      custom: darkMode ? 'text-blue-400' : 'text-blue-800'
    };
    
    return colors[intake.category] || (darkMode ? 'text-slate-300' : 'text-slate-800');
  };
  
  return (
    <div
      className={`p-3 rounded-2xl flex items-center justify-between glass-surface glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-full mr-3 ${getBgColor()}`}>
          <span className={getTextColor()}>
            {getIcon()}
          </span>
        </div>
        
        <div>
          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {intake.name}
          </h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {formatTime(intake.timestamp)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center">
        <span className={`font-medium mr-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {intake.amount} mg
        </span>
        
        <button 
          onClick={() => onRemove(intake.id)}
          className={`p-1 rounded-full hover:bg-opacity-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            darkMode ? 'hover:bg-slate-400' : 'hover:bg-slate-200'
          } ${
            darkMode
              ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-900'
              : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
          }`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}); 
