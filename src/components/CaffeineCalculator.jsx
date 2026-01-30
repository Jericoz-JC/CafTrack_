import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Coffee, 
  Plus, 
  Settings, 
  Info, 
  Moon,
  X,
  BarChart2,
  History,
  Sun
} from 'lucide-react';

import { SettingsModal } from './modals/SettingsModal';
import { AddIntakeModal } from './modals/AddIntakeModal';
import { AddIntakeForm } from './modals/AddIntakeForm';
import { InfoModal } from './modals/InfoModal';
import { NavButton } from './NavButton';
import { CaffeineStatusIndicator } from './CaffeineStatusIndicator';
import { SleepReadinessIndicator } from './SleepReadinessIndicator';
import { CaffeineChart } from './CaffeineChart';
import { IntakeItem } from './IntakeItem';
import { RangeSelector } from './RangeSelector';
import { BedtimePopover } from './BedtimePopover';
import { DEFAULT_SETTINGS, HALF_LIFE_HOURS_BY_RATE } from '../constants/caffeine';
import { RANGE_PRESETS, DEFAULT_RANGE_PRESET, getRangeDurationMs } from '../constants/rangePresets';

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeTime = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const normalizeNumber = (value, { min, max, fallback }) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const normalizeBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
};

const normalizeSettings = (candidate) => {
  const base = DEFAULT_SETTINGS;
  if (!candidate || typeof candidate !== 'object') return base;

  const metabolismRate =
    candidate.metabolismRate === 'fast' ||
    candidate.metabolismRate === 'average' ||
    candidate.metabolismRate === 'slow'
      ? candidate.metabolismRate
      : base.metabolismRate;

  return {
    metabolismRate,
    caffeineLimit: normalizeNumber(candidate.caffeineLimit, {
      min: 50,
      max: 1000,
      fallback: base.caffeineLimit
    }),
    sleepTime: normalizeTime(candidate.sleepTime, base.sleepTime),
    targetSleepCaffeine: normalizeNumber(candidate.targetSleepCaffeine, {
      min: 0,
      max: 200,
      fallback: base.targetSleepCaffeine
    }),
    pregnancyAdjustment: normalizeBool(candidate.pregnancyAdjustment, base.pregnancyAdjustment),
    smokerAdjustment: normalizeBool(candidate.smokerAdjustment, base.smokerAdjustment),
    oralContraceptivesAdjustment: normalizeBool(
      candidate.oralContraceptivesAdjustment,
      base.oralContraceptivesAdjustment
    )
  };
};

const normalizeIntakes = (candidate) => {
  if (!Array.isArray(candidate)) return [];
  const result = [];
  for (const raw of candidate) {
    if (!raw || typeof raw !== 'object') continue;
    const id =
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id
        : typeof raw.id === 'number'
          ? String(raw.id)
          : null;
    const timestamp =
      typeof raw.timestamp === 'string' && raw.timestamp.trim()
        ? raw.timestamp
        : null;
    const parsedTime = timestamp ? new Date(timestamp).getTime() : Number.NaN;
    if (!id || !timestamp || Number.isNaN(parsedTime)) continue;

    const amount = normalizeNumber(raw.amount, { min: 0, max: 2000, fallback: NaN });
    if (!Number.isFinite(amount)) continue;

    result.push({
      id,
      timestamp,
      amount,
      name: typeof raw.name === 'string' ? raw.name : 'Caffeine',
      category: typeof raw.category === 'string' ? raw.category : 'custom'
    });
  }
  return result;
};

// Add a floating action button that appears on all screens
const FloatingActionButton = ({ onClick, darkMode }) => (
  <button 
    onClick={onClick} 
    className={`fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      darkMode ? 'bg-blue-600 hover:bg-blue-500 ring-1 ring-slate-800' : 'bg-blue-500 hover:bg-blue-600 ring-1 ring-blue-200'
    } ${
      darkMode
        ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-slate-50'
    }`}
    aria-label="Add caffeine intake"
  >
    <Plus size={24} color="white" />
  </button>
);

