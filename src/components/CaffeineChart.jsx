import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const CaffeineChart = ({ 
  data, 
  caffeineLimit, 
  sleepTime, 
  targetSleepCaffeine,
  darkMode = false 
}) => {
  // Parse sleep time to create a reference line
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);
  
  // Create a date object for today's sleep time
  const today = new Date();
  const sleepTimeDate = new Date(today);
  sleepTimeDate.setHours(sleepHour, sleepMinute, 0, 0);
  
  // If sleep time is in the past for today, use tomorrow's date
  if (sleepTimeDate < today) {
    sleepTimeDate.setDate(sleepTimeDate.getDate() + 1);
  }
  
  // Format time for x-axis
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedTime = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return (
        <div className={`p-2 rounded shadow-md ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <p className="font-medium">{formattedTime}</p>
          <p className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {`Caffeine: ${payload[0].value} mg`}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={darkMode ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              stroke={darkMode ? '#9ca3af' : '#6b7280'} 
            />
            <YAxis 
              stroke={darkMode ? '#9ca3af' : '#6b7280'} 
              domain={[0, Math.max(caffeineLimit * 1.2, 100)]} 
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Caffeine limit reference line */}
            <ReferenceLine 
              y={caffeineLimit} 
              stroke={darkMode ? '#ef4444' : '#dc2626'} 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Limit', 
                position: 'right',
                fill: darkMode ? '#ef4444' : '#dc2626'
              }} 
            />
            
            {/* Sleep time reference line */}
            <ReferenceLine 
              x={sleepTimeDate} 
              stroke={darkMode ? '#8b5cf6' : '#7c3aed'} 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Sleep', 
                position: 'top',
                fill: darkMode ? '#8b5cf6' : '#7c3aed'
              }} 
            />
            
            {/* Target sleep caffeine level */}
            <ReferenceLine 
              y={targetSleepCaffeine} 
              stroke={darkMode ? '#10b981' : '#059669'} 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Sleep Target', 
                position: 'left',
                fill: darkMode ? '#10b981' : '#059669'
              }} 
            />
            
            <Line
              type="monotone"
              dataKey="level"
              stroke={darkMode ? '#3b82f6' : '#2563eb'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs">
        <div className="flex items-center mb-1">
          <div className={`w-3 h-3 rounded-full mr-1 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Caffeine Level</span>
        </div>
        <div className="flex items-center mb-1">
          <div className={`w-3 h-3 rounded-full mr-1 ${darkMode ? 'bg-red-500' : 'bg-red-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Daily Limit ({caffeineLimit} mg)</span>
        </div>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Sleep Target ({targetSleepCaffeine} mg)</span>
        </div>
      </div>
    </div>
  );
};

// Generate data for caffeine chart over time
const generateChartData = () => {
  // Start with current caffeine level
  const now = new Date();
  const data = [];
  
  // Sort intakes by timestamp
  const sortedIntakes = [...caffeineIntakes].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Calculate base half-life in milliseconds
  let halfLifeHours = HALF_LIFE_MAPPINGS[settings.metabolismRate];
  
  // Apply adjustments
  if (settings.pregnancyAdjustment) halfLifeHours *= 1.5;
  if (settings.smokerAdjustment) halfLifeHours *= 0.7;
  if (settings.oralContraceptivesAdjustment) halfLifeHours *= 1.3;
  
  const halfLifeMs = halfLifeHours * 60 * 60 * 1000;
  const decayConstant = Math.log(2) / halfLifeMs;
  
  // Find earliest intake time or 12 hours ago, whichever is earlier
  let startTime = new Date(now.getTime() - (12 * 60 * 60 * 1000)); // 12 hours ago
  if (sortedIntakes.length > 0) {
    const earliestIntake = new Date(sortedIntakes[0].timestamp);
    if (earliestIntake < startTime) {
      startTime = earliestIntake;
    }
  }
  
  // Create data points from start time to 24 hours in the future
  const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  
  // Add data points for every hour from start to end
  for (let time = new Date(startTime); time <= endTime; time = new Date(time.getTime() + 60 * 60 * 1000)) {
    let caffeineLevel = 0;
    
    // Calculate contribution of each intake to this time point
    sortedIntakes.forEach(intake => {
      const intakeTime = new Date(intake.timestamp);
      const elapsedMs = time - intakeTime;
      
      // Only count if intake was in the past relative to this time point
      if (elapsedMs > 0) {
        // Calculate remaining amount using exponential decay formula
        const remainingAmount = intake.amount * Math.exp(-decayConstant * elapsedMs);
        caffeineLevel += remainingAmount;
      }
    });
    
    data.push({
      time: time,
      level: Math.round(caffeineLevel)
    });
  }
  
  return data;
}; 