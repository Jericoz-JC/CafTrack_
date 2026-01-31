import React from 'react';
import { Coffee, Moon, Clock, TrendingDown, AlertTriangle, Check } from 'lucide-react';
import { DesktopPanel } from './DesktopPanel';
import { formatTo12Hour, getTimeUntil, parseSleepTime } from '../../utils/time';

export const getCaffeineStatus = (currentLevel, caffeineLimit, darkMode) => {
  const safeLimit = Number.isFinite(caffeineLimit) && caffeineLimit > 0 ? caffeineLimit : 1;
  const percentage = (currentLevel / safeLimit) * 100;
  if (percentage < 50) {
    return {
      label: 'Low',
      icon: <Check size={16} aria-hidden="true" className="text-emerald-500" />,
      pill: darkMode ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
      progress: 'bg-emerald-500',
      progressGlow: 'progress-glow-emerald'
    };
  }
  if (percentage < 80) {
    return {
      label: 'Moderate',
      icon: <Coffee size={16} aria-hidden="true" className="text-amber-500" />,
      pill: darkMode ? 'bg-amber-900/40 text-amber-200' : 'bg-amber-100 text-amber-700',
      progress: 'bg-amber-500',
      progressGlow: 'progress-glow-amber'
    };
  }
  return {
    label: 'High',
    icon: <AlertTriangle size={16} aria-hidden="true" className="text-rose-500" />,
    pill: darkMode ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-700',
    progress: 'bg-rose-500',
    progressGlow: 'progress-glow-rose'
  };
};

export const DesktopSummaryPanel = ({
  currentLevel,
  caffeineLimit,
  sleepTime,
  sleepInfo,
  targetLevel,
  darkMode
}) => {
  const safeSleepTime = sleepTime || '22:00';
  const safeLimit = Number.isFinite(caffeineLimit) && caffeineLimit > 0 ? caffeineLimit : 1;
  const status = getCaffeineStatus(currentLevel, safeLimit, darkMode);
  const progressPercentage = Math.min(100, Math.max(0, (currentLevel / safeLimit) * 100));

  const { sleepTimeDate } = parseSleepTime(safeSleepTime);
  const sleepLabel = formatTo12Hour(safeSleepTime);
  const timeUntilSleep = getTimeUntil(sleepTimeDate);
  const caffeineAtSleep = sleepInfo?.caffeineAtSleep ?? 0;
  const isReadyForSleep = sleepInfo?.isReadyForSleep ?? false;

  return (
    <DesktopPanel
      title="Summary"
      subtitle="Today"
      darkMode={darkMode}
      bodyClassName="mt-3"
      action={(
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.pill}`}>
          {status.label}
        </span>
      )}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              {status.icon}
              <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                Current Level
              </span>
            </div>
            <div className="text-xl font-bold tabular-nums">
              {currentLevel} <span className="text-xs font-medium text-slate-400">mg</span>
            </div>
          </div>
          <div
            className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${
              darkMode ? 'bg-white/10' : 'bg-slate-900/10'
            }`}
          >
            <div
              className={`h-full rounded-full ${status.progress} ${status.progressGlow} transition-[width] duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={darkMode ? 'text-slate-500' : 'text-slate-600'}>0 mg</span>
            <span className={`tabular-nums ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Daily Limit {caffeineLimit} mg
            </span>
          </div>
        </div>

        <div className={`border-t ${darkMode ? 'border-white/10' : 'border-slate-200/70'} pt-3`}>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                <Moon size={12} aria-hidden="true" />
                Bedtime
              </div>
              <div className="text-sm font-semibold tabular-nums">{sleepLabel}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                <Clock size={12} aria-hidden="true" />
                Time Left
              </div>
              <div className="text-sm font-semibold tabular-nums">{timeUntilSleep}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                <TrendingDown size={12} aria-hidden="true" />
                At Sleep
              </div>
              <div
                className={`text-sm font-semibold tabular-nums ${
                  isReadyForSleep
                    ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
                    : darkMode ? 'text-amber-300' : 'text-amber-600'
                }`}
              >
                {caffeineAtSleep} mg
              </div>
            </div>
          </div>
          <div className={`mt-2 text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Target {targetLevel} mg or less at bedtime
          </div>
        </div>
      </div>
    </DesktopPanel>
  );
};