const CaffeineCalculator = () => {
  // State management
  const [activeScreen, setActiveScreen] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [caffeineIntakes, setCaffeineIntakes] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rangePreset, setRangePreset] = useState(DEFAULT_RANGE_PRESET);
  const [hydrated, setHydrated] = useState(false);
  const [undoState, setUndoState] = useState(null);
  
  // Load saved data from localStorage on initial render
  useEffect(() => {
    try {
      const savedIntakes = localStorage.getItem('caffeineIntakes');
      const savedSettings = localStorage.getItem('caffeineSettings');
      const savedDarkMode = localStorage.getItem('darkMode');

      const parsedIntakes = normalizeIntakes(safeJsonParse(savedIntakes));
      const parsedSettings = normalizeSettings(safeJsonParse(savedSettings));

      setCaffeineIntakes(parsedIntakes);
      setSettings(parsedSettings);

      if (savedDarkMode != null) {
        setDarkMode(normalizeBool(savedDarkMode, false));
      }
    } catch {
      // If storage is unavailable (private mode / denied), fall back to defaults.
      setCaffeineIntakes([]);
      setSettings(DEFAULT_SETTINGS);
      setDarkMode(false);
    } finally {
      setHydrated(true);
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('caffeineIntakes', JSON.stringify(caffeineIntakes));
    } catch {
      // ignore storage errors
    }
  }, [caffeineIntakes, hydrated]);
  
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('caffeineSettings', JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings, hydrated]);
  
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('darkMode', darkMode.toString());
    } catch {
      // ignore storage errors
    }
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (!undoState) return undefined;
    const timeoutId = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [undoState]);
  
  // Calculate current caffeine level based on metabolism and intake history
  const calculateCurrentCaffeineLevel = () => {
    let currentLevel = 0;
    const now = new Date();
    
    // Get base half-life in hours
    let halfLifeHours = HALF_LIFE_HOURS_BY_RATE[settings.metabolismRate] ?? HALF_LIFE_HOURS_BY_RATE.average;
    
    // Apply adjustments for special conditions
    if (settings.pregnancyAdjustment) halfLifeHours *= 1.5;
    if (settings.smokerAdjustment) halfLifeHours *= 0.7;
    if (settings.oralContraceptivesAdjustment) halfLifeHours *= 1.3;
    
    // Convert half-life to decay rate constant (in milliseconds)
    const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
    const decayConstant = Math.log(2) / halfLifeMs;
    
    // Calculate contribution of each intake to current level
    caffeineIntakes.forEach(intake => {
      const intakeTime = new Date(intake.timestamp);
      const elapsedMs = now - intakeTime;
      
      // Only count if intake was in the past
      if (elapsedMs > 0) {
        // Calculate remaining amount using exponential decay formula
        const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
        currentLevel += remainingAmount;
      }
    });
    
    return Math.round(currentLevel);
  };
  
  // Generate data for caffeine chart over time
  const generateChartData = () => {
    const now = new Date();
    const data = [];
    
    // Sort intakes by timestamp
    const sortedIntakes = [...caffeineIntakes].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Calculate base half-life in milliseconds
    let halfLifeHours = HALF_LIFE_HOURS_BY_RATE[settings.metabolismRate] ?? HALF_LIFE_HOURS_BY_RATE.average;
    
    // Apply adjustments
    if (settings.pregnancyAdjustment) halfLifeHours *= 1.5;
    if (settings.smokerAdjustment) halfLifeHours *= 0.7;
    if (settings.oralContraceptivesAdjustment) halfLifeHours *= 1.3;
    
    const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
    const decayConstant = Math.log(2) / halfLifeMs;
    
    // Find earliest intake time or 12 hours ago, whichever is earlier
    let startTime = new Date(now.getTime() - (12 * 60 * 60 * 1000)); // 12 hours ago
    if (sortedIntakes.length > 0) {
      const earliestIntake = new Date(sortedIntakes[0].timestamp);
      if (earliestIntake < startTime) {
        startTime = earliestIntake;
      }
    }
    
    // Round start time down to the nearest hour for cleaner X-axis
    startTime.setMinutes(0, 0, 0);
    
    // Create data points from start time to 24 hours in the future
    const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    
    // Add data points for every hour from start to end
    for (let time = new Date(startTime); time <= endTime; time = new Date(time.getTime() + 60 * 60 * 1000)) {
      let caffeineLevel = 0;
      
      // Calculate contribution of each intake to this time point
      sortedIntakes.forEach(intake => {
        const intakeTime = new Date(intake.timestamp);
        const elapsedMs = time - intakeTime;
        
        // Only count if intake was in the past relative to this time point
        if (elapsedMs > 0) {
          // Calculate remaining amount using exponential decay formula
          const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
          caffeineLevel += remainingAmount;
        }
      });
      
      data.push({
        time: time,
        level: Math.round(caffeineLevel)
      });
    }
    
    return data;
  };
  
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(generateChartData, [caffeineIntakes, settings]);
  
  // Current caffeine level
  const currentCaffeineLevel = useMemo(calculateCurrentCaffeineLevel, [caffeineIntakes, settings]);

  // Calculate caffeine at sleep time for header popover
  const sleepTimeInfo = useMemo(() => {
    const safeSleepTime = settings.sleepTime || '22:00';
    const [sleepHour, sleepMinute] = safeSleepTime.split(':').map(Number);

    const today = new Date();
    const sleepTimeDate = new Date(today);
    sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);

    if (sleepTimeDate < today) {
      sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
    }

    // Find closest chart data point to sleep time
    let caffeineAtSleep = 0;
    if (chartData && chartData.length > 0) {
      let closestPoint = chartData[0];
      let smallestDiff = Math.abs(new Date(chartData[0].time) - sleepTimeDate);

      for (let i = 1; i < chartData.length; i++) {
        const diff = Math.abs(new Date(chartData[i].time) - sleepTimeDate);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestPoint = chartData[i];
        }
      }
      caffeineAtSleep = closestPoint.level;
    }

    const isReadyForSleep = caffeineAtSleep <= settings.targetSleepCaffeine;

    return { caffeineAtSleep, isReadyForSleep };
  }, [chartData, settings.sleepTime, settings.targetSleepCaffeine]);

  const filteredIntakes = useMemo(() => {
    if (!caffeineIntakes.length) {
      return [];
    }
    const durationMs = getRangeDurationMs(rangePreset);
    if (!durationMs) {
      return caffeineIntakes;
    }
    const cutoff = Date.now() - durationMs;
    return caffeineIntakes.filter(
      (intake) => new Date(intake.timestamp).getTime() >= cutoff
    );
  }, [caffeineIntakes, rangePreset]);
  
  // Handle adding new caffeine intake
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const openModal = useCallback((type) => {
    setModalType(type);
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    openModal('add');
  }, [openModal]);

  const openInfoModal = useCallback(() => {
    openModal('info');
  }, [openModal]);

  const openSettingsModal = useCallback(() => {
    openModal('settings');
  }, [openModal]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const goHome = useCallback(() => setActiveScreen('home'), []);
  const goHistory = useCallback(() => setActiveScreen('history'), []);
  const goStats = useCallback(() => setActiveScreen('stats'), []);

  const handleAddIntake = useCallback((intakeData) => {
    const newIntake = {
      id: Date.now().toString(),
      timestamp: intakeData.timestamp || new Date().toISOString(), // Use provided timestamp or current time
      ...intakeData
    };
    
    setCaffeineIntakes(prev => [newIntake, ...prev]);
    closeModal();
  }, [closeModal]);
  
  // Handle removing a caffeine intake
  const handleRemoveIntake = useCallback((id) => {
    setCaffeineIntakes((prev) => {
      const index = prev.findIndex((intake) => intake.id === id);
      if (index === -1) return prev;
      const removed = prev[index];
      setUndoState({ intake: removed, index });
      return prev.filter((intake) => intake.id !== id);
    });
  }, []);

  const dismissUndo = useCallback(() => {
    setUndoState(null);
  }, []);

  const handleUndoRemove = useCallback(() => {
    if (!undoState?.intake) return;
    const { intake, index } = undoState;
    setCaffeineIntakes((prev) => {
      if (prev.some((existing) => existing.id === intake.id)) {
        return prev;
      }
      const next = [...prev];
      const insertAt = Math.min(Math.max(index, 0), next.length);
      next.splice(insertAt, 0, intake);
      return next;
    });
    setUndoState(null);
  }, [undoState]);

  const handleSleepTimeChange = useCallback((nextSleepTime) => {
    setSettings((prev) => ({
      ...prev,
      sleepTime: nextSleepTime
    }));
  }, []);

  const handleCaffeineLimitChange = useCallback((nextLimit) => {
    setSettings((prev) => ({
      ...prev,
      caffeineLimit: nextLimit
    }));
  }, []);
  
  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Header */}
      <header className={`px-4 py-4 flex justify-between items-center sticky top-0 z-20 border-b backdrop-blur ${
        darkMode ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200/70'
      }`}>
        <div className="flex items-center">
          <Coffee className={`mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
          <h1 className="text-xl font-bold">CafTrack</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
            } ${
              darkMode
                ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <BedtimePopover
            sleepTime={settings.sleepTime}
            onSleepTimeChange={handleSleepTimeChange}
            darkMode={darkMode}
            caffeineAtSleep={sleepTimeInfo.caffeineAtSleep}
            targetLevel={settings.targetSleepCaffeine}
            isReadyForSleep={sleepTimeInfo.isReadyForSleep}
          />
          <button
            onClick={openInfoModal}
            className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
            } ${
              darkMode
                ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
            aria-label="Learn more"
          >
            <Info size={20} />
          </button>
          <button
            onClick={openSettingsModal}
            className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
            } ${
              darkMode
                ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
            aria-label="Open settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-xl mx-auto px-4 pb-28 pt-6 space-y-6">
        {/* Home Screen */}
        {activeScreen === 'home' && (
          <div className="space-y-6">
            {/* Current Status */}
            <CaffeineStatusIndicator 
              currentLevel={currentCaffeineLevel} 
              caffeineLimit={settings.caffeineLimit}
              darkMode={darkMode}
            />
            
            {/* Sleep Readiness */}
            <SleepReadinessIndicator
              chartData={chartData}
              sleepTime={settings.sleepTime}
              targetLevel={settings.targetSleepCaffeine}
              darkMode={darkMode}
            />
          </div>
        )}
        
        {/* History Screen */}
        {activeScreen === 'history' && (
          <div className="space-y-4">
            <RangeSelector
              title="History Range"
              value={rangePreset}
              onChange={setRangePreset}
              options={RANGE_PRESETS}
              darkMode={darkMode}
            />
            <div>
              <h2 className="text-xl font-bold mb-4">Intake History</h2>
              {caffeineIntakes.length > 0 ? (
                filteredIntakes.length > 0 ? (
                  <div className="space-y-2">
                    {filteredIntakes.map(intake => (
                      <IntakeItem 
                        key={intake.id} 
                        intake={intake} 
                        onRemove={handleRemoveIntake}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl text-center glass-surface glass-highlight ${
                    darkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    <p className="font-medium">No entries for this range.</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Try selecting a broader window above to see older drinks.
                    </p>
                  </div>
                )
              ) : (
                <div className={`p-4 rounded-2xl text-center glass-surface glass-highlight ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  <p>No caffeine intake recorded yet.</p>
                  <button 
                    onClick={openAddModal} 
                    className={`mt-2 px-4 py-2 rounded-lg ${
                      darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      darkMode
                        ? 'focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                    }`}
                  >
                    Add Your First Drink
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Stats Screen */}
        {activeScreen === 'stats' && (
          <div className="space-y-4">
            <RangeSelector
              title="Metabolism Stats"
              value={rangePreset}
              onChange={setRangePreset}
              options={RANGE_PRESETS}
              darkMode={darkMode}
            />
            <CaffeineChart 
              data={chartData} 
              caffeineLimit={settings.caffeineLimit}
              sleepTime={settings.sleepTime}
              targetSleepCaffeine={settings.targetSleepCaffeine}
              rangePreset={rangePreset}
              darkMode={darkMode}
              onLimitChange={handleCaffeineLimitChange}
            />
          </div>
        )}
      </main>
      
      {/* Floating Action Button on all screens */}
      <FloatingActionButton 
        onClick={openAddModal}
        darkMode={darkMode}
      />
      
      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 flex justify-around py-3 border-t shadow-2xl backdrop-blur ${
        darkMode ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200/70'
      }`}>
        <NavButton 
          icon={<Coffee size={20} />} 
          label="Home" 
          active={activeScreen === 'home'} 
          onClick={goHome}
          darkMode={darkMode}
        />
        <NavButton 
          icon={<History size={20} />} 
          label="History" 
          active={activeScreen === 'history'} 
          onClick={goHistory}
          darkMode={darkMode}
        />
        <NavButton 
          icon={<BarChart2 size={20} />} 
          label="Stats" 
          active={activeScreen === 'stats'} 
          onClick={goStats}
          darkMode={darkMode}
        />
      </nav>

      {/* Undo Toast */}
      {undoState?.intake && (
        <div className="fixed left-0 right-0 bottom-20 z-30 px-4">
          <div
            role="status"
            aria-live="polite"
            className={`mx-auto max-w-xl rounded-2xl glass-surface glass-highlight px-4 py-3 flex items-center justify-between gap-3 ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                Removed “{undoState.intake.name}”
              </p>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Undo is available for a few seconds.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoRemove}
                className={`rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                    : 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={dismissUndo}
                aria-label="Dismiss undo"
                className={`p-2 rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'border-white/10 hover:bg-white/10 focus-visible:ring-blue-400 focus-visible:ring-offset-slate-950'
                    : 'border-slate-200/70 hover:bg-white/70 focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'add' && (
            <AddIntakeModal onClose={closeModal} darkMode={darkMode}>
              <AddIntakeForm onAdd={handleAddIntake} darkMode={darkMode} />
            </AddIntakeModal>
          )}
          
          {modalType === 'settings' && (
            <SettingsModal 
              settings={settings} 
              onSave={setSettings} 
              onClose={closeModal}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
          
          {modalType === 'info' && (
            <InfoModal onClose={closeModal} darkMode={darkMode} />
          )}
        </>
      )}
    </div>
  );
};

export default CaffeineCalculator; 
