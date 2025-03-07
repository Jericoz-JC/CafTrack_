import React from 'react';
import { Moon, Clock, AlertCircle } from 'lucide-react';

export const SleepReadinessIndicator = ({ chartData, sleepTime, targetLevel, darkMode = false }) => {
  // Parse sleep time
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);
  
  // Create a date object for today's sleep time
  const today = new Date();
  const sleepTimeDate = new Date(today);
  sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);
  
  // If sleep time is in the past for today, use tomorrow's date
  if (sleepTimeDate < today) {
    sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
  }
  
  // Find the projected caffeine level at sleep time
  const findCaffeineAtSleepTime = () => {
    // If no chart data, return 0
    if (!chartData || chartData.length === 0) return 0;
    
    // Find the closest data point to sleep time
    let closestPoint = chartData[0];
    let smallestDiff = Math.abs(new Date(chartData[0].time) - sleepTimeDate);
    
    for (let i = 1; i < chartData.length; i++) {
      const diff = Math.abs(new Date(chartData[i].time) - sleepTimeDate);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestPoint = chartData[i];
      }
    }
    
    return closestPoint.level;
  };
  
  const caffeineAtSleepTime = findCaffeineAtSleepTime();
  const isReadyForSleep = caffeineAtSleepTime <= targetLevel;
  
  // Calculate time until sleep
  const timeUntilSleep = () => {
    const diffMs = sleepTimeDate - new Date();
    
    // If negative, sleep time is in the past
    if (diffMs <= 0) {
      return 'Now';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} min`;
    } else if (diffMinutes === 0) {
      return `${diffHours} hr`;
    } else {
      return `${diffHours} hr ${diffMinutes} min`;
    }
  };
  
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <h2 className="text-lg font-bold mb-2">Sleep Readiness</h2>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-2 ${
            isReadyForSleep 
              ? darkMode ? 'bg-green-900' : 'bg-green-100' 
              : darkMode ? 'bg-red-900' : 'bg-red-100'
          }`}>
            {isReadyForSleep 
              ? <Moon size={20} className="text-green-500" /> 
              : <AlertCircle size={20} className="text-red-500" />
            }
          </div>
          <div>
            <span className={`font-medium ${
              isReadyForSleep 
                ? darkMode ? 'text-green-400' : 'text-green-700'
                : darkMode ? 'text-red-400' : 'text-red-700'
            }`}>
              {isReadyForSleep 
                ? 'Ready for sleep' 
                : 'Not ready for sleep'
              }
            </span>
          </div>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock size={16} className={`mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sleep Time
            </span>
          </div>
          <span className="font-medium">
            {sleepTime}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock size={16} className={`mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Time Until Sleep
            </span>
          </div>
          <span className="font-medium">
            {timeUntilSleep()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Coffee size={16} className={`mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Projected Level at Sleep
            </span>
          </div>
          <span className={`font-medium ${
            isReadyForSleep 
              ? darkMode ? 'text-green-400' : 'text-green-600'
              : darkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            {caffeineAtSleepTime} mg
          </span>
        </div>
      </div>
      
      <p className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Target sleep caffeine level: {targetLevel} mg or less
      </p>
    </div>
  );
}; 