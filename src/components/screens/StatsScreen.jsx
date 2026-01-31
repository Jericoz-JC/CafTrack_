import React from 'react';
import { RangeSelector } from '../RangeSelector';
import { CaffeineChart } from '../CaffeineChart';
import { RANGE_PRESETS } from '../../constants/rangePresets';

export const StatsScreen = ({
  chartData,
  intakes,
  caffeineLimit,
  sleepTime,
  targetSleepCaffeine,
  rangePreset,
  onRangeChange,
  onLimitChange,
  darkMode
}) => (
  <div className="space-y-4">
    <div className="sm:sticky sm:top-24 sm:z-10">
      <RangeSelector
        title="Metabolism Stats"
        value={rangePreset}
        onChange={onRangeChange}
        options={RANGE_PRESETS}
        darkMode={darkMode}
      />
    </div>
    <CaffeineChart
      data={chartData}
      intakes={intakes}
      caffeineLimit={caffeineLimit}
      sleepTime={sleepTime}
      targetSleepCaffeine={targetSleepCaffeine}
      rangePreset={rangePreset}
      darkMode={darkMode}
      onLimitChange={onLimitChange}
    />
  </div>
);
