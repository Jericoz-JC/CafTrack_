import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Modal } from './Modal';

export const SettingsModal = ({ settings, onSave, onClose, darkMode, onToggleDarkMode }) => {
  const [formData, setFormData] = useState({
    metabolismRate: settings.metabolismRate,
    caffeineLimit: settings.caffeineLimit,
    sleepTime: settings.sleepTime,
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
    const processedData = {
      ...formData,
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
          <label className="block mb-2 font-medium">Metabolism Rate</label>
          <select
            name="metabolismRate"
            value={formData.metabolismRate}
            onChange={handleChange}
            className={`w-full p-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="fast">Fast (4 hours)</option>
            <option value="average">Average (5.5 hours)</option>
            <option value="slow">Slow (7.5 hours)</option>
          </select>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            How quickly your body metabolizes caffeine
          </p>
        </div>
        
        {/* Caffeine Limit */}
        <div>
          <label className="block mb-2 font-medium">
            Daily Caffeine Limit (mg)
          </label>
          <input
            type="number"
            name="caffeineLimit"
            value={formData.caffeineLimit}
            onChange={handleChange}
            min="100"
            max="1000"
            step="50"
            className={`w-full p-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Recommended: 400mg for healthy adults
          </p>
        </div>
        
        {/* Sleep Time */}
        <div>
          <label className="block mb-2 font-medium">
            Target Sleep Time
          </label>
          <input
            type="time"
            name="sleepTime"
            value={formData.sleepTime}
            onChange={handleChange}
            className={`w-full p-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        {/* Target Sleep Caffeine Level */}
        <div>
          <label className="block mb-2 font-medium">
            Target Sleep Caffeine Level (mg)
          </label>
          <input
            type="number"
            name="targetSleepCaffeine"
            value={formData.targetSleepCaffeine}
            onChange={handleChange}
            min="0"
            max="200"
            step="5"
            className={`w-full p-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Recommended: 30mg or less for quality sleep
          </p>
        </div>
        
        {/* Adjustments Section */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-medium mb-3">Special Conditions</h3>
          
          {/* Pregnancy */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="pregnancyAdjustment"
              name="pregnancyAdjustment"
              checked={formData.pregnancyAdjustment}
              onChange={handleChange}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="pregnancyAdjustment">
              Pregnancy (slower metabolism)
            </label>
          </div>
          
          {/* Smoker */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="smokerAdjustment"
              name="smokerAdjustment"
              checked={formData.smokerAdjustment}
              onChange={handleChange}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="smokerAdjustment">
              Smoker (faster metabolism)
            </label>
          </div>
          
          {/* Oral Contraceptives */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="oralContraceptivesAdjustment"
              name="oralContraceptivesAdjustment"
              checked={formData.oralContraceptivesAdjustment}
              onChange={handleChange}
              className="mr-2 h-4 w-4"
            />
            <label htmlFor="oralContraceptivesAdjustment">
              Oral contraceptives (slower metabolism)
            </label>
          </div>
        </div>
        
        {/* Dark Mode Toggle */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="font-medium mb-3">Appearance</h3>
          <div className="flex justify-between items-center">
            <span>Dark Mode</span>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            Save Settings
          </button>
        </div>
      </form>
    </Modal>
  );
}; 