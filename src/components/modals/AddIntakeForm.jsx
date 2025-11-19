import React, { useState, useEffect } from 'react';
import { Coffee, Plus, Clock, Percent } from 'lucide-react';

// Caffeine database - common drinks and their caffeine content
// Values reference Mayo Clinic's 2024 "Caffeine content for coffee, tea, soda and more"
// and the latest manufacturer nutrition labels for packaged energy drinks.
const caffeineDatabase = {
  coffee: [
    { name: 'Espresso (1 oz)', amount: 64 },
    { name: 'Double Espresso (2 oz)', amount: 128 },
    { name: 'Brewed Coffee (8 oz)', amount: 96 },
    { name: 'Cold Brew (12 oz)', amount: 200 },
    { name: 'Nitro Cold Brew (12 oz)', amount: 235 },
    { name: 'Americano (12 oz)', amount: 154 },
    { name: 'Latte (12 oz)', amount: 128 },
    { name: 'Flat White (8 oz)', amount: 130 }
  ],
  tea: [
    { name: 'Black Tea (8 oz)', amount: 47 },
    { name: 'Green Tea (8 oz)', amount: 28 },
    { name: 'Chai Latte (12 oz)', amount: 70 },
    { name: 'Matcha Latte (12 oz)', amount: 75 },
    { name: 'Earl Grey (8 oz)', amount: 40 },
    { name: 'White Tea (8 oz)', amount: 20 }
  ],
  energyDrinks: [
    { name: 'Red Bull (8.4 oz)', amount: 80 },
    { name: 'Monster Energy (16 oz)', amount: 160 },
    { name: 'Rockstar (16 oz)', amount: 160 },
    { name: 'Bang (16 oz)', amount: 300 },
    { name: 'Celsius (12 oz)', amount: 200 },
    { name: '5-hour Energy (2 oz)', amount: 200 }
  ],
  soda: [
    { name: 'Coca-Cola (12 oz)', amount: 34 },
    { name: 'Diet Coke (12 oz)', amount: 46 },
    { name: 'Pepsi (12 oz)', amount: 38 },
    { name: 'Dr Pepper (12 oz)', amount: 41 },
    { name: 'Mountain Dew (12 oz)', amount: 54 }
  ]
};

