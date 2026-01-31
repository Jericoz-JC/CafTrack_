import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coffee, Settings, Moon, X, Sun } from 'lucide-react';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

import { AddIntakeForm } from './modals/AddIntakeForm';
import { CaffeineChart } from './CaffeineChart';
import { IntakeItem } from './IntakeItem';
import { RangeSelector } from './RangeSelector';
import { BedtimePopover } from './BedtimePopover';
import { BottomDrawer } from './modals/BottomDrawer';
import { MobileNavigation } from './MobileNavigation';
import { DesktopPanel, DesktopSummaryPanel } from './desktop';
import { HomeScreen, HistoryScreen, StatsScreen } from './screens';
import { RANGE_PRESETS, DEFAULT_RANGE_PRESET, getRangeDurationMs } from '../constants/rangePresets';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useCloudSync } from '../hooks/useCloudSync';
import { useCaffeineState } from '../hooks/useCaffeineState';
import { useCaffeineCalculations } from '../hooks/useCaffeineCalculations';
import { useUndoState } from '../hooks/useUndoState';

const SettingsModal = lazy(() => import('./modals/SettingsModal').then(m => ({ default: m.SettingsModal })));
const AddIntakeModal = lazy(() => import('./modals/AddIntakeModal').then(m => ({ default: m.AddIntakeModal })));
const InfoModal = lazy(() => import('./modals/InfoModal').then(m => ({ default: m.InfoModal })));
const SCREEN_QUERY_KEY = 'tab';
const cloudAuthEnabled = Boolean(
  process.env.REACT_APP_CONVEX_URL &&
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY &&
  process.env.NODE_ENV !== 'test'
);

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


const CaffeineCalculator = () => {
  // State management
  const [activeScreen, setActiveScreen] = useState(getInitialScreen);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [rangePreset, setRangePreset] = useState(DEFAULT_RANGE_PRESET);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const addIntakeRef = useRef(null);

  const {
    intakes: caffeineIntakes,
    settings,
    darkMode,
    hydrated,
    setIntakes: setCaffeineIntakes,
    setSettings,
    setDarkMode,
    addIntake,
    removeIntake,
    restoreIntake,
    updateSettings
  } = useCaffeineState();
  
  const cloudSync = useCloudSync({
    localIntakes: caffeineIntakes,
    localSettings: settings,
    darkMode,
    setIntakes: setCaffeineIntakes,
    setSettings,
    setDarkMode,
    isLocalReady: hydrated
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set(SCREEN_QUERY_KEY, activeScreen);
    window.history.replaceState({}, '', url);
  }, [activeScreen]);

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
  
  const { chartData, currentCaffeineLevel, sleepTimeInfo } = useCaffeineCalculations(
    caffeineIntakes,
    settings
  );

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
  }, [setDarkMode]);

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

  const handleNavigate = useCallback((screen) => {
    setActiveScreen(screen);
  }, []);

  const handleCloudError = useCallback((error) => {
    console.error('Cloud sync failed', error);
  }, []);

  const handleUndoRestore = useCallback((payload) => {
    if (!payload?.intake) return;
    const restored = restoreIntake(payload.intake, payload.index);
    if (restored && cloudSync.upsertIntake) {
      cloudSync.upsertIntake({
        clientId: restored.clientId || restored.id,
        name: restored.name,
        amount: restored.amount,
        category: restored.category,
        timestamp: restored.timestamp,
        updatedAt: restored.updatedAt
      }).catch(handleCloudError);
    }
  }, [cloudSync, handleCloudError, restoreIntake]);

  const { undoState, setUndoState, handleUndo, dismissUndo } = useUndoState({
    onUndo: handleUndoRestore
  });

  const handleAddIntake = useCallback((intakeData) => {
    const newIntake = addIntake(intakeData);
    if (newIntake && cloudSync.upsertIntake) {
      cloudSync.upsertIntake({
        clientId: newIntake.clientId || newIntake.id,
        name: newIntake.name,
        amount: newIntake.amount,
        category: newIntake.category,
        timestamp: newIntake.timestamp,
        updatedAt: newIntake.updatedAt
      }).catch(handleCloudError);
    }
    closeModal();
  }, [addIntake, closeModal, cloudSync, handleCloudError]);
  
  // Handle removing a caffeine intake
  const handleRemoveIntake = useCallback((id) => {
    const removed = removeIntake(id);
    if (!removed?.intake) return;
    setUndoState(removed);
    if (removed.intake.cloudId && cloudSync.removeIntake) {
      cloudSync.removeIntake({ id: removed.intake.cloudId }).catch(handleCloudError);
    }
  }, [cloudSync, handleCloudError, removeIntake, setUndoState]);


  const handleSleepTimeChange = useCallback((nextSleepTime) => {
    updateSettings({ sleepTime: nextSleepTime });
  }, [updateSettings]);

  const handleCaffeineLimitChange = useCallback((nextLimit) => {
    updateSettings({ caffeineLimit: nextLimit });
  }, [updateSettings]);
  
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
            {cloudAuthEnabled && (
              <>
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
              </>
            )}
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
            {activeScreen === 'home' && (
              <HomeScreen
                currentCaffeineLevel={currentCaffeineLevel}
                caffeineLimit={settings.caffeineLimit}
                chartData={chartData}
                sleepTime={settings.sleepTime}
                targetSleepCaffeine={settings.targetSleepCaffeine}
                darkMode={darkMode}
              />
            )}
            {activeScreen === 'history' && (
              <HistoryScreen
                intakes={caffeineIntakes}
                filteredIntakes={filteredIntakes}
                rangePreset={rangePreset}
                onRangeChange={setRangePreset}
                onRemoveIntake={handleRemoveIntake}
                onAddAction={handleAddAction}
                darkMode={darkMode}
              />
            )}
            {activeScreen === 'stats' && (
              <StatsScreen
                chartData={chartData}
                intakes={caffeineIntakes}
                caffeineLimit={settings.caffeineLimit}
                sleepTime={settings.sleepTime}
                targetSleepCaffeine={settings.targetSleepCaffeine}
                rangePreset={rangePreset}
                onRangeChange={setRangePreset}
                onLimitChange={handleCaffeineLimitChange}
                darkMode={darkMode}
              />
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
        <MobileNavigation
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          onAddClick={handleAddAction}
          darkMode={darkMode}
        />
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
                onClick={handleUndo}
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
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
};

export default CaffeineCalculator; 
