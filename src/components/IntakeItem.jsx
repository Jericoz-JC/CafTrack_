import React from 'react';
import { Coffee, X } from 'lucide-react';

export const IntakeItem = ({ intake, onRemove, darkMode = false }) => {
  // Format the timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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
      energyDrinks: darkMode ? 'bg-red-900' : 'bg-red-100',
      soda: darkMode ? 'bg-purple-900' : 'bg-purple-100',
      custom: darkMode ? 'bg-blue-900' : 'bg-blue-100'
    };
    
    return colors[intake.category] || (darkMode ? 'bg-gray-700' : 'bg-gray-100');
  };
  
  // Get text color based on category
  const getTextColor = () => {
    const colors = {
      coffee: darkMode ? 'text-amber-400' : 'text-amber-800',
      tea: darkMode ? 'text-green-400' : 'text-green-800',
      energyDrinks: darkMode ? 'text-red-400' : 'text-red-800',
      soda: darkMode ? 'text-purple-400' : 'text-purple-800',
      custom: darkMode ? 'text-blue-400' : 'text-blue-800'
    };
    
    return colors[intake.category] || (darkMode ? 'text-gray-400' : 'text-gray-800');
  };
  
  return (
    <div className={`p-3 rounded-lg flex items-center justify-between ${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } shadow`}>
      <div className="flex items-center">
        <div className={`p-2 rounded-full mr-3 ${getBgColor()}`}>
          <span className={getTextColor()}>
            {getIcon()}
          </span>
        </div>
        
        <div>
          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {intake.name}
          </h3>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
          className={`p-1 rounded-full hover:bg-opacity-10 ${
            darkMode ? 'hover:bg-gray-400' : 'hover:bg-gray-200'
          }`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}; 