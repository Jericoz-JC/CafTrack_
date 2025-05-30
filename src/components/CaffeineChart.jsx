import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { Coffee, BarChart2, Grid3X3, Eye, EyeOff } from 'lucide-react';

export const CaffeineChart = ({ 
  data, 
  caffeineLimit, 
  sleepTime, 
  targetSleepCaffeine,
  darkMode = false 
}) => {
  const [chartType, setChartType] = useState('line'); // 'line', 'area', or 'smooth'
  const [showGrid, setShowGrid] = useState(true);
  const [timeRange, setTimeRange] = useState('24hr'); // '12hr', '24hr', 'all'

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

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffTime;
    
    switch (timeRange) {
      case '12hr':
        cutoffTime = new Date(now.getTime() - (12 * 60 * 60 * 1000));
        break;
      case '24hr':
        cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      default: // 'all'
        return data;
    }
    
    return data.filter(point => new Date(point.time) >= cutoffTime);
  }, [data, timeRange]);

  // Calculate current caffeine level (fixed calculation)
  const currentCaffeineLevel = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    
    // Get the most recent data point
    const sortedData = [...filteredData].sort((a, b) => new Date(a.time) - new Date(b.time));
    const mostRecent = sortedData[sortedData.length - 1];
    
    return Math.round(mostRecent?.level || 0);
  }, [filteredData]);

  // Calculate peak level for today
  const peakLevel = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return 0;
    
    const levels = filteredData.map(d => d.level);
    return Math.round(Math.max(...levels));
  }, [filteredData]);

  // Find peaks for hover highlighting only
  const peaks = useMemo(() => {
    if (!filteredData || filteredData.length < 3) return [];
    
    const peakPoints = [];
    for (let i = 1; i < filteredData.length - 1; i++) {
      const prev = filteredData[i - 1].level;
      const current = filteredData[i].level;
      const next = filteredData[i + 1].level;
      
      // Detect significant increases (likely intake moments)
      if (current > prev + 20 && current > next + 10) {
        peakPoints.push({
          time: filteredData[i].time,
          level: current,
          index: i
        });
      }
    }
    return peakPoints;
  }, [filteredData]);

  // Format time for x-axis with mobile-friendly formatting
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Enhanced tooltip with peak highlighting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const level = payload[0].value;
      const formattedTime = date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      // Check if this is a peak
      const isPeak = peaks.some(peak => 
        Math.abs(new Date(peak.time).getTime() - date.getTime()) < 60000 // Within 1 minute
      );
      
      // Determine status
      const percentage = (level / caffeineLimit) * 100;
      let status = { text: 'Low', color: 'text-green-500' };
      if (percentage >= 80) status = { text: 'High', color: 'text-red-500' };
      else if (percentage >= 50) status = { text: 'Moderate', color: 'text-yellow-500' };

      return (
        <div className={`p-3 rounded-lg shadow-lg border max-w-xs ${
          darkMode 
            ? 'bg-gray-800 text-white border-gray-600' 
            : 'bg-white text-gray-900 border-gray-200'
        }`}>
          <p className="font-medium text-sm mb-1">{formattedTime}</p>
          <div className="flex items-center gap-2 mb-1">
            <Coffee size={14} className="text-blue-500" />
            <span className="font-bold text-lg">{Math.round(level)} mg</span>
            <span className={`text-xs font-medium ${status.color}`}>({status.text})</span>
          </div>
          {isPeak && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              ☕ Intake detected
            </div>
          )}
          <div className="text-xs opacity-75">
            {Math.round((level / caffeineLimit) * 100)}% of daily limit
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Chart component selection
  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const lineType = chartType === 'smooth' ? 'monotone' : 'linear';

  return (
    <div className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      {/* Mobile-first header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
            <BarChart2 size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            Caffeine Levels
          </h2>
          
          {/* Current and Peak display */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Current:</span>
              <span className="font-semibold text-lg">{currentCaffeineLevel} mg</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Peak:</span>
              <span className="font-semibold">{peakLevel} mg</span>
            </div>
          </div>
        </div>
        
        {/* Mobile-first controls */}
        <div className="flex flex-col gap-3">
          {/* Time Range Controls */}
          <div className="flex flex-col gap-2">
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Time Range
            </span>
            <div className="flex gap-1">
              {['12hr', '24hr', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                    timeRange === range
                      ? darkMode ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-500 text-white shadow-md'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Style Controls (including grid) */}
          <div className="flex flex-col gap-2">
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Chart Style
            </span>
            <div className="flex gap-1">
              {/* Chart Type Buttons */}
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-all ${
                  chartType === 'line'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Line chart"
              >
                <BarChart2 size={14} />
              </button>
              
              <button
                onClick={() => setChartType('area')}
                className={`p-2 rounded-md transition-all ${
                  chartType === 'area'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Area chart"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v2H3v-2zm0-12l4 4 4-4 6 6v6H3V6z"/>
                </svg>
              </button>
              
              <button
                onClick={() => setChartType('smooth')}
                className={`p-2 rounded-md transition-all ${
                  chartType === 'smooth'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Smooth chart"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12s4-8 8-8 8 8 8 8"/>
                </svg>
              </button>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-md transition-all ${
                  showGrid
                    ? darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle grid"
              >
                {showGrid ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart - mobile responsive height */}
      <div className="h-64 sm:h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke={darkMode ? '#374151' : '#e5e7eb'} 
                opacity={0.5}
              />
            )}
            
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              stroke={darkMode ? '#9ca3af' : '#6b7280'} 
              domain={[0, Math.max(caffeineLimit * 1.2, 100)]}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines without labels */}
            <ReferenceLine 
              y={caffeineLimit} 
              stroke={darkMode ? '#ef4444' : '#dc2626'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            <ReferenceLine 
              x={sleepTimeDate} 
              stroke={darkMode ? '#8b5cf6' : '#7c3aed'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            <ReferenceLine 
              y={targetSleepCaffeine} 
              stroke={darkMode ? '#10b981' : '#059669'} 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
            />
            
            {chartType === 'area' ? (
              <Area
                type={lineType}
                dataKey="level"
                stroke={darkMode ? '#3b82f6' : '#2563eb'}
                fill={darkMode ? '#3b82f6' : '#2563eb'}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: darkMode ? '#60a5fa' : '#3b82f6',
                  stroke: darkMode ? '#1e40af' : '#1d4ed8',
                  strokeWidth: 2
                }}
              />
            ) : (
              <Line
                type={lineType}
                dataKey="level"
                stroke={darkMode ? '#3b82f6' : '#2563eb'}
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: darkMode ? '#60a5fa' : '#3b82f6',
                  stroke: darkMode ? '#1e40af' : '#1d4ed8',
                  strokeWidth: 2
                }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
      
      {/* Mobile-friendly legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Caffeine Level</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-red-500' : 'border-red-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Daily Limit ({caffeineLimit}mg)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-4 h-0.5 border-dashed border-2 ${darkMode ? 'border-green-500' : 'border-green-600'}`} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Sleep Target ({targetSleepCaffeine}mg)</span>
        </div>
      </div>
    </div>
  );
}; 