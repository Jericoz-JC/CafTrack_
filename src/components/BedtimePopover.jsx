import React, { useCallback, useMemo, useState } from 'react';
import { BedDouble, Check } from 'lucide-react';
import { Modal } from './modals/Modal';
import { formatTo12Hour } from '../utils/time';

const BEDTIME_PRESETS = [
  { label: '9 PM', value: '21:00' },
  { label: '10 PM', value: '22:00' },
  { label: '11 PM', value: '23:00' },
  { label: '12 AM', value: '00:00' }
];

export const BedtimePopover = ({
  sleepTime,
  onSleepTimeChange,
  darkMode = false,
  caffeineAtSleep,
  targetLevel,
  isReadyForSleep
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const isPresetActive = (preset) => safeSleepTime === preset.value;

  const statusCopy = useMemo(() => {
    if (typeof caffeineAtSleep !== 'number') return null;
    return {
      value: caffeineAtSleep,
      status: isReadyForSleep
        ? darkMode ? 'text-emerald-300' : 'text-emerald-600'
        : darkMode ? 'text-amber-300' : 'text-amber-600'
    };
  }, [caffeineAtSleep, isReadyForSleep, darkMode]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center gap-1.5 ${
          darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
          } ${
            darkMode
              ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
              : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
          }`}
        aria-label={`Bedtime: ${displayTime}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <BedDouble size={20} className={isReadyForSleep ? 'text-green-500' : 'text-amber-500'} aria-hidden="true" />
        <span className={`text-xs font-medium hidden sm:inline tabular-nums ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {displayTime}
        </span>
      </button>

      {isOpen && (
        <Modal
          title="Set Bedtime"
          onClose={closeModal}
          darkMode={darkMode}
        >
          <div className="space-y-6">
            <div className={`rounded-2xl border border-glass-stroke px-4 py-3 ${
              darkMode ? 'bg-white/5 text-slate-200' : 'bg-white/80 text-slate-700'
            }`}>
              <p className="text-xs uppercase tracking-wide">Current</p>
              <p className="text-lg font-semibold tabular-nums">{displayTime}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Presets</h3>
              <div className="grid grid-cols-2 gap-3">
                {BEDTIME_PRESETS.map((preset) => {
                  const active = isPresetActive(preset);
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center justify-center gap-1.5 ${
                        darkMode
                          ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                          : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                      } ${
                        active
                          ? darkMode
                            ? 'bg-white/15 text-white shadow-lg shadow-black/40'
                            : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : darkMode
                            ? 'bg-white/10 text-slate-200 hover:bg-white/20'
                            : 'bg-white/70 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {active && <Check size={14} aria-hidden="true" />}
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bedtime-custom-time" className={`block text-xs font-medium ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Custom time
              </label>
              <input
                id="bedtime-custom-time"
                name="bedtimeCustomTime"
                autoComplete="off"
                type="time"
                value={safeSleepTime}
                onChange={handleCustomTimeChange}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white/80 border-slate-200/80 text-slate-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                    : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              />
            </div>

            {statusCopy && (
              <div className={`rounded-2xl border border-glass-stroke px-4 py-3 ${
                darkMode ? 'bg-white/5 text-slate-200' : 'bg-white/80 text-slate-700'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                    Projected at sleep
                  </span>
                  <span className={`font-semibold tabular-nums ${statusCopy.status}`}>
                    {statusCopy.value} mg
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
        </Modal>
      )}
    </>
  );
};
