import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Coffee, 
  Plus, 
  Settings, 
  Info, 
  Moon, 
  X, 
  ChevronRight, 
  AlertCircle, 
  AlertTriangle, 
  Check,
  BarChart2,
  History,
  Sun
} from 'lucide-react';

// Placeholder imports - these components will be implemented next
import { Modal } from './modals/Modal';
import { SettingsModal } from './modals/SettingsModal';
import { AddIntakeModal } from './modals/AddIntakeModal';
import { AddIntakeForm } from './modals/AddIntakeForm';
import { InfoModal } from './modals/InfoModal';
import { NavButton } from './NavButton';
import { CaffeineStatusIndicator } from './CaffeineStatusIndicator';
import { SleepReadinessIndicator } from './SleepReadinessIndicator';
import { CaffeineChart } from './CaffeineChart';
import { IntakeItem } from './IntakeItem';

const CaffeineCalculator = () => {
  // State management
  const [activeScreen, setActiveScreen] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [caffeineIntakes, setCaffeineIntakes] = useState([]);
  const [settings, setSettings] = useState({
    metabolismRate: 'average', // fast, average, slow
    caffeineLimit: 400, // in mg
    sleepTime: '22:00', // 24-hour format
    targetSleepCaffeine: 50, // in mg
    pregnancyAdjustment: false,
    smokerAdjustment: false,
    oralContraceptivesAdjustment: false
  });
  
  // Touch handling for swipe navigation
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });
  
  // Constants for calculations
  const HALF_LIFE_MAPPINGS = {
    fast: 4, // hours
    average: 5.5,
    slow: 7.5
  };
  
  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedIntakes = localStorage.getItem('caffeineIntakes');
    const savedSettings = localStorage.getItem('caffeineSettings');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedIntakes) {
      setCaffeineIntakes(JSON.parse(savedIntakes));
    }
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('caffeineIntakes', JSON.stringify(caffeineIntakes));
  }, [caffeineIntakes]);
  
  useEffect(() => {
    localStorage.setItem('caffeineSettings', JSON.stringify(settings));
  }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Calculate current caffeine level based on metabolism and intake history
  const calculateCurrentCaffeineLevel = () => {
    let currentLevel = 0;
    const now = new Date();
    
    // Get base half-life in hours
    let halfLifeHours = HALF_LIFE_MAPPINGS[settings.metabolismRate];
    
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
    const currentLevel = calculateCurrentCaffeineLevel();
    const now = new Date();
    const data = [];
    
    // Calculate base half-life in milliseconds
    let halfLifeHours = HALF_LIFE_MAPPINGS[settings.metabolismRate];
    
    // Apply adjustments
    if (settings.pregnancyAdjustment) halfLifeHours *= 1.5;
    if (settings.smokerAdjustment) halfLifeHours *= 0.7;
    if (settings.oralContraceptivesAdjustment) halfLifeHours *= 1.3;
    
    const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
    const decayConstant = Math.log(2) / halfLifeMs;
    
    // Generate chart points for next 24 hours
    for (let hour = 0; hour <= 24; hour++) {
      const pointTime = new Date(now.getTime() + hour * 60 * 60 * 1000);
      const projectedLevel = currentLevel * Math.exp(-decayConstant * hour * 60 * 60 * 1000);
      
      data.push({
        time: pointTime,
        level: Math.round(projectedLevel)
      });
    }
    
    return data;
  };
  
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(generateChartData, [caffeineIntakes, settings]);
  
  // Current caffeine level
  const currentCaffeineLevel = useMemo(calculateCurrentCaffeineLevel, [caffeineIntakes, settings]);
  
  // Handle adding new caffeine intake
  const handleAddIntake = (intakeData) => {
    const newIntake = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...intakeData
    };
    
    setCaffeineIntakes(prev => [newIntake, ...prev]);
    setShowModal(false);
  };
  
  // Handle removing a caffeine intake
  const handleRemoveIntake = (id) => {
    setCaffeineIntakes(prev => prev.filter(intake => intake.id !== id));
  };
  
  // Handle opening different modal types
  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };
  
  // Handle touch events for swipe navigation
  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };
  
  const handleTouchEnd = (e) => {
    touchEnd.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    // Calculate horizontal swipe distance
    const horizontalDistance = touchEnd.current.x - touchStart.current.x;
    const verticalDistance = Math.abs(touchEnd.current.y - touchStart.current.y);
    
    // Only register as horizontal swipe if horizontal distance is significant
    // and vertical distance is minimal
    if (Math.abs(horizontalDistance) > 50 && verticalDistance < 100) {
      if (horizontalDistance > 0) {
        // Swipe right
        if (activeScreen === 'history') setActiveScreen('home');
        else if (activeScreen === 'stats') setActiveScreen('history');
      } else {
        // Swipe left
        if (activeScreen === 'home') setActiveScreen('history');
        else if (activeScreen === 'history') setActiveScreen('stats');
      }
    }
  };
  
  return (
    <div 
      className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className={`px-4 py-3 flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex items-center">
          <Coffee className="mr-2" />
          <h1 className="text-xl font-bold">CafTrack</h1>
        </div>
        <div className="flex">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => openModal('info')} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={() => openModal('settings')} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-xl mx-auto p-4">
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
            
            {/* Quick Add Button */}
            <button 
              onClick={() => openModal('add')} 
              className={`fixed bottom-20 right-4 z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Plus size={24} color="white" />
            </button>
          </div>
        )}
        
        {/* History Screen */}
        {activeScreen === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Intake History</h2>
            {caffeineIntakes.length > 0 ? (
              <div className="space-y-2">
                {caffeineIntakes.map(intake => (
                  <IntakeItem 
                    key={intake.id} 
                    intake={intake} 
                    onRemove={handleRemoveIntake}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p>No caffeine intake recorded yet.</p>
                <button 
                  onClick={() => openModal('add')} 
                  className={`mt-2 px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  Add Your First Drink
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Stats Screen */}
        {activeScreen === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Caffeine Levels</h2>
            <CaffeineChart 
              data={chartData} 
              caffeineLimit={settings.caffeineLimit}
              sleepTime={settings.sleepTime}
              targetSleepCaffeine={settings.targetSleepCaffeine}
              darkMode={darkMode}
            />
          </div>
        )}
      </main>
      
      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 flex justify-around py-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-top`}>
        <NavButton 
          icon={<Coffee size={20} />} 
          label="Home" 
          active={activeScreen === 'home'} 
          onClick={() => setActiveScreen('home')}
          darkMode={darkMode}
        />
        <NavButton 
          icon={<History size={20} />} 
          label="History" 
          active={activeScreen === 'history'} 
          onClick={() => setActiveScreen('history')}
          darkMode={darkMode}
        />
        <NavButton 
          icon={<BarChart2 size={20} />} 
          label="Stats" 
          active={activeScreen === 'stats'} 
          onClick={() => setActiveScreen('stats')}
          darkMode={darkMode}
        />
      </nav>
      
      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'add' && (
            <AddIntakeModal onClose={() => setShowModal(false)}>
              <AddIntakeForm onAdd={handleAddIntake} />
            </AddIntakeModal>
          )}
          
          {modalType === 'settings' && (
            <SettingsModal 
              settings={settings} 
              onSave={setSettings} 
              onClose={() => setShowModal(false)}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
          
          {modalType === 'info' && (
            <InfoModal onClose={() => setShowModal(false)} darkMode={darkMode} />
          )}
        </>
      )}
    </div>
  );
};

export default CaffeineCalculator; 