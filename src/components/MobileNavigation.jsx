import React from 'react';
import { Coffee, Plus, History, BarChart2 } from 'lucide-react';
import { NavButton } from './NavButton';

export const FloatingActionButton = ({ onClick, darkMode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-105 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      darkMode ? 'bg-blue-600 hover:bg-blue-500 ring-1 ring-blue-400/30' : 'bg-blue-500 hover:bg-blue-600 ring-1 ring-blue-200'
    } ${
      darkMode
        ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
        : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
    }`}
    aria-label="Add caffeine intake"
  >
    <Plus size={24} color="white" aria-hidden="true" />
  </button>
);

export const BottomNavigation = ({
  activeScreen,
  onNavigate,
  darkMode
}) => (
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
      onClick={() => onNavigate('home')}
      darkMode={darkMode}
    />
    <NavButton
      icon={<History size={20} />}
      label="History"
      active={activeScreen === 'history'}
      onClick={() => onNavigate('history')}
      darkMode={darkMode}
    />
    <NavButton
      icon={<BarChart2 size={20} />}
      label="Stats"
      active={activeScreen === 'stats'}
      onClick={() => onNavigate('stats')}
      darkMode={darkMode}
    />
  </nav>
);

export const MobileNavigation = ({
  activeScreen,
  onNavigate,
  onAddClick,
  darkMode
}) => (
  <>
    <FloatingActionButton onClick={onAddClick} darkMode={darkMode} />
    <BottomNavigation
      activeScreen={activeScreen}
      onNavigate={onNavigate}
      darkMode={darkMode}
    />
  </>
);
