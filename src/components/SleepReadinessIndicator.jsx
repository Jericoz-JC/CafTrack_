import React, { useMemo } from 'react';
import { Moon, Clock, AlertCircle, Coffee } from 'lucide-react';
import { BedtimeDial } from './BedtimeDial';

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [rawHour = '00', rawMinute = '00'] = time24.split(':');
  let hour = parseInt(rawHour, 10);
  const minute = rawMinute.padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

export const SleepReadinessIndicator = ({
  chartData,
  sleepTime,
  targetLevel,
  darkMode = false,
  onSleepTimeChange
}) => {
  const safeSleepTime = sleepTime || '22:00';
  const sleepTimeLabel = useMemo(() => formatTo12Hour(safeSleepTime), [safeSleepTime]);
  const handleDialChange = (nextTime) => {
    if (typeof onSleepTimeChange === 'function') {
      onSleepTimeChange(nextTime);
    }
  };
  
  // Parse sleep time
  const [sleepHour, sleepMinute] = safeSleepTime.split(':').map(Number);
  
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
    <div className={`p-4 rounded-2xl border shadow-lg space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Bedtime</h2>
          <span className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            {sleepTimeLabel}
          </span>
        </div>
        <div
          className={`rounded-3xl border shadow-inner px-2 py-1 sm:px-4 sm:py-2 ${
            darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <BedtimeDial 
            value={safeSleepTime} 
            onChange={handleDialChange} 
            darkMode={darkMode} 
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
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
      
      <div className={`p-3 rounded-xl space-y-3 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock size={16} className={`mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Sleep Time
            </span>
          </div>
          <span className="font-medium">
            {sleepTimeLabel}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock size={16} className={`mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Time Until Sleep
            </span>
          </div>
          <span className="font-medium">
            {timeUntilSleep()}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Coffee size={16} className={`mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
      
      <p className={`mt-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        Target sleep caffeine level: {targetLevel} mg or less
      </p>
    </div>
  );
};
