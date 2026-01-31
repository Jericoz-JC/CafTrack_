import React from 'react';
import { RangeSelector } from '../RangeSelector';
import { IntakeItem } from '../IntakeItem';
import { RANGE_PRESETS } from '../../constants/rangePresets';

export const HistoryScreen = ({
  intakes,
  filteredIntakes,
  rangePreset,
  onRangeChange,
  onRemoveIntake,
  onAddAction,
  darkMode
}) => (
  <div className="space-y-4">
    <div className="sm:sticky sm:top-24 sm:z-10">
      <RangeSelector
        title="History Range"
        value={rangePreset}
        onChange={onRangeChange}
        options={RANGE_PRESETS}
        darkMode={darkMode}
      />
    </div>
    <div>
      <h2 className="text-xl font-bold mb-4">Intake History</h2>
      {intakes.length > 0 ? (
        filteredIntakes.length > 0 ? (
          <div className="space-y-2">
            {filteredIntakes.map(intake => (
              <IntakeItem
                key={intake.id}
                intake={intake}
                onRemove={onRemoveIntake}
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
            type="button"
            onClick={onAddAction}
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
);
