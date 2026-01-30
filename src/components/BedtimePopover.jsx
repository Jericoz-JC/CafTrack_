import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BedDouble, Check } from 'lucide-react';

const BEDTIME_PRESETS = [
  { label: '9 PM', value: '21:00' },
  { label: '10 PM', value: '22:00' },
  { label: '11 PM', value: '23:00' },
  { label: '12 AM', value: '00:00' }
];

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [rawHour = '00', rawMinute = '00'] = time24.split(':');
  let hour = parseInt(rawHour, 10);
  const minute = rawMinute.padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

export const BedtimePopover = ({
  sleepTime,
  onSleepTimeChange,
  darkMode = false,
  caffeineAtSleep,
  targetLevel,
  isReadyForSleep
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const safeSleepTime = sleepTime || '22:00';
  const displayTime = formatTo12Hour(safeSleepTime);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handlePresetClick = useCallback((preset) => {
    if (typeof onSleepTimeChange === 'function') {
      onSleepTimeChange(preset.value);
    }
    setIsOpen(false);
  }, [onSleepTimeChange]);

  const handleCustomTimeChange = useCallback((event) => {
    const newTime = event.target.value;
    if (typeof onSleepTimeChange === 'function' && newTime) {
      onSleepTimeChange(newTime);
    }
  }, [onSleepTimeChange]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const isPresetActive = (preset) => safeSleepTime === preset.value;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center gap-1.5 ${
          darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
        } ${
          darkMode
            ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
            : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
        } ${isOpen ? (darkMode ? 'bg-slate-800' : 'bg-slate-100') : ''}`}
        aria-label={`Bedtime: ${displayTime}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <BedDouble size={20} className={isReadyForSleep ? 'text-green-500' : 'text-amber-500'} />
        <span className={`text-xs font-medium hidden sm:inline ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {displayTime}
        </span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64">
          <div className="absolute inset-0 glass-backdrop sm:hidden" />
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Set bedtime"
            aria-modal="true"
            className={`absolute inset-x-0 bottom-0 top-0 w-full h-full sm:static sm:h-auto rounded-none sm:rounded-2xl overflow-y-auto glass-surface-strong glass-highlight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
          {/* Header */}
            <div className="px-5 py-4 border-b border-glass-stroke">
              <h3 className="font-semibold text-base">Set Bedtime</h3>
              <p className={`text-xs mt-1 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Current: {displayTime}
              </p>
            </div>

          {/* Presets */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              {BEDTIME_PRESETS.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset)}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center justify-center gap-1.5 ${
                      darkMode
                        ? 'focus-visible:ring-sky-300 focus-visible:ring-offset-slate-950'
                        : 'focus-visible:ring-sky-500 focus-visible:ring-offset-white'
                    } ${
                      active
                        ? darkMode
                          ? 'bg-sky-500/90 text-white shadow-lg shadow-sky-500/30'
                          : 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                        : darkMode
                          ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                          : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
                    }`}
                  >
                    {active && <Check size={14} />}
                    {preset.label}
                  </button>
                );
              })}
            </div>

          {/* Custom Time */}
            <div className="px-5 py-4 border-t border-glass-stroke">
              <label className={`block text-xs font-medium mb-2 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Custom time
              </label>
              <input
                type="time"
                value={safeSleepTime}
                onChange={handleCustomTimeChange}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white/70 border-slate-200 text-slate-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'focus-visible:ring-sky-300 focus-visible:ring-offset-slate-950'
                    : 'focus-visible:ring-sky-500 focus-visible:ring-offset-white'
                }`}
              />
            </div>

          {/* Sleep Status */}
            {typeof caffeineAtSleep === 'number' && (
              <div className="px-5 py-4 border-t border-glass-stroke">
                <div className="flex items-center justify-between text-xs">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                    Projected at sleep
                  </span>
                  <span className={`font-semibold ${
                    isReadyForSleep
                      ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
                      : darkMode ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    {caffeineAtSleep} mg
                  </span>
                </div>
                <div className={`mt-1 text-xs text-center ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Target: {targetLevel} mg or less
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
