import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Coffee,
  Plus,
  Settings,
  Moon,
  X,
  BarChart2,
  History,
  Sun,
  AlertTriangle,
  Check,
  Clock,
  TrendingDown
} from 'lucide-react';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

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
import { BottomDrawer } from './modals/BottomDrawer';
import { DEFAULT_SETTINGS, HALF_LIFE_HOURS_BY_RATE } from '../constants/caffeine';
import { RANGE_PRESETS, DEFAULT_RANGE_PRESET, getRangeDurationMs } from '../constants/rangePresets';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useCloudSync } from '../hooks/useCloudSync';

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
    const clientId =
      typeof raw.clientId === 'string' && raw.clientId.trim()
        ? raw.clientId
        : id;
    const cloudId =
      typeof raw.cloudId === 'string' && raw.cloudId.trim()
        ? raw.cloudId
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
      clientId,
      cloudId,
      timestamp,
      amount,
      name: typeof raw.name === 'string' ? raw.name : 'Caffeine',
      category: typeof raw.category === 'string' ? raw.category : 'custom'
    });
  }
  return result;
};

const createClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const SCREEN_QUERY_KEY = 'tab';

// Client-only: This app uses Create React App (no SSR), so window is always available.
// The typeof check is kept for defensive coding but won't trigger in practice.
const getInitialScreen = () => {
  if (typeof window === 'undefined') return 'home';
  const params = new URLSearchParams(window.location.search);
  const tab = params.get(SCREEN_QUERY_KEY);
  if (tab === 'home' || tab === 'history' || tab === 'stats') {
    return tab;
  }
  return 'home';
};

// Add a floating action button that appears on all screens
const FloatingActionButton = ({ onClick, darkMode }) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-105 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      darkMode ? 'bg-blue-600 hover:bg-blue-500 ring-1 ring-blue-400/30' : 'bg-blue-500 hover:bg-blue-600 ring-1 ring-blue-200'
    } ${
      darkMode
        ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-slate-50'
    }`}
    aria-label="Add caffeine intake"
  >
    <Plus size={24} color="white" aria-hidden="true" />
  </button>
);


const DesktopPanel = ({ title, subtitle, action, children, darkMode, className = '', bodyClassName }) => {
  const bodyClasses = bodyClassName ?? 'mt-4';
  const contrastClass = darkMode
    ? 'border-white/10 ring-0'
    : 'ring-1 ring-slate-200/80';
  const surfaceClass = darkMode ? 'glass-surface-strong' : 'glass-surface-strong glass-highlight';
  return (
    <section
      className={`rounded-3xl ${surfaceClass} p-4 ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      } ${contrastClass} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className={bodyClasses}>{children}</div>
    </section>
  );
};

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [rawHour = '00', rawMinute = '00'] = time24.split(':');
  let hour = parseInt(rawHour, 10);
  const minute = rawMinute.padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

const getTimeUntil = (sleepTimeValue) => {
  const diffMs = sleepTimeValue - new Date();
  if (diffMs <= 0) return 'Now';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours === 0) return `${diffMinutes} min`;
  if (diffMinutes === 0) return `${diffHours} hr`;
  return `${diffHours} hr ${diffMinutes} min`;
};

