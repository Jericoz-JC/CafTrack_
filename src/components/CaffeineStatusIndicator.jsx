import React from 'react';
import { Coffee, AlertTriangle, Check } from 'lucide-react';

export const CaffeineStatusIndicator = ({ currentLevel, caffeineLimit, darkMode = false }) => {
  // Determine status based on current level vs limit
  const getStatus = () => {
    const percentage = (currentLevel / caffeineLimit) * 100;
    
    if (percentage < 50) {
      return {
        label: 'Low',
        icon: <Check size={20} className="text-green-500" />,
        color: darkMode ? 'bg-green-900' : 'bg-green-100',
        textColor: darkMode ? 'text-green-400' : 'text-green-800',
        progressColor: 'bg-green-500'
      };
    } else if (percentage < 80) {
      return {
        label: 'Moderate',
        icon: <Coffee size={20} className="text-yellow-500" />,
        color: darkMode ? 'bg-yellow-900' : 'bg-yellow-100',
        textColor: darkMode ? 'text-yellow-400' : 'text-yellow-800',
        progressColor: 'bg-yellow-500'
      };
    } else {
      return {
        label: 'High',
        icon: <AlertTriangle size={20} className="text-red-500" />,
        color: darkMode ? 'bg-red-900' : 'bg-red-100',
        textColor: darkMode ? 'text-red-400' : 'text-red-800',
        progressColor: 'bg-red-500'
      };
    }
  };
  
  const status = getStatus();
  const progressPercentage = Math.min(100, (currentLevel / caffeineLimit) * 100);
  
  return (
    <div
      className={`p-4 rounded-glass glass-surface glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      <h2 className="text-lg font-bold mb-2">Current Caffeine Level</h2>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-2 ${status.color}`}>
            {status.icon}
          </div>
          <div>
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {currentLevel}
            </span>
            <span className={`ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>mg</span>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full ${status.color} ${status.textColor} font-medium`}>
          {status.label}
        </div>
      </div>
      
      {/* Progress bar */}
      <div
        className={`h-2 w-full rounded-full overflow-hidden ${
          darkMode ? 'bg-white/10' : 'bg-slate-200/80'
        }`}
      >
        <div 
          className={`h-full ${status.progressColor} transition-all duration-500 ease-out`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-xs">
        <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>0 mg</span>
        <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
          Daily Limit: {caffeineLimit} mg
        </span>
      </div>
    </div>
  );
}; 
