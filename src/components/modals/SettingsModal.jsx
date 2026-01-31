import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Modal } from './Modal';

export const SettingsModal = ({
  settings,
  onSave,
  onClose,
  darkMode,
  onToggleDarkMode,
  onOpenInfo
}) => {
  const [formData, setFormData] = useState({
    metabolismRate: settings.metabolismRate,
    caffeineLimit: settings.caffeineLimit,
    targetSleepCaffeine: settings.targetSleepCaffeine,
    pregnancyAdjustment: settings.pregnancyAdjustment,
    smokerAdjustment: settings.smokerAdjustment,
    oralContraceptivesAdjustment: settings.oralContraceptivesAdjustment
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Use the checked property for checkboxes, otherwise use value
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert string values to numbers where needed
    // Preserve sleepTime from original settings (now managed via header popover)
    const processedData = {
      ...formData,
      sleepTime: settings.sleepTime,
      caffeineLimit: Number(formData.caffeineLimit),
      targetSleepCaffeine: Number(formData.targetSleepCaffeine)
    };

    onSave(processedData);
    onClose();
  };
  
  return (
    <Modal title="Settings" onClose={onClose} darkMode={darkMode}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Metabolism Rate */}
        <div>
          <label htmlFor="metabolism-rate" className="block mb-2 font-medium">Metabolism Rate</label>
          <select
            id="metabolism-rate"
            name="metabolismRate"
            value={formData.metabolismRate}
            onChange={handleChange}
            className={`w-full p-2 rounded-lg border ${
              darkMode
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white/80 border-slate-200/80 text-slate-900'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          >
            <option value="fast">Fast (4 hours)</option>
            <option value="average">Average (5.5 hours)</option>
            <option value="slow">Slow (7.5 hours)</option>
          </select>
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            How quickly your body metabolizes caffeine
          </p>
        </div>
        
        {/* Caffeine Limit */}
        <div>
          <label htmlFor="caffeine-limit" className="block mb-2 font-medium">
            Daily Caffeine Limit (mg)
          </label>
          <input
            type="number"
            id="caffeine-limit"
            name="caffeineLimit"
            autoComplete="off"
            inputMode="numeric"
            value={formData.caffeineLimit}
            onChange={handleChange}
            min="100"
            max="1000"
            step="50"
            className={`w-full p-2 rounded-lg border tabular-nums ${
              darkMode
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white/80 border-slate-200/80 text-slate-900'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          />
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Default: 200mg
          </p>
        </div>
        
        {/* Target Sleep Caffeine Level */}
        <div>
          <label htmlFor="target-sleep-caffeine" className="block mb-2 font-medium">
            Target Sleep Caffeine Level (mg)
          </label>
          <input
            type="number"
            id="target-sleep-caffeine"
            name="targetSleepCaffeine"
            autoComplete="off"
            inputMode="numeric"
            value={formData.targetSleepCaffeine}
            onChange={handleChange}
            min="0"
            max="200"
            step="5"
            className={`w-full p-2 rounded-lg border tabular-nums ${
              darkMode
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white/80 border-slate-200/80 text-slate-900'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          />
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Recommended: 30mg or less for quality sleep
          </p>
        </div>
        
        {/* Adjustments Section */}
        <div className={`p-4 rounded-2xl glass-surface glass-highlight ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <h3 className="font-medium mb-3">Special Conditions</h3>
          
          {/* Pregnancy */}
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="pregnancyAdjustment"
              name="pregnancyAdjustment"
              checked={formData.pregnancyAdjustment}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>Pregnancy (slower metabolism)</span>
          </label>
          
          {/* Smoker */}
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="smokerAdjustment"
              name="smokerAdjustment"
              checked={formData.smokerAdjustment}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>Smoker (faster metabolism)</span>
          </label>
          
          {/* Oral Contraceptives */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              id="oralContraceptivesAdjustment"
              name="oralContraceptivesAdjustment"
              checked={formData.oralContraceptivesAdjustment}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>Oral contraceptives (slower metabolism)</span>
          </label>
        </div>
        
        {/* Dark Mode Toggle */}
        <div className={`p-4 rounded-2xl glass-surface glass-highlight ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <h3 className="font-medium mb-3">Appearance</h3>
          <div className="flex justify-between items-center">
            <span>Dark Mode</span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-white/80 text-slate-900'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                darkMode
                  ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                  : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
              }`}
            >
              {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-2xl glass-surface glass-highlight ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <h3 className="font-medium mb-2">About Caffeine</h3>
          <button
            type="button"
            onClick={() => onOpenInfo?.()}
            className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'border-white/10 text-slate-100 hover:bg-white/10'
                : 'border-slate-200/70 text-slate-900 hover:bg-white/70'
            } ${
              darkMode
                ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          >
            Click here to learn more about caffeine
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              darkMode
                ? 'focus-visible:ring-white/30 focus-visible:ring-offset-slate-950'
                : 'focus-visible:ring-blue-500 focus-visible:ring-offset-white'
            }`}
          >
            Save Settings
          </button>
        </div>
      </form>
    </Modal>
  );
}; 