const getCaffeineStatus = (currentLevel, caffeineLimit, darkMode) => {
  const percentage = (currentLevel / caffeineLimit) * 100;
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

const DesktopSummaryPanel = ({
  currentLevel,
  caffeineLimit,
  sleepTime,
  sleepInfo,
  targetLevel,
  darkMode
}) => {
  const safeSleepTime = sleepTime || '22:00';
  const status = getCaffeineStatus(currentLevel, caffeineLimit, darkMode);
  const progressPercentage = Math.min(100, (currentLevel / caffeineLimit) * 100);

  const [sleepHour, sleepMinute] = safeSleepTime.split(':').map(Number);
  const today = new Date();
  const sleepTimeDate = new Date(today);
  sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);
  if (sleepTimeDate < today) {
    sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
  }

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

const CaffeineCalculator = () => {
  // State management
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [caffeineIntakes, setCaffeineIntakes] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [rangePreset, setRangePreset] = useState(DEFAULT_RANGE_PRESET);
  const [hydrated, setHydrated] = useState(false);
  const [undoState, setUndoState] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const addIntakeRef = useRef(null);
  
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

  const cloudSync = useCloudSync({
    localIntakes: caffeineIntakes,
    localSettings: settings,
    darkMode,
    setIntakes: setCaffeineIntakes,
    setSettings,
    setDarkMode,
    isLocalReady: hydrated
  });
  
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
    const themeColor = darkMode ? '#05070f' : '#f5f7fb';
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    }
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('caftrack-theme-change', {
          detail: darkMode
        })
      );
    }
  }, [darkMode, hydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set(SCREEN_QUERY_KEY, activeScreen);
    window.history.replaceState({}, '', url);
  }, [activeScreen]);

  useEffect(() => {
    if (!undoState) return undefined;
    const timeoutId = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [undoState]);

  useEffect(() => {
    if (!isDesktop) return;
    if (showModal && modalType === 'add') {
      setShowModal(false);
    }
  }, [isDesktop, showModal, modalType]);

  useEffect(() => {
    if (!isDesktop && showHistoryDrawer) {
      setShowHistoryDrawer(false);
    }
  }, [isDesktop, showHistoryDrawer]);
  
  // Calculate current caffeine level based on metabolism and intake history
  const calculateCurrentCaffeineLevel = () => {
    let currentLevel = 0;
    const nowMs = Date.now();
    
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
      const intakeTimeMs = new Date(intake.timestamp).getTime();
      if (!Number.isFinite(intakeTimeMs)) return;
      const elapsedMs = nowMs - intakeTimeMs;
      
      // Only count if intake was in the past
      if (elapsedMs >= 0) {
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

    const intakeSeries = sortedIntakes
      .map((intake) => ({
        ...intake,
        timeMs: new Date(intake.timestamp).getTime()
      }))
      .filter((intake) => Number.isFinite(intake.timeMs) && Number.isFinite(intake.amount));
    
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
    if (intakeSeries.length > 0) {
      const earliestIntake = new Date(intakeSeries[0].timeMs);
      if (earliestIntake < startTime) {
        startTime = earliestIntake;
      }
    }

    // Create data points from start time to 24 hours in the future
    const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000));

    const getChartStepMs = (rangeMs) => {
      const hour = 60 * 60 * 1000;
      const day = 24 * hour;
      if (rangeMs <= 36 * hour) return 15 * 60 * 1000;
      if (rangeMs <= 3 * day) return 30 * 60 * 1000;
      if (rangeMs <= 7 * day) return hour;
      if (rangeMs <= 30 * day) return 2 * hour;
      return 4 * hour;
    };

    const rangeMs = endTime.getTime() - startTime.getTime();
    const stepMs = getChartStepMs(rangeMs);
    const alignedStartMs = Math.floor(startTime.getTime() / stepMs) * stepMs;
    const startMs = Math.min(alignedStartMs, startTime.getTime());
    const endMs = endTime.getTime();

    const timePoints = new Set();
    for (let timeMs = startMs; timeMs <= endMs; timeMs += stepMs) {
      timePoints.add(timeMs);
    }

    timePoints.add(now.getTime());
    intakeSeries.forEach((intake) => {
      if (intake.timeMs >= startMs - stepMs && intake.timeMs <= endMs + stepMs) {
        timePoints.add(intake.timeMs);
      }
    });

    const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);

    sortedTimes.forEach((timeMs) => {
      let caffeineLevel = 0;

      intakeSeries.forEach((intake) => {
        const elapsedMs = timeMs - intake.timeMs;

        if (elapsedMs >= 0) {
          const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
          caffeineLevel += remainingAmount;
        }
      });

      data.push({
        time: new Date(timeMs),
        level: Math.round(caffeineLevel)
      });
    });

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

  const desktopHistoryItems = useMemo(
    () => filteredIntakes.slice(0, 6),
    [filteredIntakes]
  );

  const activeRangeLabel = useMemo(() => {
    const option = RANGE_PRESETS.find((preset) => preset.value === rangePreset);
    if (!option || option.value === 'all') {
      return 'all time';
    }
    return option.label;
  }, [rangePreset]);
  
  // Handle adding new caffeine intake
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const openModal = useCallback((type) => {
    setModalType(type);
    setShowModal(true);
  }, []);

  const openAddModal = useCallback(() => {
    if (isDesktop) return;
    openModal('add');
  }, [openModal, isDesktop]);

  const openInfoModal = useCallback(() => {
    openModal('info');
  }, [openModal]);

  const openSettingsModal = useCallback(() => {
    openModal('settings');
  }, [openModal]);


  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const scrollToAddIntake = useCallback(() => {
    addIntakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const openHistoryDrawer = useCallback(() => {
    setShowHistoryDrawer(true);
  }, []);

  const closeHistoryDrawer = useCallback(() => {
    setShowHistoryDrawer(false);
  }, []);

  const handleAddAction = useCallback(() => {
    if (isDesktop) {
      scrollToAddIntake();
      return;
    }
    openAddModal();
  }, [isDesktop, openAddModal, scrollToAddIntake]);

  const goHome = useCallback(() => setActiveScreen('home'), []);
  const goHistory = useCallback(() => setActiveScreen('history'), []);
  const goStats = useCallback(() => setActiveScreen('stats'), []);

  const handleAddIntake = useCallback((intakeData) => {
    const clientId = createClientId();
    const timestamp = intakeData.timestamp || new Date().toISOString();
    const newIntake = {
      id: clientId,
      clientId,
      timestamp,
      ...intakeData
    };

    setCaffeineIntakes((prev) => [newIntake, ...prev]);

    if (cloudSync.addIntake) {
      cloudSync.addIntake({
        clientId,
        name: intakeData.name,
        amount: intakeData.amount,
        category: intakeData.category,
        timestamp
      });
    }

    closeModal();
  }, [closeModal, cloudSync]);
  
  // Handle removing a caffeine intake
  const handleRemoveIntake = useCallback((id) => {
    let removedIntake = null;
    setCaffeineIntakes((prev) => {
      const index = prev.findIndex((intake) => intake.id === id);
      if (index === -1) return prev;
      const removed = prev[index];
      removedIntake = removed;
      setUndoState({ intake: removed, index });
      return prev.filter((intake) => intake.id !== id);
    });
    if (removedIntake?.cloudId && cloudSync.removeIntake) {
      cloudSync.removeIntake({ id: removedIntake.cloudId });
    }
  }, [cloudSync]);

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
    if (cloudSync.addIntake) {
      const clientId = intake.clientId || intake.id || createClientId();
      cloudSync.addIntake({
        clientId,
        name: intake.name,
        amount: intake.amount,
        category: intake.category,
        timestamp: intake.timestamp
      });
    }
    setUndoState(null);
  }, [undoState, cloudSync]);

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
      className={`min-h-screen transition-colors duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900 focus:shadow-lg focus:ring-2 focus:ring-slate-400"
      >
        Skip to main content
      </a>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur ${
        darkMode ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200/70'
      }`}>
        <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 lg:max-w-[1080px] xl:max-w-[1240px] 2xl:max-w-[1320px]">
          <div className="flex items-center">
            <Coffee className={`mr-2 ${darkMode ? 'text-slate-200' : 'text-blue-600'}`} aria-hidden="true" />
            <h1 className="text-xl font-bold">CafTrack</h1>
          </div>
          <div className="flex items-center gap-2">
            <AuthLoading>
              <div
                aria-hidden="true"
                className={`h-9 w-[72px] rounded-full border animate-pulse ${
                  darkMode ? 'border-white/10 bg-white/10' : 'border-slate-200/70 bg-white/70'
                }`}
              />
            </AuthLoading>
            <Authenticated>
              <UserButton afterSignOutUrl="/" />
            </Authenticated>
            <Unauthenticated>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    darkMode
                      ? 'border-white/10 text-slate-100 hover:bg-white/10'
                      : 'border-slate-200/70 text-slate-900 hover:bg-white/70'
                  } ${
                    darkMode
                      ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                      : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                  }`}
                >
                  Log in
                </button>
              </SignInButton>
            </Unauthenticated>
            <BedtimePopover
              sleepTime={settings.sleepTime}
              onSleepTimeChange={handleSleepTimeChange}
              darkMode={darkMode}
              caffeineAtSleep={sleepTimeInfo.caffeineAtSleep}
              targetLevel={settings.targetSleepCaffeine}
              isReadyForSleep={sleepTimeInfo.isReadyForSleep}
            />
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
              } ${
                darkMode
                  ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={openSettingsModal}
              className={`p-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode ? 'border-white/10 hover:bg-white/10' : 'border-slate-200/70 hover:bg-white/70'
              } ${
                darkMode
                  ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
              }`}
              aria-label="Open settings"
            >
              <Settings size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main
        id="main-content"
        tabIndex="-1"
        className="mx-auto w-full px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 space-y-6 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 lg:pt-4 lg:pb-8 lg:space-y-5 lg:max-w-[1080px] xl:max-w-[1240px] 2xl:max-w-[1320px]"
      >
        {!isDesktop && (
          <>
            {/* Home Screen */}
            {activeScreen === 'home' && (
              <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
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
                <div className="sm:sticky sm:top-24 sm:z-10">
                  <RangeSelector
                    title="History Range"
                    value={rangePreset}
                    onChange={setRangePreset}
                    options={RANGE_PRESETS}
                    darkMode={darkMode}
                  />
                </div>
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
                        onClick={handleAddAction} 
                        className={`mt-2 px-4 py-2 rounded-lg ${
                          darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-500 hover:bg-blue-600'
                        } text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          darkMode
                            ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
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
                <div className="sm:sticky sm:top-24 sm:z-10">
                  <RangeSelector
                    title="Metabolism Stats"
                    value={rangePreset}
                    onChange={setRangePreset}
                    options={RANGE_PRESETS}
                    darkMode={darkMode}
                  />
                </div>
                <CaffeineChart 
                  data={chartData} 
                  intakes={caffeineIntakes}
                  caffeineLimit={settings.caffeineLimit}
                  sleepTime={settings.sleepTime}
                  targetSleepCaffeine={settings.targetSleepCaffeine}
                  rangePreset={rangePreset}
                  darkMode={darkMode}
                  onLimitChange={handleCaffeineLimitChange}
                />
              </div>
            )}
          </>
        )}

        {isDesktop && (
          <section aria-label="Desktop dashboard" className="space-y-4">
            <div className="grid gap-4 grid-cols-[minmax(240px,300px)_minmax(420px,1fr)_minmax(280px,320px)] items-start">
              <div className="space-y-4">
                <DesktopSummaryPanel
                  currentLevel={currentCaffeineLevel}
                  caffeineLimit={settings.caffeineLimit}
                  sleepTime={settings.sleepTime}
                  sleepInfo={sleepTimeInfo}
                  targetLevel={settings.targetSleepCaffeine}
                  darkMode={darkMode}
                />
              </div>

              <div className="space-y-4">
                <RangeSelector
                  title="Time Range"
                  value={rangePreset}
                  onChange={setRangePreset}
                  options={RANGE_PRESETS}
                  darkMode={darkMode}
                  size="compact"
                  surface="strong"
                />

                <DesktopPanel
                  title="Intake History"
                  subtitle={`Showing ${activeRangeLabel}`}
                  darkMode={darkMode}
                  bodyClassName="mt-3"
                  action={(
                    <button
                      type="button"
                      onClick={openHistoryDrawer}
                      className={`text-xs font-semibold underline-offset-4 hover:underline ${
                        darkMode ? 'text-slate-200' : 'text-blue-600'
                      }`}
                    >
                      View all
                    </button>
                  )}
                >
                  {caffeineIntakes.length > 0 ? (
                    desktopHistoryItems.length > 0 ? (
                      <div className="space-y-2">
                        {desktopHistoryItems.map((intake) => (
                          <IntakeItem
                            key={intake.id}
                            intake={intake}
                            onRemove={handleRemoveIntake}
                            darkMode={darkMode}
                            compact
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl text-center glass-surface glass-highlight ${
                        darkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        <p className="text-sm font-medium">No entries for this range.</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Try selecting a broader window above.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className={`p-3 rounded-2xl text-center glass-surface glass-highlight ${
                      darkMode ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      <p className="text-sm">No caffeine intake recorded yet.</p>
                      <button
                        type="button"
                        onClick={handleAddAction}
                        className={`mt-2 px-3 py-1.5 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-500 hover:bg-blue-600'
                        } text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          darkMode
                            ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                            : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                        }`}
                      >
                        Add Your First Drink
                      </button>
                    </div>
                  )}
                </DesktopPanel>

                <CaffeineChart 
                  data={chartData} 
                  intakes={caffeineIntakes}
                  caffeineLimit={settings.caffeineLimit}
                  sleepTime={settings.sleepTime}
                  targetSleepCaffeine={settings.targetSleepCaffeine}
                  rangePreset={rangePreset}
                  darkMode={darkMode}
                  onLimitChange={handleCaffeineLimitChange}
                  variant="desktop"
                  showBedtimeLine={false}
                />
              </div>

              <div className="space-y-4" ref={addIntakeRef}>
                <DesktopPanel
                  title="Add Intake"
                  subtitle="Favorites first, search below."
                  darkMode={darkMode}
                  bodyClassName="mt-3"
                >
                  <AddIntakeForm
                    onAdd={handleAddIntake}
                    darkMode={darkMode}
                    alwaysShowCustomForm
                    variant="desktop"
                    showRecent={false}
                  />
                </DesktopPanel>
              </div>
            </div>
          </section>
        )}
      </main>

      {isDesktop && (
        <BottomDrawer
          title="Intake History"
          open={showHistoryDrawer}
          onClose={closeHistoryDrawer}
          darkMode={darkMode}
          heightClass="h-[60vh]"
        >
          <div className="flex items-center justify-between text-xs mb-4">
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
              Range: {activeRangeLabel}
            </span>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
              {filteredIntakes.length} entries
            </span>
          </div>
          {caffeineIntakes.length > 0 ? (
            filteredIntakes.length > 0 ? (
              <div className="space-y-2">
                {filteredIntakes.map((intake) => (
                  <IntakeItem
                    key={intake.id}
                    intake={intake}
                    onRemove={handleRemoveIntake}
                    darkMode={darkMode}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-2xl text-center glass-surface glass-highlight ${
                darkMode ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <p className="font-medium">No entries for this range.</p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Try selecting a broader window above.
                </p>
              </div>
            )
          ) : (
            <div className={`p-4 rounded-2xl text-center glass-surface glass-highlight ${
              darkMode ? 'text-slate-100' : 'text-slate-900'
            }`}>
              <p>No caffeine intake recorded yet.</p>
              <button
                type="button"
                onClick={handleAddAction}
                className={`mt-2 px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                    : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              >
                Add Your First Drink
              </button>
            </div>
          )}
        </BottomDrawer>
      )}
      
      {!isDesktop && (
        <>
          {/* Floating Action Button on mobile */}
          <FloatingActionButton 
            onClick={handleAddAction}
            darkMode={darkMode}
          />
          
          {/* Bottom Navigation */}
          <nav
            aria-label="Primary"
            className={`fixed bottom-0 left-0 right-0 flex justify-around border-t shadow-2xl backdrop-blur pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${
              darkMode ? 'bg-slate-950/80 border-white/10' : 'bg-white/80 border-slate-200/70'
            }`}
          >
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
        </>
      )}

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
                    ? 'bg-slate-700 hover:bg-slate-600 text-white focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
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
                    ? 'border-white/10 hover:bg-white/10 focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                    : 'border-slate-200/70 hover:bg-white/70 focus-visible:ring-blue-500 focus-visible:ring-offset-white'
                }`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'add' && !isDesktop && (
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
              onOpenInfo={openInfoModal}
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
