import React, { useMemo } from 'react';
import { Moon, Clock, TrendingDown } from 'lucide-react';

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
  darkMode = false
}) => {
  const safeSleepTime = sleepTime || '22:00';
  const sleepTimeLabel = useMemo(() => formatTo12Hour(safeSleepTime), [safeSleepTime]);

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
    if (!chartData || chartData.length === 0) return 0;

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
    <div
      className={`p-4 rounded-glass glass-surface glass-highlight ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-900/5'}`}>
            <Moon size={20} className={darkMode ? 'text-slate-200' : 'text-slate-700'} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold">Sleep Readiness</h2>
            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Projection for your bedtime
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        className={`grid grid-cols-3 gap-3 p-3 rounded-xl ${
          darkMode ? 'bg-white/5' : 'bg-slate-900/5'
        }`}
      >
        {/* Bedtime */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Moon size={14} className={darkMode ? 'text-slate-400' : 'text-slate-500'} aria-hidden="true" />
          </div>
          <p className="font-semibold text-sm tabular-nums">{sleepTimeLabel}</p>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bedtime</p>
        </div>

        {/* Time until sleep */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock size={14} className={darkMode ? 'text-slate-400' : 'text-slate-500'} aria-hidden="true" />
          </div>
          <p className="font-semibold text-sm tabular-nums">{timeUntilSleep()}</p>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Until sleep</p>
        </div>

        {/* Projected level */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingDown size={14} className={
              isReadyForSleep
                ? 'text-emerald-500'
                : 'text-amber-500'
            } aria-hidden="true" />
          </div>
          <p className={`font-semibold text-sm tabular-nums ${
            isReadyForSleep
              ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
              : darkMode ? 'text-amber-300' : 'text-amber-600'
          }`}>
            {caffeineAtSleepTime} mg
          </p>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>At bedtime</p>
        </div>
      </div>

      {/* Target hint */}
      <p className={`mt-3 text-xs text-center tabular-nums ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Target: {targetLevel} mg or less at bedtime
      </p>
    </div>
  );
};