export const AddIntakeForm = ({ onAdd, darkMode = false }) => {
  const [activeTab, setActiveTab] = useState('coffee');
  const [customAmount, setCustomAmount] = useState('');
  const [customName, setCustomName] = useState('');
  const [percentage, setPercentage] = useState(100);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [customTime, setCustomTime] = useState(getCurrentTime());
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Function to get current time in HH:MM format
  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Handle selecting a drink from the database
  const handleSelectDrink = (drink) => {
    // For energy drinks, just select the drink and wait for confirmation
    if (activeTab === 'energyDrinks') {
      setSelectedDrink(drink);
      // Reset percentage to 100% when a new drink is selected
      setPercentage(100);
    } else {
      // For other drinks, add immediately
      addDrinkWithCurrentSettings(drink);
    }
  };
  
  // Add the selected drink with current percentage and time settings
  const handleAddSelectedDrink = () => {
    if (selectedDrink) {
      addDrinkWithCurrentSettings(selectedDrink);
      setSelectedDrink(null);
    }
  };
  
  // Common function to add drink with current settings
  const addDrinkWithCurrentSettings = (drink) => {
    const finalAmount = Math.round((drink.amount * percentage) / 100);
    
    let timestamp;
    if (useCustomTime) {
      // Parse custom time
      const [hours, minutes] = customTime.split(':').map(Number);
      const customDate = new Date();
      customDate.setHours(hours, minutes, 0, 0);
      timestamp = customDate.toISOString();
    } else {
      // Use current time
      timestamp = new Date().toISOString();
    }
    
    onAdd({
      name: drink.name + (percentage !== 100 ? ` (${percentage}%)` : ''),
      amount: finalAmount,
      category: activeTab,
      timestamp: timestamp
    });
  };
  
  // Handle adding a custom drink
  const handleAddCustom = (e) => {
    e.preventDefault();
    
    if (!customName.trim() || !customAmount.trim()) {
      return; // Don't submit if fields are empty
    }
    
    let timestamp;
    if (useCustomTime) {
      // Parse custom time
      const [hours, minutes] = customTime.split(':').map(Number);
      const customDate = new Date();
      customDate.setHours(hours, minutes, 0, 0);
      timestamp = customDate.toISOString();
    } else {
      // Use current time
      timestamp = new Date().toISOString();
    }
    
    onAdd({
      name: customName,
      amount: Number(customAmount),
      category: 'custom',
      timestamp: timestamp
    });
    
    // Reset form
    setCustomName('');
    setCustomAmount('');
  };
  
  // Handle percentage change
  const handlePercentageChange = (e) => {
    const value = parseInt(e.target.value);
    setPercentage(value);
  };
  
  // Function to render drink buttons for the active category
  const renderDrinkButtons = () => {
    const drinks = caffeineDatabase[activeTab] || [];
    
    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {drinks.map((drink, index) => (
          <button
            key={index}
            onClick={() => handleSelectDrink(drink)}
            className={`flex justify-between items-center p-3 rounded-lg ${
              selectedDrink && selectedDrink.name === drink.name 
                ? darkMode 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-blue-100 text-blue-800'
                : darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <span className="flex items-center">
              <Coffee className="mr-2" size={16} />
              {drink.name}
            </span>
            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {activeTab === 'energyDrinks' && selectedDrink && selectedDrink.name === drink.name
                ? Math.round((drink.amount * percentage) / 100)
                : drink.amount} mg
            </span>
          </button>
        ))}
      </div>
    );
  };
  
  // Energy drink percentage slider
  const renderPercentageSlider = () => {
    if (activeTab === 'energyDrinks' && selectedDrink) {
      return (
        <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium flex items-center">
              <Percent size={16} className="mr-1" />
              Consumed Percentage
            </span>
            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {percentage}%
            </span>
          </div>
          
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={percentage}
            onChange={handlePercentageChange}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs mt-1">
            <span>10%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleAddSelectedDrink}
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <Plus size={18} className="mr-1" />
              Add {selectedDrink.name} ({percentage}%)
            </button>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Custom time selector
  const renderTimeSelector = () => {
    const now = new Date();
    const nowMinus30 = new Date(now.getTime() - 30 * 60000); // 30 minutes ago
    const nowMinus60 = new Date(now.getTime() - 60 * 60000); // 1 hour ago
    
    // Format time options
    const formatTimeOption = (date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    // Quick time selection options
    const quickTimeOptions = [
      { label: 'Now', value: getCurrentTime(), date: now },
      { label: '30 minutes ago', value: formatTimeOption(nowMinus30), date: nowMinus30 },
      { label: '1 hour ago', value: formatTimeOption(nowMinus60), date: nowMinus60 }
    ];
    
    // Helper to format time for the time input
    function formatTimeString(date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return (
      <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-3 flex items-center">
          <Clock size={18} className="mr-2" />
          When did you have this drink?
        </h3>
        
        {/* Quick time selection buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {quickTimeOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCustomTime(option.value);
                setUseCustomTime(option.label !== 'Now');
              }}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                (!useCustomTime && option.label === 'Now') || 
                (useCustomTime && customTime === option.value)
                  ? darkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : darkMode 
                    ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Custom time selector */}
        <div className="flex items-center">
          <input
            id="useCustomTime"
            type="checkbox"
            checked={useCustomTime}
            onChange={() => setUseCustomTime(!useCustomTime)}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="useCustomTime" className="text-sm mr-3">
            Custom time
          </label>
          
          <input
            type="time"
            value={customTime}
            onChange={(e) => {
              setCustomTime(e.target.value);
              setUseCustomTime(true);
            }}
            className={`flex-1 p-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-600 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Time Selector */}
      {renderTimeSelector()}
      
      {/* Category Tabs */}
      <div className={`flex border-b mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {Object.keys(caffeineDatabase).map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveTab(category);
              setSelectedDrink(null); // Clear selected drink when changing tabs
            }}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === category
                ? darkMode 
                  ? 'border-b-2 border-blue-500 text-blue-500' 
                  : 'border-b-2 border-blue-600 text-blue-600'
                : darkMode 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
            }`}
          >
            {category.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>
      
      {/* Drink Options */}
      {renderDrinkButtons()}
      
      {/* Percentage Slider for Energy Drinks */}
      {renderPercentageSlider()}
      
      {/* Custom Drink Section */}
      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h3 className="font-medium mb-3">Add Custom Drink</h3>
        <form onSubmit={handleAddCustom} className="space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Drink Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., My Special Coffee"
              className={`w-full p-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-600 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              Caffeine Amount (mg)
            </label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g., 100"
              min="1"
              max="1000"
              className={`w-full p-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-600 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            <Plus size={18} className="mr-1" />
            Add Custom Drink
          </button>
        </form>
      </div>
    </div>
  );
}; 