import React from 'react';
import { CaffeineStatusIndicator } from '../CaffeineStatusIndicator';
import { SleepReadinessIndicator } from '../SleepReadinessIndicator';

export const HomeScreen = ({
  currentCaffeineLevel,
  caffeineLimit,
  chartData,
  sleepTime,
  targetSleepCaffeine,
  darkMode
}) => (
  <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
    <CaffeineStatusIndicator
      currentLevel={currentCaffeineLevel}
      caffeineLimit={caffeineLimit}
      darkMode={darkMode}
    />
    <SleepReadinessIndicator
      chartData={chartData}
      sleepTime={sleepTime}
      targetLevel={targetSleepCaffeine}
      darkMode={darkMode}
    />
  </div>
);
