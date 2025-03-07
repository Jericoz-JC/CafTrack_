import React, { useState } from 'react';
import { Coffee, Plus } from 'lucide-react';

// Caffeine database - common drinks and their caffeine content
const caffeineDatabase = {
  coffee: [
    { name: 'Espresso (1 shot)', amount: 63 },
    { name: 'Brewed Coffee (8 oz)', amount: 95 },
    { name: 'Cold Brew (12 oz)', amount: 155 },
    { name: 'Latte (12 oz)', amount: 63 },
    { name: 'Cappuccino (12 oz)', amount: 63 },
    { name: 'Americano (12 oz)', amount: 77 },
    { name: 'Flat White (12 oz)', amount: 130 }
  ],
  tea: [
    { name: 'Black Tea (8 oz)', amount: 47 },
    { name: 'Green Tea (8 oz)', amount: 28 },
    { name: 'Chai Latte (12 oz)', amount: 50 },
    { name: 'Matcha Latte (12 oz)', amount: 55 },
    { name: 'Earl Grey (8 oz)', amount: 40 },
    { name: 'White Tea (8 oz)', amount: 15 }
  ],
  energyDrinks: [
    { name: 'Red Bull (8.4 oz)', amount: 80 },
    { name: 'Monster (16 oz)', amount: 160 },
    { name: 'Rockstar (16 oz)', amount: 160 },
    { name: 'Bang (16 oz)', amount: 300 },
    { name: '5-Hour Energy (2 oz)', amount: 200 }
  ],
  soda: [
    { name: 'Coca-Cola (12 oz)', amount: 34 },
    { name: 'Diet Coke (12 oz)', amount: 46 },
    { name: 'Pepsi (12 oz)', amount: 38 },
    { name: 'Dr Pepper (12 oz)', amount: 41 },
    { name: 'Mountain Dew (12 oz)', amount: 55 }
  ]
};

export const AddIntakeForm = ({ onAdd, darkMode = false }) => {
  const [activeTab, setActiveTab] = useState('coffee');
  const [customAmount, setCustomAmount] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Handle selecting a drink from the database
  const handleSelectDrink = (drink) => {
    onAdd({
      name: drink.name,
      amount: drink.amount,
      category: activeTab
    });
  };
  
  // Handle adding a custom drink
  const handleAddCustom = (e) => {
    e.preventDefault();
    
    if (!customName.trim() || !customAmount.trim()) {
      return; // Don't submit if fields are empty
    }
    
    onAdd({
      name: customName,
      amount: Number(customAmount),
      category: 'custom'
    });
    
    // Reset form
    setCustomName('');
    setCustomAmount('');
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
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <span className="flex items-center">
              <Coffee className="mr-2" size={16} />
              {drink.name}
            </span>
            <span className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {drink.amount} mg
            </span>
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div>
      {/* Category Tabs */}
      <div className={`flex border-b mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {Object.keys(caffeineDatabase).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
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